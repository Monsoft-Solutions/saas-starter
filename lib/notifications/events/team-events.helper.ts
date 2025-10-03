import { jobDispatcher } from '@/lib/jobs/job-dispatcher.service';
import { JOB_TYPES } from '@/lib/types/jobs';
import type { NotificationEvent } from '@/lib/types/notifications';

/**
 * Create team invitation notification event
 *
 * @param userId - User being invited
 * @param inviterName - Name of the person who sent the invitation
 * @param organizationName - Name of the organization
 * @param organizationId - Organization ID for tracking
 * @returns Job ID of the enqueued notification
 */
export async function createTeamInvitationNotification(
  userId: string,
  inviterName: string,
  organizationName: string,
  organizationId: string
): Promise<string> {
  const event: NotificationEvent = {
    userId,
    type: 'team.invitation_received',
    priority: 'important',
    title: 'Team Invitation',
    message: `${inviterName} invited you to join ${organizationName}`,
    metadata: {
      actionUrl: '/invitations',
      actionLabel: 'View Invitation',
      inviterName,
      organizationName,
    },
  };

  return jobDispatcher.enqueue(
    JOB_TYPES.CREATE_NOTIFICATION,
    {
      ...event,
      category: 'team',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    {
      idempotencyKey: `team-invitation-${userId}-${organizationId}-${Date.now()}`,
    }
  );
}

/**
 * Create invitation accepted notification event
 *
 * @param userId - User to notify (typically the inviter or team members)
 * @param acceptedUserName - Name of user who accepted
 * @param organizationName - Name of the organization
 * @param organizationId - Organization ID for tracking
 * @returns Job ID of the enqueued notification
 */
export async function createInvitationAcceptedNotification(
  userId: string,
  acceptedUserName: string,
  organizationName: string,
  organizationId: string
): Promise<string> {
  const event: NotificationEvent = {
    userId,
    type: 'team.invitation_accepted',
    priority: 'info',
    title: 'Invitation Accepted',
    message: `${acceptedUserName} has joined ${organizationName}`,
    metadata: {
      actionUrl: `/team`,
      actionLabel: 'View Team',
      acceptedUserName,
      organizationName,
    },
  };

  return jobDispatcher.enqueue(
    JOB_TYPES.CREATE_NOTIFICATION,
    {
      ...event,
      category: 'team',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    {
      idempotencyKey: `invitation-accepted-${userId}-${acceptedUserName}-${organizationId}`,
    }
  );
}

/**
 * Create member added notification event
 *
 * @param userId - User to notify
 * @param memberName - Name of the new member
 * @param organizationName - Name of the organization
 * @param organizationId - Organization ID for tracking
 * @returns Job ID of the enqueued notification
 */
export async function createMemberAddedNotification(
  userId: string,
  memberName: string,
  organizationName: string,
  organizationId: string
): Promise<string> {
  const event: NotificationEvent = {
    userId,
    type: 'team.member_added',
    priority: 'info',
    title: 'New Team Member',
    message: `${memberName} has been added to ${organizationName}`,
    metadata: {
      actionUrl: '/team',
      actionLabel: 'View Team',
      memberName,
      organizationName,
    },
  };

  return jobDispatcher.enqueue(
    JOB_TYPES.CREATE_NOTIFICATION,
    {
      ...event,
      category: 'team',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    {
      idempotencyKey: `member-added-${userId}-${memberName}-${organizationId}-${Date.now()}`,
    }
  );
}

/**
 * Create member removed notification event
 *
 * @param userId - User to notify
 * @param memberName - Name of the removed member
 * @param organizationName - Name of the organization
 * @param organizationId - Organization ID for tracking
 * @returns Job ID of the enqueued notification
 */
export async function createMemberRemovedNotification(
  userId: string,
  memberName: string,
  organizationName: string,
  organizationId: string
): Promise<string> {
  const event: NotificationEvent = {
    userId,
    type: 'team.member_removed',
    priority: 'info',
    title: 'Team Member Removed',
    message: `${memberName} has been removed from ${organizationName}`,
    metadata: {
      actionUrl: '/team',
      actionLabel: 'View Team',
      memberName,
      organizationName,
    },
  };

  return jobDispatcher.enqueue(
    JOB_TYPES.CREATE_NOTIFICATION,
    {
      ...event,
      category: 'team',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    {
      idempotencyKey: `member-removed-${userId}-${memberName}-${organizationId}-${Date.now()}`,
    }
  );
}

/**
 * Create role changed notification event
 *
 * @param userId - User whose role changed
 * @param newRole - New role assigned
 * @param organizationName - Name of the organization
 * @param organizationId - Organization ID for tracking
 * @returns Job ID of the enqueued notification
 */
export async function createRoleChangedNotification(
  userId: string,
  newRole: string,
  organizationName: string,
  organizationId: string
): Promise<string> {
  const event: NotificationEvent = {
    userId,
    type: 'team.role_changed',
    priority: 'important',
    title: 'Role Updated',
    message: `Your role in ${organizationName} has been changed to ${newRole}`,
    metadata: {
      actionUrl: '/team',
      actionLabel: 'View Details',
      newRole,
      organizationName,
    },
  };

  return jobDispatcher.enqueue(
    JOB_TYPES.CREATE_NOTIFICATION,
    {
      ...event,
      category: 'team',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    {
      idempotencyKey: `role-changed-${userId}-${newRole}-${organizationId}-${Date.now()}`,
    }
  );
}
