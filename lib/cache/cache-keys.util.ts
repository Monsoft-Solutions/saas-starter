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
  static user(userId: string): string {
    return `user:${userId}`;
  }

  static userOrganizations(userId: string): string {
    return `user:${userId}:organizations`;
  }

  static userSessions(userId: string): string {
    return `user:${userId}:sessions`;
  }

  static userPattern(userId?: string): string {
    return userId ? `user:${userId}:*` : 'user:*';
  }

  /**
   * Email cache keys
   */
  static email(template: string, recipient: string, context?: string): string {
    const encode = (value: string) =>
      encodeURIComponent(value.trim().toLowerCase());
    const baseKey = `email:${encode(template)}:${encode(recipient)}`;
    return context ? `${baseKey}:${encode(context)}` : baseKey;
  }

  /**
   * Organization cache keys
   */
  static organization(organizationId: string): string {
    return `organization:${organizationId}`;
  }

  static organizationMembers(organizationId: string): string {
    return `organization:${organizationId}:members`;
  }

  static organizationSubscription(organizationId: string): string {
    return `organization:${organizationId}:subscription`;
  }

  static organizationPattern(organizationId?: string): string {
    return organizationId
      ? `organization:${organizationId}:*`
      : 'organization:*';
  }

  /**
   * Stripe cache keys
   */
  static stripeProducts(): string {
    return 'stripe:products';
  }

  static stripeCustomer(customerId: string): string {
    return `stripe:customer:${customerId}`;
  }

  static stripeSubscription(subscriptionId: string): string {
    return `stripe:subscription:${subscriptionId}`;
  }

  /**
   * Activity log cache keys
   */
  static userActivity(userId: string, limit: number = 10): string {
    return `activity:user:${userId}:limit:${limit}`;
  }

  static organizationActivity(
    organizationId: string,
    limit: number = 10
  ): string {
    return `activity:organization:${organizationId}:limit:${limit}`;
  }

  /**
   * API rate limiting keys
   */
  static rateLimit(ip: string, endpoint: string): string {
    return `ratelimit:${endpoint}:${ip}`;
  }

  /**
   * Session cache keys
   */
  static session(sessionId: string): string {
    return `session:${sessionId}`;
  }
}
