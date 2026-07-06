import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { ActiveSessionGuard } from '../auth/active-session.guard';
import { AuditAction } from '../../common/decorators/audit-action.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, ActiveSessionGuard)
@Roles('SUPER_ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  getMetrics() {
    return this.adminService.getMetrics();
  }

  @Get('organizations')
  getOrganizations() {
    return this.adminService.getOrganizations();
  }

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @AuditAction('SUPER_ADMIN_ROLE_CHANGE')
  @Patch('users/:id/role')
  updateUserRole(
    @Param('id') id: string, 
    @Body() body: { role: string },
    @CurrentUser() user: any
  ) {
    return this.adminService.updateUserRole(id, body.role, user.userId);
  }

  @AuditAction('ORG_SUBSCRIPTION_ACTIVATED')
  @Patch('organizations/:id/activate-subscription')
  activateSubscription(
    @Param('id') orgId: string,
    @Body() body: { paymentReference: string, expiresAt: string },
    @CurrentUser() user: any
  ) {
    return this.adminService.activateSubscription(orgId, body.paymentReference, body.expiresAt, user.userId);
  }
}
