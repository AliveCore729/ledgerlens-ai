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
    return text
      .replace(/\r/g, "")
      .replace(/\t/g, " ")
      .replace(/ +/g, " ")
      .replace(
        /([0-9]{2}-[A-Z]{3}-[0-9]{4})/g,
        "\n$1",
      )
      .trim();
  }

  async extractTransactions(text: string) {
    const normalized =
      this.normalizeText(text);

    const rawLines = normalized
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const lines: string[] = [];

    let currentLine = "";

    for (const line of rawLines) {
      const startsWithDate =
        /^\d{2}-[A-Z]{3}-\d{4}/.test(line);

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
      const isTransaction =
        /\d{2}-[A-Z]{3}-\d{4}.*?(Cr|Dr)/i.test(
          line,
        );

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

        const normalizedVendor =
          this.normalizationService.normalizeVendor(
            parsed.vendor || parsed.raw,
          );

        const category =
          this.categorizationService.categorize(
            normalizedVendor,
          ) || "UNCATEGORIZED";

        transactions.push({
          raw: parsed.raw,

          date: parsed.date,

          amount: parsed.amount,

          type: parsed.type,

          vendor: parsed.vendor,

          normalizedVendor,

          category,
        });
      }
    }

    return transactions;
  }
}