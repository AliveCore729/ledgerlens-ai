import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Prisma } from '@ledgerlens/database';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhereClause(userId: string, query: QueryTransactionsDto): Prisma.TransactionWhereInput {
    const where: Prisma.TransactionWhereInput = {
        statement: {
            uploadedById: userId // Ensure isolation by checking the statement owner
        }
    };

    if (query.statementId) where.statementId = query.statementId;
    if (query.type) {
        where.type = query.type === 'CR' ? 'CREDIT' : 'DEBIT';
    }
    if (query.category) where.category = query.category;

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = query.startDate;
      if (query.endDate) where.date.lte = query.endDate;
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
    const { page = 1, limit = 20, sortBy = 'date', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(userId, query);

    // Sort by transaction date (statement date), then createdAt for stable ordering.
    let orderBy: Prisma.TransactionOrderByWithRelationInput[] = [
      { date: sortOrder },
      { createdAt: sortOrder },
    ];

    if (sortBy === 'amount') {
      orderBy = [
        { amount: sortOrder },
        { date: sortOrder },
      ];
    }

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
        date: tx.date, // ISO format YYYY-MM-DD
        narration: tx.raw,
        vendor: tx.vendor,
        amount: tx.amount,
        type: tx.type === 'CREDIT' ? 'CR' : 'DR',
        category: tx.category ? tx.category.charAt(0).toUpperCase() + tx.category.slice(1).toLowerCase() : 'Uncategorized',
        confidence: 0.95,
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
          statement: { uploadedById: userId } 
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
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 10000,
    });

    const headers = ['Date', 'Narration', 'Vendor', 'Type', 'Amount', 'Category'];
    const rows = transactions.map(tx => {
      const date = tx.date || tx.createdAt.toLocaleDateString('en-GB'); 
      const narration = `"${(tx.raw || '').replace(/"/g, '""')}"`;
      const vendor = `"${tx.vendor || ''}"`;
      const type = tx.type === 'CREDIT' ? 'CR' : 'DR';
      const category = `"${tx.category || ''}"`;
      
      return [date, narration, vendor, type, tx.amount, category].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}