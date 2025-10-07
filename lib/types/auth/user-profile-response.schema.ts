import { z } from 'zod';

/**
 * Zod schema for user profile response.
 * Contains public user information safe to expose via API.
 * Excludes sensitive fields like password hashes and tokens.
 */
export const userProfileResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  role: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  // Admin-specific fields (only included for admin users)
  banned: z.boolean().optional(),
  banReason: z.string().nullable().optional(),
  banExpires: z.date().nullable().optional(),
});

/**
 * User profile response type (inferred from schema).
 * Use this for API responses that return user profile data.
 */
export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>;

/**
 * Minimal user profile schema for public contexts (e.g., team member list).
 * Contains only essential public information.
 */
export const minimalUserProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  image: z.string().nullable(),
});

/**
 * Minimal user profile type (inferred from schema).
 * Use for public user references where minimal data is needed.
 */
export type MinimalUserProfile = z.infer<typeof minimalUserProfileSchema>;
