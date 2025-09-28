import { Check, Crown } from 'lucide-react';
import { cn } from '@/lib/design-system';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { checkoutAction, customerPortalAction } from '@/lib/payments/actions';
import type { StripePrice } from '@/lib/types/payments';

interface PricingCardProps {
  /**
   * Product/plan name (e.g., "Base", "Plus")
   */
  name: string;
  /**
   * Product description
   */
  description?: string | null;
  /**
   * Price information for the selected interval
   */
  price: StripePrice | null;
  /**
   * List of features included in this plan
   */
  features: string[];
  /**
   * Whether this is the user's current plan
   */
  isCurrentPlan?: boolean;
  /**
   * Whether this plan is popular/recommended
   */
  isPopular?: boolean;
  /**
   * Additional CSS classes to apply to the card
   */
  className?: string;
}

/**
 * Enhanced pricing card component that displays plan information
 * and appropriate action buttons based on subscription status
 */
export function PricingCard({
  name,
  description,
  price,
  features,
  isCurrentPlan = false,
  isPopular = false,
  className,
}: PricingCardProps) {
  // Format price display
  const priceDisplay = price?.unitAmount
    ? `$${(price.unitAmount / 100).toFixed(0)}`
    : 'Contact us';

  const intervalDisplay = price?.interval === 'year' ? 'year' : 'month';
  const trialDays = price?.trialPeriodDays || 0;

  return (
    <div
      className={cn(
        'relative rounded-lg border bg-card p-6 shadow-sm transition-all duration-200',
        isPopular && 'border-primary shadow-lg scale-105',
        isCurrentPlan && 'border-primary/50 bg-primary/5',
        className
      )}
    >
      {/* Popular badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge
            variant="default"
            className="bg-primary text-primary-foreground"
          >
            Most Popular
          </Badge>
        </div>
      )}

      {/* Current plan badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <Crown className="w-3 h-3 mr-1" />
            Current Plan
          </Badge>
        </div>
      )}

      <div className="space-y-4">
        {/* Plan header */}
        <div>
          <h3 className="text-xl font-semibold text-foreground">{name}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
          {trialDays > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              with {trialDays} day free trial
            </p>
          )}
        </div>

        {/* Price display */}
        <div className="flex items-baseline">
          <span className="text-4xl font-bold text-foreground">
            {priceDisplay}
          </span>
          {price?.unitAmount && (
            <span className="text-lg text-muted-foreground ml-2">
              / {intervalDisplay}
            </span>
          )}
        </div>

        {/* Features list */}
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Action button */}
        <div className="pt-4">
          {isCurrentPlan ? (
            <form action={customerPortalAction} className="w-full">
              <Button
                type="submit"
                variant="outline"
                className="w-full"
                size="lg"
              >
                Manage Subscription
              </Button>
            </form>
          ) : price?.id ? (
            <form action={checkoutAction} className="w-full">
              <input type="hidden" name="priceId" value={price.id} />
              <Button
                type="submit"
                variant={isPopular ? 'default' : 'outline'}
                className="w-full"
                size="lg"
              >
                {trialDays > 0 ? `Start ${trialDays}-day trial` : 'Subscribe'}
              </Button>
            </form>
          ) : (
            <Button variant="outline" className="w-full" size="lg" disabled>
              Contact Sales
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
