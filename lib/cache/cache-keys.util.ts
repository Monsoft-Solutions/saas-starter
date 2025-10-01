import { RequestHeaders } from '../auth/server-context';
import { CacheKey } from '../types/cache/cache-key.type';

/**
 * Cache Key Utilities
 *
 * Standardized cache key generation to prevent key collisions
 * and ensure consistent naming across the application.
 *
 * Naming Convention: <entity>:<id>:<suffix>
 *
 * @example
 * CacheKeys.user(123) // "user:123"
 * CacheKeys.userOrganizations(123) // "user:123:organizations"
 * CacheKeys.organization(456) // "organization:456"
 */
export class CacheKeys {
  /**
   * User cache keys
   */
  static user(userId: string): CacheKey {
    return createCacheKey(`user:${userId}`);
  }

  static userOrganizations(userId: string): CacheKey {
    return createCacheKey(`user:${userId}:organizations`);
  }

  static userSessions(userId: string): CacheKey {
    return createCacheKey(`user:${userId}:sessions`);
  }

  static userPattern(userId?: string): CacheKey {
    return userId
      ? createCacheKey(`user:${userId}:*`)
      : createCacheKey('user:*');
  }

  /**
   * Organization cache keys
   */
  static organization(organizationId: string): CacheKey {
    return createCacheKey(`organization:${organizationId}`);
  }

  static organizationMembers(organizationId: string): CacheKey {
    return createCacheKey(`organization:${organizationId}:members`);
  }

  static organizationSubscription(organizationId: string): CacheKey {
    return createCacheKey(`organization:${organizationId}:subscription`);
  }

  static organizationPattern(organizationId?: string): CacheKey {
    return organizationId
      ? createCacheKey(`organization:${organizationId}:*`)
      : createCacheKey('organization:*');
  }

  /**
   * Stripe cache keys
   */
  static stripeProducts(): CacheKey {
    return createCacheKey('stripe:products');
  }

  static stripeCustomer(customerId: string): CacheKey {
    return createCacheKey(`stripe:customer:${customerId}`);
  }

  static stripeSubscription(subscriptionId: string): CacheKey {
    return createCacheKey(`stripe:subscription:${subscriptionId}`);
  }

  /**
   * Activity log cache keys
   */
  static userActivity(userId: string, limit: number = 10): CacheKey {
    return createCacheKey(`activity:user:${userId}:limit:${limit}`);
  }

  static organizationActivity(
    organizationId: string,
    limit: number = 10
  ): CacheKey {
    return createCacheKey(
      `activity:organization:${organizationId}:limit:${limit}`
    );
  }

  /**
   * API rate limiting keys
   */
  static rateLimit(ip: string, endpoint: string): CacheKey {
    return createCacheKey(`ratelimit:${endpoint}:${ip}`);
  }

  /**
   * Session cache keys
   */
  static session(sessionId: string): CacheKey {
    return createCacheKey(`session:${sessionId}`);
  }

  static serverContext(requestHeaders: RequestHeaders): CacheKey {
    const requestId = requestHeaders.get('x-request-id');
    const cookie = requestHeaders.get('cookie');
    // Use a combination of request-id and cookie hash for uniqueness
    const identifier = requestId || this.hashString(cookie || '');
    return createCacheKey(`server:context:${identifier}`);
  }

  static serverSession(requestHeaders: RequestHeaders): CacheKey {
    const requestId = requestHeaders.get('x-request-id');
    const cookie = requestHeaders.get('cookie');
    const identifier = requestId || this.hashString(cookie || '');
    return createCacheKey(`server:session:${identifier}`);
  }

  static serverOrganization(
    requestHeaders: RequestHeaders,
    userId: string
  ): CacheKey {
    const requestId = requestHeaders.get('x-request-id');
    const cookie = requestHeaders.get('cookie');
    const identifier = requestId || this.hashString(cookie || '');
    return createCacheKey(`server:organization:${identifier}:${userId}`);
  }

  /**
   * Simple hash function for generating cache keys from strings
   */
  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  static testKey(key: string): CacheKey {
    return createCacheKey(`test:${key}`);
  }

  /**
   * Email cache keys
   */
  static email(
    template: string,
    recipient: string,
    context?: string
  ): CacheKey {
    const encode = (value: string) =>
      encodeURIComponent(value.trim().toLowerCase());
    const baseKey = `email:${encode(template)}:${encode(recipient)}`;
    const key = context ? `${baseKey}:${encode(context)}` : baseKey;
    return createCacheKey(key);
  }

  /**
   * Notification cache keys
   */
  static userNotifications(
    userId: string,
    limit: number,
    offset: number
  ): CacheKey {
    return createCacheKey(
      `notifications:user:${userId}:limit:${limit}:offset:${offset}`
    );
  }

  static userUnreadNotifications(userId: string): CacheKey {
    return createCacheKey(`notifications:user:${userId}:unread`);
  }

  static userNotificationPattern(userId: string): CacheKey {
    return createCacheKey(`notifications:user:${userId}:*`);
  }
}

function createCacheKey(key: string): CacheKey {
  return key as CacheKey;
}
