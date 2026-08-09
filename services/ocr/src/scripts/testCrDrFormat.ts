/**
 * testCrDrFormat.ts
 *
 * Synthetic test fixture for the coordinate-based PDF table extractor.
 * Exercises both the two-column (Debit/Credit) and single-column (Amount + CR/DR suffix)
 * bank statement formats without needing a real PDF or any network calls.
 *
 * Run: npx tsx services/ocr/src/scripts/testCrDrFormat.ts
 * Should exit 0 with all ✅.
 */

import {
  parseAmount,
  detectHeader,
  buildBands,
  clusterIntoRows,
} from '../pdfTableExtractor.js';

import { normalizeNarration } from '../categorizeTransactions.js';

// ---------------------------------------------------------------------------
// Minimal test harness
// ---------------------------------------------------------------------------

type TestResult = { passed: boolean; error?: string };
const results: { name: string; result: TestResult }[] = [];

function test(name: string, fn: () => TestResult): void {
  try {
    results.push({ name, result: fn() });
  } catch (e: unknown) {
    results.push({ name, result: { passed: false, error: String(e) } });
  }
}

function ok(condition: boolean, message: string): TestResult {
  return condition ? { passed: true } : { passed: false, error: message };
}

// ---------------------------------------------------------------------------
// parseAmount tests
// ---------------------------------------------------------------------------

test('parseAmount: plain Indian number', () => {
  const { amount, suffix } = parseAmount('1,23,456.78');
  return ok(amount === 123456.78 && suffix === null, `got ${amount}/${String(suffix)}`);
});

test('parseAmount: CR suffix', () => {
  const { amount, suffix } = parseAmount('5,000.00 CR');
  return ok(amount === 5000 && suffix === 'CR', `got ${amount}/${String(suffix)}`);
});

test('parseAmount: DR suffix', () => {
  const { amount, suffix } = parseAmount('3,000.50 DR');
  return ok(amount === 3000.5 && suffix === 'DR', `got ${amount}/${String(suffix)}`);
});

test('parseAmount: lowercase cr suffix', () => {
  const { amount, suffix } = parseAmount('750.00cr');
  return ok(amount === 750 && suffix === 'CR', `got ${amount}/${String(suffix)}`);
});

test('parseAmount: rupee symbol + DR', () => {
  const { amount, suffix } = parseAmount('₹2,500.00 DR');
  return ok(amount === 2500 && suffix === 'DR', `got ${amount}/${String(suffix)}`);
});

test('parseAmount: empty string → null', () => {
  const { amount } = parseAmount('');
  return ok(amount === null, `got ${String(amount)}`);
});

test('parseAmount: Rs. prefix', () => {
  const { amount } = parseAmount('Rs. 4,200.00');
  return ok(amount === 4200, `got ${String(amount)}`);
});

// ---------------------------------------------------------------------------
// detectHeader tests
// ---------------------------------------------------------------------------

test('detectHeader: standard 5-column header', () => {
  const row = [
    { str: 'Date', x: 50, y: 700 },
    { str: 'Description', x: 150, y: 700 },
    { str: 'Debit', x: 370, y: 700 },
    { str: 'Credit', x: 440, y: 700 },
    { str: 'Balance', x: 520, y: 700 },
  ];
  const result = detectHeader(row);
  return ok(result !== null && result.size === 5, `size=${result?.size ?? 'null'}`);
});

test('detectHeader: single-amount-column header', () => {
  const row = [
    { str: 'Date', x: 50, y: 700 },
    { str: 'Particulars', x: 150, y: 700 },
    { str: 'Amount', x: 400, y: 700 },
    { str: 'Balance', x: 500, y: 700 },
  ];
  const result = detectHeader(row);
  return ok(
    result !== null && result.has('amount') && !result.has('debit'),
    `keys=${result ? [...result.keys()].join(',') : 'null'}`
  );
});

test('detectHeader: too few columns → null', () => {
  const row = [
    { str: 'Date', x: 50, y: 700 },
    { str: 'Balance', x: 500, y: 700 },
  ];
  const result = detectHeader(row);
  return ok(result === null, `expected null, got size=${result?.size}`);
});

test('detectHeader: txn date alias', () => {
  const row = [
    { str: 'Txn Date', x: 50, y: 700 },
    { str: 'Narration', x: 150, y: 700 },
    { str: 'Withdrawal', x: 380, y: 700 },
    { str: 'Deposit', x: 460, y: 700 },
    { str: 'Balance', x: 540, y: 700 },
  ];
  const result = detectHeader(row);
  return ok(
    result !== null && result.has('date') && result.has('debit') && result.has('credit'),
    `keys=${result ? [...result.keys()].join(',') : 'null'}`
  );
});

// ---------------------------------------------------------------------------
// clusterIntoRows tests
// ---------------------------------------------------------------------------

test('clusterIntoRows: items within tolerance cluster together', () => {
  const items = [
    { str: 'A', x: 50, y: 700 },
    { str: 'B', x: 200, y: 702 }, // within 4-unit tolerance
    { str: 'C', x: 300, y: 680 }, // new row
  ];
  const rows = clusterIntoRows(items);
  return ok(rows.length === 2 && (rows[0]?.length ?? 0) === 2, `rows=${rows.length}, first=${rows[0]?.length ?? 0}`);
});

test('clusterIntoRows: items outside tolerance split into separate rows', () => {
  const items = [
    { str: 'A', x: 50, y: 700 },
    { str: 'B', x: 100, y: 690 }, // 10 units apart → separate row
  ];
  const rows = clusterIntoRows(items);
  return ok(rows.length === 2, `expected 2 rows, got ${rows.length}`);
});

// ---------------------------------------------------------------------------
// Full pipeline: single-column CR/DR format
// ---------------------------------------------------------------------------

test('[CR/DR] salary credit correctly assigned to credit column', () => {
  const headerRow = [
    { str: 'Date', x: 50, y: 700 },
    { str: 'Narration', x: 150, y: 700 },
    { str: 'Amount', x: 400, y: 700 },
    { str: 'Balance', x: 500, y: 700 },
  ];
  const dataRow = [
    { str: '01/07/2024', x: 50, y: 680 },
    { str: 'NEFT-SALARY-ACME CORP', x: 150, y: 680 },
    { str: '50,000.00 CR', x: 400, y: 680 },
    { str: '1,50,000.00', x: 500, y: 680 },
  ];

  const headerCols = detectHeader(headerRow);
  if (headerCols === null) return { passed: false, error: 'Header not detected' };
  const bands = buildBands(headerCols);
  const isSingle = headerCols.has('amount') && !headerCols.has('debit');

  const cells: Record<string, string> = {};
  for (const item of dataRow) {
    const band = bands.find(b => item.x >= b.xMin && item.x < b.xMax);
    if (band !== undefined) cells[band.type] = (cells[band.type] ? cells[band.type] + ' ' : '') + item.str;
  }

  let credit: number | null = null;
  let debit: number | null = null;
  if (isSingle) {
    const { amount, suffix } = parseAmount(cells['amount'] ?? '');
    if (amount !== null) { if (suffix === 'CR') credit = amount; else debit = amount; }
  }

  return ok(credit === 50000 && debit === null, `credit=${String(credit)} debit=${String(debit)}`);
});

test('[CR/DR] UPI debit correctly assigned to debit column', () => {
  const headerRow = [
    { str: 'Date', x: 50, y: 700 },
    { str: 'Narration', x: 150, y: 700 },
    { str: 'Amount', x: 400, y: 700 },
    { str: 'Balance', x: 500, y: 700 },
  ];
  const dataRow = [
    { str: '02/07/2024', x: 50, y: 660 },
    { str: 'UPI-SWIGGY-PAYMENT-123456789', x: 150, y: 660 },
    { str: '450.00 DR', x: 400, y: 660 },
    { str: '1,49,550.00', x: 500, y: 660 },
  ];

  const headerCols = detectHeader(headerRow);
  if (headerCols === null) return { passed: false, error: 'Header not detected' };
  const bands = buildBands(headerCols);
  const isSingle = headerCols.has('amount') && !headerCols.has('debit');

  const cells: Record<string, string> = {};
  for (const item of dataRow) {
    const band = bands.find(b => item.x >= b.xMin && item.x < b.xMax);
    if (band !== undefined) cells[band.type] = (cells[band.type] ? cells[band.type] + ' ' : '') + item.str;
  }

  let credit: number | null = null;
  let debit: number | null = null;
  if (isSingle) {
    const { amount, suffix } = parseAmount(cells['amount'] ?? '');
    if (amount !== null) { if (suffix === 'CR') credit = amount; else debit = amount; }
  }

  return ok(debit === 450 && credit === null, `debit=${String(debit)} credit=${String(credit)}`);
});

// ---------------------------------------------------------------------------
// Full pipeline: two-column Debit / Credit format
// ---------------------------------------------------------------------------

test('[Two-column] debit row: amount in Debit column, Credit column empty', () => {
  const headerRow = [
    { str: 'Date', x: 50, y: 700 },
    { str: 'Description', x: 150, y: 700 },
    { str: 'Debit', x: 380, y: 700 },
    { str: 'Credit', x: 450, y: 700 },
    { str: 'Balance', x: 530, y: 700 },
  ];
  const dataRow = [
    { str: '03/07/2024', x: 50, y: 680 },
    { str: 'HDFC CC BILL', x: 150, y: 680 },
    { str: '12,500.00', x: 380, y: 680 },
    // Credit column intentionally absent in this row
    { str: '1,37,050.00', x: 530, y: 680 },
  ];

  const headerCols = detectHeader(headerRow);
  if (headerCols === null) return { passed: false, error: 'Header not detected' };
  const bands = buildBands(headerCols);

  const cells: Record<string, string> = {};
  for (const item of dataRow) {
    const band = bands.find(b => item.x >= b.xMin && item.x < b.xMax);
    if (band !== undefined) cells[band.type] = item.str;
  }

  const { amount: d } = parseAmount(cells['debit'] ?? '');
  const { amount: c } = parseAmount(cells['credit'] ?? '');

  return ok(d === 12500 && c === null, `debit=${String(d)} credit=${String(c)}`);
});

test('[Two-column] credit row: amount in Credit column, Debit column empty', () => {
  const headerRow = [
    { str: 'Date', x: 50, y: 700 },
    { str: 'Description', x: 150, y: 700 },
    { str: 'Debit', x: 380, y: 700 },
    { str: 'Credit', x: 450, y: 700 },
    { str: 'Balance', x: 530, y: 700 },
  ];
  const dataRow = [
    { str: '04/07/2024', x: 50, y: 680 },
    { str: 'INTEREST CREDIT', x: 150, y: 680 },
    // Debit column intentionally absent
    { str: '250.00', x: 450, y: 680 },
    { str: '1,37,300.00', x: 530, y: 680 },
  ];

  const headerCols = detectHeader(headerRow);
  if (headerCols === null) return { passed: false, error: 'Header not detected' };
  const bands = buildBands(headerCols);

  const cells: Record<string, string> = {};
  for (const item of dataRow) {
    const band = bands.find(b => item.x >= b.xMin && item.x < b.xMax);
    if (band !== undefined) cells[band.type] = item.str;
  }

  const { amount: d } = parseAmount(cells['debit'] ?? '');
  const { amount: c } = parseAmount(cells['credit'] ?? '');

  return ok(c === 250 && d === null, `credit=${String(c)} debit=${String(d)}`);
});

test('[Two-column] CR suffix in Debit column treated as credit', () => {
  // Some older bank formats print "500.00 CR" in the Debit column for credits
  const headerRow = [
    { str: 'Date', x: 50, y: 700 },
    { str: 'Narration', x: 150, y: 700 },
    { str: 'Debit', x: 380, y: 700 },
    { str: 'Balance', x: 530, y: 700 },
  ];
  const dataRow = [
    { str: '05/07/2024', x: 50, y: 680 },
    { str: 'REFUND-AMAZON', x: 150, y: 680 },
    { str: '200.00 CR', x: 380, y: 680 },
    { str: '1,37,500.00', x: 530, y: 680 },
  ];

  const headerCols = detectHeader(headerRow);
  if (headerCols === null) return { passed: false, error: 'Header not detected' };
  const bands = buildBands(headerCols);

  const cells: Record<string, string> = {};
  for (const item of dataRow) {
    const band = bands.find(b => item.x >= b.xMin && item.x < b.xMax);
    if (band !== undefined) cells[band.type] = item.str;
  }

  const { amount: d, suffix: ds } = parseAmount(cells['debit'] ?? '');
  let credit: number | null = null;
  let debit: number | null = null;
  if (d !== null) { if (ds === 'CR') credit = d; else debit = d; }

  return ok(credit === 200 && debit === null, `credit=${String(credit)} debit=${String(debit)}`);
});

// ---------------------------------------------------------------------------
// normalizeNarration tests
// ---------------------------------------------------------------------------

test('normalizeNarration: strips long ref numbers', () => {
  const a = normalizeNarration('UPI-SWIGGY-12345678901', 'DEBIT');
  const b = normalizeNarration('UPI-SWIGGY-99999999999', 'DEBIT');
  return ok(a === b, `'${a}' !== '${b}'`);
});

test('normalizeNarration: same text different direction = different key', () => {
  const a = normalizeNarration('NEFT TRANSFER', 'DEBIT');
  const b = normalizeNarration('NEFT TRANSFER', 'CREDIT');
  return ok(a !== b && a.startsWith('debit::') && b.startsWith('credit::'), `a=${a} b=${b}`);
});

test('normalizeNarration: strips punctuation', () => {
  const a = normalizeNarration('UPI/PAYTM@WALLET!', 'DEBIT');
  return ok(!a.includes('/') && !a.includes('@') && !a.includes('!'), `got ${a}`);
});

// ---------------------------------------------------------------------------
// Print results
// ---------------------------------------------------------------------------

console.log('\n=== CR/DR Format Test Results ===\n');
let passed = 0;
let failed = 0;

for (const { name, result } of results) {
  if (result.passed) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}: ${result.error ?? 'unknown'}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
