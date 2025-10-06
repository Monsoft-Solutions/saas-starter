'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Building2,
  Users,
  Eye,
  MoreHorizontal,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TablePagination } from '@/components/admin/shared/table-pagination.component';

/**
 * Organization data type
 */
type OrganizationData = {
  id: string;
  name: string;
  slug: string | null;
  logo: string | null;
  createdAt: Date;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeProductId: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
  memberCount: number;
};

type OrganizationTableProps = {
  organizations: OrganizationData[];
  total: number;
  limit: number;
  offset: number;
  isLoading?: boolean;
  onPageChange: (offset: number) => void;
  onLimitChange: (limit: number) => void;
  onOrganizationSelect: (organizationId: string) => void;
};

/**
 * Get subscription status badge variant
 */
function getSubscriptionStatusVariant(status: string) {
  switch (status) {
    case 'active':
      return 'default';
    case 'trialing':
      return 'secondary';
    case 'canceled':
      return 'destructive';
    case 'past_due':
      return 'destructive';
    case 'unpaid':
      return 'destructive';
    case 'incomplete':
      return 'outline';
    default:
      return 'outline';
  }
}

/**
 * Organization table component with pagination and actions.
 */
export function OrganizationTable({
  organizations,
  total,
  limit,
  offset,
  isLoading = false,
  onPageChange,
  onLimitChange,
  onOrganizationSelect,
}: OrganizationTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /**
   * Handle organization deletion
   */
  const handleDelete = async (
    organizationId: string,
    organizationName: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete "${organizationName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(organizationId);

    try {
      const response = await fetch(
        `/api/admin/organizations/${organizationId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete organization');
      }

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete organization:', error);
      alert('Failed to delete organization. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Navigate to organization in main app
   */
  const handleViewInApp = (slugOrId: string) => {
    window.open(`/app?org=${slugOrId}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: limit }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                      <div className="space-y-1">
                        <div className="h-4 w-32 animate-pulse bg-muted" />
                        <div className="h-3 w-24 animate-pulse bg-muted" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-8 animate-pulse bg-muted" />
                  </TableCell>
                  <TableCell>
                    <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-12 animate-pulse bg-muted" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 animate-pulse bg-muted" />
                  </TableCell>
                  <TableCell>
                    <div className="h-8 w-8 animate-pulse bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No organizations found
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => (
                <TableRow key={org.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={org.logo || undefined}
                          alt={org.name}
                        />
                        <AvatarFallback>
                          {org.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{org.name}</div>
                        <div className="text-sm text-muted-foreground">
                          /{org.slug || 'no-slug'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{org.memberCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {org.stripeSubscriptionId && org.subscriptionStatus ? (
                      <Badge
                        variant={getSubscriptionStatusVariant(
                          org.subscriptionStatus
                        )}
                      >
                        {org.subscriptionStatus}
                      </Badge>
                    ) : (
                      <Badge variant="outline">No subscription</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {org.planName ? (
                      <span className="text-sm font-medium">
                        {org.planName}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(org.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          disabled={deletingId === org.id}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => onOrganizationSelect(org.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleViewInApp(org.slug || org.id)}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View in App
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(org.id, org.name)}
                          className="text-destructive focus:text-destructive"
                          disabled={deletingId === org.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {deletingId === org.id ? 'Deleting...' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && organizations.length > 0 && (
        <TablePagination
          total={total}
          limit={limit}
          offset={offset}
          isLoading={isLoading}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      )}
    </div>
  );
}
