import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BillingProcessor } from './billing.processor';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'billing',
    })
  ],
  providers: [BillingService, BillingProcessor],
  controllers: [BillingController]
})
export class BillingModule {
  constructor(@InjectQueue('billing') private billingQueue: Queue) {}

  async onModuleInit() {
    // Add repeatable job to run every day at midnight (UTC)
    await this.billingQueue.add('check-expiry', {}, {
      repeat: {
        pattern: '0 0 * * *'
      },
      jobId: 'daily-subscription-expiry-check' // Ensure only one instance is scheduled
    });
  }
}
