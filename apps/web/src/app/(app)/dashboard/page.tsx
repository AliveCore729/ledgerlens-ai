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
      <div className="relative overflow-hidden rounded-2xl bg-[#0d1117] border border-white/5 p-8 flex justify-between items-center shadow-xl">
        {/* Glow effects */}
        <div className="absolute top-[-50%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-[#3054ff]/20 to-[#00d2ff]/5 rounded-full blur-[100px] opacity-60 pointer-events-none" />
        <div className="absolute bottom-[-50%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-tl from-[#3054ff]/10 to-transparent rounded-full blur-[80px] opacity-40 pointer-events-none" />
        
        {/* Inner content */}
        <div className="relative z-10 space-y-4 w-full md:w-2/3">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#3054ff] to-[#00d2ff] rounded-full blur-md opacity-50" />
              <div className="relative h-16 w-16 rounded-full bg-[#1C1C1E] border border-white/10 flex items-center justify-center overflow-hidden">
                <span className="text-2xl font-bold bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">
                  {useAuthStore.getState().user?.name?.charAt(0) || "U"}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/70 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d2ff] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00d2ff]"></span>
                </span>
                Dashboard Overview
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                Welcome back, {useAuthStore.getState().user?.name?.split(' ')[0] || "User"}
                <span className="inline-block origin-[70%_70%] hover:rotate-12 transition-transform cursor-default">👋</span>
              </h1>
              <p className="text-white/50 text-sm font-medium leading-relaxed max-w-lg mt-1">
                Here's what's happening with your finances today. Upload new statements or review your categorized cash flow.
              </p>
            </div>
          </div>
        </div>
        
        {/* Decorative Image */}
        <div className="absolute right-0 top-0 h-full w-1/3 max-w-[400px] hidden md:block opacity-90 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#0d1117]/50 to-[#0d1117] z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117]/80 via-transparent to-transparent z-10" />
          <img 
            src="/welcome-illustration.png" 
            alt="Welcome Illustration" 
            className="w-full h-full object-cover mix-blend-screen scale-110 origin-right"
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