/**
 * Stripe Webhook Handler
 *
 * External webhook endpoint for receiving Stripe webhook events.
 * This endpoint is called directly by Stripe and uses signature verification
 * for authentication instead of user sessions.
 *
 * NOTE: This is an external webhook and does not follow the standard validated
 * handler pattern. Validation is handled by Stripe's signature verification.
 * Events are queued for async processing to ensure fast webhook responses.
 *
 * @route POST /api/stripe/webhook
 * @external Stripe Webhook
 */

import Stripe from 'stripe';
import { stripe } from '@/lib/payments/stripe';
import { env } from '@/lib/env';
import { createApiHandler } from '@/lib/server/api-handler';
import { error as errorResponse } from '@/lib/http/response';
import logger from '@/lib/logger/logger.service';
import { jobDispatcher } from '@/lib/jobs/job-dispatcher.service';
import { JOB_TYPES } from '@/lib/types/jobs/enums/job-type.enum';

const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

export const POST = createApiHandler(async ({ request }) => {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    logger.error('Stripe webhook missing signature header', {
      url: request.nextUrl?.pathname ?? request.url,
    });
    return errorResponse('Webhook signature header missing.', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const stack = err instanceof Error ? err.stack : undefined;

    logger.error('Stripe webhook signature verification failed', {
      message,
      stack,
    });

    return errorResponse('Webhook signature verification failed.', {
      status: 400,
    });
  }

  // Enqueue job for async processing
  const ipAddress =
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');

  try {
    await jobDispatcher.enqueue(
      JOB_TYPES.PROCESS_STRIPE_WEBHOOK,
      {
        eventType: event.type,
        eventId: event.id,
        eventData: event.data.object,
        ipAddress: ipAddress || undefined,
      },
      {
        idempotencyKey: event.id,
      }
    );

    logger.info('[stripe] Webhook event enqueued for processing', {
      eventType: event.type,
      eventId: event.id,
    });

    return { received: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;

    logger.error('[stripe] Failed to enqueue webhook job', {
      message,
      stack,
      eventType: event.type,
      eventId: event.id,
    });

    return errorResponse('Failed to enqueue webhook processing.', {
      status: 500,
    });
  }
});
