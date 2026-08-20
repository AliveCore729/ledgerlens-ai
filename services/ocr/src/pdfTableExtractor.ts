/**
 * pdfTableExtractor.ts
 *
 * Coordinate-based PDF table extractor for bank statements.
 * Uses pdfjs-dist to read each page's text items with (x, y) positions,
 * clusters them into rows, detects the header row, builds column bands,
 * and outputs typed { date, narration, debit, credit, balance } rows.
 *
 * Makes ZERO AI calls — pure local parsing.
 * Returns needsFallback: true for scanned PDFs or any PDF where no
 * reliable header/column structure is found.
 */

import * as fs from 'fs';

// ---------------------------------------------------------------------------
// Categories — single source of truth for the whole OCR service.
// Must stay in sync with the categories used in ai.ts prompt.
// ---------------------------------------------------------------------------
export const CATEGORIES = [
  'Income',
  'Food & Dining',
  'Travel & Transportation',
  'Software & Subscriptions',
  'Utilities & Bills',
  'Rent & Housing',
  'Salary & Payroll',
  'Office Supplies',
  'Marketing & Advertising',
  'Bank Fees & Charges',
  'Transfers & Investments',
  'Healthcare & Insurance',
  'Shopping & Retail',
  'Entertainment & Leisure',
  'Taxes & Fines',
  'Misc',
] as const;

export type Category = (typeof CATEGORIES)[number];

// ---------------------------------------------------------------------------
// Column types
// ---------------------------------------------------------------------------
type ColumnType = 'date' | 'narration' | 'debit' | 'credit' | 'balance' | 'amount';

/**
 * Aliases for each column type (lowercase, partial-match tested).
 * The 'amount' type covers single-column banks that use one Amount column
 * with a CR/DR suffix per row instead of separate Debit/Credit columns.
 *
 * TUNING NOTE: add bank-specific header text here if you encounter a bank
 * whose columns are not detected. All matches are lowercased before comparison.
 */
const COLUMN_ALIASES: Record<ColumnType, string[]> = {
  date: [
    'date', 'txn date', 'value date', 'posting date', 'tran date',
    'transaction date', 'trans date', 'entry date',
  ],
  narration: [
    'narration', 'description', 'particulars', 'details', 'remarks',
    'desc', 'transaction details', 'narration/remarks', 'cheque details',
    'transaction narration', 'narration / chq. no.', 'particulars/narration',
  ],
  debit: [
    'debit', 'withdrawal', 'dr amount', 'withdrawals', 'debit amount',
    'paid out', 'dr', 'debit (inr)',
  ],
  credit: [
    'credit', 'deposit', 'cr amount', 'deposits', 'credit amount',
    'paid in', 'cr', 'credit (inr)',
  ],
  balance: [
    'balance', 'running balance', 'avl balance', 'closing bal',
    'available balance', 'ledger balance', 'book balance', 'bal',
  ],
  amount: [
    'amount', 'txn amount', 'transaction amount', 'amt',
    'chq amount', 'dr / cr', 'debit/credit', 'withdrawal/deposit',
    'debit or credit', 'credit/debit',
  ],
};

/**
 * Y-position tolerance for row clustering (PDF units, ~72 units = 1 inch).
 * A typical 11pt font has a line height of ~13–15 PDF units.
 *
 * TUNING: Increase if a single row is being split across multiple clusters.
 *         Decrease if two visually separate rows are being merged.
 */
export const ROW_Y_TOLERANCE = 4;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ExtractedRow {
  date: string;
  narration: string;
  debit: number | null;
  credit: number | null;
  balance: number | null;
  raw: string; // full row text, for debugging / the `raw` DB column
}

export interface ExtractionResult {
  rows: ExtractedRow[];
  needsFallback: boolean;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface TextItem {
  str: string;
  x: number;
  y: number;
}

interface ColumnBand {
  type: ColumnType;
  xMin: number;
  xMax: number;
}

// ---------------------------------------------------------------------------
// Helpers — exported so the test fixture can unit-test them directly
// ---------------------------------------------------------------------------

/**
 * Parse an amount string into a number.
 * Handles Indian number formatting (1,23,456.78), currency symbols (₹, $, Rs.),
 * and CR/DR suffixes (case-insensitive, with or without trailing period).
 */
export function parseAmount(str: string): { amount: number | null; suffix: 'CR' | 'DR' | null } {
  let s = str.trim();
  let suffix: 'CR' | 'DR' | null = null;

  if (/cr\.?\s*$/i.test(s)) {
    suffix = 'CR';
    s = s.replace(/cr\.?\s*$/i, '').trim();
  } else if (/dr\.?\s*$/i.test(s)) {
    suffix = 'DR';
    s = s.replace(/dr\.?\s*$/i, '').trim();
  }

  s = s.replace(/[₹$]|Rs\.?|INR/g, '').replace(/,/g, '').trim();

  const num = parseFloat(s);
  if (Number.isNaN(num) || s.length === 0) return { amount: null, suffix };
  return { amount: Math.abs(num), suffix };
}

/**
 * Test whether a row (sorted left-to-right) looks like a column header.
 * Returns a Map<ColumnType, x-position> if ≥ 3 distinct columns are matched,
 * otherwise null.
 */
export function detectHeader(row: TextItem[]): Map<ColumnType, number> | null {
  const matched = new Map<ColumnType, number>();

  for (const item of row) {
    const text = item.str.toLowerCase().trim();
    if (text.length === 0) continue;

    for (const [col, aliases] of Object.entries(COLUMN_ALIASES) as [ColumnType, string[]][]) {
      if (matched.has(col)) continue;
      if (aliases.some(alias => text === alias || text.startsWith(alias + ' ') || text.endsWith(' ' + alias))) {
        matched.set(col, item.x);
        break;
      }
    }
  }

  return matched.size >= 3 ? matched : null;
}

/**
 * Convert a Map<ColumnType, x-position> from header detection into
 * column bands that cover the full width of the page.
 * Each band's x-range is the midpoint between adjacent column anchors.
 */
export function buildBands(headerCols: Map<ColumnType, number>): ColumnBand[] {
  const sorted = [...headerCols.entries()].sort((a, b) => a[1] - b[1]);
  return sorted.map(([type, x], i) => {
    const prev = sorted[i - 1];
    const next = sorted[i + 1];
    return {
      type,
      xMin: prev === undefined ? -Infinity : (prev[1] + x) / 2,
      xMax: next === undefined ? Infinity : (x + next[1]) / 2,
    };
  });
}

/**
 * Cluster text items into rows by grouping items whose y-coordinates
 * are within ROW_Y_TOLERANCE of each other (descending → top-of-page first).
 * Items within each row are then sorted left-to-right by x.
 */
export function clusterIntoRows(items: TextItem[]): TextItem[][] {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => b.y - a.y);
  const rows: TextItem[][] = [];
  let currentRow: TextItem[] = [];

  const first = sorted[0];
  if (first !== undefined) currentRow = [first];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (prev === undefined || curr === undefined) continue;

    if (Math.abs(prev.y - curr.y) <= ROW_Y_TOLERANCE) {
      currentRow.push(curr);
    } else {
      rows.push(currentRow.sort((a, b) => a.x - b.x));
      currentRow = [curr];
    }
  }
  if (currentRow.length > 0) rows.push(currentRow.sort((a, b) => a.x - b.x));
  return rows;
}

function looksLikeDate(s: string): boolean {
  return (
    // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD, etc.
    /\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(s) ||
    // DD Mon YYYY or DD-Mon-YYYY or DD.Mon.YYYY (e.g. 21 Aug 2024, 21-Aug-24)
    /\d{1,2}[\s\-\.](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(s)
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function extractStatementTable(filePath: string): Promise<ExtractionResult> {
  // pdfjs-dist v4 CJS: package exports map resolves to ./build/pdf.cjs in require() context
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfjsLib: any = require('pdfjs-dist'); // @ts-ignore
  pdfjsLib.GlobalWorkerOptions.workerSrc = '';

  let rawBuffer: Buffer;
  try {
    rawBuffer = fs.readFileSync(filePath);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { rows: [], needsFallback: true, reason: `Cannot read file: ${msg}` };
  }

  let pdfDoc: any;
  try {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(rawBuffer), verbosity: 0 });
    pdfDoc = await loadingTask.promise;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { rows: [], needsFallback: true, reason: `pdfjs could not open PDF: ${msg}` };
  }

  const allRows: ExtractedRow[] = [];
  let headerFoundOnAnyPage = false;
  // Persisted across pages: once we find the column layout we keep it for the
  // entire document. Banks that repeat the header on every page are handled
  // because repeated headers fail looksLikeDate and are silently skipped.
  let bands: ColumnBand[] | null = null;
  let isSingleAmountColumn = false;

  for (let pageNum = 1; pageNum <= (pdfDoc.numPages as number); pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    let content: any;
    try {
      content = await page.getTextContent();
    } catch {
      console.warn(`[TABLE] Failed to get text content for page ${pageNum}, skipping`);
      continue;
    }

    const items: TextItem[] = (content.items as unknown[])
      .filter((item): item is { str: string; transform: number[] } =>
        typeof (item as any).str === 'string' && (item as any).str.trim().length > 0)
      .map(item => ({
        str: item.str.trim(),
        x: Math.round(item.transform[4] ?? 0),
        y: Math.round(item.transform[5] ?? 0),
      }));

    if (items.length === 0) continue;

    const pageRows = clusterIntoRows(items);

    for (const row of pageRows) {
      if (!bands) {
        // Still searching for the header on this page
        const headerCols = detectHeader(row);
        if (headerCols !== null) {
          headerFoundOnAnyPage = true;
          bands = buildBands(headerCols);
          isSingleAmountColumn =
            headerCols.has('amount') &&
            !headerCols.has('debit') &&
            !headerCols.has('credit');
          console.log(
            `[TABLE] Found header on page ${pageNum}: [${[...headerCols.entries()]
              .map(([t, x]) => `${t}@${x}`)
              .join(', ')}]${isSingleAmountColumn ? ' [single-column CR/DR mode]' : ''}`
          );
        }
        continue; // header row itself is never a data row
      }

      // Assign each item to a column band
      const cells: Partial<Record<ColumnType, string>> = {};
      for (const item of row) {
        const band = bands.find(b => item.x >= b.xMin && item.x < b.xMax);
        if (band !== undefined) {
          const existing = cells[band.type];
          cells[band.type] = existing !== undefined ? `${existing} ${item.str}` : item.str;
        }
      }

      const dateStr = cells.date?.trim() ?? '';
      if (!looksLikeDate(dateStr)) continue; // not a transaction row

      const narration = cells.narration?.trim() ?? '';
      const rawText = row.map(i => i.str).join(' ');
      const { amount: balance } = parseAmount(cells.balance?.trim() ?? '');

      let debit: number | null = null;
      let credit: number | null = null;

      if (isSingleAmountColumn) {
        // Single "Amount" column — direction determined by CR/DR suffix
        const { amount, suffix } = parseAmount(cells.amount?.trim() ?? '');
        if (amount !== null) {
          if (suffix === 'CR') credit = amount;
          else debit = amount; // DR or no suffix → debit
        }
      } else {
        // Separate Debit / Credit columns
        const { amount: d, suffix: ds } = parseAmount(cells.debit?.trim() ?? '');
        const { amount: c, suffix: cs } = parseAmount(cells.credit?.trim() ?? '');

        if (d !== null) {
          // A CR suffix in the "Debit" column means the bank printed a credit there
          if (ds === 'CR') credit = d;
          else debit = d;
        }
        if (c !== null) {
          // A DR suffix in the "Credit" column means the bank printed a debit there
          if (cs === 'DR') debit = c;
          else credit = c;
        }
      }

      if (debit === null && credit === null) continue; // no amount → skip

      allRows.push({ date: dateStr, narration, debit, credit, balance, raw: rawText });
    }
  }

  if (!headerFoundOnAnyPage) {
    console.log('[TABLE] No column header detected on any page — falling back to text extraction');
    return { rows: [], needsFallback: true, reason: 'No column header found in any page' };
  }

  console.log(`[TABLE] Extracted ${allRows.length} rows from ${pdfDoc.numPages as number} page(s)`);
  return { rows: allRows, needsFallback: false };
}
