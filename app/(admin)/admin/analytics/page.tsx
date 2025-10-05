import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';

/**
 * Admin analytics page.
 * View subscription and revenue analytics.
 */
export default async function AdminAnalyticsPage() {
  await requireSuperAdminContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Subscription and revenue analytics
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Analytics interface will be implemented in Phase 5.5
        </p>
      </div>
    </div>
  );
}
