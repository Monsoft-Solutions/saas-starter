---
title: Cache System
description: Provider-agnostic caching layer with support for in-memory and Upstash Redis providers
---

# Cache System

A comprehensive, provider-agnostic caching layer that provides unified caching operations across development and production environments. The system automatically selects the appropriate cache provider based on your environment configuration.

## Quick Start

### Prerequisites

- Node.js 18+ with TypeScript
- Environment variables configured
- Upstash account (for production)

### Installation

The cache system is already included in the project. Install the required dependency:

```bash
pnpm add @upstash/redis
```

### Basic Usage

```typescript
import { cacheService, CacheKeys } from '@/lib/cache';

// Set a value in cache
await cacheService.set('user:123', userData, { ttl: 3600 });

// Get a value from cache
const user = await cacheService.get<User>('user:123');

// Get or set pattern (cache-aside)
const user = await cacheService.getOrSet(
  CacheKeys.user('123'),
  async () => await fetchUserFromDatabase('123'),
  { ttl: 3600 }
);
```

## Core Concepts

### Architecture Overview

The cache system follows a provider-agnostic architecture with three main layers:

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

### Provider Selection

| Environment | Provider  | Rationale                                         |
| ----------- | --------- | ------------------------------------------------- |
| Development | In-Memory | Fast, simple, no external dependencies            |
| Test        | In-Memory | Isolated tests, no persistence needed             |
| Production  | Upstash   | Serverless, durable, distributed, Edge-compatible |

## Configuration Reference

### Environment Variables

| Variable            | Type                       | Required | Default       | Description            |
| ------------------- | -------------------------- | -------- | ------------- | ---------------------- |
| `CACHE_PROVIDER`    | `'in-memory' \| 'upstash'` | No       | `'in-memory'` | Cache provider to use  |
| `CACHE_DEFAULT_TTL` | `number`                   | No       | `3600`        | Default TTL in seconds |
| `REDIS_REST_URL`    | `string`                   | Yes\*    | -             | Upstash Redis REST URL |
| `REDIS_REST_TOKEN`  | `string`                   | Yes\*    | -             | Upstash Redis token    |

\*Required only when using Upstash provider

### Environment Setup

Create or update your `.env` files:

```bash
# .env.local (development)
CACHE_PROVIDER=in-memory
CACHE_DEFAULT_TTL=3600

# .env.production (production)
CACHE_PROVIDER=upstash
CACHE_DEFAULT_TTL=3600
REDIS_REST_URL=https://your-instance.upstash.io
REDIS_REST_TOKEN=your-token-here
```

## API Reference

### CacheService

The main cache service provides a unified interface for all caching operations.

#### Methods

##### `get<T>(key: string): Promise<T | null>`

Retrieve a value from cache.

```typescript
const user = await cacheService.get<User>('user:123');
if (user) {
  console.log('User found in cache:', user.name);
}
```

##### `set<T>(key: string, value: T, options?: CacheOptions): Promise<void>`

Store a value in cache.

```typescript
await cacheService.set('user:123', userData, {
  ttl: 3600, // 1 hour
  namespace: 'app', // Optional namespace
});
```

##### `getOrSet<T>(key: string, factory: () => Promise<T>, options?: CacheOptions): Promise<T>`

Get value from cache or generate it using the factory function.

```typescript
const user = await cacheService.getOrSet(
  CacheKeys.user('123'),
  async () => {
    // This function runs only if cache miss
    return await fetchUserFromDatabase('123');
  },
  { ttl: 3600 }
);
```

##### `delete(key: string): Promise<void>`

Remove a specific key from cache.

```typescript
await cacheService.delete('user:123');
```

##### `invalidatePattern(pattern: string): Promise<number>`

Remove all keys matching a pattern.

```typescript
// Remove all user-related cache entries
const removed = await cacheService.invalidatePattern('user:*');
console.log(`Removed ${removed} cache entries`);
```

##### `has(key: string): Promise<boolean>`

Check if a key exists in cache.

```typescript
const exists = await cacheService.has('user:123');
```

##### `clear(): Promise<void>`

Clear all cache entries (use with caution).

```typescript
await cacheService.clear();
```

##### `getStats(): Promise<CacheStats>`

Get cache performance statistics.

```typescript
const stats = await cacheService.getStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
```

### CacheOptions

Configuration options for cache operations.

```typescript
type CacheOptions = {
  /** Time-to-live in seconds */
  ttl?: number;
  /** Namespace/prefix for cache keys */
  namespace?: string;
  /** Skip cache and force fresh data */
  skipCache?: boolean;
};
```

### CacheKeys

Standardized cache key generation utility.

```typescript
// User keys
CacheKeys.user('123'); // "user:123"
CacheKeys.userOrganizations('123'); // "user:123:organizations"
CacheKeys.userSessions('123'); // "user:123:sessions"
CacheKeys.userPattern('123'); // "user:123:*"

// Organization keys
CacheKeys.organization('456'); // "organization:456"
CacheKeys.organizationMembers('456'); // "organization:456:members"
CacheKeys.organizationSubscription('456'); // "organization:456:subscription"

// Stripe keys
CacheKeys.stripeProducts(); // "stripe:products"
CacheKeys.stripeCustomer('cus_123'); // "stripe:customer:cus_123"

// Rate limiting
CacheKeys.rateLimit('192.168.1.1', '/api/users'); // "ratelimit:/api/users:192.168.1.1"
```

## Examples

### User Data Caching

```typescript
import { cacheService, CacheKeys } from '@/lib/cache';

export async function getUser(userId: string) {
  return await cacheService.getOrSet(
    CacheKeys.user(userId),
    async () => {
      // Fetch from database only on cache miss
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    },
    { ttl: 1800 } // 30 minutes
  );
}

export async function updateUser(userId: string, data: Partial<User>) {
  // Update in database
  const updatedUser = await db
    .update(users)
    .set(data)
    .where(eq(users.id, userId))
    .returning();

  // Invalidate cache
  await cacheService.delete(CacheKeys.user(userId));
  await cacheService.invalidatePattern(CacheKeys.userPattern(userId));

  return updatedUser[0];
}
```

### API Response Caching

```typescript
import { cacheService } from '@/lib/cache';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cacheKey = `api:${url.pathname}:${url.search}`;

  // Try cache first
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Generate fresh data
  const data = await generateApiResponse(url);

  // Cache for 5 minutes
  await cacheService.set(cacheKey, data, { ttl: 300 });

  return NextResponse.json(data);
}
```

### Rate Limiting with Cache

```typescript
import { cacheService, CacheKeys } from '@/lib/cache';

export async function checkRateLimit(ip: string, endpoint: string) {
  const key = CacheKeys.rateLimit(ip, endpoint);
  const attempts = (await cacheService.get<number>(key)) || 0;

  if (attempts >= 100) {
    // 100 requests per hour
    throw new Error('Rate limit exceeded');
  }

  // Increment counter
  await cacheService.set(key, attempts + 1, { ttl: 3600 });

  return true;
}
```

### Session Caching

```typescript
import { cacheService, CacheKeys } from '@/lib/cache';

export async function getSession(sessionId: string) {
  return await cacheService.getOrSet(
    CacheKeys.session(sessionId),
    async () => {
      const session = await db.query.sessions.findFirst({
        where: eq(sessions.id, sessionId),
      });
      return session;
    },
    { ttl: 86400 } // 24 hours
  );
}
```

## Monitoring & Statistics

### Cache Statistics API

Access cache statistics via the built-in API endpoint:

```typescript
// GET /api/cache/stats
const response = await fetch('/api/cache/stats');
const { data: stats } = await response.json();

console.log({
  hits: stats.hits,
  misses: stats.misses,
  hitRate: `${(stats.hitRate * 100).toFixed(2)}%`,
  totalKeys: stats.keys,
});
```

### Performance Monitoring

Monitor cache performance in your application:

```typescript
import { cacheService } from '@/lib/cache';

export async function getCacheMetrics() {
  const stats = await cacheService.getStats();

  return {
    hitRate: stats.hitRate,
    totalRequests: stats.hits + stats.misses,
    cacheSize: stats.keys,
    performance: stats.hitRate > 0.8 ? 'excellent' : 'needs optimization',
  };
}
```

## Troubleshooting

### Common Issues

#### Cache Not Working

**Problem**: Cache operations return null or don't persist.

**Solutions**:

1. Verify cache service is initialized in `instrumentation.ts`
2. Check environment variables are set correctly
3. Ensure you're using the correct cache keys
4. Check logs for cache provider errors

```typescript
// Debug cache initialization
import { cacheService } from '@/lib/cache';

await cacheService.initialize();
const stats = await cacheService.getStats();
console.log('Cache initialized:', stats);
```

#### Upstash Connection Issues

**Problem**: Upstash Redis connection fails.

**Solutions**:

1. Verify `REDIS_REST_URL` and `REDIS_REST_TOKEN` are correct
2. Check Upstash dashboard for service status
3. Ensure your IP is whitelisted (if using IP restrictions)
4. Test connection manually:

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_REST_URL!,
  token: process.env.REDIS_REST_TOKEN!,
});

try {
  await redis.ping();
  console.log('Upstash connection successful');
} catch (error) {
  console.error('Upstash connection failed:', error);
}
```

#### High Memory Usage (In-Memory Provider)

**Problem**: In-memory cache consumes too much memory.

**Solutions**:

1. Set appropriate TTL values
2. Use pattern invalidation to clean up related keys
3. Monitor cache size and clear when needed
4. Consider switching to Upstash for production

```typescript
// Monitor memory usage
const stats = await cacheService.getStats();
if (stats.keys > 10000) {
  console.warn('Cache size is large:', stats.keys);
  // Consider clearing or using more aggressive TTL
}
```

#### Cache Stampede

**Problem**: Multiple requests trigger expensive operations simultaneously.

**Solutions**:

1. Use `getOrSet` pattern consistently
2. Implement request deduplication
3. Add jitter to TTL values
4. Use shorter TTL for expensive operations

```typescript
// Prevent cache stampede with jitter
const jitter = Math.random() * 60; // 0-60 seconds
const ttl = 3600 + jitter;

await cacheService.set(key, value, { ttl });
```

### Debug Mode

Enable debug logging to troubleshoot cache operations:

```typescript
// Set log level to debug in your environment
LOG_LEVEL = debug;
```

This will log all cache operations including hits, misses, and errors.

## Best Practices

### Key Naming

- Use consistent naming patterns with `CacheKeys` utility
- Include entity type and ID in keys
- Use descriptive suffixes for related data
- Avoid special characters that might cause issues

```typescript
// ✅ Good
CacheKeys.user('123');
CacheKeys.userOrganizations('123');

// ❌ Bad
('user123');
('user_123_orgs');
```

### TTL Strategy

- Set appropriate TTL based on data freshness requirements
- Use shorter TTL for frequently changing data
- Use longer TTL for static or slowly changing data
- Consider cache invalidation for critical updates

```typescript
// Different TTL strategies
await cacheService.set('user:123', userData, { ttl: 1800 }); // 30 min
await cacheService.set('products', products, { ttl: 3600 }); // 1 hour
await cacheService.set('config', config, { ttl: 86400 }); // 24 hours
```

### Error Handling

- Cache failures should not break your application
- Always have fallback mechanisms
- Log cache errors for monitoring
- Use graceful degradation

```typescript
export async function getCachedData(key: string) {
  try {
    return await cacheService.get(key);
  } catch (error) {
    logError('Cache get failed', error);
    // Fallback to database or default value
    return await getDataFromDatabase(key);
  }
}
```

### Performance Optimization

- Use `getOrSet` for expensive operations
- Batch cache operations when possible
- Monitor hit rates and adjust TTL accordingly
- Use pattern invalidation for related data cleanup

```typescript
// Batch operations
const keys = ['user:1', 'user:2', 'user:3'];
const users = await Promise.all(keys.map((key) => cacheService.get<User>(key)));
```

## Related Links

- [Cache Configuration](/cache/configuration) - Complete configuration guide
- [Upstash Setup](/cache/upstash-setup) - Production Redis setup
- [Quick Reference](/cache/quick-reference) - Common patterns and operations
- [Environment Configuration](/environment-configuration) - Setting up environment variables
- [Logging System](/logging) - Application logging and monitoring
- [Unit Testing](/unit-testing) - Testing cache functionality

## External Resources

- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [Redis Best Practices](https://redis.io/docs/reference/optimization/)
- [Caching Strategies](https://aws.amazon.com/caching/best-practices/)

---

**Last Updated**: 2025-01-30  
**Status**: ✅ Complete
