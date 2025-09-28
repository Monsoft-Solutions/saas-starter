# Navigation Configuration Guide

The navigation system centralizes page metadata in `config/navigation.ts` so the marketing header, app sidebar, command palette, and middleware all stay in sync. This document explains how to add destinations, control visibility, and change the authenticated app slug.

## 1. Adding Pages to Navigation

1. **Create the route file** under the appropriate app directory:
   - Public marketing pages live in `app/(public)`.
   - Authenticated product pages live in `app/(app)`.
2. **Register the page** inside `config/navigation.ts` by adding a `NavigationItem` entry to either `marketingNav.items` or `appNav.items`.
3. **Reference the page in code** by calling `resolveRoute('tree.key')`. This keeps links stable even if slugs change later.

Each navigation item requires a unique `key`, plus a `slug` that is relative to the tree's `basePath`. Nested sections can be formed by providing a `children` array. Icons use Lucide components and are optional.

```ts
// Example: app/(app)/reports/page.tsx
appNav.items.push({
  key: 'app.reports',
  slug: 'reports',
  label: 'Reports',
  description: 'View analytics dashboards',
  icon: BarChart,
});
```

Once the item is in the tree, the sidebar and command palette pick it up automatically, and middleware treats the resolved path as protected.

## 2. Toggling Visibility

`NavigationItem` supports a few fields to hide items without deleting them:

- `hidden: true` removes the item entirely but keeps the definition in code.
- `featureFlag: 'flagName'` shows the item only when the provided flag is `true` in `filterNavigationItems(featureFlags)`.
- `roles` / `scopes` let you implement custom guards in your UI (e.g., filter client-side by the signed-in user's capabilities).

The helper `filterNavigationItems` preserves nested items and automatically drops empty groups, so most consumers can use it directly when applying feature flags.

## 3. Managing Quick Actions

Shortcuts for the command palette live in the `quickActions` array alongside the tree definitions. Each action points to the navigation `key` it should open via the `target` property. Add or remove actions here to keep search, keyboard shortcuts, and navigation aligned.

## 4. Changing the App Slug

The authenticated experience is rooted at the slug defined by `APP_BASE_PATH` in `config/navigation.ts`. To rename `/app` to something like `/workspace`:

1. Update `export const APP_BASE_PATH = '/workspace';`.
2. Adjust any hard-coded references if present (search for the old slug to confirm none remain).
3. Deploy.

Because `appNav.basePath` and `appProtectedRoutePrefixes` both derive from `APP_BASE_PATH`, the sidebar, route helpers, and middleware automatically track the new slug. Auth redirects that use `resolveRoute('app.organization')` or other keys continue to work without additional changes.

## 5. Testing Checklist

- Verify new links appear in the marketing header or app sidebar as expected.
- Confirm the command palette resolves the added key and opens the correct route.
- Sign out and try visiting the new app path directly; middleware should redirect to the sign-in screen.
- When toggling visibility or feature flags, ensure there are no empty section headers left behind.
