import { Injectable } from "@nestjs/common";
import { TransactionParserService } from "../intelligence/transaction-parser.service";
import { NormalizationService } from "../intelligence/normalization.service";
import { IntelligenceService } from "../intelligence/intelligence.service";

@Injectable()
export class StatementParserService {
  constructor(
    private transactionParser: TransactionParserService,
    private normalizationService: NormalizationService,
    private intelligenceService: IntelligenceService,
  ) {}

  private normalizeText(text: string) {
    const datePattern = /\b(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}[-\s][A-Z]{3}[-\s]\d{2,4})\b/gi;
    return text
      .replace(/\r/g, "")
      .replace(/\t/g, " ")
      .replace(/[|]+/g, " ")
      .replace(/ +/g, " ")
      .replace(datePattern, (match, offset, fullText) =>
        this.shouldStartNewLineBeforeDate(fullText, offset) ? `\n${match}` : match,
      )
      .trim();
  }

  async extractTransactions(text: string) {
    // 1. Gather raw transactions
    const federalTransactions = this.extractFederalBankTransactions(text);
    if (federalTransactions.length) {
      return this.enrichTransactionsBatch(federalTransactions); // Batch process Federal Bank
    }

    const normalized = this.normalizeText(text);
    const rawLines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);

    const lines: string[] = [];
    let currentLine = "";

    for (const line of rawLines) {
      if (this.isNoiseLine(line)) continue;
      if (this.startsWithDate(line)) {
        if (currentLine) lines.push(currentLine.trim());
        currentLine = line;
      } else {
        currentLine += " " + line;
      }
    }
    if (currentLine) lines.push(currentLine.trim());

    const parsedTransactions: any[] = [];

    // Parse lines but DO NOT ask AI yet
    for (const line of lines) {
      if (this.looksLikeTransaction(line)) {
        const parsed = this.transactionParser.parseTransaction(line);
        if (parsed) parsedTransactions.push(parsed);
      }
    }

    // 2. Send the entire list to the Batch Processor
    return this.enrichTransactionsBatch(parsedTransactions);
  }

  private extractFederalBankTransactions(text: string) {
    // Broadened to catch FT (Fund Transfers) and other Federal Bank codes
    if (!/Federal Bank/i.test(text) && !/\b(TFR|FT|MB)\b/.test(text)) return [];

    // 🔥 THE FIX: Aggressively strip out the quotes, commas, and newlines your PDF extractor is injecting
    const normalized = text
      .replace(/[\r\n",]/g, " ") // Convert newlines, quotes, and commas into spaces
      .replace(/\s+/g, " ")      // Collapse multiple spaces into a single space
      .trim();
    
    // 1. Anchor the Math: Find the exact Opening Balance
    const obMatch = normalized.match(/Opening Balance[^\d]+([\d.]+)\s*(Cr|Dr)?/i);
    let previousBalance: number | null = null;
    if (obMatch) {
       const rawOb = Number.parseFloat(obMatch[1]);
       const indicator = obMatch[2] || 'Cr';
       previousBalance = indicator.toLowerCase() === 'dr' ? -rawOb : rawOb;
    }

    // Updated pattern to catch non-standard Transaction IDs (like S21824561) and FT types
    const transactionPattern = /(\d{2}-[A-Z]{3}-\d{4})\s*(\d{2}-[A-Z]{3}-\d{4})([\s\S]*?)(TFR[SC]?|FT|CASH|MB|CLG)\s*([A-Z0-9]{6,15})([\s\S]*?)(?=\d{2}-[A-Z]{3}-\d{4}\s*\d{2}-[A-Z]{3}-\d{4}|The Federal Bank|GRAND TOTAL|Abbreviations|$)/gi;

    const transactions: any[] = [];
    for (const match of normalized.matchAll(transactionPattern)) {
      const [, date, , particulars, tranType, tranId, amountBlock] = match;
      
      // Captures the merged Amount and Balance (e.g., "301.00 1938.64 Cr")
      const amountMatch = amountBlock.trim().match(/^(\d+\.\d{2})\s*(\d+\.\d{2})(Cr|Dr)?/i);

      if (!amountMatch) continue;

      const amount = Number.parseFloat(amountMatch[1]);
      
      // Calculate real balance (Handling negative Overdraft/Dr accounts)
      const rawBalance = Number.parseFloat(amountMatch[2]);
      const balanceIndicator = amountMatch[3] || 'Cr';
      const balance = balanceIndicator.toLowerCase() === 'dr' ? -rawBalance : rawBalance;
      
      let type = "UNKNOWN";

      // 2. The Bulletproof Math Detection
      if (previousBalance !== null) {
        // Round to 2 decimals to prevent floating point math bugs
        const diff = Math.round((balance - previousBalance) * 100) / 100;
        
        if (diff > 0) {
          type = "CREDIT";
        } else if (diff < 0) {
          type = "DEBIT";
        } else {
          // Absolute fallback if balance somehow didn't change
          type = this.detectFederalBankType(particulars);
        }
      } else {
        // Fallback for the very first row if Opening Balance wasn't found
        type = this.detectFederalBankType(particulars);
      }

      previousBalance = balance; // Store this balance for the next row's math

      const vendor = this.cleanFederalBankParticulars(particulars);
      const raw = [date, particulars, tranType, tranId, amountBlock.trim()].join(" ").replace(/\s+/g, " ").trim();

      transactions.push({ raw, date, amount, type, vendor });
    }
    return transactions;
  }

  // The Batch Merger: Combines the raw data with the JSON AI Categories
  private async enrichTransactionsBatch(parsedTransactions: any[]) {
    // 1. Prepare data mapping for AI
    const batchPayload = parsedTransactions.map((parsed, index) => ({
      id: index,
      narration: parsed.raw,
      amount: parsed.amount,
      type: parsed.type === "CREDIT" ? "CR" : "DR" as 'CR' | 'DR'
    }));

    // 2. Fetch AI Categories (lightning fast!)
    const categorizedResults = await this.intelligenceService.categorizeBatch(batchPayload);

    // 3. Merge the data together
    return parsedTransactions.map((parsed, index) => {
      const cleanVendorName = this.cleanUpiVendor(parsed.raw);
      const normalizedVendor = this.normalizationService.normalizeVendor(cleanVendorName);
      
      const aiResult = categorizedResults.find(r => r.id === index);
      const category = aiResult ? aiResult.category : 'Miscellaneous';

      return {
        raw: parsed.raw,
        date: parsed.date,
        amount: parsed.amount,
        type: parsed.type,
        vendor: normalizedVendor,
        normalizedVendor,
        category,
      };
    });
  }

  private cleanUpiVendor(narration: string): string {
    const match = narration.match(/\/([^\/]+)@[a-zA-Z0-9]+/);
    if (match && match[1]) {
      return match[1].replace(/^[0-9]{10,}$/, 'UPI Transfer').trim();
    }
    return narration;
  }

  private detectFederalBankType(particulars: string) {
    const upper = particulars.toUpperCase();
    if (/\b(?:UPI IN|UPIIN|CREDIT|CR|SALARY|INT|DEP|ACH CR)\b/.test(upper)) return "CREDIT";
    if (/\b(?:UPIOUT|OUT|DEBIT|DR|FEE|CHG|CHRG)\b/.test(upper)) return "DEBIT";
    return "UNKNOWN";
  }

  private cleanFederalBankParticulars(particulars: string) {
    return particulars.replace(/\n/g, " ").replace(/\bUPI\s*IN\b/gi, "UPI IN ").replace(/\bUPIOUT\b/gi, "UPI OUT ").replace(/\/\d{4}\b/g, " ").replace(/\s+/g, " ").trim();
  }

  private startsWithDate(line: string) {
    return /^(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}[-\s][A-Z]{3}[-\s]\d{2,4})\b/i.test(line);
  }

  private shouldStartNewLineBeforeDate(text: string, offset: number) {
    const currentLine = text.slice(0, offset).split("\n").pop() ?? "";
    if (!currentLine.trim()) return false;
    return !/(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}[-\s][A-Z]{3}[-\s]\d{2,4})\s*$/i.test(currentLine);
  }

  private looksLikeTransaction(line: string) {
    return (
      /(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}[-\s][A-Z]{3}[-\s]\d{2,4})/i.test(line) &&
      /(?:\d{1,3}(?:,\d{2,3})+|\d+)(?:\.\d{2})/.test(line) &&
      !/\b(?:statement|account|branch|ifsc|micr|page no|brought forward)\b/i.test(line)
    );
  }

  private isNoiseLine(line: string) {
    if (this.startsWithDate(line)) return false;
    return (
      /^\s*(?:page\s+no\.?|post\s+date|value\s+date|date\s+description)\b/i.test(line) ||
      /\b(?:WDL\s*TFR|WDLTFR|DEP\s*TFR|DEPTFR)\b/i.test(line) ||
      /^\s*AT\s+\d+\s+/i.test(line)
    );
  }
}