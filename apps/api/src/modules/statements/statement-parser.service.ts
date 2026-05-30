import { Injectable } from "@nestjs/common";
import { TransactionParserService } from "../intelligence/transaction-parser.service";
import { NormalizationService } from "../intelligence/normalization.service";
import { CategorizationService } from "../intelligence/categorization.service";
import { GeminiService } from "../intelligence/gemini.service";

const DATE_PATTERN_SOURCE =
  "(?:\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4}|\\d{1,2}[-\\s][A-Z]{3}[-\\s]\\d{2,4})";
const DATE_PATTERN = new RegExp(DATE_PATTERN_SOURCE, "gi");

@Injectable()
export class StatementParserService {
  private categoryCache = new Map<string, string>();
  private readonly tableHeaderPattern = /\b(date|value date|particulars|description)\b/i;
  private readonly tableBalancePattern = /\b(withdrawals?|deposits?|balance|cr\s*\/\s*dr|dr\s*\/\s*cr)\b/i;

  constructor(
    private transactionParser: TransactionParserService,
    private normalizationService: NormalizationService,
    private categorizationService: CategorizationService,
    private geminiService: GeminiService,
  ) {}

  private normalizeText(text: string) {
    return text
      .replace(/\r/g, "")
      .replace(/\t/g, " ")
      .replace(/[|]+/g, " ")
      .replace(/ +/g, " ")
      .replace(DATE_PATTERN, (match, offset, fullText) =>
        this.shouldStartNewLineBeforeDate(fullText, offset) ? `\n${match}` : match,
      )
      .trim();
  }

  async extractTransactions(
    text: string,
    options?: { layoutPreferred?: boolean },
  ) {
    const layoutTransactions = options?.layoutPreferred
      ? this.extractLayoutTransactions(text)
      : [];
    if (layoutTransactions.length) {
      return this.enrichTransactionsBatch(layoutTransactions);
    }

    const statementText = this.normalizeText(text);
    const parsedTransactions = this.extractGenericTransactions(statementText);

    if (parsedTransactions.length) {
      return this.enrichTransactionsBatch(parsedTransactions);
    }

    const federalTransactions = this.extractFederalBankTransactions(text);

    return this.enrichTransactionsBatch(federalTransactions);
  }

  private extractLayoutTransactions(text: string) {
    const normalized = this.normalizeText(text);
    const rawLines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);

    const tableHeaderFound = rawLines.some((line) =>
      this.tableHeaderPattern.test(line) &&
      (this.tableBalancePattern.test(line) || /\btran id\b/i.test(line)),
    );

    if (!tableHeaderFound) {
      return [];
    }

    const lines: string[] = [];
    let currentLine = "";

    for (const line of rawLines) {
      if (this.isLayoutNoiseLine(line)) continue;
      if (this.startsWithDate(line)) {
        if (currentLine) lines.push(currentLine.trim());
        currentLine = line;
      } else {
        currentLine += " " + line;
      }
    }
    if (currentLine) lines.push(currentLine.trim());

    const parsedTransactions: any[] = [];
    let previousBalance: number | null = this.extractOpeningBalance(text);

    for (const line of lines) {
      if (this.looksLikeTransaction(line)) {
        const parsed = this.transactionParser.parseTableRow(line);
        if (!parsed) continue;

        if (/\bopening balance\b/i.test(line)) {
          continue;
        }

        const trailingBalance = this.extractTrailingBalance(line);
        const adjusted = this.adjustParsedTransactionWithBalance(
          parsed,
          line,
          trailingBalance,
          previousBalance,
        );

        parsedTransactions.push(adjusted);

        if (trailingBalance !== null) {
          previousBalance = trailingBalance;
        }
      }
    }

    return parsedTransactions;
  }

  private extractFederalLayoutTransactions(text: string) {
    const lines = text
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    const hasFederalLayout = lines.some((line) =>
      this.tableHeaderPattern.test(line) &&
      this.tableBalancePattern.test(line),
    );

    if (!hasFederalLayout) {
      return [];
    }

    const parsedTransactions: any[] = [];
    let previousBalance: number | null = this.extractOpeningBalance(text);

    for (const line of lines) {
      if (!this.looksLikeTransaction(line) || this.isLayoutNoiseLine(line)) {
        continue;
      }

      const parsed = this.transactionParser.parseTableRow(line);
      if (!parsed) {
        continue;
      }

      const adjusted = this.adjustParsedTransactionWithBalance(
        parsed,
        line,
        this.extractTrailingBalance(line),
        previousBalance,
      );

      parsedTransactions.push(adjusted);

      const trailingBalance = this.extractTrailingBalance(line);
      if (trailingBalance !== null) {
        previousBalance = trailingBalance;
      }
    }

    return parsedTransactions;
  }

  private extractGenericTransactions(text: string) {
    const rawLines = text.split("\n").map((line) => line.trim()).filter(Boolean);

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

    const transactionCandidates = lines.flatMap((line) => this.splitMergedTransactionLines(line));

    const parsedTransactions: any[] = [];
    let previousBalance: number | null = null;

    for (const line of transactionCandidates) {
      if (this.looksLikeTransaction(line)) {
        const trailingBalance = this.extractTrailingBalance(line);
        const parsed = this.transactionParser.parseTransactionWithBalance(
          line,
          trailingBalance,
          previousBalance,
        );
        if (!parsed) continue;

        if (/\bopening balance\b/i.test(line)) {
          continue;
        }

        const adjusted = this.adjustParsedTransactionWithBalance(
          parsed,
          line,
          trailingBalance,
          previousBalance,
        );

        parsedTransactions.push(adjusted);

        if (trailingBalance !== null) {
          previousBalance = trailingBalance;
        }
      }
    }

    return parsedTransactions;
  }

  private extractFederalBankTransactions(text: string) {
    // Federal-specific parser should run for Federal Bank statements.
    // Some PDFs contain the IFSC code (FDRL...) but not the literal "Federal Bank" string,
    // so also accept the bank's IFSC token to detect Federal Bank statements.
    if (!/Federal Bank/i.test(text) && !/\bFDRL\b/i.test(text)) return [];

    // 🔥 THE FIX: Aggressively strip out the quotes, commas, and newlines your PDF extractor is injecting
    const normalized = text
      .replace(/[\r\n",]/g, " ") // Convert newlines, quotes, and commas into spaces
      .replace(/\s+/g, " ")      // Collapse multiple spaces into a single space
      .trim();
    
    // 1. Anchor the Math: Find the exact Opening Balance
    const obMatch = normalized.match(/Opening Balance\s*([\d.]+)\s*(Cr|Dr)?/i);
    let previousBalance: number | null = null;
    if (obMatch) {
       const rawOb = Number.parseFloat(obMatch[1]);
       const indicator = obMatch[2] || 'Cr';
       previousBalance = indicator.toLowerCase() === 'dr' ? -rawOb : rawOb;
    }

    // Updated pattern to catch non-standard Transaction IDs (like S21824561) and FT types
    const transactionPattern = /(\d{2}-[A-Z]{3}-\d{4})\s*(\d{2}-[A-Z]{3}-\d{4})([\s\S]*?)(TFR[SC]?|FT|CASH|MB|CLG)([\s\S]*?)(?=\d{2}-[A-Z]{3}-\d{4}\s*\d{2}-[A-Z]{3}-\d{4}|The Federal Bank|GRAND TOTAL|Abbreviations|$)/gi;

    const transactions: any[] = [];
    for (const match of normalized.matchAll(transactionPattern)) {
      const [, date, , particulars, tranType, transactionTail] = match;

      if (/\bopening balance\b/i.test(particulars)) {
        continue;
      }

      const balanceMatch = transactionTail.trim().match(/(\d+\.\d{2})(Cr|Dr)?\s*$/i);

      if (!balanceMatch) continue;

      // Calculate real balance (Handling negative Overdraft/Dr accounts)
      const rawBalance = Number.parseFloat(balanceMatch[1]);
      const balanceIndicator = balanceMatch[2] || 'Cr';
      const balance = balanceIndicator.toLowerCase() === 'dr' ? -rawBalance : rawBalance;

      let amount = 0;
      if (previousBalance !== null) {
        amount = Math.abs(Math.round((balance - previousBalance) * 100) / 100);
      } else {
        const amountMatch = transactionTail.match(/(\d+\.\d{2})(?=\d+\.\d{2}(?:Cr|Dr)?\s*$)/i);
        amount = amountMatch ? Number.parseFloat(amountMatch[1]) : Math.abs(balance);
      }
      
      let type = "unknown";

      // 2. The Bulletproof Math Detection
      if (previousBalance !== null) {
        // Round to 2 decimals to prevent floating point math bugs
        const diff = Math.round((balance - previousBalance) * 100) / 100;
        
        if (diff > 0) {
          type = "credit";
        } else if (diff < 0) {
          type = "debit";
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
      const raw = [date, particulars, tranType, transactionTail.trim()].join(" ").replace(/\s+/g, " ").trim();

      transactions.push({ raw, date, amount, type, vendor });
    }
    return transactions;
  }

  // The Batch Merger: Combines the raw data with the JSON AI Categories
  private async enrichTransactionsBatch(parsedTransactions: any[]) {
    const enrichedTransactions: any[] = [];

    for (const parsed of parsedTransactions) {
      const cleanVendorName = this.cleanUpiVendor(parsed.vendor || parsed.raw);
      const normalizedVendor = this.normalizationService.normalizeVendor(cleanVendorName);

      const category = await this.resolveCategory(parsed.raw, normalizedVendor);

      enrichedTransactions.push({
        raw: parsed.raw,
        date: parsed.date,
        amount: parsed.amount,
        type: parsed.type,
        vendor: normalizedVendor,
        normalizedVendor,
        category,
      });
    }

    return enrichedTransactions;
  }

  private async resolveCategory(rawTransaction: string, normalizedVendor: string) {
    const cacheKey = `${normalizedVendor}::${rawTransaction}`.toUpperCase();
    const cachedCategory = this.categoryCache.get(cacheKey);

    if (cachedCategory) {
      return cachedCategory;
    }

    const ruleBasedCategory = this.categorizationService.categorize(normalizedVendor);

    if (ruleBasedCategory !== "UNCATEGORIZED") {
      this.categoryCache.set(cacheKey, ruleBasedCategory);
      return ruleBasedCategory;
    }

    const aiResult = await this.geminiService.categorizeTransaction(rawTransaction);

    if (aiResult?.category) {
      const resolvedCategory = String(aiResult.category).toUpperCase();
      this.categoryCache.set(cacheKey, resolvedCategory);
      return resolvedCategory;
    }

    this.categoryCache.set(cacheKey, "UNCATEGORIZED");
    return "UNCATEGORIZED";
  }

  private cleanUpiVendor(narration: string): string {
    return narration
      .replace(/\/([^\/]+)@[a-zA-Z0-9]+/g, " UPI TRANSFER ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private extractOpeningBalance(text: string) {
    const match = text.match(/Opening Balance\s*([\d,]+(?:\.\d{2})?)\s*(Cr|Dr)?/i);
    if (!match) {
      return null;
    }

    const value = Number.parseFloat(match[1].replace(/,/g, ""));
    if (!Number.isFinite(value)) {
      return null;
    }

    return (match[2] || "Cr").toLowerCase() === "dr" ? -value : value;
  }

  private detectFederalBankType(particulars: string) {
    const upper = particulars.toUpperCase();
    if (/\b(?:UPI IN|UPIIN|CREDIT|CR|SALARY|INT|DEP|ACH CR)\b/.test(upper)) return "credit";
    if (/\b(?:UPIOUT|OUT|DEBIT|DR|FEE|CHG|CHRG)\b/.test(upper)) return "debit";
    return "unknown";
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
      new RegExp(DATE_PATTERN_SOURCE, "i").test(line) &&
      /(?:\d{1,3}(?:,\d{2,3})+|\d+)(?:[.,]\d{2})/.test(line) &&
      !/\b(?:statement|account|branch|ifsc|micr|page no|brought forward)\b/i.test(line)
    );
  }

  private isLayoutNoiseLine(line: string) {
    return (
      /^\s*(?:statement of account|the federal bank|name\s*:|branch name\s*:|account number\s*:|effective available balance|date of issue\s*:|page\s+\d+)/i.test(
        line,
      ) ||
      /^\s*(?:date|value date|particulars|tran type|tran id|cheque details|withdrawals?|deposits?|balance|dr\s*\/\s*cr)\b/i.test(
        line,
      )
    );
  }

  private extractTrailingBalance(line: string) {
    const match = line.match(/((?:\d{1,3}(?:,\d{2,3})+|\d+)(?:[.,]\d{2}))\s*(CR|DR)?\s*$/i);
    if (!match) {
      return null;
    }

    const value = Number.parseFloat(match[1].replace(/,/g, ""));
    if (!Number.isFinite(value)) {
      return null;
    }

    const indicator = (match[2] || "CR").toUpperCase();
    return indicator === "DR" ? -value : value;
  }

  private adjustParsedTransactionWithBalance(
    parsed: any,
    line: string,
    currentBalance: number | null,
    previousBalance: number | null,
  ) {
    if (currentBalance === null || previousBalance === null) {
      return parsed;
    }

    const diff = Math.round((currentBalance - previousBalance) * 100) / 100;
    if (diff === 0) {
      return parsed;
    }

    const inferredType = diff > 0 ? "credit" : "debit";
    const inferredAmount = Math.abs(diff);
    parsed.type = inferredType;

    const amountCount = (line.match(/(?:\d{1,3}(?:,\d{2,3})+|\d+)(?:[.,]\d{2})/g) || []).length;
    const amountDelta = Math.abs((parsed.amount || 0) - inferredAmount);

    if (amountCount >= 2 && amountDelta > 0.009) {
      parsed.amount = inferredAmount;
    }

    return parsed;
  }

  private splitMergedTransactionLines(line: string) {
    const dateMatches = [...line.matchAll(DATE_PATTERN)];

    if (dateMatches.length <= 1) {
      return [line];
    }

    const segments: string[] = [];

    for (let index = 0; index < dateMatches.length; index++) {
      const start = dateMatches[index].index ?? 0;
      const end = dateMatches[index + 1]?.index ?? line.length;
      const segment = line.slice(start, end).trim();

      if (segment) {
        segments.push(segment);
      }
    }

    return segments;
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