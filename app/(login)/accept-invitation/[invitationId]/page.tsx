/**
 * Invitation Acceptance Page
 *
 * Handles organization invitation acceptance flow for both authenticated and
 * unauthenticated users. Shows invitation details and guides users to sign up
 * or sign in as needed.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import logger from '@/lib/logger/logger.service';
import { InvitationLanding } from './invitation-landing.component';
import { db } from '@/lib/db/drizzle';
import { invitation, organization, user } from '@/lib/db/schemas';
import { eq } from 'drizzle-orm';
import { createInvitationAcceptedNotification } from '@/lib/notifications/events/team-events.helper';

type AcceptInvitationPageProps = {
  params: Promise<{
    invitationId: string;
  }>;
};

export default async function AcceptInvitationPage({
  params,
}: AcceptInvitationPageProps) {
  function isNextRedirectError(error: unknown): boolean {
    const maybe = error as { digest?: unknown } | null | undefined;
    return (
      !!maybe &&
      typeof maybe === 'object' &&
      typeof maybe.digest === 'string' &&
      (maybe.digest as string).startsWith('NEXT_REDIRECT')
    );
  }

  const { invitationId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  try {
    // Get invitation details directly from database
    const invitationDetails = await db
      .select({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        organizationId: invitation.organizationId,
        inviterId: invitation.inviterId,
        organization: {
          id: organization.id,
          name: organization.name,
        },
        inviter: {
          name: user.name,
          email: user.email,
        },
      })
      .from(invitation)
      .leftJoin(organization, eq(invitation.organizationId, organization.id))
      .leftJoin(user, eq(invitation.inviterId, user.id))
      .where(eq(invitation.id, invitationId))
      .limit(1);

    const invitationData = invitationDetails[0];

    if (!invitationData) {
      logger.error('[invitation] Invitation not found', { invitationId });
      redirect('/sign-in?error=invitation-not-found');
    }

    if (invitationData.status !== 'pending') {
      logger.warn('[invitation] Invitation already processed', {
        invitationId,
        status: invitationData.status,
      });
      redirect('/sign-in?error=invitation-already-processed');
    }

    // Enforce expiry before attempting acceptance
    if (invitationData.expiresAt < new Date()) {
      logger.warn('[invitation] Invitation expired', {
        invitationId,
      });
      redirect('/sign-in?error=invitation-not-found');
    }

    // If user is authenticated, try to accept the invitation
    if (session) {
      // Optional: ensure the signed-in user email matches the invited email
      const sessionEmail = session.user?.email?.toLowerCase?.();
      const invitedEmail = invitationData.email.toLowerCase();
      if (sessionEmail && sessionEmail !== invitedEmail) {
        logger.warn(
          '[invitation] Session email does not match invitation email',
          {
            invitationId,
            sessionEmail,
          }
        );
        redirect('/sign-in?error=invitation-failed');
      }
      try {
        const result = await auth.api.acceptInvitation({
          body: {
            invitationId,
          },
          headers: await headers(),
        });

        logger.info('[invitation] Invitation accepted successfully', {
          invitationId,
          userId: session.user.id,
          organizationId: result?.invitation?.organizationId,
        });

        // Ensure the accepted organization is set as active
        const acceptedOrgId =
          (result as any)?.invitation?.organizationId ??
          invitationData.organizationId;
        if (acceptedOrgId) {
          try {
            await auth.api.setActiveOrganization({
              headers: await headers(),
              body: { organizationId: acceptedOrgId },
            });
          } catch (error) {
            logger.warn(
              '[invitation] Failed to set active organization after acceptance',
              {
                error: error instanceof Error ? error.message : 'Unknown error',
              }
            );
          }
        }

        // Notify inviter that invitation was accepted
        try {
          const acceptedUserName = session.user.name || session.user.email;
          const orgName = invitationData.organization?.name || 'Organization';
          await createInvitationAcceptedNotification(
            invitationData.inviterId,
            acceptedUserName,
            orgName,
            invitationData.organizationId
          );
        } catch (error) {
          logger.warn(
            '[invitation] Failed to enqueue acceptance notification',
            {
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          );
        }

        // Redirect to the organization dashboard
        redirect('/app');
      } catch (error) {
        if (isNextRedirectError(error)) {
          throw error;
        }
        logger.error('[invitation] Failed to accept invitation', {
          invitationId,
          userId: session.user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        // Redirect to dashboard with error parameter
        redirect('/app?error=invitation-failed');
      }
    }

    // If user is not authenticated, show invitation landing page
    return (
      <InvitationLanding
        invitation={invitationData}
        invitationId={invitationId}
      />
    );
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    logger.error('[invitation] Failed to load invitation', {
      invitationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    redirect('/sign-in?error=invitation-load-failed');
  }
}
