import { jobDispatcher } from '@/lib/jobs/job-dispatcher.service';
import { JOB_TYPES } from '@/lib/types/jobs';
import type { NotificationEvent } from '@/lib/types/notifications';

/**
 * Create payment failed notification event
 *
 * @param userId - User to notify
 * @param amount - Payment amount that failed
 * @returns Job ID of the enqueued notification
 */
export async function createPaymentFailedNotification(
  userId: string,
  amount: number
): Promise<string> {
  const event: NotificationEvent = {
    userId,
    type: 'billing.payment_failed',
    priority: 'critical',
    title: 'Payment Failed',
    message: `Your payment of $${amount.toFixed(2)} could not be processed. Please update your payment method.`,
    metadata: {
      actionUrl: '/settings/billing',
      actionLabel: 'Update Payment',
      amount: amount.toString(),
    },
  };

  return jobDispatcher.enqueue(
    JOB_TYPES.CREATE_NOTIFICATION,
    {
      ...event,
      category: 'billing',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    {
      idempotencyKey: `payment-failed-${userId}-${Date.now()}`,
    }
  );
}

/**
 * Create payment success notification event
 *
 * @param userId - User to notify
 * @param amount - Payment amount
 * @returns Job ID of the enqueued notification
 */
export async function createPaymentSuccessNotification(
  userId: string,
  amount: number
): Promise<string> {
  const event: NotificationEvent = {
    userId,
    type: 'billing.payment_success',
    priority: 'info',
    title: 'Payment Successful',
    message: `Your payment of $${amount.toFixed(2)} has been processed successfully.`,
    metadata: {
      actionUrl: '/settings/billing',
      actionLabel: 'View Receipt',
      amount: amount.toString(),
    },
  };

  return jobDispatcher.enqueue(
    JOB_TYPES.CREATE_NOTIFICATION,
    {
      ...event,
      category: 'billing',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    {
      idempotencyKey: `payment-success-${userId}-${Date.now()}`,
    }
  );
}

/**
 * Create subscription created notification event
 *
 * @param userId - User to notify
 * @param planName - Name of the subscription plan
 * @returns Job ID of the enqueued notification
 */
export async function createSubscriptionCreatedNotification(
  userId: string,
  planName: string
): Promise<string> {
  const event: NotificationEvent = {
    userId,
    type: 'billing.subscription_created',
    priority: 'info',
    title: 'Subscription Active',
    message: `Your ${planName} subscription is now active. Welcome aboard!`,
    metadata: {
      actionUrl: '/settings/billing',
      actionLabel: 'View Subscription',
      planName,
    },
  };

  return jobDispatcher.enqueue(
    JOB_TYPES.CREATE_NOTIFICATION,
    {
      ...event,
      category: 'billing',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    {
      idempotencyKey: `subscription-created-${userId}-${planName}-${Date.now()}`,
    }
  );
}

/**
 * Create subscription canceled notification event
 *
 * @param userId - User to notify
 * @param planName - Name of the canceled plan
 * @param endDate - When the subscription ends
 * @returns Job ID of the enqueued notification
 */
export async function createSubscriptionCanceledNotification(
  userId: string,
  planName: string,
  endDate: Date
): Promise<string> {
  const event: NotificationEvent = {
    userId,
    type: 'billing.subscription_canceled',
    priority: 'important',
    title: 'Subscription Canceled',
    message: `Your ${planName} subscription has been canceled. You'll have access until ${endDate.toLocaleDateString()}.`,
    metadata: {
      actionUrl: '/settings/billing',
      actionLabel: 'Reactivate Subscription',
      planName,
      endDate: endDate.toISOString(),
    },
  };

  return jobDispatcher.enqueue(
    JOB_TYPES.CREATE_NOTIFICATION,
    {
      ...event,
      category: 'billing',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    {
      idempotencyKey: `subscription-canceled-${userId}-${planName}-${Date.now()}`,
    }
  );
}

/**
 * Create trial ending notification event
 *
 * @param userId - User to notify
 * @param daysRemaining - Days remaining in trial
 * @returns Job ID of the enqueued notification
 */
export async function createTrialEndingNotification(
  userId: string,
  daysRemaining: number
): Promise<string> {
  const event: NotificationEvent = {
    userId,
    type: 'billing.trial_ending',
    priority: 'important',
    title: 'Trial Ending Soon',
    message: `Your trial ends in ${daysRemaining} days. Subscribe now to keep your access.`,
    metadata: {
      actionUrl: '/settings/billing',
      actionLabel: 'Choose Plan',
      daysRemaining: daysRemaining.toString(),
    },
  };

  return jobDispatcher.enqueue(
    JOB_TYPES.CREATE_NOTIFICATION,
    {
      ...event,
      category: 'billing',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    {
      idempotencyKey: `trial-ending-${userId}-${daysRemaining}`,
    }
  );
}
