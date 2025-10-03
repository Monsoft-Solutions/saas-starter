# Design System Migration - Visual Regression Testing Checklist

**Date**: October 3, 2025
**Purpose**: Document visual state before migration for comparison

## Screenshot Directory Structure

Create the following directories:

```bash
mkdir -p migration-screenshots/before/light
mkdir -p migration-screenshots/before/dark
mkdir -p migration-screenshots/after/light
mkdir -p migration-screenshots/after/dark
```

## Pages to Screenshot

### Public Pages

#### 1. Features Page (`/features`)

**Files**:

- `/app/(public)/features/page.tsx`
- `/components/marketing/features/feature-card.component.tsx`

**What to capture**:

- [ ] Light mode - Full page
- [ ] Dark mode - Full page
- [ ] Light mode - Hero section closeup
- [ ] Dark mode - Hero section closeup
- [ ] Light mode - Feature cards grid
- [ ] Dark mode - Feature cards grid
- [ ] Light mode - Single feature card hover state
- [ ] Dark mode - Single feature card hover state

**Critical elements using design system**:

- Feature card border radius (`notionRadius.cardLarge`)
- Badge border radius (`notionRadius.badge`)
- Spacing between elements (`notionSpacing.*`)
- Check icon colors (`themeUtils.getColorValue('primary')`)
- Bullet point colors

#### 2. Feature Detail Page (`/features/[slug]`)

**Example URL**: `/features/authentication` (or any valid slug)

**Files**:

- `/app/(public)/features/[slug]/page.tsx`
- `/components/marketing/features/feature-detail.component.tsx`

**What to capture**:

- [ ] Light mode - Full page
- [ ] Dark mode - Full page
- [ ] Light mode - Content sections
- [ ] Dark mode - Content sections

**Critical elements**:

- Section spacing (`notionSpacing.sectionGap`)
- Card padding (`notionSpacing.cardPaddingLarge`)
- Element gaps

### Protected App Pages

#### 3. Dashboard (`/app`)

**Files**:

- `/app/(app)/app/layout.tsx`
- `/components/layout/sidebar-nav.tsx`
- `/components/layout/page-header.tsx`
- `/components/layout/breadcrumb-nav.tsx`

**What to capture**:

- [ ] Light mode - Full dashboard
- [ ] Dark mode - Full dashboard
- [ ] Light mode - Sidebar expanded
- [ ] Dark mode - Sidebar expanded
- [ ] Light mode - Sidebar collapsed (if applicable)
- [ ] Dark mode - Sidebar collapsed (if applicable)
- [ ] Light mode - Page header
- [ ] Dark mode - Page header

**Critical elements**:

- Sidebar padding (`notionSpacing.sidebarPadding`)
- Navigation items
- Breadcrumbs

#### 4. Notification Center

**Files**:

- `/components/notifications/notification-center.component.tsx`
- `/components/notifications/notification-bell.component.tsx`
- `/components/notifications/notification-item.component.tsx`

**What to capture**:

- [ ] Light mode - Notification bell (closed)
- [ ] Dark mode - Notification bell (closed)
- [ ] Light mode - Notification center (opened, empty state)
- [ ] Dark mode - Notification center (opened, empty state)
- [ ] Light mode - Notification center (with notifications)
- [ ] Dark mode - Notification center (with notifications)
- [ ] Light mode - Single notification item (unread)
- [ ] Dark mode - Single notification item (unread)
- [ ] Light mode - Single notification item (read)
- [ ] Dark mode - Single notification item (read)
- [ ] Light mode - Notification item hover state
- [ ] Dark mode - Notification item hover state

**Critical elements**:

- Icon container border radius (`notionRadius.default`)
- Card styling
- Read/unread states
- Hover effects

#### 5. Pricing Page (if accessible)

**Files**:

- `/components/payments/pricing-card.tsx`
- `/components/payments/pricing-toggle.tsx`

**What to capture**:

- [ ] Light mode - Full pricing page
- [ ] Dark mode - Full pricing page
- [ ] Light mode - Pricing cards
- [ ] Dark mode - Pricing cards
- [ ] Light mode - Toggle component
- [ ] Dark mode - Toggle component

### Component-Specific Screenshots

#### 6. Layout Components

**Files**:

- `/components/layout/loading-states.tsx`
- `/components/layout/empty-state.tsx`
- `/components/layout/content-container.tsx`

**What to capture**:

- [ ] Light mode - Loading states
- [ ] Dark mode - Loading states
- [ ] Light mode - Empty states
- [ ] Dark mode - Empty states
- [ ] Light mode - Content container variants (if visible on any page)
- [ ] Dark mode - Content container variants

#### 7. Marketing Components

**Files**:

- `/components/marketing/floating-card.component.tsx`
- `/components/marketing/scroll-reveal.component.tsx`
- `/components/marketing/stats-counter.component.tsx`
- `/components/marketing/animated-word-swap.component.tsx`

**What to capture** (if these components are visible on any page):

- [ ] Light mode - Floating card
- [ ] Dark mode - Floating card
- [ ] Light mode - Scroll reveal components
- [ ] Dark mode - Scroll reveal components
- [ ] Light mode - Stats counter
- [ ] Dark mode - Stats counter
- [ ] Light mode - Animated word swap
- [ ] Dark mode - Animated word swap

## Email Templates

**Files**:

- All files in `/lib/emails/templates/`
- All files in `/lib/emails/templates/components/`

### How to Capture Email Screenshots

1. Start the email preview server:

   ```bash
   pnpm preview:emails
   ```

2. Navigate to the preview URL (typically `http://localhost:3000/`)

3. Capture screenshots of each email template:

**Templates to capture**:

- [ ] Welcome signup email
- [ ] Password reset email
- [ ] Email change confirmation
- [ ] Password changed notification
- [ ] Team invitation email
- [ ] Subscription created email
- [ ] Payment failed email

**For each template, capture**:

- [ ] Full email view
- [ ] CTA button closeup (uses `notionRadius.button`)
- [ ] Header section
- [ ] Footer section

**Critical elements**:

- Button border radius
- Email layout spacing
- Color consistency

## Browser Testing

Capture screenshots in multiple browsers to ensure consistency:

**Browsers**:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest) - optional but recommended

**Note**: Focus on Chrome for initial "before" screenshots, then test all browsers after migration.

## Responsive Breakpoints

For key pages, capture at different viewport sizes:

**Viewports**:

- [ ] Mobile - 375px width (iPhone SE)
- [ ] Tablet - 768px width (iPad)
- [ ] Desktop - 1440px width (standard laptop)
- [ ] Large Desktop - 1920px width

**Pages to test responsively**:

- Features page (`/features`)
- Dashboard (`/app`)
- Pricing page

## Screenshot Naming Convention

Use this naming pattern for consistency:

```
{page-name}_{element}_{mode}_{browser}_{viewport}.png
```

**Examples**:

- `features_hero_light_chrome_desktop.png`
- `features_card-grid_dark_chrome_desktop.png`
- `dashboard_sidebar_light_chrome_desktop.png`
- `notifications_item-unread_dark_chrome_mobile.png`
- `email_welcome_full.png`
- `email_cta-button_closeup.png`

## Critical Visual Elements to Verify

When reviewing screenshots, pay special attention to:

### Border Radius

- [ ] All cards have consistent corner rounding
- [ ] Badges have appropriate rounding
- [ ] Buttons have consistent rounding
- [ ] Icon containers have proper rounding
- [ ] Notification items have proper rounding

### Spacing

- [ ] Section gaps are consistent
- [ ] Element gaps within components
- [ ] Card padding (internal spacing)
- [ ] Grid gaps between cards
- [ ] Sidebar padding

### Colors

- [ ] Primary color usage (buttons, links, accents)
- [ ] Icon colors (check marks, bullets)
- [ ] Text colors (foreground, muted)
- [ ] Background colors (cards, surfaces)
- [ ] Border colors
- [ ] Hover state colors

### Typography

- [ ] Font sizes match design system
- [ ] Line heights are consistent
- [ ] Letter spacing is correct
- [ ] Font weights are proper

### Shadows

- [ ] Card shadows
- [ ] Hover shadows
- [ ] Focus shadows

## Screenshot Tools

**Recommended tools**:

- Browser DevTools (F12) - Built-in screenshot tool
- Full Page Screen Capture (Chrome extension)
- Awesome Screenshot (Cross-browser extension)
- Manual OS screenshot tool (Cmd+Shift+4 on Mac, Win+Shift+S on Windows)

**Browser DevTools Screenshot**:

1. Open DevTools (F12)
2. Open Command Palette (Cmd+Shift+P or Ctrl+Shift+P)
3. Type "screenshot"
4. Choose "Capture full size screenshot" or "Capture screenshot"

## Post-Screenshot Tasks

After taking all "before" screenshots:

1. **Organize**: Ensure all screenshots are in the correct `migration-screenshots/before/` subdirectories
2. **Review**: Quickly review screenshots to ensure they're clear and complete
3. **Document missing**: Note any pages/components that couldn't be captured
4. **Backup**: Consider committing screenshots to a separate branch or external storage

## After Migration

Repeat this entire checklist after the migration is complete, saving all screenshots to `migration-screenshots/after/` subdirectories.

Then use an image comparison tool or manual review to verify:

- Zero visual differences (or only intended differences)
- No layout shifts
- No color changes
- No spacing changes
- No typography changes

## Notes

- Take screenshots at 100% zoom level (no browser zoom)
- Disable browser extensions that might affect rendering
- Use consistent window sizes across screenshots
- Capture hover states by using browser DevTools to force :hover pseudo-class
- For animations, capture the final state
- If a component isn't visible on any page, note it in the inventory
