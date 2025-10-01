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
    return `user:${userId}`;
  }

  static userOrganizations(userId: string): CacheKey {
    return `user:${userId}:organizations`;
  }

  static userSessions(userId: string): CacheKey {
    return `user:${userId}:sessions`;
  }

  static userPattern(userId?: string): CacheKey {
    return userId ? `user:${userId}:*` : 'user:*';
  }

  /**
   * Organization cache keys
   */
  static organization(organizationId: string): CacheKey {
    return `organization:${organizationId}`;
  }

  static organizationMembers(organizationId: string): CacheKey {
    return `organization:${organizationId}:members`;
  }

  static organizationSubscription(organizationId: string): CacheKey {
    return `organization:${organizationId}:subscription`;
  }

  static organizationPattern(organizationId?: string): CacheKey {
    return organizationId
      ? `organization:${organizationId}:*`
      : 'organization:*';
  }

  /**
   * Stripe cache keys
   */
  static stripeProducts(): CacheKey {
    return 'stripe:products';
  }

  static stripeCustomer(customerId: string): CacheKey {
    return `stripe:customer:${customerId}`;
  }

  static stripeSubscription(subscriptionId: string): CacheKey {
    return `stripe:subscription:${subscriptionId}`;
  }

  /**
   * Activity log cache keys
   */
  static userActivity(userId: string, limit: number = 10): CacheKey {
    return `activity:user:${userId}:limit:${limit}`;
  }

  static organizationActivity(
    organizationId: string,
    limit: number = 10
  ): CacheKey {
    return `activity:organization:${organizationId}:limit:${limit}`;
  }

  /**
   * API rate limiting keys
   */
  static rateLimit(ip: string, endpoint: string): CacheKey {
    return `ratelimit:${endpoint}:${ip}`;
  }

  /**
   * Session cache keys
   */
  static session(sessionId: string): CacheKey {
    return `session:${sessionId}`;
  }
}
