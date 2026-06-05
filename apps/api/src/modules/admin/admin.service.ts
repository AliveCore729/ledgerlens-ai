import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getMetrics() {
    const totalUsers = await this.prisma.user.count();
    const totalOrgs = await this.prisma.organization.count();
    const activeSubs = await this.prisma.subscription.count({ where: { status: 'ACTIVE' } });
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
        subscription: true,
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
}
