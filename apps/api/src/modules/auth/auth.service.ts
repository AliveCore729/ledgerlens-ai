import {
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { JwtService } from "@nestjs/jwt";
import { OAuth2Client } from "google-auth-library";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { 
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async google(credential: string) {
    try {
      let payload: any = null;

      // Check if the credential is a JWT ID token (3 parts separated by dots)
      if (credential.split('.').length === 3) {
        const ticket = await this.googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } else {
        // Otherwise, it's an Access Token from useGoogleLogin
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${credential}` },
        });
        
        if (!response.ok) {
          throw new UnauthorizedException("Failed to fetch Google user info");
        }
        payload = await response.json();
      }
      
      if (!payload || !payload.email) {
        throw new UnauthorizedException("Invalid Google token payload");
      }

      const email = payload.email;
      const firstName = payload.given_name || payload.name?.split(" ")[0] || "User";
      const lastName = payload.family_name || payload.name?.split(" ").slice(1).join(" ") || "";
      const googleId = payload.sub;

      let user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Enforce the hardcoded super admin rule
        const assignedRole = ["sj772299@gmail.com", "shreyanshjn007@gmail.com"].includes(email) ? "SUPER_ADMIN" : "USER";

        user = await this.prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
            googleId,
            role: assignedRole,
            organizationUsers: {
              create: {
                role: "ADMIN",
                organization: {
                  create: {
                    name: `${firstName}'s Workspace`
                  }
                }
              }
            }
          },
        });
      } else if (!user.googleId) {
        // Link googleId to existing user
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId },
        });
      }
      
      // Ensure the hardcoded rule applies even to existing user
      if (["sj772299@gmail.com", "shreyanshjn007@gmail.com"].includes(email) && user.role !== "SUPER_ADMIN") {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { role: "SUPER_ADMIN" },
        });
      }

      const jwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = await this.jwtService.signAsync(jwtPayload);

      return {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error: any) {
      console.error("Google Auth Error Detailed:", error?.message || error);
      console.error("Google Auth Error Stack:", error?.stack);
      console.error("Google Client ID configured:", !!process.env.GOOGLE_CLIENT_ID);
      throw new UnauthorizedException("Invalid Google credential");
    }
  }
}