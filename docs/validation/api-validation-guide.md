# API Route Validation Guide

This guide covers how to create fully validated API routes with input and output schema validation in the SaaS Starter project.

## Table of Contents

- [Overview](#overview)
- [Basic Validation](#basic-validation)
- [Validated API Handlers](#validated-api-handlers)
- [Output Validation](#output-validation)
- [Authentication & Authorization](#authentication--authorization)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

The validation system provides:

- **Input validation**: Automatic request body and query parameter validation
- **Output validation**: Response data validation against schemas
- **Type safety**: Full TypeScript type inference from Zod schemas
- **Error handling**: Consistent, structured error responses
- **Performance**: Optional validation in production via environment variables

## Basic Validation

### Standard API Handler with Optional Output Validation

The existing `createApiHandler` now supports optional output validation:

```typescript
import { createApiHandler } from '@/lib/server/api-handler';
import { z } from 'zod';

const userResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

export const GET = createApiHandler(
  async ({ request, route }) => {
    const user = await getUser(userId);
    return user;
  },
  {
    // Optional: Validate response against schema
    outputSchema: userResponseSchema,
  }
);
```

**Benefits:**

- Backward compatible with existing handlers
- Opt-in output validation
- Enforced in development, optional in production

## Validated API Handlers

For new routes with both input and output validation, use the fully validated handlers:

### Basic Validated Handler

```typescript
import { createValidatedApiHandler } from '@/lib/server/validated-api-handler';
import { z } from 'zod';

// Define input schema
const createUserInputSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().min(0).max(150).optional(),
});

// Define output schema
const userResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  createdAt: z.string().datetime(),
});

// Create handler
export const POST = createValidatedApiHandler(
  createUserInputSchema,
  userResponseSchema,
  async ({ data, request, route }) => {
    // `data` is fully typed from input schema
    const user = await createUser({
      name: data.name,
      email: data.email,
      age: data.age,
    });

    // Return value is validated against output schema
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  }
);
```

### Query Parameter Validation

For GET requests that use query parameters instead of body:

```typescript
import { createValidatedApiHandler } from '@/lib/server/validated-api-handler';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
});

const listResponseSchema = z.object({
  items: z.array(userSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    hasMore: z.boolean(),
  }),
});

export const GET = createValidatedApiHandler(
  querySchema,
  listResponseSchema,
  async ({ data }) => {
    const { page, limit, search } = data;
    const results = await getUserList({ page, limit, search });

    return {
      items: results.users,
      pagination: {
        page,
        limit,
        total: results.total,
        hasMore: results.total > page * limit,
      },
    };
  },
  {
    // Specify input source as query params
    inputSource: 'query',
  }
);
```

## Output Validation

### Why Validate Outputs?

Output validation ensures:

1. **API Contract Compliance**: Responses match documented schemas
2. **Security**: Prevents accidental data exposure
3. **Type Safety**: Runtime validation matches TypeScript types
4. **Error Detection**: Catches bugs before they reach clients

### Validation Behavior

- **Development/Test**: Always validates, shows detailed errors
- **Production**: Controlled by `STRICT_RESPONSE_VALIDATION` env var
- **Invalid Output**: Returns 500 error with logged details

### Using validatedOk Helper

For manual output validation in existing handlers:

```typescript
import { validatedOk } from '@/lib/validation/validated-response.util';
import { createApiHandler } from '@/lib/server/api-handler';

export const GET = createApiHandler(async () => {
  const user = await getUser(userId);

  // Manually validate output
  return validatedOk(user, userResponseSchema);
});
```

## Authentication & Authorization

### Authenticated Handlers

Use `createValidatedAuthenticatedHandler` for routes that require authentication:

```typescript
import { createValidatedAuthenticatedHandler } from '@/lib/server/validated-api-handler';

export const POST = createValidatedAuthenticatedHandler(
  inputSchema,
  outputSchema,
  async ({ data, context }) => {
    // context.user is available and typed
    const result = await performAction(context.user.id, data);
    return result;
  }
);
```

### Organization-Scoped Handlers

Use `createValidatedOrganizationHandler` for routes that require an active organization:

```typescript
import { createValidatedOrganizationHandler } from '@/lib/server/validated-api-handler';

export const POST = createValidatedOrganizationHandler(
  inputSchema,
  outputSchema,
  async ({ data, context }) => {
    // context.user and context.organization are available
    const result = await performOrgAction(
      context.organization.id,
      context.user.id,
      data
    );
    return result;
  }
);
```

## Best Practices

### 1. Schema Organization

Store schemas in `lib/types/[domain]/`:

```
lib/types/
  auth/
    sign-in-request.schema.ts
    sign-in-response.schema.ts
    user-profile-response.schema.ts
  notifications/
    notification-list-request.schema.ts
    notification-list-response.schema.ts
    notification.schema.ts
```

### 2. Schema Reuse

Extract common schemas:

```typescript
// lib/types/common/pagination-response.schema.ts
export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  hasMore: z.boolean(),
});

// Use in multiple endpoints
const listResponseSchema = z.object({
  items: z.array(itemSchema),
  pagination: paginationSchema,
});
```

### 3. Input Sanitization

Use sanitization utilities for user input:

```typescript
import {
  sanitizedString,
  sanitizedEmail,
} from '@/lib/validation/sanitization.util';

const inputSchema = z.object({
  name: sanitizedString({ min: 1, max: 100 }),
  email: sanitizedEmail,
  description: sanitizedString({ max: 500 }),
});
```

### 4. Error Messages

Provide clear validation error messages:

```typescript
const inputSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  age: z
    .number()
    .min(0, 'Age must be a positive number')
    .max(150, 'Age must be less than 150'),
});
```

### 5. Transformations

Use Zod transforms for data normalization:

```typescript
const inputSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  name: z
    .string()
    .trim()
    .transform((s) => s.replace(/\s+/g, ' ')),
  tags: z.string().transform((s) => s.split(',').map((t) => t.trim())),
});
```

## Examples

### Example 1: Create Resource with Validation

```typescript
// app/api/posts/route.ts
import { createValidatedAuthenticatedHandler } from '@/lib/server/validated-api-handler';
import { createPostInputSchema, postResponseSchema } from '@/lib/types/posts';

export const POST = createValidatedAuthenticatedHandler(
  createPostInputSchema,
  postResponseSchema,
  async ({ data, context }) => {
    const post = await createPost({
      ...data,
      authorId: context.user.id,
    });

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      authorId: post.authorId,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },
  {
    successStatus: 201, // Return 201 Created
  }
);
```

### Example 2: List with Pagination

```typescript
// app/api/posts/route.ts
import { createValidatedAuthenticatedHandler } from '@/lib/server/validated-api-handler';
import {
  listPostsQuerySchema,
  postListResponseSchema,
} from '@/lib/types/posts';

export const GET = createValidatedAuthenticatedHandler(
  listPostsQuerySchema,
  postListResponseSchema,
  async ({ data, context }) => {
    const { page, limit, search, category } = data;

    const results = await getPostList({
      userId: context.user.id,
      page,
      limit,
      search,
      category,
    });

    return {
      items: results.posts,
      pagination: {
        page,
        limit,
        total: results.total,
        hasMore: results.total > page * limit,
      },
    };
  },
  {
    inputSource: 'query',
  }
);
```

### Example 3: Update with Route Params

```typescript
// app/api/posts/[id]/route.ts
import { createValidatedAuthenticatedHandler } from '@/lib/server/validated-api-handler';
import { updatePostInputSchema, postResponseSchema } from '@/lib/types/posts';
import { validateRouteParams } from '@/lib/validation/request-validator.util';
import { z } from 'zod';

const routeParamsSchema = z.object({
  id: z.string().uuid(),
});

export const PATCH = createValidatedAuthenticatedHandler(
  updatePostInputSchema,
  postResponseSchema,
  async ({ data, route, context }) => {
    // Validate route params
    const params = validateRouteParams(route.params, routeParamsSchema);
    if (!params.success) {
      throw new Error(params.error);
    }

    const post = await updatePost(params.data.id, {
      ...data,
      userId: context.user.id,
    });

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      authorId: post.authorId,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }
);
```

### Example 4: Complex Nested Schemas

```typescript
// lib/types/orders/create-order-request.schema.ts
import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().min(1),
  price: z.number().min(0),
});

const shippingAddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/),
  country: z.string().default('US'),
});

export const createOrderInputSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  shippingAddress: shippingAddressSchema,
  billingAddress: shippingAddressSchema.optional(),
  notes: z.string().max(500).optional(),
});

// In route handler
export const POST = createValidatedOrganizationHandler(
  createOrderInputSchema,
  orderResponseSchema,
  async ({ data, context }) => {
    const order = await createOrder({
      ...data,
      organizationId: context.organization.id,
      userId: context.user.id,
    });

    return formatOrderResponse(order);
  },
  {
    successStatus: 201,
  }
);
```

## Migration Guide

### Migrating Existing Routes

1. **Extract Inline Validation**:

```typescript
// Before
export const POST = withApiAuth(async ({ request, context }) => {
  const body = await request.json();

  const schema = z.object({
    name: z.string(),
    email: z.string().email(),
  });

  const result = schema.safeParse(body);
  if (!result.success) {
    return error('Invalid input', { status: 400 });
  }

  const user = await createUser(result.data);
  return ok(user);
});

// After
import { createValidatedAuthenticatedHandler } from '@/lib/server/validated-api-handler';

export const POST = createValidatedAuthenticatedHandler(
  createUserInputSchema,
  userResponseSchema,
  async ({ data, context }) => {
    const user = await createUser(data);
    return user;
  }
);
```

2. **Add Output Validation to Existing Handler**:

```typescript
// Minimal change: Just add outputSchema option
export const GET = createApiHandler(
  async ({ request }) => {
    const user = await getUser(userId);
    return user;
  },
  {
    outputSchema: userResponseSchema, // Add this
  }
);
```

## Troubleshooting

### Common Issues

**Issue: "Response validation failed" in development**

- Check that your handler returns data matching the output schema
- Ensure all required fields are present
- Check that date fields are in correct format (use `.toISOString()`)

**Issue: TypeScript errors on handler return type**

- Ensure the returned data matches the output schema type
- Use `z.infer<typeof schema>` to get the TypeScript type
- Check for optional fields that might be undefined

**Issue: Query parameters not validating**

- Ensure `inputSource: 'query'` is set in options
- Use `z.coerce.number()` for numeric query params
- Provide defaults for optional params

## Related Documentation

- [Action Validation Guide](./action-validation-guide.md)
- [Schema Organization](./schema-organization.md)
- [Sanitization Utilities](./sanitization.md)
- [Error Handling](../error-handling.md)
