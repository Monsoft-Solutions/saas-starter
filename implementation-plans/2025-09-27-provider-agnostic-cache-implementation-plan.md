# Provider-Agnostic Cache Layer Implementation Plan

## Executive Summary

This initiative introduces a provider-agnostic caching service that defaults to an in-memory adapter for local development and leverages Redis in production. The goal is to centralize caching logic behind a consistent interface, improve performance for high-read workloads (sessions, email idempotency, API responses), and lay the groundwork for future provider swaps without code churn.

## Technical Analysis

- The project is a Next.js 15 application using the App Router with TypeScript, hosted utilities under `lib/`, and server-only modules for backend logic.
- No shared cache abstraction exists today; ad hoc constructs (e.g., `lib/emails/dispatchers.ts`) use simple `Map` instances within a single process.
- Environment validation in `lib/env.ts` enforces required secrets but lacks Redis configuration entries.
- Operational tooling (logging, Drizzle/Postgres, Resend, Stripe) is present, yet observability for cache misses/hits and health checks is absent.
- Goal: introduce a reusable cache client with DI-friendly factory, environment-driven provider selection, and observability hooks aligned with existing logging/metrics conventions.

## Dependencies & Prerequisites

- Add Redis client dependency (`ioredis`) and, if desired, `lru-cache` for efficient in-memory eviction.
- Ensure local developers have Docker Desktop (or native Redis) available for integration testing.
- Update `.env.example`, `.env.local`, and deployment secrets with `REDIS_URL`, `REDIS_TLS`, `CACHE_PROVIDER`, and optional `REDIS_NAMESPACE`.
- Confirm CI environment can spin up a Redis service (e.g., via Docker service in the pipeline) for integration tests.

## Architecture Overview

- Introduce `lib/cache/` housing:
  - `cache.types.ts`: interface definitions (`CacheClient`, `CacheOptions`, `CacheMetrics`).
  - `adapters/redis.ts`: Redis implementation using `ioredis`, encapsulating connection pooling, TLS, and namespacing.
  - `adapters/memory.ts`: in-process LRU cache with TTL support for dev/test.
  - `cache.factory.ts`: resolves adapter based on `env.NODE_ENV` and `CACHE_PROVIDER`.
  - `cache.metrics.ts`: optional hooks for logging/tracing events.
- Expose a singleton cache provider per request lifecycle using a lightweight DI container or `async_local_storage` if needed.
- Consumers (session management, email dedupe, future features) depend only on the `CacheClient` interface, enabling transparent provider swaps.
- Observability: integrate with existing logging (structured logs) and prepare OpenTelemetry spans when tracing becomes available.

## Implementation Phases

### Phase 1: Requirements & Use-Case Audit

- Objective: catalogue caching use cases (sessions, email idempotency, API caching, rate limiting priming) and define SLA/TTL expectations.
- Effort & Complexity: Medium (1-2 dev-days); complexity low.
- Dependencies: stakeholder alignment.
- Testing & Validation: review checklist signed off by product/engineering leads.
- Rollback: N/A (documentation only).

### Phase 2: Define Cache Contracts & Dev Ergonomics

- Objective: design TypeScript interfaces (`CacheClient`, `CacheKey`, `CacheValue`, batch helpers) and error hierarchy.
- Effort & Complexity: Medium (2 dev-days); complexity moderate.
- Dependencies: Phase 1 output.
- Testing & Validation: unit tests for type guards and contract tests using memory adapter; lint/type-check passes.
- Rollback: revert new `lib/cache` files if contracts misalign.

### Phase 3: Implement Redis Adapter & Infrastructure Hooks

- Objective: integrate `ioredis`, connection factory, health-check, namespacing, and optional JSON serialization utilities.
- Effort & Complexity: High (3-4 dev-days); complexity high due to operational concerns.
- Dependencies: Phases 1-2, environment configuration updates.
- Testing & Validation: contract tests against dockerized Redis, health-check endpoint returning cache status, load test for basic throughput.
- Rollback: feature flag to disable Redis (fallback to memory adapter); uninstall dependency if needed.

### Phase 4: Implement In-Memory Adapter & Provider Selection

- Objective: build LRU-backed memory adapter with TTL eviction and parity with Redis contract; implement factory to select provider.
- Effort & Complexity: Medium (2 dev-days); complexity moderate.
- Dependencies: Phases 2-3.
- Testing & Validation: unit tests verifying TTL expiry, eviction, and factory selection logic; ensure Node.js hot reload compatibility.
- Rollback: revert adapter/factory module; fall back to current manual caches.

### Phase 5: Migrate Existing Consumers & Add New Entry Points

- Objective: refactor email dedupe cache, session storage, and any other ready consumers to use the new abstraction.
- Effort & Complexity: Medium (2-3 dev-days); complexity moderate.
- Dependencies: Phases 2-4 complete and released.
- Testing & Validation: regression tests for email sending flow, manual smoke testing for auth/session flows, performance baselines before/after.
- Rollback: toggle consumers back to local logic via feature flags or conditional imports.

### Phase 6: Observability, Hardening & Documentation

- Objective: add structured logs, metrics counters (hits/misses), alerting thresholds, runbooks, and developer documentation.
- Effort & Complexity: Medium (2 dev-days); complexity moderate.
- Dependencies: Phases 3-5.
- Testing & Validation: verify logs in all environments, simulate Redis outage to confirm graceful fallback, documentation review.
- Rollback: disable metrics/log enrichments if noisy; documentation adjustments only.

## Folder Structure

```
lib/
  cache/
    cache.types.ts
    cache.factory.ts
    cache.metrics.ts
    adapters/
      redis.ts
      memory.ts
    __tests__/
      cache.contract.test.ts
      redis.adapter.test.ts
```

Add supporting files (`docs/cache.md`) for operational guidance if needed.

## Configuration Changes

- Extend `lib/env.ts` schema with optional Redis fields (`REDIS_URL`, `REDIS_TLS`, `REDIS_CA_CERT`, `CACHE_PROVIDER`, `REDIS_KEY_PREFIX`).
- Update `.env.example`, `.env.local`, deployment manifests, and CI secrets.
- Add new runtime config entry (e.g., `config/cache.ts`) if consistent with existing patterns.
- Define docker-compose service (`redis:7-alpine`) for local integration testing.

## Risk Assessment

- **Redis availability:** Mitigate via connection retry strategy and circuit breaker fallback to in-memory adapter.
- **Data consistency:** Ensure serialized payloads are versioned; document cache invalidation strategies.
- **Memory pressure (local adapter):** Enforce size limits and TTL; expose config knobs for testing.
- **Security:** Use TLS for managed Redis, restrict network access, and avoid storing sensitive data unless encrypted.
- **Operational visibility:** Without metrics, troubleshooting is difficult; integrate early with logging/ALERTS.

## Success Metrics

- Cache hit rate ≥ 80% for targeted endpoints after rollout.
- Reduction in average response latency for cached endpoints by ≥ 30%.
- Zero unhandled Redis connection errors during soak tests.
- Health-check endpoint returns cache status within <100ms p99.

## References

- [Redis Documentation](https://redis.io/docs/latest/)
- [ioredis Client Guide](https://github.com/luin/ioredis)
- [Node.js In-Memory LRU Cache Patterns](https://github.com/isaacs/node-lru-cache)
- [OpenTelemetry for Node.js](https://opentelemetry.io/docs/instrumentation/js/)
- [12-Factor App Config Best Practices](https://12factor.net/config)
