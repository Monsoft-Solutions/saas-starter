import { withOrganization } from '@/lib/server/api-handler';
import {
  organizationSubscriptionResponseSchema,
  type OrganizationSubscriptionResponse,
} from '@/lib/types/api/subscription.type';

export const GET = withOrganization(async ({ context }) => {
  const organization = context.organization;

  const response: OrganizationSubscriptionResponse =
    organizationSubscriptionResponseSchema.parse({
      organizationId: organization.id ?? null,
      organizationName: organization.name ?? null,
      stripeProductId: organization.stripeProductId ?? null,
      stripeSubscriptionId: organization.stripeSubscriptionId ?? null,
      planName: organization.planName ?? null,
      subscriptionStatus: organization.subscriptionStatus ?? null,
      stripeCustomerId: organization.stripeCustomerId ?? null,
    });

  return response;
});
