import { Body, Controller, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post("google")
  google(@Body() dto: { credential: string }) {
    return this.authService.google(dto.credential);
  }
}