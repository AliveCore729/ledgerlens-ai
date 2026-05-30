import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

type DashboardTransaction = {
  id: string;
  date: string;
  raw: string | null;
  amount: number;
  type: string;
  vendor: string | null;
  normalizedVendor: string | null;
  category: string | null;
  statement: {
    id: string;
    fileName: string;
    createdAt: Date;
  };
};

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) { }

  async getSummary(userId: string, statementId?: string) {
    // 1. Build the filter dynamically
    const whereClause: any = {
      statement: { uploadedById: userId },
    };

    // If a specific statement is requested, add it to the filter
    if (statementId) {
      whereClause.statementId = statementId;
    }

    // 2. Fetch the isolated data
    const transactions = await this.prisma.transaction.findMany({
      where: whereClause,
      include: {
        statement: {
          select: { id: true, fileName: true, createdAt: true },
        },
      },
      orderBy: [
        { date: "desc" },
        { createdAt: "desc" }
      ],
    });
    let income = 0;
    let expense = 0;
    let uncategorized = 0;

    for (const tx of transactions) {
      if (tx.type === "CREDIT") {
        income += tx.amount;
      } else if (tx.type === "DEBIT") {
        expense += tx.amount;
      }

      if (!tx.category || tx.category === "UNCATEGORIZED") {
        uncategorized += 1;
      }
    }

    return {
      totalTransactions: transactions.length,
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      uncategorized,
      categoryBreakdown: this.getCategoryBreakdown(transactions),
      monthlyCashflow: this.getMonthlyCashflow(transactions),
      topVendors: this.getTopVendors(transactions),
      recentTransactions: transactions.slice(0, 15).map(tx => ({
        ...tx,
        type: tx.type === "CREDIT" ? "CR" : "DR",
        category: tx.category ? tx.category.charAt(0).toUpperCase() + tx.category.slice(1).toLowerCase() : 'Uncategorized'
      })),
    };
  }

  async getTransactions(userId: string) {
    return this.prisma.transaction.findMany({
      where: {
        statement: {
          uploadedById: userId,
        },
      },
      include: {
        statement: {
          select: {
            id: true,
            fileName: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { date: "desc" },
        { createdAt: "desc" }
      ],
      take: 200,
    });
  }

  private getCategoryBreakdown(
    transactions: DashboardTransaction[],
  ) {
    const categories = new Map<
      string,
      { category: string; income: number; expense: number; count: number }
    >();

    for (const tx of transactions) {
      const category = tx.category || "UNCATEGORIZED";
      const current =
        categories.get(category) || {
          category,
          income: 0,
          expense: 0,
          count: 0,
        };

      current.count += 1;

      if (tx.type === "CREDIT") {
        current.income += tx.amount;
      }

      if (tx.type === "DEBIT") {
        current.expense += tx.amount;
      }

      categories.set(category, current);
    }

    return [...categories.values()].sort(
      (a, b) => b.expense + b.income - (a.expense + a.income),
    );
  }

  private getMonthlyCashflow(
    transactions: DashboardTransaction[],
  ) {
    const months = new Map<
      string,
      { month: string; income: number; expense: number; net: number }
    >();

    for (const tx of transactions) {
      const month = this.getMonthKey(tx.date);
      const current =
        months.get(month) || {
          month,
          income: 0,
          expense: 0,
          net: 0,
        };

      if (tx.type === "CREDIT") {
        current.income += tx.amount;
      }

      if (tx.type === "DEBIT") {
        current.expense += tx.amount;
      }

      current.net = current.income - current.expense;
      months.set(month, current);
    }

    return [...months.values()].sort((a, b) =>
      a.month.localeCompare(b.month),
    );
  }

  private getTopVendors(transactions: DashboardTransaction[]) {
    const vendors = new Map<
      string,
      { vendor: string; amount: number; count: number }
    >();

    for (const tx of transactions) {
      const vendor =
        tx.normalizedVendor || tx.vendor || "UNKNOWN VENDOR";
      const current =
        vendors.get(vendor) || {
          vendor,
          amount: 0,
          count: 0,
        };

      current.amount += tx.amount;
      current.count += 1;
      vendors.set(vendor, current);
    }

    return [...vendors.values()]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }

  private getMonthKey(date: string) {
    const monthNames: Record<string, string> = {
      JAN: "01",
      FEB: "02",
      MAR: "03",
      APR: "04",
      MAY: "05",
      JUN: "06",
      JUL: "07",
      AUG: "08",
      SEP: "09",
      OCT: "10",
      NOV: "11",
      DEC: "12",
    };

    const bankDate = date.match(
      /^(\d{1,2})[-\s]([A-Z]{3})[-\s](\d{4})$/i,
    );

    if (bankDate) {
      return `${bankDate[3]}-${monthNames[bankDate[2].toUpperCase()] || "01"}`;
    }

    const numericDate = date.match(
      /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/,
    );

    if (numericDate) {
      const year =
        numericDate[3].length === 2
          ? `20${numericDate[3]}`
          : numericDate[3];

      return `${year}-${numericDate[2].padStart(2, "0")}`;
    }

    return "UNKNOWN";
  }
}
