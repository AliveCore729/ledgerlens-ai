import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  async getTeam(userId: string) {
    // For MVP, grab the user's first organization
    const userOrg = await this.prisma.organizationUser.findFirst({
      where: { userId },
      include: { organization: true },
    });

    if (!userOrg) {
      return [];
    }

    const team = await this.prisma.organizationUser.findMany({
      where: { organizationId: userOrg.organizationId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return team.map(member => ({
      id: member.user.id,
      name: `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || 'Pending User',
      email: member.user.email,
      role: member.role,
      status: 'Active',
      joinedAt: member.user.createdAt,
    }));
  }

  async inviteMember(userId: string, email: string, role: string) {
    // Find the current user's org
    const userOrg = await this.prisma.organizationUser.findFirst({
      where: { userId },
    });

    if (!userOrg) throw new BadRequestException('User does not belong to an organization');

    // Check if invited user exists
    let invitedUser = await this.prisma.user.findUnique({ where: { email } });

    if (!invitedUser) {
      // Mock create a pending user (in reality you'd send an email invite)
      invitedUser = await this.prisma.user.create({
        data: {
          email,
          passwordHash: 'pending', // fake hash
          firstName: 'Invited',
          lastName: 'User',
        }
      });
    }

    // Link them
    await this.prisma.organizationUser.create({
      data: {
        userId: invitedUser.id,
        organizationId: userOrg.organizationId,
        role: role as any,
      }
    });

    return { message: 'User invited successfully' };
  }

  async updateOrganizationName(userId: string, name: string) {
    const userOrg = await this.prisma.organizationUser.findFirst({
      where: { userId, role: 'ADMIN' },
    });

    if (!userOrg) throw new BadRequestException('User is not an admin of any organization');

    return this.prisma.organization.update({
      where: { id: userOrg.organizationId },
      data: { name },
    });
  }
}
