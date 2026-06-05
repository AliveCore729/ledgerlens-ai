import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async getSubscription(userId: string) {
    const userOrg = await this.prisma.organizationUser.findFirst({
      where: { userId },
      include: {
        organization: {
          include: {
            subscription: true,
            _count: { select: { statements: true } }
          }
        }
      }
    });

    if (!userOrg || !userOrg.organization.subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const sub = userOrg.organization.subscription;
    const statementsProcessed = userOrg.organization._count.statements;
    
    // 2 Plans logic: Basic (limited) and Pro (unlimited)
    const isPro = sub.plan === 'PRO';
    const statementLimit = 50; // Basic plan limit

    return {
      plan: isPro ? 'PRO' : 'BASIC',
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd,
      usage: {
        statementsProcessed,
        statementLimit,
        isUnlimited: isPro,
        percentage: isPro ? 0 : Math.min(100, Math.round((statementsProcessed / statementLimit) * 100))
      }
    };
  }
}
