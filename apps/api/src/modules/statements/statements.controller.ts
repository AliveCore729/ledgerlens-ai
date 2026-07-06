import { Controller, Get, Delete, Param, UseGuards, ForbiddenException } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { ActiveSessionGuard } from "../auth/active-session.guard";
import * as fs from 'fs';

@UseGuards(JwtAuthGuard, ActiveSessionGuard)
@Controller("statements")
export class StatementsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getUserStatements(@CurrentUser() user: any) {
    // Fetch all statements for the logged-in user's organization
    return this.prisma.statement.findMany({
      where: { 
        organization: { organizationUsers: { some: { userId: user.userId } } } 
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

  @Get(':id')
  async getStatement(@Param('id') id: string, @CurrentUser() user: any) {
    const statement = await this.prisma.statement.findFirst({
      where: { 
        id,
        organization: { organizationUsers: { some: { userId: user.userId } } }
      }
    });

    if (!statement) {
      throw new ForbiddenException('Statement not found or access denied');
    }

    return statement;
  }

  @Delete(':id')
  async deleteStatement(@Param('id') id: string, @CurrentUser() user: any) {
    const statement = await this.prisma.statement.findFirst({
      where: { 
        id,
        organization: { organizationUsers: { some: { userId: user.userId } } }
      }
    });

    if (!statement) {
      throw new ForbiddenException('Statement not found or access denied');
    }

    // Optionally try to delete the file from the filesystem to save space
    try {
      if (statement.fileUrl && fs.existsSync(statement.fileUrl)) {
        fs.unlinkSync(statement.fileUrl);
      }
    } catch (e) {
      console.error('Failed to delete statement file:', e);
    }

    // Delete the database record (transactions are cascade deleted)
    return this.prisma.statement.delete({
      where: { id }
    });
  }
}