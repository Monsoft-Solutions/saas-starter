/**
 * Revenue chart component for admin dashboard.
 * Displays monthly recurring revenue trends and plan distribution.
 */
'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DollarSign, TrendingUp } from 'lucide-react';

type RevenueChartProps = {
  totalMRR: number;
  totalActiveSubscriptions: number;
  revenueGrowthRate?: number | null;
  planDistribution?: Array<{
    plan: string;
    count: number;
    revenue: number;
  }>;
};

const PLAN_COLORS = {
  Basic: 'hsl(var(--chart-1))',
  Pro: 'hsl(var(--chart-2))',
  Enterprise: 'hsl(var(--chart-3))',
};

/**
 * Revenue chart component.
 * Shows MRR trends and plan distribution.
 */
export function RevenueChart({
  totalMRR,
  totalActiveSubscriptions,
  revenueGrowthRate,
  planDistribution,
}: RevenueChartProps) {
  const pieData = useMemo(() => {
    if (!planDistribution || planDistribution.length === 0) {
      return [
        { name: 'Basic', value: 10, revenue: 100 },
        { name: 'Pro', value: 5, revenue: 125 },
        { name: 'Enterprise', value: 2, revenue: 200 },
      ];
    }

    return planDistribution.map((item) => ({
      name: item.plan,
      value: item.count,
      revenue: item.revenue,
    }));
  }, [planDistribution]);

  const barData = useMemo(() => {
    if (!planDistribution || planDistribution.length === 0) {
      return [
        { plan: 'Basic', revenue: 100, subscriptions: 10 },
        { plan: 'Pro', revenue: 125, subscriptions: 5 },
        { plan: 'Enterprise', revenue: 200, subscriptions: 2 },
      ];
    }

    return planDistribution.map((item) => ({
      plan: item.plan,
      revenue: item.revenue,
      subscriptions: item.count,
    }));
  }, [planDistribution]);

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Revenue Overview</h2>
          <p className="text-sm text-muted-foreground">
            Monthly recurring revenue and plan distribution
          </p>
        </div>
        {revenueGrowthRate !== null && revenueGrowthRate !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp
              className={`h-4 w-4 ${revenueGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}
            />
            <span
              className={`font-medium ${revenueGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {revenueGrowthRate >= 0 ? '+' : ''}
              {revenueGrowthRate.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Plan Distribution Pie Chart */}
        <div>
          <h3 className="text-sm font-medium mb-3">Plan Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) =>
                  `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`
                }
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      PLAN_COLORS[entry.name as keyof typeof PLAN_COLORS] ||
                      'hsl(var(--muted))'
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Plan Bar Chart */}
        <div>
          <h3 className="text-sm font-medium mb-3">Revenue by Plan</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="plan"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar
                dataKey="revenue"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-md bg-muted/50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Total MRR</p>
          </div>
          <p className="text-lg font-semibold">${totalMRR.toLocaleString()}</p>
        </div>
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">
            Active Subscriptions
          </p>
          <p className="text-lg font-semibold">
            {totalActiveSubscriptions.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
