import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { TeamService } from './team.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('team')
@UseGuards(JwtAuthGuard)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  getTeam(@CurrentUser() user: any) {
    return this.teamService.getTeam(user.userId);
  }

  @Post('invite')
  inviteMember(@CurrentUser() user: any, @Body() body: { email: string, role: string }) {
    return this.teamService.inviteMember(user.userId, body.email, body.role);
  }
}
