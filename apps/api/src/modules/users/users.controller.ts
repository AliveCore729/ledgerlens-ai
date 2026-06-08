import {
  Controller,
  Patch,
  Body,
  Get,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { PrismaService } from "../prisma/prisma.service";

@Controller("users")
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Get("me")
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch("profile")
  async updateProfile(@CurrentUser() user: any, @Body() body: { firstName: string, lastName: string }) {
    return this.prisma.user.update({
      where: { id: user.userId },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
      }
    });
  }

  @Roles("ADMIN")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get("admin")
  adminRoute() {
    return {
      message: "Welcome Admin",
    };
  }
}