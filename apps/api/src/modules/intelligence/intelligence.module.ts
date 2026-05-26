import { Module } from "@nestjs/common";

import { TransactionParserService } from "./transaction-parser.service";
import { NormalizationService } from "./normalization.service";
import { CategorizationService } from "./categorization.service";
import { GeminiService } from "./gemini.service";

@Module({
  providers: [
    TransactionParserService,
    NormalizationService,
    CategorizationService,
    GeminiService,
  ],

  exports: [
    TransactionParserService,
    NormalizationService,
    CategorizationService,
    GeminiService,
  ],
})
export class IntelligenceModule {}