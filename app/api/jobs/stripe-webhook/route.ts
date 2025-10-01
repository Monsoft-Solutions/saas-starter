/**
 * Stripe Webhook Job Worker API Route
 *
 * Handles asynchronous Stripe webhook event processing via QStash job queue.
 * This endpoint receives Stripe event payloads and processes subscription changes,
 * payments, and customer updates without blocking the webhook endpoint response.
 *
 * @route POST /api/jobs/stripe-webhook
 * @description Processes queued Stripe webhook events with retry logic and error handling
 */

import { createJobWorker } from '@/lib/jobs/job-worker.handler';
import { handleSubscriptionChange } from '@/lib/payments/stripe';
import {
  getOrganizationByStripeCustomerId,
  getOrganizationOwner,
  logActivity,
  getUserById,
} from '@/lib/db/queries';
import { ActivityType } from '@/lib/types';
import {
  sendSubscriptionCreatedEmailAsync,
  sendPaymentFailedEmailAsync,
} from '@/lib/emails/enqueue';
import { env } from '@/lib/env';
import logger from '@/lib/logger/logger.service';
import type { StripeWebhookJobPayload } from '@/lib/types/jobs/schemas/stripe-webhook-job.schema';
import type { BaseJob } from '@/lib/types/jobs/schemas/base-job.schema';
import type Stripe from 'stripe';

/**
 * Stripe webhook job handler that processes queued webhook events by routing them
 * to the appropriate handler based on the event type.
 *
 * @param payload - The Stripe webhook job payload containing event data
 * @param job - The job metadata including job ID and retry information
 */
const stripeWebhookJobHandler = async (
  payload: StripeWebhookJobPayload,
  job: BaseJob
) => {
  const { eventType, eventData, ipAddress } = payload;

  logger.info('[jobs] Processing Stripe webhook job', {
    jobId: job.jobId,
    eventType,
  });

  switch (eventType) {
    case 'checkout.session.completed': {
      const session = eventData as Stripe.Checkout.Session;
      if (session.customer) {
        const organization = await getOrganizationByStripeCustomerId(
          session.customer as string
        );
        if (organization) {
          const ownerId = await getOrganizationOwner(organization.id);
          if (ownerId) {
            await logActivity(
              ownerId,
              ActivityType.SUBSCRIPTION_CREATED,
              ipAddress ?? ''
            );
            const owner = await getUserById(ownerId);
            if (owner) {
              await sendSubscriptionCreatedEmailAsync({
                to: owner.email,
                recipientName: owner.name,
                planName: organization.planName || 'Unknown Plan',
                amount: session.amount_total
                  ? (session.amount_total / 100).toFixed(2)
                  : '0.00',
                dashboardUrl: `${env.BASE_URL}/app/general`,
              });
            }
          }
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = eventData as Stripe.Invoice;
      if (invoice.customer) {
        const organization = await getOrganizationByStripeCustomerId(
          invoice.customer as string
        );
        if (organization) {
          const ownerId = await getOrganizationOwner(organization.id);
          if (ownerId) {
            await logActivity(
              ownerId,
              ActivityType.PAYMENT_FAILED,
              ipAddress ?? ''
            );
            const owner = await getUserById(ownerId);
            if (owner) {
              await sendPaymentFailedEmailAsync({
                to: owner.email,
                recipientName: owner.name,
                amountDue: (invoice.amount_due / 100).toFixed(2),
                paymentDetailsUrl: `${env.BASE_URL}/app/settings/billing`,
              });
            }
          }
        }
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = eventData as Stripe.Subscription;
      await handleSubscriptionChange(subscription);
      const organization = await getOrganizationByStripeCustomerId(
        subscription.customer as string
      );
      if (organization) {
        // Invalidate caches
        const { cacheService, CacheKeys } = await import('@/lib/cache');
        await cacheService.delete(
          CacheKeys.organizationSubscription(organization.id)
        );
        await cacheService.delete(
          CacheKeys.stripeCustomer(subscription.customer as string)
        );

        const ownerId = await getOrganizationOwner(organization.id);
        if (ownerId) {
          await logActivity(
            ownerId,
            ActivityType.SUBSCRIPTION_UPDATED,
            ipAddress ?? ''
          );
        }
        // TODO: Send subscription updated email
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = eventData as Stripe.Subscription;
      await handleSubscriptionChange(subscription);
      const organization = await getOrganizationByStripeCustomerId(
        subscription.customer as string
      );
      if (organization) {
        // Invalidate caches
        const { cacheService, CacheKeys } = await import('@/lib/cache');
        await cacheService.delete(
          CacheKeys.organizationSubscription(organization.id)
        );
        await cacheService.delete(
          CacheKeys.stripeCustomer(subscription.customer as string)
        );

        const ownerId = await getOrganizationOwner(organization.id);
        if (ownerId) {
          await logActivity(
            ownerId,
            ActivityType.SUBSCRIPTION_DELETED,
            ipAddress ?? ''
          );
        }
        // TODO: Send subscription deleted email
      }
      break;
    }

    default:
      logger.info(`[jobs] Unhandled Stripe webhook event type: ${eventType}`);
  }
};

export const POST = createJobWorker<StripeWebhookJobPayload>(
  stripeWebhookJobHandler
);
