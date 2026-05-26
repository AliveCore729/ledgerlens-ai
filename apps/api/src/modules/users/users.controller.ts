import {
  Controller,
  Get,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";

import { CurrentUser } from "../../common/decorators/current-user.decorator";

import { Roles } from "../../common/decorators/roles.decorator";

import { RolesGuard } from "../../common/guards/roles.guard";

@Controller("users")
export class UsersController {
  @UseGuards(JwtAuthGuard)
  @Get("me")
  getProfile(@CurrentUser() user: any) {
    return user;
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