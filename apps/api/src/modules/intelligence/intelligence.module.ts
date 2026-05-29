import { Module } from '@nestjs/common';
import { TransactionParserService } from './transaction-parser.service';
import { NormalizationService } from './normalization.service';
import { CategorizationService } from './categorization.service';
import { GeminiService } from './gemini.service';
import { IntelligenceService } from './intelligence.service'; // <-- 1. Import it here

@Module({
  providers: [
    TransactionParserService,
    NormalizationService,
    CategorizationService,
    GeminiService,
    IntelligenceService, // <-- 2. Add to providers
  ],
  exports: [
    TransactionParserService,
    NormalizationService,
    CategorizationService,
    GeminiService,
    IntelligenceService, // <-- 3. Add to exports so StatementsModule can use it!
  ],
})
export class IntelligenceModule {}