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
// Migration example - OLD approach
import { cn, notionRadius, colors } from '@/lib/design-system';

// NEW approach
import { cn } from '@/lib/utils';
// Use Tailwind utilities directly instead of notionRadius/colors
```

## References

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS v4 Theme Configuration](https://tailwindcss.com/docs/theme)
- [Tailwind CSS v4 Custom Utilities](https://tailwindcss.com/docs/adding-custom-styles)
- [Next.js with Tailwind CSS](https://nextjs.org/docs/app/building-your-application/styling/tailwind-css)
