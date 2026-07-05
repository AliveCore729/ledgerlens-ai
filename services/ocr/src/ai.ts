import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

export async function parseTransactions(rawText: string) {
  const envPath = path.resolve(__dirname, '../../../.env');
  dotenv.config({ path: envPath, override: true }); // Ensure latest .env is loaded

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing. Please add your Gemini API key to the .env file.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            date: { type: SchemaType.STRING, description: "Date of the transaction strictly formatted as YYYY-MM-DD" },
            time: { type: SchemaType.STRING, description: "Exact time of the transaction (e.g. '14:30', '02:30 PM') if visible on the statement line, otherwise null" },
            amount: { type: SchemaType.NUMBER },
            type: { type: SchemaType.STRING, enum: ["CREDIT", "DEBIT"], format: "enum" as any },
            vendor: { type: SchemaType.STRING, description: "Short, clean vendor name without extra IDs (e.g. 'Uber', 'Amazon', 'Starbucks')" },
            category: { type: SchemaType.STRING },
            narration: { type: SchemaType.STRING, description: "The original full transaction text/narration from the statement" },
          },
          required: ["date", "amount", "type", "vendor", "category", "narration"],
        },
      },
    },
  }, {
    baseUrl: 'https://ledgerlens-ai-web.vercel.app/api/gemini'
  });

  // Chunk the raw text by lines to avoid slicing transactions in half
  const lines = rawText.split('\n');
  const chunks = [];
  let currentChunk = '';
  
  for (const line of lines) {
    if (currentChunk.length + line.length > 8000) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    currentChunk += line + '\n';
  }
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk);
  }

  let allTransactions: any[] = [];
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  for (const chunk of chunks) {
    const prompt = `Extract the bank statement transactions from the following raw OCR text chunk. Focus on dates, times, amounts, transaction types (CREDIT or DEBIT), vendor names, and categorize them into standard financial categories. Ignore headers, footers, and non-transaction text.

  CRITICAL: 
  - For 'date', you MUST convert and return the date strictly in YYYY-MM-DD format (e.g., "2024-06-25"), regardless of how it appears on the statement.
  - For 'amount', you MUST extract the actual transaction amount (the Credit or Debit column). CRITICAL: Statement rows typically have 3 columns at the end: [Debit, Credit, Balance]. The Balance is almost ALWAYS the very last number on the row. The transaction amount is the number BEFORE the balance. NEVER output the Balance number as the amount! If a line only contains a balance, ignore it completely.
  - For 'time', extract the exact time from the statement line (e.g. "14:30", "2:30 PM", "14:30:00"). If no time is explicitly visible on the line, leave it blank or null.
  - For 'vendor', provide ONLY a short, clean business name (e.g., "Amazon", "Uber", "Starbucks"). Strip out any transaction IDs, terminal numbers, or filler words like "POS", "UPI", "PAYMENT".
  - For 'narration', provide the exact full original text of the transaction line as it appears in the statement.
  - For 'category', you MUST map it to one of the following standard categories: Income, Food & Dining, Travel & Transportation, Software & Subscriptions, Utilities & Bills, Rent & Housing, Salary & Payroll, Office Supplies, Marketing & Advertising, Bank Fees & Charges, Transfers & Investments, Healthcare & Insurance, Shopping & Retail, Entertainment & Leisure, Taxes & Fines, or Misc. 
  - CATEGORY RULES:
    1. For generic UPI, NEFT, IMPS, RTGS, or wire transfers to/from individuals where the exact purpose is unknown, categorize as "Transfers & Investments".
    2. Try your absolute best to infer the category from the vendor name before falling back to "Misc".

  Raw Text Chunk:
  ${chunk}
  `;

    let retries = 0;
    const maxRetries = 5;
    let success = false;

    while (retries < maxRetries && !success) {
      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          allTransactions = allTransactions.concat(parsed);
        }
        success = true;
      } catch (error: any) {
        if (error?.status === 429 || error?.message?.includes('429')) {
          console.log(`Rate limit hit on chunk. Throwing to BullMQ for delayed retry...`);
          throw new Error("RATE_LIMIT");
        } else if (error?.status === 503 || error?.message?.includes('503')) {
          console.log(`Gemini is experiencing high demand (503). Throwing to BullMQ for delayed retry...`);
          throw new Error("RATE_LIMIT");
        } else {
          console.error("Failed to parse Gemini JSON for a chunk:", error);
          throw error; // Throw so the worker marks it as FAILED
        }
      }
    }

    if (!success) {
      throw new Error("Exhausted retries for chunk due to rate limits.");
    }
  }

  return allTransactions;
}
