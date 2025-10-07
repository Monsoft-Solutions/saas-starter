# Schema Organization Guide

This guide describes how to organize and name Zod schemas in the SaaS Starter project.

## Table of Contents

- [File Naming Conventions](#file-naming-conventions)
- [Directory Structure](#directory-structure)
- [Schema Types](#schema-types)
- [Best Practices](#best-practices)
- [Examples](#examples)

## File Naming Conventions

All schema files follow the pattern: `<feature>-<type>.schema.ts`

### Schema Type Suffixes

- `*-request.schema.ts` - Request/input validation schemas
- `*-response.schema.ts` - Response/output validation schemas
- `*-action.schema.ts` - Server action state schemas
- `.schema.ts` - Shared data/entity schemas

### Examples

```
lib/types/auth/
  sign-in-request.schema.ts       # Input schema for sign-in
  sign-in-response.schema.ts      # Response schema for sign-in API
  sign-in-action.schema.ts        # Action state schema for sign-in
  user-profile.schema.ts          # Shared user profile entity schema
```

## Directory Structure

Schemas are organized by domain/feature in `lib/types/[domain]/`:

```
lib/types/
  auth/                           # Authentication schemas
    sign-in-request.schema.ts
    sign-in-action.schema.ts
    user-profile.schema.ts

  notifications/                  # Notification schemas
    notification-list-request.schema.ts
    notification-list-response.schema.ts
    notification.schema.ts

  common/                         # Shared/reusable schemas
    pagination-request.schema.ts
    pagination-response.schema.ts
    success-response.schema.ts
    error-response.schema.ts

  actions/                        # Action state utilities
    action-state.type.ts
    create-typed-action.util.ts
```

## Schema Types

### 1. Request Schemas

Validate incoming data (API requests, form submissions, query parameters).

**File:** `*-request.schema.ts`

```typescript
// lib/types/auth/sign-in-request.schema.ts
import { z } from 'zod';
import { sanitizedEmail } from '@/lib/validation/sanitization.util';

export const signInRequestSchema = z.object({
  email: sanitizedEmail,
  password: z.string().min(8),
  rememberMe: z.boolean().optional(),
});

export type SignInRequest = z.infer<typeof signInRequestSchema>;
```

### 2. Response Schemas

Validate outgoing data (API responses).

**File:** `*-response.schema.ts`

```typescript
// lib/types/auth/user-profile-response.schema.ts
import { z } from 'zod';

export const userProfileResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
});

export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>;
```

### 3. Action State Schemas

Define server action return types.

**File:** `*-action.schema.ts`

```typescript
// lib/types/auth/sign-in-action.schema.ts
import { z } from 'zod';
import { createActionStateSchema } from '@/lib/types/actions/action-state.type';

export const signInActionSchema = createActionStateSchema({
  email: z.string().email().optional(),
  redirectUrl: z.string().url().optional(),
});

export type SignInActionState = z.infer<typeof signInActionSchema>;
```

### 4. Shared Data Schemas

Reusable entity/model schemas.

**File:** `<entity>.schema.ts`

```typescript
// lib/types/notifications/notification.schema.ts
import { z } from 'zod';

export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  isRead: z.boolean(),
  createdAt: z.string().datetime(),
});

export type Notification = z.infer<typeof notificationSchema>;
```

## Best Practices

### 1. One Schema Per File

Each file should export a single primary schema and its inferred type.

✅ **Good:**

```typescript
// user-profile.schema.ts
export const userProfileSchema = z.object({ ... });
export type UserProfile = z.infer<typeof userProfileSchema>;
```

❌ **Bad:**

```typescript
// auth.schema.ts
export const signInSchema = z.object({ ... });
export const signUpSchema = z.object({ ... });
export const resetPasswordSchema = z.object({ ... });
```

### 2. Always Export Types

Export TypeScript types alongside schemas for better DX.

```typescript
export const userSchema = z.object({ ... });
export type User = z.infer<typeof userSchema>;
```

### 3. Use Sanitization Utilities

Leverage built-in sanitization helpers:

```typescript
import {
  sanitizedEmail,
  sanitizedString,
  sanitizedNumber,
} from '@/lib/validation/sanitization.util';

const schema = z.object({
  email: sanitizedEmail, // Trimmed, lowercased
  name: sanitizedString({ min: 1, max: 100 }), // Trimmed, collapsed spaces
  age: sanitizedNumber({ min: 0, max: 150 }), // Coerced from string
});
```

### 4. Reuse Common Schemas

Create shared schemas in `lib/types/common/` for reuse:

```typescript
// lib/types/common/pagination-request.schema.ts
export const paginationRequestSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Use in other schemas
import { paginationRequestSchema } from '@/lib/types/common/pagination-request.schema';

export const userListRequestSchema = paginationRequestSchema.extend({
  search: z.string().optional(),
  role: z.enum(['admin', 'user']).optional(),
});
```

### 5. Document Complex Schemas

Add JSDoc comments for complex validation logic:

```typescript
/**
 * Password validation schema.
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(8)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character'
  );
```

### 6. Use Descriptive Error Messages

Provide clear, user-friendly error messages:

```typescript
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .max(255, 'Email address is too long');

export const ageSchema = z
  .number()
  .min(18, 'You must be at least 18 years old')
  .max(120, 'Please enter a valid age');
```

### 7. Strict Schemas for APIs

Use `.strict()` for API response schemas to prevent data leakage:

```typescript
export const userPublicResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
  })
  .strict(); // Prevents accidental inclusion of password, etc.
```

## Examples

### Complete Feature Schema Set

```
lib/types/users/
  user.schema.ts                  # Shared user entity
  user-create-request.schema.ts   # POST /api/users request
  user-update-request.schema.ts   # PATCH /api/users/:id request
  user-response.schema.ts         # User API response
  user-list-response.schema.ts    # User list API response
  update-profile-action.schema.ts # Update profile action state
```

### Request Schema with Validation

```typescript
// lib/types/users/user-create-request.schema.ts
import { z } from 'zod';
import {
  sanitizedEmail,
  sanitizedString,
} from '@/lib/validation/sanitization.util';

export const userCreateRequestSchema = z.object({
  name: sanitizedString({ min: 1, max: 100 }),
  email: sanitizedEmail,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  role: z.enum(['admin', 'user']).default('user'),
});

export type UserCreateRequest = z.infer<typeof userCreateRequestSchema>;
```

### Response Schema with Strict Mode

```typescript
// lib/types/users/user-response.schema.ts
import { z } from 'zod';

export const userResponseSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['admin', 'user']),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict(); // Prevent password or sensitive fields from leaking

export type UserResponse = z.infer<typeof userResponseSchema>;
```

### Action Schema

```typescript
// lib/types/users/update-profile-action.schema.ts
import { z } from 'zod';
import { createActionStateSchema } from '@/lib/types/actions/action-state.type';

export const updateProfileActionSchema = createActionStateSchema({
  name: z.string().optional(),
  email: z.string().email().optional(),
});

export type UpdateProfileActionState = z.infer<
  typeof updateProfileActionSchema
>;
```

## Migration Checklist

When adding schemas to existing code:

- [ ] Create schema file with proper naming convention
- [ ] Place in appropriate domain directory
- [ ] Export both schema and type
- [ ] Add JSDoc comments for complex logic
- [ ] Use sanitization utilities where appropriate
- [ ] Use `.strict()` for API response schemas
- [ ] Write unit tests for schema validation
- [ ] Update related API routes or actions to use schema
- [ ] Update documentation if adding new patterns

## Related Documentation

- [Validation Guide](./validation-guide.md)
- [API Validation Guide](./api-validation-guide.md)
- [Action Validation Guide](./action-validation-guide.md)
- [TypeScript Naming Conventions](../../agents/typescript.md)
