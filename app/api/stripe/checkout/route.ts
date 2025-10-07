/**
 * Stripe Checkout Completion API Route
 *
 * Handles the redirect from Stripe checkout after successful payment.
 * Retrieves the checkout session, updates the organization with subscription details,
 * and redirects the user to the app.
 *
 * @route GET /api/stripe/checkout?session_id=xxx
 */

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { organization, member, user as User } from '@/lib/db/schemas';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { APP_BASE_PATH } from '@/config/navigation';
import { withApiAuth } from '@/lib/server/api-handler';
import logger from '@/lib/logger/logger.service';
import { cacheService, CacheKeys } from '@/lib/cache';

/**
 * Query parameter validation schema
 */
const checkoutQuerySchema = z.object({
  session_id: z.string().min(1, 'Session ID is required'),
});

/**
 * GET /api/stripe/checkout
 *
 * Process Stripe checkout completion
 */
export const GET = withApiAuth(async ({ request }) => {
  // Validate query parameters
  const queryParams = Object.fromEntries(request.nextUrl.searchParams);
  const validation = checkoutQuerySchema.safeParse(queryParams);

  if (!validation.success) {
    logger.warn('[stripe/checkout] Missing or invalid session_id', {
      queryParams,
    });
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  const { session_id: sessionId } = validation.data;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription'],
    });

    if (!session.customer || typeof session.customer === 'string') {
      throw new Error('Invalid customer data from Stripe.');
    }

    const customerId = session.customer.id;
    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    if (!subscriptionId) {
      throw new Error('No subscription found for this session.');
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    });

    const plan = subscription.items.data[0]?.price;

    if (!plan) {
      throw new Error('No plan found for this subscription.');
    }

    const userId = session.client_reference_id;
    if (!userId) {
      throw new Error("No user ID found in session's client_reference_id.");
    }

    const userData = await db
      .select()
      .from(User)
      .where(eq(User.id, userId))
      .limit(1);

    if (userData.length === 0) {
      throw new Error('User not found in database.');
    }

    const membership = await db
      .select({
        organizationId: member.organizationId,
      })
      .from(member)
      .where(eq(member.userId, userData[0].id))
      .limit(1);

    if (membership.length === 0) {
      throw new Error('User is not associated with any organization.');
    }

    const product = plan.product;
    const stripeProductId =
      typeof product === 'string' ? product : (product?.id ?? null);

    if (!stripeProductId) {
      throw new Error('No product ID found for this subscription.');
    }

    const productName =
      typeof product === 'object' && product !== null && 'name' in product
        ? product.name
        : null;

    await db
      .update(organization)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripeProductId: stripeProductId,
        planName: productName,
        subscriptionStatus: subscription.status,
      })
      .where(eq(organization.id, membership[0].organizationId));

    // Invalidate cached subscription data
    await cacheService.delete(
      CacheKeys.organizationSubscription(membership[0].organizationId)
    );

    return NextResponse.redirect(new URL(APP_BASE_PATH, request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;

    logger.error('Stripe checkout finalization failed', {
      message,
      stack,
      sessionId,
    });

    return NextResponse.redirect(new URL('/error', request.url));
  }
});
