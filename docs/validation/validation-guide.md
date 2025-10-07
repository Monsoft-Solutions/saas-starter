# Validation Guide

Comprehensive guide to input/output validation in the SaaS Starter project.

## Table of Contents

- [Overview](#overview)
- [Validation Utilities](#validation-utilities)
- [API Route Validation](#api-route-validation)
- [Server Action Validation](#server-action-validation)
- [Error Handling](#error-handling)
- [Sanitization](#sanitization)
- [Best Practices](#best-practices)

## Overview

The validation system provides:

- ✅ **Input Validation** - Validate all incoming data (requests, forms, query params)
- ✅ **Output Validation** - Validate API responses to prevent data leakage
- ✅ **Type Safety** - Automatic TypeScript type inference from Zod schemas
- ✅ **Sanitization** - Clean and normalize user input
- ✅ **Error Codes** - Standardized error codes for client handling
- ✅ **Development Helpers** - Detailed validation errors in development mode

## Validation Utilities

### Request Validation

Located in `lib/validation/request-validator.util.ts`

#### validateRequest

Validates any data against a Zod schema:

```typescript
import { validateRequest } from '@/lib/validation/request-validator.util';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const result = validateRequest(data, userSchema);

if (!result.success) {
  return error(result.error, {
    status: 400,
    details: result.details, // Only in development
  });
}

// Use validated data
const { name, email } = result.data;
```

#### validateQueryParams

Validates URL query parameters:

```typescript
import { validateQueryParams } from '@/lib/validation/request-validator.util';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
});

const result = validateQueryParams(request.nextUrl.searchParams, querySchema);
```

#### validateRouteParams

Validates route parameters:

```typescript
import { validateRouteParams } from '@/lib/validation/request-validator.util';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const result = validateRouteParams(route.params, paramsSchema);
```

#### validateFormData

Validates form data:

```typescript
import { validateFormData } from '@/lib/validation/request-validator.util';

const formSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
});

const result = validateFormData(formData, formSchema);
```

### Response Validation

Located in `lib/validation/validated-response.util.ts`

#### validatedOk

Validates response data before returning:

```typescript
import { validatedOk } from '@/lib/validation/validated-response.util';

const userResponseSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
  })
  .strict(); // Prevent extra fields

const user = await getUserById(id);
return validatedOk(user, userResponseSchema);
```

#### validatedCreated

Validates response data with 201 status:

```typescript
import { validatedCreated } from '@/lib/validation/validated-response.util';

const newUser = await createUser(data);
return validatedCreated(newUser, userResponseSchema);
```

#### optionalValidatedOk

Validates only if `STRICT_RESPONSE_VALIDATION=true` (for gradual migration):

```typescript
import { optionalValidatedOk } from '@/lib/validation/validated-response.util';

// Validates in development, skips in production unless env var is set
return optionalValidatedOk(data, schema);
```

## API Route Validation

### Basic Example

```typescript
// app/api/users/route.ts
import { createApiHandler, withApiAuth } from '@/lib/server/api-handler';
import { validateRequest } from '@/lib/validation/request-validator.util';
import { validatedOk } from '@/lib/validation/validated-response.util';
import { userCreateRequestSchema, userResponseSchema } from '@/lib/types/users';

export const POST = withApiAuth(
  createApiHandler(async ({ request, context }) => {
    // Validate request body
    const body = await request.json();
    const validation = validateRequest(body, userCreateRequestSchema);

    if (!validation.success) {
      return error(validation.error, {
        status: 400,
        details: validation.details,
      });
    }

    // Create user with validated data
    const user = await createUser(validation.data);

    // Validate and return response
    return validatedOk(user, userResponseSchema);
  })
);
```

### Query Parameters Validation

```typescript
export const GET = withApiAuth(
  createApiHandler(async ({ request }) => {
    const querySchema = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
    });

    const validation = validateQueryParams(
      request.nextUrl.searchParams,
      querySchema
    );

    if (!validation.success) {
      return error(validation.error, { status: 400 });
    }

    const { page, limit } = validation.data;
    const users = await getUsers({ page, limit });

    return validatedOk(users, userListResponseSchema);
  })
);
```

### Route Parameters Validation

```typescript
export const GET = withApiAuth(
  createApiHandler(async ({ route }) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const validation = validateRouteParams(route.params, paramsSchema);

    if (!validation.success) {
      return error(validation.error, { status: 400 });
    }

    const user = await getUserById(validation.data.id);
    return validatedOk(user, userResponseSchema);
  })
);
```

## Server Action Validation

### Using createTypedAction

```typescript
// app/(login)/actions.ts
import { createTypedAction } from '@/lib/types/actions/create-typed-action.util';
import { signInRequestSchema, signInActionSchema } from '@/lib/types/auth';

export const signIn = createTypedAction(
  signInRequestSchema, // Input schema
  signInActionSchema, // Output schema
  async (data) => {
    // Handler
    const { email, password } = data; // Typed!

    const result = await authenticateUser(email, password);

    if (!result.success) {
      return {
        error: 'Invalid credentials',
        email, // Preserve email for UX
      };
    }

    return {
      success: 'Signed in successfully',
      redirectUrl: '/app',
    };
  }
);
```

### Using createTypedActionWithUser

```typescript
import { createTypedActionWithUser } from '@/lib/types/actions/create-typed-action.util';
import { requireServerContext } from '@/lib/auth/server-context';

export const updateProfile = createTypedActionWithUser(
  updateProfileInputSchema,
  updateProfileOutputSchema,
  async (data, user) => {
    // user is typed and guaranteed to exist
    await updateUserProfile(user.id, data);

    return {
      success: 'Profile updated successfully',
    };
  },
  async () => {
    const { user } = await requireServerContext();
    return user;
  }
);
```

### Client Usage with useActionState

```typescript
'use client';

import { useActionState } from 'react';
import { signIn } from './actions';

function SignInForm() {
  const [state, formAction] = useActionState(signIn, {});

  return (
    <form action={formAction}>
      {state.error && <div className="error">{state.error}</div>}
      {state.success && <div className="success">{state.success}</div>}

      <input
        type="email"
        name="email"
        defaultValue={state.email} // Preserved on error
      />
      <input type="password" name="password" />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

## Error Handling

### Error Codes

Use standardized error codes from `lib/validation/error-codes.enum.ts`:

```typescript
import {
  ErrorCode,
  getStatusForErrorCode,
} from '@/lib/validation/error-codes.enum';

return error('User not found', {
  status: getStatusForErrorCode(ErrorCode.USER_NOT_FOUND),
  code: ErrorCode.USER_NOT_FOUND,
});
```

### Error Response Format

```typescript
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": { // Only in development
    "name": {
      "_errors": ["String must contain at least 1 character(s)"]
    }
  }
}
```

### Client Error Handling

```typescript
const response = await fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify(userData),
});

const data = await response.json();

if ('error' in data) {
  // Handle error
  switch (data.code) {
    case 'VALIDATION_ERROR':
      // Show field-level errors
      break;
    case 'UNAUTHORIZED':
      // Redirect to login
      break;
    default:
    // Generic error
  }
}
```

## Sanitization

Use built-in sanitization utilities from `lib/validation/sanitization.util.ts`:

### Email Sanitization

```typescript
import { sanitizedEmail } from '@/lib/validation/sanitization.util';

const schema = z.object({
  email: sanitizedEmail, // Trims, lowercases, removes spaces
});
```

### String Sanitization

```typescript
import { sanitizedString } from '@/lib/validation/sanitization.util';

const schema = z.object({
  name: sanitizedString({ min: 1, max: 100 }), // Trims, collapses spaces
  bio: sanitizedString({ max: 500 }),
});
```

### Number Sanitization

```typescript
import { sanitizedNumber } from '@/lib/validation/sanitization.util';

const schema = z.object({
  age: sanitizedNumber({ min: 0, max: 150 }), // Coerces from string
  price: sanitizedNumber({ min: 0 }),
});
```

### Boolean Sanitization

```typescript
import { sanitizedBoolean } from '@/lib/validation/sanitization.util';

const schema = z.object({
  subscribe: sanitizedBoolean, // Converts 'true', '1', 'yes' to boolean
});
```

### Available Sanitizers

- `sanitizedEmail` - Email validation with trimming and lowercasing
- `sanitizedUrl` - URL validation with trimming
- `sanitizedString()` - String trimming with length constraints
- `sanitizedSlug` - Creates URL-friendly slugs
- `sanitizedPhone` - Normalizes phone numbers
- `sanitizedNumber()` - String to number coercion
- `sanitizedBoolean` - String to boolean coercion
- `sanitizedDate` - ISO date parsing
- `sanitizedStringArray()` - Array of sanitized strings

## Best Practices

### 1. Always Validate at Boundaries

Validate all data entering and leaving your system:

```typescript
// ✅ Good
export const POST = withApiAuth(async ({ request }) => {
  const validation = validateRequest(await request.json(), schema);
  if (!validation.success) {
    return error(validation.error, { status: 400 });
  }
  // Use validation.data
});

// ❌ Bad
export const POST = withApiAuth(async ({ request }) => {
  const data = await request.json();
  // No validation, assuming data shape
  await createUser(data);
});
```

### 2. Use Strict Schemas for Responses

Prevent accidental data leakage:

```typescript
// ✅ Good
export const userPublicSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
  })
  .strict(); // Rejects extra fields like 'password'

// ❌ Bad
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
}); // Allows extra fields to pass through
```

### 3. Provide Clear Error Messages

Make validation errors user-friendly:

```typescript
// ✅ Good
const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  age: z.number().min(18, 'You must be at least 18 years old'),
});

// ❌ Bad
const schema = z.object({
  email: z.string().email(), // Generic "Invalid email" message
  age: z.number().min(18), // Generic "Number must be >= 18"
});
```

### 4. Reuse Common Schemas

Don't repeat yourself:

```typescript
// ✅ Good
// lib/types/common/pagination-request.schema.ts
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Reuse in multiple endpoints
export const userListSchema = paginationSchema.extend({ ... });
export const postListSchema = paginationSchema.extend({ ... });

// ❌ Bad
// Duplicate pagination logic in every endpoint
```

### 5. Validate Output in Development

Catch response validation errors early:

```typescript
// Set in .env.local for development
STRICT_RESPONSE_VALIDATION = true;

// Or use validatedOk which always validates in development
return validatedOk(data, schema);
```

## Related Documentation

- [Schema Organization Guide](./schema-organization.md)
- [API Validation Guide](./api-validation-guide.md)
- [Action Validation Guide](./action-validation-guide.md)
- [Error Codes Reference](../../lib/validation/error-codes.enum.ts)
