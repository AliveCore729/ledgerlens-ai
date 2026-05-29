import { Module } from "@nestjs/common";

import { StatementsService } from "./statements.service";
import { StatementParserService } from "./statement-parser.service";
import { StatementsController } from "./statements.controller";
import { OcrService } from "./ocr.service";

import { IntelligenceModule } from "../intelligence/intelligence.module";

@Module({
  imports: [IntelligenceModule],
  controllers: [StatementsController],
  providers: [
    StatementsService,
    StatementParserService,
    OcrService,
  ],

  exports: [StatementsService],
})
export class StatementsModule {}