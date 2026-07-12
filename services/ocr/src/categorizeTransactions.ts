import { prisma } from '@ledgerlens/database';
import { normalizeDescription } from './normalizer';
import { ruleClassifier } from './ruleClassifier';
import { VendorCacheService } from './vendor-cache';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Phase 6: Categorization Orchestration
 * Runs after Gemini has extracted all transactions for a statement.
 */
export async function categorizeTransactions(statementId: string) {
  console.log(`Starting categorization orchestration for statement ${statementId}...`);
  
  const transactions = await prisma.transaction.findMany({
    where: { statementId }
  });

  if (transactions.length === 0) return;

  let ruleHitCount = 0;
  let cacheHitCount = 0;
  const unresolvedVendors = new Map<string, string>(); // normalizedKey -> raw description

  // Pass 1: Local Classification (Rules + Cache)
  for (const txn of transactions) {
    const rawDesc = txn.raw || txn.vendor || '';
    if (!rawDesc) continue;

    const normalizedKey = normalizeDescription(rawDesc);
    let assignedCategory = null;

    // 1. Try Regex Rules
    const ruleMatch = ruleClassifier(rawDesc);
    if (ruleMatch) {
      assignedCategory = ruleMatch;
      ruleHitCount++;
    } else {
      // 2. Try DB Cache Lookup
      const cacheMatch = await VendorCacheService.lookup(normalizedKey);
      if (cacheMatch) {
        assignedCategory = cacheMatch.category;
        cacheHitCount++;
      } else {
        // 3. Mark as Unresolved
        if (!unresolvedVendors.has(normalizedKey)) {
          unresolvedVendors.set(normalizedKey, rawDesc);
        }
      }
    }

    // Update the transaction in memory so we can save it later
    if (assignedCategory) {
      (txn as any)._newCategory = assignedCategory;
      (txn as any)._normalizedKey = normalizedKey;
    } else {
      (txn as any)._normalizedKey = normalizedKey;
    }
  }

  // Pass 2: Batched LLM Fallback
  let llmFallbackCount = unresolvedVendors.size;
  if (unresolvedVendors.size > 0) {
    console.log(`Fallback: Sending ${unresolvedVendors.size} unique unresolved vendors to LLM...`);
    const fallbackMap = await callGeminiCategorizationBatch(unresolvedVendors);
    
    for (const [normalizedKey, category] of fallbackMap.entries()) {
      const rawDesc = unresolvedVendors.get(normalizedKey) || normalizedKey;
      await VendorCacheService.upsert(normalizedKey, category, 'llm', rawDesc);
      
      // Assign back to memory transactions
      for (const txn of transactions) {
        if ((txn as any)._normalizedKey === normalizedKey && !(txn as any)._newCategory) {
          (txn as any)._newCategory = category;
        }
      }
    }
  }

  // Save all updated categories to the database
  const updatePromises = transactions.map(txn => {
    return prisma.transaction.update({
      where: { id: txn.id },
      data: {
        category: (txn as any)._newCategory || 'Misc',
        normalizedVendor: (txn as any)._normalizedKey || txn.vendor
      }
    });
  });

  // Execute DB updates in batches to prevent overwhelming the connection pool
  for (let i = 0; i < updatePromises.length; i += 50) {
    await Promise.all(updatePromises.slice(i, i + 50));
  }

  // Phase 7: Save Metrics
  const totalTransactions = transactions.length;
  const cacheHitRate = (ruleHitCount + cacheHitCount) / totalTransactions;
  
  try {
    await prisma.uploadMetrics.create({
      data: {
        statementId,
        totalTransactions,
        ruleHitCount,
        cacheHitCount,
        llmFallbackCount,
        cacheHitRate
      }
    });
    console.log(`Metrics saved. Total: ${totalTransactions}, Cache+Rule Hit Rate: ${(cacheHitRate * 100).toFixed(1)}%`);
  } catch (e) {
    console.error("Failed to save upload metrics:", e);
  }
}

/**
 * Calls Gemini 2.5 Flash-Lite with a minimal prompt to map unresolved vendors to categories.
 */
async function callGeminiCategorizationBatch(unresolvedVendors: Map<string, string>): Promise<Map<string, string>> {
  if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_PROXY_URL) {
    throw new Error("Missing Gemini credentials.");
  }

  const vendorsList = Array.from(unresolvedVendors.entries()).map(([k, v]) => `"${k}" (Raw: ${v})`).join('\n');
  
  const systemInstruction = `You are a financial categorization expert. Map the following list of unhandled vendor names to standard categories.
Valid categories MUST be one of: Income, Food & Dining, Travel & Transportation, Software & Subscriptions, Utilities & Bills, Rent & Housing, Salary & Payroll, Office Supplies, Marketing & Advertising, Bank Fees & Charges, Transfers & Investments, Healthcare & Insurance, Shopping & Retail, Entertainment & Leisure, Taxes & Fines, or Misc.
Respond strictly with a JSON object mapping the exact Normalized Key to its Category string.`;

  const url = `${process.env.GEMINI_PROXY_URL}/v1beta/models/gemini-2.5-flash-lite:generateContent`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY as string,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ parts: [{ text: `Vendors to categorize:\n${vendorsList}` }] }],
      generationConfig: { 
        responseMimeType: "application/json",
        // Enforce JSON Object map: { "normalizedKey": "Category" }
        responseSchema: {
          type: "OBJECT",
          additionalProperties: { type: "STRING" }
        }
      }
    })
  });

  const resJson = await response.json();
  if (resJson.error) {
    console.error("Batch categorization failed:", resJson.error);
    return new Map();
  }

  let text = resJson.candidates[0].content.parts[0].text;
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  const parsed = JSON.parse(text);
  const resultMap = new Map<string, string>();
  for (const [key, cat] of Object.entries(parsed)) {
    resultMap.set(key, cat as string);
  }
  
  return resultMap;
}
