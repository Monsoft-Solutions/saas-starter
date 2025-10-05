import { Suspense } from 'react';
import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';
import { UserTable } from '@/components/admin/users/user-table.component';
import { UserFilters } from '@/components/admin/users/user-filters.component';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Admin user management page.
 * Displays searchable, filterable table of all users with management actions.
 */
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string; page?: string }>;
}) {
  // Verify super-admin access
  await requireSuperAdminContext();

  // Await searchParams in Next.js 15
  const params = await searchParams;
  const search = params.search;
  const role = params.role;
  const page = params.page ? parseInt(params.page) : 1;

  return (
    <div className="page-container">
      <div className="stack-lg">
        {/* Header */}
        <div className="stack-sm">
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage all users, update roles, and control access
          </p>
        </div>

        {/* Filters */}
        <UserFilters />

        {/* User Table */}
        <Suspense fallback={<TableSkeleton />}>
          <UserTable search={search} role={role} page={page} />
        </Suspense>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="stack-md">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-48" />
      </div>
    </div>
  );
}
