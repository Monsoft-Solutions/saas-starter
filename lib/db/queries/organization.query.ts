import { and, eq } from 'drizzle-orm';
import { db } from '../drizzle';
import { member, organization } from '../schemas';
import { getServerContext } from '@/lib/auth/server-context';
import type { OrganizationDetails } from '@/lib/auth/server-context';

export async function getOrganizationByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(organization)
    .where(eq(organization.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateOrganizationSubscription(
  organizationId: string,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(organization)
    .set(subscriptionData)
    .where(eq(organization.id, organizationId));
}

export async function getOrganizationOwner(organizationId: string) {
  const result = await db
    .select({
      userId: member.userId,
    })
    .from(member)
    .where(
      and(eq(member.organizationId, organizationId), eq(member.role, 'owner'))
    )
    .limit(1);

  return result.length > 0 ? result[0].userId : null;
}

export async function getActiveOrganization(): Promise<OrganizationDetails | null> {
  const context = await getServerContext();
  return context?.organization ?? null;
}

export type { OrganizationDetails } from '@/lib/auth/server-context';
