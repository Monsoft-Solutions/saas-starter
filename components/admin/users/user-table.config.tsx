import { Eye, Shield, Ban, CheckCircle2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type {
  TableConfig,
  UserTableData,
  UserTableFilters,
} from '@/lib/types/table';
import { FilterFieldType } from '@/lib/types/table';

/**
 * User table configuration.
 * Defines columns, filters, actions, and display settings for the admin users table.
 */
export const userTableConfig: TableConfig<UserTableData, UserTableFilters> = {
  tableId: 'users',
  apiEndpoint: '/api/admin/users',

  columns: [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }: { row: { original: UserTableData } }) => (
        <div className="flex items-center gap-2">
          <div className="font-medium">{row.original.name}</div>
          {row.original.banned && (
            <Badge variant="destructive" className="text-xs">
              Banned
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }: { row: { original: UserTableData } }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.email}
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }: { row: { original: UserTableData } }) => {
        const role = row.original.role || 'user';
        const variant =
          role === 'super-admin'
            ? 'default'
            : role === 'admin'
              ? 'secondary'
              : 'outline';

        return (
          <Badge variant={variant} className="capitalize">
            {role === 'super-admin' && <Shield className="mr-1 h-3 w-3" />}
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'emailVerified',
      header: 'Verified',
      cell: ({ row }: { row: { original: UserTableData } }) =>
        row.original.emailVerified ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground" />
        ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: { row: { original: UserTableData } }) => (
        <div className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(row.original.createdAt), {
            addSuffix: true,
          })}
        </div>
      ),
    },
  ],

  filters: [
    {
      key: 'search',
      label: 'Search',
      type: FilterFieldType.SEARCH,
      placeholder: 'Search users by name or email...',
      debounceMs: 300,
      formatBadgeLabel: (value) => `Search: ${value}`,
    },
    {
      key: 'role',
      label: 'Role',
      type: FilterFieldType.SELECT,
      placeholder: 'All Roles',
      options: [
        { label: 'User', value: 'user' },
        { label: 'Admin', value: 'admin' },
        { label: 'Super Admin', value: 'super-admin' },
      ],
      formatBadgeLabel: (value) => `Role: ${value}`,
    },
  ],

  actions: [
    {
      id: 'view-details',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => {
        // Will be implemented with dialog state management
        console.log('View details:', row.id);
      },
      requiredPermission: 'users:read',
    },
    {
      id: 'update-role',
      label: 'Update Role',
      icon: Shield,
      onClick: (row) => {
        // Will be implemented with dialog state management
        console.log('Update role:', row.id);
      },
      separator: true,
      requiredPermission: 'users:write',
      permissionTooltip: 'Only super admins can update user roles',
    },
    {
      id: 'ban-user',
      label: (row) => (row.banned ? 'Unban User' : 'Ban User'),
      icon: Ban,
      variant: (row) => (row.banned ? 'success' : 'destructive'),
      onClick: (row) => {
        // Will be implemented with dialog state management
        console.log('Ban/unban user:', row.id);
      },
      requiredPermission: 'users:write',
      permissionTooltip: 'Only super admins can ban/unban users',
    },
  ],

  pagination: {
    defaultLimit: 50,
    pageSizeOptions: [10, 25, 50, 100],
    showPageSizeSelector: true,
  },

  emptyState: {
    title: 'No users found',
    description: 'Try adjusting your search or filter criteria',
  },

  skeletonRows: 10,
};
