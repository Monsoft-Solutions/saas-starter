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
