# Implementation Plan: Server Authorization & Data Request Standardization

- **Date**: 2025-09-28
- **Author**: AI Assistant

## 1. Executive Summary

Define a shared authorization and data access framework for the SaaS starter so every server entry point (middleware, route handlers, server actions, queries) consumes a single source of truth for session, organization, and response handling. The initiative removes duplicated BetterAuth calls, ensures consistent error contracts for API consumers, and prepares the codebase for additional protected routes without ad-hoc checks.

## 2. Technical Analysis

- `middleware.ts` duplicates authorization branches for UI and API routes, relies on hard-coded prefix arrays, and queries BetterAuth directly instead of delegating to reusable helpers.
- `lib/auth/middleware.ts` exposes `validatedAction*` utilities that open new BetterAuth sessions per call and mix redirect and JSON behaviours. There is no shared guard for server actions or API handlers.
- Query helpers (`lib/db/queries/user.query.ts`, `lib/db/queries/organization.query.ts`) and Stripe utilities repeatedly call `auth.api.getSession({ headers: await headers() })`, each re-hydrating Next headers and duplicating fallbacks for the active organization.
- API routes (`app/api/organization/subscription/route.ts`, `app/api/user/route.ts`) rely on middleware for auth enforcement but do not guarantee runtime checks; they lack consistent error envelopes.
- Client hooks like `lib/hooks/use-organization-subscription.hook.ts` expect JSON payloads without a shared response schema, leading to brittle fetchers.

## 3. Dependencies & Prerequisites

- Next.js 15.5+ middlewares and Route Handlers; ensure project stays on Node.js runtime (`middleware.ts` config already enforces `runtime: 'nodejs'`).
- BetterAuth 1.3.18 configuration in `lib/auth.ts` including organization plugin.
- Drizzle ORM schemas for organizations, members, users; Stripe integration (no schema migrations anticipated).
- Confirm environment variables: `BETTER_AUTH_URL`, `STRIPE_SECRET_KEY`, `BASE_URL`, OAuth credentials already wired.
- Unit testing via Vitest and integration smoke tests via Next.js app routes.

## 4. Architecture Overview

1. **Server Auth Context (`lib/auth/server-context.ts`)**
   - Expose `getServerSession`, `requireServerSession`, and `getServerContext` helpers that cache BetterAuth calls per request.
   - Provide typed `ServerContext` containing user, active organization metadata, and standard redirect/response helpers.

2. **Route Guard Registry (`lib/auth/route-guards.ts`)**
   - Central map describing protected UI prefixes, API routes, and required scopes (e.g. `authRequired`, `organizationRequired`).
   - Support pattern matching (`/api/organization/*`) instead of manual arrays.

3. **API Handler Wrappers (`lib/server/api-handler.ts`)**
   - Higher-order utilities `withApiAuth`, `withOrganization`, `createApiHandler` that compose context injection, error handling, and JSON responses.
   - Export typed `ApiResponse<T>` + `ApiError` union from `lib/http/response.ts` to unify payload shape.

4. **Server Action & Query Helpers**
   - Update `lib/auth/middleware.ts` to consume `ServerContext` and expose `validatedAction`, `validatedActionWithContext`, `withOrganization` wrappers that never duplicate BetterAuth calls.
   - Queries leverage `requireServerContext` for headers/session reuse; caching ensures one BetterAuth round-trip per request.

5. **Client Data Access (`lib/api/client.ts`)**
   - Shared fetcher that understands `ApiResponse<T>` envelopes for SWR/React Query. Hooks consume typed responses and centralized error parsing.

6. **Observability & Error Reporting**
   - Use structured logging for denied requests (via `console.warn` or future logger) to help monitor unauthorized attempts.

## 5. Implementation Phases

### Phase 1: Establish Server Auth Context

- **Objective**: Introduce reusable helpers for session, headers, and organization retrieval.
- **Deliverables**:
  - `lib/auth/server-context.ts` with `getServerSession`, `requireServerSession`, `getServerContext`, `requireOrganizationContext`.
  - Memoization strategy (WeakMap keyed by request headers) to avoid multiple BetterAuth calls per request lifecycle.
  - Updated query helpers (`lib/db/queries/user.query.ts`, `lib/db/queries/organization.query.ts`) consuming the new context.
- **Effort**: Medium (1-2 dev days).
- **Dependencies**: None; foundational.
- **Testing**: Unit tests covering context caching; regression tests for `getActiveOrganization` behavior.

### Phase 2: Centralize Route Guard Rules & Middleware

- **Objective**: Replace bespoke middleware logic with guard registry + shared context.
- **Deliverables**:
  - `lib/auth/route-guards.ts` describing UI and API route policies (protected prefixes, public exceptions, optional role checks).
  - Refactored `middleware.ts` using the registry, retrieving a shared session via `getServerSession` (through Next middleware compatible helper), returning consistent redirects/JSON 401.
  - Configuration for bypassing static assets and health probes; ensure API error responses follow `ApiError` contract.
- **Effort**: Medium.
- **Dependencies**: Phase 1 helpers.
- **Testing**: Playwright/Next middleware harness tests (or manual) verifying redirects for `/app/*` unauthenticated, JSON 401 for `/api/organization/*`.

### Phase 3: API Handler Wrapper Adoption

- **Objective**: Ensure every API route enforces auth guard server-side and returns typed responses.
- **Deliverables**:
  - `lib/server/api-handler.ts` (or similar) implementing `withApiAuth`, `withOrganization`, `createApiHandler`.
  - `lib/http/response.ts` exporting `ok`, `created`, `noContent`, `error` helpers and shared response types.
  - Refactored routes: `app/api/organization/subscription/route.ts`, `app/api/user/route.ts`, Stripe endpoints to use wrappers with explicit error handling.
  - Replace ad-hoc `console.error` with structured logging and propagate `ApiError` on failure.
- **Effort**: Medium.
- **Dependencies**: Phase 1 & 2 for context and guard definitions.
- **Testing**: Vitest unit tests for handler wrappers; integration tests hitting API routes with authorized/unauthorized scenarios.

### Phase 4: Server Actions & Hooks Standardization

- **Objective**: Align server actions, Stripe helpers, and client hooks with the unified context and response schema.
- **Deliverables**:
  - Update `lib/auth/middleware.ts` wrappers to use `ServerContext`, eliminating duplicate header/sessions and ensuring consistent error messaging.
  - Refactor `lib/payments/stripe.ts` to depend on `requireServerContext` for user/session data when redirect paths are needed.
  - Introduce `lib/api/client.ts` fetcher that parses `ApiResponse<T>`; update `useOrganizationSubscription` and future hooks to depend on it.
  - Document usage patterns for server actions and client hooks (e.g., in `docs-dev/auth/` or new ADR).
- **Effort**: Medium-High (2 dev days) due to touch points.
- **Dependencies**: Phases 1-3 completed.
- **Testing**: Re-run Vitest suites; smoke test subscription/billing flows in staging.

### Phase 5: Hardening & Rollout

- **Objective**: Ensure reliability, documentation, and migration completeness.
- **Deliverables**:
  - Update lint rules or codemods (optional) to flag direct BetterAuth session calls outside helpers.
  - Knowledge base entry summarizing the standardized authorization flow.
- **Effort**: Low.
- **Dependencies**: Prior phases.
- **Testing**: Final regression pass on auth-critical journeys; review logs for unexpected denials.

## 6. Folder Structure

```
lib/
├── auth/
│   ├── server-context.ts      # New shared session & organization helpers
│   ├── route-guards.ts        # Guard registry consumed by middleware & wrappers
│   └── middleware.ts          # Updated to delegate to server context
├── http/
│   └── response.ts            # Standard ApiResponse helpers
├── server/
│   └── api-handler.ts         # Higher-order API handler utilities
├── api/
│   └── client.ts              # Shared client-side fetcher for SWR/React
```

Existing query and Stripe files will be updated in place to consume the new helpers.

## 7. Configuration Changes

- Update `middleware.ts` matcher rules only if new public paths emerge; otherwise rely on guard registry.
- No expected changes to `next.config.ts`, `tsconfig.json`, or environment files.
- Consider extending ESLint config to forbid direct `auth.api.getSession` imports outside `lib/auth/server-context.ts` (optional lint rule).

## 8. Risk Assessment

- **Double Session Fetching**: Incorrect memoization could trigger multiple BetterAuth calls; mitigate with request-scoped caching and tests.
- **Middleware Runtime Constraints**: Next middleware runs on the edge by default; ensure `runtime: 'nodejs'` remains or adapt helpers for edge compatibility.
- **Backwards Compatibility**: Existing clients/hooks expect raw JSON; ensure wrappers preserve field names and return null-safe defaults.
- **Stripe Flows**: Refactoring `lib/payments/stripe.ts` must preserve redirects and error handling to avoid breaking checkout.
- **Developer Adoption**: Without documentation/enforcement, new endpoints might bypass helpers; mitigate via lint rule and code review checklist.

## 9. Success Metrics

- 100% of server routes and actions use `ServerContext` helpers (audited via lint or static analysis).
- Unauthorized requests to `/app/*` return redirects; `/api/*` return structured 401 with `error`, `details` fields.
- Reduction of duplicated `auth.api.getSession` calls verified through search (expect zero occurrences outside helpers).
- Client hooks rely on shared `ApiResponse` fetcher; error handling consistent across dashboards.

## 10. References

- Next.js Middleware documentation: https://nextjs.org/docs/app/building-your-application/routing/middleware
- Next.js Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- BetterAuth server API: https://www.better-auth.com/docs/server
- Stripe Billing best practices: https://stripe.com/docs/billing/subscriptions/overview
- SWR data fetching patterns: https://swr.vercel.app/docs/getting-started
