/**
 * categorizeTransactions.ts
 *
 * Narration-only categorization with a persistent cross-statement cache.
 *
 * Flow:
 *  1. Determine CREDIT/DEBIT type per row (which amount column is non-null).
 *  2. Normalize each narration into a stable cache key.
 *  3. Deduplicate unique keys across the whole batch.
 *  4. Check the DB cache (transaction_category_cache).
 *  5. Send only uncached narrations to Gemini in ≤200-item batches.
 *     Uses a strict responseSchema so output can't drift from allowed categories.
 *  6. Write new results to the cache.
 *  7. Map every category back onto the full (non-deduped) row list.
 */

import { prisma } from '@ledgerlens/database';
import { CATEGORIES } from './pdfTableExtractor.js';
import type { ExtractedRow } from './pdfTableExtractor.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CategorizedRow extends ExtractedRow {
  type: 'CREDIT' | 'DEBIT';
  category: string;
}

// ---------------------------------------------------------------------------
// Narration normalization
// ---------------------------------------------------------------------------

/**
 * Build a stable, deduplication-friendly cache key from a narration.
 *
 * Steps:
 *   - Prefix with debit:: or credit:: (same text = different category in each direction)
 *   - Lowercase
 *   - Strip long reference/transaction numbers (≥6 consecutive digits)
 *   - Strip punctuation noise (keep letters, digits, spaces, hyphens)
 *   - Collapse whitespace
 */
export function normalizeNarration(narration: string, type: 'CREDIT' | 'DEBIT'): string {
  const prefix = type === 'CREDIT' ? 'credit::' : 'debit::';
  const normalized = narration
    .toLowerCase()
    .replace(/\d{6,}/g, '')           // strip long transaction/ref numbers
    .replace(/[^a-z0-9\s\-]/g, ' ')   // keep letters, digits, spaces, hyphens
    .replace(/\s+/g, ' ')
    .trim();
  return prefix + normalized;
}

// ---------------------------------------------------------------------------
// Gemini call (reuses same fetch pattern and env vars as ai.ts)
// ---------------------------------------------------------------------------

const BATCH_SIZE = 200;

const RESPONSE_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      index: { type: 'INTEGER' },
      category: { type: 'STRING', enum: [...CATEGORIES] },
    },
    required: ['index', 'category'],
  },
};

interface GeminiResultItem {
  index: number;
  category: string;
}

async function callGeminiForCategories(
  items: Array<{ index: number; key: string; narration: string }>
): Promise<GeminiResultItem[]> {
  const proxyUrl = process.env.GEMINI_PROXY_URL;
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? 'gemini-flash-latest';

  if (!proxyUrl || !apiKey) {
    throw new Error('GEMINI_PROXY_URL or GEMINI_API_KEY is not set');
  }

  const sleep = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms));
  const url = `${proxyUrl}/v1beta/models/${model}:generateContent`;

  const prompt =
    `You are a financial transaction categorizer for Indian bank statements.\n` +
    `Assign one category to each transaction narration below.\n` +
    `Reply with a JSON array of {index, category} objects.\n\n` +
    `Allowed categories: ${CATEGORIES.join(', ')}\n\n` +
    `Transactions:\n` +
    items
      .map(i => `${i.index}. [${i.key.startsWith('credit::') ? 'CREDIT' : 'DEBIT'}] ${i.narration}`)
      .join('\n');

  let retries = 0;
  const maxRetries = 5;

  while (retries < maxRetries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120_000); // 2-min timeout

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const result = (await res.json()) as any;

      if (result.error) {
        const code: number = result.error.code ?? 500;
        const msg: string = result.error.message ?? 'Gemini error';

        if (code === 429) {
          const delay = Math.min(30_000 * Math.pow(2, retries), 300_000);
          console.log(`[CATEGORIZE] Rate limit (429). Waiting ${delay / 1000}s then retrying...`);
          await sleep(delay);
          retries++;
          continue;
        }
        if (code === 503) {
          const delay = Math.min(10_000 * Math.pow(2, retries), 120_000);
          console.log(`[CATEGORIZE] Gemini overloaded (503). Waiting ${delay / 1000}s...`);
          await sleep(delay);
          retries++;
          continue;
        }
        throw new Error(`[${code}] ${msg}`);
      }

      const rawText: string =
        (result.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined) ?? '[]';

      const parsed: unknown = JSON.parse(
        rawText.replace(/```json/g, '').replace(/```/g, '').trim()
      );
      if (!Array.isArray(parsed)) throw new Error('Gemini categorization response was not an array');
      return parsed as GeminiResultItem[];
    } catch (e: unknown) {
      clearTimeout(timeoutId);
      if ((e as any)?.name === 'AbortError') {
        throw new Error('NETWORK_TIMEOUT during categorization batch');
      }
      const msg = String((e as any)?.message ?? e);
      if (msg.includes('429')) {
        const delay = Math.min(30_000 * Math.pow(2, retries), 300_000);
        await sleep(delay);
        retries++;
        continue;
      }
      throw e;
    }
  }

  throw new Error('Exhausted retries during categorization');
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Categorize a list of extracted rows using the narration cache.
 * Does NOT write to the Transaction table — the caller (index.ts) does that
 * so the full row data (statementId, timestamps, etc.) is in one place.
 */
export async function categorizeStatementRows(rows: ExtractedRow[]): Promise<CategorizedRow[]> {
  if (rows.length === 0) return [];

  // Step 1: assign type and compute cache key per row
  const withKeys = rows.map(row => ({
    ...row,
    type: (row.credit !== null ? 'CREDIT' : 'DEBIT') as 'CREDIT' | 'DEBIT',
    key: normalizeNarration(row.narration, row.credit !== null ? 'CREDIT' : 'DEBIT'),
  }));

  // Step 2: deduplicate
  const uniqueKeys = [...new Set(withKeys.map(r => r.key))];

  // Step 3: cache lookup
  const cached = await prisma.transactionCategoryCache.findMany({
    where: { narrationKey: { in: uniqueKeys } },
  });
  const cacheMap = new Map(cached.map(c => [c.narrationKey, c.category]));

  const missCount = uniqueKeys.length - cacheMap.size;
  console.log(
    `[CACHE] ${cacheMap.size} hits, ${missCount} misses out of ${uniqueKeys.length} unique narrations`
  );

  // Step 4: call Gemini for uncached keys only
  const uncachedKeys = uniqueKeys.filter(k => !cacheMap.has(k));

  if (uncachedKeys.length > 0) {
    // Build narration lookup: normalized key → original narration (for readable prompt)
    const keyToNarration = new Map<string, string>();
    for (const row of withKeys) {
      if (!keyToNarration.has(row.key)) {
        keyToNarration.set(row.key, row.narration);
      }
    }

    const allItems = uncachedKeys.map((key, i) => ({
      index: i,
      key,
      narration: keyToNarration.get(key) ?? key,
    }));

    for (let offset = 0; offset < allItems.length; offset += BATCH_SIZE) {
      const batch = allItems.slice(offset, offset + BATCH_SIZE);
      console.log(`[CATEGORIZE] Sending batch of ${batch.length} narration(s) to Gemini...`);

      const results = await callGeminiForCategories(batch);

      const newEntries = results
        .map(r => {
          const batchItem = batch[r.index];
          if (batchItem === undefined) return null;
          return { narrationKey: batchItem.key, category: r.category };
        })
        .filter((e): e is { narrationKey: string; category: string } => e !== null);

      if (newEntries.length > 0) {
        await prisma.transactionCategoryCache.createMany({
          data: newEntries,
          skipDuplicates: true,
        });
        for (const e of newEntries) {
          cacheMap.set(e.narrationKey, e.category);
        }
      }
    }
  }

  // Step 5: map categories back onto all rows
  return withKeys.map(row => ({
    ...row,
    category: cacheMap.get(row.key) ?? 'Misc',
  }));
}
