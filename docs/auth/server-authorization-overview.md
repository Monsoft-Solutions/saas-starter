# Server Authorization Overview

This knowledge base entry documents the unified authorization flow introduced during the 2025-09-28 standardization effort. Every server entry point—middleware, route handlers, server actions, RSC-only queries, and background jobs—now relies on a shared set of helpers that guarantee consistent session hydration, organization resolution, and error behaviour.

## Core Building Blocks

1. **Server context helpers** (`@/lib/auth/server-context`)
   - `getServerSession()` / `requireServerSession()` provide cached BetterAuth session access anywhere on the server without rehydrating headers manually.
   - `getServerContext()` / `requireServerContext()` return the normalized session, user, and optional organization payload.
   - `requireOrganizationContext()` narrows callers that need an active organization.
   - Helpers memoize work per `RequestHeaders` instance so multiple lookups within the same request incur a single BetterAuth round-trip.
2. **Middleware + guard registry** (`middleware.ts`, `@/lib/auth/route-guards`)
   - Guard rules declare which URL patterns require authentication or an organization.
   - Middleware pulls a session through `getServerContextFromHeaders()` to keep redirects/JSON responses consistent across UI and API routes.
3. **API handler wrappers** (`@/lib/server/api-handler`)
   - `withApiAuth` and friends wrap Route Handlers with context injection, uniform error envelopes, and structured logging.
4. **Server action utilities** (`@/lib/auth/middleware`)
   - `validatedAction*` wrappers now compose Zod validation with `requireServerContext()` so server actions never fetch BetterAuth directly.
5. **Client fetcher** (`@/lib/api/client`)
   - A shared fetch helper knows how to unwrap our standard `ApiResponse<T>` payload and surface errors to React data hooks.

## Usage Guidelines

- **Server components / pages**: call `getServerSession()` when a nullable session is acceptable or `requireServerContext()` when the route must be authenticated.
- **Server actions**: prefer `validatedAction` / `validatedActionWithContext` exports. They enforce auth and input validation before executing your handler. If you need direct access, start with `requireServerSession()` and avoid `headers()`.
- **Queries (Drizzle helpers, background jobs)**: import `requireServerContext()` to reuse the active session instead of hitting BetterAuth again.
- **Route handlers**: wrap handlers with `withApiAuth` (optionally `withOrganization`) to enforce guards and return structured JSON automatically.
- **Middleware additions**: update `@/lib/auth/route-guards` with any new URL prefixes rather than editing `middleware.ts` directly.

## Lint Guard

ESLint now enforces a `no-restricted-syntax` rule blocking `auth.api.getSession(...)` outside `@/lib/auth/server-context`. Violations surface the message:

> Direct auth.api.getSession() calls are forbidden. Use helpers from @/lib/auth/server-context instead.

This ensures new code paths adopt the shared helpers. If a rare exception is required, implement the helper inside `server-context.ts` and export a purpose-built function.

## Migration Checklist

- [ ] Replace direct BetterAuth session lookups with the helpers above.
- [ ] Ensure middleware coverage by registering new paths in `route-guards.ts`.
- [ ] Return structured `ApiResponse<T>` objects (or use the handler wrappers) from every API route.
- [ ] Confirm client hooks rely on the shared fetcher in `@/lib/api/client` for consistent error parsing.
- [ ] Add observability hooks (logs/metrics) through the wrappers instead of bespoke `console` statements.

Following this workflow keeps authentication state consistent and reduces the risk of “works in development, fails in production” regressions driven by duplicated BetterAuth session handling.
