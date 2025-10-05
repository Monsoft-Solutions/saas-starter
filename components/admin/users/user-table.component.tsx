import { listAllUsers } from '@/lib/db/queries/admin-user.query';
import { UserTableClient } from './user-table-client.component';

/**
 * Server component that fetches users and passes them to the client table.
 */
export async function UserTable({
  search,
  role,
  page = 1,
}: {
  search?: string;
  role?: string;
  page?: number;
}) {
  const limit = 50;
  const offset = (page - 1) * limit;

  // Fetch users from database
  const { users } = await listAllUsers({
    search,
    role: role && role !== 'all' ? role : undefined,
    limit,
    offset,
  });

  // Convert to the format expected by the client component
  const tableData = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    banned: user.banned,
    banReason: user.banReason,
    banExpires: user.banExpires,
    createdAt: user.createdAt,
  }));

  return <UserTableClient users={tableData} />;
}
