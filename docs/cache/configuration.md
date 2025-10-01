---
title: Cache Configuration
description: Complete guide to configuring the cache system for different environments
---

# Cache Configuration

This guide covers all configuration options for the provider-agnostic cache system, including environment setup, provider selection, and advanced configuration.

## Environment Variables

### Required Variables

| Variable            | Type                       | Description            | Example       |
| ------------------- | -------------------------- | ---------------------- | ------------- |
| `CACHE_PROVIDER`    | `'in-memory' \| 'upstash'` | Cache provider to use  | `'in-memory'` |
| `CACHE_DEFAULT_TTL` | `number`                   | Default TTL in seconds | `3600`        |

### Upstash-Specific Variables

| Variable           | Type     | Required | Description                        | Example                            |
| ------------------ | -------- | -------- | ---------------------------------- | ---------------------------------- |
| `REDIS_REST_URL`   | `string` | Yes\*    | Upstash Redis REST API URL         | `https://your-instance.upstash.io` |
| `REDIS_REST_TOKEN` | `string` | Yes\*    | Upstash Redis authentication token | `AX...`                            |

\*Required only when `CACHE_PROVIDER=upstash`

## Environment Setup

### Development Environment

Create `.env.local`:

```bash
# Cache Configuration
CACHE_PROVIDER=in-memory
CACHE_DEFAULT_TTL=3600

# Optional: Override for testing
# CACHE_DEFAULT_TTL=60
```

### Production Environment

Create `.env.production`:

```bash
# Cache Configuration
CACHE_PROVIDER=upstash
CACHE_DEFAULT_TTL=3600

# Upstash Redis Configuration
REDIS_REST_URL=https://your-instance.upstash.io
REDIS_REST_TOKEN=your-token-here
```

### Staging Environment

Create `.env.staging`:

```bash
# Cache Configuration
CACHE_PROVIDER=upstash
CACHE_DEFAULT_TTL=1800

# Upstash Redis Configuration (can use same as production or separate instance)
REDIS_REST_URL=https://staging-instance.upstash.io
REDIS_REST_TOKEN=staging-token-here
```

## Provider Configuration

### In-Memory Provider

The in-memory provider requires no additional configuration. It's automatically used when `CACHE_PROVIDER=in-memory`.

**Features:**

- Fast access (in-process memory)
- No external dependencies
- Automatic cleanup of expired entries
- Perfect for development and testing

**Limitations:**

- Not shared between application instances
- Memory usage grows with cache size
- Data lost on application restart

### Upstash Provider

The Upstash provider requires Redis credentials and is used when `CACHE_PROVIDER=upstash`.

**Features:**

- Distributed caching across instances
- Persistent storage
- Edge-compatible (REST API)
- Automatic scaling
- Built-in statistics tracking

**Setup Steps:**

1. **Create Upstash Account**
   - Visit [upstash.com](https://upstash.com)
   - Sign up for a free account

2. **Create Redis Database**

   ```bash
   # Using Upstash CLI
   upstash redis create my-cache-db

   # Or via web console
   # Go to console.upstash.com → Create Database
   ```

3. **Get Credentials**

   ```bash
   # Get credentials via CLI
   upstash redis details my-cache-db

   # Or copy from web console
   ```

4. **Configure Environment**
   ```bash
   REDIS_REST_URL=https://your-instance.upstash.io
   REDIS_REST_TOKEN=AX...your-token
   ```

## Advanced Configuration

### Custom TTL Strategies

Configure different TTL values for different data types:

```typescript
// lib/cache/ttl-config.ts
export const TTL_CONFIG = {
  USER_DATA: 1800, // 30 minutes
  PRODUCT_DATA: 3600, // 1 hour
  CONFIG_DATA: 86400, // 24 hours
  SESSION_DATA: 7200, // 2 hours
  API_RESPONSES: 300, // 5 minutes
} as const;

// Usage
await cacheService.set('user:123', userData, {
  ttl: TTL_CONFIG.USER_DATA,
});
```

### Namespace Configuration

Use namespaces to organize cache keys:

```typescript
// lib/cache/namespaces.ts
export const CACHE_NAMESPACES = {
  USER: 'user',
  PRODUCT: 'product',
  SESSION: 'session',
  API: 'api',
} as const;

// Usage
await cacheService.set('123', userData, {
  namespace: CACHE_NAMESPACES.USER,
});
```

### Environment-Specific Settings

Create environment-specific cache configurations:

```typescript
// lib/cache/config.ts
import { env } from '@/lib/env';

export const cacheConfig = {
  development: {
    provider: 'in-memory' as const,
    defaultTtl: 60, // Short TTL for development
    enableDebugLogging: true,
  },
  production: {
    provider: 'upstash' as const,
    defaultTtl: 3600,
    enableDebugLogging: false,
  },
  test: {
    provider: 'in-memory' as const,
    defaultTtl: 1, // Very short TTL for tests
    enableDebugLogging: false,
  },
};

export const currentConfig =
  cacheConfig[env.NODE_ENV] || cacheConfig.development;
```

## Validation

### Environment Validation

The cache system validates environment variables on startup:

```typescript
// lib/env.ts
const envSchema = z.object({
  // ... other fields ...

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
```

### Provider Validation

Each provider validates its configuration:

```typescript
// Upstash provider validation
constructor() {
  if (!env.REDIS_REST_URL || !env.REDIS_REST_TOKEN) {
    throw new Error(
      'Upstash Redis configuration missing. Set REDIS_REST_URL and REDIS_REST_TOKEN'
    );
  }
  // ... rest of constructor
}
```

## Testing Configuration

### Test Environment Setup

For testing, use the in-memory provider with short TTL:

```bash
# .env.test
CACHE_PROVIDER=in-memory
CACHE_DEFAULT_TTL=1
```

### Test Configuration

```typescript
// tests/cache/test-setup.ts
import { cacheService } from '@/lib/cache';

export async function setupCacheForTesting() {
  await cacheService.initialize();
  await cacheService.clear(); // Start with clean cache
}

export async function teardownCacheForTesting() {
  await cacheService.clear();
  await cacheService.disconnect();
}
```

## Monitoring Configuration

### Cache Statistics

Enable cache statistics collection:

```typescript
// lib/cache/monitoring.ts
export async function getCacheHealth() {
  const stats = await cacheService.getStats();

  return {
    isHealthy: stats.hitRate > 0.5, // 50% hit rate threshold
    hitRate: stats.hitRate,
    totalKeys: stats.keys,
    totalRequests: stats.hits + stats.misses,
  };
}
```

### Logging Configuration

Configure cache logging levels:

```typescript
// lib/logger/cache-logger.ts
export const cacheLogger = {
  debug: (message: string, data?: any) => {
    if (env.LOG_LEVEL === 'debug') {
      console.log(`[CACHE DEBUG] ${message}`, data);
    }
  },
  info: (message: string, data?: any) => {
    console.log(`[CACHE INFO] ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`[CACHE ERROR] ${message}`, error);
  },
};
```

## Security Configuration

### Upstash Security

1. **Use Environment Variables**
   - Never commit credentials to version control
   - Use different credentials for each environment

2. **IP Restrictions**
   - Configure IP allowlist in Upstash console
   - Restrict access to your application servers

3. **Token Rotation**
   - Regularly rotate Upstash tokens
   - Use separate tokens for different environments

### Cache Key Security

```typescript
// lib/cache/security.ts
export function sanitizeCacheKey(key: string): string {
  // Remove or escape special characters
  return key.replace(/[^a-zA-Z0-9:_-]/g, '_');
}

export function validateCacheKey(key: string): boolean {
  // Validate key format
  const validPattern = /^[a-zA-Z0-9:_-]+$/;
  return validPattern.test(key) && key.length <= 250;
}
```

## Performance Tuning

### TTL Optimization

Optimize TTL based on your data patterns:

```typescript
// lib/cache/ttl-optimizer.ts
export function getOptimalTTL(
  dataType: string,
  accessPattern: 'frequent' | 'rare'
): number {
  const baseTTL = {
    user: 1800, // 30 minutes
    product: 3600, // 1 hour
    session: 7200, // 2 hours
  };

  const multiplier = accessPattern === 'frequent' ? 1.5 : 0.5;
  return Math.floor(baseTTL[dataType] * multiplier);
}
```

### Memory Management

For in-memory provider, monitor memory usage:

```typescript
// lib/cache/memory-monitor.ts
export function monitorMemoryUsage() {
  const stats = await cacheService.getStats();

  if (stats.keys > 10000) {
    console.warn('Cache size is large, consider cleanup');
    // Trigger cleanup or switch to Upstash
  }
}
```

## Troubleshooting Configuration

### Common Configuration Issues

1. **Missing Environment Variables**

   ```bash
   # Check if variables are set
   echo $CACHE_PROVIDER
   echo $REDIS_REST_URL
   ```

2. **Invalid TTL Values**

   ```typescript
   // Ensure TTL is positive number
   const ttl = parseInt(process.env.CACHE_DEFAULT_TTL || '3600', 10);
   if (isNaN(ttl) || ttl <= 0) {
     throw new Error('Invalid CACHE_DEFAULT_TTL value');
   }
   ```

3. **Upstash Connection Issues**

   ```typescript
   // Test connection
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

## Migration Guide

### Switching Providers

To switch from in-memory to Upstash:

1. **Set up Upstash**
   - Create Upstash account and database
   - Get credentials

2. **Update Environment**

   ```bash
   CACHE_PROVIDER=upstash
   REDIS_REST_URL=https://your-instance.upstash.io
   REDIS_REST_TOKEN=your-token
   ```

3. **Deploy and Test**
   - Deploy with new configuration
   - Monitor cache performance
   - Verify cache operations work correctly

### Backward Compatibility

The cache system maintains backward compatibility:

- Default provider is in-memory
- Default TTL is 3600 seconds
- All existing cache operations continue to work
- No breaking changes to the API

---

**Last Updated**: 2025-01-30  
**Status**: ✅ Complete
