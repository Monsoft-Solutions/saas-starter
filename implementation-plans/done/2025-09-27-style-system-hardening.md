# Style System Hardening Plan

**Created:** 2025-09-27  
**Project:** Next.js SaaS Starter  
**Focus:** Consolidate theme tokens, fix tailwind v4 usage, and standardize component styling

---

## 1. Current Pain Points

1. **Broken theme utilities** – `lib/design-system/utils/theme.ts` assumes HSL tokens (`hsl(var(--color))`), but we store raw hex values in `app/globals.css`, so every consumer gets invalid color strings.
2. **Duplicate styling utilities** – `cn` exists in both `lib/utils.ts` and `lib/design-system/utils/theme.ts`, causing drift and arbitrary import paths (`@/lib/utils` vs `@/lib/design-system`).
3. **Dark mode discrepancies** – large sections of the UI (landing, auth, error pages) hard-code Tailwind gray palette classes. They ignore our CSS variables, so the dark theme renders unreadable content.
4. **Global reset regressions** – the universal `@apply border-border outline-ring/50` in `app/globals.css` sets outlines on every element and references an `outline-ring/50` utility that Tailwind 4 does not generate. The border fallback relies on `--color-gray-200`, which we never define.
5. **Component gaps** – key shadcn/ui components (buttons, layout primitives) still point to the wrong Radix packages or mix in bespoke class stacks that ignore the token set.
6. **Unrealized design tokens** – `lib/design-system/tokens/*` defines spacing, radius, and typography scales, but nothing consumes them. Tailwind 4's `@theme` stays disconnected from the TS tokens, so adding/changing tokens requires updating code in multiple places.

---

## 2. Goals

- Align runtime (CSS) and build-time (TypeScript) design tokens so Tailwind utilities, component props, and theme helpers all reference the same source of truth.
- Restore dark/light parity across marketing, auth, and dashboard routes.
- Remove fragile global resets and replace them with targeted, accessible defaults.
- Harden the component layer (especially shadcn/ui wrappers) to rely on the design system without regressions.

---

## 3. Implementation Phases

### Phase A – Theme Foundation Repair (1 day)

- Normalize token format: convert `@theme` to expose HSL, or update helpers to read hex safely. Preferred: change helpers to return `var(--color-primary)` and provide an optional alpha helper using `color-mix` for Tailwind 4.
- Delete the redundant `@variant dark` line in `app/globals.css` and keep a single `@custom-variant`.
- Replace the global `* { @apply border-border outline-ring/50; }` block with scoped rules: set `border-color` on `:where(*)` fallback and move focus outline styling into a `.focus-visible` utility class.
- Introduce missing CSS variables (e.g., `--color-border-subtle`) if required, ensuring the TS token definitions match the CSS names exactly.
- Document the final token map in `docs-dev/design-system.md` so designers/devs know the canonical color/radius names.

### Phase B – Consolidate Utilities & Tokens (0.5 day)

- REmove duplicated `cn` helpers from `lib/utils.ts` only use the one in `lib/design-system`.
- Export typed color/spacing/radius enums from `lib/design-system/tokens` and generate matching Tailwind `@utility` shortcuts where helpful (e.g., `.stack`, `.section`).
- Add unit tests or type-only tests that ensure every token defined in TS has a sibling CSS variable (simple snapshot via `tsx`).

### Phase C – Component Refactor (1.5 days)

- Fix Radix imports (`Slot` should come from `@radix-ui/react-slot`) and remove the stray `.Slot` access in `components/ui/button.tsx`. Use `forwardRef` to match shadcn/ui defaults.
- Sweep the `components/ui` directory to align variant definitions with the repaired tokens (e.g., ensure destructive variants use `text-destructive-foreground`).
- Audit layout components (`components/layout/sidebar-nav.tsx`, `page-header.tsx`, etc.) for inconsistent spacing or color usage; replace raw Tailwind gray classes with token-driven ones.

### Phase D – Screen Audit & Retrofit (2 days)

- Marketing homepage (`app/(dashboard)/page.tsx`), pricing, auth (`app/(login)/login.tsx`), and error screens should adopt the design system tokens. Replace `text-gray-*`, `bg-white`, `border-gray-300`, etc., with semantic utilities (`text-foreground`, `bg-card`, `border-border`).
- Build a dark-mode QA checklist: screenshot before/after, test focus states, and ensure accessible contrast.
- Introduce section-level layout helpers (via `container` class replacements or custom utilities) to eliminate repeated `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` snippets.

### Phase E – Tooling & Regression Safety (0.5 day)

- Add an ESLint rule or custom lint script that flags raw Tailwind gray/white/black classes when a token equivalent exists.
- Configure Chromatic or Playwright visual snapshots for the top-level screens (light & dark). If infra is unavailable, add a manual QA checklist to `docs-dev/testing-style-guide.md`.
- Update `README.md` or the internal design doc with guidance on when to use design system helpers vs. raw Tailwind utilities.

---

## 4. Deliverables & Definition of Done

- ✅ `app/globals.css` exposes a clean, validated theme layer without universal outlines.
- ✅ `lib/design-system` exports a single `cn`, and helper functions resolve to valid CSS values.
- ✅ All shadcn/ui wrappers compile without console warnings and honor the theme tokens.
- ✅ Landing, pricing, login, dashboard, and error screens render correctly in dark/light modes.
- ✅ A lint rule or documented checklist prevents regression to hard-coded grayscale values.
- ✅ Style guide documentation updated to reflect the unified design system.

---

## 5. Risks & Mitigations

- **Regression risk in marketing pages** – use visual diff testing (or manual baseline screenshots) before and after token replacement.
- **Token rename churn** – enforce a tokens-to-CSS variable snapshot test before merging.
- **Team onboarding friction** – invest in concise documentation and examples per component category.

---

## 6. Suggested Timeline

| Phase                           | Duration | Owner         |
| ------------------------------- | -------- | ------------- |
| A – Theme foundation repair     | 1 day    | Frontend      |
| B – Utilities & tokens          | 0.5 day  | Frontend      |
| C – Component refactor          | 1.5 days | Frontend      |
| D – Screen retrofit             | 2 days   | Frontend + QA |
| E – Tooling & regression safety | 0.5 day  | Frontend      |

Total: **~5.5 days** of focused effort.

---

## 7. Follow-up Opportunities

- Evaluate adopting Tailwind CSS v4 Design Tokens (`@source`) to auto-generate TS exports, removing duplication entirely.
- Consider Storybook with dark/light theme toggles to accelerate future UI validation.
- Assess whether to introduce CSS variables for typography/spacing for finer-grained dynamic theming.
