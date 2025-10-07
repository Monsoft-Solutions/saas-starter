/**
 * Metric card component for admin dashboard.
 * Displays a single metric with label, value, and optional trend indicator.
 */
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type MetricCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
}: MetricCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-6', className)}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-2xl font-bold">{value}</div>

        {trend && (
          <div
            className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value}%
          </div>
        )}
      </div>
    </div>
  );
}
