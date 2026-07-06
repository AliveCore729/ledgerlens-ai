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

    // Derive the target organization exactly as the controllers do (MVP assumes 1 user = 1 org)
    const orgUser = await this.prisma.getUserPrimaryOrg(user.userId);
    
    if (!orgUser) {
      // If the user has no org at all, some global routes might still be valid, 
      // but if a route requires an org, the controllers will handle that logic (or we can enforce it here).
      // For MVP, if they are authenticated and have no org, we allow them to pass the session guard,
      // and let the controllers return empty data or handle the lack of an org.
      return true;
    }

    return true;
  }
}
