'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import type { PlanDistribution } from '@/lib/types/analytics/subscription-analytics.type';

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload: PlanDistribution;
    value: number;
    name: string;
  }>;
  label?: string;
};

type PlanDistributionChartProps = {
  data: PlanDistribution[];
};

/**
 * Color palette for plan distribution chart.
 */
const COLORS = {
  Basic: 'hsl(var(--chart-1))',
  Pro: 'hsl(var(--chart-2))',
  Enterprise: 'hsl(var(--chart-3))',
};

/**
 * Format currency value for tooltips.
 *
 * @param value - Numeric value to format
 * @returns Formatted currency string
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Custom tooltip component for the pie chart.
 */
function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="font-semibold">{data.planName}</p>
        <p className="text-sm text-muted-foreground">
          {data.count} {data.count === 1 ? 'subscription' : 'subscriptions'}
        </p>
        <p className="text-sm font-medium">{formatCurrency(data.mrr)} MRR</p>
        <p className="text-xs text-muted-foreground">
          {data.percentage.toFixed(1)}% of total
        </p>
      </div>
    );
  }
  return null;
}

/**
 * Plan distribution chart component.
 * Displays subscription distribution across different plans using a pie chart.
 */
export function PlanDistributionChart({ data }: PlanDistributionChartProps) {
  // Filter out plans with zero count
  const chartData = data.filter((plan) => plan.count > 0);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plan Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-muted-foreground">
            No subscription data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) =>
                `${entry.planName} (${entry.percentage.toFixed(0)}%)`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.planName as keyof typeof COLORS]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {chartData.map((plan) => (
            <div key={plan.planName} className="text-center">
              <div
                className="h-3 w-3 rounded-full mx-auto mb-2"
                style={{
                  backgroundColor: COLORS[plan.planName as keyof typeof COLORS],
                }}
              />
              <p className="text-sm font-medium">{plan.planName}</p>
              <p className="text-xs text-muted-foreground">{plan.count} subs</p>
              <p className="text-xs font-semibold">
                {formatCurrency(plan.mrr)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
