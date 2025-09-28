# Design System Tokens

The design system relies on CSS custom properties declared in `app/globals.css` and mirrored here for quick reference. Each token is available via Tailwind utilities (e.g. `bg-primary`) and through the theme helpers (`themeUtils.getColorValue('primary')`).

## Color Tokens

| Token                                    | Purpose                        | Light Theme                                           | Dark Theme                                            |
| ---------------------------------------- | ------------------------------ | ----------------------------------------------------- | ----------------------------------------------------- |
| `background`                             | App background                 | `#ffffff`                                             | `#1e1b18`                                             |
| `foreground`                             | Default text                   | `#37352f`                                             | `#fdfcfb`                                             |
| `card` / `card-foreground`               | Surfaces like cards and modals | `#ffffff` / `#37352f`                                 | `#292521` / `#fdfcfb`                                 |
| `popover` / `popover-foreground`         | Popovers, tooltips             | `#ffffff` / `#37352f`                                 | `#292521` / `#fdfcfb`                                 |
| `primary` / `primary-foreground`         | Primary actions                | `#4f7399` / `#ffffff`                                 | `#87abcf` / `#1e1b18`                                 |
| `secondary` / `secondary-foreground`     | Secondary surfaces             | `#fbfaf9` / `#37352f`                                 | `#292521` / `#fdfcfb`                                 |
| `muted` / `muted-foreground`             | Muted backgrounds and text     | `#fbfaf9` / `#6b6761`                                 | `#292521` / `#a8a29e`                                 |
| `accent` / `accent-foreground`           | Accent blocks and chips        | `#f8f7f5` / `#37352f`                                 | `#332e2a` / `#fdfcfb`                                 |
| `destructive` / `destructive-foreground` | Destructive actions            | `#c2504c` / `#ffffff`                                 | `#dc7874` / `#1e1b18`                                 |
| `success` / `success-foreground`         | Success messaging              | `#668771` / `#ffffff`                                 | `#86a791` / `#1e1b18`                                 |
| `warning` / `warning-foreground`         | Warning messaging              | `#b78e59` / `#ffffff`                                 | `#cfae79` / `#1e1b18`                                 |
| `border`                                 | Default border color           | `#edebe9`                                             | `#332e2a`                                             |
| `input`                                  | Inputs and field chrome        | `#edebe9`                                             | `#332e2a`                                             |
| `ring`                                   | Focus ring color               | `#4f7399`                                             | `#87abcf`                                             |
| `chart-1` … `chart-5`                    | Data visualisation palette     | `#4f7399`, `#668771`, `#b78e59`, `#c2504c`, `#87abcf` | `#87abcf`, `#86a791`, `#cfae79`, `#dc7874`, `#4f7399` |
| `sidebar-*`                              | Sidebar surfaces               | see values in `lib/design-system/tokens/colors.ts`    | see values in `lib/design-system/tokens/colors.ts`    |

## Utilities

- Use `themeUtils.getColorValue('primary')` or `themeUtils.getColorWithOpacity('primary', 0.2)` inside CSS-in-JS if a raw variable is needed.
- Tailwind utilities (e.g. `bg-primary`, `text-muted-foreground`) automatically point at the same token names.
- Custom utilities exposed in `app/globals.css`:
  - `page-container` &rarr; centers content with 80 rem max-width and horizontal padding.
  - `stack-md` &rarr; vertical flex stack with a 1.5 rem gap.
- Run `pnpm verify:design-tokens` after adding or renaming tokens to confirm CSS variables and TypeScript stay in sync.

Keep this document in sync when adding or renaming tokens.

## Dark Mode QA Checklist

- Capture before/after screenshots in both light and dark themes for marketing, auth, pricing, and error screens; store them alongside the feature branch for quick review.
- Keyboard test all primary actions (buttons, links, form controls) to confirm focus-visible states render with the `ring` token and remain legible against the background.
- Spot-check text and icon contrast using the browser DevTools contrast checker; target WCAG AA (4.5:1 for body copy, 3:1 for large headings and UI icons).
- Verify semantic backgrounds (`bg-card`, `bg-muted`, `bg-secondary`) switch correctly when toggling the `.dark` class and no raw gray/white utilities remain.
- Exercise interactive surfaces (modals, dropdowns, toasts) to ensure token-driven borders and shadows appear in dark mode without unintended outlines.
