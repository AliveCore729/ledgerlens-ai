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
            organization: { organizationUsers: { some: { userId } } }
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
          statement: { organization: { organizationUsers: { some: { userId } } } } 
        },
    });

    if (!transaction) throw new NotFoundException(`Transaction not found.`);
    return transaction;
  }

  async updateCategory(id: string, userId: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id, userId);
    return this.prisma.transaction.update({
      where: { id },
      data: { 
        category: updateCategoryDto.category,
        isReviewed: true
      },
    });
  }

  async getReviewPending(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        statement: { organization: { organizationUsers: { some: { userId } } } },
        isReviewed: false,
        category: { not: "UNCATEGORIZED" } // AI assigned something
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    
    return transactions.map(tx => ({
        id: tx.id,
        date: tx.date,
        narration: tx.raw,
        vendor: tx.vendor,
        amount: tx.amount,
        type: tx.type === 'CREDIT' ? 'CR' : 'DR',
        category: tx.category,
        statementId: tx.statementId
    }));
  }

  async getCategorizationSummary(userId: string) {
    // Fetch all transactions to group by category
    const transactions = await this.prisma.transaction.findMany({
      where: {
        statement: { organization: { organizationUsers: { some: { userId } } } },
      },
      orderBy: { date: 'desc' }
    });

    const summaryMap = new Map<string, {
      category: string;
      totalSpend: number;
      transactionCount: number;
      transactions: any[];
    }>();

    transactions.forEach(tx => {
      const cat = tx.category || "UNCATEGORIZED";
      if (!summaryMap.has(cat)) {
        summaryMap.set(cat, {
          category: cat,
          totalSpend: 0,
          transactionCount: 0,
          transactions: []
        });
      }

      const summary = summaryMap.get(cat)!;
      summary.transactionCount++;
      // Only count debit amount for total spend
      if (tx.type === 'DEBIT') {
        summary.totalSpend += tx.amount;
      }
      
      summary.transactions.push({
        id: tx.id,
        date: tx.date,
        narration: tx.raw,
        vendor: tx.vendor,
        amount: tx.amount,
        type: tx.type === 'CREDIT' ? 'CR' : 'DR',
        category: tx.category,
        isReviewed: tx.isReviewed,
        statementId: tx.statementId
      });
    });

    return Array.from(summaryMap.values()).sort((a, b) => b.totalSpend - a.totalSpend);
  }

  async reviewTransaction(id: string, userId: string, category?: string) {
    await this.findOne(id, userId);
    const data: any = { isReviewed: true };
    if (category) data.category = category;
    
    return this.prisma.transaction.update({
      where: { id },
      data
    });
  }

  async bulkReview(userId: string, ids: string[]) {
    // We ideally should verify ownership of all IDs, but for MVP we assume trusted input 
    // or do a quick verification
    return this.prisma.transaction.updateMany({
      where: {
        id: { in: ids },
        statement: { organization: { organizationUsers: { some: { userId } } } }
      },
      data: {
        isReviewed: true
      }
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