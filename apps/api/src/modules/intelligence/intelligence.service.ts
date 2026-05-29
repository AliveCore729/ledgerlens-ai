import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class IntelligenceService {
  private readonly logger = new Logger(IntelligenceService.name);
  private genAI: GoogleGenerativeAI;

  private readonly CATEGORIES = [
    'Salary', 'Fuel', 'Rent', 'Food', 'Electricity', 'Insurance',
    'Loan', 'Tax', 'Purchase', 'Sales', 'Miscellaneous', 'Transfer', 'ATM'
  ];

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }
  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private runLocalRuleEngine(narration: string, type: string): string | null {
    const text = narration.toLowerCase();

    if (type === 'CR') {
      if (text.includes('salary') || text.includes('payroll')) return 'Salary';
      if (text.includes('int-') || text.includes('interest')) return 'Miscellaneous';
      if (text.includes('refund')) return 'Miscellaneous';
      if (text.includes('upi in') || text.includes('payment from')) return 'Transfer'; 
    }

    if (type === 'DR') {
      if (text.match(/\b(zomato|swiggy|kfc|mcdonalds|starbucks|restaurant)\b/)) return 'Food';
      if (text.match(/\b(hpcl|bpcl|ioc|petrol|fuel|pump)\b/)) return 'Fuel';
      if (text.match(/\b(amazon|flipkart|myntra|reliance|dmart)\b/)) return 'Purchase';
      if (text.match(/\b(bescom|electricity|power|water|utility)\b/)) return 'Electricity';
      if (text.match(/\b(lic|insurance|policy)\b/)) return 'Insurance';
      if (text.match(/\b(atm|cash|csh|wdl)\b/)) return 'ATM';
      if (text.match(/\b(tax|gst|tds|incometax)\b/)) return 'Tax';
      if (text.match(/\b(emi|loan|bajaj|hdfc loan)\b/)) return 'Loan';
      if (text.match(/\b(irctc|uber|ola)\b/)) return 'Miscellaneous'; 
    }

    return null;
  }

  // 🔥 The New SaaS Batch Processor
  // 🔥 The Enterprise Auto-Retry Batch Processor
  async categorizeBatch(transactions: { id: number, narration: string, amount: number, type: 'CR' | 'DR' }[]): Promise<{ id: number, category: string }[]> {
    const results: { id: number, category: string }[] = [];
    const aiQueue: { id: number, narration: string, amount: number, type: 'CR' | 'DR' }[] = [];

    // 1. Instantly process easy transactions locally (0ms delay)
    for (const tx of transactions) {
      const localCategory = this.runLocalRuleEngine(tx.narration, tx.type);
      if (localCategory) {
        results.push({ id: tx.id, category: localCategory });
      } else {
        aiQueue.push(tx); // Queue complex ones for Gemini
      }
    }

    if (aiQueue.length === 0) return results;

    this.logger.log(`Processing ${aiQueue.length} complex transactions via AI Batching...`);

    // 2. Chunk remaining transactions into arrays of 50
    const CHUNK_SIZE = 50;
    for (let i = 0; i < aiQueue.length; i += CHUNK_SIZE) {
      const chunk = aiQueue.slice(i, i + CHUNK_SIZE);
      
      let success = false;
      let retries = 0;

      // 🔥 Auto-Retry Loop: Try up to 3 times if we get Rate Limited
      while (!success && retries < 3) {
        try {
          // Standard 6-second pause between normal chunks
          if (i > 0 && retries === 0) {
            await this.sleep(6000); 
          }

          const model = this.genAI.getGenerativeModel({ 
            model: 'gemini-2.0-flash',
            generationConfig: { responseMimeType: "application/json" } 
          });

          const prompt = `
            You are an expert Chartered Accountant. Categorize these ${chunk.length} bank transactions.
            You MUST choose exactly ONE category from this list: ${this.CATEGORIES.join(', ')}.
            
            Transactions:
            ${JSON.stringify(chunk.map(t => ({ id: t.id, narration: t.narration, amount: t.amount, type: t.type })))}
            
            Respond ONLY with a JSON array of objects. Each object must have an 'id' and 'category'.
            Example Output: [{"id": 0, "category": "Food"}, {"id": 1, "category": "Salary"}]
          `;

          const response = await model.generateContent(prompt);
          const responseText = response.response.text();
          const parsedCategories = JSON.parse(responseText);

          // Merge AI decisions back into our results array
          for (const item of parsedCategories) {
             const validCategory = this.CATEGORIES.includes(item.category) ? item.category : 'Miscellaneous';
             results.push({ id: item.id, category: validCategory });
          }
          
          success = true; // It worked! Break the retry loop.

        } catch (error: any) {
          // If Google cuts us off, catch the 429 error and pause for 30 seconds
          if (error.message.includes('429') || error.message.includes('Quota')) {
            retries++;
            this.logger.warn(`Google Rate Limit Hit! Pausing for 30 seconds... (Retry ${retries}/3)`);
            await this.sleep(30000); 
          } else {
            // For other severe errors (like invalid JSON), fail safely
            this.logger.error(`AI Batch parsing failed! Error: ${error.message}`);
            break; 
          }
        }
      }
      
      // If we completely fail 3 times, safely default this chunk to Misc
      if (!success) {
         this.logger.error('Max retries reached. Defaulting this chunk to Miscellaneous.');
         for (const tx of chunk) {
            results.push({ id: tx.id, category: 'Miscellaneous' });
         }
      }
    }

    return results;
  }
}