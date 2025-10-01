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
    return createCacheKey(
      `server:context:${requestHeaders.get('x-request-id')}`
    );
  }

  static testKey(key: string): CacheKey {
    return createCacheKey(`test:${key}`);
  }
}

function createCacheKey(key: string): CacheKey {
  return key as CacheKey;
}
