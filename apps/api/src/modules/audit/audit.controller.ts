import { Controller, Get, UseGuards, ForbiddenException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private prisma: PrismaService
  ) {}

  @Get()
  async getLogs(@CurrentUser() user: any) {
    const userOrg = await this.prisma.getUserPrimaryOrg(user.userId);

    if (!userOrg) {
      throw new ForbiddenException('User does not belong to an organization');
    }

    return this.auditService.getLogs(userOrg.organizationId);
  }
}
