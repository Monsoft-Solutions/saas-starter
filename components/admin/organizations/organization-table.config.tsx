import { Building2, Eye, ExternalLink, Trash2, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type {
  TableConfig,
  OrganizationTableData,
  OrganizationTableFilters,
} from '@/lib/types/table';
import { FilterFieldType } from '@/lib/types/table';

/**
 * Get subscription status badge variant.
 * Maps subscription status to appropriate badge variant for visual consistency.
 *
 * @param status - The subscription status string
 * @returns Badge variant type
 */
function getSubscriptionStatusVariant(status: string) {
  switch (status) {
    case 'active':
      return 'default';
    case 'trialing':
      return 'secondary';
    case 'canceled':
    case 'past_due':
    case 'unpaid':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * Organization table configuration.
 * Defines columns, filters, actions, and display settings for the admin organizations table.
 */
export const organizationTableConfig: TableConfig<
  OrganizationTableData,
  OrganizationTableFilters
> = {
  tableId: 'organizations',
  apiEndpoint: '/api/admin/organizations',

  columns: [
    {
      accessorKey: 'name',
      header: 'Organization',
      cell: ({ row }: { row: { original: OrganizationTableData } }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={row.original.logo || undefined}
              alt={row.original.name}
            />
            <AvatarFallback>
              {row.original.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-sm text-muted-foreground">
              /{row.original.slug || 'no-slug'}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'memberCount',
      header: 'Members',
      cell: ({ row }: { row: { original: OrganizationTableData } }) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{row.original.memberCount}</span>
        </div>
      ),
    },
    {
      accessorKey: 'subscriptionStatus',
      header: 'Subscription',
      cell: ({ row }: { row: { original: OrganizationTableData } }) => {
        if (
          row.original.stripeSubscriptionId &&
          row.original.subscriptionStatus
        ) {
          return (
            <Badge
              variant={getSubscriptionStatusVariant(
                row.original.subscriptionStatus
              )}
            >
              {row.original.subscriptionStatus}
            </Badge>
          );
        }
        return <Badge variant="outline">No subscription</Badge>;
      },
    },
    {
      accessorKey: 'planName',
      header: 'Plan',
      cell: ({ row }: { row: { original: OrganizationTableData } }) =>
        row.original.planName ? (
          <span className="text-sm font-medium">{row.original.planName}</span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: { row: { original: OrganizationTableData } }) => (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(row.original.createdAt), {
            addSuffix: true,
          })}
        </span>
      ),
    },
  ],

  filters: [
    {
      key: 'search',
      label: 'Search',
      type: FilterFieldType.SEARCH,
      placeholder: 'Search organizations by name or slug...',
      debounceMs: 300,
      formatBadgeLabel: (value) => `Search: ${value}`,
    },
    {
      key: 'subscriptionStatus',
      label: 'Subscription Status',
      type: FilterFieldType.SELECT,
      placeholder: 'All Statuses',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Canceled', value: 'canceled' },
        { label: 'Trial', value: 'trialing' },
        { label: 'Past Due', value: 'past_due' },
        { label: 'Unpaid', value: 'unpaid' },
        { label: 'Incomplete', value: 'incomplete' },
      ],
      formatBadgeLabel: (value) => `Status: ${value}`,
    },
    {
      key: 'hasSubscription',
      label: 'Subscription',
      type: FilterFieldType.BOOLEAN,
      placeholder: 'All Organizations',
      formatBadgeLabel: (value) =>
        value ? 'With Subscription' : 'No Subscription',
    },
  ],

  actions: [
    {
      id: 'view-details',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => {
        console.log('View details:', row.id);
      },
    },
    {
      id: 'view-in-app',
      label: 'View in App',
      icon: ExternalLink,
      onClick: (row) => {
        window.open(`/app?org=${row.slug || row.id}`, '_blank');
      },
      separator: true,
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive' as const,
      onClick: () => {
        // Handler will be overridden in the component
      },
    },
  ],

  pagination: {
    defaultLimit: 50,
    pageSizeOptions: [10, 25, 50, 100],
    showPageSizeSelector: true,
  },

  emptyState: {
    icon: Building2,
    title: 'No organizations found',
    description: 'Try adjusting your search or filter criteria',
  },

  skeletonRows: 10,
};
