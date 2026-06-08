import { Body, Controller, Post } from "@nestjs/common";

import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("google")
  google(@Body() dto: { credential: string }) {
    return this.authService.google(dto.credential);
  }
}