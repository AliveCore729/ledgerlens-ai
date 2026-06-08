'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { Activity, ArrowDownRight, ArrowUpRight, DollarSign, Store, FileText } from 'lucide-react';
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
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-[#1a1f2c] border-white/5 shadow-md flex flex-col items-center justify-center p-6 h-[160px]">
            <Skeleton className="h-10 w-10 rounded-full mb-4 bg-white/10" />
            <Skeleton className="h-4 w-20 mb-2 bg-white/10" />
            <Skeleton className="h-6 w-16 bg-white/10" />
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
      transition: { staggerChildren: 0.05 }
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
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
    >
      {/* 1. Net Cash Flow / Payroll */}
      <motion.div variants={item}>
        <Card className="shadow-md border-white/5 bg-[#171e2e] hover:bg-[#1c2438] transition-colors flex flex-col items-center justify-center p-6 h-[160px]">
          <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
            <DollarSign className="h-6 w-6 text-blue-400" />
          </div>
          <p className="text-sm font-medium text-blue-400 mb-1">Net Flow</p>
          <div className="text-xl font-bold tracking-tight text-white">
            <AnimatedCounter value={netBalance} format={(v) => formatCurrency(v)} />
          </div>
        </Card>
      </motion.div>

      {/* 2. Total Income / Clients */}
      <motion.div variants={item}>
        <Card className="shadow-md border-white/5 bg-[#171e2e] hover:bg-[#1c2438] transition-colors flex flex-col items-center justify-center p-6 h-[160px]">
          <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
            <ArrowUpRight className="h-6 w-6 text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-emerald-400 mb-1">Income</p>
          <div className="text-xl font-bold tracking-tight text-white">
            <AnimatedCounter value={totalIncome} format={(v) => formatCurrency(v)} />
          </div>
        </Card>
      </motion.div>

      {/* 3. Total Expenses / Projects */}
      <motion.div variants={item}>
        <Card className="shadow-md border-white/5 bg-[#171e2e] hover:bg-[#1c2438] transition-colors flex flex-col items-center justify-center p-6 h-[160px]">
          <div className="h-12 w-12 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
            <ArrowDownRight className="h-6 w-6 text-rose-400" />
          </div>
          <p className="text-sm font-medium text-rose-400 mb-1">Expenses</p>
          <div className="text-xl font-bold tracking-tight text-white">
            <AnimatedCounter value={totalExpenses} format={(v) => formatCurrency(v)} />
          </div>
        </Card>
      </motion.div>

      {/* 4. Transactions / Events */}
      <motion.div variants={item}>
        <Card className="shadow-md border-white/5 bg-[#171e2e] hover:bg-[#1c2438] transition-colors flex flex-col items-center justify-center p-6 h-[160px]">
          <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
            <Activity className="h-6 w-6 text-purple-400" />
          </div>
          <p className="text-sm font-medium text-purple-400 mb-1">Entries</p>
          <div className="text-xl font-bold tracking-tight text-white">
            <AnimatedCounter value={totalTransactions} format={(v) => Math.round(v).toLocaleString()} />
          </div>
        </Card>
      </motion.div>

      {/* 5. Placeholder 1: Vendors */}
      <motion.div variants={item}>
        <Card className="shadow-md border-white/5 bg-[#171e2e] hover:bg-[#1c2438] transition-colors flex flex-col items-center justify-center p-6 h-[160px]">
          <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-4">
            <Store className="h-6 w-6 text-orange-400" />
          </div>
          <p className="text-sm font-medium text-orange-400 mb-1">Vendors</p>
          <div className="text-xl font-bold tracking-tight text-white">
            <AnimatedCounter value={42} format={(v) => Math.round(v).toLocaleString()} />
          </div>
        </Card>
      </motion.div>

      {/* 6. Placeholder 2: Reports */}
      <motion.div variants={item}>
        <Card className="shadow-md border-white/5 bg-[#171e2e] hover:bg-[#1c2438] transition-colors flex flex-col items-center justify-center p-6 h-[160px]">
          <div className="h-12 w-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-cyan-400" />
          </div>
          <p className="text-sm font-medium text-cyan-400 mb-1">Reports</p>
          <div className="text-xl font-bold tracking-tight text-white">
            <AnimatedCounter value={12} format={(v) => Math.round(v).toLocaleString()} />
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}