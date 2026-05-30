import { Injectable } from "@nestjs/common";

type TransactionType = "credit" | "debit" | "unknown";

export type ParsedTransaction = {
  raw: string;
  date: string; // ISO format: YYYY-MM-DD
  amount: number;
  type: TransactionType;
  vendor: string;
  category: string;
  subcategory: string;
};

const DATE_PATTERN =
  /\b(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}[-\s][A-Z]{3}[-\s]\d{2,4})\b/gi;

const AMOUNT_PATTERN =
  /(?:\d{1,3}(?:,\d{2,3})+|\d+)(?:\.\d{2})/g;

@Injectable()
export class TransactionParserService {
  parseTransaction(rawLine: string): ParsedTransaction | null {
    const normalized = this.normalizeLine(rawLine);

    const dateMatches = [...normalized.matchAll(DATE_PATTERN)];
    const dateMatch = dateMatches[0];

    if (!dateMatch) {
      return null;
    }

    const amountMatches = [...normalized.matchAll(AMOUNT_PATTERN)];

    if (!amountMatches.length) {
      return null;
    }

    const transactionAmountMatch =
      this.findTransactionAmount(normalized, amountMatches);

    const amount = this.parseAmount(transactionAmountMatch[0]);
    const type = this.detectTransactionType(normalized);
    const vendor = this.extractVendor(normalized);

    return {
      raw: normalized,
      date: this.normalizeDate(dateMatch[0]),
      amount,
      type,
      vendor,

      category: "",

      subcategory: "",
    };
  }

  parseTableRow(rawLine: string): ParsedTransaction | null {
    const normalized = this.normalizeLine(rawLine);
    const dateMatches = [...normalized.matchAll(DATE_PATTERN)];
    const dateMatch = dateMatches[0];

    if (!dateMatch) {
      return null;
    }

    const amountMatches = [...normalized.matchAll(AMOUNT_PATTERN)];
    if (!amountMatches.length) {
      return null;
    }

    if (/\bopening balance\b/i.test(normalized)) {
      return null;
    }

    const balanceMatch = amountMatches[amountMatches.length - 1];
    const hasBalanceSuffix = /(?:\b|\s)(?:CR|DR)\s*$/i.test(normalized);

    let amount = this.parseAmount(
      amountMatches.length >= 2 ? amountMatches[amountMatches.length - 2][0] : balanceMatch[0],
    );
    let type = this.detectTransactionType(normalized);

    if (hasBalanceSuffix && type === "unknown") {
      const balanceIndex = balanceMatch.index ?? normalized.length;
      const prefix = normalized.slice(0, balanceIndex).toUpperCase();
      if (/\b(?:UPI IN|DEP|CREDIT|CR|SALARY|REFUND|RECEIPT)\b/.test(prefix)) {
        type = "credit";
      } else if (/\b(?:UPIOUT|WDL|DEBIT|DR|PAYMENT|WITHDRAWAL|POS)\b/.test(prefix)) {
        type = "debit";
      }
    }

    return {
      raw: normalized,
      date: this.normalizeDate(dateMatch[0]),
      amount,
      type,
      vendor: this.extractVendor(normalized),
      category: "",
      subcategory: "",
    };
  }

  parseTransactionWithBalance(
    rawLine: string,
    currentBalance: number | null,
    previousBalance: number | null,
  ): ParsedTransaction | null {
    const normalized = this.normalizeLine(rawLine);

    const dateMatches = [...normalized.matchAll(DATE_PATTERN)];
    const dateMatch = dateMatches[0];

    if (!dateMatch) {
      return null;
    }

    // If we have both balances, calculate amount from balance delta
    if (currentBalance !== null && previousBalance !== null) {
      const calculatedAmount = Math.abs(
        Math.round((currentBalance - previousBalance) * 100) / 100,
      );

      const type = this.detectTransactionTypeWithBalance(
        normalized,
        currentBalance,
        previousBalance,
      );
      const vendor = this.extractVendor(normalized);

      return {
        raw: normalized,
        date: this.normalizeDate(dateMatch[0]),
        amount: calculatedAmount,
        type,
        vendor,
        category: "",
        subcategory: "",
      };
    }

    // Fallback to heuristic if we don't have balance context
    return this.parseTransaction(rawLine);
  }

  parseGenericTableRow(rawLine: string): ParsedTransaction | null {
    return this.parseTableRow(rawLine);
  }

  private detectTransactionTypeWithBalance(
    line: string,
    currentBalance: number,
    previousBalance: number,
  ): TransactionType {
    const diff = currentBalance - previousBalance;

    if (diff > 0) {
      return "credit";
    } else if (diff < 0) {
      return "debit";
    }

    // Fallback if diff is 0
    return this.detectTransactionType(line);
  }

  private normalizeLine(rawLine: string) {
    return rawLine
      .trim()
      .replace(/[|_]+/g, " ")
      .replace(/[₹]/g, "")
      .replace(/[‘’]/g, "'")
      .replace(/\b(\d{1,6}),(\d{2})\b(?![,.])/g, "$1.$2")
      .replace(/([A-Za-z])((?:\d{1,3},)*\d+\.\d{2})/g, "$1 $2")
      .replace(
        /((?:\d{1,3},)*\d+\.\d{2})((?:\d{1,3},)*\d+\.\d{2})/g,
        "$1 $2",
      )
      .replace(/\s+/g, " ")
      .trim();
  }

  private findTransactionAmount(
    line: string,
    amountMatches: RegExpMatchArray[],
  ) {
    const lastAmount = amountMatches[amountMatches.length - 1];

    if (
      amountMatches.length >= 2 &&
      this.looksLikeBalanceAmount(line, lastAmount)
    ) {
      return amountMatches[amountMatches.length - 2];
    }

    return lastAmount;
  }

  private looksLikeBalanceAmount(
    line: string,
    amountMatch: RegExpMatchArray,
  ) {
    const amountIndex = amountMatch.index ?? 0;
    const suffix = line
      .slice(amountIndex + amountMatch[0].length, amountIndex + amountMatch[0].length + 6)
      .toUpperCase();

    return /^\s*(CR|DR)\b/.test(suffix) || amountMatchesLikeTrailingBalance(line);
  }

  private parseAmount(amount: string) {
    return Number.parseFloat(amount.replace(/,/g, ""));
  }

  private detectTransactionType(line: string): TransactionType {
    const upper = line.toUpperCase();

    if (
      /\b(?:UPI|IMPS|NEFT|RTGS)?\/?DR\b/.test(upper) ||
      /\b(?:WDL|WITHDRAWAL|DEBIT|TO TRANSFER|ATM WDL|POS|ECS DR|PMSBY|PMJJBY)\b/.test(
        upper,
      )
    ) {
      return "debit";
    }

    if (
      /\b(?:UPI|IMPS|NEFT|RTGS)?\/?CR\b/.test(upper) ||
      /\b(?:DEP|DEPOSIT|CREDIT|BY TRANSFER|CASH DEPOSIT|SALARY|REFUND|REVERSAL|CANCELLATION)\b/.test(
        upper,
      )
    ) {
      return "credit";
    }

    const trailingType = upper.match(/\b(CR|DR)\s*$/);

    if (trailingType) {
      return trailingType[1] === "CR" ? "credit" : "debit";
    }

    return "unknown";
  }

  private extractVendor(line: string) {
    return line
      .replace(DATE_PATTERN, " ")
      .replace(AMOUNT_PATTERN, " ")
      .replace(/\b(?:CR|DR|CREDIT|DEBIT)\b/gi, " ")
      .replace(/\b(?:WDL|DEP|TFR|TRANSFER|BROUGHT|FORWARD)\b/gi, " ")
      .replace(/\b(?:AT|A\/C|ACB|BRANCH|BALANCE)\b/gi, " ")
      .replace(/\b\d{8,}\b/g, " ")
      .replace(/[^\w\s/.-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private normalizeDate(date: string) {
    // Convert to ISO format YYYY-MM-DD
    const normalized = date.replace(/\s+/g, "-").toUpperCase();
    const match = normalized.match(
      /(\d{1,2})[-](JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[-](\d{4})/i,
    );
    if (match) {
      const [, day, month, year] = match;
      const monthMap: { [key: string]: string } = {
        JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
        JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
      };
      return `${year}-${monthMap[month]}-${day.padStart(2, "0")}`;
    }
    // Already in numeric format like DD-MM-YYYY or DD/MM/YYYY
    const numMatch = normalized.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (numMatch) {
      const [, day, month, year] = numMatch;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return normalized;
  }
}

function amountMatchesLikeTrailingBalance(line: string) {
  const upper = line.toUpperCase();

  return /\d+\.\d{2}\s*(?:CR|DR)?\s*$/.test(upper);
}
