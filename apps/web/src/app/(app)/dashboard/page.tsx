'use client';

import { useSearchParams } from 'next/navigation'; 
import { useAnalytics } from '@/hooks/useAnalytics';
import StatsCards from '@/components/dashboard/stats-cards';
import RecentTransactions from '@/components/dashboard/recent-transactions';
import UploadPanel from '@/components/dashboard/upload-panel';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useStatements } from '@/hooks/useStatements';

export default function DashboardPage() {

  const searchParams = useSearchParams();
  const statementId = searchParams.get('statementId');
  
  const { data: statements } = useStatements();
  const isProcessing = statements?.some((s) => s.status === 'PROCESSING' || s.status === 'PENDING');
  
  const { data, isLoading, isError } = useAnalytics(statementId, isProcessing);

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

      {isProcessing && (
        <div className="bg-primary/10 border border-primary text-primary px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm animate-pulse">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="font-medium">Our AI is currently analyzing your uploaded statement. Your dashboard will update automatically in a few seconds...</p>
        </div>
      )}

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

      {/* Recent Transactions Table */}
      <div className="overflow-x-auto w-full">
        <RecentTransactions data={data?.recentTransactions} isLoading={isLoading} />
      </div>
    </div>
  );
}