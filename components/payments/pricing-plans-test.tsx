import { PricingPlansServer } from './pricing-plans-server';
import { getServerContext } from '@/lib/auth/server-context';

/**
 * Test component to demonstrate the new pricing plans functionality
 * This shows how to use the PricingPlansServer component in both authenticated and public contexts
 */
export async function PricingPlansTest() {
  // Get the current user session (will be null if not authenticated)
  const context = await getServerContext();

  const user = context?.user ?? null;

  return (
    <div className="py-12">
      <div className="page-container">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan for your needs. All plans include a free
            trial period.
          </p>
          {user && (
            <p className="text-sm text-muted-foreground mt-2">
              Welcome back, {user.name || user.email}!
            </p>
          )}
        </div>

        <PricingPlansServer
          user={user}
          defaultInterval="month"
          className="max-w-6xl mx-auto"
        />
      </div>
    </div>
  );
}
