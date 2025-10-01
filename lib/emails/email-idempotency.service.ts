/**
 * Email Idempotency Service
 *
 * Prevents duplicate email sends by maintaining a cache of recently sent emails.
 * Uses a 1-minute TTL to ensure emails aren't sent multiple times within a short
 * time window, which is especially important for user-triggered actions like
 * password resets or team invitations.
 *
 * Features:
 * - 5-minute cache TTL to prevent rapid duplicate sends
 * - Context-aware caching (e.g., different team invitations)
 * - Graceful error handling with fallback to allow sending
 * - Standardized cache key generation
 */

import 'server-only';

import { cacheService, CacheKeys } from '@/lib/cache';
import logger from '@/lib/logger/logger.service';

const EMAIL_IDEMPOTENCY_TTL_SECONDS = 1 * 60; // 1 minute

/**
 * Builds standardized cache key for email idempotency tracking
 */
const buildCacheKey = (template: string, recipient: string, context?: string) =>
  CacheKeys.email(template, recipient, context);

/**
 * Marks an email as sent in the idempotency cache to prevent duplicate sends
 *
 * @param template - Email template name (e.g., 'welcome', 'passwordReset')
 * @param recipient - Recipient email address
 * @param context - Optional context for more specific caching (e.g., team name)
 */
export const markEmailAsSent = async (
  template: string,
  recipient: string,
  context?: string
): Promise<void> => {
  try {
    const key = buildCacheKey(template, recipient, context);
    await cacheService.set(key, true, {
      ttl: EMAIL_IDEMPOTENCY_TTL_SECONDS,
    });
  } catch (error) {
    logger.warn('[email] Failed to mark idempotency cache', {
      template,
      recipient,
      context,
      error,
    });
  }
};

/**
 * Checks if an email was sent recently to prevent duplicate sends
 *
 * @param template - Email template name
 * @param recipient - Recipient email address
 * @param context - Optional context for more specific checking
 * @returns true if email was sent recently, false otherwise
 */
export const wasEmailSentRecently = async (
  template: string,
  recipient: string,
  context?: string
): Promise<boolean> => {
  try {
    const key = buildCacheKey(template, recipient, context);
    const cached = await cacheService.get<boolean>(key);
    return cached === true;
  } catch (error) {
    logger.warn('[email] Failed to check idempotency cache', {
      template,
      recipient,
      context,
      error,
    });
    return false;
  }
};

export const EMAIL_IDEMPOTENCY_TTL = EMAIL_IDEMPOTENCY_TTL_SECONDS;
