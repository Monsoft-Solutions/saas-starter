# Design System Migration - Phase 1 Usage Inventory

**Date**: October 3, 2025
**Status**: Discovery Complete

## Summary Statistics

- **Total Files with Design System Imports**: 37 files
- **Component Files (.tsx)**: 28 files
- **Documentation Files**: 6 files
- **Implementation Plan Files**: 3 files

## Detailed Usage Analysis

### 1. `cn` Utility Usage

**Total Occurrences**: 97+ across all files
**Current Import**: `import { cn } from '@/lib/design-system'`
**Migration**: Change to `import { cn } from '@/lib/utils'`

**Files Using Only `cn` (Low Complexity - 21 files)**:

1. `/components/notifications/notification-bell.component.tsx`
2. `/components/notifications/notification-center.component.tsx`
3. `/components/layout/page-header.tsx`
4. `/components/layout/breadcrumb-nav.tsx`
5. `/components/layout/loading-states.tsx`
6. `/components/layout/empty-state.tsx`
7. `/components/marketing/floating-card.component.tsx`
8. `/components/marketing/scroll-reveal.component.tsx`
9. `/components/marketing/stats-counter.component.tsx`
10. `/components/marketing/animated-word-swap.component.tsx`
11. `/components/payments/pricing-card.tsx`
12. `/components/payments/pricing-toggle.tsx`
13. `/lib/emails/templates/email-change-confirmation.template.tsx`
14. `/lib/emails/templates/password-changed.template.tsx`
15. `/lib/emails/templates/subscription-created.template.tsx`
16. `/lib/emails/templates/payment-failed.template.tsx`
17. `/lib/emails/templates/welcome-signup.template.tsx`
18. `/lib/emails/templates/team-invitation.template.tsx`
19. `/lib/emails/templates/password-reset.template.tsx`
20. `/app/(app)/app/layout.tsx`
21. `/components/layout/sidebar-nav.tsx` (also uses notionSpacing.sidebarPadding - see below)

### 2. `notionRadius` Object Usage

**Total Component Occurrences**: 6 unique usages across 4 files

**Files & Usage**:

1. **`/components/notifications/notification-item.component.tsx`** (Line 143)
   - Usage: `style={{ borderRadius: notionRadius.default }}`
   - Context: Icon container inline style
   - Migration: Replace with `rounded-md` class

2. **`/components/marketing/features/feature-card.component.tsx`** (Lines 72, 94, 154, 170)
   - `notionRadius.cardLarge` (3 occurrences) - Border radius for card
   - `notionRadius.badge` (1 occurrence) - Badge border radius
   - Migration: Replace with `rounded-xl` (cardLarge) and `rounded-sm` (badge) classes

3. **`/lib/emails/templates/components/email-cta-button.component.tsx`** (Line 13)
   - Usage: `borderRadius: notionRadius.button`
   - Context: Email button inline style
   - Migration: Keep inline style, use `var(--radius-base)` or hardcode 6px

4. **`/app/(public)/features/page.tsx`** (Lines 29, 133)
   - `notionRadius.badge` (1 occurrence)
   - `notionRadius.card` (1 occurrence)
   - Migration: Replace with Tailwind classes where possible

**Radius Value Mapping**:

- `notionRadius.default` → `rounded-md` (6px)
- `notionRadius.card` → `rounded-lg` (8px)
- `notionRadius.cardLarge` → `rounded-xl` (12px)
- `notionRadius.badge` → `rounded-sm` (4px)
- `notionRadius.button` → `rounded-md` (6px)

### 3. `notionSpacing` Object Usage

**Total Component Occurrences**: 25+ usages across 5 files

**Files & Usage**:

1. **`/components/layout/sidebar-nav.tsx`** (Line 207)
   - Usage: `padding: notionSpacing.sidebarPadding`
   - Context: Inline style
   - Migration: Replace with `p-4` class

2. **`/components/marketing/features/feature-card.component.tsx`** (Lines 27, 31, 35, 39, 88)
   - `notionSpacing.elementGap` (3 occurrences)
   - `notionSpacing.microGap` (2 occurrences)
   - Context: CSSProperties objects
   - Migration: Convert to Tailwind classes (`gap-4`, `gap-2`)

3. **`/components/marketing/features/feature-detail.component.tsx`** (Lines 27, 31, 35, 39, 43, 47)
   - `notionSpacing.cardPaddingLarge` (1 occurrence)
   - `notionSpacing.elementGap` (3 occurrences)
   - `notionSpacing.sectionGap` (1 occurrence)
   - `notionSpacing.microGap` (1 occurrence)
   - Context: CSSProperties objects
   - Migration: Convert to Tailwind classes

4. **`/app/(public)/features/[slug]/page.tsx`** (Lines 17, 18, 22)
   - `notionSpacing.sectionGap` (2 occurrences)
   - `notionSpacing.microGap` (1 occurrence)
   - Context: Inline styles
   - Migration: Convert to Tailwind classes

5. **`/app/(public)/features/page.tsx`** (Lines 24, 25, 40, 44, 48, 52, 53, 57, 93, 180)
   - `notionSpacing.sectionGap` (4 occurrences)
   - `notionSpacing.elementGap` (3 occurrences)
   - `notionSpacing.microGap` (2 occurrences)
   - `notionSpacing.componentGap` (1 occurrence)
   - Context: CSSProperties objects and inline styles
   - Migration: Convert to Tailwind classes

**Spacing Value Mapping**:

- `notionSpacing.microGap` → `gap-2` (8px)
- `notionSpacing.elementGap` → `gap-4` (16px)
- `notionSpacing.componentGap` → `gap-6` (24px)
- `notionSpacing.cardPadding` → `p-6` (24px)
- `notionSpacing.cardPaddingLarge` → `p-8` (32px)
- `notionSpacing.sectionGap` → `gap-12` (48px)
- `notionSpacing.sidebarPadding` → `p-4` (16px)

### 4. `themeUtils` Object Usage

**Total Component Occurrences**: 3 usages across 2 files

**Files & Usage**:

1. **`/components/marketing/features/feature-card.component.tsx`** (Line 124)
   - Usage: `style={{ color: themeUtils.getColorValue('primary') }}`
   - Context: Check icon color
   - Migration: Remove inline style, use `text-primary` class

2. **`/components/marketing/features/feature-detail.component.tsx`** (Line 147)
   - Usage: `style={{ color: themeUtils.getColorValue('primary') }}`
   - Context: Check icon color
   - Migration: Remove inline style, use `text-primary` class

3. **`/app/(public)/features/page.tsx`** (Line 139)
   - Usage: `style={{ backgroundColor: themeUtils.getColorValue('primary') }}`
   - Context: Bullet point background
   - Migration: Remove inline style, use `bg-primary` class

**Migration Pattern**:

- `themeUtils.getColorValue('primary')` → `var(--color-primary)` (or use Tailwind class)
- `themeUtils.getColorWithOpacity('primary', 0.2)` → `color-mix(in srgb, var(--color-primary) 20%, transparent)`

### 5. `containerWidths`, `containerPadding`, `gridSystem` Usage

**Total Occurrences**: Found only in `/components/layout/content-container.tsx`

**File: `/components/layout/content-container.tsx`**

- Imports: `containerWidths`, `containerPadding`, `gridSystem`
- Type Imports: `ContainerWidth`, `ContainerPadding`, `GridCols`, `GridGap`
- Usage:
  - `containerWidths[maxWidth]` (Line 46)
  - `containerPadding[padding]` (Line 47)
  - `gridSystem.responsiveLayouts[responsive]` (Line 55)
  - `gridSystem.cols[cols]` (Line 57)
  - `gridSystem.gaps[gap]` (Line 59)

**Migration Strategy**:

- Move type definitions locally into the file
- Create local mapping objects that return Tailwind class names
- Leverage custom utilities from Phase 2

### 6. `typography` Object Usage

**Total Component Occurrences**: Found in `/app/(public)/features/page.tsx`

**Usage**:

- `typography.fontSizes['4xl']` (Line 33)
- `typography.lineHeights.tight` (Lines 34, 185)
- `typography.letterSpacing.tight` (Lines 35, 186)
- `typography.fontWeights.semibold` (Lines 36, 187)
- `typography.fontSizes['3xl']` (Line 184)
- `typography.lineHeights.relaxed` (Lines 114, 194)

**Migration**:

- These are all used in inline `CSSProperties` objects
- Replace with Tailwind utility classes: `text-4xl`, `leading-tight`, `tracking-tight`, `font-semibold`, etc.

## Edge Cases & Special Considerations

### Email Templates

**Files to Review**:

- `/lib/emails/templates/components/email-cta-button.component.tsx` - Uses `notionRadius.button`
- `/lib/emails/templates/components/email-footer.component.tsx` - Check for design system usage
- `/lib/emails/templates/components/email-header.component.tsx` - Check for design system usage
- `/lib/emails/templates/components/email-layout.component.tsx` - Check for design system usage

**Considerations**:

- Email clients have limited CSS support
- Some inline styles may need to remain for compatibility
- Test with `pnpm preview:emails` after migration

### Dynamic Classes & Inline Styles

**Inline Style Patterns Found**:

1. `style={{ borderRadius: notionRadius.* }}` - Convert to Tailwind classes
2. `style={{ gap: notionSpacing.* }}` - Convert to Tailwind gap utilities
3. `style={{ color: themeUtils.getColorValue('primary') }}` - Convert to Tailwind color utilities
4. CSSProperties objects with design system values - Convert to Tailwind classes

### Complex TypeScript Usage

**File: `/components/layout/content-container.tsx`**

- Uses TypeScript types from design system
- Dynamic class generation based on props
- Requires careful migration to maintain type safety

## Migration Complexity Breakdown

### Low Complexity (21 files)

Files that only import `cn` - simple import path change from `@/lib/design-system` to `@/lib/utils`.

### Medium Complexity (7 files)

Files that use `notionRadius`, `notionSpacing`, or `themeUtils` with simple replacements:

1. `/components/notifications/notification-item.component.tsx`
2. `/components/marketing/features/feature-card.component.tsx`
3. `/components/marketing/features/feature-detail.component.tsx`
4. `/app/(public)/features/[slug]/page.tsx`
5. `/app/(public)/features/page.tsx`
6. `/components/layout/sidebar-nav.tsx`
7. `/lib/emails/templates/components/email-cta-button.component.tsx`

### High Complexity (1 file)

File that uses complex patterns with TypeScript types:

1. `/components/layout/content-container.tsx` - Uses `containerWidths`, `containerPadding`, `gridSystem` with types

### Documentation Files (9 files)

1. `/docs/design-system.md` - Full rewrite
2. `/CLAUDE.md` - Update UI component section
3. `/agents/ui-ux-designer.md` - Update design system guidance
4. `/.cursor/rules/ui-ux-designer.mdc` - Update rules
5. `/.cursor/rules/coder-general.mdc` - Update rules
6. `/docs/emails.md` - Check for design system references
7. `/implementation-plans/2025-09-30-billing-page-ui-improvements-implementation-plan.md`
8. `/implementation-plans/done/2025-09-28-public-features-implementation-plan.md`
9. `/implementation-plans/done/2025-09-27-style-system-hardening.md`

## Files NOT Using Design System

These component files do not import from `/lib/design-system`:

- Most components already use direct Tailwind utilities
- No migration needed for these files

## Validation Checklist

After migration, verify:

- [ ] No files import from `@/lib/design-system` (except docs/plans)
- [ ] All components compile without TypeScript errors
- [ ] Visual appearance matches screenshots
- [ ] Email templates render correctly
- [ ] Dark mode works correctly
- [ ] Responsive layouts work at all breakpoints

## Next Steps (Phase 2)

1. Create custom utilities in `app/globals.css`:
   - Container width utilities (`container-sm` through `container-7xl`)
   - Responsive grid utilities (`grid-dashboard`, `grid-cards`, `grid-two-column`)

2. Begin component migrations starting with low complexity files

## Notes

- The design system is well-isolated - only 28 component files need updates
- Most usage is straightforward token replacement
- Only 1 file (`content-container.tsx`) has complex patterns
- Email templates need special attention for compatibility
- All design tokens already exist in `app/globals.css`
