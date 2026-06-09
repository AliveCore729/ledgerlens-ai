import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private stripe: any;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
      apiVersion: '2025-01-27.acacia' as any, // use latest or cast to any to bypass type check
    });
  }

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
    
    const isPro = sub.plan === 'PRO';
    const statementLimit = 50;

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

  async createCheckoutSession(userId: string, priceId: string) {
    const userOrg = await this.prisma.organizationUser.findFirst({
      where: { userId },
      include: { organization: { include: { subscription: true } }, user: true }
    });

    if (!userOrg) throw new NotFoundException('User organization not found');

    let customerId = userOrg.organization.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: userOrg.user.email,
        metadata: { organizationId: userOrg.organizationId },
      });
      customerId = customer.id;

      await this.prisma.subscription.update({
        where: { organizationId: userOrg.organizationId },
        data: { stripeCustomerId: customerId }
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/billing?success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/billing?canceled=true`,
      metadata: { organizationId: userOrg.organizationId }
    });

    return { url: session.url };
  }

  async createPortalSession(userId: string) {
    const userOrg = await this.prisma.organizationUser.findFirst({
      where: { userId },
      include: { organization: { include: { subscription: true } }, user: true }
    });

    if (!userOrg) throw new NotFoundException('Organization not found');

    let customerId = userOrg.organization.subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: userOrg.user.email,
        metadata: { organizationId: userOrg.organizationId },
      });
      customerId = customer.id;

      await this.prisma.subscription.update({
        where: { organizationId: userOrg.organizationId },
        data: { stripeCustomerId: customerId }
      });
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/billing`,
    });

    return { url: session.url };
  }
}
