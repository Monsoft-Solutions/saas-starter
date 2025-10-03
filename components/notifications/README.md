# Notification System - Client Components

This directory contains all client-side UI components for the in-app notification system.

## Overview

The notification system provides a comprehensive user experience for displaying, managing, and interacting with in-app notifications. It uses SWR for polling (every 30 seconds) and includes toast notifications for real-time feedback.

## Architecture

```
NotificationProvider (Context + SWR polling)
    ├── NotificationBell (Header component)
    │   └── NotificationCenter (Popover)
    │       ├── NotificationFilters (Category tabs)
    │       ├── NotificationItem (Individual notification)
    │       └── NotificationEmpty (Empty state)
    └── Toast Notifications (New notification alerts)
```

## Components

### NotificationProvider

**File:** `notification-provider.component.tsx`

Wraps the application with notification state management. Handles:

- SWR polling every 30 seconds
- Revalidation on window focus and reconnect
- Toast notifications for new items
- React Context for sharing state

**Usage:**

```tsx
import { NotificationProvider } from '@/components/notifications';

<NotificationProvider>{children}</NotificationProvider>;
```

### NotificationBell

**File:** `notification-bell.component.tsx`

Bell icon with badge count in the app header. Features:

- Animated badge for new notifications
- Popover dropdown for notification center
- Keyboard navigation (Escape to close)
- Pulse animation on new notifications

**Usage:**

```tsx
import { NotificationBell } from '@/components/notifications';

<PageHeader showNotifications={true} />
// or directly:
<NotificationBell />
```

### NotificationCenter

**File:** `notification-center.component.tsx`

Main notification feed displayed in a popover. Features:

- Grouped by time (Today, Yesterday, This Week, Earlier)
- Category filters
- Mark all as read button
- Scrollable list with max height

### NotificationItem

**File:** `notification-item.component.tsx`

Individual notification display. Features:

- Category icon and colors
- Priority badges (critical, important, info)
- Read/unread states with visual indicators
- Action buttons from metadata
- Dismiss functionality
- Relative timestamps

### NotificationFilters

**File:** `notification-filters.component.tsx`

Category filter tabs. Features:

- All categories filter
- Individual category tabs
- Active state indication

### NotificationEmpty

**File:** `notification-empty.component.tsx`

Empty state when no notifications exist.

## Hooks

### useNotifications

**File:** `use-notifications.hook.ts`

SWR-based hook for notification data and actions.

**Returns:**

```typescript
{
  notifications: Notification[];
  unreadCount: number;
  pagination: { limit, offset, hasMore };
  isLoading: boolean;
  error: Error | undefined;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (id: number) => Promise<void>;
  refetch: () => void;
}
```

**Features:**

- Polling every 30 seconds
- Optimistic UI updates
- Automatic revalidation on focus/reconnect
- Error handling with rollback

### useNotificationContext

**File:** `notification-provider.component.tsx`

Access notification context from any child component.

**Usage:**

```tsx
import { useNotificationContext } from '@/components/notifications';

function MyComponent() {
  const { notifications, unreadCount, markAsRead } = useNotificationContext();
  // ...
}
```

## Integration

### 1. Wrap App with Provider

Add to `/app/(app)/layout.tsx`:

```tsx
import { NotificationProvider } from '@/components/notifications';

export default function AppLayout({ children }) {
  return (
    <SWRProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </SWRProvider>
  );
}
```

### 2. Add Toaster for Toast Notifications

Add to `/app/(app)/app/layout.tsx`:

```tsx
import { Toaster } from '@/components/ui/sonner';

export default function DashboardLayout({ children }) {
  return (
    <div>
      {children}
      <Toaster />
    </div>
  );
}
```

### 3. Enable Notification Bell

In page header or navbar:

```tsx
<PageHeader showNotifications={true} />
```

## Styling

All components use the design system from `/lib/design-system/`:

- Colors: Design system tokens
- Spacing: `notionSpacing` constants
- Radius: `notionRadius` constants
- Typography: Design system typography scale

Components are fully responsive and support dark mode.

## Key Features

### Polling Strategy

- **Interval:** 30 seconds
- **Deduplication:** 10 seconds
- **Revalidation:** On focus, reconnect
- **Optimistic Updates:** Instant UI feedback

### Notification Grouping

Notifications are grouped by time periods:

1. **Today** - Notifications from today
2. **Yesterday** - Notifications from yesterday
3. **This Week** - Notifications from this week (excluding today/yesterday)
4. **Earlier** - All older notifications

### Category Icons

Each category has a unique icon:

- System: Bell
- Security: Lock
- Billing: CreditCard
- Team: Users
- Activity: AlertCircle
- Product: Package

### Priority Badges

Visible badges for important notifications:

- **Critical:** Red badge with AlertCircle icon
- **Important:** Default badge with AlertTriangle icon
- **Info:** No badge (default state)

### Optimistic Updates

All actions (mark as read, dismiss) update the UI immediately and rollback on error:

```typescript
// Optimistic update
await mutate(updatedData, false);

// Server update
try {
  await serverAction();
} catch (error) {
  // Rollback on error
  await mutate();
}
```

## API Integration

### Endpoints Used

- `GET /api/notifications` - Fetch notifications
- `GET /api/notifications/unread-count` - Get unread count (included in main response)

### Server Actions Used

- `markAsReadAction({ notificationId })`
- `markAllAsReadAction()`
- `dismissNotificationAction({ notificationId })`

## Accessibility

- ARIA labels for screen readers
- Keyboard navigation support
- Focus management in popover
- Semantic HTML structure
- Color contrast compliance

## Performance

- SWR automatic deduplication prevents unnecessary requests
- Optimistic updates provide instant feedback
- Virtual scrolling for large notification lists (via ScrollArea)
- Lazy loading with pagination support
- Memoized computed values (grouping, filtering)

## Testing Recommendations

### Manual Testing

1. **Polling:** Keep browser open and create a notification from another tab/device
2. **Toast:** New notifications should show toast after polling interval
3. **Mark as Read:** Click notification, verify visual state changes
4. **Mark All as Read:** Click button, verify all notifications marked
5. **Dismiss:** Click X button, verify notification removed
6. **Filters:** Switch categories, verify filtering works
7. **Grouping:** Check time-based grouping is correct
8. **Actions:** Click action buttons, verify navigation
9. **Empty State:** Dismiss all notifications, verify empty state
10. **Keyboard:** Press Escape to close popover

### Unit Testing

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { NotificationBell } from './notification-bell.component';

test('shows unread count badge', async () => {
  render(
    <NotificationProvider>
      <NotificationBell />
    </NotificationProvider>
  );

  await waitFor(() => {
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Notifications not appearing

1. Check NotificationProvider is wrapping the app
2. Verify SWR is installed and configured
3. Check API endpoint returns correct data format
4. Inspect network tab for polling requests

### Toast not showing

1. Verify Toaster component is added to layout
2. Check sonner is installed (`pnpm list sonner`)
3. Ensure NotificationProvider is configured correctly

### Polling not working

1. Check browser console for errors
2. Verify refreshInterval is set correctly (30000ms)
3. Check network tab for periodic requests
4. Ensure user is authenticated

### Optimistic updates failing

1. Check server actions are imported correctly
2. Verify authentication is working
3. Inspect console for action errors
4. Check rollback logic is triggered

## Dependencies

- `swr` - Data fetching and polling
- `date-fns` - Date formatting
- `sonner` - Toast notifications
- `lucide-react` - Icons
- `@radix-ui/react-popover` - Popover component (via shadcn)
- `@radix-ui/react-tabs` - Tabs component (via shadcn)

## Future Enhancements

- [ ] Real-time delivery (WebSocket/SSE) when needed
- [ ] Infinite scroll/pagination for long lists
- [ ] Notification preferences UI
- [ ] Search/filter by content
- [ ] Keyboard shortcuts (arrow keys navigation)
- [ ] Notification sounds
- [ ] Push notifications (Web Push API)
- [ ] Notification archiving
- [ ] Bulk actions (select multiple)

## Related Documentation

- [Implementation Plan](../../implementation-plans/2025-09-30-in-app-notifications-implementation-plan.md)
- [Notification Types](../../lib/types/notifications/)
- [API Routes](../../app/api/notifications/)
- [Server Actions](../../app/actions/notifications/)
