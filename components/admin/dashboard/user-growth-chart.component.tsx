/**
 * User growth chart component for admin dashboard.
 * Displays user registration trends over the last 30 days.
 */
'use client';

import { useMemo } from 'react';
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
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { TrendingUp } from 'lucide-react';

type UserGrowthChartProps = {
  data?: Array<{
    date: Date;
    count: number;
  }>;
  totalUsers: number;
  newUsersLast30Days: number;
};

/**
 * User growth chart component.
 * Shows daily user registration trends.
 */
export function UserGrowthChart({
  data,
  totalUsers,
  newUsersLast30Days,
}: UserGrowthChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      // Generate sample data for the last 30 days if no data provided
      const endDate = new Date();
      const startDate = subDays(endDate, 30);
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

      return dateRange.map((date) => ({
        date: format(date, 'MMM dd'),
        users: 0,
      }));
    }

    return data.map((item) => ({
      date: format(new Date(item.date), 'MMM dd'),
      users: item.count,
    }));
  }, [data]);

  const growthRate = useMemo(() => {
    if (!totalUsers) return 0;
    return ((newUsersLast30Days / totalUsers) * 100).toFixed(1);
  }, [totalUsers, newUsersLast30Days]);

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">User Growth</h2>
          <p className="text-sm text-muted-foreground">
            Last 30 days registration trend
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-600">+{growthRate}%</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
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
          <Legend />
          <Line
            type="monotone"
            dataKey="users"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Total Users</p>
          <p className="text-lg font-semibold">{totalUsers.toLocaleString()}</p>
        </div>
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">New (30d)</p>
          <p className="text-lg font-semibold">
            {newUsersLast30Days.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
