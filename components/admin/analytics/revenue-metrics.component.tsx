import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  AlertCircle,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RevenueMetrics } from '@/lib/types/analytics/subscription-analytics.type';

type RevenueMetricsProps = {
  data: RevenueMetrics;
};

/**
 * Format currency value.
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
 * Format percentage value.
 *
 * @param value - Numeric value to format
 * @returns Formatted percentage string
 */
function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Revenue metrics component.
 * Displays key revenue and subscription metrics in card format.
 */
export function RevenueMetrics({ data }: RevenueMetricsProps) {
  const metrics = [
    {
      title: 'Monthly Recurring Revenue',
      value: formatCurrency(data.totalMRR),
      icon: DollarSign,
      description: 'Current MRR',
      trend:
        data.revenueGrowthRate > 0
          ? {
              value: formatPercentage(data.revenueGrowthRate),
              direction: 'up' as const,
            }
          : data.revenueGrowthRate < 0
            ? {
                value: formatPercentage(Math.abs(data.revenueGrowthRate)),
                direction: 'down' as const,
              }
            : null,
    },
    {
      title: 'Annual Recurring Revenue',
      value: formatCurrency(data.totalARR),
      icon: TrendingUp,
      description: 'Projected ARR',
    },
    {
      title: 'Active Subscriptions',
      value: data.totalActiveSubscriptions.toString(),
      icon: Users,
      description: `${data.newSubscriptionsThisMonth} new this month`,
      trend:
        data.newSubscriptionsThisMonth > 0
          ? {
              value: `+${data.newSubscriptionsThisMonth}`,
              direction: 'up' as const,
            }
          : null,
    },
    {
      title: 'Average Revenue Per User',
      value: formatCurrency(data.averageRevenuePerUser),
      icon: DollarSign,
      description: 'ARPU',
    },
    {
      title: 'Churn Rate',
      value: formatPercentage(data.churnRate),
      icon: AlertCircle,
      description: `${data.churnedSubscriptionsThisMonth} churned this month`,
      trend:
        data.churnRate > 5
          ? {
              value: 'High',
              direction: 'down' as const,
            }
          : {
              value: 'Low',
              direction: 'up' as const,
            },
    },
    {
      title: 'New Subscriptions',
      value: data.newSubscriptionsThisMonth.toString(),
      icon: Calendar,
      description: 'This month',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric) => {
        const Icon = metric.icon;

        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">{metric.value}</div>
                {metric.trend && (
                  <div
                    className={`flex items-center gap-1 text-xs ${
                      metric.trend.direction === 'up'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {metric.trend.direction === 'up' ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    <span>{metric.trend.value}</span>
                  </div>
                )}
              </div>
              {metric.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.description}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
