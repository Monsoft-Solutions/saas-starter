# Type-Safe API Client Guide

This guide explains how to use the centralized, type-safe API infrastructure for making HTTP requests in the SaaS Starter application.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Making API Requests](#making-api-requests)
- [Using Hooks](#using-hooks)
- [Cache Management](#cache-management)
- [Creating New APIs](#creating-new-apis)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Architecture Overview

The API infrastructure consists of four main layers:

1. **Route Registry** (`lib/api/routes.config.ts`) - Central source of truth for all API routes
2. **API Client** (`lib/api/client.util.ts`) - Type-safe HTTP client with validation
3. **SWR Hooks** (`lib/hooks/api/use-api.hook.ts`) - React hooks for data fetching
4. **Domain Hooks** (`lib/hooks/api/*/`) - Feature-specific hooks with business logic

### Benefits

- ✅ **Full type safety** - Request/response types inferred from Zod schemas
- ✅ **Automatic validation** - Input and output validation at boundaries
- ✅ **Centralized routing** - Single source of truth for all API endpoints
- ✅ **Built-in caching** - SWR-powered caching and revalidation
- ✅ **Error handling** - Standardized error responses with ApiError
- ✅ **Request deduplication** - Automatic deduplication of concurrent requests

## Making API Requests

### Direct API Requests

For one-off requests or server-side usage, use `apiRequest`:

```typescript
import { apiRequest } from '@/lib/api/client.util';
import { apiRoutes } from '@/lib/api/routes.config';

// Simple GET request
const notifications = await apiRequest(apiRoutes.notifications.list, {
  queryParams: { limit: 10, offset: 0 },
});

// GET request with path parameters
const notification = await apiRequest(apiRoutes.notifications.get, {
  pathParams: ['notification-123'],
});

// POST request with body
const result = await apiRequest(apiRoutes.notifications.markAllRead, {
  data: {},
});

// PATCH request with path params and body
await apiRequest(apiRoutes.notifications.update, {
  pathParams: ['notification-123'],
  data: { action: 'mark_read' },
});
```

### Using Hooks (Client Components)

For React components, use the SWR-powered hooks:

```typescript
import { useApiQuery, useApiMutation } from '@/lib/hooks/api/use-api.hook';
import { apiRoutes } from '@/lib/api/routes.config';

function NotificationsList() {
  // GET request with automatic caching
  const { data, error, isLoading, mutate } = useApiQuery(
    apiRoutes.notifications.list,
    {
      queryParams: { limit: 10, offset: 0 },
      swrConfig: {
        refreshInterval: 30000, // Poll every 30 seconds
        revalidateOnFocus: true
      }
    }
  );

  // Mutation for POST/PATCH/DELETE
  const { trigger: markAllRead, isMutating } = useApiMutation(
    apiRoutes.notifications.markAllRead,
    {
      onSuccess: () => {
        console.log('Success!');
      },
      revalidateKeys: ['/api/notifications'] // Revalidate notifications list
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.notifications.map(n => (
        <div key={n.id}>{n.message}</div>
      ))}
      <button onClick={() => markAllRead({})} disabled={isMutating}>
        Mark All Read
      </button>
    </div>
  );
}
```

### Conditional Fetching

Only fetch data when certain conditions are met:

```typescript
function UserProfile({ userId }: { userId?: string }) {
  const { data, error, isLoading } = useApiQuery(apiRoutes.users.current, {
    enabled: !!userId, // Only fetch when userId is available
    swrConfig: {
      revalidateOnFocus: false,
    },
  });

  // Request is not made until userId is defined
}
```

## Using Domain Hooks

Domain hooks provide feature-specific interfaces with built-in best practices:

### Notifications

```typescript
import { useNotificationOperations } from '@/lib/hooks/api/notifications/use-notifications.hook';

function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isLoading,
    toggleRead,
    markAllAsRead,
    dismiss,
    refetch
  } = useNotificationOperations({ limit: 20 });

  return (
    <div>
      <h2>Notifications ({unreadCount})</h2>
      <button onClick={markAllAsRead}>Mark All Read</button>
      {notifications.map(notification => (
        <div key={notification.id}>
          <p>{notification.message}</p>
          <button onClick={() => toggleRead(notification.id)}>
            {notification.isRead ? 'Mark Unread' : 'Mark Read'}
          </button>
          <button onClick={() => dismiss(notification.id)}>
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Current User

```typescript
import { useCurrentUser } from '@/lib/hooks/api/users/use-current-user.hook';

function UserProfile() {
  const { data: user, error, isLoading } = useCurrentUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return null;

  return (
    <div>
      <h2>{user.name || user.email}</h2>
      <p>Role: {user.role}</p>
    </div>
  );
}
```

### Admin Hooks

```typescript
import {
  useAdminOrganizations,
  useAdminOrganization,
} from '@/lib/hooks/api/admin/use-admin-organizations.hook';
import { useAdminActivityLogs } from '@/lib/hooks/api/admin/use-admin-activity.hook';
import { useAdminStats } from '@/lib/hooks/api/admin/use-admin-analytics.hook';

// List organizations
const { data: orgs } = useAdminOrganizations({
  search: 'acme',
  limit: 20,
});

// Get single organization with conditional fetching
const { data: org } = useAdminOrganization(orgId, {
  enabled: !!orgId, // Only fetch when orgId is defined
});

// Activity logs
const { data: logs } = useAdminActivityLogs({
  action: 'user.sign_in',
  limit: 50,
});

// Dashboard stats
const { data: stats } = useAdminStats({ period: 'week' });
```

## Cache Management

Use the cache management utilities for advanced caching scenarios:

```typescript
import { useApiCache, getCacheKey } from '@/lib/hooks/api/use-api-cache.hook';
import { apiRoutes } from '@/lib/api/routes.config';

function MyComponent() {
  const cache = useApiCache();

  // Invalidate specific route
  const handleRefresh = () => {
    cache.invalidate(apiRoutes.notifications.list, {
      queryParams: { limit: 10, offset: 0 }
    });
  };

  // Invalidate multiple routes
  const handleRefreshAll = () => {
    cache.invalidateMultiple([
      '/api/notifications',
      '/api/notifications/unread-count'
    ]);
  };

  // Invalidate by pattern
  const handleRefreshAllNotifications = () => {
    cache.invalidatePattern(/^\/api\/notifications/);
  };

  // Prefetch data
  const handlePrefetch = () => {
    cache.prefetch(apiRoutes.users.current);
  };

  // Update cache optimistically
  const handleOptimisticUpdate = () => {
    cache.update(apiRoutes.notifications.list, (current) => ({
      ...current,
      notifications: [...current.notifications, newNotification]
    }));
  };

  // Set cache data directly
  const handleSetCache = () => {
    cache.set(apiRoutes.users.current, userData, {
      revalidate: false // Don't trigger revalidation
    });
  };

  // Get cached data without fetching
  const cachedData = cache.get(apiRoutes.notifications.list);

  // Check if data is cached
  const isCached = cache.has(apiRoutes.notifications.list);

  // Clear entire cache
  const handleClearAll = () => {
    cache.clear();
  };

  return <div>...</div>;
}
```

## Creating New APIs

### 1. Create Response Schema

```typescript
// lib/types/my-feature/my-data-response.schema.ts
import { z } from 'zod';

export const myDataResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    createdAt: z.date(),
  })
  .strict(); // Use .strict() to prevent data leakage

export type MyDataResponse = z.infer<typeof myDataResponseSchema>;
```

### 2. Create Request Schema (if needed)

```typescript
// lib/types/my-feature/my-data-request.schema.ts
import { z } from 'zod';

export const myDataRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export type MyDataRequest = z.infer<typeof myDataRequestSchema>;
```

### 3. Add Route to Registry

```typescript
// lib/api/routes.config.ts
import { myDataResponseSchema } from '@/lib/types/my-feature/my-data-response.schema';
import { myDataRequestSchema } from '@/lib/types/my-feature/my-data-request.schema';

export const apiRoutes = {
  // ... existing routes

  myFeature: {
    list: {
      path: '/api/my-feature',
      method: 'GET',
      responseSchema: myDataResponseSchema,
    } as const satisfies GetRoute<typeof myDataResponseSchema>,

    create: {
      path: '/api/my-feature',
      method: 'POST',
      requestSchema: myDataRequestSchema,
      responseSchema: myDataResponseSchema,
    } as const satisfies MutationRoute<
      typeof myDataRequestSchema,
      typeof myDataResponseSchema
    >,
  },
} as const;
```

### 4. Create Domain Hook

```typescript
// lib/hooks/api/my-feature/use-my-feature.hook.ts
'use client';

import { useApiQuery, useApiMutation } from '../use-api.hook';
import { apiRoutes } from '@/lib/api/routes.config';

export function useMyFeature() {
  const { data, error, isLoading, mutate } = useApiQuery(
    apiRoutes.myFeature.list
  );

  const { trigger: createItem } = useApiMutation(apiRoutes.myFeature.create, {
    onSuccess: () => {
      mutate(); // Revalidate list after creation
    },
    revalidateKeys: ['/api/my-feature'],
  });

  return {
    items: data?.items || [],
    isLoading,
    error,
    createItem,
    refetch: mutate,
  };
}
```

### 5. Use in Components

```typescript
import { useMyFeature } from '@/lib/hooks/api/my-feature/use-my-feature.hook';

function MyFeatureList() {
  const { items, isLoading, error, createItem } = useMyFeature();

  const handleCreate = async () => {
    try {
      await createItem({ name: 'New Item' });
    } catch (error) {
      console.error('Failed to create:', error);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
      <button onClick={handleCreate}>Create</button>
    </div>
  );
}
```

## Best Practices

### 1. Always Use Type-Safe Hooks

❌ **Don't** use raw `fetch`:

```typescript
const response = await fetch('/api/notifications');
const data = await response.json(); // No type safety
```

✅ **Do** use hooks or `apiRequest`:

```typescript
const { data } = useApiQuery(apiRoutes.notifications.list);
// data is fully typed!
```

### 2. Use Domain Hooks for Feature Logic

❌ **Don't** duplicate logic across components:

```typescript
function Component1() {
  const { data, mutate } = useApiQuery(apiRoutes.notifications.list);
  const handleMarkRead = async (id) => {
    await apiRequest(apiRoutes.notifications.update, {
      pathParams: [id],
      data: { action: 'mark_read' },
    });
    mutate(); // Refetch
  };
}

function Component2() {
  // Same logic duplicated...
}
```

✅ **Do** create domain hooks:

```typescript
// Hook encapsulates all notification logic
function Component1() {
  const { notifications, toggleRead } = useNotificationOperations();
  // Logic is centralized and reusable
}
```

### 3. Enable Conditional Fetching

❌ **Don't** fetch when data isn't needed:

```typescript
const { data } = useApiQuery(apiRoutes.admin.users.get, {
  pathParams: [userId || ''], // Fetches with empty string
});
```

✅ **Do** use the `enabled` flag:

```typescript
const { data } = useApiQuery(apiRoutes.admin.users.get, {
  pathParams: userId ? [userId] : [],
  enabled: !!userId, // Only fetch when userId is available
});
```

### 4. Use Optimistic Updates

For better UX, update UI immediately and rollback on error:

```typescript
const { trigger: updateNotification } = useApiMutation(
  apiRoutes.notifications.update,
  {
    pathParams: [notificationId],
    optimisticKeys: ['/api/notifications'],
    optimisticData: (currentData, newData) => ({
      ...currentData,
      notifications: currentData.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ),
    }),
    rollbackOnError: true, // Rollback on failure
  }
);
```

### 5. Leverage Cache Management

Use cache utilities for complex invalidation patterns:

```typescript
const cache = useApiCache();

// After creating an item, invalidate related lists
const handleCreate = async () => {
  await createItem(data);

  // Invalidate all related caches
  cache.invalidatePattern(/^\/api\/my-feature/);
};
```

## Examples

### Example 1: Admin Table with Filtering

```typescript
import { useAdminOrganizations } from '@/lib/hooks/api/admin/use-admin-organizations.hook';
import { useState } from 'react';

function OrganizationsTable() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const { data, error, isLoading } = useAdminOrganizations({
    search,
    limit: 20,
    offset: page * 20,
  });

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
      />

      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}

      <table>
        {data?.data.map(org => (
          <tr key={org.id}>
            <td>{org.name}</td>
            <td>{org.memberCount} members</td>
          </tr>
        ))}
      </table>

      <button onClick={() => setPage(p => p - 1)} disabled={page === 0}>
        Previous
      </button>
      <button onClick={() => setPage(p => p + 1)}>
        Next
      </button>
    </div>
  );
}
```

### Example 2: Form with Mutation

```typescript
import { useApiMutation } from '@/lib/hooks/api/use-api.hook';
import { apiRoutes } from '@/lib/api/routes.config';
import { useState } from 'react';

function CreateOrganizationForm() {
  const [name, setName] = useState('');

  const { trigger, isMutating, error } = useApiMutation(
    apiRoutes.organizations.create,
    {
      onSuccess: (data) => {
        console.log('Created:', data);
        setName(''); // Clear form
      },
      revalidateKeys: ['/api/organizations'], // Refresh list
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await trigger({ name });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={isMutating}
      />
      <button type="submit" disabled={isMutating}>
        {isMutating ? 'Creating...' : 'Create'}
      </button>
      {error && <div>Error: {error.message}</div>}
    </form>
  );
}
```

### Example 3: Details Dialog with Conditional Fetch

```typescript
import { useAdminOrganization } from '@/lib/hooks/api/admin/use-admin-organizations.hook';
import { Dialog } from '@/components/ui/dialog';

function OrganizationDialog({
  open,
  organizationId,
  onClose
}: {
  open: boolean;
  organizationId?: string;
  onClose: () => void;
}) {
  const { data, error, isLoading } = useAdminOrganization(organizationId, {
    enabled: open && !!organizationId, // Only fetch when dialog is open
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {data && (
        <div>
          <h2>{data.name}</h2>
          <p>Members: {data.memberCount}</p>
          <p>Plan: {data.planName}</p>
        </div>
      )}
    </Dialog>
  );
}
```

## Error Handling

All API errors are instances of `ApiError`:

```typescript
import { ApiError } from '@/lib/types/api/api-error.type';

try {
  await apiRequest(apiRoutes.notifications.update, {
    pathParams: ['invalid-id'],
    data: { action: 'mark_read' },
  });
} catch (error) {
  if (error instanceof ApiError) {
    console.log('Status:', error.statusCode);
    console.log('Message:', error.message);
    console.log('Details:', error.details);
    console.log('URL:', error.url);
    console.log('Method:', error.method);
  }
}
```

In hooks, errors are returned in the response:

```typescript
const { data, error } = useApiQuery(apiRoutes.notifications.list);

if (error) {
  // error is ApiError
  console.log('Failed:', error.message);
  console.log('Status:', error.statusCode);
}
```

## Testing

When testing components using these hooks, use SWR's testing utilities:

```typescript
import { SWRConfig } from 'swr';

// In your test
<SWRConfig value={{ provider: () => new Map() }}>
  <YourComponent />
</SWRConfig>
```

For more control, mock `apiRequest`:

```typescript
import * as apiClient from '@/lib/api/client.util';

vi.spyOn(apiClient, 'apiRequest').mockResolvedValue(mockData);
```
