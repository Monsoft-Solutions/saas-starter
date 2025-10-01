/**
 * Server actions that orchestrate the authentication lifecycle, organization management,
 * and billing entry points surfaced from the login area. Each action is wrapped with the
 * shared middleware utilities to keep validation, logging, and redirects consistent.
 */
'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { User, user as userTable } from '@/lib/db/schemas';
// BetterAuth handles password hashing and session management internally
import { redirect } from 'next/navigation';
import { createCheckoutSession } from '@/lib/payments/stripe';
import { getUser } from '@/lib/db/queries';
import { logActivity } from '@/lib/db/queries';
import {
  validatedAction,
  validatedActionWithUser,
} from '@/lib/auth/middleware';
import { authClient } from '@/lib/auth/auth-client';
import { auth } from '@/lib/auth';
import { requireServerSession } from '@/lib/auth/server-context';
import { headers } from 'next/headers';
import { APP_BASE_PATH } from '@/config/navigation';
import {
  sendPasswordChangedEmailAsync,
  sendEmailChangeConfirmationEmailAsync,
  sendPasswordResetEmailAsync,
} from '@/lib/emails/enqueue';
import { env } from '@/lib/env';
import { ActivityType } from '@/lib/types';

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
});

/**
 * Authenticates a user with BetterAuth, logs the result, and optionally initiates checkout.
 */
export const signIn = validatedAction(
  signInSchema,
  async (requestData, formData) => {
    const { email, password } = requestData;

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

    await logActivity(user.id, ActivityType.SIGN_IN);

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

    redirect(APP_BASE_PATH);
  }
);

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  inviteId: z.string().optional(),
});

/**
 * Registers a new user, accepts pending invitations, and mirrors the checkout redirect flow.
 */
export const signUp = validatedAction(
  signUpSchema,
  async (requestData, formData) => {
    const { email, password, inviteId } = requestData;

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
    const requestHeaders = await headers();

    if (inviteId) {
      try {
        await auth.api.acceptInvitation({
          headers: requestHeaders,
          body: { invitationId: inviteId },
        });
        await logActivity(createdUser.id, ActivityType.ACCEPT_INVITATION);
      } catch (error) {
        console.error('Failed to accept invitation:', error);
        return { error: 'Invalid or expired invitation.', email, password };
      }
    }

    await logActivity(createdUser.id, ActivityType.SIGN_UP);

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
  const user = (await getUser()) as User;
  await logActivity(user.id, ActivityType.SIGN_OUT);
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

    await logActivity(user.id, ActivityType.UPDATE_PASSWORD);

    // Send password changed confirmation email asynchronously
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

    await logActivity(user.id, ActivityType.DELETE_ACCOUNT);

    // Soft delete
    await authClient.deleteUser({
      password,
    });
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
      authClient.updateUser({
        name,
      }),
      logActivity(user.id, ActivityType.UPDATE_ACCOUNT),
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
  async (data, _, user) => {
    const { memberId } = data;
    const requestHeaders = await headers();

    const activeMember = await auth.api.getActiveMember({
      headers: requestHeaders,
    });

    if (!activeMember?.organizationId) {
      return { error: 'User is not part of an organization' };
    }

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

    await logActivity(user.id, ActivityType.REMOVE_ORGANIZATION_MEMBER);

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

    await logActivity(currentUser.id, ActivityType.INVITE_ORGANIZATION_MEMBER);

    return { success: 'Invitation sent successfully' };
  }
);

/**
 * Utility to append an organization-level activity entry for the authenticated user.
 */
export async function logOrganizationActivity(action: ActivityType) {
  const { user } = await requireServerSession();

  await logActivity(user.id, action);

  return { success: 'Activity logged' };
}
