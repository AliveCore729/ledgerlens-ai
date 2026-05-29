import {
  Controller,
  Get,
  Req,
  UseGuards,
  Query
} from "@nestjs/common";

import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("analytics")
export class AnalyticsController {
  constructor(
    private analyticsService: AnalyticsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("summary")
  async getSummary(
    @Req() req: any, 
    @Query('statementId') statementId?: string // <-- Add this query param
  ) {
    return this.analyticsService.getSummary(
      req.user.userId,
      statementId
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get("transactions")
  async getTransactions(@Req() req: any) {
    return this.analyticsService.getTransactions(
      req.user.userId,
    );
  }
  
}
