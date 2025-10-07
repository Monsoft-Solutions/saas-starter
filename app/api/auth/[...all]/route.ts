import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import logger from '@/lib/logger/logger.service';
import { logActivity } from '@/lib/db/queries';
import { ActivityType } from '@/lib/types';

const handler = toNextJsHandler(auth.handler);

/**
 * Helper function to create redirects that preserve Set-Cookie headers from the original response.
 * This is critical for social login flows where BetterAuth sets session cookies in the initial response.
 *
 * @param targetUrl - The URL to redirect to
 * @param originalResponse - The original response containing Set-Cookie headers
 * @returns A new Response with preserved cookies
 */
const redirectWithCookies = (
  targetUrl: URL | string,
  originalResponse: Response
): Response => {
  const headersWithCookies = new Headers(originalResponse.headers);
  headersWithCookies.set('Location', targetUrl.toString());

  return new Response(null, {
    status: 302,
    headers: headersWithCookies,
  });
};

export async function GET(request: NextRequest) {
  const response = await handler.GET(request);

  // Check if this is a successful social login callback with invitation
  const url = new URL(request.url);
  const invitationId = url.searchParams.get('invitationId');

  // Accept both 2xx success and 3xx redirect status codes (social logins often return redirects)
  if (invitationId && response.status >= 200 && response.status < 400) {
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

          await logActivity(ActivityType.ACCEPT_INVITATION);

          logger.info('[social-login] Invitation accepted successfully', {
            userId: session.user.id,
            invitationId,
          });

          // Redirect to dashboard after successful invitation acceptance
          const dashboardUrl = new URL('/app', request.url);
          return redirectWithCookies(dashboardUrl, response);
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
          return redirectWithCookies(acceptUrl, response);
        }
      } else {
        // If no session, redirect to accept-invitation page
        const acceptUrl = new URL(
          '/accept-invitation/' + invitationId,
          request.url
        );
        return redirectWithCookies(acceptUrl, response);
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
      return redirectWithCookies(acceptUrl, response);
    }
  }

  return response;
}

export async function POST(request: NextRequest) {
  return handler.POST(request);
}
