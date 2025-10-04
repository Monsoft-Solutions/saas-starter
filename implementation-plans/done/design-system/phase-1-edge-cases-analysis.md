# Design System Migration - Edge Cases Analysis

**Date**: October 3, 2025
**Purpose**: Identify and document special considerations for the migration

## Email Templates - React Email Special Handling

### Overview

Email templates use React Email library which has specific requirements:

- Limited CSS support due to email client compatibility
- Inline styles are often required
- Some CSS properties may need to remain inline even after migration

### Email Component Files Using Design System

#### 1. `email-cta-button.component.tsx`

**Current Usage**:

```typescript
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
```

**Migration Strategy**:

- Replace `colors.light` with direct CSS variable references or hardcoded values
- Replace `notionRadius.button` with `6px` (or `var(--radius-base)` if React Email supports it)
- Replace `spacing[3]` with `12px`, `spacing[6]` with `24px`
- Replace `typography.fontWeights.semibold` with `600`
- Replace `typography.fontSizes.base` with `16px`

**Migrated Code**:

```typescript
import { cn } from '@/lib/utils';

const buttonStyle = {
  display: 'inline-block',
  backgroundColor: 'hsl(222.2 47.4% 11.2%)', // or use hex value from globals.css
  color: 'hsl(210 40% 98%)',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '16px',
} as const;
```

**Alternative**: Use CSS custom properties if React Email rendering supports them:

```typescript
const buttonStyle = {
  display: 'inline-block',
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-primary-foreground)',
  padding: '12px 24px',
  borderRadius: 'var(--radius-base)',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '16px',
} as const;
```

**Testing Required**: Test with email preview to verify CSS custom properties work in React Email context.

#### 2. `email-layout.component.tsx`

**Current Usage**:

```typescript
import { colors, spacing, typography } from '@/lib/design-system';

const palette = colors.light;

const bodyStyle = {
  backgroundColor: palette.background,
  color: palette.foreground,
  fontFamily: baseFontFamily,
  fontSize: typography.fontSizes.base,
  margin: '0',
  padding: spacing[8],
} as const;

const containerStyle = {
  width: '100%',
  maxWidth: '600px',
  margin: '0 auto',
  padding: spacing[8],
  backgroundColor: palette.card,
  borderRadius: '16px',
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
} as const;

const contentSectionStyle = {
  paddingTop: spacing[6],
  paddingBottom: spacing[6],
} as const;
```

**Migration Strategy**:

- Replace all `palette.*` references with hardcoded HSL/hex values
- Replace all `spacing[*]` with pixel values
- Replace all `typography.*` with hardcoded values
- Keep all styles inline (required for email compatibility)

**Migrated Code**:

```typescript
import { cn } from '@/lib/utils';

const bodyStyle = {
  backgroundColor: '#ffffff', // palette.background light theme
  color: '#37352f', // palette.foreground light theme
  fontFamily: baseFontFamily,
  fontSize: '16px',
  margin: '0',
  padding: '32px', // spacing[8]
} as const;

const containerStyle = {
  width: '100%',
  maxWidth: '600px',
  margin: '0 auto',
  padding: '32px', // spacing[8]
  backgroundColor: '#ffffff', // palette.card
  borderRadius: '16px',
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
} as const;

const contentSectionStyle = {
  paddingTop: '24px', // spacing[6]
  paddingBottom: '24px', // spacing[6]
} as const;
```

**Color Reference** (from globals.css):

- Light theme background: `#ffffff`
- Light theme foreground: `#37352f`
- Light theme card: `#ffffff`
- Light theme primary: `#2e3440`
- Light theme border: `#e9e5e2`

#### 3. `email-header.component.tsx`

**Current Usage**:

```typescript
import { colors, spacing, typography } from '@/lib/design-system';

const palette = colors.light;

const containerStyle = {
  borderBottom: `1px solid ${palette.border}`,
  paddingBottom: spacing[4],
} as const;

const brandStyle = {
  color: palette.primary,
  fontSize: typography.fontSizes.lg,
  fontWeight: typography.fontWeights.semibold,
  letterSpacing: typography.letterSpacing.tight,
  margin: '0 0 8px 0',
} as const;

const headingStyle = {
  margin: '0',
  fontSize: typography.fontSizes['2xl'],
  fontWeight: typography.fontWeights.bold,
  lineHeight: typography.lineHeights.relaxed,
  color: palette.foreground,
} as const;
```

**Migration Strategy**: Similar to above - replace all token references with hardcoded values.

**Migrated Code**:

```typescript
import { cn } from '@/lib/utils';

const containerStyle = {
  borderBottom: '1px solid #e9e5e2',
  paddingBottom: '16px', // spacing[4]
} as const;

const brandStyle = {
  color: '#2e3440', // primary
  fontSize: '18px', // lg
  fontWeight: 600, // semibold
  letterSpacing: '-0.025em', // tight
  margin: '0 0 8px 0',
} as const;

const headingStyle = {
  margin: '0',
  fontSize: '24px', // 2xl
  fontWeight: 700, // bold
  lineHeight: 1.625, // relaxed
  color: '#37352f', // foreground
} as const;
```

#### 4. `email-footer.component.tsx`

**Current Usage**:

```typescript
import { colors, spacing, typography } from '@/lib/design-system';

const palette = colors.light;

const containerStyle = {
  borderTop: `1px solid ${palette.border}`,
  paddingTop: spacing[4],
} as const;

const supportStyle = {
  margin: '0',
  fontSize: typography.fontSizes.sm,
  color: palette['muted-foreground'],
  lineHeight: typography.lineHeights.relaxed,
} as const;

const signatureStyle = {
  margin: '12px 0 0 0',
  fontSize: typography.fontSizes.base,
  fontWeight: typography.fontWeights.medium,
  color: palette.foreground,
} as const;
```

**Migration Strategy**: Replace all token references with hardcoded values.

**Migrated Code**:

```typescript
import { cn } from '@/lib/utils';

const containerStyle = {
  borderTop: '1px solid #e9e5e2',
  paddingTop: '16px', // spacing[4]
} as const;

const supportStyle = {
  margin: '0',
  fontSize: '14px', // sm
  color: '#787066', // muted-foreground
  lineHeight: 1.625, // relaxed
} as const;

const signatureStyle = {
  margin: '12px 0 0 0',
  fontSize: '16px', // base
  fontWeight: 500, // medium
  color: '#37352f', // foreground
} as const;
```

### Email Templates Testing

After migration, MUST test all email templates:

```bash
pnpm preview:emails
```

**Templates to verify**:

1. `welcome-signup.template.tsx`
2. `password-reset.template.tsx`
3. `email-change-confirmation.template.tsx`
4. `password-changed.template.tsx`
5. `team-invitation.template.tsx`
6. `subscription-created.template.tsx`
7. `payment-failed.template.tsx`

**Verification checklist per template**:

- [ ] Layout renders correctly
- [ ] Colors match design system
- [ ] Typography is consistent
- [ ] Spacing is correct
- [ ] CTA button looks proper
- [ ] Links are styled correctly
- [ ] Header and footer render properly

## Inline Styles vs Tailwind Classes

### CSSProperties Objects Pattern

Several files use `CSSProperties` objects for inline styles with design system tokens:

**Pattern Found In**:

- `/components/marketing/features/feature-card.component.tsx`
- `/components/marketing/features/feature-detail.component.tsx`
- `/app/(public)/features/page.tsx`
- `/app/(public)/features/[slug]/page.tsx`

**Example**:

```typescript
import type { CSSProperties } from 'react';
import { notionSpacing } from '@/lib/design-system';

const listStyles: CSSProperties = {
  gap: notionSpacing.elementGap,
};

// Used as:
<ul style={listStyles}>...</ul>
```

**Migration Strategy**:

**Option 1**: Convert to Tailwind classes (Recommended)

```typescript
// Before
<ul style={{ gap: notionSpacing.elementGap }}>...</ul>

// After
<ul className="flex flex-col gap-4">...</ul>
```

**Option 2**: Use CSS custom properties in inline styles

```typescript
// If Tailwind classes can't be used
<ul style={{ gap: 'var(--spacing-4)' }}>...</ul>
```

**Option 3**: Hardcode pixel values

```typescript
// Last resort
<ul style={{ gap: '16px' }}>...</ul>
```

### When to Keep Inline Styles

Keep inline styles when:

1. **Email templates** - Required for email client compatibility
2. **Dynamic values** - Styles that change based on runtime data
3. **CSS custom properties** - When using `var(--*)` directly
4. **Animation values** - Dynamic animation delays or durations
5. **Third-party library requirements** - When a library expects inline styles

**Example from codebase** (animation delay):

```typescript
<li
  style={{
    ...listItemStyles,
    transitionDelay: `${index * 50}ms`, // Dynamic - must stay inline
  }}
>
```

## Dynamic Class Generation

### Pattern Analysis

**File**: `/components/layout/content-container.tsx`

This file uses dynamic class generation based on props:

```typescript
const baseClasses = cn(
  'mx-auto w-full',
  containerWidths[maxWidth], // Dynamic Tailwind class
  containerPadding[padding] // Dynamic Tailwind class
);
```

**Migration Strategy**:

- Create local mapping objects that return Tailwind class strings
- Maintain the same prop-based API
- Ensure type safety with TypeScript

**See Phase 4 of the main implementation plan for detailed migration**.

## TypeScript Type Dependencies

### Types Imported from Design System

**File**: `/components/layout/content-container.tsx`

**Current imports**:

```typescript
import type {
  ContainerWidth,
  ContainerPadding,
  GridCols,
  GridGap,
} from '@/lib/design-system';
```

**Migration Strategy**:

- Define these types locally in the component file
- Remove dependency on design system types
- Maintain backward compatibility

**Example**:

```typescript
type ContainerWidth =
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl'
  | '7xl'
  | 'full'
  | 'screen';

type ContainerPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
```

## Dark Mode Considerations

### Color Handling

All color usage must work in both light and dark modes:

**Bad** (hardcoded light theme):

```typescript
style={{ color: '#2e3440' }} // Only works in light mode
```

**Good** (theme-aware):

```typescript
className = 'text-primary'; // Auto-switches with theme
```

**Acceptable** (CSS custom property):

```typescript
style={{ color: 'var(--color-primary)' }} // Auto-switches with theme
```

### Email Templates Exception

Email templates only use light theme colors (emails don't support dark mode in most clients). This is acceptable.

## Browser Compatibility

### CSS Custom Properties

All modern browsers support CSS custom properties:

- Chrome/Edge 49+
- Firefox 31+
- Safari 9.1+

**No concerns for this migration**.

### Color-mix() Function

For opacity/transparency, we may use `color-mix()`:

```typescript
backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)';
```

**Browser support**:

- Chrome/Edge 111+
- Firefox 113+
- Safari 16.2+

**Recommendation**: Only use `color-mix()` if existing codebase already uses it. Otherwise, use Tailwind opacity modifiers.

## Testing Strategy for Edge Cases

### Email Templates

1. Run `pnpm preview:emails`
2. Visual inspection of all templates
3. Check rendering in email clients (optional but recommended)

### Inline Styles

1. Browser DevTools inspection
2. Verify computed styles match expectations
3. Test dynamic values (animation delays, etc.)

### Dynamic Classes

1. Test all prop combinations for `ContentContainer`
2. Verify TypeScript autocomplete works
3. Check responsive layouts

### Dark Mode

1. Toggle dark mode for all pages
2. Verify color switches work
3. Check for any hardcoded colors

### Browser Testing

1. Test in Chrome, Firefox, Safari
2. Check responsive breakpoints
3. Verify focus states and interactions

## Value Reference Tables

### Spacing Values

| Token        | Pixel Value | Tailwind Class |
| ------------ | ----------- | -------------- |
| `spacing[2]` | 8px         | `p-2`, `gap-2` |
| `spacing[3]` | 12px        | `p-3`, `gap-3` |
| `spacing[4]` | 16px        | `p-4`, `gap-4` |
| `spacing[5]` | 20px        | `p-5`, `gap-5` |
| `spacing[6]` | 24px        | `p-6`, `gap-6` |
| `spacing[8]` | 32px        | `p-8`, `gap-8` |

### Typography Values

| Token                             | Value    | CSS Property               |
| --------------------------------- | -------- | -------------------------- |
| `typography.fontSizes.sm`         | 14px     | `font-size: 14px`          |
| `typography.fontSizes.base`       | 16px     | `font-size: 16px`          |
| `typography.fontSizes.lg`         | 18px     | `font-size: 18px`          |
| `typography.fontSizes['2xl']`     | 24px     | `font-size: 24px`          |
| `typography.fontSizes['3xl']`     | 30px     | `font-size: 30px`          |
| `typography.fontSizes['4xl']`     | 36px     | `font-size: 36px`          |
| `typography.fontWeights.medium`   | 500      | `font-weight: 500`         |
| `typography.fontWeights.semibold` | 600      | `font-weight: 600`         |
| `typography.fontWeights.bold`     | 700      | `font-weight: 700`         |
| `typography.lineHeights.tight`    | 1.25     | `line-height: 1.25`        |
| `typography.lineHeights.relaxed`  | 1.625    | `line-height: 1.625`       |
| `typography.letterSpacing.tight`  | -0.025em | `letter-spacing: -0.025em` |

### Color Values (Light Theme)

| Token                                | Hex/HSL Value |
| ------------------------------------ | ------------- |
| `colors.light.background`            | `#ffffff`     |
| `colors.light.foreground`            | `#37352f`     |
| `colors.light.card`                  | `#ffffff`     |
| `colors.light.primary`               | `#2e3440`     |
| `colors.light['primary-foreground']` | `#ffffff`     |
| `colors.light.border`                | `#e9e5e2`     |
| `colors.light['muted-foreground']`   | `#787066`     |

## Risk Mitigation

### High Risk Areas

1. **Email templates** - Inline styles required, testing critical
2. **Dynamic class generation** - Complex logic, type safety important
3. **Animation timing** - Dynamic inline styles must remain

### Medium Risk Areas

1. **CSSProperties objects** - Multiple files, consistent pattern
2. **Dark mode colors** - Must verify theme switching works
3. **Responsive layouts** - Custom grid utilities need testing

### Low Risk Areas

1. **Simple cn imports** - Straightforward path change
2. **Border radius** - Direct class replacements
3. **Static spacing** - Easy to convert to Tailwind classes

## Recommendations

1. **Test email templates first** - They're the highest risk
2. **Keep inline styles where necessary** - Don't force Tailwind classes for dynamic values
3. **Use CSS custom properties** - When Tailwind classes aren't suitable
4. **Maintain type safety** - Define local types when removing design system imports
5. **Document exceptions** - Note any deviations from standard migration pattern
