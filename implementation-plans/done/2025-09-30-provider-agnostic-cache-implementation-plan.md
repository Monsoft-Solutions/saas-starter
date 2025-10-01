# Provider-Agnostic Cache Implementation Plan

**Created:** September 30, 2025  
**Status:** Draft  
**Priority:** High  
**Estimated Effort:** 5-7 days  
**Complexity:** Medium-High

## Executive Summary

This implementation plan outlines the development of a provider-agnostic caching layer for the SaaS starter application. The system will provide a unified interface for caching operations while supporting multiple backend providers (in-memory for development, Upstash Redis for production). The architecture follows enterprise patterns for flexibility, maintainability, and scalability, allowing seamless provider switching without code changes.

## Current State Analysis

### ✅ Existing Infrastructure

- PostgreSQL database with Drizzle ORM
- Winston logging system for structured logging
- Environment-based configuration with Zod validation
- Service pattern architecture (`lib/*/` organization)
- TypeScript with strict type safety
- Multi-environment support (development, staging, production)

### ❌ Missing Critical Features

1. **Caching Infrastructure:**
   - No caching layer for API responses
   - No session caching mechanism
   - No data caching for expensive queries
   - No cache invalidation strategy

2. **Performance Optimization:**
   - Repeated database queries for same data
   - No CDN-like caching for static content
   - No rate limiting cache
   - No API response caching

3. **Scalability Concerns:**
   - Direct database hits for all requests
   - No distributed caching for multi-instance deployments
   - Limited session storage optimization

## Technical Analysis

### Architecture Requirements

1. **Provider Agnostic**: Abstract interface for cache operations
2. **Type Safe**: Full TypeScript support with generics
3. **Environment Aware**: Automatic provider selection based on `NODE_ENV`
4. **Observable**: Integration with Winston logging
5. **Error Resilient**: Graceful degradation when cache fails
6. **TTL Support**: Time-to-live for cache entries
7. **Serialization**: JSON serialization for complex objects

### Provider Selection Strategy

| Environment | Provider  | Rationale                                         |
| ----------- | --------- | ------------------------------------------------- |
| Development | In-Memory | Fast, simple, no external dependencies            |
| Test        | In-Memory | Isolated tests, no persistence needed             |
| Production  | Upstash   | Serverless, durable, distributed, Edge-compatible |

## Dependencies & Prerequisites

### NPM Packages

```bash
# Install required dependencies
pnpm add @upstash/redis
```

### Environment Variables

Add to `.env` files:

```bash
# Cache Configuration
CACHE_PROVIDER=in-memory  # Options: in-memory, upstash
CACHE_DEFAULT_TTL=3600    # Default TTL in seconds (1 hour)

# Upstash Configuration (production only)
REDIS_REST_URL=https://your-instance.upstash.io
REDIS_REST_TOKEN=your-token-here
```

### External Services

- **Upstash Account**: Create account at [upstash.com](https://upstash.com)
- **Upstash Redis Database**: Create a serverless Redis instance

## Architecture Overview

### System Design

```
┌─────────────────────────────────────────────────────────┐
│              Application Layer                          │
│  (Server Actions, API Routes, Services)                 │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│          Cache Service (Public Interface)               │
│    lib/cache/cache.service.ts                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  get(), set(), delete(), clear(), has()          │  │
│  │  getOrSet(), invalidate(), invalidatePattern()   │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│         Cache Provider Interface                        │
│         lib/cache/providers/cache.interface.ts          │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌───────────────┐     ┌──────────────────┐
│  In-Memory    │     │  Upstash Redis   │
│  Provider     │     │  Provider        │
│  (Dev/Test)   │     │  (Production)    │
└───────────────┘     └──────────────────┘
```

### Design Patterns

1. **Strategy Pattern**: Interchangeable cache providers
2. **Factory Pattern**: Provider instantiation based on environment
3. **Singleton Pattern**: Single cache service instance
4. **Repository Pattern**: Centralized data access

## Implementation Plan

### Phase 1: Core Architecture & Types

**Objective:** Establish type-safe foundation for cache system

#### 1.1 Create Type Definitions

**File:** `lib/types/cache/cache-options.type.ts`

```typescript
/**
 * Cache operation options
 */
export type CacheOptions = {
  /** Time-to-live in seconds */
  ttl?: number;
  /** Namespace/prefix for cache keys */
  namespace?: string;
  /** Skip cache and force fresh data */
  skipCache?: boolean;
};
```

**File:** `lib/types/cache/cache-entry.type.ts`

```typescript
/**
 * Internal cache entry structure
 */
export type CacheEntry<T> = {
  value: T;
  expiresAt: number | null;
  createdAt: number;
};
```

**File:** `lib/types/cache/cache-stats.type.ts`

```typescript
/**
 * Cache statistics for monitoring
 */
export type CacheStats = {
  hits: number;
  misses: number;
  keys: number;
  hitRate: number;
};
```

**File:** `lib/types/cache/cache-provider.enum.ts`

```typescript
/**
 * Supported cache providers
 */
export enum CacheProvider {
  IN_MEMORY = 'in-memory',
  UPSTASH = 'upstash',
}
```

**File:** `lib/types/cache/index.ts`

```typescript
export * from './cache-options.type';
export * from './cache-entry.type';
export * from './cache-stats.type';
export * from './cache-provider.enum';
```

#### 1.2 Update Environment Configuration

**File:** `lib/env.ts`

```typescript
// Add to envSchema:
const envSchema = z.object({
  // ... existing fields ...

  // Cache Configuration
  CACHE_PROVIDER: z.enum(['in-memory', 'upstash']).default('in-memory'),
  CACHE_DEFAULT_TTL: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .default('3600'),

  // Upstash Redis (optional, required in production if using upstash)
  REDIS_REST_URL: z.string().url().optional(),
  REDIS_REST_TOKEN: z.string().optional(),
});

// Add to envValues:
const envValues = {
  // ... existing values ...
  CACHE_PROVIDER: process.env.CACHE_PROVIDER,
  CACHE_DEFAULT_TTL: process.env.CACHE_DEFAULT_TTL || '3600',
  REDIS_REST_URL: process.env.REDIS_REST_URL,
  REDIS_REST_TOKEN: process.env.REDIS_REST_TOKEN,
};
```

### Phase 2: Cache Provider Interface

**Objective:** Define abstract cache interface for all providers

#### 2.1 Create Cache Provider Interface

**File:** `lib/cache/providers/cache.interface.ts`

```typescript
import type { CacheOptions, CacheStats } from '@/lib/types/cache';

/**
 * Abstract cache provider interface
 * All cache providers must implement this interface
 */
export interface ICacheProvider {
  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or null if not found/expired
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param options Cache options (TTL, namespace, etc.)
   */
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;

  /**
   * Delete value from cache
   * @param key Cache key
   */
  delete(key: string): Promise<void>;

  /**
   * Clear all cache entries (use with caution)
   */
  clear(): Promise<void>;

  /**
   * Check if key exists in cache
   * @param key Cache key
   */
  has(key: string): Promise<boolean>;

  /**
   * Delete all keys matching pattern
   * @param pattern Pattern to match (e.g., "user:*")
   */
  invalidatePattern(pattern: string): Promise<number>;

  /**
   * Get cache statistics
   */
  getStats(): Promise<CacheStats>;

  /**
   * Initialize cache provider
   */
  initialize(): Promise<void>;

  /**
   * Disconnect from cache provider
   */
  disconnect(): Promise<void>;
}
```

### Phase 3: In-Memory Cache Provider

**Objective:** Implement in-memory cache for development and testing

#### 3.1 Create In-Memory Provider

**File:** `lib/cache/providers/in-memory.provider.ts`

```typescript
import type { ICacheProvider } from './cache.interface';
import type { CacheOptions, CacheStats, CacheEntry } from '@/lib/types/cache';
import { logInfo, logWarn, logDebug } from '@/lib/logger';

/**
 * In-Memory Cache Provider
 *
 * Simple Map-based caching for development and testing.
 * Not suitable for production in multi-instance deployments.
 *
 * Features:
 * - TTL support with automatic cleanup
 * - Namespace support
 * - Pattern-based invalidation
 * - Cache statistics tracking
 */
export class InMemoryCacheProvider implements ICacheProvider {
  private store: Map<string, CacheEntry<unknown>>;
  private stats: { hits: number; misses: number };
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.store = new Map();
    this.stats = { hits: 0, misses: 0 };
    this.cleanupInterval = null;
  }

  async initialize(): Promise<void> {
    logInfo('Initializing In-Memory cache provider');

    // Start cleanup interval (every 60 seconds)
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);

    logInfo('In-Memory cache provider initialized');
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.misses++;
      logDebug(`Cache MISS: ${key}`);
      return null;
    }

    // Check if entry is expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      this.stats.misses++;
      logDebug(`Cache EXPIRED: ${key}`);
      return null;
    }

    this.stats.hits++;
    logDebug(`Cache HIT: ${key}`);
    return entry.value;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl ?? null;
    const namespace = options?.namespace ?? '';

    const fullKey = namespace ? `${namespace}:${key}` : key;

    const entry: CacheEntry<T> = {
      value,
      expiresAt: ttl ? Date.now() + ttl * 1000 : null,
      createdAt: Date.now(),
    };

    this.store.set(fullKey, entry as CacheEntry<unknown>);
    logDebug(`Cache SET: ${fullKey}${ttl ? ` (TTL: ${ttl}s)` : ''}`);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
    logDebug(`Cache DELETE: ${key}`);
  }

  async clear(): Promise<void> {
    const size = this.store.size;
    this.store.clear();
    this.stats = { hits: 0, misses: 0 };
    logWarn(`Cache CLEARED: ${size} entries removed`);
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async invalidatePattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let count = 0;

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }

    logDebug(`Cache INVALIDATE PATTERN: ${pattern} (${count} keys removed)`);
    return count;
  }

  async getStats(): Promise<CacheStats> {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      keys: this.store.size,
      hitRate,
    };
  }

  async disconnect(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
    logInfo('In-Memory cache provider disconnected');
  }

  /**
   * Remove expired entries from cache
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.store.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logDebug(`Cache cleanup: ${removed} expired entries removed`);
    }
  }
}
```

### Phase 4: Upstash Redis Provider

**Objective:** Implement Upstash Redis provider for production

#### 4.1 Create Upstash Provider

**File:** `lib/cache/providers/upstash.provider.ts`

```typescript
import { Redis } from '@upstash/redis';
import type { ICacheProvider } from './cache.interface';
import type { CacheOptions, CacheStats } from '@/lib/types/cache';
import { logInfo, logError, logDebug, logWarn } from '@/lib/logger';
import { env } from '@/lib/env';

/**
 * Upstash Redis Cache Provider
 *
 * Serverless Redis caching for production environments.
 * Uses Upstash's REST API for edge-compatible caching.
 *
 * Features:
 * - Distributed caching
 * - Durable storage
 * - Edge-compatible
 * - Automatic TTL support
 * - Pattern-based invalidation
 */
export class UpstashCacheProvider implements ICacheProvider {
  private redis: Redis;
  private stats: { hits: number; misses: number };

  constructor() {
    if (!env.REDIS_REST_URL || !env.REDIS_REST_TOKEN) {
      throw new Error(
        'Upstash Redis configuration missing. Set REDIS_REST_URL and REDIS_REST_TOKEN'
      );
    }

    this.redis = new Redis({
      url: env.REDIS_REST_URL,
      token: env.REDIS_REST_TOKEN,
    });

    this.stats = { hits: 0, misses: 0 };
  }

  async initialize(): Promise<void> {
    try {
      // Test connection
      await this.redis.ping();
      logInfo('Upstash Redis cache provider initialized');
    } catch (error) {
      logError('Failed to initialize Upstash Redis', error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get<T>(key);

      if (value === null) {
        this.stats.misses++;
        logDebug(`Cache MISS: ${key}`);
        return null;
      }

      this.stats.hits++;
      logDebug(`Cache HIT: ${key}`);
      return value;
    } catch (error) {
      logError(`Cache GET error for key: ${key}`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const ttl = options?.ttl ?? env.CACHE_DEFAULT_TTL;
      const namespace = options?.namespace ?? '';

      const fullKey = namespace ? `${namespace}:${key}` : key;

      if (ttl) {
        await this.redis.set(fullKey, value, { ex: ttl });
      } else {
        await this.redis.set(fullKey, value);
      }

      logDebug(`Cache SET: ${fullKey}${ttl ? ` (TTL: ${ttl}s)` : ''}`);
    } catch (error) {
      logError(`Cache SET error for key: ${key}`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      logDebug(`Cache DELETE: ${key}`);
    } catch (error) {
      logError(`Cache DELETE error for key: ${key}`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
      this.stats = { hits: 0, misses: 0 };
      logWarn('Cache CLEARED: All entries removed');
    } catch (error) {
      logError('Cache CLEAR error', error);
      throw error;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      logError(`Cache HAS error for key: ${key}`, error);
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      await this.redis.del(...keys);
      logDebug(
        `Cache INVALIDATE PATTERN: ${pattern} (${keys.length} keys removed)`
      );

      return keys.length;
    } catch (error) {
      logError(`Cache INVALIDATE PATTERN error for pattern: ${pattern}`, error);
      return 0;
    }
  }

  async getStats(): Promise<CacheStats> {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    try {
      const dbsize = await this.redis.dbsize();

      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        keys: dbsize,
        hitRate,
      };
    } catch (error) {
      logError('Cache STATS error', error);

      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        keys: 0,
        hitRate,
      };
    }
  }

  async disconnect(): Promise<void> {
    // Upstash Redis uses HTTP REST API, no persistent connection to close
    this.stats = { hits: 0, misses: 0 };
    logInfo('Upstash Redis cache provider disconnected');
  }
}
```

### Phase 5: Cache Service & Factory

**Objective:** Create main cache service with provider factory

#### 5.1 Create Provider Factory

**File:** `lib/cache/cache.factory.ts`

```typescript
import type { ICacheProvider } from './providers/cache.interface';
import { InMemoryCacheProvider } from './providers/in-memory.provider';
import { UpstashCacheProvider } from './providers/upstash.provider';
import { CacheProvider } from '@/lib/types/cache';
import { env } from '@/lib/env';
import { logInfo } from '@/lib/logger';

/**
 * Cache Provider Factory
 *
 * Creates the appropriate cache provider based on environment configuration.
 * Implements the Factory pattern for clean provider instantiation.
 */
export class CacheFactory {
  /**
   * Create cache provider based on environment configuration
   */
  static createProvider(): ICacheProvider {
    const provider = env.CACHE_PROVIDER as CacheProvider;

    logInfo(`Creating cache provider: ${provider}`);

    switch (provider) {
      case CacheProvider.IN_MEMORY:
        return new InMemoryCacheProvider();

      case CacheProvider.UPSTASH:
        return new UpstashCacheProvider();

      default:
        logInfo(`Unknown cache provider: ${provider}, defaulting to in-memory`);
        return new InMemoryCacheProvider();
    }
  }
}
```

#### 5.2 Create Main Cache Service

**File:** `lib/cache/cache.service.ts`

````typescript
import 'server-only';
import type { ICacheProvider } from './providers/cache.interface';
import { CacheFactory } from './cache.factory';
import type { CacheOptions, CacheStats } from '@/lib/types/cache';
import { logError, logInfo } from '@/lib/logger';
import { env } from '@/lib/env';

/**
 * Cache Service
 *
 * Centralized caching service that provides a unified interface
 * for all caching operations. Automatically selects the appropriate
 * provider based on environment configuration.
 *
 * Usage:
 * ```typescript
 * import { cacheService } from '@/lib/cache';
 *
 * // Set value
 * await cacheService.set('user:123', userData, { ttl: 3600 });
 *
 * // Get value
 * const user = await cacheService.get<User>('user:123');
 *
 * // Get or set pattern
 * const user = await cacheService.getOrSet(
 *   'user:123',
 *   async () => await fetchUser(123),
 *   { ttl: 3600 }
 * );
 * ```
 */
class CacheService {
  private provider: ICacheProvider;
  private initialized: boolean = false;

  constructor() {
    this.provider = CacheFactory.createProvider();
  }

  /**
   * Initialize cache provider (call once on app startup)
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.provider.initialize();
      this.initialized = true;
      logInfo('Cache service initialized successfully');
    } catch (error) {
      logError('Failed to initialize cache service', error);
      throw error;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.provider.get<T>(key);
    } catch (error) {
      logError(`Cache get error for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const defaultTtl = env.CACHE_DEFAULT_TTL;
      const finalOptions = {
        ...options,
        ttl: options?.ttl ?? defaultTtl,
      };

      await this.provider.set(key, value, finalOptions);
    } catch (error) {
      logError(`Cache set error for key: ${key}`, error);
      // Don't throw - cache failures should not break the app
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.provider.delete(key);
    } catch (error) {
      logError(`Cache delete error for key: ${key}`, error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      await this.provider.clear();
    } catch (error) {
      logError('Cache clear error', error);
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    try {
      return await this.provider.has(key);
    } catch (error) {
      logError(`Cache has error for key: ${key}`, error);
      return false;
    }
  }

  /**
   * Get value from cache or set it if not found
   *
   * @param key Cache key
   * @param factory Function to generate value if not in cache
   * @param options Cache options
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Skip cache if requested
    if (options?.skipCache) {
      return await factory();
    }

    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Generate fresh value
    const value = await factory();

    // Cache the value
    await this.set(key, value, options);

    return value;
  }

  /**
   * Invalidate cache keys matching pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      return await this.provider.invalidatePattern(pattern);
    } catch (error) {
      logError(`Cache invalidate pattern error for pattern: ${pattern}`, error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      return await this.provider.getStats();
    } catch (error) {
      logError('Cache stats error', error);
      return {
        hits: 0,
        misses: 0,
        keys: 0,
        hitRate: 0,
      };
    }
  }

  /**
   * Disconnect from cache provider (call on app shutdown)
   */
  async disconnect(): Promise<void> {
    try {
      await this.provider.disconnect();
      this.initialized = false;
      logInfo('Cache service disconnected');
    } catch (error) {
      logError('Cache disconnect error', error);
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
````

#### 5.3 Create Cache Module Exports

**File:** `lib/cache/index.ts`

```typescript
/**
 * Cache Module Exports
 *
 * Centralized exports for the caching system.
 * Import from this file for consistent cache access across the application.
 *
 * @example
 * import { cacheService, CacheKeys } from '@/lib/cache';
 *
 * // Use cache service
 * const user = await cacheService.get<User>(CacheKeys.user(userId));
 */

export { cacheService } from './cache.service';
export type { ICacheProvider } from './providers/cache.interface';

// Re-export cache types
export type { CacheOptions, CacheStats, CacheEntry } from '@/lib/types/cache';

export { CacheProvider } from '@/lib/types/cache';
```

### Phase 6: Cache Key Utilities

**Objective:** Create standardized cache key patterns

#### 6.1 Create Cache Key Utilities

**File:** `lib/cache/cache-keys.util.ts`

```typescript
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
```

### Phase 7: Application Initialization

**Objective:** Initialize cache on app startup

#### 7.1 Update Instrumentation

**File:** `instrumentation.ts`

```typescript
import { cacheService } from '@/lib/cache';
import { logInfo, logError } from '@/lib/logger';

/**
 * Instrumentation hook for Next.js
 * Called once when the server starts
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      // Initialize cache service
      await cacheService.initialize();
      logInfo('Application instrumentation completed');
    } catch (error) {
      logError('Application instrumentation failed', error);
      throw error;
    }
  }
}
```

### Phase 8: Cache Statistics API

**Objective:** Expose cache statistics for monitoring

#### 8.1 Create Cache Stats API Route

**File:** `app/api/cache/stats/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { cacheService } from '@/lib/cache';
import { requireServerContext } from '@/lib/auth/server-context';

/**
 * GET /api/cache/stats
 *
 * Get cache statistics (admin only)
 */
export async function GET() {
  try {
    // Require authenticated user
    const { user } = await requireServerContext();

    // TODO: Add admin role check
    // if (!isAdmin(user)) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const stats = await cacheService.getStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cache stats' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cache/stats
 *
 * Clear cache (admin only)
 */
export async function DELETE() {
  try {
    // Require authenticated user
    const { user } = await requireServerContext();

    // TODO: Add admin role check
    // if (!isAdmin(user)) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    await cacheService.clear();

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
```

### Phase 9: Unit Tests

**Objective:** Comprehensive testing for cache system

#### 9.1 Create Cache Service Tests

**File:** `tests/cache/cache.service.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cacheService } from '@/lib/cache';

describe('Cache Service', () => {
  beforeEach(async () => {
    await cacheService.initialize();
    await cacheService.clear();
  });

  afterEach(async () => {
    await cacheService.disconnect();
  });

  describe('Basic Operations', () => {
    it('should set and get value', async () => {
      await cacheService.set('test-key', 'test-value');
      const value = await cacheService.get('test-key');
      expect(value).toBe('test-value');
    });

    it('should return null for non-existent key', async () => {
      const value = await cacheService.get('non-existent');
      expect(value).toBeNull();
    });

    it('should delete value', async () => {
      await cacheService.set('test-key', 'test-value');
      await cacheService.delete('test-key');
      const value = await cacheService.get('test-key');
      expect(value).toBeNull();
    });

    it('should check if key exists', async () => {
      await cacheService.set('test-key', 'test-value');
      const exists = await cacheService.has('test-key');
      expect(exists).toBe(true);
    });
  });

  describe('TTL', () => {
    it('should expire after TTL', async () => {
      await cacheService.set('test-key', 'test-value', { ttl: 1 });

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const value = await cacheService.get('test-key');
      expect(value).toBeNull();
    });
  });

  describe('Complex Objects', () => {
    it('should cache complex objects', async () => {
      const user = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
      };

      await cacheService.set('user:123', user);
      const cached = await cacheService.get('user:123');

      expect(cached).toEqual(user);
    });
  });

  describe('getOrSet', () => {
    it('should get from cache if exists', async () => {
      await cacheService.set('test-key', 'cached-value');

      let factoryCalled = false;
      const value = await cacheService.getOrSet('test-key', async () => {
        factoryCalled = true;
        return 'new-value';
      });

      expect(value).toBe('cached-value');
      expect(factoryCalled).toBe(false);
    });

    it('should call factory if not in cache', async () => {
      const value = await cacheService.getOrSet('test-key', async () => {
        return 'new-value';
      });

      expect(value).toBe('new-value');

      // Verify it was cached
      const cached = await cacheService.get('test-key');
      expect(cached).toBe('new-value');
    });
  });

  describe('Pattern Invalidation', () => {
    it('should invalidate keys matching pattern', async () => {
      await cacheService.set('user:1', { id: 1 });
      await cacheService.set('user:2', { id: 2 });
      await cacheService.set('org:1', { id: 1 });

      const count = await cacheService.invalidatePattern('user:*');

      expect(count).toBe(2);

      const user1 = await cacheService.get('user:1');
      const user2 = await cacheService.get('user:2');
      const org1 = await cacheService.get('org:1');

      expect(user1).toBeNull();
      expect(user2).toBeNull();
      expect(org1).not.toBeNull();
    });
  });

  describe('Statistics', () => {
    it('should track cache hits and misses', async () => {
      await cacheService.set('test-key', 'value');

      await cacheService.get('test-key'); // Hit
      await cacheService.get('missing-key'); // Miss

      const stats = await cacheService.getStats();

      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.misses).toBeGreaterThan(0);
      expect(stats.keys).toBeGreaterThan(0);
    });
  });
});
```

#### 9.2 Create Cache Keys Tests

**File:** `tests/cache/cache-keys.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { CacheKeys } from '@/lib/cache/cache-keys.util';

describe('Cache Keys', () => {
  describe('User Keys', () => {
    it('should generate user key', () => {
      expect(CacheKeys.user('123')).toBe('user:123');
    });

    it('should generate user organizations key', () => {
      expect(CacheKeys.userOrganizations('123')).toBe('user:123:organizations');
    });

    it('should generate user pattern', () => {
      expect(CacheKeys.userPattern('123')).toBe('user:123:*');
      expect(CacheKeys.userPattern()).toBe('user:*');
    });
  });

  describe('Organization Keys', () => {
    it('should generate organization key', () => {
      expect(CacheKeys.organization('456')).toBe('organization:456');
    });

    it('should generate organization members key', () => {
      expect(CacheKeys.organizationMembers('456')).toBe(
        'organization:456:members'
      );
    });

    it('should generate organization pattern', () => {
      expect(CacheKeys.organizationPattern('456')).toBe('organization:456:*');
      expect(CacheKeys.organizationPattern()).toBe('organization:*');
    });
  });

  describe('Stripe Keys', () => {
    it('should generate stripe products key', () => {
      expect(CacheKeys.stripeProducts()).toBe('stripe:products');
    });

    it('should generate stripe customer key', () => {
      expect(CacheKeys.stripeCustomer('cus_123')).toBe(
        'stripe:customer:cus_123'
      );
    });
  });

  describe('Rate Limit Keys', () => {
    it('should generate rate limit key', () => {
      expect(CacheKeys.rateLimit('192.168.1.1', '/api/users')).toBe(
        'ratelimit:/api/users:192.168.1.1'
      );
    });
  });
});
```

### Phase 10: Documentation

**Objective:** Create comprehensive documentation

#### 10.1 Create Cache Documentation

**File:** `docs/cache.md`

See full documentation in the docs folder after implementation.

## Folder Structure

The following new files and directories will be created:

```
saas-starter/
├── lib/
│   ├── cache/
│   │   ├── providers/
│   │   │   ├── cache.interface.ts
│   │   │   ├── in-memory.provider.ts
│   │   │   └── upstash.provider.ts
│   │   ├── cache.factory.ts
│   │   ├── cache.service.ts
│   │   ├── cache-keys.util.ts
│   │   └── index.ts
│   ├── types/
│   │   └── cache/
│   │       ├── cache-options.type.ts
│   │       ├── cache-entry.type.ts
│   │       ├── cache-stats.type.ts
│   │       ├── cache-provider.enum.ts
│   │       └── index.ts
├── app/
│   └── api/
│       └── cache/
│           └── stats/
│               └── route.ts
├── tests/
│   └── cache/
│       ├── cache.service.test.ts
│       └── cache-keys.test.ts
├── docs/
│   └── cache.md
└── .env (updated)
```

## Configuration Changes

### Environment Files

Update `.env.local`, `.env.staging`, and `.env.production`:

```bash
# Cache Configuration
CACHE_PROVIDER=in-memory  # or 'upstash' for production
CACHE_DEFAULT_TTL=3600

# Upstash Redis (production only)
REDIS_REST_URL=https://your-instance.upstash.io
REDIS_REST_TOKEN=your-token
```

### Package.json Scripts

Add cache-related scripts:

```json
{
  "scripts": {
    "test:cache": "vitest run tests/cache"
  }
}
```

## Risk Assessment

| Risk                      | Impact | Probability | Mitigation                                 |
| ------------------------- | ------ | ----------- | ------------------------------------------ |
| Cache Provider Failure    | High   | Low         | Graceful degradation, fallback to database |
| Cache Stampede            | Medium | Medium      | Use `getOrSet` with mutex/locking          |
| Stale Data                | Medium | Medium      | Proper TTL and invalidation strategy       |
| Memory Leaks (In-Memory)  | Low    | Low         | Automatic cleanup, TTL enforcement         |
| Network Latency (Upstash) | Low    | Low         | Optimize key sizes, use batching           |
| Key Collisions            | Medium | Low         | Use `CacheKeys` utility consistently       |
| Over-Caching              | Low    | Medium      | Monitor cache size, set appropriate TTLs   |

## Success Metrics

1. **Cache Hit Rate**: Target > 80%
2. **Response Time Improvement**: Target 30-50% faster for cached requests
3. **Database Load Reduction**: Target 40-60% fewer queries
4. **Zero Cache-Related Incidents**: Cache failures should not break functionality
5. **Developer Adoption**: >50% of database queries use caching within 1 month

## Implementation Timeline

```
Week 1:
├── Day 1-2: Phase 1-2 (Types, Interface, Environment)
├── Day 3: Phase 3 (In-Memory Provider)
└── Day 4-5: Phase 4 (Upstash Provider)

Week 2:
├── Day 1-2: Phase 5-6 (Cache Service, Cache Keys)
├── Day 3: Phase 7 (Initialization)
└── Day 4-5: Phase 8-9 (API, Unit Tests)

Week 3:
├── Day 1-2: Phase 10 (Documentation)
└── Day 3-5: Integration & Testing
```

**Total Estimated Duration**: 15-20 working days (3-4 weeks at 4-6 hours/day)

## Post-Implementation Considerations

### Monitoring & Analytics

1. **Cache Performance**:
   - Monitor hit/miss rates
   - Track cache size and memory usage
   - Alert on low hit rates

2. **Provider Health**:
   - Upstash connection status
   - Network latency metrics
   - Error rates

3. **Application Impact**:
   - Response time improvements
   - Database query reduction
   - Resource utilization

### Future Enhancements

1. **Advanced Features**:
   - Cache warming strategies
   - Distributed locking for cache stampede prevention
   - Multi-tier caching (memory + Redis)
   - Cache compression for large objects

2. **Additional Providers**:
   - Redis (self-hosted)
   - Memcached
   - DynamoDB (for AWS deployments)
   - Cloudflare KV

3. **Optimization**:
   - Batch operations
   - Pipelining for multiple cache operations
   - Pub/sub for cache invalidation across instances
   - Cache preloading/warming

4. **Management**:
   - Admin dashboard for cache management
   - Cache analytics and insights
   - Automated cache tuning
   - A/B testing for cache strategies

## References & Resources

### Official Documentation

- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [Upstash REST API](https://docs.upstash.com/redis/features/restapi)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Vercel Edge Config](https://vercel.com/docs/storage/edge-config)

### Best Practices

- [Caching Best Practices](https://aws.amazon.com/caching/best-practices/)
- [Redis Best Practices](https://redis.io/docs/reference/optimization/)
- [HTTP Caching](https://web.dev/http-cache/)
- [Cache Invalidation Strategies](https://docs.microsoft.com/en-us/azure/architecture/best-practices/caching)

### Implementation Guides

- [Building a Cache Abstraction Layer](https://www.theodinproject.com/lessons/nodejs-caching)
- [Provider Pattern in TypeScript](https://refactoring.guru/design-patterns/strategy/typescript/example)
- [Testing Cache Systems](https://martinfowler.com/bliki/TestDouble.html)

### Performance

- [Cache Stampede Problem](https://en.wikipedia.org/wiki/Cache_stampede)
- [TTL Best Practices](https://redis.io/docs/manual/eviction/)
- [Cache Hit Rate Optimization](https://redis.io/topics/optimization)

### Tools & Resources

- [Upstash Console](https://console.upstash.com/)
- [Redis CLI](https://redis.io/topics/rediscli)
- [Cache Performance Calculator](https://redis.io/topics/memory-optimization)

---

**Document Version**: 1.0  
**Last Updated**: September 30, 2025  
**Author**: Software Architect Agent  
**Status**: Ready for Implementation  
**Estimated Effort**: 15-20 days  
**Priority**: High
