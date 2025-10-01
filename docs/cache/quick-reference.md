---
title: Cache Quick Reference
description: Quick reference guide for common cache operations and patterns
---

# Cache Quick Reference

A quick reference guide for common cache operations, patterns, and troubleshooting.

## Basic Operations

### Import Cache Service

```typescript
import { cacheService, CacheKeys } from '@/lib/cache';
```

### Set and Get

```typescript
// Set value
await cacheService.set('key', value, { ttl: 3600 });

// Get value
const value = await cacheService.get<Type>('key');

// Get or set (cache-aside pattern)
const value = await cacheService.getOrSet(
  'key',
  async () => await fetchData(),
  { ttl: 3600 }
);
```

### Delete and Clear

```typescript
// Delete specific key
await cacheService.delete('key');

// Clear all cache
await cacheService.clear();

// Invalidate pattern
await cacheService.invalidatePattern('user:*');
```

## Common Patterns

### User Data Caching

```typescript
// Cache user data
const user = await cacheService.getOrSet(
  CacheKeys.user(userId),
  async () =>
    await db.query.users.findFirst({
      where: eq(users.id, userId),
    }),
  { ttl: 1800 } // 30 minutes
);

// Invalidate on update
await cacheService.delete(CacheKeys.user(userId));
```

### API Response Caching

```typescript
// Cache API responses
const cacheKey = `api:${endpoint}:${JSON.stringify(params)}`;
const response = await cacheService.getOrSet(
  cacheKey,
  async () => await fetchFromAPI(endpoint, params),
  { ttl: 300 } // 5 minutes
);
```

### Session Caching

```typescript
// Cache session data
const session = await cacheService.getOrSet(
  CacheKeys.session(sessionId),
  async () =>
    await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    }),
  { ttl: 7200 } // 2 hours
);
```

### Rate Limiting

```typescript
// Implement rate limiting
const key = CacheKeys.rateLimit(ip, endpoint);
const attempts = (await cacheService.get<number>(key)) || 0;

if (attempts >= 100) {
  throw new Error('Rate limit exceeded');
}

await cacheService.set(key, attempts + 1, { ttl: 3600 });
```

## Cache Keys Reference

### User Keys

```typescript
CacheKeys.user('123'); // "user:123"
CacheKeys.userOrganizations('123'); // "user:123:organizations"
CacheKeys.userSessions('123'); // "user:123:sessions"
CacheKeys.userPattern('123'); // "user:123:*"
```

### Organization Keys

```typescript
CacheKeys.organization('456'); // "organization:456"
CacheKeys.organizationMembers('456'); // "organization:456:members"
CacheKeys.organizationSubscription('456'); // "organization:456:subscription"
CacheKeys.organizationPattern('456'); // "organization:456:*"
```

### Stripe Keys

```typescript
CacheKeys.stripeProducts(); // "stripe:products"
CacheKeys.stripeCustomer('cus_123'); // "stripe:customer:cus_123"
CacheKeys.stripeSubscription('sub_123'); // "stripe:subscription:sub_123"
```

### Utility Keys

```typescript
CacheKeys.rateLimit('192.168.1.1', '/api/users'); // "ratelimit:/api/users:192.168.1.1"
CacheKeys.session('sess_123'); // "session:sess_123"
CacheKeys.userActivity('123', 10); // "activity:user:123:limit:10"
```

## TTL Recommendations

| Data Type     | TTL        | Reason                                    |
| ------------- | ---------- | ----------------------------------------- |
| User Data     | 30 minutes | Balance between freshness and performance |
| Product Data  | 1 hour     | Changes infrequently                      |
| Session Data  | 2 hours    | Security vs. performance                  |
| API Responses | 5 minutes  | Quick invalidation for dynamic data       |
| Configuration | 24 hours   | Rarely changes                            |
| Rate Limits   | 1 hour     | Reset window                              |

## Environment Configuration

### Development

```bash
CACHE_PROVIDER=in-memory
CACHE_DEFAULT_TTL=3600
```

### Production

```bash
CACHE_PROVIDER=upstash
CACHE_DEFAULT_TTL=3600
REDIS_REST_URL=https://your-instance.upstash.io
REDIS_REST_TOKEN=your-token
```

## Error Handling

### Graceful Degradation

```typescript
async function getCachedData(key: string) {
  try {
    return await cacheService.get(key);
  } catch (error) {
    logError('Cache get failed', error);
    // Fallback to database
    return await getDataFromDatabase(key);
  }
}
```

### Cache Stampede Prevention

```typescript
// Note: This is pseudocode demonstrating the concept.
// The cache service doesn't currently provide atomic set-if-not-exists operations.
// For production use, consider implementing this pattern with a distributed lock
// service like Redis or use a library like 'p-lock' for coordination.

async function getOrSetWithLock(key: string, factory: () => Promise<any>) {
  const lockKey = `lock:${key}`;
  // This would require a setIfNotExists() method that doesn't exist in current cache interface
  // const hasLock = await cacheService.setIfNotExists(lockKey, true, { ttl: 10 });

  // For now, this pattern isn't directly supported by the cache service
  // Consider using Redis SET NX or implementing distributed locks separately
}
```

## Monitoring

### Get Statistics

```typescript
const stats = await cacheService.getStats();
console.log({
  hitRate: `${(stats.hitRate * 100).toFixed(2)}%`,
  totalKeys: stats.keys,
  totalRequests: stats.hits + stats.misses,
});
```

### Health Check

```typescript
async function checkCacheHealth() {
  const stats = await cacheService.getStats();
  return {
    isHealthy: stats.hitRate > 0.7,
    hitRate: stats.hitRate,
    keys: stats.keys,
  };
}
```

## Troubleshooting

### Common Issues

| Issue                    | Solution                                     |
| ------------------------ | -------------------------------------------- |
| Cache not working        | Check initialization in `instrumentation.ts` |
| Upstash connection fails | Verify credentials and network               |
| High memory usage        | Use shorter TTL or switch to Upstash         |
| Cache stampede           | Implement locking or use `getOrSet`          |
| Stale data               | Reduce TTL or implement invalidation         |

### Debug Commands

```typescript
// Check if cache is initialized
const stats = await cacheService.getStats();
console.log('Cache stats:', stats);

// Test basic operations
await cacheService.set('test', 'value');
const value = await cacheService.get('test');
console.log('Test value:', value);

// Clear cache
await cacheService.clear();
```

### Log Analysis

```bash
# Look for cache-related logs
grep "Cache" logs/application.log

# Common log patterns:
# [CACHE DEBUG] Cache SET: user:123 (TTL: 3600s)
# [CACHE DEBUG] Cache HIT: user:123
# [CACHE DEBUG] Cache MISS: user:456
# [CACHE ERROR] Cache GET error for key: user:123
```

## Best Practices

### Do's

- ✅ Use `CacheKeys` utility for consistent naming
- ✅ Set appropriate TTL values
- ✅ Use `getOrSet` for expensive operations
- ✅ Implement graceful error handling
- ✅ Monitor cache performance
- ✅ Use namespaces for organization

### Don'ts

- ❌ Don't cache sensitive data
- ❌ Don't use very long TTL without invalidation
- ❌ Don't ignore cache errors
- ❌ Don't use inconsistent key naming
- ❌ Don't cache large objects unnecessarily
- ❌ Don't forget to invalidate on updates

## Performance Tips

### Optimization Strategies

1. **Batch Operations**

   ```typescript
   const keys = ['user:1', 'user:2', 'user:3'];
   const users = await Promise.all(
     keys.map((key) => cacheService.get<User>(key))
   );
   ```

2. **Compression for Large Data**

   ```typescript
   const compressed = JSON.stringify(largeObject);
   await cacheService.set('large-data', compressed);
   ```

3. **Smart Invalidation**

   ```typescript
   // Invalidate related data
   await cacheService.invalidatePattern(CacheKeys.userPattern(userId));
   ```

4. **Preloading**
   ```typescript
   // Preload frequently accessed data
   const popularUsers = await getPopularUsers();
   await Promise.all(
     popularUsers.map((user) =>
       cacheService.set(CacheKeys.user(user.id), user, { ttl: 3600 })
     )
   );
   ```

---

**Last Updated**: 2025-01-30  
**Status**: ✅ Complete
