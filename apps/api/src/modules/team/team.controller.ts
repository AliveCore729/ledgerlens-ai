import { Controller, Get, Post, Body, UseGuards, Patch } from '@nestjs/common';
import { Throttle } from "@nestjs/throttler";
import { TeamService } from './team.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActiveSessionGuard } from '../auth/active-session.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('team')
@UseGuards(JwtAuthGuard, ActiveSessionGuard)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  getTeam(@CurrentUser() user: any) {
    return this.teamService.getTeam(user.userId);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('invite')
  inviteMember(@CurrentUser() user: any, @Body() body: { email: string, role: string }) {
    return this.teamService.inviteMember(user.userId, body.email, body.role);
  }

  @Patch('organization')
  updateOrganization(@CurrentUser() user: any, @Body() body: { name: string }) {
    return this.teamService.updateOrganizationName(user.userId, body.name);
  }
}
