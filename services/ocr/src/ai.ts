import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') }); // Load root .env

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash',
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          date: { type: SchemaType.STRING },
          amount: { type: SchemaType.NUMBER },
          type: { type: SchemaType.STRING, enum: ["CREDIT", "DEBIT"] },
          vendor: { type: SchemaType.STRING, description: "Short, clean vendor name without extra IDs (e.g. 'Uber', 'Amazon', 'Starbucks')" },
          category: { type: SchemaType.STRING },
          narration: { type: SchemaType.STRING, description: "The original full transaction text/narration from the statement" },
        },
        required: ["date", "amount", "type", "vendor", "category", "narration"],
      },
    },
  },
});

export async function parseTransactions(rawText: string) {
  // Chunk the raw text to avoid hitting output token limits on massive statements
  const CHUNK_SIZE = 8000; 
  const chunks = [];
  for (let i = 0; i < rawText.length; i += CHUNK_SIZE) {
    chunks.push(rawText.slice(i, i + CHUNK_SIZE));
  }

  let allTransactions: any[] = [];
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  for (const chunk of chunks) {
    const prompt = `Extract the bank statement transactions from the following raw OCR text chunk. Focus on dates, amounts, transaction types (CREDIT or DEBIT), vendor names, and categorize them into standard business expense categories (e.g. Fuel, Software, Rent, Salary, Misc). Ignore headers, footers, and non-transaction text.

  CRITICAL: 
  - For 'vendor', provide ONLY a short, clean business name (e.g., "Amazon", "Uber", "Starbucks"). Strip out any transaction IDs, terminal numbers, or filler words like "POS", "UPI", "PAYMENT".
  - For 'narration', provide the exact full original text of the transaction line as it appears in the statement.

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
          console.log(`Rate limit hit on chunk. Retrying in 70s... (Attempt ${retries + 1}/${maxRetries})`);
          await sleep(70000);
          retries++;
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
