/**
 * Server actions that orchestrate the authentication lifecycle, organization management,
 * and billing entry points surfaced from the login area. Each action is wrapped with the
 * shared middleware utilities to keep validation, logging, and redirects consistent.
 */
'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  user as userTable,
  organization as organizationTable,
} from '@/lib/db/schemas';
// BetterAuth handles password hashing and session management internally
import { redirect } from 'next/navigation';
import { createCheckoutSession } from '@/lib/payments/stripe';
import { invalidateUserCache } from '@/lib/db/queries';
import { logActivity } from '@/lib/db/queries';
import {
  validatedAction,
  validatedActionWithUser,
} from '@/lib/auth/middleware';
import { authClient } from '@/lib/auth/auth-client';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { APP_BASE_PATH } from '@/config/navigation';
import {
  sendPasswordChangedEmailAsync,
  sendEmailChangeConfirmationEmailAsync,
  sendPasswordResetEmailAsync,
} from '@/lib/emails/enqueue';
import {
  createPasswordChangedNotification,
  createTeamInvitationNotification,
  createMemberRemovedNotification,
} from '@/lib/notifications/events';
import { env } from '@/lib/env';
import { ActivityType } from '@/lib/types';
import logger from '@/lib/logger/logger.service';
import { CacheKeys, cacheService } from '@/lib/cache';

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
  invitationId: z.string().optional(),
});

/**
 * Authenticates a user with BetterAuth, logs the result, and optionally initiates checkout.
 */
export const signIn = validatedAction(
  signInSchema,
  async (requestData, formData) => {
    const { email, password, invitationId } = requestData;

    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    if (!result.user) {
      return {
        error: 'Invalid email or password',
        email,
        password,
      };
    }

    const user = result.user;

    await logActivity({ userId: user.id, action: ActivityType.SIGN_IN });

    // TODO: add the activity log

    const redirectTo = formData.get('redirect') as string | null;
    if (redirectTo === 'checkout') {
      const priceId = formData.get('priceId') as string;
      return createCheckoutSession({
        priceId,
        userOverride: {
          id: user.id,
          // The session may not be established during sign-in, so pass the validated email explicitly.
          email,
        },
      });
    }

    // If there's an invitation ID, redirect to accept invitation page
    if (invitationId) {
      logger.info('[signin] User signed in with invitation', {
        userId: user.id,
        invitationId,
        email,
      });
      redirect(`/accept-invitation/${invitationId}`);
    }

    redirect(APP_BASE_PATH);
  }
);

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  inviteId: z.string().optional(),
  invitationId: z.string().optional(),
});

/**
 * Registers a new user, accepts pending invitations, and mirrors the checkout redirect flow.
 */
export const signUp = validatedAction(
  signUpSchema,
  async (requestData, formData) => {
    const { email, password, inviteId, invitationId } = requestData;

    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: email,
      },
    });

    if (!result.user) {
      return {
        error: 'Failed to create user',
        email,
        password,
      };
    }

    const createdUser = result.user;

    // Handle invitation acceptance (support both inviteId and invitationId for backward compatibility)
    const activeInvitationId = invitationId || inviteId;
    if (activeInvitationId) {
      logger.info(
        '[signup] User signed up with invitation, redirecting to accept invitation',
        {
          userId: createdUser.id,
          invitationId: activeInvitationId,
          email,
        }
      );

      // Redirect to accept invitation page where session will be properly established
      redirect(`/accept-invitation/${activeInvitationId}`);
    }

    await logActivity({ userId: createdUser.id, action: ActivityType.SIGN_UP });

    const redirectTo = formData.get('redirect') as string | null;
    if (redirectTo === 'checkout') {
      const priceId = formData.get('priceId') as string;
      return createCheckoutSession({
        priceId,
        userOverride: {
          id: createdUser.id,
          // Forward the sign-up email so checkout runs before BetterAuth hydrates headers.
          email,
        },
      });
    }

    redirect(APP_BASE_PATH);
  }
);

/**
 * Ends the current BetterAuth session and records the sign-out activity.
 */
export async function signOut() {
  await logActivity(ActivityType.SIGN_OUT);
  await auth.api.signOut({
    headers: await headers(),
  });
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
});

/**
 * Rotates the caller's password after verifying the current credentials and sends notifications.
 */
export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (requestData, _, user) => {
    const { currentPassword, newPassword, confirmPassword } = requestData;

    try {
      await auth.api.changePassword({
        body: {
          newPassword,
          currentPassword,
          revokeOtherSessions: true,
        },
      });
    } catch (error) {
      console.error(error);
      return {
        error: 'Failed to update password',
        currentPassword,
        newPassword,
        confirmPassword,
      };
    }

    await logActivity(ActivityType.UPDATE_PASSWORD);

    // Invalidate user cache after password update
    await invalidateUserCache(user.id);

    // Send password changed confirmation email
    try {
      await sendPasswordChangedEmailAsync({
        to: user.email,
        recipientName: user.name || user.email.split('@')[0],
        changedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to send password changed email:', error);
      // Don't fail the password update if email fails - log and continue
    }

    // Create in-app notification
    const requestHeaders = await headers();
    const ipAddress = requestHeaders.get('x-forwarded-for');
    await createPasswordChangedNotification(
      user.id,
      ipAddress ?? undefined
    ).catch((err) =>
      logger.error('Failed to create password changed notification', {
        error: err.message,
        userId: user.id,
      })
    );

    return {
      success: 'Password updated successfully.',
    };
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100),
});

/**
 * Soft deletes the caller's account after confirming their password and auditing the action.
 */
export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;

    // Soft delete
    await authClient.deleteUser({
      password,
    });

    await logActivity(ActivityType.DELETE_ACCOUNT);

    await invalidateUserCache(user.id);

    redirect('/sign-in');
  }
);

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
});

/**
 * Updates profile details, handles email change confirmations, and keeps the user record in sync.
 */
export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { name, email } = data;
    const oldEmail = user.email;
    const requestHeaders = await headers();

    if (email && email !== oldEmail) {
      // Send confirmation emails to both old and new addresses
      const confirmationToken = crypto.randomUUID(); // In a real app, this would be a proper token
      const confirmationUrl = `${env.BASE_URL}/api/auth/confirm-email-change?token=${confirmationToken}`;

      try {
        // Send confirmation emails asynchronously to both addresses
        await Promise.all([
          sendEmailChangeConfirmationEmailAsync({
            to: email,
            recipientName: name || email.split('@')[0],
            confirmationUrl,
            newEmail: email,
            oldEmail,
          }),
          sendEmailChangeConfirmationEmailAsync({
            to: oldEmail,
            recipientName: user.name || oldEmail.split('@')[0],
            confirmationUrl,
            newEmail: email,
            oldEmail,
          }),
        ]);
      } catch (error) {
        console.error(
          'Failed to send email change confirmation emails:',
          error
        );
        // Don't fail the account update if email fails - log and continue
      }

      // Note: In a production app, you'd want to implement proper email confirmation
      // For now, we'll proceed with the email change
      await authClient.changeEmail({
        newEmail: email,
      });
    }

    await Promise.all([
      auth.api.updateUser({
        body: {
          name,
        },
        headers: requestHeaders,
      }),
      logActivity(ActivityType.UPDATE_ACCOUNT),
      invalidateUserCache(user.id), // Invalidate user cache after account update
      cacheService.invalidatePattern(CacheKeys.serverContext(requestHeaders)),
      cacheService.invalidatePattern(CacheKeys.serverSession(requestHeaders)),
    ]);

    return { name, success: 'Account updated successfully.' };
  }
);

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * Issues a password reset email when the account exists without revealing lookup results.
 */
export const forgotPassword = validatedAction(
  forgotPasswordSchema,
  async (data) => {
    const { email } = data;

    // Check if user exists
    const existingUsers = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1);

    if (existingUsers.length === 0) {
      // Don't reveal if email exists or not for security
      return {
        success:
          'If an account with that email exists, you will receive a password reset link.',
      };
    }

    const foundUser = existingUsers[0];

    // Generate reset token (in production, use a proper token system)
    const resetToken = crypto.randomUUID();
    const resetUrl = `${env.BASE_URL}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmailAsync({
        to: email,
        recipientName: foundUser.name || email.split('@')[0],
        resetUrl,
        expiresInMinutes: 60, // 1 hour expiry
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return {
        error: 'Failed to send password reset email. Please try again.',
      };
    }

    return { success: 'Password reset link sent to your email.' };
  }
);

const removeOrganizationMemberSchema = z.object({
  memberId: z.string().min(1),
});

/**
 * Removes a teammate from the active organization after validating membership and permissions.
 */
export const removeOrganizationMember = validatedActionWithUser(
  removeOrganizationMemberSchema,
  async (data) => {
    const { memberId } = data;
    const requestHeaders = await headers();

    const activeMember = await auth.api.getActiveMember({
      headers: requestHeaders,
    });

    if (!activeMember?.organizationId) {
      return { error: 'User is not part of an organization' };
    }

    // Get member details before removal for notification
    const memberList = await auth.api.listMembers({
      headers: requestHeaders,
      query: { organizationId: activeMember.organizationId },
    });
    const removedMember = memberList.members.find((m) => m.id === memberId);

    try {
      await auth.api.removeMember({
        headers: requestHeaders,
        body: {
          memberIdOrEmail: memberId,
          organizationId: activeMember.organizationId,
        },
      });
    } catch (error) {
      console.error('Failed to remove organization member:', error);
      return {
        error: 'Failed to remove member. Please try again.',
      };
    }

    await logActivity(ActivityType.REMOVE_ORGANIZATION_MEMBER);

    // Create in-app notification for removed member
    if (removedMember) {
      // Fetch organization name
      const org = await db
        .select({ name: organizationTable.name })
        .from(organizationTable)
        .where(eq(organizationTable.id, activeMember.organizationId))
        .limit(1);
      const orgName = org[0]?.name || 'Organization';

      await createMemberRemovedNotification(
        removedMember.user.id,
        removedMember.user.name || removedMember.user.email,
        orgName,
        activeMember.organizationId
      ).catch((err) =>
        logger.error('Failed to create member removed notification', {
          error: err.message,
          userId: removedMember.user.id,
        })
      );
    }

    return { success: 'Organization member removed successfully' };
  }
);

const inviteOrganizationMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['member', 'owner', 'admin']).default('member'),
});

/**
 * Sends an invitation to join the caller's organization, preventing duplicates and logging the event.
 */
export const inviteOrganizationMember = validatedActionWithUser(
  inviteOrganizationMemberSchema,
  async (data, _, currentUser) => {
    const { email, role } = data;
    const requestHeaders = await headers();

    const activeMember = await auth.api.getActiveMember({
      headers: requestHeaders,
    });

    if (!activeMember?.organizationId) {
      return { error: 'User is not part of an organization' };
    }

    // Authorization: only owners and admins can invite
    const inviterRole = (activeMember as { role?: string } | null)?.role;
    const canInvite = inviterRole === 'owner' || inviterRole === 'admin';
    if (!canInvite) {
      return { error: 'Insufficient permissions to invite members' };
    }

    // Only owners can assign the owner role
    if (role === 'owner' && inviterRole !== 'owner') {
      return { error: 'Only owners can assign the owner role' };
    }

    const organizationId = activeMember.organizationId;
    const trimmedEmail = email.trim();
    const normalizedEmail = trimmedEmail.toLowerCase();

    const memberList = await auth.api.listMembers({
      headers: requestHeaders,
      query: { organizationId },
    });

    const alreadyMember = memberList.members.some(
      (memberEntry) => memberEntry.user.email.toLowerCase() === normalizedEmail
    );

    if (alreadyMember) {
      return { error: 'User is already a member of this organization' };
    }

    const invitations = await auth.api.listInvitations({
      headers: requestHeaders,
      query: { organizationId },
    });

    const hasPendingInvitation = invitations.some(
      (invitation) =>
        invitation.email.toLowerCase() === normalizedEmail &&
        invitation.status === 'pending'
    );

    if (hasPendingInvitation) {
      return { error: 'An invitation has already been sent to this email' };
    }

    try {
      await auth.api.createInvitation({
        headers: requestHeaders,
        body: {
          email: trimmedEmail,
          role,
          organizationId,
        },
      });
    } catch (error) {
      console.error('Failed to send organization invitation:', error);
      return { error: 'Failed to send invitation. Please try again.' };
    }

    await logActivity(ActivityType.INVITE_ORGANIZATION_MEMBER);

    // Check if the invited email belongs to an existing user
    const invitedUsers = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, normalizedEmail))
      .limit(1);

    // Create in-app notification if user exists
    if (invitedUsers.length > 0) {
      const invitedUser = invitedUsers[0];

      // Fetch organization name
      const org = await db
        .select({ name: organizationTable.name })
        .from(organizationTable)
        .where(eq(organizationTable.id, organizationId))
        .limit(1);
      const orgName = org[0]?.name || 'Organization';

      await createTeamInvitationNotification(
        invitedUser.id,
        currentUser.name || currentUser.email,
        orgName,
        organizationId
      ).catch((err) =>
        logger.error('Failed to create team invitation notification', {
          error: err.message,
          userId: invitedUser.id,
        })
      );
    }

    return { success: 'Invitation sent successfully' };
  }
);

/**
 * Utility to append an organization-level activity entry for the authenticated user.
 */
export async function logOrganizationActivity(action: ActivityType) {
  await logActivity(action);

  return { success: 'Activity logged' };
}
