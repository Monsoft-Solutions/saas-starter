/**
 * GET /api/invitations/[invitationId]
 *
 * Public endpoint to fetch invitation details by ID.
 * Used for pre-filling email in sign-up/sign-in forms.
 * Returns only the email address for security purposes.
 *
 * Uses validated API handler with:
 * - Route param validation: invitationId must be non-empty string
 * - Output validation: Invitation details response schema
 * - Authentication: Not required (public endpoint)
 * - Authorization: None (public invitation lookup)
 */

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { invitation } from '@/lib/db/schemas';
import { eq } from 'drizzle-orm';
import {
  createValidatedRouteParamHandler,
  HandlerError,
} from '@/lib/server/validated-api-handler';
import { invitationDetailsResponseSchema } from '@/lib/types/invitations/invitation-details-response.schema';

// Schema for route parameters
const invitationParamsSchema = z.object({
  invitationId: z.string().min(1, 'Invalid invitation ID format'),
});

export const GET = createValidatedRouteParamHandler(
  invitationParamsSchema,
  z.object({}),
  invitationDetailsResponseSchema,
  async ({ params }) => {
    const { invitationId } = params;

    // Fetch invitation details
    const invitationDetails = await db
      .select({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      })
      .from(invitation)
      .where(eq(invitation.id, invitationId))
      .limit(1);

    const invitationData = invitationDetails[0];

    if (!invitationData) {
      throw new HandlerError('Invitation not found', 404);
    }

    // Check if invitation is expired
    if (invitationData.expiresAt < new Date()) {
      throw new HandlerError('Invitation has expired', 410);
    }

    // Check if invitation is still pending
    if (invitationData.status !== 'pending') {
      throw new HandlerError('Invitation has already been processed', 410);
    }

    // Return only the email for security (no need to expose other details)
    // Response is automatically validated against invitationDetailsResponseSchema
    return {
      email: invitationData.email,
    };
  },
  {
    logName: 'Get invitation details',
  }
);
