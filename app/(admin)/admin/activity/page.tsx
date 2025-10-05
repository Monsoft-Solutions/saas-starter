import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';

/**
 * Admin activity logs page.
 * View and filter system activity logs.
 */
export default async function AdminActivityPage() {
  await requireSuperAdminContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
        <p className="text-muted-foreground">System-wide activity monitoring</p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Activity log interface will be implemented in Phase 5.6
        </p>
      </div>
    </div>
  );
}
