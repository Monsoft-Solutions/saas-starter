import { listAllUsersAction } from '@/lib/actions/admin/list-users.action';
import { UserTable } from '@/components/admin/users/user-table.component';
import { requireAdminContext } from '@/lib/auth/admin-context';
import { UserRole } from '@/lib/types/admin';

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
  const filters = {
    search: params.search,
    role: params.role as UserRole,
    limit: parseInt(params.limit ?? '50', 10),
    offset: parseInt(params.offset ?? '0', 10),
  };

  // Fetch users data
  const usersData = await listAllUsersAction(filters);

  // Convert to the format expected by the generic table (TableDataResponse)
  const tableData = usersData.users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    banned: user.banned,
    banReason: user.banReason,
    banExpires: user.banExpires,
    createdAt: user.createdAt,
    image: user.image,
  }));

  const initialData = {
    data: tableData,
    total: usersData.total,
    limit: filters.limit,
    offset: filters.offset,
  };

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
