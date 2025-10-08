---
title: API Architecture Overview
description: Comprehensive guide to the type-safe API architecture including routes, hooks, handlers, and permissions
---

# API Architecture Overview

The SaaS Starter uses a centralized, type-safe API architecture that ensures full type inference, automatic validation, and proper permission control across the entire request/response flow.

## Quick Links

- [Type-Safe API Client](./type-safe-api-guide.md) - Using hooks and making requests
- [API Handlers & Validation](./handlers-and-validation.md) - Creating validated API endpoints
- [Server Actions & Permissions](./server-actions-and-permissions.md) - Admin actions with permission control
- [Request/Response Schemas](./schemas-and-validation.md) - Schema organization and validation patterns

## Architecture Overview

The API infrastructure consists of five main layers:

```
┌─────────────────────────────────────────────────────────┐
│  1. Client Layer                                        │
│     - React Hooks (useApiQuery, useApiMutation)        │
│     - Domain-specific hooks (useNotifications, etc.)   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  2. Route Registry (lib/api/routes.config.ts)          │
│     - Central source of truth for all endpoints        │
│     - Request/response schema definitions              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  3. API Client (lib/api/client.util.ts)                │
│     - Type-safe HTTP client with validation            │
│     - Automatic schema validation                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  4. API Handlers (app/api/)                            │
│     - Validated handlers with auth/permissions         │
│     - Input/output validation                          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  5. Business Logic                                      │
│     - Database queries                                  │
│     - Server actions (with permissions)                │
│     - Service layer                                     │
└─────────────────────────────────────────────────────────┘
```

## Key Features

### ✅ Full Type Safety

TypeScript types are automatically inferred from Zod schemas, ensuring type safety from client to server:

```typescript
// Schema definition
const requestSchema = z.object({
  search: z.string().optional(),
  limit: z.number().min(1).max(100),
});

// Automatic type inference everywhere
const { data } = useApiQuery(apiRoutes.resource.list, {
  queryParams: { search: 'test', limit: 10 }, // ✅ Fully typed
});
```

### ✅ Automatic Validation

All requests and responses are validated automatically using Zod schemas:

- **Request validation** - Query params, path params, and request body
- **Response validation** - Ensures server returns expected data shape
- **Strict schemas** - Use `.strict()` to prevent data leakage

### ✅ Permission Control

Server actions and API handlers support fine-grained permission checks:

```typescript
// Server action with permission
export const listUsersAction = withPermission(
  'users:read',
  async (filters) => {
    return await listAllUsers(filters);
  },
  'admin.users.list'
);
```

### ✅ Optimistic Updates

Client hooks support optimistic UI updates with automatic rollback on error:

```typescript
const { trigger } = useApiMutation(route, {
  optimisticKeys: ['/api/resource'],
  optimisticData: (current, updates) => ({
    ...current,
    updated: updates,
  }),
  rollbackOnError: true,
});
```

### ✅ Cache Management

SWR-powered caching with intelligent invalidation:

```typescript
const cache = useApiCache();

// Invalidate by pattern
cache.invalidatePattern(/^\/api\/notifications/);

// Prefetch data
cache.prefetch(apiRoutes.users.current);
```

## Getting Started

### 1. For Frontend Developers

Start with the [Type-Safe API Client Guide](./type-safe-api-guide.md) to learn how to:

- Use hooks for data fetching
- Handle mutations and optimistic updates
- Manage cache and revalidation

### 2. For Backend Developers

Read the [API Handlers & Validation Guide](./handlers-and-validation.md) to learn how to:

- Create validated API endpoints
- Implement authentication and authorization
- Handle errors properly

### 3. For Admin Features

Check the [Server Actions & Permissions Guide](./server-actions-and-permissions.md) to learn how to:

- Create permission-protected server actions
- Use admin middleware wrappers
- Implement role-based access control

### 4. For Schema Design

See the [Schemas & Validation Guide](./schemas-and-validation.md) to learn how to:

- Organize request/response schemas
- Use proper validation patterns
- Prevent data leakage

## Common Patterns

### Pattern 1: Simple GET Request

```typescript
// 1. Define schema
const responseSchema = z.object({
  items: z.array(itemSchema),
}).strict();

// 2. Register route
export const apiRoutes = {
  resource: {
    list: {
      path: '/api/resource',
      method: 'GET',
      responseSchema,
    },
  },
};

// 3. Use in component
function MyComponent() {
  const { data } = useApiQuery(apiRoutes.resource.list);
  return <div>{data?.items.length} items</div>;
}
```

### Pattern 2: Mutation with Optimistic Update

```typescript
function MyComponent() {
  const { data, mutate } = useApiQuery(apiRoutes.resource.list);

  const update = async (id: number, updates: Updates) => {
    // Optimistic update
    await mutate(
      {
        ...data,
        items: data.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
      },
      false
    );

    try {
      await apiRequest(apiRoutes.resource.update, {
        pathParams: [String(id)],
        data: updates,
      });
      await mutate(); // Revalidate
    } catch {
      await mutate(); // Rollback
    }
  };
}
```

### Pattern 3: Admin Action with Permission

```typescript
// Server action
export const adminAction = withPermission(
  'resource:write',
  async (data) => {
    return await performAction(data);
  },
  'admin.resource.action'
);

// API handler
export const POST = createValidatedAdminHandler(
  requestSchema,
  responseSchema,
  async ({ data }) => {
    return await handleRequest(data);
  },
  {
    requiredPermissions: ['resource:write'],
    inputSource: 'body',
  }
);
```

## Best Practices

1. **Always register routes** - Never use ad-hoc fetch calls
2. **Use strict schemas** - Apply `.strict()` to prevent data leakage
3. **Implement optimistic updates** - Improve UX with instant feedback
4. **Use permission wrappers** - Don't check permissions manually
5. **Specify input source** - Use `'query'` for GET, `'body'` for mutations
6. **Type everything** - Leverage full TypeScript inference
7. **Handle errors properly** - Use ApiError type with clear messages

## Troubleshooting

### Type Errors

```typescript
// ❌ Wrong: Missing schema registration
const { data } = useApiQuery('/api/resource'); // Type error

// ✅ Right: Use registered route
const { data } = useApiQuery(apiRoutes.resource.list);
```

### Validation Errors

```typescript
// ❌ Wrong: Response doesn't match schema
return { extraField: 'value' }; // Fails with .strict()

// ✅ Right: Return only schema fields
return { id: 1, name: 'Item' };
```

### Permission Errors

```typescript
// ❌ Wrong: Manual permission check
if (!context.admin.permissions.has('users:read')) {
  throw new Error('Forbidden');
}

// ✅ Right: Use permission wrapper
export const action = withPermission('users:read', async (data) => {
  /* ... */
});
```

## Reference Documentation

- [Type-Safe API Client](./type-safe-api-guide.md)
- [API Handlers & Validation](./handlers-and-validation.md)
- [Server Actions & Permissions](./server-actions-and-permissions.md)
- [Schemas & Validation](./schemas-and-validation.md)

## Related Documentation

- [Authentication Overview](../auth/index.md)
- [Admin Space](../admin-space/overview.md)
- [Schemas & Validation](./schemas-and-validation.md)

---

**Last Updated:** 2025-10-08  
**Status:** ✅ Complete
