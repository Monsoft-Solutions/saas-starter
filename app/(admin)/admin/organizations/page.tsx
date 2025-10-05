import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';

/**
 * Admin organizations management page.
 * List and manage all organizations in the system.
 */
export default async function AdminOrganizationsPage() {
  await requireSuperAdminContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground">
          Manage all organizations in the system
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Organization management interface will be implemented in Phase 5.4
        </p>
      </div>
    </div>
  );
}
