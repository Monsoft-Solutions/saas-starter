'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, PlusCircle } from 'lucide-react';

import { logOrganizationActivity } from '@/app/(login)/actions';
import { authClient } from '@/lib/auth/auth-client';
import type { OrganizationDetails } from '@/lib/db/queries';
import { useOrganizationSubscription } from '@/lib/hooks/api/subscriptions/use-organization-subscription.hook';
import { ActivityType } from '@/lib/types';

type ActionState = {
  error?: string;
  success?: string;
};

function getErrorMessage(error: unknown): string | null {
  if (!error) {
    return null;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    'message' in (error as Record<string, any>)
  ) {
    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' ? message : null;
  }

  return null;
}

function SubscriptionSkeleton() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-36" />
        </div>
      </CardContent>
    </Card>
  );
}

function OrganizationSubscriptionCard() {
  const { subscription, isLoading, error } = useOrganizationSubscription();

  const planLabel = subscription?.planName || 'Free';
  const status = subscription?.subscriptionStatus;
  const statusLabel =
    status === 'active'
      ? 'Billed monthly'
      : status === 'trialing'
        ? 'Trial period'
        : 'No active subscription';

  if (isLoading) {
    return <SubscriptionSkeleton />;
  }

  if (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Organization Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Organization Subscription</CardTitle>
        <CardDescription>
          {subscription?.organizationName && (
            <span className="text-sm">
              Organization: {subscription.organizationName}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium">Current Plan: {planLabel}</p>
            {status && (
              <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                {status === 'active'
                  ? 'Active'
                  : status === 'trialing'
                    ? 'Trial'
                    : 'Inactive'}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{statusLabel}</p>
          {subscription?.stripeCustomerId && (
            <p className="text-xs text-muted-foreground">
              Customer ID: {subscription.stripeCustomerId}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function OrganizationMembersSkeleton() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getUserDisplayName(
  user: OrganizationDetails['members'][number]['user']
) {
  return user.name || user.email || 'Unknown User';
}

function OrganizationMembers() {
  const organizationState = authClient.useActiveOrganization();
  const memberRoleState = authClient.useActiveMemberRole();

  const activeMemberState = authClient.useActiveMember();
  const [removalState, setRemovalState] = useState<ActionState>({});
  const [removingId, setRemovingId] = useState<string | null>(null);

  const organization = organizationState.data as OrganizationDetails | null;
  const errorMessage = getErrorMessage(organizationState.error);
  const isLoading = organizationState.isPending && !organization;
  const isOwner = memberRoleState.data?.role === 'owner';
  const activeMembershipId = activeMemberState.data?.id ?? null;

  if (isLoading) {
    return <OrganizationMembersSkeleton />;
  }

  if (errorMessage) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Organization Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!organization?.members?.length) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Organization Members</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No members yet.</p>
        </CardContent>
      </Card>
    );
  }

  const handleRemove = async (memberId: string) => {
    if (!isOwner) {
      return;
    }

    setRemovalState({});
    setRemovingId(memberId);

    try {
      const response = await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to remove member');
      }

      await logOrganizationActivity(ActivityType.REMOVE_ORGANIZATION_MEMBER);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to remove member';
      setRemovalState({ error: message });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Organization Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {organization.members.map((member) => {
            const canRemoveMember =
              isOwner &&
              member.role !== 'owner' &&
              member.id !== activeMembershipId;

            return (
              <div
                key={member.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    {member.user.image ? (
                      <AvatarImage
                        src={member.user.image}
                        alt={member.user.name}
                      />
                    ) : null}
                    <AvatarFallback>
                      {getUserDisplayName(member.user)
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {getUserDisplayName(member.user)}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {member.role}
                    </p>
                  </div>
                </div>
                {canRemoveMember && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemove(member.id)}
                    disabled={removingId === member.id}
                  >
                    {removingId === member.id ? 'Removing...' : 'Remove'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        {removalState?.error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{removalState.error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function InviteMemberSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

function InviteMemberCard() {
  const memberRoleState = authClient.useActiveMemberRole();
  const organizationState = authClient.useActiveOrganization();
  const [inviteState, setInviteState] = useState<ActionState>({});
  const [isInviting, setIsInviting] = useState(false);

  const isLoading = organizationState.isPending && !organizationState.data;
  const isOwner = memberRoleState.data?.role === 'owner';
  const organizationError = getErrorMessage(organizationState.error);

  if (isLoading) {
    return <InviteMemberSkeleton />;
  }

  if (organizationError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invite Organization Member</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{organizationError}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isOwner) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get('email') || '').trim();
    const roleValue = formData.get('role') as
      | 'member'
      | 'owner'
      | 'admin'
      | ('member' | 'owner' | 'admin')[]
      | null;
    const role = roleValue ?? 'member';

    if (!email) {
      setInviteState({ error: 'Email is required' });
      return;
    }

    setInviteState({});
    setIsInviting(true);

    try {
      const response = await authClient.organization.inviteMember({
        email,
        role,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send invitation');
      }

      await logOrganizationActivity(ActivityType.INVITE_ORGANIZATION_MEMBER);

      setInviteState({ success: 'Invitation sent successfully' });
      form.reset();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to send invitation';
      setInviteState({ error: message });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Organization Member</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email"
              required
              disabled={!isOwner}
            />
          </div>
          <div className="space-y-3">
            <Label>Role</Label>
            <RadioGroup
              defaultValue="member"
              name="role"
              className="flex space-x-4"
              disabled={!isOwner}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="member" id="member" />
                <Label htmlFor="member">Member</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="owner" id="owner" />
                <Label htmlFor="owner">Owner</Label>
              </div>
            </RadioGroup>
          </div>
          {inviteState?.error && (
            <Alert variant="destructive">
              <AlertDescription>{inviteState.error}</AlertDescription>
            </Alert>
          )}
          {inviteState?.success && (
            <Alert>
              <AlertDescription>{inviteState.success}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={isInviting || !isOwner}>
            {isInviting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inviting...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Invite Member
              </>
            )}
          </Button>
        </form>
      </CardContent>
      {!isOwner && (
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            You must be an organization owner to invite new members.
          </p>
        </CardFooter>
      )}
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Organization Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your organization subscription and members.
        </p>
      </div>
      <OrganizationSubscriptionCard />
      <OrganizationMembers />
      <InviteMemberCard />
    </div>
  );
}
