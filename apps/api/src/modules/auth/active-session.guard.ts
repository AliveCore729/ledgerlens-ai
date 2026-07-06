import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActiveSessionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user || !user.userId) {
      throw new UnauthorizedException('Authentication required');
    }

    // Verify the user still exists in the database
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true }
    });

    if (!dbUser) {
      throw new UnauthorizedException('Account has been deleted or disabled');
    }

    // If the JWT role doesn't match the DB role, their session is stale (e.g. they were demoted)
    if (dbUser.role !== user.role) {
      throw new UnauthorizedException('Session expired due to role change. Please log in again.');
    }

    // Verify organization membership if the token has an organizationId
    if (user.organizationId) {
      const orgUser = await this.prisma.organizationUser.findUnique({
        where: {
          userId_organizationId: {
            userId: user.userId,
            organizationId: user.organizationId
          }
        }
      });
      
      if (!orgUser) {
        throw new UnauthorizedException('You have been removed from this organization');
      }
    }

    return true;
  }
}
