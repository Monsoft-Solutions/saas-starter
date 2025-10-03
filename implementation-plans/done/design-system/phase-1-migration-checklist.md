# Design System Migration - Comprehensive Migration Checklist

**Date**: October 3, 2025
**Status**: Ready for Phase 2

## Summary

- **Total Files to Migrate**: 28 component files
- **Low Complexity**: 21 files (simple import change)
- **Medium Complexity**: 7 files (token replacements)
- **High Complexity**: 1 file (complex patterns with types)
- **Documentation Updates**: 9 files
- **Implementation Plans**: 3 files

## Phase 2: Custom Utilities (Complete Before Component Migration)

### Task 2.1: Add Container Width Utilities to `app/globals.css`

Add after existing custom utilities (around line 90):

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

### Task 2.2: Add Responsive Grid Utilities to `app/globals.css`

Add after container utilities:

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

**Verification**:

- [ ] Run `pnpm dev`
- [ ] Check console for CSS compilation errors
- [ ] Test utilities in browser DevTools

## Phase 3: Low Complexity Files (21 Files)

These files only import `cn` utility. Simple find and replace:

**Find**: `import { cn } from '@/lib/design-system';`
**Replace**: `import { cn } from '@/lib/utils';`

### Checklist

- [ ] 1. `/components/notifications/notification-bell.component.tsx`
- [ ] 2. `/components/notifications/notification-center.component.tsx`
- [ ] 3. `/components/layout/page-header.tsx`
- [ ] 4. `/components/layout/breadcrumb-nav.tsx`
- [ ] 5. `/components/layout/loading-states.tsx`
- [ ] 6. `/components/layout/empty-state.tsx`
- [ ] 7. `/components/marketing/floating-card.component.tsx`
- [ ] 8. `/components/marketing/scroll-reveal.component.tsx`
- [ ] 9. `/components/marketing/stats-counter.component.tsx`
- [ ] 10. `/components/marketing/animated-word-swap.component.tsx`
- [ ] 11. `/components/payments/pricing-card.tsx`
- [ ] 12. `/components/payments/pricing-toggle.tsx`
- [ ] 13. `/lib/emails/templates/email-change-confirmation.template.tsx`
- [ ] 14. `/lib/emails/templates/password-changed.template.tsx`
- [ ] 15. `/lib/emails/templates/subscription-created.template.tsx`
- [ ] 16. `/lib/emails/templates/payment-failed.template.tsx`
- [ ] 17. `/lib/emails/templates/welcome-signup.template.tsx`
- [ ] 18. `/lib/emails/templates/team-invitation.template.tsx`
- [ ] 19. `/lib/emails/templates/password-reset.template.tsx`
- [ ] 20. `/app/(app)/app/layout.tsx`

**Verification after batch**:

- [ ] Run `pnpm type-check`
- [ ] No TypeScript errors
- [ ] No remaining imports from `@/lib/design-system`

## Phase 4: Medium Complexity Files (7 Files)

### File 1: `/components/notifications/notification-item.component.tsx`

**Line 26**: Change import

```typescript
// OLD
import { cn, notionRadius } from '@/lib/design-system';

// NEW
import { cn } from '@/lib/utils';
```

**Line 143**: Replace inline style with class

```typescript
// OLD
<div
  className={cn(
    'flex h-8 w-8 shrink-0 items-center justify-center transition-all',
    notification.isRead
      ? ' text-muted-foreground'
      : 'text-foreground '
  )}
  style={{ borderRadius: notionRadius.default }}
>

// NEW
<div
  className={cn(
    'flex h-8 w-8 shrink-0 items-center justify-center transition-all rounded-md',
    notification.isRead
      ? ' text-muted-foreground'
      : 'text-foreground '
  )}
>
```

**Verification**:

- [ ] TypeScript compiles
- [ ] Icon container has 6px border radius
- [ ] Visual appearance unchanged

---

### File 2: `/components/layout/sidebar-nav.tsx`

**Import**: Change from `@/lib/design-system` to `@/lib/utils`

**Line 207**: Replace inline style with class

```typescript
// OLD
style={{ padding: notionSpacing.sidebarPadding }}

// NEW
className="p-4"
```

**Verification**:

- [ ] Sidebar padding looks correct
- [ ] No visual regression

---

### File 3: `/components/marketing/features/feature-card.component.tsx`

**Lines 14-40**: Replace CSSProperties objects

```typescript
// OLD
import {
  cn,
  notionRadius,
  notionSpacing,
  themeUtils,
} from '@/lib/design-system';

const listStyles: CSSProperties = {
  gap: notionSpacing.elementGap,
};

const listItemStyles: CSSProperties = {
  gap: notionSpacing.microGap,
};

const cardContentStyles: CSSProperties = {
  gap: notionSpacing.elementGap,
};

const ctaStyles: CSSProperties = {
  gap: notionSpacing.microGap,
};

// NEW
import { cn } from '@/lib/utils';

// Remove CSSProperties objects, use Tailwind classes directly
```

**Replace inline styles with classes**:

**Line 72, 154, 170**: Remove `style` prop, add to `className`

```typescript
// OLD
style={{
  borderRadius: notionRadius.cardLarge,
}}

// NEW
// Add to className: rounded-xl
```

**Line 94**: Replace badge radius

```typescript
// OLD
style={{ borderRadius: notionRadius.badge }}

// NEW
// Add to className: rounded-sm
```

**Line 88**: Replace inline gap

```typescript
// OLD
style={{
  rowGap: notionSpacing.elementGap,
}}

// NEW
// Add to className: gap-y-4
```

**Line 107**: Replace style object

```typescript
// OLD
style = { cardContentStyles };

// NEW
// Remove style prop, gap is already in className
```

**Line 111**: Replace style object

```typescript
// OLD
style = { listStyles };

// NEW
// Add to className: gap-4
```

**Line 118-119**: Remove style prop

```typescript
// OLD
style={{
  ...listItemStyles,
  transitionDelay: `${index * 50}ms`,
}}

// NEW - Keep transitionDelay inline (dynamic), remove gap
className="gap-2"
style={{
  transitionDelay: `${index * 50}ms`,
}}
```

**Line 124**: Replace themeUtils color

```typescript
// OLD
style={{ color: themeUtils.getColorValue('primary') }}

// NEW
className="text-primary"
```

**Line 136**: Replace style object

```typescript
// OLD
style = { ctaStyles };

// NEW
className = 'gap-2';
```

**Verification**:

- [ ] Card border radius is 12px (rounded-xl)
- [ ] Badge border radius is 4px (rounded-sm)
- [ ] Spacing looks correct
- [ ] Check icon is primary color
- [ ] Hover states work
- [ ] Stagger animation works (transitionDelay)

---

### File 4: `/components/marketing/features/feature-detail.component.tsx`

**Lines 26-47**: Replace CSSProperties objects

```typescript
// OLD
import {
  cn,
  notionRadius,
  notionSpacing,
  themeUtils,
} from '@/lib/design-system';

// NEW
import { cn } from '@/lib/utils';

// Remove all CSSProperties objects, use Tailwind classes
```

**Line 26**: Replace card style

```typescript
// OLD
const cardStyles: CSSProperties = {
  borderRadius: notionRadius.cardLarge,
  padding: notionSpacing.cardPaddingLarge,
};

// NEW - Apply directly to element
// rounded-xl p-8
```

**Apply Tailwind classes to elements**:

- Replace all `style={*Styles}` with Tailwind classes
- `notionSpacing.elementGap` → `gap-4`
- `notionSpacing.sectionGap` → `gap-12`
- `notionSpacing.microGap` → `gap-2`

**Line 92**: Replace badge radius

```typescript
// OLD
style={{ borderRadius: notionRadius.badge }}

// NEW
className="rounded-sm"
```

**Line 147**: Replace icon color

```typescript
// OLD
style={{ color: themeUtils.getColorValue('primary') }}

// NEW
className="text-primary"
```

**Verification**:

- [ ] All spacing correct
- [ ] Card padding is 32px (p-8)
- [ ] Border radius correct
- [ ] Colors match

---

### File 5: `/app/(public)/features/[slug]/page.tsx`

**Lines 10-22**: Replace imports and styles

```typescript
// OLD
import {
  notionRadius,
  notionSpacing,
  themeUtils,
  typography,
} from '@/lib/design-system';

const heroStyles: CSSProperties = {
  paddingBlock: notionSpacing.sectionGap,
  gap: notionSpacing.sectionGap,
};

const heroHighlightItemStyles: CSSProperties = {
  gap: notionSpacing.microGap,
};

// NEW
// Remove all imports and CSSProperties objects
// Apply Tailwind classes directly
```

**Apply Tailwind classes**:

- `paddingBlock: notionSpacing.sectionGap` → `py-12`
- `gap: notionSpacing.sectionGap` → `gap-12`
- `gap: notionSpacing.microGap` → `gap-2`

**Verification**:

- [ ] Section spacing correct
- [ ] No visual regression

---

### File 6: `/app/(public)/features/page.tsx`

**Lines 10-58**: Replace imports and CSSProperties objects

```typescript
// OLD
import {
  notionRadius,
  notionSpacing,
  themeUtils,
  typography,
} from '@/lib/design-system';

// All CSSProperties objects

// NEW
// Remove all imports
// Remove all CSSProperties objects
// Apply Tailwind classes directly
```

**Line 29**: Replace badge radius

```typescript
// OLD
style = { heroBadgeStyles };

// NEW
className = 'rounded-sm';
```

**Lines 33-37**: Replace typography inline styles

```typescript
// OLD
style = { heroTitleStyles };

// NEW
className = 'text-4xl leading-tight tracking-tight font-semibold';
```

**Line 93, 180**: Replace inline gaps

```typescript
// OLD
style={{ gap: notionSpacing.elementGap }}

// NEW
className="gap-4"
```

**Line 114, 194**: Replace line height

```typescript
// OLD
style={{ lineHeight: typography.lineHeights.relaxed }}

// NEW
className="leading-relaxed"
```

**Line 133**: Replace card radius

```typescript
// OLD
style={{
  ...heroHighlightItemStyles,
  borderRadius: notionRadius.card,
  animationDelay: `${300 + index * 100}ms`,
}}

// NEW
className="rounded-lg gap-2"
style={{
  animationDelay: `${300 + index * 100}ms`, // Keep dynamic value
}}
```

**Line 139**: Replace background color

```typescript
// OLD
style={{ backgroundColor: themeUtils.getColorValue('primary') }}

// NEW
className="bg-primary"
```

**Lines 184-188**: Replace typography

```typescript
// OLD
style={{
  fontSize: typography.fontSizes['3xl'],
  lineHeight: typography.lineHeights.tight,
  letterSpacing: typography.letterSpacing.tight,
  fontWeight: typography.fontWeights.semibold,
}}

// NEW
className="text-3xl leading-tight tracking-tight font-semibold"
```

**Verification**:

- [ ] Hero section looks correct
- [ ] Typography matches original
- [ ] Spacing is correct
- [ ] Animation delays work
- [ ] Colors match

---

### File 7: `/lib/emails/templates/components/email-cta-button.component.tsx`

**Lines 4-17**: Replace design system imports with hardcoded values

```typescript
// OLD
import { colors, notionRadius, spacing, typography } from '@/lib/design-system';

const palette = colors.light;

const buttonStyle = {
  display: 'inline-block',
  backgroundColor: palette.primary,
  color: palette['primary-foreground'],
  padding: `${spacing[3]} ${spacing[6]}`,
  borderRadius: notionRadius.button,
  textDecoration: 'none',
  fontWeight: typography.fontWeights.semibold,
  fontSize: typography.fontSizes.base,
} as const;

// NEW
import { cn } from '@/lib/utils';

const buttonStyle = {
  display: 'inline-block',
  backgroundColor: '#2e3440', // Light theme primary
  color: '#ffffff', // Light theme primary-foreground
  padding: '12px 24px', // spacing[3] spacing[6]
  borderRadius: '6px', // notionRadius.button
  textDecoration: 'none',
  fontWeight: 600, // semibold
  fontSize: '16px', // base
} as const;
```

**Verification**:

- [ ] Button renders correctly in email preview
- [ ] Colors match design system
- [ ] Spacing is correct

---

**After Medium Complexity Files**:

- [ ] Run `pnpm type-check`
- [ ] Run `pnpm build` to verify production build
- [ ] Test all pages in browser
- [ ] Compare with screenshots

## Phase 5: High Complexity Files (1 File)

### File: `/components/layout/content-container.tsx`

This file requires a complete rewrite following the pattern in the main implementation plan (Phase 4, Task 4.2).

**Steps**:

1. Change import from `@/lib/design-system` to `@/lib/utils`
2. Remove type imports from design system
3. Define local type definitions
4. Create local mapping objects for Tailwind classes
5. Update component logic to use mapping objects

**See**: `implementation-plans/2025-10-03-design-system-migration-to-tailwind-v4.md` lines 487-635 for complete code.

**Verification**:

- [ ] TypeScript types work correctly
- [ ] All container widths render properly
- [ ] All padding values work
- [ ] Grid layouts work
- [ ] Responsive layouts work
- [ ] Props autocomplete in IDE
- [ ] No visual regression

## Phase 6: Email Template Components (4 Files)

### File 1: `/lib/emails/templates/components/email-layout.component.tsx`

**Lines 12-44**: Replace design system with hardcoded values

```typescript
// OLD
import { colors, spacing, typography } from '@/lib/design-system';

const palette = colors.light;

// NEW
import { cn } from '@/lib/utils';

// Hardcode all values (see edge-cases-analysis.md for complete code)
```

**Verification**:

- [ ] Email renders correctly
- [ ] Layout is correct
- [ ] Colors match

---

### File 2: `/lib/emails/templates/components/email-header.component.tsx`

**Lines 4-29**: Replace with hardcoded values

```typescript
// OLD
import { colors, spacing, typography } from '@/lib/design-system';

// NEW
import { cn } from '@/lib/utils';

// Hardcode all values
```

**Verification**:

- [ ] Header renders correctly
- [ ] Brand name styling correct
- [ ] Heading styling correct

---

### File 3: `/lib/emails/templates/components/email-footer.component.tsx`

**Lines 4-25**: Replace with hardcoded values

```typescript
// OLD
import { colors, spacing, typography } from '@/lib/design-system';

// NEW
import { cn } from '@/lib/utils';

// Hardcode all values
```

**Verification**:

- [ ] Footer renders correctly
- [ ] Support email styling correct
- [ ] Signature styling correct

---

**After Email Components**:

- [ ] Run `pnpm preview:emails`
- [ ] Check all 7 email templates
- [ ] Verify no layout breaks
- [ ] Verify colors match design system

## Phase 7: Documentation Files (9 Files)

### File 1: `/CLAUDE.md`

**Lines ~165-173**: Replace UI Components section

```markdown
OLD section starts: "**UI Components:**"

NEW section: See implementation plan lines 716-730
```

**Verification**:

- [ ] File updated
- [ ] Guidance is clear

---

### File 2: `/docs/design-system.md`

**Replace entire file** with content from implementation plan lines 736-972.

**Verification**:

- [ ] File replaced
- [ ] All sections present
- [ ] Examples are correct

---

### File 3: `/docs/emails.md`

**Task**: Search for design system references and update

```bash
grep -n "@/lib/design-system" docs/emails.md
```

**Update**: Any references to design system imports or usage patterns

**Verification**:

- [ ] No design system references remain
- [ ] Examples use hardcoded values

---

### File 4: `/agents/ui-ux-designer.md`

**Search for**: Design system guidance sections

**Update**: Replace with Tailwind v4 approach

**Verification**:

- [ ] Updated to Tailwind v4 patterns
- [ ] Examples are correct

---

### File 5: `/.cursor/rules/ui-ux-designer.mdc`

**Same updates as**: `/agents/ui-ux-designer.md`

**Verification**:

- [ ] Consistent with agent file

---

### File 6: `/.cursor/rules/coder-general.mdc`

**Search for**: Design system references

**Update**: Replace with Tailwind v4 guidance

**Verification**:

- [ ] No design system references
- [ ] Tailwind v4 guidance added

---

### Files 7-9: Implementation Plans

These files are historical documentation - update references but don't need full rewrites:

- `/implementation-plans/2025-09-30-billing-page-ui-improvements-implementation-plan.md`
- `/implementation-plans/done/2025-09-28-public-features-implementation-plan.md`
- `/implementation-plans/done/2025-09-27-style-system-hardening.md`

**Task**: Add note at top of each file:

```markdown
> **Note**: This plan was created before the design system migration to Tailwind v4.
> References to `/lib/design-system` should be read as Tailwind utility classes.
> See `/docs/design-system.md` for current approach.
```

**Verification**:

- [ ] All 3 files updated with note

---

**After Documentation Updates**:

- [ ] Review all docs for accuracy
- [ ] Check for broken links
- [ ] Verify examples are up to date

## Phase 8: Remove Design System Files

**ONLY after all above phases are complete and verified!**

### Pre-removal Verification

```bash
# Should return ZERO component/app files (only docs/plans ok)
rg "from ['\"]@/lib/design-system" --type ts --type tsx | grep -v "implementation-plans" | grep -v ".md"
```

### Remove Verification Script from package.json

Find and delete this line:

```json
"verify:design-tokens": "npx tsx lib/design-system/scripts/verify-tokens.ts",
```

### Delete Design System Folder

```bash
rm -rf lib/design-system
```

### Verification

- [ ] Folder deleted
- [ ] `pnpm type-check` passes
- [ ] `pnpm test` passes (if tests exist)
- [ ] `pnpm build` succeeds
- [ ] No TypeScript errors
- [ ] No runtime errors

## Phase 9: Visual Regression Testing

Follow the screenshot checklist created in Phase 1:

- [ ] Take "after" screenshots of all pages
- [ ] Compare with "before" screenshots
- [ ] Document any differences
- [ ] Fix any visual regressions
- [ ] Test dark mode
- [ ] Test responsive breakpoints
- [ ] Test all browsers

**Pages to verify**:

- [ ] Features page (`/features`)
- [ ] Feature detail pages
- [ ] Dashboard (`/app`)
- [ ] Notification center
- [ ] Pricing page
- [ ] Email templates (all 7)

**Interactive elements**:

- [ ] Buttons (all states)
- [ ] Cards (hover effects)
- [ ] Forms
- [ ] Modals
- [ ] Navigation

## Phase 10: Final Validation

### Type Check

```bash
pnpm type-check
```

- [ ] No errors

### Build

```bash
pnpm build
```

- [ ] Build succeeds
- [ ] Note bundle size reduction

### Tests (if applicable)

```bash
pnpm test
```

- [ ] All tests pass

### Development Server

```bash
pnpm dev
```

- [ ] Server starts without errors
- [ ] No console warnings
- [ ] Hot reload works

### Email Preview

```bash
pnpm preview:emails
```

- [ ] All templates render correctly

## Phase 11: Git Commit

Only after ALL phases complete successfully!

```bash
git add .
git commit -m "$(cat <<'EOF'
refactor: migrate from custom design system to Tailwind CSS v4 native approach

BREAKING CHANGE: Removed /lib/design-system folder

Changes:
- Removed TypeScript design system files (8 files)
- Updated 28 component files to use Tailwind utilities
- Updated 9 documentation files
- Added custom utilities to globals.css (container and grid utilities)
- Migrated all design tokens to CSS-first approach

Migration Details:
- All design tokens now in app/globals.css
- Use cn() from @/lib/utils instead of @/lib/design-system
- Use Tailwind utilities instead of design system objects
- Custom utilities available: page-container, stack-md, grid-dashboard, grid-cards, grid-two-column
- Email templates use hardcoded values for email client compatibility

Benefits:
- Reduced bundle size by removing TypeScript utilities
- Improved maintainability with CSS-first approach
- Better alignment with Tailwind v4 best practices
- Simplified codebase

Testing:
- Visual regression testing completed (zero visual changes)
- Cross-browser compatibility verified
- Dark mode functionality verified
- Email template rendering verified
- Responsive layouts verified

🤖 Generated with Claude Code
EOF
)"
```

## Success Criteria

All items must be checked:

- [ ] Zero design system imports in component files
- [ ] All TypeScript checks pass
- [ ] Production build succeeds
- [ ] All email templates render correctly
- [ ] Zero visual regressions
- [ ] Dark mode works correctly
- [ ] Responsive layouts work
- [ ] All custom utilities work
- [ ] Documentation is up to date
- [ ] Bundle size reduced or equal
- [ ] No runtime errors
- [ ] Git commit created

## Rollback Procedure

If critical issues found:

```bash
git revert HEAD
pnpm install
pnpm build
```

## Notes

- Work methodically through each phase
- Test thoroughly after each phase
- Don't skip verification steps
- Keep screenshots for comparison
- Document any unexpected issues
- Take breaks - this is a large migration!
