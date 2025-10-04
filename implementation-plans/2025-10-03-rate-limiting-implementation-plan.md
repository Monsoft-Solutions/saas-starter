# Rate Limiting Implementation Plan

**Created:** October 3, 2025
**Status:** Draft
**Priority:** High
**Estimated Effort:** 4-6 days
**Complexity:** Medium

## Executive Summary

This implementation plan outlines the development of a comprehensive rate limiting system for the SaaS application. The system will protect API endpoints from abuse, ensure fair resource usage across users and organizations, and provide flexible configuration options for different subscription tiers.

## Current State Analysis

### ✅ Existing Infrastructure

- Next.js 15 with App Router
- PostgreSQL database with Drizzle ORM
- Upstash Redis already installed (`@upstash/redis`)
- BetterAuth session management
- Organization-scoped operations
- Stripe subscription management with plan tiers
- Winston logger for monitoring
- Global middleware system (`middleware.ts`)
- Server action validation helpers
- API route handler utilities

### ❌ Missing Features

1. **Rate Limiting Infrastructure:**
   - No rate limiter service
   - No Redis-based counter storage
   - No rate limit configuration system
   - No rate limit response headers

2. **Rate Limit Rules:**
   - No per-endpoint rate limit definitions
   - No subscription-tier-based limits
   - No IP-based rate limiting
   - No user-based rate limiting
   - No organization-based rate limiting

3. **Monitoring & Observability:**
   - No rate limit violation logging
   - No rate limit metrics collection
   - No rate limit analytics dashboard

4. **Developer Experience:**
   - No rate limit testing utilities
   - No rate limit documentation
   - No rate limit error responses

## Technical Analysis

### Rate Limiting Strategy

**Multi-Layer Approach:**

1. **Layer 1: IP-Based (Anonymous Users)**
   - Protects public endpoints
   - Prevents DDoS attacks
   - Applied to unauthenticated routes

2. **Layer 2: User-Based (Authenticated Users)**
   - Applied to authenticated API endpoints
   - Based on user session
   - More generous limits than IP-based

3. **Layer 3: Organization-Based (Subscription Tiers)**
   - Applied to organization-scoped operations
   - Varies by subscription plan (Basic, Pro, Enterprise)
   - Highest limits for premium plans

4. **Layer 4: Endpoint-Specific**
   - Critical endpoints have stricter limits
   - Bulk operations have lower limits
   - Read operations have higher limits than writes

### Rate Limiting Algorithm

**Sliding Window Counter:**

- More accurate than fixed window
- Prevents boundary gaming
- Supported by Upstash Redis
- Efficient memory usage

### Tech Stack Selection

| Component     | Technology             | Rationale                                  |
| ------------- | ---------------------- | ------------------------------------------ |
| Storage       | Upstash Redis          | Already installed, serverless, low latency |
| Algorithm     | Sliding Window Counter | Accurate, fair, efficient                  |
| Configuration | TypeScript Constants   | Type-safe, version-controlled              |
| Headers       | Standard RFC 6585      | Industry standard compliance               |
| Monitoring    | Winston Logger         | Already in use, structured logging         |

## Architecture Overview

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Request Entry Point                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Global Middleware (middleware.ts)                     │ │
│  │  • Extract identifier (IP, userId, orgId)              │ │
│  │  • Determine rate limit scope                          │ │
│  │  • Invoke rate limiter service                         │ │
│  │  • Set response headers                                │ │
│  │  • Block if limit exceeded                             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Rate Limiter Service                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  checkRateLimit()                                      │ │
│  │  • Build Redis key from identifier                     │ │
│  │  • Get current count from Redis                        │ │
│  │  • Apply sliding window algorithm                      │ │
│  │  • Increment counter if allowed                        │ │
│  │  • Return limit status and metadata                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Upstash Redis                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Rate Limit Counters                                   │ │
│  │  • Key: ratelimit:{scope}:{identifier}:{endpoint}     │ │
│  │  • Value: Request count                                │ │
│  │  • TTL: Window duration                                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Rate Limit Scopes

```typescript
// Scope hierarchy (checked in order)
1. Organization + Endpoint → Organization tier limits
2. User + Endpoint → Authenticated user limits
3. IP + Endpoint → Anonymous IP limits
4. Global + Endpoint → System-wide protection
```

## Data Model

### Rate Limit Configuration

No database tables needed - configuration stored in code:

```typescript
// lib/rate-limit/rate-limit.config.ts

type RateLimitTier = 'free' | 'basic' | 'pro' | 'enterprise';
type RateLimitScope = 'ip' | 'user' | 'organization' | 'global';

interface RateLimitRule {
  endpoint: string | RegExp;
  scope: RateLimitScope;
  limits: {
    [K in RateLimitTier]?: {
      requests: number;
      window: number; // seconds
    };
  };
}
```

### Redis Data Structure

```typescript
// Key pattern
`ratelimit:{scope}:{identifier}:{endpoint}`

// Examples
`ratelimit:ip:192.168.1.1:/api/users`
`ratelimit:user:user_123:/api/organizations`
`ratelimit:org:org_456:/api/stripe/checkout`

// Value: Sorted set with timestamps
{
  score: timestamp_ms,
  member: request_id
}
```

### Response Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1635724800
Retry-After: 60
```

## Implementation Phases

### Phase 1: Core Infrastructure (Days 1-2)

#### 1.1 Redis Client Configuration

**Files to create:**

- `lib/rate-limit/redis-client.ts`

**Tasks:**

- Configure Upstash Redis client
- Add connection pooling
- Add error handling
- Add health check utility

#### 1.2 Rate Limit Configuration

**Files to create:**

- `lib/rate-limit/rate-limit.config.ts`
- `lib/types/rate-limit/rate-limit-rule.type.ts`
- `lib/types/rate-limit/rate-limit-scope.enum.ts`
- `lib/types/rate-limit/rate-limit-tier.enum.ts`

**Tasks:**

- Define rate limit tiers (free, basic, pro, enterprise)
- Define rate limit scopes (ip, user, org, global)
- Configure default limits per tier
- Configure endpoint-specific rules

**Example Configuration:**

```typescript
// Default tier limits
const DEFAULT_LIMITS = {
  free: { requests: 100, window: 3600 },
  basic: { requests: 1000, window: 3600 },
  pro: { requests: 10000, window: 3600 },
  enterprise: { requests: 100000, window: 3600 },
};

// Endpoint-specific rules
const ENDPOINT_RULES: RateLimitRule[] = [
  // Authentication endpoints (IP-based)
  {
    endpoint: /^\/api\/auth\/.*/,
    scope: 'ip',
    limits: {
      free: { requests: 10, window: 600 }, // 10 per 10 min
    },
  },

  // API endpoints (User-based)
  {
    endpoint: /^\/api\/(?!stripe|auth).*/,
    scope: 'user',
    limits: DEFAULT_LIMITS,
  },

  // Stripe checkout (Organization-based)
  {
    endpoint: '/api/stripe/checkout',
    scope: 'organization',
    limits: {
      basic: { requests: 10, window: 3600 },
      pro: { requests: 100, window: 3600 },
      enterprise: { requests: 1000, window: 3600 },
    },
  },
];
```

#### 1.3 Rate Limiter Service

**Files to create:**

- `lib/rate-limit/rate-limiter.service.ts`
- `lib/types/rate-limit/rate-limit-result.type.ts`

**Features:**

- Sliding window counter algorithm
- Redis-based counter storage
- Automatic key expiration
- Atomic increment operations
- Support for multiple scopes

**Key Functions:**

```typescript
// Core rate limiting function
async checkRateLimit(params: {
  identifier: string;
  scope: RateLimitScope;
  endpoint: string;
  tier?: RateLimitTier;
}): Promise<RateLimitResult>

// Get current limit status
async getRateLimitStatus(params: {
  identifier: string;
  scope: RateLimitScope;
  endpoint: string;
}): Promise<RateLimitStatus>

// Reset rate limit for identifier
async resetRateLimit(params: {
  identifier: string;
  scope: RateLimitScope;
  endpoint?: string;
}): Promise<void>
```

### Phase 2: Middleware Integration (Day 2)

#### 2.1 Rate Limit Middleware Helper

**Files to create:**

- `lib/rate-limit/rate-limit-middleware.ts`

**Features:**

- Extract identifier from request (IP, userId, orgId)
- Determine applicable rate limit rule
- Apply rate limit check
- Set response headers
- Return 429 response if exceeded

**Functions:**

```typescript
// Apply rate limiting to request
async applyRateLimit(
  request: NextRequest,
  context?: { userId?: string; orgId?: string }
): Promise<RateLimitCheckResult>

// Extract identifier based on scope
extractIdentifier(
  request: NextRequest,
  scope: RateLimitScope,
  context?: RateLimitContext
): string

// Find matching rate limit rule
findRateLimitRule(pathname: string): RateLimitRule | null

// Build rate limit response
buildRateLimitResponse(
  result: RateLimitResult
): NextResponse
```

#### 2.2 Global Middleware Integration

**Files to modify:**

- `middleware.ts`

**Tasks:**

- Add rate limit check before auth checks
- Extract user/org context for scoped limits
- Set rate limit headers on all responses
- Return 429 Too Many Requests when exceeded
- Log rate limit violations

**Implementation Strategy:**

```typescript
// Add to existing middleware
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip rate limiting for static assets
  if (isBypassedRoute(pathname)) {
    return NextResponse.next();
  }

  // Get user/org context if authenticated
  const context = await getRequestContext(request);

  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, context);

  if (!rateLimitResult.allowed) {
    return buildRateLimitResponse(rateLimitResult);
  }

  // Continue with existing middleware logic
  // ... (existing auth checks)

  // Add rate limit headers to response
  const response = NextResponse.next();
  setRateLimitHeaders(response, rateLimitResult);

  return response;
}
```

### Phase 3: Server Action Protection (Day 3)

#### 3.1 Rate Limit Action Wrapper

**Files to create:**

- `lib/rate-limit/rate-limit-action.ts`

**Features:**

- Rate limit wrapper for server actions
- User-scoped rate limiting
- Organization-scoped rate limiting
- Custom limit configuration per action

**Implementation:**

```typescript
// Wrapper for rate-limited server actions
function withRateLimit<T>(
  action: ServerActionFunction<T>,
  config: {
    scope: 'user' | 'organization';
    limit: number;
    window: number;
    identifier?: string;
  }
): ServerActionWrapper<T>;
```

#### 3.2 Apply to Critical Server Actions

**Files to modify:**

- `lib/payments/actions.ts` (Stripe checkout)
- `app/actions/invitations/*.action.ts` (Invitation actions)
- High-volume server actions

**Example:**

```typescript
// Protect Stripe checkout action
export const createCheckoutSessionAction = withRateLimit(
  async (formData, organization) => {
    // ... existing logic
  },
  {
    scope: 'organization',
    limit: 10,
    window: 3600,
  }
);
```

### Phase 4: Monitoring & Logging (Day 4)

#### 4.1 Rate Limit Logging

**Files to create:**

- `lib/rate-limit/rate-limit-logger.ts`

**Features:**

- Log rate limit violations
- Structured logging with Winston
- Include context (user, org, endpoint, IP)
- Severity levels (info, warn, error)

**Log Events:**

```typescript
// Rate limit exceeded
logger.warn('Rate limit exceeded', {
  scope: 'user',
  identifier: 'user_123',
  endpoint: '/api/organizations',
  limit: 1000,
  current: 1001,
  resetAt: '2025-10-03T12:00:00Z',
});

// Rate limit approaching
logger.info('Rate limit approaching threshold', {
  scope: 'organization',
  identifier: 'org_456',
  endpoint: '/api/stripe/checkout',
  limit: 100,
  current: 90,
  percentageUsed: 90,
});
```

#### 4.2 Rate Limit Metrics

**Files to create:**

- `lib/rate-limit/rate-limit-metrics.ts`

**Features:**

- Track rate limit violations
- Track requests per scope
- Track average usage per tier
- Expose metrics for monitoring

**Metrics to Track:**

```typescript
interface RateLimitMetrics {
  totalRequests: number;
  totalViolations: number;
  violationsByScope: Record<RateLimitScope, number>;
  violationsByEndpoint: Record<string, number>;
  requestsByTier: Record<RateLimitTier, number>;
}
```

#### 4.3 Admin Statistics Integration

**Files to modify:**

- `lib/db/queries/admin-statistics.query.ts` (if admin panel exists)

**Tasks:**

- Add rate limit metrics to admin dashboard
- Show top rate-limited users/orgs
- Show rate limit usage by tier

### Phase 5: Error Handling & UX (Day 5)

#### 5.1 Rate Limit Error Responses

**Files to create:**

- `lib/rate-limit/rate-limit-responses.ts`
- `lib/types/rate-limit/rate-limit-error.type.ts`

**Features:**

- Standard 429 error response
- Include retry-after header
- User-friendly error messages
- Structured error data

**Response Format:**

```typescript
{
  error: 'RateLimitExceeded',
  message: 'Too many requests. Please try again later.',
  details: {
    limit: 100,
    remaining: 0,
    reset: 1635724800,
    retryAfter: 60,
  },
}
```

#### 5.2 Client-Side Handling

**Files to create:**

- `lib/rate-limit/client-rate-limit.util.ts`

**Features:**

- Detect 429 responses
- Parse rate limit headers
- Show user-friendly messages
- Automatic retry with backoff

**Example:**

```typescript
// API client wrapper
async function fetchWithRateLimit(url: string, options?: RequestInit) {
  const response = await fetch(url, options);

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') ?? '60');
    throw new RateLimitError('Rate limit exceeded', { retryAfter });
  }

  return response;
}
```

#### 5.3 UI Components

**Files to create:**

- `components/rate-limit/rate-limit-error.component.tsx`
- `components/rate-limit/rate-limit-usage.component.tsx`

**Features:**

- Display rate limit errors
- Show usage meter for current tier
- Upgrade CTA when limit reached

### Phase 6: Testing & Documentation (Day 6)

#### 6.1 Unit Tests

**Files to create:**

- `tests/rate-limit/rate-limiter.service.test.ts`
- `tests/rate-limit/rate-limit-middleware.test.ts`

**Test Coverage:**

- Sliding window algorithm accuracy
- Redis key generation
- Scope detection
- Limit enforcement
- Header generation
- Error responses

#### 6.2 Integration Tests

**Files to create:**

- `tests/integration/rate-limit.test.ts`

**Test Scenarios:**

- IP-based rate limiting
- User-based rate limiting
- Organization-based rate limiting
- Tier-based limits
- Endpoint-specific limits
- Rate limit reset
- Concurrent requests

#### 6.3 Documentation

**Files to create:**

- `docs/rate-limiting/overview.md`
- `docs/rate-limiting/configuration.md`
- `docs/rate-limiting/testing.md`

**Files to modify:**

- `CLAUDE.md` (add rate limiting section)

**Content:**

- Architecture overview
- Configuration guide
- Response headers specification
- Error handling guide
- Testing utilities
- Troubleshooting guide

## Configuration Files

### Rate Limit Rules

```typescript
// lib/rate-limit/rate-limit.config.ts

export const RATE_LIMIT_CONFIG = {
  // Default limits per tier
  DEFAULT_LIMITS: {
    free: { requests: 100, window: 3600 },
    basic: { requests: 1000, window: 3600 },
    pro: { requests: 10000, window: 3600 },
    enterprise: { requests: 100000, window: 3600 },
  },

  // Global settings
  REDIS_KEY_PREFIX: 'ratelimit',
  VIOLATION_THRESHOLD: 0.9, // Log warning at 90% usage

  // Bypass patterns
  BYPASS_PATTERNS: [/^\/_next\/.*/, /^\/api\/auth\/session$/],
} as const;
```

### Environment Variables

```bash
# Required
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Optional
RATE_LIMIT_ENABLED=true
RATE_LIMIT_LOG_VIOLATIONS=true
```

## Performance Considerations

### Optimization Strategies

1. **Redis Connection Pooling:**
   - Reuse Redis connections
   - Configure connection limits
   - Handle reconnection gracefully

2. **Key Expiration:**
   - Automatic TTL on Redis keys
   - Window-based expiration
   - Memory-efficient storage

3. **Sliding Window Algorithm:**
   - O(log N) time complexity
   - Sorted set for efficient range queries
   - Trim old entries automatically

4. **Caching:**
   - Cache rate limit rules
   - Cache tier lookups
   - In-memory LRU for frequent checks

5. **Async Operations:**
   - Non-blocking Redis operations
   - Fire-and-forget logging
   - Background metrics collection

## Security Considerations

### Protection Layers

1. **DDoS Protection:**
   - IP-based rate limiting
   - Aggressive limits for anonymous requests
   - Automatic ban after repeated violations

2. **API Abuse Prevention:**
   - User-scoped limits
   - Organization-scoped limits
   - Endpoint-specific limits

3. **Credential Stuffing Protection:**
   - Strict limits on auth endpoints
   - Progressive delays on violations
   - Account lockout integration

4. **Data Privacy:**
   - Don't store request payloads
   - Hash sensitive identifiers
   - GDPR-compliant retention

### Bypass Prevention

- Rate limit rules enforced server-side only
- Headers are informational only
- Client cannot manipulate limits
- Redis keys signed/hashed
- Multi-layer validation

## Success Metrics

### Key Performance Indicators

1. **Protection:**
   - Zero successful DDoS attacks
   - 99.9% uptime maintained
   - Abuse attempts blocked

2. **Performance:**
   - Rate limit check < 10ms (p95)
   - Redis latency < 5ms (p95)
   - No impact on legitimate traffic

3. **Functionality:**
   - Accurate request counting
   - Fair limit distribution
   - Proper tier enforcement

4. **Usability:**
   - Clear error messages
   - Accurate retry-after headers
   - Upgrade path when limited

## Risk Assessment

### Technical Risks

| Risk                      | Probability | Impact | Mitigation                     |
| ------------------------- | ----------- | ------ | ------------------------------ |
| Redis connection failures | Medium      | High   | Failover mode, circuit breaker |
| Clock skew issues         | Low         | Medium | Use Redis server time          |
| Key collision             | Very Low    | Low    | Unique key prefixes            |
| Memory exhaustion         | Low         | Medium | TTL enforcement, monitoring    |

### Business Risks

| Risk             | Probability | Impact | Mitigation                       |
| ---------------- | ----------- | ------ | -------------------------------- |
| False positives  | Medium      | Medium | Generous limits, manual override |
| User frustration | Low         | Medium | Clear messaging, upgrade prompts |
| Revenue impact   | Low         | Low    | Tier limits align with pricing   |

## Timeline & Deliverables

**Estimated Timeline:** 4-6 days

| Phase | Duration | Deliverable              | Dependencies |
| ----- | -------- | ------------------------ | ------------ |
| 1     | 1-2 days | Core infrastructure      | None         |
| 2     | 2 days   | Middleware integration   | Phase 1      |
| 3     | 3 days   | Server action protection | Phase 1      |
| 4     | 4 days   | Monitoring & logging     | Phase 1, 2   |
| 5     | 5 days   | Error handling & UX      | Phase 1, 2   |
| 6     | 6 days   | Testing & documentation  | All phases   |

### Critical Path

```
Phase 1 (Infrastructure) → Phase 2 (Middleware) → Phase 4 (Monitoring)
                        ↓
                 Phase 3 (Actions) → Phase 5 (UX) → Phase 6 (Tests/Docs)
```

## Next Steps

1. ✅ Review and approve this implementation plan
2. ✅ Set up Upstash Redis credentials in environment
3. ✅ Implement core rate limiter service (Phase 1)
4. ✅ Integrate with middleware (Phase 2)
5. ✅ Protect server actions (Phase 3)
6. ✅ Add monitoring and logging (Phase 4)
7. ✅ Implement error handling (Phase 5)
8. ✅ Write tests and documentation (Phase 6)
9. ✅ Code review and QA
10. ✅ Gradual rollout and monitoring

## References

### Official Documentation

- [Upstash Redis](https://docs.upstash.com/redis) - Redis client documentation
- [Upstash Rate Limiting](https://upstash.com/docs/oss/sdks/ts/ratelimit/overview) - Built-in rate limiting SDK
- [RFC 6585](https://tools.ietf.org/html/rfc6585) - Additional HTTP Status Codes (429)
- [Redis Sorted Sets](https://redis.io/docs/data-types/sorted-sets/) - Data structure for sliding window
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware) - Middleware documentation

### Best Practices

- [Rate Limiting Patterns](https://konghq.com/blog/engineering/how-to-design-a-scalable-rate-limiting-algorithm)
- [DDoS Protection](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)
- [API Rate Limiting](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

## Conclusion

This implementation plan provides a comprehensive roadmap for building a **production-ready rate limiting system** using Upstash Redis and Next.js middleware. The system will:

### Key Benefits

- ✅ **DDoS Protection** - Prevents abuse and ensures system stability
- ✅ **Fair Usage** - Tier-based limits align with subscription plans
- ✅ **Flexible Configuration** - Easy to adjust limits per endpoint/tier
- ✅ **Performant** - < 10ms overhead using Redis
- ✅ **Observable** - Comprehensive logging and metrics
- ✅ **User-Friendly** - Clear error messages and upgrade paths
- ✅ **Type-Safe** - Full TypeScript support
- ✅ **Testable** - Comprehensive test coverage

### Architecture Highlights

1. **Multi-Scope Rate Limiting** - IP, User, Organization, Global
2. **Sliding Window Algorithm** - Accurate and fair
3. **Redis-Based Storage** - Fast and scalable
4. **Middleware Integration** - Automatic protection
5. **Subscription-Aware** - Tier-based limits
6. **Comprehensive Monitoring** - Logging and metrics
7. **Developer-Friendly** - Easy to configure and test

Ready to implement once approved!
