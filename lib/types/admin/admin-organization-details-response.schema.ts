import { z } from 'zod';

/**
 * Organization member schema for details response
 */
export const organizationMemberSchema = z.object({
  userId: z.string(),
  role: z.string(),
  joinedAt: z.date(),
  userName: z.string().nullable(),
  userEmail: z.string(),
  userImage: z.string().nullable(),
  userRole: z.string(),
  userBanned: z.boolean(),
});

export type OrganizationMember = z.infer<typeof organizationMemberSchema>;

/**
 * Response schema for organization details API
 */
export const adminOrganizationDetailsResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    logo: z.string().nullable(),
    createdAt: z.date(),
    stripeCustomerId: z.string().nullable(),
    stripeSubscriptionId: z.string().nullable(),
    stripeProductId: z.string().nullable(),
    planName: z.string().nullable(),
    subscriptionStatus: z.string(),
    members: z.array(organizationMemberSchema),
    memberCount: z.number(),
  })
  .strict();

export type AdminOrganizationDetailsResponse = z.infer<
  typeof adminOrganizationDetailsResponseSchema
>;
