import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActiveSubscriptionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orgId = user?.organizationId || request.headers['organization-id'];
    
    if (!user || !orgId) {
      return true; // Not an org-scoped route, or no token
    }

    const orgUser = await this.prisma.organizationUser.findUnique({
      where: {
        userId_organizationId: {
          userId: user.userId,
          organizationId: orgId
        }
      },
      include: {
        organization: {
          select: { subscriptionStatus: true }
        }
      }
    });

    if (orgUser && orgUser.organization.subscriptionStatus !== 'ACTIVE') {
      throw new ForbiddenException('Your organization subscription is not active. Mutations are disabled in read-only mode.');
    }

    return true;
  }
}
