---
title: Schemas & Validation
description: Complete guide to organizing and creating validation schemas for API requests and responses
---

# Schemas & Validation

This guide explains how to organize and create validation schemas for type-safe API requests and responses.

## Table of Contents

- [Overview](#overview)
- [Schema Organization](#schema-organization)
- [Request Schemas](#request-schemas)
- [Response Schemas](#response-schemas)
- [Validation Patterns](#validation-patterns)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

All validation in the application uses [Zod](https://zod.dev) for schema definition and validation. Schemas provide:

- ✅ **Type inference** - Automatic TypeScript types
- ✅ **Runtime validation** - Input/output validation
- ✅ **Error messages** - User-friendly validation errors
- ✅ **Type safety** - End-to-end type safety
- ✅ **Documentation** - Self-documenting code

## Schema Organization

### File Structure

Schemas are organized by domain in `lib/types/[domain]/`:

```
lib/types/
├── admin/
│   ├── admin-user-list-request.schema.ts
│   ├── admin-user-list-response.schema.ts
│   ├── admin-activity-list-request.schema.ts
│   └── admin-activity-list-response.schema.ts
├── notifications/
│   ├── notification-list-request.schema.ts
│   ├── notification-list-response.schema.ts
│   └── notification-update-request.schema.ts
├── auth/
│   ├── user-profile-response.schema.ts
│   └── sign-in-request.schema.ts
└── common/
    ├── pagination-request.schema.ts
    ├── pagination-metadata.schema.ts
    └── simple-success-response.schema.ts
```

### Naming Convention

Follow the naming pattern: `[entity]-[type]-[request|response].schema.ts`

- **Request schemas**: `[entity]-[action]-request.schema.ts`
- **Response schemas**: `[entity]-[action]-response.schema.ts`
- **Common schemas**: `[entity].schema.ts`

Examples:

- `user-list-request.schema.ts` - Request for listing users
- `user-list-response.schema.ts` - Response for user list
- `user-update-request.schema.ts` - Request for updating user
- `pagination-request.schema.ts` - Common pagination schema

## Request Schemas

### Query Parameter Schemas

For GET requests with query parameters:

```typescript
// lib/types/users/user-list-request.schema.ts
import { z } from 'zod';
import { paginationRequestSchema } from '../common/pagination-request.schema';

export const userListRequestSchema = paginationRequestSchema.extend({
  search: z.string().optional(),
  role: z.enum(['user', 'admin']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export type UserListRequest = z.infer<typeof userListRequestSchema>;
```

::: tip Coercion
Use `z.coerce.number()` for numeric query parameters since they're always strings in URLs:

```typescript
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});
```

:::

### Request Body Schemas

For POST/PUT/PATCH requests:

```typescript
// lib/types/users/user-create-request.schema.ts
import { z } from 'zod';

export const userCreateRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: z.enum(['user', 'admin']).default('user'),
  bio: z.string().max(500, 'Bio too long').optional(),
});

export type UserCreateRequest = z.infer<typeof userCreateRequestSchema>;
```

### Reusable Base Schemas

Create base schemas for common patterns:

```typescript
// lib/types/common/pagination-request.schema.ts
import { z } from 'zod';

export const paginationRequestSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export type PaginationRequest = z.infer<typeof paginationRequestSchema>;
```

Then extend them:

```typescript
import { paginationRequestSchema } from '../common/pagination-request.schema';

export const productListRequestSchema = paginationRequestSchema.extend({
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});
```

## Response Schemas

### Basic Response Schemas

Always use `.strict()` to prevent data leakage:

```typescript
// lib/types/users/user-response.schema.ts
import { z } from 'zod';

export const userResponseSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().nullable(),
    role: z.enum(['user', 'admin']),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict(); // ← Prevents accidental field inclusion

export type UserResponse = z.infer<typeof userResponseSchema>;
```

::: danger Data Leakage
Never use `.passthrough()` on response schemas as it can leak sensitive data:

```typescript
// ❌ Dangerous: Could leak password, tokens, etc.
const schema = z.object({ id: z.string() }).passthrough();

// ✅ Safe: Only returns defined fields
const schema = z.object({ id: z.string() }).strict();
```

:::

### List Response Schemas

For paginated lists:

```typescript
// lib/types/users/user-list-response.schema.ts
import { z } from 'zod';
import { userResponseSchema } from './user-response.schema';

export const userListResponseSchema = z
  .object({
    data: z.array(userResponseSchema),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  })
  .strict();

export type UserListResponse = z.infer<typeof userListResponseSchema>;
```

### Nested Response Schemas

For complex nested structures:

```typescript
// lib/types/organizations/organization-details-response.schema.ts
import { z } from 'zod';

const memberSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['owner', 'admin', 'member']),
  })
  .strict();

const subscriptionSchema = z
  .object({
    planName: z.string(),
    status: z.enum(['active', 'canceled', 'past_due']),
    currentPeriodEnd: z.date(),
  })
  .strict();

export const organizationDetailsResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    members: z.array(memberSchema),
    subscription: subscriptionSchema.nullable(),
    createdAt: z.date(),
  })
  .strict();

export type OrganizationDetailsResponse = z.infer<
  typeof organizationDetailsResponseSchema
>;
```

## Validation Patterns

### String Validation

```typescript
const schema = z.object({
  // Required string with min/max length
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),

  // Email validation
  email: z.string().email('Invalid email address'),

  // URL validation
  website: z.string().url('Invalid URL'),

  // Pattern matching
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),

  // Optional string
  bio: z.string().optional(),

  // Nullable string
  middleName: z.string().nullable(),

  // String with default
  status: z.string().default('active'),

  // Enum
  role: z.enum(['user', 'admin', 'moderator']),
});
```

### Number Validation

```typescript
const schema = z.object({
  // Basic number
  age: z.number().min(18, 'Must be 18 or older'),

  // Number with range
  rating: z.number().min(1).max(5),

  // Integer only
  count: z.number().int('Must be a whole number'),

  // Positive number
  price: z.number().positive('Must be positive'),

  // Optional with default
  quantity: z.number().default(1),

  // Coerce from string (for query params)
  page: z.coerce.number().min(1).default(1),
});
```

### Date Validation

```typescript
const schema = z.object({
  // Date object
  createdAt: z.date(),

  // Date from string
  birthDate: z.coerce.date(),

  // Min/max date
  startDate: z.date().min(new Date(), 'Must be in the future'),

  // Optional date
  completedAt: z.date().optional(),
});
```

### Array Validation

```typescript
const schema = z.object({
  // Array of strings
  tags: z.array(z.string()),

  // Array with min/max length
  items: z.array(z.string()).min(1, 'At least one item required').max(10),

  // Array of objects
  members: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),

  // Optional array with default
  categories: z.array(z.string()).default([]),
});
```

### Object Validation

```typescript
const addressSchema = z
  .object({
    street: z.string(),
    city: z.string(),
    country: z.string(),
    postalCode: z.string(),
  })
  .strict();

const schema = z.object({
  // Nested object
  address: addressSchema,

  // Optional object
  preferences: z
    .object({
      theme: z.enum(['light', 'dark']),
      notifications: z.boolean(),
    })
    .optional(),

  // Record type
  metadata: z.record(z.string(), z.string()),
});
```

### Union Types

```typescript
const schema = z.object({
  // Union of literal types
  type: z.union([z.literal('email'), z.literal('sms'), z.literal('push')]),

  // Discriminated union
  notification: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('email'),
      email: z.string().email(),
    }),
    z.object({
      type: z.literal('sms'),
      phone: z.string(),
    }),
  ]),
});
```

## Best Practices

### 1. Use Descriptive Error Messages

Provide clear, user-friendly error messages:

```typescript
// ✅ Good: Clear error messages
const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  age: z.number().min(18, 'You must be 18 or older to register'),
});

// ❌ Bad: Generic or missing messages
const schema = z.object({
  email: z.string().email(), // "Invalid email"
  password: z.string().min(8), // "String must contain at least 8 character(s)"
  age: z.number().min(18), // "Number must be greater than or equal to 18"
});
```

### 2. Export Both Schema and Type

Always export both the schema and inferred type:

```typescript
// ✅ Good: Export both
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type User = z.infer<typeof userSchema>;

// ❌ Bad: Only schema or only type
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
});
// Missing type export
```

### 3. Use .strict() on Response Schemas

Always use `.strict()` to prevent accidental data exposure:

```typescript
// ✅ Good: Strict prevents leaks
export const userResponseSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
  })
  .strict();

// ❌ Bad: Could leak sensitive fields
export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
});
// Missing .strict() - password, tokens might leak
```

### 4. Reuse Common Schemas

Create reusable schemas for common patterns:

```typescript
// lib/types/common/pagination-request.schema.ts
export const paginationRequestSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

// lib/types/common/search-request.schema.ts
export const searchRequestSchema = z.object({
  search: z.string().optional(),
});

// Combine in specific schemas
export const userListRequestSchema = paginationRequestSchema
  .merge(searchRequestSchema)
  .extend({
    role: z.enum(['user', 'admin']).optional(),
  });
```

### 5. Use Enums for Fixed Values

Use Zod enums for fixed sets of values:

```typescript
// ✅ Good: Type-safe enum
export const userRoleSchema = z.enum(['user', 'admin', 'moderator']);
export type UserRole = z.infer<typeof userRoleSchema>;

// ❌ Bad: String union (less validation)
export type UserRole = 'user' | 'admin' | 'moderator';
```

## Examples

### Example 1: Complete CRUD Schemas

```typescript
// lib/types/posts/post.schema.ts

// Base post schema
const postBaseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  published: z.boolean().default(false),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags'),
});

// Create request
export const postCreateRequestSchema = postBaseSchema;
export type PostCreateRequest = z.infer<typeof postCreateRequestSchema>;

// Update request (all fields optional)
export const postUpdateRequestSchema = postBaseSchema.partial();
export type PostUpdateRequest = z.infer<typeof postUpdateRequestSchema>;

// Response
export const postResponseSchema = postBaseSchema
  .extend({
    id: z.string().uuid(),
    authorId: z.string().uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();
export type PostResponse = z.infer<typeof postResponseSchema>;

// List request
export const postListRequestSchema = paginationRequestSchema.extend({
  search: z.string().optional(),
  published: z.coerce.boolean().optional(),
  tags: z.array(z.string()).optional(),
});
export type PostListRequest = z.infer<typeof postListRequestSchema>;

// List response
export const postListResponseSchema = z
  .object({
    data: z.array(postResponseSchema),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  })
  .strict();
export type PostListResponse = z.infer<typeof postListResponseSchema>;
```

### Example 2: Complex Nested Schema

```typescript
// lib/types/orders/order-details-response.schema.ts

const orderItemSchema = z
  .object({
    id: z.string(),
    productId: z.string(),
    productName: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    totalPrice: z.number().positive(),
  })
  .strict();

const shippingAddressSchema = z
  .object({
    recipientName: z.string(),
    street: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    postalCode: z.string(),
  })
  .strict();

const paymentInfoSchema = z
  .object({
    method: z.enum(['card', 'paypal', 'bank_transfer']),
    lastFourDigits: z.string().length(4).optional(),
    transactionId: z.string(),
  })
  .strict();

export const orderDetailsResponseSchema = z
  .object({
    id: z.string().uuid(),
    orderNumber: z.string(),
    status: z.enum([
      'pending',
      'processing',
      'shipped',
      'delivered',
      'canceled',
    ]),
    items: z.array(orderItemSchema),
    shippingAddress: shippingAddressSchema,
    paymentInfo: paymentInfoSchema,
    subtotal: z.number().positive(),
    tax: z.number().nonnegative(),
    shipping: z.number().nonnegative(),
    total: z.number().positive(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

export type OrderDetailsResponse = z.infer<typeof orderDetailsResponseSchema>;
```

### Example 3: Discriminated Union

```typescript
// lib/types/notifications/notification-create-request.schema.ts

export const notificationCreateRequestSchema = z.discriminatedUnion('type', [
  // Email notification
  z.object({
    type: z.literal('email'),
    recipient: z.string().email('Invalid email address'),
    subject: z.string().min(1, 'Subject is required'),
    body: z.string().min(1, 'Body is required'),
    cc: z.array(z.string().email()).optional(),
  }),

  // SMS notification
  z.object({
    type: z.literal('sms'),
    phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
    message: z.string().min(1).max(160, 'SMS limited to 160 characters'),
  }),

  // Push notification
  z.object({
    type: z.literal('push'),
    userId: z.string().uuid(),
    title: z.string().min(1, 'Title is required'),
    body: z.string().min(1, 'Body is required'),
    data: z.record(z.string()).optional(),
  }),
]);

export type NotificationCreateRequest = z.infer<
  typeof notificationCreateRequestSchema
>;
```

## Testing Schemas

### Unit Testing Schemas

```typescript
import { describe, it, expect } from 'vitest';
import { userCreateRequestSchema } from './user-create-request.schema';

describe('userCreateRequestSchema', () => {
  it('should validate correct data', () => {
    const data = {
      email: 'user@example.com',
      name: 'John Doe',
      role: 'user',
    };

    const result = userCreateRequestSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('should reject invalid email', () => {
    const data = {
      email: 'invalid-email',
      name: 'John Doe',
    };

    const result = userCreateRequestSchema.safeParse(data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Invalid email');
    }
  });

  it('should apply defaults', () => {
    const data = {
      email: 'user@example.com',
      name: 'John Doe',
    };

    const result = userCreateRequestSchema.safeParse(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe('user'); // Default value
    }
  });
});
```

## Related Documentation

- [Type-Safe API Client](./type-safe-api-guide.md)
- [API Handlers & Validation](./handlers-and-validation.md)
- [Server Actions & Permissions](./server-actions-and-permissions.md)

---

**Last Updated:** 2025-10-08  
**Status:** ✅ Complete
