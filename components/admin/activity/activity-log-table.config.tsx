import { Eye, Activity } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { TableConfig } from '@/lib/types/table';
import { FilterFieldType } from '@/lib/types/table';
import type {
  ActivityLogTableData,
  ActivityLogTableFilters,
} from '@/lib/types/activity-log';

/**
 * Activity log table configuration.
 * Defines columns, filters, actions, and display settings for the admin activity logs table.
 */

// Helper function to format action labels
function formatActionLabel(action: string): string {
  // Convert snake_case or camelCase to Title Case
  return action
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Helper function to get action badge variant
function getActionBadgeVariant(
  action: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (action.startsWith('admin.')) return 'destructive';
  if (action.includes('failed') || action.includes('error'))
    return 'destructive';
  if (action.includes('create') || action.includes('sign_up')) return 'default';
  if (action.includes('delete') || action.includes('remove'))
    return 'destructive';
  return 'secondary';
}

export const activityLogTableConfig: TableConfig<
  ActivityLogTableData,
  ActivityLogTableFilters
> = {
  tableId: 'activity-logs',
  apiEndpoint: '/api/admin/activity',

  columns: [
    {
      accessorKey: 'timestamp',
      header: 'Time',
      cell: ({ row }: { row: { original: ActivityLogTableData } }) => (
        <div>
          <div className="font-medium">
            {format(row.original.timestamp, 'MMM d, HH:mm:ss')}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatDistanceToNow(row.original.timestamp, { addSuffix: true })}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'userEmail',
      header: 'User',
      cell: ({ row }: { row: { original: ActivityLogTableData } }) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.original.userImage ?? undefined} />
            <AvatarFallback>
              {row.original.userName
                ? row.original.userName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                : row.original.userEmail.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">
              {row.original.userName || 'Unknown User'}
            </div>
            <div className="text-sm text-muted-foreground">
              {row.original.userEmail}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }: { row: { original: ActivityLogTableData } }) => (
        <Badge variant={getActionBadgeVariant(row.original.action)}>
          {formatActionLabel(row.original.action)}
        </Badge>
      ),
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'action', // Use action as the accessor since we're displaying formatted action
      cell: ({ row }: { row: { original: ActivityLogTableData } }) => (
        <div className="text-sm">
          {/* For now, just show the action as description since we don't have a description field */}
          {formatActionLabel(row.original.action)}
        </div>
      ),
    },
    {
      accessorKey: 'ipAddress',
      header: 'IP Address',
      cell: ({ row }: { row: { original: ActivityLogTableData } }) => (
        <span className="font-mono text-sm">
          {row.original.ipAddress || '—'}
        </span>
      ),
    },
  ],

  filters: [
    {
      key: 'search',
      label: 'Search',
      type: FilterFieldType.SEARCH,
      placeholder: 'Search by user or action...',
      debounceMs: 300,
      formatBadgeLabel: (value) => `Search: ${value}`,
    },
    {
      key: 'action',
      label: 'Action',
      type: FilterFieldType.SELECT,
      placeholder: 'All Actions',
      options: [
        { label: 'User Login', value: 'SIGN_IN' },
        { label: 'User Logout', value: 'SIGN_OUT' },
        { label: 'User Created', value: 'SIGN_UP' },
        { label: 'Organization Created', value: 'CREATE_ORGANIZATION' },
        { label: 'Subscription Created', value: 'SUBSCRIPTION_CREATED' },
        { label: 'Subscription Canceled', value: 'SUBSCRIPTION_DELETED' },
        { label: 'Admin Role Updated', value: 'admin.user.role_updated' },
        { label: 'Admin User Banned', value: 'admin.user.banned' },
      ],
      formatBadgeLabel: (value) =>
        `Action: ${value ? formatActionLabel(value as string) : 'Unknown'}`,
    },
    {
      key: 'startDate',
      type: FilterFieldType.DATE,
      label: 'Start Date',
      placeholder: 'Select start date',
    },
    {
      key: 'endDate',
      type: FilterFieldType.DATE,
      label: 'End Date',
      placeholder: 'Select end date',
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
    },
  ],

  pagination: {
    defaultLimit: 100,
    pageSizeOptions: [50, 100, 250, 500],
    showPageSizeSelector: true,
  },

  emptyState: {
    icon: Activity,
    title: 'No activity logs found',
    description: 'Try adjusting your filters or date range',
  },
};
