'use server';

import { redirect } from 'next/navigation';
import { createCheckoutSession, createCustomerPortalSession } from './stripe';
import { withOrganization } from '@/lib/auth/middleware';

export const checkoutAction = withOrganization(async (formData) => {
  const priceId = formData.get('priceId') as string;
  await createCheckoutSession({ priceId });
});

export const customerPortalAction = withOrganization(
  async (_, organization) => {
    const portalSession = await createCustomerPortalSession({
      stripeCustomerId: organization.stripeCustomerId ?? null,
      stripeProductId: organization.stripeProductId ?? null,
    });
    redirect(portalSession.url);
  }
);
