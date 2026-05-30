'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

interface VendorData {
  vendor: string;
  amount: number;
  count: number;
}

interface TopVendorsChartProps {
  data?: VendorData[];
  isLoading: boolean;
}

export default function TopVendorsChart({ data, isLoading }: TopVendorsChartProps) {
  if (isLoading) {
    return (
      <Card className="w-full shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Top Vendors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-75 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  const truncateVendor = (name: string) => {
    return name.length > 12 ? `${name.substring(0, 12)}...` : name;
  };

  // Sort and take top 5
  const topVendors = [...(data || [])]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Top Vendors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-75 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topVendors}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => formatCurrency(value)}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="vendor"
                axisLine={false}
                tickLine={false}
                tickFormatter={truncateVendor}
                width={90}
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Total Amount']}
                labelFormatter={(label) => `Vendor: ${String(label ?? '')}`}
              />
              <Bar
                dataKey="amount"
                fill="#6366f1"
                radius={[0, 4, 4, 0]}
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}