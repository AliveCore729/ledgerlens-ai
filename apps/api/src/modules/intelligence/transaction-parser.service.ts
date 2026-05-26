import { Injectable } from "@nestjs/common";

type TransactionType = "CREDIT" | "DEBIT" | "UNKNOWN";

const DATE_PATTERN =
  /\b(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}[-\s][A-Z]{3}[-\s]\d{2,4})\b/gi;

const AMOUNT_PATTERN =
  /(?:\d{1,3}(?:,\d{2,3})+|\d+)(?:\.\d{2})/g;

@Injectable()
export class TransactionParserService {
  parseTransaction(rawLine: string) {
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
      return "DEBIT";
    }

    if (
      /\b(?:UPI|IMPS|NEFT|RTGS)?\/?CR\b/.test(upper) ||
      /\b(?:DEP|DEPOSIT|CREDIT|BY TRANSFER|CASH DEPOSIT|SALARY|REFUND|REVERSAL|CANCELLATION)\b/.test(
        upper,
      )
    ) {
      return "CREDIT";
    }

    const trailingType = upper.match(/\b(CR|DR)\s*$/);

    if (trailingType) {
      return trailingType[1] === "CR" ? "CREDIT" : "DEBIT";
    }

    return "UNKNOWN";
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
    return date.replace(/\s+/g, "-").toUpperCase();
  }
}

function amountMatchesLikeTrailingBalance(line: string) {
  const upper = line.toUpperCase();

  return /\d+\.\d{2}\s*(?:CR|DR)?\s*$/.test(upper);
}
