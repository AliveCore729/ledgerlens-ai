'use client';

import { useSearchParams } from 'next/navigation'; 
import { useAnalytics } from '@/hooks/useAnalytics';
import StatsCards from '@/components/dashboard/stats-cards';
import RecentTransactions from '@/components/dashboard/recent-transactions';
import UploadPanel from '@/components/dashboard/upload-panel';
import CashflowChart from '@/components/dashboard/cashflow-chart';
import ExpensePieChart from '@/components/dashboard/expense-pie-chart';
import TopVendorsChart from '@/components/dashboard/top-vendors-chart';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function DashboardPage() {

  const searchParams = useSearchParams();
  const statementId = searchParams.get('statementId');
  const { data, isLoading, isError } = useAnalytics(statementId);

  if (isError) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-4 py-8 text-destructive">
            <AlertCircle className="h-6 w-6" />
            <p className="font-semibold">Failed to load analytics data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 1. Map the cashflow data: NestJS sends 'expense', Recharts expects 'expenses'
  const mappedCashflow = data?.monthlyCashflow?.map((item: any) => ({
    month: item.month,
    income: item.income,
    expenses: item.expense, 
  }));

  // 2. Map the category breakdown: NestJS sends 'expense', PieChart expects 'amount'
  const mappedCategories = data?.categoryBreakdown?.map((item: any) => ({
    category: item.category,
    amount: item.expense, 
    count: item.count,
  })).filter((item: any) => item.amount > 0); // Only visualize categories that actually have expenses

  return (
    <div className="p-4 md:p-8 space-y-6 min-h-screen bg-background text-foreground">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your financial statements and analysis.</p>
        </div>
        <UploadPanel />
      </div>

      {/* Stats Cards - Map NestJS 'totalExpense' and 'balance' to the frontend props */}
      <StatsCards 
        data={{
          totalTransactions: data?.totalTransactions,
          totalIncome: data?.totalIncome,
          totalExpenses: data?.totalExpense, 
          netBalance: data?.balance          
        }} 
        isLoading={isLoading} 
      />

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6">
        {/* Full width cashflow chart */}
        <CashflowChart data={mappedCashflow} isLoading={isLoading} />
        
        {/* Side by side on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ExpensePieChart data={mappedCategories} isLoading={isLoading} />
          
          {/* Top Vendors works as-is because NestJS already sends { vendor, amount, count } */}
          <TopVendorsChart data={data?.topVendors} isLoading={isLoading} />
        </div>
      </div>

      {/* Recent Transactions Table (Commented out until we build it) */}
      <div className="overflow-x-auto w-full">
        <RecentTransactions data={data?.recentTransactions} isLoading={isLoading} />
      </div>
    </div>
  );
}