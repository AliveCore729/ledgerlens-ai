import { Injectable } from "@nestjs/common";

import { TransactionParserService } from "../intelligence/transaction-parser.service";
import { NormalizationService } from "../intelligence/normalization.service";
import { CategorizationService } from "../intelligence/categorization.service";
import { GeminiService } from "../intelligence/gemini.service";

@Injectable()
export class StatementParserService {
  constructor(
    private transactionParser: TransactionParserService,

    private normalizationService: NormalizationService,

    private categorizationService: CategorizationService,

    private geminiService: GeminiService,
  ) { }

  private normalizeText(text: string) {
    const datePattern =
      /\b(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}[-\s][A-Z]{3}[-\s]\d{2,4})\b/gi;

    return text
      .replace(/\r/g, "")
      .replace(/\t/g, " ")
      .replace(/[|]+/g, " ")
      .replace(/ +/g, " ")
      .replace(datePattern, (match, offset, fullText) =>
        this.shouldStartNewLineBeforeDate(fullText, offset)
          ? `\n${match}`
          : match,
      )
      .trim();
  }

  async extractTransactions(text: string) {
    const federalTransactions =
      this.extractFederalBankTransactions(text);

    if (federalTransactions.length) {
      return federalTransactions;
    }

    const normalized =
      this.normalizeText(text);

    const rawLines = normalized
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const lines: string[] = [];

    let currentLine = "";

    for (const line of rawLines) {
      if (this.isNoiseLine(line)) {
        continue;
      }

      const startsWithDate = this.startsWithDate(line);

      if (startsWithDate) {
        if (currentLine) {
          lines.push(currentLine.trim());
        }

        currentLine = line;
      } else {
        currentLine += " " + line;
      }
    }

    if (currentLine) {
      lines.push(currentLine.trim());
    }

    const transactions: any[] = [];



    for (const line of lines) {
      const isTransaction = this.looksLikeTransaction(line);

      if (isTransaction) {
        const parsed =
          this.transactionParser.parseTransaction(
            line,
          );

        if (!parsed) continue;

        // const aiData =
        //   await this.geminiService.categorizeTransaction(
        //     parsed.raw,
        //   );

        // parsed.vendor = aiData.vendor;

        // parsed.category = aiData.category;

        // parsed.subcategory =
        //   aiData.subcategory;

        transactions.push(this.enrichTransaction(parsed));
      }
    }

    return transactions;
  }

  private extractFederalBankTransactions(text: string) {
    if (!/Federal Bank/i.test(text) && !/\bTFR[SC]\d{8}/.test(text)) {
      return [];
    }

    const normalized = text
      .replace(/\r/g, "")
      .replace(/\t/g, " ")
      .replace(/ +/g, " ");

    const transactionPattern =
      /(\d{2}-[A-Z]{3}-\d{4})(\d{2}-[A-Z]{3}-\d{4})([\s\S]*?)(TFR[SC])(\d{8})([\s\S]*?)(?=\d{2}-[A-Z]{3}-\d{4}\d{2}-[A-Z]{3}-\d{4}|The Federal Bank Ltd\.|GRAND TOTAL|Abbreviations Used:|DISCLAIMER:|$)/gi;

    const transactions: any[] = [];

    for (const match of normalized.matchAll(transactionPattern)) {
      const [, date, , particulars, tranType, tranId, amountBlock] =
        match;

      const amountMatch =
        amountBlock.trim().match(/^(\d+\.\d{2})(\d+\.\d{2})(Cr|Dr)?/i);

      if (!amountMatch) {
        continue;
      }

      const amount = Number.parseFloat(amountMatch[1]);
      const type = this.detectFederalBankType(particulars);
      const vendor = this.cleanFederalBankParticulars(particulars);
      const raw = [
        date,
        particulars,
        tranType,
        tranId,
        amountBlock.trim(),
      ]
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      transactions.push(
        this.enrichTransaction({
          raw,
          date,
          amount,
          type,
          vendor,
        }),
      );
    }

    return transactions;
  }

  private detectFederalBankType(particulars: string) {
    const upper = particulars.toUpperCase();

    if (/\b(?:UPIOUT|OUT|DEBIT|DR)\b/.test(upper)) {
      return "DEBIT";
    }

    if (/\b(?:UPI IN|UPIIN|CREDIT|CR)\b/.test(upper)) {
      return "CREDIT";
    }

    return "UNKNOWN";
  }

  private cleanFederalBankParticulars(particulars: string) {
    return particulars
      .replace(/\n/g, " ")
      .replace(/\bUPI\s*IN\b/gi, "UPI IN ")
      .replace(/\bUPIOUT\b/gi, "UPI OUT ")
      .replace(/\/\d{4}\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private enrichTransaction(parsed: any) {
    const normalizedVendor =
      this.normalizationService.normalizeVendor(
        parsed.vendor || parsed.raw,
      );

    const category =
      this.categorizationService.categorize(
        normalizedVendor,
      ) || "UNCATEGORIZED";

    return {
      raw: parsed.raw,

      date: parsed.date,

      amount: parsed.amount,

      type: parsed.type,

      vendor: parsed.vendor,

      normalizedVendor,

      category,
    };
  }

  private startsWithDate(line: string) {
    return /^(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}[-\s][A-Z]{3}[-\s]\d{2,4})\b/i.test(
      line,
    );
  }

  private shouldStartNewLineBeforeDate(text: string, offset: number) {
    const currentLine =
      text.slice(0, offset).split("\n").pop() ?? "";

    if (!currentLine.trim()) {
      return false;
    }

    return !/(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}[-\s][A-Z]{3}[-\s]\d{2,4})\s*$/i.test(
      currentLine,
    );
  }

  private looksLikeTransaction(line: string) {
    return (
      /(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}[-\s][A-Z]{3}[-\s]\d{2,4})/i.test(
        line,
      ) &&
      /(?:\d{1,3}(?:,\d{2,3})+|\d+)(?:\.\d{2})/.test(line) &&
      !/\b(?:statement|account|branch|ifsc|micr|page no|brought forward)\b/i.test(
        line,
      )
    );
  }

  private isNoiseLine(line: string) {
    if (this.startsWithDate(line)) {
      return false;
    }

    return (
      /^\s*(?:page\s+no\.?|post\s+date|value\s+date|date\s+description)\b/i.test(
        line,
      ) ||
      /\b(?:WDL\s*TFR|WDLTFR|DEP\s*TFR|DEPTFR)\b/i.test(line) ||
      /^\s*AT\s+\d+\s+/i.test(line)
    );
  }
}
