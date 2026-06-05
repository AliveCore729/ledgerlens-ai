import { Controller, Get, Delete, Param, UseGuards, ForbiddenException } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";
import * as fs from 'fs';

@Controller("statements")
export class StatementsController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserStatements(@CurrentUser() user: any) {
    // Fetch all statements for the logged-in user, including a count of their transactions
    return this.prisma.statement.findMany({
      where: { 
        // Using uploadedById based on Prisma schema
        uploadedById: user.userId 
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

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getStatement(@Param('id') id: string, @CurrentUser() user: any) {
    const statement = await this.prisma.statement.findUnique({
      where: { id }
    });

    if (!statement || statement.uploadedById !== user.userId) {
      throw new ForbiddenException('Statement not found');
    }

    return statement;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteStatement(@Param('id') id: string, @CurrentUser() user: any) {
    const statement = await this.prisma.statement.findUnique({
      where: { id }
    });

    if (!statement) {
      throw new ForbiddenException('Statement not found');
    }

    if (statement.uploadedById !== user.userId) {
      throw new ForbiddenException('You can only delete your own statements');
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