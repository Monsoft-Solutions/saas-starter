/**
 * Organization Subscription API Route
 *
 * Retrieve subscription details for the authenticated user's organization.
 * Requires an active organization membership.
 *
 * @route GET /api/organization/subscription
 */

import { createValidatedOrganizationHandler } from '@/lib/server/validated-api-handler';
import { organizationSubscriptionResponseSchema } from '@/lib/types/api/subscription.type';
import z from 'zod';

/**
 * GET /api/organization/subscription
 *
 * Get organization subscription details
 */
export const GET = createValidatedOrganizationHandler(
  z.object({}),
  organizationSubscriptionResponseSchema,
  async ({ context }) => {
    const organization = context.organization;

    return {
      organizationId: organization.id ?? null,
      organizationName: organization.name ?? null,
      stripeProductId: organization.stripeProductId ?? null,
      stripeSubscriptionId: organization.stripeSubscriptionId ?? null,
      planName: organization.planName ?? null,
      subscriptionStatus: organization.subscriptionStatus ?? null,
      stripeCustomerId: organization.stripeCustomerId ?? null,
    };
  }
);
