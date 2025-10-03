'use client';

import { cn } from '@/lib/utils';

export type BillingInterval = 'month' | 'year';

interface PricingToggleProps {
  /**
   * The currently selected billing interval
   */
  value: BillingInterval;
  /**
   * Callback function called when the interval changes
   */
  onChange: (interval: BillingInterval) => void;
  /**
   * Additional CSS classes to apply to the component
   */
  className?: string;
}

/**
 * Client component for toggling between monthly and annual billing intervals
 * Used within the PricingPlans component to switch pricing display
 */
export function PricingToggle({
  value,
  onChange,
  className,
}: PricingToggleProps) {
  return (
    <div className={cn('flex items-center justify-center mb-8', className)}>
      <div className="relative flex bg-muted/50 rounded-lg p-1">
        <button
          type="button"
          onClick={() => onChange('month')}
          className={cn(
            'relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
            value === 'month'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onChange('year')}
          className={cn(
            'relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
            value === 'year'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Annual
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            Save 20%
          </span>
        </button>
      </div>
    </div>
  );
}
