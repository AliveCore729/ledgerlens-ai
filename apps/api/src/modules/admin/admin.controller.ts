import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
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

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body() body: { role: string }) {
    return this.adminService.updateUserRole(id, body.role);
  }
}
