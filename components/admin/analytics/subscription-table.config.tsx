import { ExternalLink, Eye, TrendingUp } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { TableConfig } from '@/lib/types/table';
import { FilterFieldType } from '@/lib/types/table';
import type {
  SubscriptionTableData,
  SubscriptionTableFilters,
} from '@/lib/types/analytics/subscription-analytics.type';

/**
 * Get subscription status badge variant.
 * Maps subscription status to appropriate badge variant for visual consistency.
 *
 * @param status - The subscription status string
 * @returns Badge variant type
 */
function getSubscriptionStatusVariant(
  status: string | null
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default';
    case 'trialing':
      return 'secondary';
    case 'canceled':
    case 'past_due':
    case 'incomplete':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * Format currency value.
 *
 * @param value - Numeric value to format
 * @returns Formatted currency string
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Subscription table configuration.
 * Defines columns, filters, actions, and display settings for subscription analytics.
 */
export const subscriptionTableConfig: TableConfig<
  SubscriptionTableData,
  SubscriptionTableFilters
> = {
  tableId: 'subscriptions',
  apiEndpoint: '/api/admin/analytics/subscriptions',

  columns: [
    {
      accessorKey: 'organizationName',
      header: 'Organization',
      cell: ({ row }: { row: { original: SubscriptionTableData } }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={row.original.organizationLogo || undefined}
              alt={row.original.organizationName}
            />
            <AvatarFallback>
              {row.original.organizationName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{row.original.organizationName}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.memberCount}{' '}
              {row.original.memberCount === 1 ? 'member' : 'members'}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'planName',
      header: 'Plan',
      cell: ({ row }: { row: { original: SubscriptionTableData } }) =>
        row.original.planName ? (
          <Badge variant="outline">{row.original.planName}</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'subscriptionStatus',
      header: 'Status',
      cell: ({ row }: { row: { original: SubscriptionTableData } }) => (
        <Badge
          variant={getSubscriptionStatusVariant(
            row.original.subscriptionStatus
          )}
        >
          {row.original.subscriptionStatus || 'unknown'}
        </Badge>
      ),
    },
    {
      accessorKey: 'mrr',
      header: 'MRR',
      cell: ({ row }: { row: { original: SubscriptionTableData } }) => (
        <span className="font-semibold text-sm">
          {formatCurrency(row.original.mrr)}
        </span>
      ),
    },
    {
      accessorKey: 'customerLifetimeValue',
      header: 'LTV',
      cell: ({ row }: { row: { original: SubscriptionTableData } }) => (
        <span className="text-sm text-muted-foreground">
          {formatCurrency(row.original.customerLifetimeValue)}
        </span>
      ),
    },
    {
      accessorKey: 'startDate',
      header: 'Started',
      cell: ({ row }: { row: { original: SubscriptionTableData } }) =>
        row.original.startDate ? (
          <div className="text-sm">
            <div className="font-medium">
              {format(new Date(row.original.startDate), 'MMM d, yyyy')}
            </div>
            <div className="text-muted-foreground">
              {formatDistanceToNow(new Date(row.original.startDate), {
                addSuffix: true,
              })}
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
  ],

  filters: [
    {
      key: 'search',
      label: 'Search',
      type: FilterFieldType.SEARCH,
      placeholder: 'Search organizations...',
      debounceMs: 300,
      formatBadgeLabel: (value) => `Search: ${value}`,
    },
    {
      key: 'status',
      label: 'Status',
      type: FilterFieldType.SELECT,
      placeholder: 'All Statuses',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Trialing', value: 'trialing' },
        { label: 'Canceled', value: 'canceled' },
        { label: 'Past Due', value: 'past_due' },
        { label: 'Incomplete', value: 'incomplete' },
      ],
      formatBadgeLabel: (value) => `Status: ${value}`,
    },
    {
      key: 'planName',
      label: 'Plan',
      type: FilterFieldType.SELECT,
      placeholder: 'All Plans',
      options: [
        { label: 'Basic', value: 'Basic' },
        { label: 'Pro', value: 'Pro' },
        { label: 'Enterprise', value: 'Enterprise' },
      ],
      formatBadgeLabel: (value) => `Plan: ${value}`,
    },
  ],

  actions: [
    {
      id: 'view-details',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => {
        console.log('View subscription details:', row.id);
      },
    },
    {
      id: 'view-stripe',
      label: 'View in Stripe',
      icon: ExternalLink,
      onClick: (row) => {
        if (row.stripeCustomerId) {
          window.open(
            `https://dashboard.stripe.com/customers/${row.stripeCustomerId}`,
            '_blank'
          );
        }
      },
    },
  ],

  pagination: {
    defaultLimit: 50,
    pageSizeOptions: [25, 50, 100],
    showPageSizeSelector: true,
  },

  emptyState: {
    icon: TrendingUp,
    title: 'No subscriptions found',
    description: 'Try adjusting your search or filter criteria',
  },

  skeletonRows: 10,
};
