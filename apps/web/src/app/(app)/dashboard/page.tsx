'use client';

import { useSearchParams } from 'next/navigation'; 
import { useAnalytics } from '@/hooks/useAnalytics';
import StatsCards from '@/components/dashboard/stats-cards';
import RecentTransactions from '@/components/dashboard/recent-transactions';
import UploadPanel from '@/components/dashboard/upload-panel';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useStatements } from '@/hooks/useStatements';
import { useAuthStore } from '@/store/auth-store';

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
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#111c2e] to-[#0f172a] border border-white/5 p-8 flex justify-between items-center shadow-lg">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[#3054ff]/20 flex items-center justify-center border border-[#3054ff]/30">
              <span className="text-xl font-bold text-white">
                {useAuthStore.getState().user?.name?.charAt(0) || "U"}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Welcome back! {useAuthStore.getState().user?.name?.split(' ')[0] || "User"} 👋
              </h1>
              <p className="text-white/60">Check your reports</p>
            </div>
          </div>
        </div>
        
        {/* Decorative Image */}
        <div className="absolute right-0 top-0 h-full w-1/3 max-w-[300px] hidden md:block opacity-80 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#0f172a]" />
          <img 
            src="/welcome-illustration.png" 
            alt="Welcome Illustration" 
            className="w-full h-full object-cover mix-blend-screen"
          />
        </div>
      </div>

      <div className="flex justify-end w-full">
        <UploadPanel />
      </div>

      {isProcessing && (
        <div className="bg-[#3054ff]/10 border border-[#3054ff]/30 text-[#3054ff] px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm animate-pulse">
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