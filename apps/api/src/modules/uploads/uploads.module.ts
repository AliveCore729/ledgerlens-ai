import { Module } from "@nestjs/common";

import { UploadsController } from "./uploads.controller";
import { UploadsService } from "./uploads.service";

import { StatementsModule } from "../statements/statements.module";

@Module({
  imports: [StatementsModule],

  controllers: [UploadsController],

  providers: [UploadsService],
})
export class UploadsModule {}