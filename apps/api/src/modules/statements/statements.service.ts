import { Injectable } from "@nestjs/common";

import * as fs from "fs";

import pdfParse from "pdf-parse";

import { OcrService } from "./ocr.service";
import { StatementParserService } from "./statement-parser.service";

@Injectable()
export class StatementsService {
  constructor(
    private ocrService: OcrService,
    private parserService: StatementParserService,
  ) {}

  async processStatement(filePath: string) {
    const fileBuffer = fs.readFileSync(filePath);

    let extractedText = "";

    if (filePath.endsWith(".pdf")) {
      const pdfData = await pdfParse(fileBuffer);

      extractedText = pdfData.text;

      if (this.isProbablyScannedPdf(extractedText)) {
        extractedText =
          await this.ocrService.extractTextFromPdf(filePath);
      }
    } else {
      extractedText =
        await this.ocrService.extractTextFromImage(filePath);
    }

    const transactions =
      await this.parserService.extractTransactions(extractedText);

    return {
      extractedText,
      transactions,
    };
  }

  private isProbablyScannedPdf(text: string) {
    const meaningfulCharacters =
      text.replace(/\s/g, "").length;

    return meaningfulCharacters < 50;
  }
}
