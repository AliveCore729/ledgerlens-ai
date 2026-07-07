import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async getSubscription(userId: string) {
    const userOrg = await this.prisma.getUserPrimaryOrg(userId, {
      include: {
        organization: {
          include: {
            _count: { select: { statements: true } }
          }
        }
      }
    });

    if (!userOrg) {
      throw new NotFoundException('Organization not found');
    }

    const org = userOrg.organization;
    const statementsProcessed = org._count.statements;
    
    // In manual mode, we just check if it's ACTIVE and set some limits based on org logic
    const isActive = org.subscriptionStatus === 'ACTIVE';
    const statementLimit = isActive ? 1000 : 1;

    return {
      status: org.subscriptionStatus,
      currentPeriodEnd: org.subscriptionExpiresAt,
      paymentReference: org.paymentReference,
      usage: {
        statementsProcessed,
        statementLimit,
        isUnlimited: isActive,
        percentage: isActive ? 0 : Math.min(100, Math.round((statementsProcessed / statementLimit) * 100))
      }
    };
  }

}
