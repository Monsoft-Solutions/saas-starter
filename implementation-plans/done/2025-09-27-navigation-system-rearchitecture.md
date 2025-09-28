# Navigation System Re-architecture Plan

**Created:** 2025-09-27  
**Project:** Next.js SaaS Starter  
**Focus:** Split marketing vs. app navigation, remove the `(dashboard)` grouping, and introduce a configurable page map for future apps

---

## 1. Current Pain Points

1. Marketing and product routes live under the same group, so the public home lives in `app/(dashboard)/page.tsx#L1` while authenticated screens sit in `app/(dashboard)/dashboard/*`; this makes it hard to reason about what is public vs. protected.
2. Navigation is hard-coded in multiple places (`components/layout/sidebar-nav.tsx#L11` and `components/layout/command-palette.tsx#L10`), so adding a page or renaming a slug requires touching several files.
3. Auth flows assume `/dashboard` as the default landing (`app/(login)/login.tsx#L24`), and the middleware guards that single prefix (`middleware.ts#L5`), both of which block renaming the app shell.
4. Layout chrome mixes public and app concerns (`app/(dashboard)/layout.tsx#L34` shows pricing/CTA for anonymous users), forcing every new project to rethink header behavior.

---

## 2. Goals

- Provide a clean directory split: `/(public)` for unauthenticated marketing pages and `/(app)` for the authenticated product space.
- Centralize navigation metadata (labels, paths, icons, visibility rules) for both surfaces so headers, sidebars, and the command palette share one source.
- Make the “app” root slug configurable (`/app`, `/workspace`, etc.) with minimal code churn when cloning the starter.
- Ensure auth redirects, middleware protection, and analytics all key off the new navigation config.
- Document the pattern so new teams can add or hide pages without spelunking through components.

---

## 3. Implementation Phases

### Phase A – Route Architecture Realignment (1 day)

- Create `app/(public)` and move marketing screens (`page.tsx`, `pricing`, future resources) under it; add a dedicated marketing layout with the CTA header.
- Create `app/(app)` and move the product shell (`dashboard/*`, shared layout) under a new slug such as `/app`. Mirror existing folder structure (`settings`, `activity`, etc.), updating exports accordingly.
- Update the root layout to point `/` to the marketing home and `/app` (or chosen slug) to the product dashboard. Add explicit route handlers for redirects if needed.
- Refactor shared components or utilities that import from `(dashboard)` paths to the new locations.

### Phase B – Navigation Schema & Config (0.5 day)

- Introduce `config/navigation.ts` exporting typed navigation trees, e.g., `marketingNav`, `appNav`, `quickActions`.
- Define TypeScript types for nav items (slug, label, description, icon, roles/scopes, optional external flag) so downstream consumers can enforce completeness.
- Provide helpers such as `resolveRoute('app.settings.general')` to keep links variable-driven and centralize slug changes.

### Phase C – Layout Integration (1.5 days)

- Update the marketing header/footer to render from `marketingNav`, supporting hierarchical sections and feature flags.
- Rewrite the app sidebar (`components/layout/sidebar-nav.tsx`) to consume `appNav`, supporting icons, section headings, and collapsing behavior without inline arrays.
- Migrate the command palette to pull from the shared config, including marketing shortcuts when unauthenticated.
- Ensure the top header (`app/(app)/layout.tsx`) uses the shared config for profile menu CTAs (pricing link, support link) rather than hard-coded URLs.

### Phase D – Auth & Routing Glue (1 day)

- Update social sign-in callbacks and post-auth redirects to use the configurable app entry point (`app/(login)/login.tsx#L24` et al.).
- Rework middleware protection to rely on the nav config (e.g., `protectedPrefixes` derived from `appNav`) instead of the literal `/dashboard` (`middleware.ts#L5`).
- Adjust server actions, API routes, and SWR keys referencing `/dashboard` to the new slug.

### Phase E – Documentation, Samples & QA (0.5 day)

- Write a short guide in `docs-dev/navigation.md` describing how to add pages, toggle visibility, and change the app slug.

---

## 4. Definition of Done

- ✅ Marketing pages live under `/(public)` with their own layout; app screens load from `/(app)` under a configurable root path.
- ✅ Navigation metadata is centralized and powers header links, sidebar, and command palette without duplicated arrays.
- ✅ Auth flows and middleware respect the new app slug and redirect correctly for anonymous users.
- ✅ Documentation and inline comments explain how to add new public or app pages in future projects.

---

## 5. Risks & Mitigations

- **Link regressions** from moving files — add type-safe helpers and run a global search for `/dashboard`.
- **Auth redirect loops** — verify middleware treats marketing routes as public and tests the new slug end-to-end.
- **Team adoption friction** — keep the navigation schema simple (plain objects) and document common recipes.

---

## 6. Suggested Timeline

| Phase                  | Duration | Owner    |
| ---------------------- | -------- | -------- |
| A – Route realignment  | 1 day    | Frontend |
| B – Navigation config  | 0.5 day  | Frontend |
| C – Layout integration | 1.5 days | Frontend |
| D – Auth & glue        | 1 day    | Frontend |
| E – Docs & QA          | 0.5 day  | Frontend |

Total: **~4.5 days**

---

## 7. Follow-ups

- Generate sitemap/robots from the navigation config to keep marketing SEO aligned.
- Consider exposing the nav schema to Contentful/MDX so marketing can add pages without code.
- Explore role-based filtering (e.g., admin-only sections) once permissions are modeled.
