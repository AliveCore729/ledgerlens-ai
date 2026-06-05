'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { Activity, ArrowDownRight, ArrowUpRight, DollarSign } from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { motion } from 'framer-motion';

interface StatsData {
  totalTransactions?: number;
  totalIncome?: number;
  totalExpenses?: number;
  netBalance?: number;
}

interface StatsCardsProps {
  data?: StatsData;
  isLoading: boolean;
}

export default function StatsCards({ data, isLoading }: StatsCardsProps) {
  // TASK 6: Show 4 skeleton cards when loading
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-28 mb-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Fallbacks in case data is undefined
  const {
    totalTransactions = 0,
    totalIncome = 0,
    totalExpenses = 0,
    netBalance = 0,
  } = data || {};

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      <motion.div variants={item}>
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Income
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              <AnimatedCounter value={totalIncome} format={(v) => formatCurrency(v)} />
            </div>
            <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1 font-medium">
              <ArrowUpRight className="h-3 w-3" /> +12.5% from last month
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              <AnimatedCounter value={totalExpenses} format={(v) => formatCurrency(v)} />
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Compared to previous period
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Cash Flow
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-primary">
              <AnimatedCounter value={netBalance} format={(v) => formatCurrency(v)} />
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Available liquidity
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transactions
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              <AnimatedCounter value={totalTransactions} format={(v) => Math.round(v).toLocaleString()} />
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Processed entries
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}