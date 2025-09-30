import Stripe from 'stripe';
import { handleSubscriptionChange, stripe } from '@/lib/payments/stripe';
import {
  getOrganizationByStripeCustomerId,
  getOrganizationOwner,
  logActivity,
  getUserById,
} from '@/lib/db/queries';
import { ActivityType } from '@/lib/types';
import {
  sendSubscriptionCreatedEmail,
  sendPaymentFailedEmail,
} from '@/lib/emails/dispatchers';
import { env } from '@/lib/env';
import { createApiHandler } from '@/lib/server/api-handler';
import { error as errorResponse } from '@/lib/http/response';
import logger from '@/lib/logger/logger.service';

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

  try {
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip');
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
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
                await sendSubscriptionCreatedEmail({
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
        const invoice = event.data.object as Stripe.Invoice;
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
                await sendPaymentFailedEmail({
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
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        const organization = await getOrganizationByStripeCustomerId(
          subscription.customer as string
        );
        if (organization) {
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
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        const organization = await getOrganizationByStripeCustomerId(
          subscription.customer as string
        );
        if (organization) {
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
        logger.info(`Unhandled Stripe webhook event type: ${event.type}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;

    logger.error('Error handling Stripe webhook event', {
      message,
      stack,
      eventType: event.type,
    });

    return errorResponse('Error handling webhook event.', { status: 500 });
  }

  return { received: true };
});
