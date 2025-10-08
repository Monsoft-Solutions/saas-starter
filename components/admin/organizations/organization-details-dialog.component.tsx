'use client';

import { formatDistanceToNow, format } from 'date-fns';
import { useAdminOrganization } from '@/lib/hooks/api/admin/use-admin-organizations.hook';
import {
  Building2,
  Users,
  CreditCard,
  ExternalLink,
  Mail,
  Shield,
  Crown,
  User,
  Ban,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

type OrganizationDetailsDialogProps = {
  organizationId: string;
  open: boolean;
  onClose: () => void;
};

/**
 * Get role icon
 */
function getRoleIcon(role: string) {
  switch (role) {
    case 'owner':
      return Crown;
    case 'admin':
      return Shield;
    case 'member':
      return User;
    default:
      return User;
  }
}

/**
 * Get role badge variant
 */
function getRoleBadgeVariant(role: string) {
  switch (role) {
    case 'owner':
      return 'default';
    case 'admin':
      return 'secondary';
    case 'member':
      return 'outline';
    default:
      return 'outline';
  }
}

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
 * Organization details dialog component.
 * Shows comprehensive organization information including members and subscription details.
 */
export function OrganizationDetailsDialog({
  organizationId,
  open,
  onClose,
}: OrganizationDetailsDialogProps) {
  // Fetch organization details using type-safe hook
  const {
    data: organization,
    error: fetchError,
    isLoading,
  } = useAdminOrganization(organizationId, {
    enabled: open && !!organizationId,
  });

  const error = fetchError?.message || null;

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    onClose();
  };

  /**
   * Navigate to organization in main app
   */
  const handleViewInApp = () => {
    if (organization) {
      window.open(`/app?org=${organization.slug}`, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Details
          </DialogTitle>
          <DialogDescription>
            View comprehensive information about this organization
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        ) : organization ? (
          <div className="space-y-6">
            {/* Organization Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={organization.logo || undefined}
                    alt={organization.name}
                  />
                  <AvatarFallback className="text-lg">
                    {organization.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{organization.name}</h3>
                  <p className="text-muted-foreground">/{organization.slug}</p>
                  <p className="text-sm text-muted-foreground">
                    Created{' '}
                    {formatDistanceToNow(new Date(organization.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
              <Button onClick={handleViewInApp} variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                View in App
              </Button>
            </div>

            <Separator />

            {/* Subscription Information */}
            <div>
              <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Status
                    </span>
                    {organization.stripeSubscriptionId ? (
                      <Badge
                        variant={getSubscriptionStatusVariant(
                          organization.subscriptionStatus
                        )}
                      >
                        {organization.subscriptionStatus}
                      </Badge>
                    ) : (
                      <Badge variant="outline">No subscription</Badge>
                    )}
                  </div>
                  {organization.planName && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Plan
                      </span>
                      <span className="text-sm font-medium">
                        {organization.planName}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {organization.stripeCustomerId && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Customer ID
                      </span>
                      <span className="text-sm font-mono">
                        {organization.stripeCustomerId}
                      </span>
                    </div>
                  )}
                  {organization.stripeSubscriptionId && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Subscription ID
                      </span>
                      <span className="text-sm font-mono">
                        {organization.stripeSubscriptionId}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Members */}
            <div>
              <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members ({organization.memberCount})
              </h4>

              {organization.members.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No members found
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>User Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organization.members.map((member) => {
                        const RoleIcon = getRoleIcon(member.role);
                        return (
                          <TableRow key={member.userId}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={member.userImage || undefined}
                                    alt={member.userName || member.userEmail}
                                  />
                                  <AvatarFallback>
                                    {(member.userName || member.userEmail)
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">
                                    {member.userName || 'Unnamed User'}
                                  </div>
                                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {member.userEmail}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getRoleBadgeVariant(member.role)}
                                className="gap-1"
                              >
                                <RoleIcon className="h-3 w-3" />
                                {member.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{member.userRole}</Badge>
                            </TableCell>
                            <TableCell>
                              {member.userBanned ? (
                                <Badge variant="destructive" className="gap-1">
                                  <Ban className="h-3 w-3" />
                                  Banned
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Active
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {format(
                                  new Date(member.joinedAt),
                                  'MMM d, yyyy'
                                )}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
