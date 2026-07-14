import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { prisma } from '@ledgerlens/database';

function looksLikeTransactionPage(chunk: string): boolean {
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    const hasDate = /\b(\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{1,4}|\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{0,4})\b/i.test(line);
    
    // We intentionally keep this loose. False negatives (skipping real data) are catastrophic. 
    // A false positive (processing filler) just costs ~0.05 INR.
    // If it has NEITHER a date NOR an amount, it's flagged.
    const hasAmount = /\b(₹|\$|Rs\.?)?\s*\d{1,9}(,\d{3})*(\.\d{2})?\s*(cr|dr|\/-)?\b/i.test(line);
    
    if (hasDate || hasAmount) {
      return true; 
    }
  }
  
  return false; 
}

export async function parseTransactions(rawText: string, statementId: string) {
  const envPath = path.resolve(__dirname, '../../../.env');
  dotenv.config({ path: envPath, override: true }); // Ensure latest .env is loaded

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing. Please add your Gemini API key to the .env file.");
  }

  if (!process.env.GEMINI_PROXY_URL) {
    throw new Error("GEMINI_PROXY_URL is missing.");
  }

  if (rawText.length > 500000) {
    throw new Error("Statement is too large to process. Please split it into smaller files or fewer pages.");
  }

  // Chunk the raw text by lines to avoid slicing transactions in half
  const lines = rawText.split('\n');
  const chunks = [];
  let currentChunk = '';
  
  for (const line of lines) {
    if (currentChunk.length + line.length > 20000) {
      if (currentChunk.trim().length > 0) chunks.push(currentChunk);
      currentChunk = '';
      
      // Forcefully slice massive single lines (e.g. PDFs missing newlines)
      if (line.length > 20000) {
        let remainingLine = line;
        while (remainingLine.length > 20000) {
          chunks.push(remainingLine.substring(0, 20000));
          remainingLine = remainingLine.substring(20000);
        }
        currentChunk = remainingLine + '\n';
        continue;
      }
    }
    currentChunk += line + '\n';
  }
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk);
  }

  let allTransactions: any[] = [];
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  let chunkIndex = 0;
  for (const chunk of chunks) {
    chunkIndex++;
    
    if (!looksLikeTransactionPage(chunk)) {
      console.log(`[SKIPPED] Chunk ${chunkIndex} automatically skipped (No dates or amounts found).`);
      await prisma.skippedChunkLog.create({
        data: {
          statementId,
          chunkIndex,
          charCount: chunk.length,
          contentPreview: chunk.substring(0, 500),
          isLogOnly: false
        }
      }).catch(err => console.error("Failed to log skipped chunk:", err));
      
      // Officially skip the Gemini API call for this blank/fluff chunk!
      continue;
    }

    // Cooperative Cancellation Check
    const statement = await prisma.statement.findUnique({
      where: { id: statementId }
    });
    if (!statement || statement.status === 'FAILED') {
      console.log(`Job cancelled mid-flight for statement ${statementId}. Stopping early.`);
      throw new Error("CANCELLED");
    }

    const systemInstructionText = `Extract the bank statement transactions from the following raw OCR text chunk. Focus on dates, times, amounts, transaction types (CR or DR), vendor names, and categorize them into standard financial categories. Ignore headers, footers, and non-transaction text.

  CRITICAL: 
  - For 'd' (date), you MUST convert and return the date strictly in YYYY-MM-DD format (e.g., "2024-06-25"), regardless of how it appears on the statement.
  - For 'amt' (amount), you MUST extract the exact transaction amount as a positive number. Do NOT attempt to calculate or verify it using the balance column, just extract the printed transaction amount exactly as it appears.
  - For 't' (time), extract the exact time from the statement line. If no time is explicitly visible, leave it blank.
  - For 'v' (vendor), provide ONLY a short, clean business name (e.g., "Amazon", "Uber"). Strip out any transaction IDs or filler words like "POS", "UPI". If it's a UPI/QR payment, extract the merchant name from the VPA string (e.g. 'paytmqr...' -> 'Paytm Merchant').
  - For 'cat' (category), you MUST map it to one of the following standard categories: Income, Food & Dining, Travel & Transportation, Software & Subscriptions, Utilities & Bills, Rent & Housing, Salary & Payroll, Office Supplies, Marketing & Advertising, Bank Fees & Charges, Transfers & Investments, Healthcare & Insurance, Shopping & Retail, Entertainment & Leisure, Taxes & Fines, or Misc. 
  - CATEGORY RULES:
    1. For UPI/IMPS/NEFT transfers, look closely at the receiver's name or VPA string. If it contains business keywords ('tech', 'retail', 'qr', 'private', 'bill', 'amazon'), categorize it semantically (e.g., 'Shopping & Retail', 'Utilities & Bills', 'Software & Subscriptions').
    2. ONLY use 'Transfers & Investments' for peer-to-peer transfers to human names, self bank transfers, or credit card bill payments.
    3. Try your absolute best to infer a specific category from the vendor name before falling back to "Misc".

  You MUST respond strictly with a valid JSON array of objects using exactly these short keys:
  [{
    "d": "YYYY-MM-DD",
    "t": "HH:MM",
    "amt": 12.50,
    "bal": 1938.64,
    "typ": "CR",
    "v": "Clean Merchant Name",
    "cat": "Food & Dining"
  }]`;

    let retries = 0;
    const maxRetries = 5;
    let success = false;
    let lastError: any = null;

    while (retries < maxRetries && !success) {
      try {
        const controller = new AbortController();
        let timeoutId: NodeJS.Timeout;
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            controller.abort();
            reject(new Error("NETWORK_TIMEOUT"));
          }, 300000); // Increased to 5 minutes to allow massive 20k chunk generation
        });
        




        const url = `${process.env.GEMINI_PROXY_URL}/v1beta/models/gemini-2.5-flash:generateContent`;
        const fetchPromise = fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': process.env.GEMINI_API_KEY as string,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstructionText }] },
            contents: [{ parts: [{ text: `Raw Text Chunk:\n${chunk}` }] }],
            generationConfig: { responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 0 }, maxOutputTokens: 65536 }
          }),
          signal: controller.signal
        }).then(async res => {
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text();
            throw new Error(`[PROXY_ERROR] Non-JSON response from proxy: ${text.substring(0, 50)}...`);
          }
          return res.json();
        });

        const result: any = await Promise.race([
          fetchPromise,
          timeoutPromise
        ]);
        
        clearTimeout(timeoutId!);
        
        if (result.error) {
          const errMsg = result.error.message || "Gemini API Error";
          const errCode = result.error.code || 500;
          const errObj = new Error(`[${errCode}] ${errMsg}`);
          (errObj as any).status = result.error.status; // e.g. "RESOURCE_EXHAUSTED"
          (errObj as any).code = errCode;
          throw errObj;
        }

        let text = result.candidates[0].content.parts[0].text;
        
        // Strip markdown backticks if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`Checkpointing ${parsed.length} transactions from chunk...`);
          const now = new Date();
          await prisma.transaction.createMany({
            data: parsed.map((tx: any, index: number) => ({
              statementId: statementId,
              date: tx.d,
              time: tx.t || null,
              amount: tx.amt,
              type: tx.typ === 'CR' || tx.typ === 'CREDIT' ? 'CREDIT' : 'DEBIT',
              vendor: tx.v,
              category: tx.cat,
              raw: tx.v,
              createdAt: new Date(now.getTime() + index) // Offset by index to preserve order within chunk
            }))
          });
          allTransactions = allTransactions.concat(parsed);
        }
        success = true;
      } catch (error: any) {
        lastError = error;
        const errMsg = String(error?.message || "");
        
        if (error?.code === 429 || error?.status === 429 || errMsg.includes('429')) {
          if (error?.status === 'RESOURCE_EXHAUSTED' || errMsg.toLowerCase().includes('quota')) {
            console.error("CRITICAL: Daily Quota Exhausted detected. Failing fast to delayed queue.", { status: error?.status, message: errMsg });
            throw new Error("QUOTA_EXHAUSTED");
          }

          const delay = Math.min(30000 * Math.pow(2, retries), 300000); // 30s, 60s, 120s... max 5m
          console.log(`Rate limit hit on chunk. Waiting ${delay/1000}s before retry...`);
          await sleep(delay);
          retries++;
        } else if (error?.status === 503 || errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('overloaded')) {
          const delay = Math.min(10000 * Math.pow(2, retries), 120000); // 10s, 20s, 40s... max 2m
          console.log(`Gemini is experiencing high demand (503). Waiting ${delay/1000}s before retry...`);
          await sleep(delay);
          retries++;
        } else {
          console.error("Failed to parse Gemini JSON for a chunk:", error);
          throw error; // Throw immediately on timeouts to prevent background double-billing
        }
      }
    }

    if (!success) {
      const errMsg = String(lastError?.message || "");
      if (lastError?.status === 429 || errMsg.includes('429')) {
        if (errMsg.toLowerCase().includes('quota')) {
          throw new Error("QUOTA_EXHAUSTED");
        }
        throw new Error("RATE_LIMIT");
      }
      throw lastError || new Error("Exhausted retries for chunk.");
    }
  }

  return allTransactions;
}
