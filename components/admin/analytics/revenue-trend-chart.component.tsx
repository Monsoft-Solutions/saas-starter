'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { RevenueTrendDataPoint } from '@/lib/types/analytics/subscription-analytics.type';

type RevenueTrendChartProps = {
  data: RevenueTrendDataPoint[];
};

/**
 * Format currency value for Y-axis and tooltips.
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
 * Custom tooltip component for the line chart.
 */
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const date = parseISO(label);
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="font-semibold mb-2">{format(date, 'MMM d, yyyy')}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="text-sm">
            <span style={{ color: entry.color }}>●</span> {entry.name}:{' '}
            {entry.name === 'MRR' ? (
              <span className="font-medium">{formatCurrency(entry.value)}</span>
            ) : (
              <span className="font-medium">{entry.value}</span>
            )}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

/**
 * Revenue trend chart component.
 * Displays MRR and active subscriptions over time using a line chart.
 */
export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-muted-foreground">
            No trend data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(parseISO(date), 'MMM d')}
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              yAxisId="left"
              tickFormatter={formatCurrency}
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="mrr"
              name="MRR"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="activeSubscriptions"
              name="Active Subscriptions"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Current MRR</p>
            <p className="text-2xl font-bold">
              {data.length > 0
                ? formatCurrency(data[data.length - 1].mrr)
                : '$0'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Active Subscriptions
            </p>
            <p className="text-2xl font-bold">
              {data.length > 0 ? data[data.length - 1].activeSubscriptions : 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
