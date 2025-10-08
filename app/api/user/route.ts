/**
 * GET /api/user
 *
 * Get the currently authenticated user's profile.
 *
 * Uses validated API handler with:
 * - Input validation: None (no query parameters)
 * - Output validation: User profile response schema
 * - Authentication: Required (withApiAuth)
 */

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { createValidatedAuthenticatedHandler } from '@/lib/server/validated-api-handler';
import { HandlerError } from '@/lib/server/validated-route-param-handler';
import { userProfileResponseSchema } from '@/lib/types/auth/user-profile-response.schema';
import { db } from '@/lib/db/drizzle';
import { user } from '@/lib/db/schemas';

// Empty schema for GET requests with no parameters
const emptySchema = z.object({});

export const GET = createValidatedAuthenticatedHandler(
  emptySchema,
  userProfileResponseSchema,
  async ({ context }) => {
    // Fetch full user data from database to ensure all fields are present
    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, context.user.id))
      .limit(1);

    if (!userData[0]) {
      throw new HandlerError('User not found', 404);
    }

    const userRecord = userData[0];

    // Transform the user data to match the response schema
    // Convert null to undefined for optional fields
    return {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      image: userRecord.image,
      role: userRecord.role,
      createdAt: userRecord.createdAt,
      updatedAt: userRecord.updatedAt,
      // Optional admin fields - convert null to undefined
      banned: userRecord.banned ?? undefined,
      banReason: userRecord.banReason ?? undefined,
      banExpires: userRecord.banExpires ?? undefined,
    };
  },
  {
    inputSource: 'query',
    logName: 'Get current user',
  }
);
