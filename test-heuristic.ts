import { parseTransactions } from './services/ocr/src/ai';

function looksLikeTransactionPage(chunk: string): boolean {
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    const hasDate = /\b(\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{1,4}|\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{0,4})\b/i.test(line);
    const hasAmount = /\b(₹|\$|Rs\.?)?\s*\d{1,9}(,\d{3})*(\.\d{2})?\s*(cr|dr|\/-)?\b/i.test(line);
    
    if (hasDate || hasAmount) {
      return true; 
    }
  }
  return false; 
}

const testCases = [
  {
    name: "Clean Statement with T&C",
    chunks: [
      `Date      Description      Amount     Balance\n12/04/2023 Amazon          $14.50     $1,200.00\n15/04/2023 Uber            $12.00     $1,188.00`,
      `TERMS AND CONDITIONS\n\n1. Introduction\nThese terms govern your use of the account.\n2. Interest Rates\nThe annual percentage rate is 15%.\nCall us at 1-800-555-1234 for help.`
    ]
  },
  {
    name: "Non-Standard Date Statement",
    chunks: [
      `Date      Description      Amount     Balance\n05-04     Target           50.00      1138.00\n2024.12.01 Walmart         100.00     1038.00`
    ]
  },
  {
    name: "Wrapped Transaction Rows",
    chunks: [
      `Date\nDescription\nAmount\nBalance\n12/04/2023\nStarbucks\n$4.50\n$1,033.50`
    ]
  }
];

let totalChunks = 0;
let skippedChunks = 0;

for (const test of testCases) {
  console.log(`\nRunning Test: ${test.name}`);
  for (let i = 0; i < test.chunks.length; i++) {
    totalChunks++;
    const chunk = test.chunks[i];
    const keep = looksLikeTransactionPage(chunk);
    if (!keep) {
      skippedChunks++;
      console.log(`[FLAGGED FOR SKIP] Chunk ${i + 1}:\n${chunk}\n`);
    } else {
      console.log(`[PRESERVED] Chunk ${i + 1} survives filter.`);
    }
  }
}

console.log(`\nResult: ${skippedChunks}/${totalChunks} chunks (${Math.round(skippedChunks/totalChunks * 100)}%) flagged as skippable.`);
