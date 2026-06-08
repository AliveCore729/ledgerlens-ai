import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  getSubscription(@CurrentUser() user: any) {
    return this.billingService.getSubscription(user.userId);
  }

  @Post('create-checkout')
  createCheckoutSession(@CurrentUser() user: any, @Body() body: { priceId: string }) {
    return this.billingService.createCheckoutSession(user.userId, body.priceId);
  }

  @Post('create-portal')
  createPortalSession(@CurrentUser() user: any) {
    return this.billingService.createPortalSession(user.userId);
  }
}
