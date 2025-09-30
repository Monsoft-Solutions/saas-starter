---
title: Upstash Redis Setup
description: Complete guide to setting up Upstash Redis for production caching
---

# Upstash Redis Setup

This guide walks you through setting up Upstash Redis for production caching in your SaaS application.

## Overview

Upstash Redis is a serverless Redis service that provides:

- **Serverless**: No server management required
- **Edge-compatible**: Works with Vercel Edge Functions
- **Durable**: Data persists across deployments
- **Scalable**: Automatically scales with your usage
- **Global**: Available in multiple regions

## Prerequisites

- Upstash account (free tier available)
- Your application deployed or ready for deployment
- Environment variables configured

## Step 1: Create Upstash Account

1. **Visit Upstash**
   - Go to [upstash.com](https://upstash.com)
   - Click "Sign Up" or "Get Started"

2. **Sign Up Options**
   - Email and password
   - GitHub OAuth
   - Google OAuth

3. **Verify Email**
   - Check your email for verification link
   - Click the link to activate your account

## Step 2: Create Redis Database

### Using Web Console

1. **Access Console**
   - Log in to [console.upstash.com](https://console.upstash.com)
   - Click "Create Database"

2. **Database Configuration**

   ```
   Name: my-saas-cache
   Region: Choose closest to your users
   Type: Global (recommended for edge compatibility)
   ```

3. **Create Database**
   - Click "Create"
   - Wait for database to be provisioned (usually 1-2 minutes)

### Using CLI (Alternative)

```bash
# Install Upstash CLI
npm install -g @upstash/cli

# Login to Upstash
upstash login

# Create database
upstash redis create my-saas-cache --region us-east-1 --type global
```

## Step 3: Get Credentials

### From Web Console

1. **Access Database**
   - Click on your database name
   - Go to "Details" tab

2. **Copy Credentials**
   ```
   REST URL: https://your-instance.upstash.io
   REST Token: AX... (long token string)
   ```

### From CLI

```bash
# Get database details
upstash redis details my-saas-cache

# Output will show:
# REST URL: https://your-instance.upstash.io
# REST Token: AX...
```

## Step 4: Configure Environment Variables

### Local Development

Create `.env.local`:

```bash
# Cache Configuration
CACHE_PROVIDER=upstash
CACHE_DEFAULT_TTL=3600

# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...your-token-here
```

### Production Environment

Update your production environment variables:

```bash
# Vercel
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
vercel env add CACHE_PROVIDER

# Or via Vercel dashboard:
# Settings → Environment Variables → Add
```

### Other Platforms

#### Railway

```bash
railway variables set UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
railway variables set UPSTASH_REDIS_REST_TOKEN=AX...your-token
railway variables set CACHE_PROVIDER=upstash
```

#### Render

```bash
# Via Render dashboard:
# Environment → Add Environment Variable
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...your-token
CACHE_PROVIDER=upstash
```

#### Docker

```dockerfile
# Dockerfile
ENV CACHE_PROVIDER=upstash
ENV UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
ENV UPSTASH_REDIS_REST_TOKEN=AX...your-token
```

## Step 5: Test Connection

### Basic Connection Test

```typescript
// test-upstash-connection.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function testConnection() {
  try {
    // Test ping
    const pong = await redis.ping();
    console.log('✅ Upstash connection successful:', pong);

    // Test set/get
    await redis.set('test:connection', 'Hello Upstash!');
    const value = await redis.get('test:connection');
    console.log('✅ Test value:', value);

    // Cleanup
    await redis.del('test:connection');
    console.log('✅ Connection test completed successfully');
  } catch (error) {
    console.error('❌ Upstash connection failed:', error);
    process.exit(1);
  }
}

testConnection();
```

### Using Cache Service

```typescript
// test-cache-service.ts
import { cacheService } from '@/lib/cache';

async function testCacheService() {
  try {
    // Initialize cache service
    await cacheService.initialize();
    console.log('✅ Cache service initialized');

    // Test basic operations
    await cacheService.set('test:key', { message: 'Hello from cache!' });
    const value = await cacheService.get('test:key');
    console.log('✅ Retrieved value:', value);

    // Test statistics
    const stats = await cacheService.getStats();
    console.log('✅ Cache stats:', stats);

    // Cleanup
    await cacheService.delete('test:key');
    console.log('✅ Cache service test completed');
  } catch (error) {
    console.error('❌ Cache service test failed:', error);
  } finally {
    await cacheService.disconnect();
  }
}

testCacheService();
```

## Step 6: Deploy and Verify

### Deploy Application

```bash
# Deploy to your platform
vercel --prod
# or
railway up
# or
docker build -t my-app . && docker run -p 3000:3000 my-app
```

### Verify in Production

1. **Check Logs**

   ```bash
   # Look for cache initialization logs
   vercel logs
   # or check your platform's log viewer
   ```

2. **Test Cache Operations**

   ```typescript
   // Add to a test endpoint
   export async function GET() {
     const testKey = 'deployment:test';
     const testValue = { timestamp: Date.now(), message: 'Cache working!' };

     await cacheService.set(testKey, testValue, { ttl: 60 });
     const retrieved = await cacheService.get(testKey);

     return NextResponse.json({
       success: true,
       cached: retrieved,
       stats: await cacheService.getStats(),
     });
   }
   ```

3. **Monitor Upstash Console**
   - Check database metrics
   - Verify requests are being made
   - Monitor memory usage

## Advanced Configuration

### Database Settings

#### Memory Configuration

```bash
# In Upstash console, you can adjust:
# - Max memory usage
# - Eviction policy (LRU, LFU, etc.)
# - Persistence settings
```

#### Security Settings

```bash
# Enable IP restrictions
# Add your application's IP addresses
# Enable SSL/TLS (enabled by default)
```

### Performance Optimization

#### Connection Pooling

```typescript
// lib/cache/upstash-optimized.ts
import { Redis } from '@upstash/redis';

export class OptimizedUpstashProvider {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
      // Optimize for your use case
      retry: {
        retries: 3,
        delay: 1000,
      },
    });
  }
}
```

#### Batch Operations

```typescript
// Use pipeline for multiple operations
const pipeline = redis.pipeline();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
pipeline.set('key3', 'value3');
await pipeline.exec();
```

## Monitoring and Analytics

### Upstash Console Metrics

Monitor your database in the Upstash console:

- **Requests**: Total API requests
- **Memory Usage**: Current memory consumption
- **Hit Rate**: Cache hit percentage
- **Latency**: Average response time
- **Errors**: Failed requests

### Application Monitoring

```typescript
// lib/cache/monitoring.ts
export async function getCacheHealth() {
  const stats = await cacheService.getStats();

  return {
    provider: 'upstash',
    hitRate: stats.hitRate,
    totalKeys: stats.keys,
    totalRequests: stats.hits + stats.misses,
    isHealthy: stats.hitRate > 0.7, // 70% hit rate threshold
    lastChecked: new Date().toISOString(),
  };
}
```

### Alerting Setup

```typescript
// lib/cache/alerts.ts
export async function checkCacheHealth() {
  const health = await getCacheHealth();

  if (!health.isHealthy) {
    // Send alert to your monitoring service
    await sendAlert({
      type: 'cache_low_hit_rate',
      message: `Cache hit rate is ${(health.hitRate * 100).toFixed(2)}%`,
      data: health,
    });
  }
}
```

## Troubleshooting

### Common Issues

#### Connection Timeouts

```typescript
// Increase timeout settings
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
  timeout: 10000, // 10 seconds
});
```

#### Rate Limiting

```typescript
// Implement exponential backoff
async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      if (error.message.includes('rate limit') && attempts < maxAttempts - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempts) * 1000)
        );
        attempts++;
        continue;
      }
      throw error;
    }
  }
}
```

#### Memory Issues

```typescript
// Monitor and clean up large keys
export async function cleanupLargeKeys() {
  const stats = await cacheService.getStats();

  if (stats.keys > 10000) {
    // Implement cleanup strategy
    await cacheService.invalidatePattern('temp:*');
    await cacheService.invalidatePattern('session:*');
  }
}
```

### Debug Mode

Enable debug logging:

```bash
# Set in environment
LOG_LEVEL=debug
```

This will log all cache operations:

```
[CACHE DEBUG] Cache SET: user:123 (TTL: 3600s)
[CACHE DEBUG] Cache HIT: user:123
[CACHE DEBUG] Cache MISS: user:456
```

## Cost Optimization

### Free Tier Limits

Upstash free tier includes:

- 10,000 requests per day
- 256MB memory
- 1 database

### Usage Monitoring

```typescript
// Monitor usage to stay within limits
export async function checkUsage() {
  const stats = await cacheService.getStats();
  const dailyRequests = stats.hits + stats.misses;

  if (dailyRequests > 8000) {
    // 80% of limit
    console.warn('Approaching Upstash free tier limit');
  }
}
```

### Optimization Strategies

1. **Increase TTL**: Reduce cache misses
2. **Use Compression**: Store compressed data
3. **Batch Operations**: Reduce API calls
4. **Smart Invalidation**: Only invalidate when necessary

## Security Best Practices

### Token Security

1. **Rotate Tokens Regularly**

   ```bash
   # Generate new token in Upstash console
   # Update environment variables
   # Deploy with new token
   ```

2. **Use Different Tokens per Environment**

   ```bash
   # Development
   UPSTASH_REDIS_REST_TOKEN=dev_token_here

   # Production
   UPSTASH_REDIS_REST_TOKEN=prod_token_here
   ```

### Network Security

1. **Enable IP Restrictions**
   - Add your application server IPs
   - Restrict access to known sources

2. **Use HTTPS**
   - Upstash uses HTTPS by default
   - Verify SSL certificates

### Data Security

```typescript
// Don't cache sensitive data
const sensitiveData = {
  password: 'hashed_password',
  apiKey: 'secret_key',
  // ... other sensitive fields
};

// Only cache non-sensitive parts
const cacheableData = {
  id: sensitiveData.id,
  name: sensitiveData.name,
  email: sensitiveData.email,
  // Exclude sensitive fields
};
```

## Migration from In-Memory

### Gradual Migration

1. **Dual Provider Setup**

   ```typescript
   // Use both providers during migration
   const primaryCache = new UpstashCacheProvider();
   const fallbackCache = new InMemoryCacheProvider();
   ```

2. **Feature Flags**

   ```typescript
   const useUpstash = process.env.ENABLE_UPSTASH === 'true';
   const cache = useUpstash ? primaryCache : fallbackCache;
   ```

3. **Monitor Performance**
   - Compare hit rates
   - Monitor latency
   - Check error rates

### Complete Migration

Once confident with Upstash:

1. **Update Environment**

   ```bash
   CACHE_PROVIDER=upstash
   ```

2. **Remove In-Memory Code**

   ```typescript
   // Remove in-memory provider imports
   // Update factory to only use Upstash
   ```

3. **Deploy and Monitor**
   - Deploy with Upstash only
   - Monitor for 24-48 hours
   - Verify all functionality works

---

**Last Updated**: 2025-01-30  
**Status**: ✅ Complete
