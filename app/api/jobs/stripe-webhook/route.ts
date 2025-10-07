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
import {
  createPaymentFailedNotification,
  createPaymentSuccessNotification,
  createSubscriptionCreatedNotification,
  createSubscriptionCanceledNotification,
  createTrialEndingNotification,
} from '@/lib/notifications/events';
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
  const { eventType, eventData } = payload;

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
          // Invalidate analytics caches for new subscriptions
          const { cacheService, CacheKeys } = await import('@/lib/cache');
          await Promise.all([
            cacheService.delete(CacheKeys.custom('admin', 'revenue-metrics')),
            cacheService.delete(CacheKeys.custom('admin', 'revenue-trend')),
            cacheService.delete(
              CacheKeys.custom('stripe', 'plan-distribution')
            ),
          ]).catch((err) =>
            logger.warn('[stripe] Failed to invalidate analytics caches', {
              error: err.message,
            })
          );

          const ownerId = await getOrganizationOwner(organization.id);
          if (ownerId) {
            await logActivity(ActivityType.SUBSCRIPTION_CREATED);
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

              // Create in-app notification
              await createSubscriptionCreatedNotification(
                ownerId,
                organization.planName || 'Unknown Plan'
              ).catch((err) =>
                logger.error(
                  '[stripe] Failed to create subscription notification',
                  {
                    error: err.message,
                    ownerId,
                  }
                )
              );
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
            await logActivity(ActivityType.PAYMENT_FAILED);
            const owner = await getUserById(ownerId);
            if (owner) {
              await sendPaymentFailedEmailAsync({
                to: owner.email,
                recipientName: owner.name,
                amountDue: (invoice.amount_due / 100).toFixed(2),
                paymentDetailsUrl: `${env.BASE_URL}/app/settings/billing`,
              });

              // Create in-app notification
              await createPaymentFailedNotification(
                ownerId,
                invoice.amount_due / 100
              ).catch((err) =>
                logger.error(
                  '[stripe] Failed to create payment failed notification',
                  {
                    error: err.message,
                    ownerId,
                  }
                )
              );
            }
          }
        }
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = eventData as Stripe.Invoice;
      if (invoice.customer) {
        const organization = await getOrganizationByStripeCustomerId(
          invoice.customer as string
        );
        if (organization) {
          const ownerId = await getOrganizationOwner(organization.id);
          if (ownerId) {
            // Create in-app notification (no email for success to avoid noise)
            await createPaymentSuccessNotification(
              ownerId,
              (invoice.amount_paid ?? 0) / 100
            ).catch((err) =>
              logger.error(
                '[stripe] Failed to create payment success notification',
                {
                  error: err.message,
                  ownerId,
                }
              )
            );
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
        // Invalidate caches (including analytics caches)
        const { cacheService, CacheKeys } = await import('@/lib/cache');
        await Promise.all([
          cacheService.delete(
            CacheKeys.organizationSubscription(organization.id)
          ),
          cacheService.delete(
            CacheKeys.stripeCustomer(subscription.customer as string)
          ),
          // Invalidate analytics caches
          cacheService.delete(CacheKeys.custom('admin', 'revenue-metrics')),
          cacheService.delete(CacheKeys.custom('admin', 'revenue-trend')),
          cacheService.delete(CacheKeys.custom('stripe', 'plan-distribution')),
        ]);

        const ownerId = await getOrganizationOwner(organization.id);
        if (ownerId) {
          await logActivity(ActivityType.SUBSCRIPTION_UPDATED);
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
        // Invalidate caches (including analytics caches)
        const { cacheService, CacheKeys } = await import('@/lib/cache');
        await Promise.all([
          cacheService.delete(
            CacheKeys.organizationSubscription(organization.id)
          ),
          cacheService.delete(
            CacheKeys.stripeCustomer(subscription.customer as string)
          ),
          // Invalidate analytics caches
          cacheService.delete(CacheKeys.custom('admin', 'revenue-metrics')),
          cacheService.delete(CacheKeys.custom('admin', 'revenue-trend')),
          cacheService.delete(CacheKeys.custom('stripe', 'plan-distribution')),
        ]);

        const ownerId = await getOrganizationOwner(organization.id);
        if (ownerId) {
          await logActivity(ActivityType.SUBSCRIPTION_DELETED);

          // Create in-app notification
          const subAny = subscription as Stripe.Subscription & {
            current_period_end?: number;
          };
          const endDate = subAny.current_period_end
            ? new Date(subAny.current_period_end * 1000)
            : new Date();
          await createSubscriptionCanceledNotification(
            ownerId,
            organization.planName || 'Unknown Plan',
            endDate
          ).catch((err) =>
            logger.error(
              '[stripe] Failed to create subscription canceled notification',
              {
                error: err.message,
                ownerId,
              }
            )
          );
        }
        // TODO: Send subscription deleted email
      }
      break;
    }

    case 'customer.subscription.trial_will_end': {
      const subscription = eventData as Stripe.Subscription;
      const organization = await getOrganizationByStripeCustomerId(
        subscription.customer as string
      );
      if (organization) {
        const ownerId = await getOrganizationOwner(organization.id);
        if (ownerId) {
          const nowMs = Date.now();
          const trialEndMs = (subscription.trial_end ?? 0) * 1000;
          const daysRemaining = Math.max(
            0,
            Math.ceil((trialEndMs - nowMs) / (1000 * 60 * 60 * 24))
          );

          await createTrialEndingNotification(ownerId, daysRemaining).catch(
            (err) =>
              logger.error(
                '[stripe] Failed to create trial ending notification',
                {
                  error: err.message,
                  ownerId,
                }
              )
          );
        }
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
