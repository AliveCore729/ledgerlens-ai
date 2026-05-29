import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";

@Controller("statements")
export class StatementsController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserStatements(@CurrentUser() user: any) {
    // Fetch all statements for the logged-in user, including a count of their transactions
    return this.prisma.statement.findMany({
      where: { 
        // Using uploadedBy or userId depending on your exact Prisma schema naming
        uploadedBy: user.userId 
      },
      include: {
        _count: {
          select: { transactions: true }
        }
      },
      orderBy: {
        createdAt: 'desc' // Assuming you have a createdAt or uploadedAt field
      }
    });
  }
}