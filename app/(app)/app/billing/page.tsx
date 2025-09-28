import { PricingPlansServer } from '@/components/payments';
import { redirect } from 'next/navigation';
import { getServerContext } from '@/lib/auth/server-context';

// Force dynamic rendering to ensure user session is always fresh
export const dynamic = 'force-dynamic';

/**
 * Authenticated billing page that shows pricing plans with current subscription status
 * This page demonstrates the reusability of the PricingPlansServer component
 */
export default async function BillingPage() {
  // Get the current user session - this should always exist due to middleware protection
  const context = await getServerContext();

  // Redirect to sign-in if no session (extra safety check)
  if (!context) {
    redirect('/sign-in');
  }

  const { user } = context;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Billing & Subscription
          </h1>
          <p className="text-muted-foreground">
            Manage your subscription plan and view billing details.
          </p>
        </div>

        {/* User Welcome Message */}
        <div className="mb-8 p-4 bg-muted/50 rounded-lg border">
          <p className="text-sm text-muted-foreground">
            Welcome back, <strong>{user.name || user.email}</strong>! You can
            upgrade, downgrade, or manage your subscription below.
          </p>
        </div>

        {/* Pricing Plans */}
        <PricingPlansServer
          user={user}
          defaultInterval="month"
          className="max-w-6xl mx-auto"
        />

        {/* Additional Information */}
        <div className="mt-12 p-6 bg-muted/30 rounded-lg border">
          <h3 className="text-lg font-semibold mb-3">Need Help?</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Billing Questions</h4>
              <p className="text-sm text-muted-foreground">
                Contact our support team for any billing-related questions or
                issues with your subscription.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Plan Changes</h4>
              <p className="text-sm text-muted-foreground">
                You can upgrade or downgrade your plan at any time. Changes take
                effect immediately with prorated billing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
