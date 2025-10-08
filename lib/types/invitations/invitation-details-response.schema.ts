import { z } from 'zod';

/**
 * Schema for invitation details response
 * GET /api/invitations/[invitationId]
 *
 * Returns only the email address for security purposes (no sensitive details exposed)
 */
export const invitationDetailsResponseSchema = z.object({
  email: z.string().email(),
});

/**
 * Type for invitation details response
 */
export type InvitationDetailsResponse = z.infer<
  typeof invitationDetailsResponseSchema
>;
