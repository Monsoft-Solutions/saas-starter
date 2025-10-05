import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';

/**
 * Admin dashboard page.
 * Main landing page for the admin panel showing system metrics and overview.
 */
export default async function AdminDashboardPage() {
  const context = await requireSuperAdminContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {context.user.name || context.user.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Total Users
          </div>
          <div className="mt-2 text-2xl font-bold">Coming soon</div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Total Organizations
          </div>
          <div className="mt-2 text-2xl font-bold">Coming soon</div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Active Subscriptions
          </div>
          <div className="mt-2 text-2xl font-bold">Coming soon</div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Monthly Revenue
          </div>
          <div className="mt-2 text-2xl font-bold">Coming soon</div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <p className="text-sm text-muted-foreground">
          Activity monitoring will be implemented in Phase 5.6
        </p>
      </div>
    </div>
  );
}
