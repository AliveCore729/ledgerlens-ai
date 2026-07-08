import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService, private redisService: RedisService) {}

  async getMetrics() {
    const totalUsers = await this.prisma.user.count();
    const totalOrgs = await this.prisma.organization.count();
    const activeSubs = await this.prisma.organization.count({ where: { subscriptionStatus: 'ACTIVE' } });
    const statements = await this.prisma.statement.count();
    
    return {
      totalUsers,
      totalOrgs,
      activeSubs,
      mrr: activeSubs * 29, // Mock calculation for now
      statementsProcessed: statements
    };
  }

  async getOrganizations() {
    return this.prisma.organization.findMany({
      include: {
        _count: { select: { organizationUsers: true, statements: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateUserRole(id: string, role: string, adminUserId: string) {
    // Only allow specific roles
    if (!['USER', 'SUPER_ADMIN'].includes(role)) {
      throw new Error("Invalid role");
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { role: role as any }
    });



    return updatedUser;
  }

  async activateSubscription(orgId: string, paymentReference: string, expiresAt: string, adminUserId: string) {
    if (!paymentReference || !expiresAt) {
      throw new Error('paymentReference and expiresAt are required');
    }

    const expiryDate = new Date(expiresAt);
    if (isNaN(expiryDate.getTime())) {
      throw new Error('Invalid expiresAt date format');
    }

    const updatedOrg = await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionExpiresAt: expiryDate,
        paymentReference,
        activatedBy: adminUserId
      }
    });

    return updatedOrg;
  }

  async getMaintenanceMode() {
    const status = await this.redisService.get('system:maintenance_mode');
    return { enabled: status === 'true' };
  }

  async setMaintenanceMode(enabled: boolean, adminUserId: string) {
    await this.redisService.set('system:maintenance_mode', enabled ? 'true' : 'false');
    return { enabled };
  }
}
