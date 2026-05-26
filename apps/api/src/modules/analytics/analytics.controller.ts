import {
  Controller,
  Get,
  Req,
  UseGuards,
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
  async getSummary(@Req() req: any) {
    return this.analyticsService.getSummary(
      req.user.userId,
    );
  }
}