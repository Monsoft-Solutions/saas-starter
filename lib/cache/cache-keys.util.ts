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
  private static readonly REQUEST_ID_HEADER_CANDIDATES = [
    'x-request-id',
    'x-correlation-id',
    'x-trace-id',
    'x-traceid',
    'x-amzn-trace-id',
    'x-client-request-id',
    'x-test-id',
  ] as const;

  private static readonly anonymousHeaderIdentifiers = new WeakMap<
    RequestHeaders,
    string
  >();

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
    const identifier = this.resolveRequestIdentifier(requestHeaders);
    return createCacheKey(`server:context:${identifier}`);
  }

  static serverSession(requestHeaders: RequestHeaders): CacheKey {
    const identifier = this.resolveRequestIdentifier(requestHeaders);
    return createCacheKey(`server:session:${identifier}`);
  }

  static serverOrganization(
    requestHeaders: RequestHeaders,
    userId: string
  ): CacheKey {
    const identifier = this.resolveRequestIdentifier(requestHeaders);
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

  /**
   * Admin cache keys
   */
  static admin(resource: string, identifier?: string): CacheKey {
    return identifier
      ? createCacheKey(`admin:${resource}:${identifier}`)
      : createCacheKey(`admin:${resource}`);
  }

  /**
   * Generic custom cache key builder
   */
  static custom(namespace: string, key: string): CacheKey {
    return createCacheKey(`${namespace}:${key}`);
  }

  private static resolveRequestIdentifier(
    requestHeaders: RequestHeaders
  ): string {
    for (const headerName of this.REQUEST_ID_HEADER_CANDIDATES) {
      const headerValue = requestHeaders.get(headerName);
      if (headerValue && headerValue.length > 0) {
        return headerValue;
      }
    }

    const cookie = requestHeaders.get('cookie');
    if (cookie && cookie.length > 0) {
      return this.hashString(`cookie:${cookie}`);
    }

    const serializedHeaders = this.serializeHeaders(requestHeaders);
    if (serializedHeaders.length > 0) {
      return this.hashString(serializedHeaders);
    }

    return this.getAnonymousHeaderIdentifier(requestHeaders);
  }

  private static serializeHeaders(requestHeaders: RequestHeaders): string {
    const headerEntries: string[] = [];
    requestHeaders.forEach((value, key) => {
      headerEntries.push(`${key}:${value}`);
    });

    headerEntries.sort();
    return headerEntries.join('|');
  }

  private static getAnonymousHeaderIdentifier(
    requestHeaders: RequestHeaders
  ): string {
    let identifier = this.anonymousHeaderIdentifiers.get(requestHeaders);
    if (!identifier) {
      const randomSeed = `${Date.now().toString(36)}:${Math.random()
        .toString(36)
        .slice(2)}`;
      identifier = `anon:${this.hashString(randomSeed)}`;
      this.anonymousHeaderIdentifiers.set(requestHeaders, identifier);
    }

    return identifier;
  }
}

function createCacheKey(key: string): CacheKey {
  return key as CacheKey;
}
