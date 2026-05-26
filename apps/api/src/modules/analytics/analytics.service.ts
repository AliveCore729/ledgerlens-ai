import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSummary(userId: string) {
    const transactions =
      await this.prisma.transaction.findMany({
        where: {
          statement: {
            uploadedBy: userId,
          },
        },
      });

    let income = 0;
    let expense = 0;

    for (const tx of transactions) {
      if (tx.type === "CREDIT") {
        income += tx.amount;
      } else {
        expense += tx.amount;
      }
    }

    return {
      totalTransactions: transactions.length,
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    };
  }
}