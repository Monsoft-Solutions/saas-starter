import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';

/**
 * Admin users management page.
 * List and manage all users in the system.
 */
export default async function AdminUsersPage() {
  await requireSuperAdminContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">Manage all users in the system</p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          User management interface will be implemented in Phase 5.3
        </p>
      </div>
    </div>
  );
}
