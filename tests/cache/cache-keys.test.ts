import { describe, it, expect } from 'vitest';
import { CacheKeys } from '@/lib/cache/cache-keys.util';

/**
 * Unit tests for Cache Key Utilities
 *
 * Tests cover:
 * - User cache key generation
 * - Organization cache key generation
 * - Stripe cache key generation
 * - Activity log cache key generation
 * - Rate limiting cache key generation
 * - Session cache key generation
 * - Pattern generation for wildcard operations
 * - Key naming convention consistency
 */

describe('Cache Keys Utility', () => {
  describe('User Cache Keys', () => {
    it('should generate user cache key', () => {
      const key = CacheKeys.user('123');
      expect(key).toBe('user:123');
    });

    it('should generate user organizations cache key', () => {
      const key = CacheKeys.userOrganizations('123');
      expect(key).toBe('user:123:organizations');
    });

    it('should generate user sessions cache key', () => {
      const key = CacheKeys.userSessions('123');
      expect(key).toBe('user:123:sessions');
    });

    it('should generate user pattern with specific user ID', () => {
      const pattern = CacheKeys.userPattern('123');
      expect(pattern).toBe('user:123:*');
    });

    it('should generate user pattern for all users', () => {
      const pattern = CacheKeys.userPattern();
      expect(pattern).toBe('user:*');
    });

    it('should handle special characters in user ID', () => {
      const key = CacheKeys.user('user-123-abc');
      expect(key).toBe('user:user-123-abc');
    });
  });

  describe('Organization Cache Keys', () => {
    it('should generate organization cache key', () => {
      const key = CacheKeys.organization('456');
      expect(key).toBe('organization:456');
    });

    it('should generate organization members cache key', () => {
      const key = CacheKeys.organizationMembers('456');
      expect(key).toBe('organization:456:members');
    });

    it('should generate organization subscription cache key', () => {
      const key = CacheKeys.organizationSubscription('456');
      expect(key).toBe('organization:456:subscription');
    });

    it('should generate organization pattern with specific organization ID', () => {
      const pattern = CacheKeys.organizationPattern('456');
      expect(pattern).toBe('organization:456:*');
    });

    it('should generate organization pattern for all organizations', () => {
      const pattern = CacheKeys.organizationPattern();
      expect(pattern).toBe('organization:*');
    });

    it('should handle special characters in organization ID', () => {
      const key = CacheKeys.organization('org-456-xyz');
      expect(key).toBe('organization:org-456-xyz');
    });
  });

  describe('Stripe Cache Keys', () => {
    it('should generate stripe products cache key', () => {
      const key = CacheKeys.stripeProducts();
      expect(key).toBe('stripe:products');
    });

    it('should generate stripe customer cache key', () => {
      const key = CacheKeys.stripeCustomer('cus_123');
      expect(key).toBe('stripe:customer:cus_123');
    });

    it('should generate stripe subscription cache key', () => {
      const key = CacheKeys.stripeSubscription('sub_456');
      expect(key).toBe('stripe:subscription:sub_456');
    });

    it('should handle Stripe ID formats', () => {
      const customerKey = CacheKeys.stripeCustomer('cus_N4Z4Z4Z4Z4Z4Z4');
      const subscriptionKey =
        CacheKeys.stripeSubscription('sub_N4Z4Z4Z4Z4Z4Z4');

      expect(customerKey).toBe('stripe:customer:cus_N4Z4Z4Z4Z4Z4Z4');
      expect(subscriptionKey).toBe('stripe:subscription:sub_N4Z4Z4Z4Z4Z4Z4');
    });
  });

  describe('Activity Log Cache Keys', () => {
    it('should generate user activity cache key with default limit', () => {
      const key = CacheKeys.userActivity('123');
      expect(key).toBe('activity:user:123:limit:10');
    });

    it('should generate user activity cache key with custom limit', () => {
      const key = CacheKeys.userActivity('123', 20);
      expect(key).toBe('activity:user:123:limit:20');
    });

    it('should generate organization activity cache key with default limit', () => {
      const key = CacheKeys.organizationActivity('456');
      expect(key).toBe('activity:organization:456:limit:10');
    });

    it('should generate organization activity cache key with custom limit', () => {
      const key = CacheKeys.organizationActivity('456', 50);
      expect(key).toBe('activity:organization:456:limit:50');
    });

    it('should generate different keys for different limits', () => {
      const key1 = CacheKeys.userActivity('123', 10);
      const key2 = CacheKeys.userActivity('123', 20);

      expect(key1).not.toBe(key2);
      expect(key1).toBe('activity:user:123:limit:10');
      expect(key2).toBe('activity:user:123:limit:20');
    });
  });

  describe('Rate Limiting Cache Keys', () => {
    it('should generate rate limit cache key', () => {
      const key = CacheKeys.rateLimit('192.168.1.1', '/api/users');
      expect(key).toBe('ratelimit:/api/users:192.168.1.1');
    });

    it('should handle IPv6 addresses', () => {
      const key = CacheKeys.rateLimit(
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        '/api/data'
      );
      expect(key).toBe(
        'ratelimit:/api/data:2001:0db8:85a3:0000:0000:8a2e:0370:7334'
      );
    });

    it('should handle different endpoints for same IP', () => {
      const key1 = CacheKeys.rateLimit('192.168.1.1', '/api/users');
      const key2 = CacheKeys.rateLimit('192.168.1.1', '/api/posts');

      expect(key1).not.toBe(key2);
      expect(key1).toBe('ratelimit:/api/users:192.168.1.1');
      expect(key2).toBe('ratelimit:/api/posts:192.168.1.1');
    });

    it('should handle different IPs for same endpoint', () => {
      const key1 = CacheKeys.rateLimit('192.168.1.1', '/api/users');
      const key2 = CacheKeys.rateLimit('192.168.1.2', '/api/users');

      expect(key1).not.toBe(key2);
      expect(key1).toBe('ratelimit:/api/users:192.168.1.1');
      expect(key2).toBe('ratelimit:/api/users:192.168.1.2');
    });
  });

  describe('Session Cache Keys', () => {
    it('should generate session cache key', () => {
      const key = CacheKeys.session('session-123');
      expect(key).toBe('session:session-123');
    });

    it('should handle UUID session IDs', () => {
      const sessionId = '550e8400-e29b-41d4-a716-446655440000';
      const key = CacheKeys.session(sessionId);
      expect(key).toBe(`session:${sessionId}`);
    });

    it('should handle different session ID formats', () => {
      const key1 = CacheKeys.session('sess_123abc');
      const key2 = CacheKeys.session('550e8400-e29b-41d4-a716-446655440000');

      expect(key1).toBe('session:sess_123abc');
      expect(key2).toBe('session:550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('Key Naming Convention', () => {
    it('should follow entity:id:suffix pattern', () => {
      const userKey = CacheKeys.user('123');
      const orgKey = CacheKeys.organization('456');
      const sessionKey = CacheKeys.session('abc');

      expect(userKey).toMatch(/^[a-z]+:[a-z0-9-]+$/);
      expect(orgKey).toMatch(/^[a-z]+:[a-z0-9-]+$/);
      expect(sessionKey).toMatch(/^[a-z]+:[a-z0-9-]+$/);
    });

    it('should use colon as separator', () => {
      const keys = [
        CacheKeys.user('123'),
        CacheKeys.organization('456'),
        CacheKeys.userOrganizations('123'),
        CacheKeys.stripeCustomer('cus_123'),
      ];

      keys.forEach((key) => {
        expect(key).toContain(':');
      });
    });

    it('should use lowercase for entity names', () => {
      const keys = [
        CacheKeys.user('123'),
        CacheKeys.organization('456'),
        CacheKeys.stripeProducts(),
        CacheKeys.session('abc'),
      ];

      keys.forEach((key) => {
        const entityName = key.split(':')[0];
        expect(entityName).toBe(entityName.toLowerCase());
      });
    });
  });

  describe('Key Uniqueness', () => {
    it('should generate unique keys for different users', () => {
      const key1 = CacheKeys.user('123');
      const key2 = CacheKeys.user('456');

      expect(key1).not.toBe(key2);
    });

    it('should generate unique keys for different organizations', () => {
      const key1 = CacheKeys.organization('123');
      const key2 = CacheKeys.organization('456');

      expect(key1).not.toBe(key2);
    });

    it('should generate unique keys for different entities with same ID', () => {
      const userKey = CacheKeys.user('123');
      const orgKey = CacheKeys.organization('123');

      expect(userKey).not.toBe(orgKey);
    });

    it('should generate unique keys for different suffixes', () => {
      const key1 = CacheKeys.userOrganizations('123');
      const key2 = CacheKeys.userSessions('123');

      expect(key1).not.toBe(key2);
    });
  });

  describe('Pattern Matching', () => {
    it('should generate pattern that matches specific entity keys', () => {
      const pattern = CacheKeys.userPattern('123');
      const key1 = CacheKeys.userOrganizations('123');
      const key2 = CacheKeys.userSessions('123');

      // Convert pattern to regex
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));

      expect(regex.test(key1)).toBe(true);
      expect(regex.test(key2)).toBe(true);
    });

    it('should generate pattern that does not match other entity keys', () => {
      const pattern = CacheKeys.userPattern('123');
      const orgKey = CacheKeys.organization('123');

      // Convert pattern to regex
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));

      expect(regex.test(orgKey)).toBe(false);
    });

    it('should generate pattern that matches all entities of a type', () => {
      const pattern = CacheKeys.userPattern();
      const key1 = CacheKeys.user('123');
      const key2 = CacheKeys.userOrganizations('456');
      const key3 = CacheKeys.userSessions('789');

      // Convert pattern to regex
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));

      expect(regex.test(key1)).toBe(true);
      expect(regex.test(key2)).toBe(true);
      expect(regex.test(key3)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string IDs', () => {
      const key = CacheKeys.user('');
      expect(key).toBe('user:');
    });

    it('should handle numeric IDs', () => {
      const key = CacheKeys.user('123');
      expect(key).toBe('user:123');
    });

    it('should handle very long IDs', () => {
      const longId = 'a'.repeat(1000);
      const key = CacheKeys.user(longId);
      expect(key).toBe(`user:${longId}`);
    });

    it('should handle IDs with special characters', () => {
      const specialId = 'user-123_abc@test';
      const key = CacheKeys.user(specialId);
      expect(key).toBe(`user:${specialId}`);
    });

    it('should handle zero as limit', () => {
      const key = CacheKeys.userActivity('123', 0);
      expect(key).toBe('activity:user:123:limit:0');
    });

    it('should handle negative limit', () => {
      const key = CacheKeys.userActivity('123', -1);
      expect(key).toBe('activity:user:123:limit:-1');
    });
  });
});
