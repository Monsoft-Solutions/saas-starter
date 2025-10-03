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

type AcceptInvitationPageProps = {
  params: Promise<{
    invitationId: string;
  }>;
};

export default async function AcceptInvitationPage({
  params,
}: AcceptInvitationPageProps) {
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

    // If user is authenticated, try to accept the invitation
    if (session) {
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

        // Redirect to the organization dashboard
        redirect('/app');
      } catch (error) {
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
    logger.error('[invitation] Failed to load invitation', {
      invitationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    redirect('/sign-in?error=invitation-load-failed');
  }
}
