---
title: API Handlers & Validation
description: Complete guide to creating validated API endpoints with automatic schema validation, authentication, and permissions
---

# API Handlers & Validation

This guide explains how to create type-safe API route handlers with automatic input/output validation, authentication, and permission checks.

## Table of Contents

- [Overview](#overview)
- [Handler Types](#handler-types)
- [Creating API Handlers](#creating-api-handlers)
- [Input Validation](#input-validation)
- [Output Validation](#output-validation)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

Validated API handlers provide automatic schema validation, authentication, and permission checks for API endpoints. They ensure consistent error handling and type safety across all API routes.

### Key Features

- ✅ **Automatic validation** - Input and output schema validation
- ✅ **Type inference** - Full TypeScript type safety
- ✅ **Built-in authentication** - Session and organization context
- ✅ **Permission checks** - Admin permission verification
- ✅ **Standardized errors** - Consistent error responses
- ✅ **Activity logging** - Automatic audit trail

## Handler Types

### Public Handlers

Use `createValidatedApiHandler()` for public endpoints without authentication:

```typescript
export const GET = createValidatedApiHandler(
  inputSchema,
  outputSchema,
  async ({ data }) => {
    return await queryPublicData(data);
  }
);
```

### Authenticated Handlers

Use `createValidatedAuthenticatedHandler()` for endpoints requiring authentication:

```typescript
export const POST = createValidatedAuthenticatedHandler(
  inputSchema,
  outputSchema,
  async ({ data, context }) => {
    const { user } = context;
    return await createResource(user.id, data);
  }
);
```

### Admin Handlers

Use `createValidatedAdminHandler()` for admin endpoints with permission checks:

```typescript
export const GET = createValidatedAdminHandler(
  inputSchema,
  outputSchema,
  async ({ data, context }) => {
    // context.admin.permissions available
    return await adminQuery(data);
  },
  {
    requiredPermissions: ['users:read'],
    resource: 'admin.users.list',
  }
);
```

### Organization Handlers

Use `createValidatedOrganizationHandler()` for organization-scoped endpoints:

```typescript
export const POST = createValidatedOrganizationHandler(
  inputSchema,
  outputSchema,
  async ({ data, context }) => {
    const { user, organization } = context;
    return await createOrgResource(organization.id, data);
  }
);
```

## Creating API Handlers

### Step 1: Define Schemas

Create request and response schemas in `lib/types/[domain]/`:

```typescript
// lib/types/users/user-list-request.schema.ts
import { z } from 'zod';

export const userListRequestSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['user', 'admin']).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export type UserListRequest = z.infer<typeof userListRequestSchema>;
```

```typescript
// lib/types/users/user-list-response.schema.ts
import { z } from 'zod';

const userItemSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().nullable(),
    role: z.enum(['user', 'admin']),
    createdAt: z.date(),
  })
  .strict(); // Use .strict() to prevent data leakage

export const userListResponseSchema = z
  .object({
    data: z.array(userItemSchema),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  })
  .strict();

export type UserListResponse = z.infer<typeof userListResponseSchema>;
```

### Step 2: Register Route

Add the route to `lib/api/routes.config.ts`:

```typescript
import { userListRequestSchema } from '@/lib/types/users/user-list-request.schema';
import { userListResponseSchema } from '@/lib/types/users/user-list-response.schema';

export const apiRoutes = {
  admin: {
    users: {
      list: {
        path: '/api/admin/users',
        method: 'GET',
        querySchema: userListRequestSchema,
        responseSchema: userListResponseSchema,
      } as const satisfies GetRouteWithQuery<
        typeof userListRequestSchema,
        typeof userListResponseSchema
      >,
    },
  },
} as const;
```

### Step 3: Create Handler

Create the API handler in `app/api/[route]/route.ts`:

```typescript
// app/api/admin/users/route.ts
import { createValidatedAdminHandler } from '@/lib/server/validated-admin-handler';
import { listAllUsers } from '@/lib/db/queries/admin-user.query';
import { userListRequestSchema } from '@/lib/types/users/user-list-request.schema';
import { userListResponseSchema } from '@/lib/types/users/user-list-response.schema';

/**
 * GET /api/admin/users
 *
 * List all users with optional filtering and pagination.
 *
 * Query parameters:
 * - search: Filter by email or name (optional)
 * - role: Filter by user role (optional)
 * - limit: Number of results per page (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 *
 * @requires `users:read` admin permission
 * @returns Paginated list of users
 */
export const GET = createValidatedAdminHandler(
  userListRequestSchema,
  userListResponseSchema,
  async ({ data }) => {
    const { search, role, limit, offset } = data;

    const result = await listAllUsers({
      search,
      role,
      limit,
      offset,
    });

    return {
      data: result.data,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  },
  {
    resource: 'admin.users.list',
    requiredPermissions: ['users:read'],
    inputSource: 'query',
    logName: 'GET /api/admin/users',
  }
);
```

## Input Validation

### Input Source

Specify where to find input data using `inputSource`:

- **`'query'`** - For GET requests (URL search params)
- **`'body'`** - For POST/PUT/PATCH (request body) - default for mutations

```typescript
// GET request - validate query parameters
export const GET = createValidatedAdminHandler(
  querySchema,
  responseSchema,
  async ({ data }) => result,
  {
    inputSource: 'query', // ← Required for GET
    requiredPermissions: ['resource:read'],
  }
);

// POST request - validate request body
export const POST = createValidatedApiHandler(
  requestSchema,
  responseSchema,
  async ({ data }) => result,
  {
    inputSource: 'body', // ← Default, can be omitted
  }
);
```

### Query Parameters

For GET requests, validate query parameters:

```typescript
const querySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export const GET = createValidatedApiHandler(
  querySchema,
  responseSchema,
  async ({ data }) => {
    // data is typed from querySchema
    const { search, page, limit } = data;
    return await queryData({ search, page, limit });
  },
  { inputSource: 'query' }
);
```

::: tip Coercion
Use `z.coerce.number()` for query parameters since they're always strings in URLs.
:::

### Request Body

For POST/PUT/PATCH requests, validate the request body:

```typescript
const requestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be 18 or older'),
});

export const POST = createValidatedApiHandler(
  requestSchema,
  responseSchema,
  async ({ data }) => {
    // data is typed from requestSchema
    const { name, email, age } = data;
    return await createUser({ name, email, age });
  },
  {
    inputSource: 'body',
    successStatus: 201,
  }
);
```

### Path Parameters

For dynamic routes with path parameters:

```typescript
// app/api/users/[id]/route.ts
import { createValidatedRouteParamHandler } from '@/lib/server/validated-api-handler';

const paramsSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

export const GET = createValidatedRouteParamHandler(
  paramsSchema,
  responseSchema,
  async ({ params }) => {
    // params.id is validated and typed
    return await getUser(params.id);
  }
);
```

## Output Validation

### Response Schemas

Always use `.strict()` on response schemas to prevent data leakage:

```typescript
// ✅ Good: Strict schema prevents extra fields
export const responseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  })
  .strict(); // ← Rejects extra fields

// ❌ Bad: Passthrough allows data leakage
export const responseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .passthrough(); // ← Dangerous!
```

### Automatic Validation

Responses are automatically validated against the output schema:

```typescript
export const GET = createValidatedApiHandler(
  inputSchema,
  outputSchema,
  async ({ data }) => {
    const result = await queryDatabase(data);

    // ✅ Result is automatically validated against outputSchema
    // ❌ Throws 500 if validation fails
    return result;
  }
);
```

### Validation Errors

If the response doesn't match the schema, a 500 error is returned:

```typescript
// ❌ Response has extra field
return {
  id: '123',
  name: 'John',
  secretData: 'leaked!', // ← Rejected by .strict()
};

// Response: 500 Internal Server Error
// "Invalid response format"
```

## Error Handling

### Validation Errors

Input validation errors return 400 Bad Request automatically:

```typescript
// Request with invalid data
// POST /api/users
// { "email": "invalid-email", "age": 15 }

// Response: 400 Bad Request
// {
//   "success": false,
//   "error": "Validation failed",
//   "details": {
//     "email": "Invalid email address",
//     "age": "Must be 18 or older"
//   }
// }
```

### Permission Errors

Permission denied errors return 403 Forbidden:

```typescript
// User without 'users:write' permission
export const POST = createValidatedAdminHandler(
  inputSchema,
  outputSchema,
  async ({ data }) => {
    return await createUser(data);
  },
  {
    requiredPermissions: ['users:write'], // ← User lacks this
  }
);

// Response: 403 Forbidden
// {
//   "success": false,
//   "error": "Forbidden: users:write permission required"
// }
```

### Custom Errors

Throw errors in your handler for custom error responses:

```typescript
export const POST = createValidatedApiHandler(
  inputSchema,
  outputSchema,
  async ({ data }) => {
    const existing = await findUser(data.email);

    if (existing) {
      throw new Error('User already exists');
    }

    return await createUser(data);
  }
);

// Response: 500 Internal Server Error
// {
//   "success": false,
//   "error": "User already exists"
// }
```

## Best Practices

### 1. Always Specify Input Source

Be explicit about where input data comes from:

```typescript
// ✅ Good: Explicit input source
export const GET = createValidatedAdminHandler(
  querySchema,
  responseSchema,
  async ({ data }) => result,
  {
    inputSource: 'query', // ← Explicit
    requiredPermissions: ['resource:read'],
  }
);

// ❌ Bad: Implicit (works but unclear)
export const POST = createValidatedApiHandler(
  requestSchema,
  responseSchema,
  async ({ data }) => result
  // Missing inputSource (defaults to 'body')
);
```

### 2. Use Strict Response Schemas

Always use `.strict()` to prevent data leakage:

```typescript
// ✅ Good: Strict schema
export const userSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
  })
  .strict();

// ❌ Bad: Missing .strict()
export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  // Could leak password, tokens, etc.
});
```

### 3. Document Endpoints

Add comprehensive JSDoc comments:

```typescript
/**
 * GET /api/admin/users
 *
 * List all users with optional filtering and pagination.
 *
 * Query parameters:
 * - search: Filter by email or name (optional)
 * - role: Filter by user role (optional)
 * - limit: Number of results per page (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 *
 * @requires `users:read` admin permission
 * @returns Paginated list of users with total count
 */
export const GET = createValidatedAdminHandler(/* ... */);
```

### 4. Use Appropriate Handler Type

Choose the right handler for your needs:

```typescript
// ✅ Public data - no auth required
export const GET = createValidatedApiHandler(/* ... */);

// ✅ User data - auth required
export const GET = createValidatedAuthenticatedHandler(/* ... */);

// ✅ Org data - auth + org required
export const GET = createValidatedOrganizationHandler(/* ... */);

// ✅ Admin data - auth + permissions required
export const GET = createValidatedAdminHandler(/* ... */);
```

### 5. Set Appropriate Status Codes

Use the `successStatus` option for non-200 responses:

```typescript
// POST - return 201 Created
export const POST = createValidatedApiHandler(
  inputSchema,
  outputSchema,
  async ({ data }) => {
    return await createResource(data);
  },
  {
    successStatus: 201, // ← 201 instead of 200
  }
);
```

## Examples

### Example 1: Simple GET Endpoint

```typescript
// app/api/notifications/route.ts
import { createValidatedAuthenticatedHandler } from '@/lib/server/validated-api-handler';
import { notificationListRequestSchema } from '@/lib/types/notifications/notification-list-request.schema';
import { notificationListResponseSchema } from '@/lib/types/notifications/notification-list-response.schema';
import { listNotifications } from '@/lib/db/queries/notification.query';

export const GET = createValidatedAuthenticatedHandler(
  notificationListRequestSchema,
  notificationListResponseSchema,
  async ({ data, context }) => {
    const { user } = context;
    const { limit, offset } = data;

    const notifications = await listNotifications({
      userId: user.id,
      limit,
      offset,
    });

    return {
      notifications: notifications.data,
      total: notifications.total,
      unreadCount: notifications.unreadCount,
      pagination: {
        limit,
        offset,
        hasMore: notifications.total > offset + limit,
      },
    };
  },
  {
    inputSource: 'query',
  }
);
```

### Example 2: POST with Validation

```typescript
// app/api/organizations/route.ts
import { createValidatedAuthenticatedHandler } from '@/lib/server/validated-api-handler';
import { createOrganizationRequestSchema } from '@/lib/types/organizations/create-organization-request.schema';
import { organizationResponseSchema } from '@/lib/types/organizations/organization-response.schema';
import { createOrganization } from '@/lib/db/queries/organization.query';

export const POST = createValidatedAuthenticatedHandler(
  createOrganizationRequestSchema,
  organizationResponseSchema,
  async ({ data, context }) => {
    const { user } = context;

    // Validate business logic
    const existing = await findOrganizationByName(data.name);
    if (existing) {
      throw new Error('Organization name already exists');
    }

    // Create organization
    const organization = await createOrganization({
      name: data.name,
      ownerId: user.id,
    });

    return organization;
  },
  {
    inputSource: 'body',
    successStatus: 201,
  }
);
```

### Example 3: Admin Endpoint with Permissions

```typescript
// app/api/admin/activity/route.ts
import { createValidatedAdminHandler } from '@/lib/server/validated-admin-handler';
import { adminActivityListRequestSchema } from '@/lib/types/admin/admin-activity-list-request.schema';
import { adminActivityListResponseSchema } from '@/lib/types/admin/admin-activity-list-response.schema';
import { listAllActivityLogs } from '@/lib/db/queries/admin-activity-log.query';

/**
 * GET /api/admin/activity
 *
 * List all activity logs with filtering and pagination.
 *
 * @requires `analytics:read` admin permission
 */
export const GET = createValidatedAdminHandler(
  adminActivityListRequestSchema,
  adminActivityListResponseSchema,
  async ({ data, context }) => {
    // Log admin access for audit
    console.log(`Admin ${context.user.email} accessing activity logs`);

    const result = await listAllActivityLogs({
      action: data.action,
      userId: data.userId,
      startDate: data.startDate,
      endDate: data.endDate,
      limit: data.limit,
      offset: data.offset,
    });

    return {
      data: result.data,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  },
  {
    resource: 'admin.activity.list',
    requiredPermissions: ['analytics:read'],
    inputSource: 'query',
    logName: 'GET /api/admin/activity',
  }
);
```

### Example 4: Dynamic Route with Path Params

```typescript
// app/api/admin/users/[id]/route.ts
import { createValidatedRouteParamHandler } from '@/lib/server/validated-api-handler';
import { z } from 'zod';
import { userProfileResponseSchema } from '@/lib/types/auth/user-profile-response.schema';
import { getUser } from '@/lib/db/queries/admin-user.query';

const paramsSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

/**
 * GET /api/admin/users/:id
 *
 * Get user details by ID.
 *
 * @requires `users:read` admin permission
 */
export const GET = createValidatedRouteParamHandler(
  paramsSchema,
  userProfileResponseSchema,
  async ({ params }) => {
    const user = await getUser(params.id);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
);
```

### Example 5: Organization-Scoped Endpoint

```typescript
// app/api/organization/members/route.ts
import { createValidatedOrganizationHandler } from '@/lib/server/validated-api-handler';
import { memberListRequestSchema } from '@/lib/types/members/member-list-request.schema';
import { memberListResponseSchema } from '@/lib/types/members/member-list-response.schema';
import { listOrganizationMembers } from '@/lib/db/queries/member.query';

export const GET = createValidatedOrganizationHandler(
  memberListRequestSchema,
  memberListResponseSchema,
  async ({ data, context }) => {
    const { organization } = context;

    const members = await listOrganizationMembers({
      organizationId: organization.id,
      limit: data.limit,
      offset: data.offset,
    });

    return {
      data: members.data,
      total: members.total,
      limit: data.limit,
      offset: data.offset,
    };
  },
  {
    inputSource: 'query',
  }
);
```

## Testing

### Testing Validated Handlers

Mock the handler dependencies and test the logic:

```typescript
import { vi } from 'vitest';
import { GET } from '@/app/api/admin/users/route';

describe('GET /api/admin/users', () => {
  it('should return user list', async () => {
    // Mock database query
    vi.mock('@/lib/db/queries/admin-user.query', () => ({
      listAllUsers: vi.fn().mockResolvedValue({
        data: [{ id: '1', email: 'user@test.com', role: 'user' }],
        total: 1,
        limit: 50,
        offset: 0,
      }),
    }));

    // Create mock request
    const request = new Request(
      'http://localhost:3000/api/admin/users?limit=50&offset=0'
    );

    const response = await GET(request, { params: {} });
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
  });
});
```

## Troubleshooting

### Validation Errors

If you're getting validation errors:

1. Check the schema matches your data structure
2. Verify `.strict()` isn't rejecting needed fields
3. Use `z.coerce` for query parameters
4. Check for typos in field names

### Type Errors

```typescript
// ❌ Wrong: Missing context parameter
export const GET = createValidatedAuthenticatedHandler(
  inputSchema,
  outputSchema,
  async ({ data }) => {
    // context not available!
  }
);

// ✅ Right: Include context parameter
export const GET = createValidatedAuthenticatedHandler(
  inputSchema,
  outputSchema,
  async ({ data, context }) => {
    const { user } = context; // ← Available
  }
);
```

## Related Documentation

- [Type-Safe API Client](./type-safe-api-guide.md)
- [Server Actions & Permissions](./server-actions-and-permissions.md)
- [Schemas & Validation](./schemas-and-validation.md)

---

**Last Updated:** 2025-10-08  
**Status:** ✅ Complete
