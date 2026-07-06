import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle } from "@nestjs/throttler";
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActiveSessionGuard } from '../auth/active-session.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('billing')
@UseGuards(JwtAuthGuard, ActiveSessionGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  getSubscription(@CurrentUser() user: any) {
    return this.billingService.getSubscription(user.userId);
  }

}
