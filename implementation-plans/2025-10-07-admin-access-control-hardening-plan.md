# Admin Access Control Hardening Implementation Plan

**Created:** October 7, 2025  
**Status:** Draft  
**Priority:** High  
**Estimated Effort:** 6-7 days  
**Complexity:** Medium-High

## Executive Summary

The initial hardening plan separated read-only admins from super admins but still relied on coarse role checks. We now need a **granular permission system** that maps explicit capabilities to roles and resources. This plan introduces typed permissions, centralized role→permission maps, enhanced server helpers, permission-aware middleware, and UI affordances so new roles or permissions can be added without code rewrites. Admins retain read-only visibility while super admins keep full control; additional roles can be configured declaratively.

## Technical Analysis

### Current State

- **Auth stack:** Better Auth `admin` plugin with roles `user`, `admin`, `super-admin` configured in `lib/auth.ts`.
- **Server authorization:** `requireSuperAdminContext()` treats `admin` and `super-admin` equally via `isUserAdmin()`; no granular permissions.
- **Middleware & route guards:** `/admin` and `/api/admin` routes marked `superAdminRequired`, but the guard uses role checks only.
- **APIs & server actions:** Mutations and reads share the same `requireSuperAdminContext()` / `withSuperAdmin()` wrappers; admins can mutate data.
- **Client UI:** Tables, dialogs, and quick actions expose destructive options regardless of viewer role.
- **Documentation/tests:** Expectation that super-admin-only access exists, but enforcement is inconsistent.

### Gaps & Limitations

1. **No resource-based permissions:** Cannot express `organizations:write` vs `analytics:read`.
2. **Hard-coded behavior:** Adding a new role requires touching helpers, middleware, actions, UI, and tests.
3. **Limited observability:** Logs don’t capture granted permissions per action.
4. **Poor UX for read-only admins:** They see enabled buttons that will fail.

## Dependencies & Prerequisites

- Better Auth admin plugin remains canonical source for role claims.
- `lib/types/admin/user-role.enum.ts` keeps role strings in sync with Better Auth configuration.
- Ensure caching helpers in `lib/auth/server-context.ts` support additional context properties.
- No database migrations expected.

## Architecture Overview

1. **Permission Schema & Utilities**
   - Define `PERMISSIONS` enum (e.g., `users:read`, `users:write`, `analytics:read`).
   - Create typed helpers (`Permission`, `PermissionSet`) and role→permission mapping.
   - Provide functions `getRolePermissions(role)` and `hasPermission(permissions, required)` with memoization for performance.

2. **Admin Context Refactor**
   - Split contexts into `AdminContext` (admins & super admins) and `SuperAdminContext` (super only).
   - Each context includes `role`, `permissions`, and convenience booleans (`isSuperAdmin`, `canEditUsers`, etc.) generated from the permission set.

3. **Middleware & Route Guards**
   - Update guard registry to include `requiredPermissions?: Permission[]`.
   - Middleware resolves session, derives permissions, and enforces guard requirements (e.g., `/admin` requires `analytics:read`; `/api/admin/users` GET requires `users:read`).
   - Provide tailored responses: 401 for anonymous, 403 with clear messaging for insufficient permissions.

4. **Server Actions & API Enforcement**
   - Replace `withSuperAdmin()` with generic `withPermission()` and `withPermissions()` wrappers supporting stateful actions.
   - Update API handlers: GET endpoints use `requireAdminContext()`; mutating verbs require explicit permissions (e.g., `users:write`).
   - Introduce conditional enforcement (e.g., `/api/admin/stats?refresh=true` needs `analytics:write`).

5. **Client Permission Awareness**
   - Add an `AdminAccessProvider` (React context) that supplies `role`, `permissions`, `canEdit*` helpers to children.
   - Create hooks `useHasPermission`, `useHasAnyPermission` for component-level checks.
   - Update UI components to disable/hide actions lacking permission, show tooltips/toasts for read-only admins, and render badges indicating read-only state.

6. **Auditing & Telemetry Enhancements**
   - Extend activity logging to include `actorRole` and `grantedPermissions` for super-admin actions.
   - Add structured logging for permission denial events to spot misconfigurations.

## Implementation Phases

### Phase 1 – Permission Schema & Role Mapping (DONE)

- **Objective:** Establish typed permission primitives and role→permission configuration.
- **Deliverables:**
  - `lib/types/admin/permission.enum.ts` listing all permissions.
  - `lib/types/admin/role-permission.map.ts` mapping roles to permission arrays.
  - Utility helpers (`getRolePermissions`, `hasPermission`, `hasAnyPermission`).
- **Effort:** Medium.
- **Dependencies:** None.
- **Testing & Validation:**
  - Unit tests for helpers ensuring type safety and correct membership checks.

### Phase 2 – Context & Middleware Refactor

- **Objective:** Inject permissions into server contexts and enforce guard requirements.
- **Deliverables:**
  - `lib/auth/admin-context.ts` (new) exposing `getAdminContext` / `requireAdminContext`.
  - Update `lib/auth/super-admin-context.ts` to rely on new helpers and ensure only `super-admin` passes.
  - Extend `lib/auth/route-guards.ts` to support `requiredPermissions` and update guard definitions.
  - Modify `middleware.ts` to derive permissions from the session, enforce guards, and surface informative 403 messages.
- **Effort:** Medium-High.
- **Dependencies:** Phase 1.
- **Testing & Validation:**
  - Middleware-focused unit tests (mocking NextRequest) verifying 401/403 cases.
  - Manual QA via `pnpm dev` (admin vs super admin vs regular user access to `/admin`).

### Phase 3 – Server Actions & API Enforcement

- **Objective:** Guard server mutations with permissions while preserving read-only GET access.
- **Deliverables:**
  - `lib/auth/permission-middleware.ts` (or extend existing middleware) providing `withPermission(s)` wrappers with improved error handling.
  - Update all server actions under `app/actions/admin/**` to require appropriate permissions (`users:write`, `analytics:write`, etc.).
  - Update API handlers in `app/api/admin/**`:
    - GET routes → `requireAdminContext` with relevant `requiredPermissions` (mostly `*:read`).
    - Mutating routes (PATCH/DELETE/POST) → `requireSuperAdminContext` or `requireAdminContext` + `hasPermission('...:write')` when appropriate.
    - Conditional logic (e.g., stats refresh) requiring higher permissions.
  - Ensure error payloads send 403 with context (`permission`, `resource`).
- **Effort:** Medium-High.
- **Dependencies:** Phases 1–2.
- **Testing & Validation:**
  - Handler-level unit tests covering success/denial for different roles.
  - Verify server actions return structured `{ error }` responses consumed by UI toasts.

### Phase 4 – Client Permission Awareness & UX

- **Objective:** Reflect permission state in UI and prevent forbidden actions.
- **Deliverables:**
  - `components/admin/shared/admin-access.provider.tsx` (or similar) injecting permissions into React tree.
  - Hooks `useHasPermission`, `useHasAnyPermission` in `lib/hooks`.
  - Update `AdminHeader`, navigation, quick actions, and table components to:
    - Display "Read-only admin" badge for admins lacking write permissions.
    - Hide/disable destructive buttons (`Ban`, `Delete`, `Update Role`) unless user has permission.
    - Show contextual tooltips or inline alerts explaining restrictions.
    - Handle 403 responses from fetchers gracefully (toast + no auto redirect).
- **Effort:** Medium.
- **Dependencies:** Phases 1–3.
- **Testing & Validation:**
  - React component tests verifying disabled states/hints (RTL + Vitest).
  - Manual QA verifying admin vs super admin UI differences.

### Phase 5 – Observability & Configuration Hardening

- **Objective:** Log permission decisions and ensure configuration coherence.
- **Deliverables:**
  - Update `logActivity` calls to include `actorRole` and optionally `grantedPermissions` snapshot.
  - Add warning logs if required permission not in role map (misconfiguration detection).
  - Optional: add feature flag or config guard for future roles (e.g., `billing-admin`).
- **Effort:** Low-Medium.
- **Dependencies:** Phases 1–4.
- **Testing & Validation:**
  - Unit tests/mocks ensuring log payloads contain new fields.
  - Manual review of logs in development.

### Phase 6 – Unit Testing Phase (Mandatory)

- **Objective:** Ensure ≥80% coverage of new authorization logic.
- **Deliverables:**
  - New tests for permission helpers, contexts, middleware, action wrappers, and React hooks/components.
  - Update existing auth tests (`tests/auth/super-admin-context.test.ts`) to reflect new behavior.
  - Ensure API handler tests cover allowed/denied scenarios for `admin` vs `super-admin`.
- **Effort:** Medium.
- **Dependencies:** Phases 1–5.
- **Testing & Validation:**
  - `pnpm test` and `pnpm test:coverage` achieving ≥80% coverage for modified files.
  - Document any exclusions with rationale.

### Phase 7 – Documentation Phase (Mandatory)

- **Objective:** Document the permission model and usage.
- **Deliverables:**
  - Update `docs/admin-space/security.md` and `docs/admin-space/authentication.md` with permission matrices, role definitions, and examples.
  - Add developer guide for adding new roles/permissions (`docs/admin-space/development.md`).
  - Update onboarding documentation and implementation plan history references.
- **Effort:** Low.
- **Dependencies:** All previous phases.
- **Testing & Validation:**
  - `pnpm docs:dev` to validate build.
  - Peer review for clarity and accuracy.

## Folder Structure Impact

- `lib/types/admin/permission.enum.ts`, `role-permission.map.ts` – new.
- `lib/auth/admin-context.ts`, updates to `super-admin-context.ts`, `permission-middleware.ts`.
- `lib/auth/route-guards.ts`, `middleware.ts` – revised structures.
- `app/api/admin/**`, `app/actions/admin/**` – interspersed permission checks.
- `components/admin/**`, especially `layout-client.tsx`, table components, dialogs, quick actions – permission-aware UI.
- `lib/hooks/use-permissions.hook.ts` – new hook.
- `tests/auth`, `tests/api/admin`, new component tests under `tests/components`.
- Documentation under `docs/admin-space/**`.

## Configuration Changes

- No environment variable changes.
- No new npm dependencies anticipated; leverage existing TypeScript + Zod stack.
- Ensure ESLint/Prettier configurations accommodate new files (standard defaults already cover).

## Risk Assessment

| Risk                                                       | Impact | Mitigation                                                                                                                |
| ---------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| Misconfigured role→permission map denies legitimate access | High   | Add runtime assertions + logging when required permission missing; provide integration tests for default roles.           |
| Middleware misinterprets permissions causing lockout       | High   | Comprehensive unit tests, staged QA, fallback route to `/app` with explanatory message.                                   |
| UI caches stale permission state after role change         | Medium | Expose `permissionsVersion` in context and invalidate SWR/table fetches on role updates; provide manual refresh guidance. |
| Increased complexity for developers                        | Medium | Include documentation and helper utilities to reduce boilerplate.                                                         |
| Logging sensitive data (permission lists)                  | Low    | Ensure logs avoid PII; include only role + permission identifiers.                                                        |

## Success Metrics

- Admin (non super) users can access `/admin` pages and view data without encountering mutation options.
- Super admins retain full functionality; regression tests pass.
- Attempting unauthorized mutation results in 403 with clear UX messaging and audit log entry.
- Permission additions require only updating the role→permission map + optional documentation, no code modifications.
- Vitest coverage ≥80% for updated areas; documentation reflects new permission system.

## References

- [Better Auth Admin Plugin](https://www.better-auth.com/docs/plugins/admin)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)
- Existing plan: `implementation-plans/2025-10-03-admin-space-implementation-plan.md`
- Internal docs: `docs/admin-space/security.md`, `docs/admin-space/development.md`
