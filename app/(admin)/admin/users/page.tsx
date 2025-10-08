import { listAllUsersAction } from '@/lib/actions/admin/list-users.action';
import { UserTable } from '@/components/admin/users/user-table.component';
import { requireAdminContext } from '@/lib/auth/admin-context';
import { userListFiltersSchema } from '@/lib/types/admin';

/**
 * Admin user management page.
 * Displays searchable, filterable table of all users with management actions.
 */
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    role?: string;
    limit?: string;
    offset?: string;
  }>;
}) {
  await requireAdminContext();

  const params = await searchParams;

  // Parse search parameters
  const filters = userListFiltersSchema.parse({
    search: params.search,
    role: params.role,
    limit: parseInt(params.limit ?? '50', 10),
    offset: parseInt(params.offset ?? '0', 10),
  });

  // Fetch users data
  const usersData = await listAllUsersAction(filters);

  // Convert to the format expected by the generic table (TableDataResponse)
  const initialData = usersData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage all users, update roles, and control access
        </p>
      </div>

      <UserTable initialData={initialData} initialFilters={filters} />
    </div>
  );
}
