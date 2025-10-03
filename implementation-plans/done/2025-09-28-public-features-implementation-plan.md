# Public Features Marketing Area Implementation Plan

## Executive Summary

Create a dedicated marketing "Features" area that showcases each pillar of the SaaS starter, backed by existing documentation. Deliver a `/features` landing page that spotlights all feature categories, add individual feature detail pages powered by a reusable component, and wire navigation so prospects can drill into the areas most relevant to them while staying aligned with the design system and content strategy.

## Technical Analysis

- **Current UI**: `app/(public)/page.tsx` already presents a shallow features grid; there is no dedicated `/features` route nor reusable components for deeper storytelling.
- **Design System**: Tailwind tokens defined in `app/globals.css` using `@theme` directive plus shadcn/ui primitives (e.g., `Button`, `Badge`, `Card`). `cn` helper located at `@/lib/utils` for class composition.
- **Content Sources**: VitePress docs under `docs/` contain rich feature narratives (`docs/auth`, `docs/stripe`, `docs/design-system.md`, `docs/emails.md`, `docs/unit-testing.md`, etc.) that will feed marketing copy and deep links.
- **Navigation**: `config/navigation.ts` drives marketing header links; no entry for features yet. Public layout uses `PublicHeader` + `PublicFooter`.
- **Infrastructure**: Next.js 15 App Router with turbopack dev, TypeScript strict typing, lucide-react icons already available.
- **Testing & Tooling**: Commands `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm verify:design-tokens` (if tokens touched). No automated UI tests currently in scope for marketing pages.

## Dependencies & Prerequisites

- Confirm relevant doc pages are up to date and cover the intended features; obtain product team approval for marketing summaries derived from the docs.
- No new npm packages required; rely on existing `lucide-react`, shadcn/ui components, and design tokens.
- Ensure marketing navigation strategy allows adding one more primary item without breaking layout (header spacing on mobile/desktop).

## Architecture Overview

- **Routing**: Introduce `/features` (index) and `/features/[slug]` (detail) routes beneath `app/(public)/features`. Detail routes will use static metadata sourced from a centralized feature registry.
- **Data Layer**: Create `lib/marketing/features.data.ts` exporting typed `FeatureDefinition[]` capturing slug, label, summary, doc links, hero media metadata (icon, gradient variant), and highlight bullets derived from docs.
- **Presentation Components**:
  - `FeatureCard` (grid usage) and `FeatureDetail` (detail template) components under `components/marketing/features/` consuming the shared type.
  - Reuse design tokens and shadcn/ui primitives for consistent styling, ensuring responsive layouts follow the Notion-inspired spacing.
- **Content Linking**: Each feature detail page links back to the relevant doc(s) using canonical URLs (`/docs/...` in marketing site or external VitePress deployment once known), plus contextual CTA (e.g., "Read Auth Guide").
- **Navigation Integration**: Update `marketingNav` to include `marketing.features` entry and ensure header renders dropdown-friendly grouping if needed.

## Implementation Phases

### Phase 1 – Content Inventory & Alignment

- **Objective**: Map documentation assets to marketing-ready feature summaries.
- **Deliverables**: JSON outline of feature categories (Auth, Stripe, Design System, Emails, Testing, etc.) with proposed slugs, headlines, 2–3 highlight bullets, and primary doc links.
- **Effort**: Medium (collaboration with content owner).
- **Dependencies**: Access to docs; product approval on messaging.
- **Validation**: Stakeholder sign-off; confirm every highlight is documented in `docs/`.

### Phase 2 – Feature Data Model & Registry

- **Objective**: Define TypeScript contracts and central data source for feature metadata.
- **Deliverables**: `FeatureDefinition` type, `FEATURES` array in `lib/marketing/features.data.ts`, helper selectors (`getFeatureBySlug`, `sortedFeatures`).
- **Effort**: Small.
- **Dependencies**: Phase 1 signed-off content.
- **Validation**: `pnpm type-check`; optional unit test covering helper functions (e.g., ensure slug lookups throw helpful errors).

### Phase 3 – Reusable Feature Components

- **Objective**: Build UI primitives for listing and rendering feature content.
- **Deliverables**: `FeatureCard.component.tsx` for grid usage, `FeatureDetail.component.tsx` consuming `FeatureDefinition`, plus supporting types/props docs.
- **Effort**: Medium.
- **Dependencies**: Phase 2 data model.
- **Validation**: Story-driven manual QA; ensure dark mode compliance and mobile responsiveness; run `pnpm lint` & `pnpm type-check`.

### Phase 4 – `/features` Landing Page

- **Objective**: Implement features index route with hero, filters (if required), and feature grid using new components.
- **Deliverables**: `app/(public)/features/page.tsx`, metadata export, SEO-friendly copy referencing docs, calls-to-action linking to detail pages.
- **Effort**: Medium.
- **Dependencies**: Phase 3 components ready.
- **Validation**: Manual QA on desktop/mobile; confirm navigation link works; run regression on existing homepage features section (consider refactoring to reuse cards or referencing `/features`).

### Phase 5 – Feature Detail Pages & Navigation Integration

- **Objective**: Deliver `/features/[slug]` pages and update navigation/footer links.
- **Deliverables**: Route template using `generateStaticParams`, dynamic metadata for Open Graph, breadcrumbs back to `/features`, updated `config/navigation.ts` (new `marketing.features` item), and footer link group updates if needed.
- **Effort**: Medium.
- **Dependencies**: Phase 4 index route.
- **Validation**: `pnpm lint`, `pnpm type-check`; manual smoke test per slug; confirm 404 behavior for invalid slugs; ensure nav renders gracefully on small screens.

### Phase 6 – Polish, Docs, and Regression Testing

- **Objective**: Finalize UX polish and document component usage.
- **Deliverables**: Section in `docs/navigation.md` or `README.md` describing new marketing routes, usage notes for `FeatureDetail`, optional screenshot assets; update homepage features grid to reference registry if approved.
- **Effort**: Small.
- **Dependencies**: Phases 1–5 complete.
- **Validation**: Run `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build`; cross-browser spot check if possible.

## Folder Structure

```
app/
  (public)/
    features/
      page.tsx
      [slug]/page.tsx
components/
  marketing/
    features/
      feature-card.component.tsx
      feature-detail.component.tsx
lib/
  marketing/
    features.data.ts
    features.type.ts
```

(Actual filenames should respect existing conventions; adjust if an equivalent directory naming is preferred.)

## Configuration Changes

- Update `config/navigation.ts` to add the `marketing.features` item and ensure any navigation helpers (e.g., quick actions, header menus) map to `/features`.
- If the docs site URL differs between local and production, add a configuration constant (e.g., `MARKETING_DOCS_BASE_URL`) to avoid hardcoding links.

## Risk Assessment

- **Content Drift**: Marketing copy may diverge from technical docs as features evolve. Mitigate with shared data source and periodic reviews.
- **Navigation Clutter**: Adding a new top-level link could crowd the header on smaller viewports. Prototype responsive layout before launch and consider grouping under a dropdown if necessary.
- **SEO Duplication**: Overlap between homepage summaries and `/features` content could create duplicate messaging. Ensure unique hero copy and canonical tags.
- **Maintenance Overhead**: Each new feature requires updating registry plus docs; document workflow to keep them in sync.

## Success Metrics

- `/features` page hits increase time-on-page vs. current homepage features section (analytics goal).
- Each feature detail page links to at least one authoritative doc and includes clear CTA (demo, docs, contact).
- No TypeScript or lint errors; dark mode and mobile layouts pass manual QA.
- Navigation header retains visual balance across breakpoints.

## References

- Project design tokens: `docs/design-system.md`
- Authentication docs: `docs/auth/index.md`
- Stripe integration docs: `docs/stripe/index.md`
- Email system docs: `docs/emails.md`
- Testing strategy: `docs/unit-testing.md`
- Navigation guide: `docs/navigation.md`
