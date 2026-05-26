import { Injectable } from "@nestjs/common";

@Injectable()
export class TransactionParserService {
  parseTransaction(rawLine: string) {
    const cleaned = rawLine.trim();

    const normalized = cleaned

      // insert spaces before amounts
      .replace(/([A-Za-z])(\d+\.\d{2})/g, "$1 $2")

      // insert spaces after amounts before balance
      .replace(/(\d+\.\d{2})(\d+\.\d{2})/g, "$1 $2")

      // normalize spaces
      .replace(/\s+/g, " ")

      .trim();

    // detect transaction date
    const dateMatch =
      normalized.match(/\d{2}-[A-Z]{3}-\d{4}/);

    if (!dateMatch) {
      return null;
    }

    // extract all amounts
    const amountMatches =
      normalized.match(/\d+\.\d{2}/g) || [];

    // take last amount as transaction amount
    let amount = 0;

    

    if (amountMatches.length >= 2) {
      amount = parseFloat(
        amountMatches[
        amountMatches.length - 2
        ],
      );
    }
    // determine transaction type
    let type = "UNKNOWN";

    const upper = normalized.toUpperCase();

    const typeMatch =
      normalized.match(/(Cr|Dr)$/i);

    if (typeMatch) {
      type =
        typeMatch[1].toUpperCase() === "CR"
          ? "CREDIT"
          : "DEBIT";
    }

    // remove dates from line
    const withoutDate =
      normalized.replace(
        /\d{2}-[A-Z]{3}-\d{4}/g,
        "",
      );

    // remove amounts
    const withoutAmounts =
      withoutDate.replace(
        /\d+\.\d{2}/g,
        "",
      );

    // remove CR/DR
    const vendor = withoutAmounts
      .replace(/\b(CR|DR|CREDIT|DEBIT)\b/gi, "")
      .replace(/[0-9]/g, "")
      .replace(/[\/\-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      raw: normalized,
      date: dateMatch[0],
      amount,
      type,
      vendor,

      category: "",

      subcategory: "",
    };
  }
}