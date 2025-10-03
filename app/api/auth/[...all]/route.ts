import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import logger from '@/lib/logger/logger.service';
import { logActivity } from '@/lib/db/queries';
import { ActivityType } from '@/lib/types';

const handler = toNextJsHandler(auth.handler);

export async function GET(request: NextRequest) {
  const response = await handler.GET(request);

  // Check if this is a successful social login callback with invitation
  const url = new URL(request.url);
  const invitationId = url.searchParams.get('invitationId');

  if (invitationId && response.status === 200) {
    try {
      // Wait a bit for the session to be fully established
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get the session
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (session?.user) {
        logger.info('[social-login] Processing invitation after social login', {
          userId: session.user.id,
          invitationId,
        });

        try {
          await auth.api.acceptInvitation({
            headers: await headers(),
            body: { invitationId },
          });

          await logActivity(session.user.id, ActivityType.ACCEPT_INVITATION);

          logger.info('[social-login] Invitation accepted successfully', {
            userId: session.user.id,
            invitationId,
          });

          // Redirect to dashboard after successful invitation acceptance
          const dashboardUrl = new URL('/app', request.url);
          return Response.redirect(dashboardUrl.toString(), 302);
        } catch (error) {
          logger.error('[social-login] Failed to accept invitation', {
            userId: session.user.id,
            invitationId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          // If invitation acceptance fails, redirect to accept-invitation page as fallback
          const acceptUrl = new URL(
            '/accept-invitation/' + invitationId,
            request.url
          );
          return Response.redirect(acceptUrl.toString(), 302);
        }
      } else {
        // If no session, redirect to accept-invitation page
        const acceptUrl = new URL(
          '/accept-invitation/' + invitationId,
          request.url
        );
        return Response.redirect(acceptUrl.toString(), 302);
      }
    } catch (error) {
      logger.error('[social-login] Failed to process invitation in callback', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback to accept-invitation page
      const acceptUrl = new URL(
        '/accept-invitation/' + invitationId,
        request.url
      );
      return Response.redirect(acceptUrl.toString(), 302);
    }
  }

  return response;
}

export async function POST(request: NextRequest) {
  return handler.POST(request);
}
