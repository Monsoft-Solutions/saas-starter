# Design System Migration to Tailwind CSS v4 Native Approach

**Date**: October 3, 2025
**Status**: Planning
**Complexity**: Medium
**Estimated Effort**: 8-12 hours

## Executive Summary

This implementation plan outlines the migration from the custom TypeScript-based design system (`/lib/design-system/`) to a pure Tailwind CSS v4 native approach. The project already has design tokens correctly defined in `app/globals.css` using the `@theme` directive (Tailwind v4's recommended approach). The TypeScript design system files are redundant and create maintenance overhead by duplicating what's already in CSS.

This migration will:

- Remove 8 TypeScript files from `/lib/design-system/`
- Update 33 component files that import from the design system
- Update 6 documentation files
- Maintain 100% visual fidelity - zero breaking changes
- Improve bundle size by removing unused TypeScript utilities
- Simplify the codebase by relying on native Tailwind v4 features

## Current State Analysis

### Project Configuration

- **Framework**: Next.js 15 with App Router
- **Tailwind CSS**: v4.1.7 (latest)
- **Styling Approach**: CSS-first configuration with `@theme` directive
- **UI Library**: shadcn/ui components

### Design Tokens Location

All design tokens are already correctly defined in `app/globals.css`:

- Colors: Lines 6-49 (light theme), 92-136 (dark theme)
- Border Radius: Lines 51-60 (`--radius-xs` through `--radius-full`)
- Custom utilities: Lines 78-89 (`page-container`, `stack-md`)

### TypeScript Design System Files (To Be Removed)

```
/lib/design-system/
├── index.ts                          (Main export file)
├── tokens/
│   ├── colors.ts                     (Duplicates CSS colors)
│   ├── typography.ts                 (Tailwind defaults)
│   ├── spacing.ts                    (Tailwind defaults + Notion patterns)
│   └── radius.ts                     (Duplicates CSS radius)
├── utils/
│   ├── theme.ts                      (Helper functions)
│   └── responsive.ts                 (Grid/layout helpers)
└── scripts/
    └── verify-tokens.ts              (Token verification script)
```

### Files Importing Design System

**33 Component Files** (.tsx):

1. `/components/notifications/notification-item.component.tsx`
2. `/components/notifications/notification-bell.component.tsx`
3. `/components/notifications/notification-center.component.tsx`
4. `/components/layout/page-header.tsx`
5. `/components/layout/sidebar-nav.tsx`
6. `/components/layout/breadcrumb-nav.tsx`
7. `/components/layout/loading-states.tsx`
8. `/components/layout/empty-state.tsx`
9. `/components/layout/content-container.tsx`
10. `/components/marketing/floating-card.component.tsx`
11. `/components/marketing/scroll-reveal.component.tsx`
12. `/components/marketing/stats-counter.component.tsx`
13. `/components/marketing/animated-word-swap.component.tsx`
14. `/components/marketing/features/feature-card.component.tsx`
15. `/components/marketing/features/feature-detail.component.tsx`
16. `/components/payments/pricing-card.tsx`
17. `/components/payments/pricing-toggle.tsx`
18. `/lib/emails/templates/email-change-confirmation.template.tsx`
19. `/lib/emails/templates/password-changed.template.tsx`
20. `/lib/emails/templates/subscription-created.template.tsx`
21. `/lib/emails/templates/payment-failed.template.tsx`
22. `/lib/emails/templates/welcome-signup.template.tsx`
23. `/lib/emails/templates/team-invitation.template.tsx`
24. `/lib/emails/templates/password-reset.template.tsx`
25. `/lib/emails/templates/components/email-cta-button.component.tsx`
26. `/lib/emails/templates/components/email-footer.component.tsx`
27. `/lib/emails/templates/components/email-header.component.tsx`
28. `/lib/emails/templates/components/email-layout.component.tsx`
29. `/app/(app)/app/layout.tsx`
30. `/app/(public)/features/[slug]/page.tsx`
31. `/app/(public)/features/page.tsx`

**6 Documentation/Config Files** (.md, .mdc):

1. `/docs/design-system.md`
2. `/docs/emails.md`
3. `/CLAUDE.md`
4. `/agents/ui-ux-designer.md`
5. `/.cursor/rules/ui-ux-designer.mdc`
6. `/.cursor/rules/coder-general.mdc`

**Implementation Plans**:

1. `/implementation-plans/2025-09-30-billing-page-ui-improvements-implementation-plan.md`
2. `/implementation-plans/done/2025-09-28-public-features-implementation-plan.md`
3. `/implementation-plans/done/2025-09-27-style-system-hardening.md`

## Technical Analysis

### Current Usage Patterns

Based on code analysis, here are the design system imports found:

1. **`cn` utility** (97 occurrences across 18 files)
   - Currently exported from `/lib/design-system`
   - Actually implemented in `/lib/utils`
   - Simple import path change

2. **`notionRadius` object** (1 occurrence)
   - Used for inline styles: `style={{ borderRadius: notionRadius.default }}`
   - Replace with Tailwind utility classes

3. **`notionSpacing` object** (Not actively used in searched files)
   - Semantic spacing constants
   - Replace with Tailwind spacing utilities

4. **`containerWidths`, `containerPadding`, `gridSystem`** (4 occurrences)
   - Used in `/components/layout/content-container.tsx`
   - Helper objects for layout utilities
   - Replace with direct Tailwind classes or custom utilities

5. **`colors`, `typography`, `spacing`, `radius`** (Exported but minimal usage)
   - Token objects primarily for reference
   - Not actively used for styling

6. **`themeUtils` functions** (Exported but usage unclear)
   - Helper functions for color manipulation
   - May be used in email templates

7. **`responsive` utilities** (Not actively used)
   - Grid and layout patterns
   - Replace with Tailwind responsive classes

### Migration Complexity by File Type

**Low Complexity** (21 files):

- Files that only import `cn` - simple import path change

**Medium Complexity** (1 file):

- `/components/notifications/notification-item.component.tsx` - uses `notionRadius.default` in inline styles

**High Complexity** (1 file):

- `/components/layout/content-container.tsx` - uses `containerWidths`, `containerPadding`, `gridSystem` with TypeScript types

**Documentation** (9 files):

- Update references and remove outdated guidance

## Architecture Overview

### Tailwind CSS v4 Native Approach

Tailwind CSS v4 provides a CSS-first configuration approach that eliminates the need for TypeScript helper files:

1. **Design Tokens via `@theme`**
   - All tokens defined as CSS custom properties
   - Automatically available as utility classes
   - Example: `--color-primary` becomes `bg-primary`, `text-primary`, etc.

2. **Custom Utilities via `@utility`**
   - Define custom utilities directly in CSS
   - No JavaScript configuration needed
   - Example: `@utility page-container { ... }`

3. **Type Safety**
   - Tailwind v4 IntelliSense provides autocomplete
   - No need for custom TypeScript types
   - CSS custom properties are typed via editor plugins

4. **Color Manipulation**
   - Use `color-mix()` CSS function (already in use)
   - No need for JavaScript helper functions
   - Example: `color-mix(in srgb, var(--color-primary) 20%, transparent)`

### Replacement Strategy

| Design System Feature                            | Tailwind v4 Replacement                                     |
| ------------------------------------------------ | ----------------------------------------------------------- |
| `colors.light.primary`                           | `bg-primary`, `text-primary`, etc.                          |
| `notionRadius.card`                              | `rounded-lg` (8px)                                          |
| `notionRadius.default`                           | `rounded-md` (6px)                                          |
| `notionSpacing.cardPadding`                      | `p-6` (24px)                                                |
| `typography.fontSizes.lg`                        | `text-lg`                                                   |
| `themeUtils.getColorValue('primary')`            | `var(--color-primary)`                                      |
| `themeUtils.getColorWithOpacity('primary', 0.2)` | `color-mix(in srgb, var(--color-primary) 20%, transparent)` |
| `responsive.patterns.grid2`                      | `grid grid-cols-1 md:grid-cols-2`                           |
| `containerWidths['4xl']`                         | `max-w-4xl`                                                 |
| `containerPadding.md`                            | `p-6`                                                       |

## Implementation Phases

### Phase 1: Discovery & Audit (DONE)

**Objective**: Identify all usage patterns and create migration checklist
**Estimated Time**: 1-2 hours

#### Tasks

1. **Create comprehensive usage inventory**

   ```bash
   # Find all design system imports
   rg "from ['\"]\@/lib/design-system" -t tsx -t ts --files-with-matches

   # Find specific token usage patterns
   rg "notionRadius\." -t tsx --line-number
   rg "notionSpacing\." -t tsx --line-number
   rg "colors\." -t tsx --line-number
   rg "themeUtils\." -t tsx --line-number
   rg "containerWidths" -t tsx --line-number
   rg "containerPadding" -t tsx --line-number
   rg "gridSystem\." -t tsx --line-number

   # Find inline style usage
   rg "style={{.*borderRadius" -t tsx
   rg "style={{.*notionRadius" -t tsx
   ```

2. **Document current visual states**
   - Take screenshots of key pages (both light/dark themes):
     - Dashboard (`/app`)
     - Features page (`/features`)
     - Pricing page
     - Notification center
     - Email templates (using email preview)
   - Store in `/migration-screenshots/before/`

3. **Analyze edge cases**
   - Email templates (React Email has special Tailwind handling)
   - Dynamic class generation
   - Inline styles with design tokens
   - TypeScript type dependencies

4. **Create migration checklist**
   - List all files requiring changes
   - Categorize by complexity
   - Identify potential breaking changes

**Deliverables**:

- Detailed usage inventory document
- Screenshot baseline for visual regression testing
- Migration checklist with complexity ratings

**Success Criteria**:

- All design system usage patterns documented
- Visual baseline established
- No surprises discovered during implementation

---

### Phase 2: Create Custom Utilities for Complex Patterns (DONE)

**Objective**: Add custom Tailwind utilities to replace complex helpers
**Estimated Time**: 1-2 hours

#### Tasks

1. **Add container utilities to `globals.css`**

   ```css
   /* Container width utilities */
   @utility container-sm {
     max-width: 24rem; /* 384px */
   }

   @utility container-md {
     max-width: 28rem; /* 448px */
   }

   @utility container-lg {
     max-width: 32rem; /* 512px */
   }

   @utility container-xl {
     max-width: 36rem; /* 576px */
   }

   @utility container-2xl {
     max-width: 42rem; /* 672px */
   }

   @utility container-3xl {
     max-width: 48rem; /* 768px */
   }

   @utility container-4xl {
     max-width: 56rem; /* 896px */
   }

   @utility container-5xl {
     max-width: 64rem; /* 1024px */
   }

   @utility container-6xl {
     max-width: 72rem; /* 1152px */
   }

   @utility container-7xl {
     max-width: 80rem; /* 1280px */
   }
   ```

2. **Add responsive grid layouts to `globals.css`**

   ```css
   /* Responsive grid layouts */
   @utility grid-dashboard {
     grid-template-columns: repeat(1, minmax(0, 1fr));
   }

   @media (min-width: 1024px) {
     .grid-dashboard {
       grid-template-columns: repeat(4, minmax(0, 1fr));
     }
   }

   @utility grid-cards {
     grid-template-columns: repeat(1, minmax(0, 1fr));
   }

   @media (min-width: 768px) {
     .grid-cards {
       grid-template-columns: repeat(2, minmax(0, 1fr));
     }
   }

   @media (min-width: 1024px) {
     .grid-cards {
       grid-template-columns: repeat(3, minmax(0, 1fr));
     }
   }

   @utility grid-two-column {
     grid-template-columns: repeat(1, minmax(0, 1fr));
   }

   @media (min-width: 1024px) {
     .grid-two-column {
       grid-template-columns: repeat(2, minmax(0, 1fr));
     }
   }
   ```

3. **Document custom utilities**
   - Add comments above each utility explaining usage
   - Note which design system features they replace

**Deliverables**:

- Updated `app/globals.css` with custom utilities
- Documentation of new utilities

**Success Criteria**:

- All custom utilities compile without errors
- Utilities tested in browser DevTools
- No TypeScript errors in components using utilities

---

### Phase 3: Update Component Files (Batch 1 - Simple cn Imports) (DONE)

**Objective**: Update files that only need import path changes
**Estimated Time**: 1 hour

This phase updates 21 files that only import `cn` utility.

#### Tasks

1. **Update simple component imports**

   Files to update:
   - `/components/notifications/notification-bell.component.tsx`
   - `/components/notifications/notification-center.component.tsx`
   - `/components/layout/page-header.tsx`
   - `/components/layout/sidebar-nav.tsx`
   - `/components/layout/breadcrumb-nav.tsx`
   - `/components/layout/loading-states.tsx`
   - `/components/layout/empty-state.tsx`
   - `/components/marketing/floating-card.component.tsx`
   - `/components/marketing/scroll-reveal.component.tsx`
   - `/components/marketing/stats-counter.component.tsx`
   - `/components/marketing/animated-word-swap.component.tsx`
   - `/components/payments/pricing-card.tsx`
   - `/components/payments/pricing-toggle.tsx`
   - `/lib/emails/templates/email-change-confirmation.template.tsx`
   - `/lib/emails/templates/password-changed.template.tsx`
   - `/lib/emails/templates/subscription-created.template.tsx`
   - `/lib/emails/templates/payment-failed.template.tsx`
   - `/lib/emails/templates/welcome-signup.template.tsx`
   - `/lib/emails/templates/team-invitation.template.tsx`
   - `/lib/emails/templates/password-reset.template.tsx`
   - `/app/(app)/app/layout.tsx`

   **Find and replace**:

   ```typescript
   // OLD
   import { cn } from '@/lib/design-system';

   // NEW
   import { cn } from '@/lib/utils';
   ```

2. **Verify no other design system imports remain**
   ```bash
   # After updates, verify each file
   rg "from ['\"]\@/lib/design-system" components/notifications/notification-bell.component.tsx
   # Should return no results
   ```

**Deliverables**:

- 21 component files updated with correct `cn` import path

**Success Criteria**:

- All files compile without TypeScript errors
- No remaining imports from `@/lib/design-system`
- Visual appearance unchanged (verify in browser)

---

### Phase 4: Update Complex Component Files

**Objective**: Migrate files with advanced design system usage
**Estimated Time**: 2-3 hours

#### Task 4.1: Update `notification-item.component.tsx`

**Current Code**:

```typescript
import { cn, notionRadius } from '@/lib/design-system';

// ... later in component
<div
  className={cn(
    'flex h-8 w-8 shrink-0 items-center justify-center transition-all',
    notification.isRead
      ? ' text-muted-foreground'
      : 'text-foreground '
  )}
  style={{ borderRadius: notionRadius.default }}
>
  {getCategoryIcon(notification.category)}
</div>
```

**Migration Strategy**:

- Remove inline `style` prop
- Use Tailwind `rounded-md` class (equivalent to `notionRadius.default` which is 6px)

**New Code**:

```typescript
import { cn } from '@/lib/utils';

// ... later in component
<div
  className={cn(
    'flex h-8 w-8 shrink-0 items-center justify-center transition-all rounded-md',
    notification.isRead
      ? ' text-muted-foreground'
      : 'text-foreground '
  )}
>
  {getCategoryIcon(notification.category)}
</div>
```

**Testing**:

- Verify notification icon container has 6px border radius
- Test in both light and dark mode
- Verify visual consistency with other rounded elements

#### Task 4.2: Update `content-container.tsx`

**Current Code**:

```typescript
import {
  cn,
  containerWidths,
  containerPadding,
  gridSystem,
} from '@/lib/design-system';
import type {
  ContainerWidth,
  ContainerPadding,
  GridCols,
  GridGap,
} from '@/lib/design-system';

// Uses containerWidths[maxWidth], containerPadding[padding], gridSystem.cols[cols], etc.
```

**Migration Strategy**:

1. Remove design system imports
2. Create local type definitions
3. Replace helper object lookups with direct Tailwind classes
4. Use custom utilities created in Phase 2

**New Code**:

```typescript
import { cn } from '@/lib/utils';

// Local type definitions
type ContainerWidth =
  | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  | '4xl' | '5xl' | '6xl' | '7xl' | 'full' | 'screen';

type ContainerPadding =
  | 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

type GridCols =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

type GridGap =
  | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;

type ResponsiveLayout =
  | 'dashboard' | 'cards' | 'twoColumn' | 'threeColumn';

// Width mapping
const containerWidthClasses: Record<ContainerWidth, string> = {
  sm: 'container-sm',
  md: 'container-md',
  lg: 'container-lg',
  xl: 'container-xl',
  '2xl': 'container-2xl',
  '3xl': 'container-3xl',
  '4xl': 'container-4xl',
  '5xl': 'container-5xl',
  '6xl': 'container-6xl',
  '7xl': 'container-7xl',
  full: 'max-w-full',
  screen: 'max-w-screen-2xl',
};

// Padding mapping
const containerPaddingClasses: Record<ContainerPadding, string> = {
  none: '',
  xs: 'p-2',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
  '2xl': 'p-12',
};

// Grid columns mapping
const gridColsClasses: Record<GridCols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12',
};

// Grid gap mapping
const gridGapClasses: Record<GridGap, string> = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
  10: 'gap-10',
  12: 'gap-12',
  16: 'gap-16',
};

// Responsive layouts using custom utilities
const responsiveLayoutClasses: Record<ResponsiveLayout, string> = {
  dashboard: 'grid-dashboard',
  cards: 'grid-cards',
  twoColumn: 'grid-two-column',
  threeColumn: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
};

interface ContentContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: ContainerWidth;
  padding?: ContainerPadding;
  as?: 'div' | 'main' | 'section' | 'article';
}

interface GridContainerProps extends ContentContainerProps {
  grid?: true;
  cols?: GridCols;
  gap?: GridGap;
  responsive?: ResponsiveLayout;
}

type ContainerProps = ContentContainerProps | GridContainerProps;

function isGridContainer(props: ContainerProps): props is GridContainerProps {
  return 'grid' in props && props.grid === true;
}

export function ContentContainer(props: ContainerProps) {
  const {
    children,
    className,
    maxWidth = '4xl',
    padding = 'md',
    as: Component = 'div',
  } = props;

  const baseClasses = cn(
    'mx-auto w-full',
    containerWidthClasses[maxWidth],
    containerPaddingClasses[padding]
  );

  if (isGridContainer(props)) {
    const { cols, gap = 6, responsive } = props;
    const gridClasses = cn(
      'grid',
      responsive
        ? responsiveLayoutClasses[responsive]
        : cols
          ? gridColsClasses[cols]
          : '',
      gridGapClasses[gap]
    );

    return (
      <Component className={cn(baseClasses, gridClasses, className)}>
        {children}
      </Component>
    );
  }

  return (
    <Component className={cn(baseClasses, className)}>{children}</Component>
  );
}

// ... rest of the file remains the same
```

**Testing**:

- Test all container variants (different widths, paddings)
- Verify grid layouts work correctly
- Test responsive layouts at different breakpoints
- Ensure TypeScript autocomplete works for types

#### Task 4.3: Update Email Template Components

Files to check:

- `/lib/emails/templates/components/email-cta-button.component.tsx`
- `/lib/emails/templates/components/email-footer.component.tsx`
- `/lib/emails/templates/components/email-header.component.tsx`
- `/lib/emails/templates/components/email-layout.component.tsx`

**Special Considerations**:

- React Email has special Tailwind handling
- Some styles may need to remain inline for email client compatibility
- Test with email preview tool

**Migration Steps**:

1. Audit each file for design system usage
2. If using `themeUtils` or color helpers, replace with CSS custom properties
3. If using spacing/radius tokens, replace with Tailwind classes
4. Keep inline styles where necessary for email compatibility

**Testing**:

- Run `pnpm preview:emails` to verify email rendering
- Check email templates in multiple clients (if possible)
- Verify no layout breaks

#### Task 4.4: Update Marketing Component Files

Files to update:

- `/components/marketing/features/feature-card.component.tsx`
- `/components/marketing/features/feature-detail.component.tsx`
- `/app/(public)/features/[slug]/page.tsx`
- `/app/(public)/features/page.tsx`

**Process**:

1. Review each file for design system imports
2. Update `cn` import path
3. Replace any token usage with Tailwind utilities
4. Test visual appearance

**Deliverables**:

- All complex component files migrated
- Visual appearance maintained
- TypeScript compilation successful

**Success Criteria**:

- No design system imports remain
- All components render correctly
- No TypeScript errors
- Visual regression tests pass

---

### Phase 5: Update Documentation Files

**Objective**: Update all documentation to reflect new Tailwind v4 approach
**Estimated Time**: 1-2 hours

#### Task 5.1: Update `CLAUDE.md`

**Current Section** (lines ~85-110):

```markdown
**UI Components:**

- Use shadcn/ui components - check shadcn docs for installation
- **IMPORTANT**: Always use the design system from `/lib/design-system/` - import tokens, utilities, and patterns
- Import design tokens: `import { colors, typography, spacing, radius } from '@/lib/design-system'`
- Use `cn()` utility for class merging: `import { cn } from '@/lib/design-system'`
- Leverage predefined patterns: `themeUtils.patterns.card`, `themeUtils.patterns.heading`, etc.
- Use Notion-inspired spacing: `notionSpacing.cardPadding`, `notionSpacing.sectionGap`
- Apply consistent radius: `notionRadius.default`, `notionRadius.card`, `notionRadius.button`
- Never define custom colors, typography sizes, spacing, or radius - use design system tokens
- Avoid custom styles in components unless absolutely necessary
```

**New Section**:

```markdown
**UI Components:**

- Use shadcn/ui components - check shadcn docs for installation
- **IMPORTANT**: Use Tailwind CSS v4 utilities and design tokens from `app/globals.css`
- Use `cn()` utility for class merging: `import { cn } from '@/lib/utils'`
- Design tokens are available as Tailwind utilities (e.g., `bg-primary`, `text-muted-foreground`, `rounded-lg`)
- All color, spacing, and radius tokens are defined in `app/globals.css` using the `@theme` directive
- Use semantic color classes: `bg-card`, `bg-muted`, `bg-accent` instead of raw colors
- Apply consistent spacing with Tailwind utilities: `p-6` (card padding), `gap-6` (section gap)
- Use Tailwind radius utilities: `rounded-md` (6px default), `rounded-lg` (8px cards), `rounded-full` (circular)
- For custom patterns, use the custom utilities defined in `app/globals.css`: `page-container`, `stack-md`, `grid-dashboard`, `grid-cards`
- Never define custom colors, typography sizes, spacing, or radius - extend the theme in `app/globals.css` using `@theme`
- Avoid custom styles in components unless absolutely necessary
```

#### Task 5.2: Update `docs/design-system.md`

Replace entire file with updated documentation:

````markdown
# Design System - Tailwind CSS v4

This project uses Tailwind CSS v4's CSS-first configuration approach. All design tokens are defined in `app/globals.css` using the `@theme` directive and are automatically available as utility classes throughout the application.

## Design Tokens

All design tokens are defined in `app/globals.css` and available via Tailwind utilities.

### Color Tokens

| Token                                    | Purpose             | Light Theme           | Dark Theme            | Utility Classes                                 |
| ---------------------------------------- | ------------------- | --------------------- | --------------------- | ----------------------------------------------- |
| `background`                             | App background      | `#ffffff`             | `#191919`             | `bg-background`, `text-background`              |
| `foreground`                             | Default text        | `#37352f`             | `#f7f6f4`             | `bg-foreground`, `text-foreground`              |
| `card` / `card-foreground`               | Card surfaces       | `#ffffff` / `#37352f` | `#2f2f2f` / `#f7f6f4` | `bg-card`, `text-card-foreground`               |
| `popover` / `popover-foreground`         | Popovers, tooltips  | `#ffffff` / `#37352f` | `#2f2f2f` / `#f7f6f4` | `bg-popover`, `text-popover-foreground`         |
| `primary` / `primary-foreground`         | Primary actions     | `#2e3440` / `#ffffff` | `#6366f1` / `#ffffff` | `bg-primary`, `text-primary-foreground`         |
| `secondary` / `secondary-foreground`     | Secondary surfaces  | `#fbfaf9` / `#37352f` | `#373737` / `#f7f6f4` | `bg-secondary`, `text-secondary-foreground`     |
| `muted` / `muted-foreground`             | Muted backgrounds   | `#f7f6f3` / `#787066` | `#2a2a2a` / `#9b9b9b` | `bg-muted`, `text-muted-foreground`             |
| `accent` / `accent-foreground`           | Accent blocks       | `#f1f0ee` / `#37352f` | `#404040` / `#f7f6f4` | `bg-accent`, `text-accent-foreground`           |
| `destructive` / `destructive-foreground` | Destructive actions | `#d73502` / `#ffffff` | `#ef4444` / `#ffffff` | `bg-destructive`, `text-destructive-foreground` |
| `success` / `success-foreground`         | Success messaging   | `#0f7b6c` / `#ffffff` | `#10b981` / `#ffffff` | `bg-success`, `text-success-foreground`         |
| `warning` / `warning-foreground`         | Warning messaging   | `#cb6040` / `#ffffff` | `#f59e0b` / `#000000` | `bg-warning`, `text-warning-foreground`         |
| `border`                                 | Default borders     | `#e9e5e2`             | `#404040`             | `border-border`                                 |
| `input`                                  | Input fields        | `#e9e5e2`             | `#404040`             | `border-input`                                  |
| `ring`                                   | Focus rings         | `#2e3440`             | `#6366f1`             | `ring-ring`                                     |

**Chart & Sidebar Colors**: See `app/globals.css` for full definitions.

### Border Radius

| Token           | Size   | Utility Class  | Common Usage            |
| --------------- | ------ | -------------- | ----------------------- |
| `--radius-xs`   | 2px    | `rounded-xs`   | Very subtle rounding    |
| `--radius-sm`   | 4px    | `rounded-sm`   | Small elements, badges  |
| `--radius-base` | 6px    | `rounded-md`   | Default buttons, inputs |
| `--radius-md`   | 8px    | `rounded-lg`   | Cards, containers       |
| `--radius-lg`   | 12px   | `rounded-xl`   | Large cards, dialogs    |
| `--radius-xl`   | 16px   | `rounded-2xl`  | Hero sections           |
| `--radius-2xl`  | 20px   | `rounded-3xl`  | Very large elements     |
| `--radius-3xl`  | 24px   | Custom class   | Extra large             |
| `--radius-full` | 9999px | `rounded-full` | Circular elements       |

### Spacing

Use Tailwind's default spacing scale. Common Notion-inspired patterns:

| Purpose            | Tailwind Class | Size |
| ------------------ | -------------- | ---- |
| Card padding       | `p-6`          | 24px |
| Large card padding | `p-8`          | 32px |
| Small card padding | `p-4`          | 16px |
| Section gap        | `gap-12`       | 48px |
| Component gap      | `gap-6`        | 24px |
| Element gap        | `gap-4`        | 16px |
| Micro gap          | `gap-2`        | 8px  |

## Custom Utilities

Custom utilities are defined in `app/globals.css` using the `@utility` directive:

### Layout Utilities

**`page-container`**

```css
@utility page-container {
  max-width: 80rem;
  margin-inline: auto;
  padding-inline: 1.5rem;
  width: 100%;
}
```
````

Usage: `<div className="page-container">...</div>`

**`stack-md`**

```css
@utility stack-md {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
```

Usage: `<div className="stack-md">...</div>`

### Container Width Utilities

- `container-sm` through `container-7xl` - Semantic max-width containers
- Example: `<div className="container-4xl mx-auto">...</div>`

### Responsive Grid Utilities

**`grid-dashboard`**

- 1 column on mobile, 4 columns on desktop
- Usage: `<div className="grid grid-dashboard gap-6">...</div>`

**`grid-cards`**

- 1 column on mobile, 2 on tablet, 3 on desktop
- Usage: `<div className="grid grid-cards gap-6">...</div>`

**`grid-two-column`**

- 1 column on mobile, 2 on desktop
- Usage: `<div className="grid grid-two-column gap-6">...</div>`

## Usage Guidelines

### Accessing Design Tokens

**In CSS/Tailwind Classes** (Recommended):

```tsx
<div className="bg-primary text-primary-foreground rounded-lg p-6">
  <h2 className="text-2xl font-semibold">Card Title</h2>
  <p className="text-muted-foreground">Card description</p>
</div>
```

**In Inline Styles** (When necessary):

```tsx
<div
  style={{
    backgroundColor: 'var(--color-primary)',
    borderRadius: 'var(--radius-lg)',
  }}
>
  Content
</div>
```

**With Opacity** (Using color-mix):

```tsx
<div
  style={{
    backgroundColor:
      'color-mix(in srgb, var(--color-primary) 20%, transparent)',
  }}
>
  Semi-transparent background
</div>
```

### Common Patterns

**Card Pattern**:

```tsx
<div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
  Card content
</div>
```

**Page Layout**:

```tsx
<main className="page-container py-8">
  <div className="stack-md">{/* Page sections */}</div>
</main>
```

**Grid Layout**:

```tsx
<div className="grid grid-cards gap-6">
  {items.map((item) => (
    <Card key={item.id} {...item} />
  ))}
</div>
```

### Extending the Design System

To add new design tokens, edit `app/globals.css`:

```css
@theme {
  /* Add new color */
  --color-brand: #1a73e8;

  /* Add new radius */
  --radius-4xl: 2rem;
}
```

The new tokens are automatically available:

- Color: `bg-brand`, `text-brand`, `border-brand`
- Radius: Use in inline styles as `var(--radius-4xl)`

To add new custom utilities:

```css
@utility my-custom-pattern {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  background-color: var(--color-card);
}
```

## Utility Functions

For advanced use cases, the `cn()` utility from `@/lib/utils` merges Tailwind classes:

```tsx
import { cn } from '@/lib/utils';

<div className={cn('base-class', isActive && 'active-class', className)}>
  Content
</div>;
```

## Dark Mode

Dark mode is handled automatically via CSS custom properties. Toggle dark mode by adding/removing the `dark` class on the root element (handled by `next-themes`).

Test dark mode:

1. Capture screenshots in both themes
2. Verify all semantic colors (`bg-card`, `bg-muted`, etc.) update
3. Check focus states with `ring-ring`
4. Ensure WCAG AA contrast ratios (4.5:1 for text, 3:1 for UI elements)

## Migration from Old Design System

If you encounter legacy imports from `/lib/design-system`, replace them:

```tsx
// OLD
import { cn, notionRadius, colors } from '@/lib/design-system';

// NEW
import { cn } from '@/lib/utils';
// Use Tailwind utilities directly instead of notionRadius/colors
```

## References

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS v4 Theme Configuration](https://tailwindcss.com/docs/theme)
- [Tailwind CSS v4 Custom Utilities](https://tailwindcss.com/docs/adding-custom-styles)
- [Next.js with Tailwind CSS](https://nextjs.org/docs/app/building-your-application/styling/tailwind-css)

````

#### Task 5.3: Update Other Documentation Files

**`docs/emails.md`**:
- Search for design system references
- Update to use Tailwind utility examples
- Update color/styling examples

**`agents/ui-ux-designer.md`**:
- Update design system guidance
- Replace TypeScript token examples with Tailwind utilities
- Update best practices section

**`.cursor/rules/ui-ux-designer.mdc`** and **`.cursor/rules/coder-general.mdc`**:
- Update coding guidelines
- Replace design system import examples
- Update best practices

#### Task 5.4: Update Implementation Plans

Update these files to remove design system references:
- `/implementation-plans/2025-09-30-billing-page-ui-improvements-implementation-plan.md`
- `/implementation-plans/done/2025-09-28-public-features-implementation-plan.md`
- `/implementation-plans/done/2025-09-27-style-system-hardening.md`

Search for `/lib/design-system` and update accordingly.

**Deliverables**:
- All documentation files updated
- Consistent messaging about Tailwind v4 approach
- Migration guide for developers

**Success Criteria**:
- No references to `/lib/design-system` in docs
- Clear guidance on using Tailwind v4 features
- Examples updated with current approach

---

### Phase 6: Remove Design System Files
**Objective**: Safely delete the deprecated design system folder
**Estimated Time**: 30 minutes

#### Tasks

1. **Verify no remaining imports**
   ```bash
   # Should return zero results
   rg "from ['\"]\@/lib/design-system" --type ts --type tsx
   rg "from ['\"]\@/lib/design-system" --type js --type jsx
   rg "@/lib/design-system" .
````

2. **Remove verification script from package.json**

   ```json
   // Delete this line:
   "verify:design-tokens": "npx tsx lib/design-system/scripts/verify-tokens.ts",
   ```

3. **Delete the design system folder**

   ```bash
   rm -rf /Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/lib/design-system
   ```

4. **Run TypeScript check**

   ```bash
   pnpm type-check
   ```

5. **Run tests**

   ```bash
   pnpm test
   ```

6. **Build the project**
   ```bash
   pnpm build
   ```

**Deliverables**:

- `/lib/design-system` folder deleted
- Package.json updated
- All TypeScript checks pass
- Tests pass
- Production build succeeds

**Success Criteria**:

- No build errors
- No TypeScript errors
- No test failures
- Bundle size reduced (verify with build output)

---

### Phase 7: Visual Regression Testing

**Objective**: Ensure zero visual changes from migration
**Estimated Time**: 1-2 hours

#### Tasks

1. **Take "after" screenshots**
   - Same pages as Phase 1
   - Both light and dark themes
   - Store in `/migration-screenshots/after/`

2. **Compare screenshots**
   - Use image diff tool or manual comparison
   - Document any differences found
   - Investigate and fix discrepancies

3. **Browser testing**
   - Test in Chrome, Firefox, Safari
   - Test responsive breakpoints
   - Test dark mode toggle

4. **Interactive testing**
   - Test all interactive elements
   - Verify hover states
   - Verify focus states
   - Verify active states

5. **Email testing**

   ```bash
   pnpm preview:emails
   ```

   - Verify all email templates render correctly
   - Check inline styles work
   - Test with email clients if possible

**Test Checklist**:

- [ ] Dashboard page (light mode)
- [ ] Dashboard page (dark mode)
- [ ] Features page (light mode)
- [ ] Features page (dark mode)
- [ ] Pricing page (light mode)
- [ ] Pricing page (dark mode)
- [ ] Notification center (light mode)
- [ ] Notification center (dark mode)
- [ ] Email templates (all)
- [ ] Responsive layouts (mobile, tablet, desktop)
- [ ] Focus states (keyboard navigation)
- [ ] Hover states
- [ ] All custom utilities work

**Deliverables**:

- Screenshot comparison report
- List of any visual regressions (should be zero)
- Browser compatibility confirmed

**Success Criteria**:

- Zero visual regressions
- All interactions work correctly
- All themes render properly
- Cross-browser compatibility verified

---

### Phase 8: Performance Validation

**Objective**: Verify bundle size improvements and performance
**Estimated Time**: 30 minutes

#### Tasks

1. **Compare bundle sizes**

   ```bash
   # Build and note bundle sizes
   pnpm build
   ```

   - Compare with previous build
   - Verify reduction in JavaScript bundle (design system removed)

2. **Check Lighthouse scores**
   - Run Lighthouse on key pages
   - Ensure performance scores maintained or improved

3. **Verify CSS output**
   - Check that unused design system utilities aren't in final CSS
   - Confirm Tailwind purging works correctly

4. **Runtime performance**
   - Test page load times
   - Verify no console errors
   - Check for layout shifts

**Deliverables**:

- Bundle size comparison report
- Lighthouse score comparison
- Performance metrics documented

**Success Criteria**:

- Bundle size reduced or equal
- Lighthouse scores maintained or improved
- No performance regressions
- No console errors

---

### Phase 9: Final Cleanup & Documentation

**Objective**: Polish and document the migration
**Estimated Time**: 1 hour

#### Tasks

1. **Clean up screenshot folders**

   ```bash
   # After verification, remove screenshot folders
   rm -rf migration-screenshots/
   ```

2. **Update CHANGELOG** (if exists)
   - Document the migration
   - Note breaking changes (none expected)
   - Provide migration guide for contributors

3. **Create migration guide for team**
   - Document new patterns
   - Provide examples of common migrations
   - Add to project wiki or docs

4. **Update README** (if necessary)
   - Update any references to design system
   - Clarify Tailwind v4 usage

5. **Git commit**
   - Create comprehensive commit message
   - Reference all changes
   - Include migration notes

**Commit Message Template**:

```
refactor: migrate from custom design system to Tailwind CSS v4 native approach

BREAKING CHANGE: Removed /lib/design-system folder

Changes:
- Removed TypeScript design system files (8 files)
- Updated 33 component files to use Tailwind utilities
- Updated 9 documentation files
- Added custom utilities to globals.css
- Migrated all design tokens to CSS-first approach

Migration Notes:
- All design tokens now in app/globals.css
- Use cn() from @/lib/utils instead of @/lib/design-system
- Use Tailwind utilities instead of design system objects
- Custom utilities available: page-container, stack-md, grid-*

Benefits:
- Reduced bundle size by removing TypeScript utilities
- Improved maintainability with CSS-first approach
- Better alignment with Tailwind v4 best practices
- Simplified codebase

Tested:
- Visual regression testing (zero changes)
- Cross-browser compatibility
- Dark mode functionality
- Email template rendering
- Responsive layouts
```

**Deliverables**:

- Migration guide document
- Updated README
- Comprehensive commit
- Team communication prepared

**Success Criteria**:

- All documentation current
- Team understands changes
- Migration recorded in version control

---

## Risk Assessment & Mitigation

### Potential Risks

| Risk                          | Likelihood | Impact | Mitigation Strategy                                                   |
| ----------------------------- | ---------- | ------ | --------------------------------------------------------------------- |
| **Visual regressions**        | Medium     | High   | Comprehensive screenshot testing before/after; manual QA of all pages |
| **Email template breaks**     | Low        | High   | Thorough email preview testing; keep inline styles where needed       |
| **TypeScript errors**         | Low        | Medium | Incremental migration; type-check after each phase                    |
| **Missing edge cases**        | Medium     | Medium | Thorough discovery phase; grep for all usage patterns                 |
| **Breaking custom utilities** | Low        | Medium | Test custom utilities in isolation; verify in multiple contexts       |
| **Dark mode issues**          | Low        | Medium | Test all pages in both themes; verify CSS variable fallbacks          |

### Rollback Plan

If critical issues are discovered:

1. **Immediate rollback**:

   ```bash
   git revert <migration-commit-hash>
   pnpm install
   pnpm build
   ```

2. **Partial rollback**:
   - Keep custom utilities in globals.css
   - Restore design system folder
   - Update imports back to design system

3. **Investigation**:
   - Document the issue
   - Create isolated reproduction
   - Fix in separate PR

---

## Success Metrics

### Quantitative Metrics

- **Bundle Size**: 5-10% reduction in JavaScript bundle (estimate)
- **CSS Size**: Minimal change (Tailwind purging maintains efficiency)
- **Build Time**: No significant change
- **TypeScript Compilation**: Same or faster (fewer type definitions)
- **Lines of Code**: ~500 lines removed

### Qualitative Metrics

- Zero visual regressions
- Zero functionality breaks
- Improved code maintainability
- Better alignment with Tailwind v4 best practices
- Simplified onboarding for new developers

---

## Post-Migration Tasks

### Immediate (Week 1)

- [ ] Monitor production for issues
- [ ] Gather team feedback
- [ ] Update onboarding docs
- [ ] Create quick reference guide

### Short-term (Month 1)

- [ ] Refactor components to use more semantic Tailwind classes
- [ ] Identify opportunities for additional custom utilities
- [ ] Optimize CSS output further
- [ ] Create component library examples using new approach

### Long-term (Quarter 1)

- [ ] Establish design token governance
- [ ] Document process for extending theme
- [ ] Create style guide using new patterns
- [ ] Train team on Tailwind v4 features

---

## References

### Tailwind CSS v4 Documentation

- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4)
- [Theme Configuration](https://tailwindcss.com/docs/theme)
- [Adding Custom Styles](https://tailwindcss.com/docs/adding-custom-styles)
- [Functions and Directives](https://tailwindcss.com/docs/functions-and-directives)
- [Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)

### Project Documentation

- `/docs/design-system.md` - Design system documentation
- `/app/globals.css` - Design tokens and custom utilities
- `/CLAUDE.md` - Project coding guidelines

### Migration Resources

- [Tailwind v4 Migration Best Practices (2025)](https://medium.com/@genildocs/essential-tailwind-css-v4-migration-tips-the-practical-guide-that-actually-works-8eb4f38e2d3f)
- [Typesafe Design Tokens in Tailwind 4](https://dev.to/wearethreebears/exploring-typesafe-design-tokens-in-tailwind-4-372d)
- [Configuring Tailwind CSS v4.0](https://bryananthonio.com/blog/configuring-tailwind-css-v4/)

---

## Appendix A: File Change Summary

### Files to Update (33 Components)

**Low Complexity** (21 files) - Only `cn` import change:

1. `/components/notifications/notification-bell.component.tsx`
2. `/components/notifications/notification-center.component.tsx`
3. `/components/layout/page-header.tsx`
4. `/components/layout/sidebar-nav.tsx`
5. `/components/layout/breadcrumb-nav.tsx`
6. `/components/layout/loading-states.tsx`
7. `/components/layout/empty-state.tsx`
8. `/components/marketing/floating-card.component.tsx`
9. `/components/marketing/scroll-reveal.component.tsx`
10. `/components/marketing/stats-counter.component.tsx`
11. `/components/marketing/animated-word-swap.component.tsx`
12. `/components/payments/pricing-card.tsx`
13. `/components/payments/pricing-toggle.tsx`
14. `/lib/emails/templates/email-change-confirmation.template.tsx`
15. `/lib/emails/templates/password-changed.template.tsx`
16. `/lib/emails/templates/subscription-created.template.tsx`
17. `/lib/emails/templates/payment-failed.template.tsx`
18. `/lib/emails/templates/welcome-signup.template.tsx`
19. `/lib/emails/templates/team-invitation.template.tsx`
20. `/lib/emails/templates/password-reset.template.tsx`
21. `/app/(app)/app/layout.tsx`

**Medium Complexity** (7 files) - Token usage or inline styles:

1. `/components/notifications/notification-item.component.tsx`
2. `/lib/emails/templates/components/email-cta-button.component.tsx`
3. `/lib/emails/templates/components/email-footer.component.tsx`
4. `/lib/emails/templates/components/email-header.component.tsx`
5. `/lib/emails/templates/components/email-layout.component.tsx`
6. `/components/marketing/features/feature-card.component.tsx`
7. `/components/marketing/features/feature-detail.component.tsx`

**High Complexity** (5 files) - Complex token usage with types:

1. `/components/layout/content-container.tsx`
2. `/app/(public)/features/[slug]/page.tsx`
3. `/app/(public)/features/page.tsx`

### Files to Delete (8 files)

```
/lib/design-system/
├── index.ts
├── tokens/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── radius.ts
├── utils/
│   ├── theme.ts
│   └── responsive.ts
└── scripts/
    └── verify-tokens.ts
```

### Documentation to Update (9 files)

1. `/docs/design-system.md`
2. `/docs/emails.md`
3. `/CLAUDE.md`
4. `/agents/ui-ux-designer.md`
5. `/.cursor/rules/ui-ux-designer.mdc`
6. `/.cursor/rules/coder-general.mdc`
7. `/implementation-plans/2025-09-30-billing-page-ui-improvements-implementation-plan.md`
8. `/implementation-plans/done/2025-09-28-public-features-implementation-plan.md`
9. `/implementation-plans/done/2025-09-27-style-system-hardening.md`

---

## Appendix B: Tailwind Utility Mapping Reference

Quick reference for migrating design system tokens to Tailwind utilities:

### Colors

| Design System                                    | Tailwind v4 Utility                                         | CSS Variable           |
| ------------------------------------------------ | ----------------------------------------------------------- | ---------------------- |
| `colors.light.primary`                           | `bg-primary`                                                | `var(--color-primary)` |
| `colors.dark.primary`                            | `bg-primary` (auto-switches)                                | `var(--color-primary)` |
| `themeUtils.getColorValue('primary')`            | `var(--color-primary)`                                      | Direct CSS var         |
| `themeUtils.getColorWithOpacity('primary', 0.2)` | `color-mix(in srgb, var(--color-primary) 20%, transparent)` | CSS color-mix          |

### Border Radius

| Design System            | Tailwind v4 Utility | Size   |
| ------------------------ | ------------------- | ------ |
| `notionRadius.default`   | `rounded-md`        | 6px    |
| `notionRadius.card`      | `rounded-lg`        | 8px    |
| `notionRadius.cardLarge` | `rounded-xl`        | 12px   |
| `notionRadius.button`    | `rounded-md`        | 6px    |
| `notionRadius.dialog`    | `rounded-xl`        | 12px   |
| `radius.sm`              | `rounded-sm`        | 4px    |
| `radius.full`            | `rounded-full`      | 9999px |

### Spacing

| Design System                    | Tailwind v4 Utility | Size |
| -------------------------------- | ------------------- | ---- |
| `notionSpacing.cardPadding`      | `p-6`               | 24px |
| `notionSpacing.cardPaddingLarge` | `p-8`               | 32px |
| `notionSpacing.cardPaddingSmall` | `p-4`               | 16px |
| `notionSpacing.sectionGap`       | `gap-12`            | 48px |
| `notionSpacing.componentGap`     | `gap-6`             | 24px |
| `notionSpacing.elementGap`       | `gap-4`             | 16px |
| `spacing[6]`                     | `p-6` or `gap-6`    | 24px |

### Layout

| Design System                            | Tailwind v4 Replacement                          |
| ---------------------------------------- | ------------------------------------------------ |
| `containerWidths['4xl']`                 | `container-4xl` (custom utility)                 |
| `containerPadding.md`                    | `p-6`                                            |
| `gridSystem.cols[3]`                     | `grid-cols-3`                                    |
| `gridSystem.gaps[6]`                     | `gap-6`                                          |
| `gridSystem.responsiveLayouts.dashboard` | `grid-dashboard` (custom utility)                |
| `responsive.patterns.grid3`              | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` |

### Typography

| Design System                     | Tailwind v4 Utility |
| --------------------------------- | ------------------- |
| `typography.fontSizes.lg`         | `text-lg`           |
| `typography.fontWeights.semibold` | `font-semibold`     |
| `typography.lineHeights.relaxed`  | `leading-relaxed`   |

---

## Appendix C: Testing Checklist

Use this checklist during Phase 7 (Visual Regression Testing):

### Pages to Test

- [ ] **Dashboard** (`/app`)
  - [ ] Light mode
  - [ ] Dark mode
  - [ ] Responsive (mobile, tablet, desktop)
  - [ ] All interactive elements

- [ ] **Features Page** (`/features`)
  - [ ] Light mode
  - [ ] Dark mode
  - [ ] Feature cards render correctly
  - [ ] Hover states work

- [ ] **Feature Detail** (`/features/[slug]`)
  - [ ] Light mode
  - [ ] Dark mode
  - [ ] Layout correct
  - [ ] Navigation works

- [ ] **Pricing Page**
  - [ ] Light mode
  - [ ] Dark mode
  - [ ] Pricing cards render
  - [ ] Toggle works

- [ ] **Notification Center**
  - [ ] Bell icon displays
  - [ ] Dropdown opens
  - [ ] Notification items render
  - [ ] Mark as read works
  - [ ] Links work

### Email Templates

- [ ] Welcome email
- [ ] Password reset email
- [ ] Email change confirmation
- [ ] Password changed notification
- [ ] Team invitation
- [ ] Subscription created
- [ ] Payment failed

### Interactive Elements

- [ ] Buttons (all variants)
  - [ ] Hover states
  - [ ] Focus states
  - [ ] Active states
  - [ ] Disabled states

- [ ] Forms
  - [ ] Input fields
  - [ ] Validation states
  - [ ] Error messages

- [ ] Cards
  - [ ] Border radius correct
  - [ ] Shadow correct
  - [ ] Hover effects

- [ ] Modals/Dialogs
  - [ ] Opens correctly
  - [ ] Border radius
  - [ ] Backdrop
  - [ ] Close functionality

### Custom Utilities

- [ ] `page-container` works
- [ ] `stack-md` works
- [ ] `grid-dashboard` works
- [ ] `grid-cards` works
- [ ] `grid-two-column` works
- [ ] `container-*` utilities work

### Cross-Browser

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Performance

- [ ] No console errors
- [ ] No layout shifts
- [ ] Fast paint times
- [ ] Smooth transitions

---

## Notes for Implementation

- Always work in a feature branch: `git checkout -b refactor/migrate-to-tailwind-v4`
- Commit frequently after each phase
- Test thoroughly before moving to next phase
- Keep screenshots for comparison
- Document any unexpected findings
- Don't rush - quality over speed
- Backup the database before testing
- Use browser DevTools to inspect elements
- Verify both light and dark modes
- Test keyboard navigation
- Check mobile responsiveness
