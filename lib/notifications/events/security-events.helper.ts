import { jobDispatcher } from '@/lib/jobs/job-dispatcher.service';
import { JOB_TYPES } from '@/lib/types/jobs';
import type { NotificationEvent } from '@/lib/types/notifications';

/**
 * Create password changed notification event
 *
 * @param userId - User whose password was changed
 * @param ipAddress - Optional IP address where the change occurred
 * @returns Job ID of the enqueued notification
 */
export async function createPasswordChangedNotification(
  userId: string,
  ipAddress?: string
): Promise<string> {
  const event: NotificationEvent = {
    userId,
    type: 'security.password_changed',
    priority: 'important',
    title: 'Password Changed',
    message:
      'Your password was changed successfully. If you did not make this change, please contact support immediately.',
    metadata: {
      actionUrl: '/settings/security',
      actionLabel: 'Review Security',
      ipAddress,
    },
  };

  return jobDispatcher.enqueue(
    JOB_TYPES.CREATE_NOTIFICATION,
    {
      ...event,
      category: 'security',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    {
      idempotencyKey: `password-changed-${userId}-${ipAddress ?? 'unknown'}`,
    }
  );
}

/**
 * Create login from new device notification event
 *
 * @param userId - User who logged in
 * @param deviceInfo - Information about the new device
 * @param ipAddress - IP address of the login
 * @param location - Optional location information
 * @returns Job ID of the enqueued notification
 */
export async function createLoginNewDeviceNotification(
  userId: string,
  deviceInfo: string,
  ipAddress: string,
  location?: string
): Promise<string> {
  const locationText = location ? ` from ${location}` : '';
  const event: NotificationEvent = {
    userId,
    type: 'security.login_new_device',
    priority: 'important',
    title: 'New Device Login',
    message: `A new login was detected on ${deviceInfo}${locationText}. If this wasn't you, secure your account immediately.`,
    metadata: {
      actionUrl: '/settings/security',
      actionLabel: 'Review Activity',
      deviceInfo,
      ipAddress,
      location,
    },
  };

  return jobDispatcher.enqueue(
    JOB_TYPES.CREATE_NOTIFICATION,
    {
      ...event,
      category: 'security',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    {
      idempotencyKey: `login-new-device-${userId}-${deviceInfo}-${ipAddress}`,
    }
  );
}

/**
 * Create two-factor authentication enabled notification event
 *
 * @param userId - User who enabled 2FA
 * @returns Job ID of the enqueued notification
 */
export async function createTwoFactorEnabledNotification(
  userId: string
): Promise<string> {
  const event: NotificationEvent = {
    userId,
    type: 'security.two_factor_enabled',
    priority: 'info',
    title: 'Two-Factor Authentication Enabled',
    message:
      'Two-factor authentication has been successfully enabled for your account. Your account is now more secure.',
    metadata: {
      actionUrl: '/settings/security',
      actionLabel: 'View Security Settings',
    },
  };

  return jobDispatcher.enqueue(
    JOB_TYPES.CREATE_NOTIFICATION,
    {
      ...event,
      category: 'security',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    {
      idempotencyKey: `two-factor-enabled-${userId}`,
    }
  );
}
