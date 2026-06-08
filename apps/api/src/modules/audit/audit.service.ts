import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logAction(organizationId: string, userId: string, action: string, resource: string) {
    try {
      await this.prisma.auditLog.create({
        data: {
          organizationId,
          userId,
          action,
          resource,
        },
      });
    } catch (error) {
      console.error('Failed to write to audit log:', error);
    }
  }

  async getLogs(organizationId: string) {
    return this.prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      take: 50,
    });
  }
}
