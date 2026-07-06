import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Processor('billing')
export class BillingProcessor extends WorkerHost {
  private readonly logger = new Logger(BillingProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'check-expiry':
        await this.handleCheckExpiry();
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleCheckExpiry() {
    this.logger.log('Running subscription expiry check...');
    
    try {
      const result = await this.prisma.organization.updateMany({
        where: {
          subscriptionStatus: 'ACTIVE',
          subscriptionExpiresAt: {
            lte: new Date() // If the expiry date is past (less than or equal to now)
          }
        },
        data: {
          subscriptionStatus: 'EXPIRED'
        }
      });
      
      this.logger.log(`Expired ${result.count} subscriptions.`);
    } catch (error) {
      this.logger.error('Error during subscription expiry check', error);
    }
  }
}
