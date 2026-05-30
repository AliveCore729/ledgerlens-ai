'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { useMemo } from 'react';

interface CategoryData {
  category: string;
  amount: number;
  count: number;
}

interface ExpensePieChartProps {
  data?: CategoryData[];
  isLoading: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Income": "#22c55e",
  "Food & Dining": "#ec4899",
  "Travel & Transportation": "#3b82f6",
  "Software & Subscriptions": "#6366f1",
  "Utilities & Bills": "#eab308",
  "Rent & Housing": "#8b5cf6",
  "Salary & Payroll": "#10b981",
  "Office Supplies": "#f97316",
  "Marketing & Advertising": "#14b8a6",
  "Bank Fees & Charges": "#ef4444",
  "Transfers & Investments": "#06b6d4",
  "Healthcare & Insurance": "#f43f5e",
  "Shopping & Retail": "#d946ef",
  "Entertainment & Leisure": "#8b5cf6",
  "Taxes & Fines": "#334155",
  "Misc": "#94a3b8",
  "Other": "#64748b",
};

export default function ExpensePieChart({ data, isLoading }: ExpensePieChartProps) {
  const totalAmount = useMemo(() => {
    return data?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  }, [data]);

  if (isLoading) {
    return (
      <Card className="w-full shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Expense Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-75 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Expense Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-75 w-full flex-col md:flex-row items-center">
          <div className="h-50 md:h-full w-full md:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="amount"
                  nameKey="category"
                  stroke="none"
                >
                  {(data || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.Other}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="w-full md:w-1/2 flex flex-col justify-center gap-2 overflow-y-auto max-h-62.5 pr-2">
            {(data || []).map((item, index) => {
              const percentage = totalAmount > 0 ? ((item.amount / totalAmount) * 100).toFixed(1) : 0;
              const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other;
              
              return (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-muted-foreground font-medium">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatCurrency(item.amount)}</span>
                    <span className="text-xs text-muted-foreground w-8 text-right">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}