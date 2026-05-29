import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhereClause(userId: string, query: QueryTransactionsDto): Prisma.TransactionWhereInput {
    const where: Prisma.TransactionWhereInput = {
        statement: {
            uploadedBy: userId // Ensure isolation by checking the statement owner
        }
    };

    if (query.statementId) where.statementId = query.statementId;
    if (query.type) where.type = query.type;
    if (query.category) where.category = query.category;

    if (query.startDate || query.endDate) {
      where.createdAt = {}; // Filter by the database timestamp instead
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    if (query.search) {
      where.OR = [
        { raw: { contains: query.search, mode: 'insensitive' } },
        { vendor: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  async findAll(userId: string, query: QueryTransactionsDto) {
    const { page = 1, limit = 20, sortBy = 'date', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(userId, query);

    // Map frontend 'amount' or 'date' to backend schema names
    let orderBy: any = { createdAt: sortOrder }; 
    if (sortBy === 'date') orderBy = { createdAt: sortOrder };
    if (sortBy === 'amount') orderBy = { amount: sortOrder };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    // Map to the frontend expected shape
    const mappedData = data.map(tx => ({
        id: tx.id,
        date: tx.date, // Fallback to createdAt if date string parsing is complex
        narration: tx.raw,
        vendor: tx.vendor,
        amount: tx.amount,
        type: tx.type === 'CREDIT' ? 'CR' : 'DR', // Map NestJS types to Frontend types
        category: tx.category,
        subcategory: null,
        confidence: 0.9,
        needsReview: false,
        statementId: tx.statementId
    }));

    return {
      data: mappedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { 
          id, 
          statement: { uploadedBy: userId } 
        },
    });

    if (!transaction) throw new NotFoundException(`Transaction not found.`);
    return transaction;
  }

  async updateCategory(id: string, userId: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id, userId);
    return this.prisma.transaction.update({
      where: { id },
      data: { category: updateCategoryDto.category },
    });
  }

  async getExportData(userId: string, query: QueryTransactionsDto): Promise<string> {
    const where = this.buildWhereClause(userId, query);
    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    const headers = ['Date', 'Narration', 'Vendor', 'Type', 'Amount', 'Category'];
    const rows = transactions.map(tx => {
      const date = tx.createdAt.toLocaleDateString('en-GB'); 
      const narration = `"${(tx.raw || '').replace(/"/g, '""')}"`;
      const vendor = `"${tx.vendor || ''}"`;
      const type = tx.type === 'CREDIT' ? 'CR' : 'DR';
      const category = `"${tx.category || ''}"`;
      
      return [date, narration, vendor, type, tx.amount, category].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}