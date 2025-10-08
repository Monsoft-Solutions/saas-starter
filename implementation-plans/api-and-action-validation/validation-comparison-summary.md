# API & Server Action Validation: Current vs. Proposed

**Date:** October 7, 2025

---

## Overview

This document provides a side-by-side comparison of current validation patterns against proposed improvements based on Next.js 15 and industry best practices.

---

## 1. Input Validation

### Current Implementation

```typescript
// API Route - Manual validation
export async function POST(request: NextRequest) {
  const rawPayload = await request.json();
  const parseResult = clientErrorPayloadSchema.safeParse(rawPayload);

  if (!parseResult.success) {
    const validationErrors = parseResult.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join('; ');

    logger.warn('Invalid client error payload received', {
      meta: { validationErrors: parseResult.error.errors },
    });

    return error('Invalid payload', {
      status: 400,
      details: validationErrors,
    });
  }

  const payload = parseResult.data;
  // ... use payload
}
```

```typescript
// Server Action - Wrapper-based validation
export const signIn = validatedAction(
  signInSchema,
  async (requestData, formData) => {
    const { email, password } = requestData;
    // ... logic
  }
);
```

**Strengths:**
✅ Zod validation enforced  
✅ Type safety from schema inference  
✅ Clear error messages

**Weaknesses:**
⚠️ Inconsistent patterns (manual vs wrapper)  
⚠️ Duplicated error formatting logic  
⚠️ No shared validation utility

---

### Proposed Implementation

```typescript
// Unified request validator utility
import { validateRequest } from '@/lib/validation/request-validator.util';

// API Route - Using shared utility
export const POST = createApiHandler(async ({ request }) => {
  const rawPayload = await request.json();
  const validation = validateRequest(rawPayload, clientErrorPayloadSchema);

  if (!validation.success) {
    return error(validation.error, {
      status: 400,
      details: validation.details, // Auto-formatted
    });
  }

  const payload = validation.data; // Typed automatically
  // ... use payload
});
```

```typescript
// Server Action - Enhanced wrapper with consistent pattern
export const signIn = validatedAction(
  signInRequestSchema, // Extracted schema
  async (data) => {
    // data is typed from schema
    const { email, password } = data;
    // ... logic
  }
);
```

**Improvements:**
✅ Consistent validation pattern across APIs and actions  
✅ Single source of error formatting  
✅ Reusable `validateRequest` utility  
✅ Better separation of concerns

---

## 2. Output Validation

### Current Implementation

```typescript
// API Route - No output validation
export const GET = createApiHandler(async ({ request, context }) => {
  const notifications = await getNotifications(user.id);

  // No validation - just return
  return {
    notifications,
    unreadCount,
  };
});
```

```typescript
// Server Action - Loosely typed return
export const signIn = validatedAction(signInSchema, async (requestData) => {
  // ...

  // Return type is ActionState
  return {
    error: 'Invalid credentials',
    email, // Any field can be added
    someRandomField: 'anything', // No type safety!
  };
});
```

**Weaknesses:**
❌ No runtime validation of outputs  
❌ Can accidentally leak sensitive data  
❌ Type errors not caught until runtime  
❌ Client can't infer response types

---

### Proposed Implementation

```typescript
// API Route - Validated output
import { validatedOk } from '@/lib/validation/validated-response.util';
import { notificationListResponseSchema } from '@/lib/types/notifications';

export const GET = createApiHandler(async ({ request, context }) => {
  const notifications = await getNotifications(user.id);

  const response = {
    notifications,
    unreadCount,
  };

  // Validates response shape before returning
  return validatedOk(response, notificationListResponseSchema);
});
```

```typescript
// Server Action - Typed return with validation
import { typedAction } from '@/lib/auth/middleware';
import { signInRequestSchema, signInActionSchema } from '@/lib/types/auth';

export const signIn = typedAction(
  signInRequestSchema,
  signInActionSchema, // Output schema
  async (data) => {
    // ...

    // Return must match signInActionSchema
    return {
      error: 'Invalid credentials',
      email,
      // someRandomField: 'anything', // TypeScript error!
    };
  }
);

// Client-side: Full type inference
const [state, action] = useActionState(signIn, initialState);
// state.email is typed as string | undefined
```

**Improvements:**
✅ Runtime validation prevents data leaks  
✅ Schema-enforced response structure  
✅ Full type inference on client  
✅ Catches bugs at compile time  
✅ Self-documenting API contracts

---

## 3. Schema Organization

### Current Implementation

```
lib/types/
  logger/
    client-error-payload.schema.ts
  admin/
    ban-user.schema.ts
    user-list-filters.schema.ts
  notifications/
    notification-event.schema.ts
    pagination.type.ts
```

```typescript
// Inline schemas (not reusable)
const updateNotificationSchema = z.object({
  action: z.enum(['mark_read', 'toggle_read', 'dismiss']),
});
```

**Issues:**
⚠️ Inconsistent: some inline, some extracted  
⚠️ No clear naming convention  
⚠️ Mix of `*.type.ts` and `*.schema.ts`  
⚠️ No request/response distinction

---

### Proposed Implementation

```
lib/types/
  [domain]/
    [feature]-request.schema.ts    # Request validation
    [feature]-response.schema.ts   # Response validation
    [feature]-action.schema.ts     # Action state
    [feature].schema.ts            # Shared entities

# Examples:
lib/types/auth/
  sign-in-request.schema.ts
  sign-in-response.schema.ts
  sign-in-action.schema.ts
  user-profile.schema.ts

lib/types/notifications/
  notification-list-request.schema.ts
  notification-list-response.schema.ts
  notification-update-request.schema.ts
  notification.schema.ts
  notification-action.schema.ts
```

```typescript
// All schemas extracted and named clearly
// lib/types/notifications/notification-update-request.schema.ts
export const notificationUpdateRequestSchema = z.object({
  action: z.enum(['mark_read', 'toggle_read', 'dismiss']),
});

export type NotificationUpdateRequest = z.infer<
  typeof notificationUpdateRequestSchema
>;
```

**Improvements:**
✅ Consistent naming: `*-request`, `*-response`, `*-action`  
✅ Clear purpose from filename  
✅ All schemas extracted and reusable  
✅ Better discoverability  
✅ Supports API documentation generation

---

## 4. Error Handling

### Current Implementation

```typescript
// Inconsistent error responses
// API Route A
if (!validation.success) {
  return NextResponse.json(
    { error: 'Invalid data', details: validation.error.format() },
    { status: 400 }
  );
}

// API Route B
if (!validation.success) {
  return error('Invalid payload', {
    status: 400,
    details: validationErrors,
  });
}

// Server Action
if (!result.success) {
  return { error: resolveValidationError(result.error) };
}
```

**Issues:**
⚠️ Mix of manual `NextResponse.json` and `error()` helper  
⚠️ Inconsistent error detail formatting  
⚠️ No error codes  
⚠️ Different formats for API vs Actions

---

### Proposed Implementation

```typescript
// lib/validation/error-codes.enum.ts
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMIT = 'RATE_LIMIT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
```

```typescript
// Consistent error responses everywhere
import { validateRequest } from '@/lib/validation/request-validator.util';
import { ErrorCode } from '@/lib/validation/error-codes.enum';

// API Route
const validation = validateRequest(data, schema);
if (!validation.success) {
  return error(validation.error, {
    status: 400,
    code: ErrorCode.VALIDATION_ERROR,
    details: validation.details,
  });
}

// Server Action
const validation = validateRequest(data, schema);
if (!validation.success) {
  return {
    error: validation.error,
    code: ErrorCode.VALIDATION_ERROR,
    details: validation.details,
  };
}
```

**Improvements:**
✅ Consistent error format across stack  
✅ Error codes for programmatic handling  
✅ Structured error details  
✅ Client can handle errors by code  
✅ Better error tracking/monitoring

---

## 5. Type Safety & Inference

### Current Implementation

```typescript
// Server Action - Generic return type
export type ActionState = {
  error?: string;
  success?: string;
} & Record<string, string | number | undefined>;

// Usage: No type safety
export const signIn = validatedAction(
  signInSchema,
  async (data): Promise<ActionState> => {
    return {
      error: 'Failed',
      randomField: 123, // Allowed but not intended
    };
  }
);

// Client: No type inference
const [state, action] = useActionState(signIn, {});
// state.randomField - type is unknown
```

```typescript
// API Response - Compile-time type only
export type ApiResponse<T> = T | ApiError;

const response: ApiResponse<NotificationList> =
  await fetchApi('/api/notifications');
// Client must manually type and trust the response
```

**Weaknesses:**
❌ Weak action return types  
❌ No schema-to-type inference for clients  
❌ Manual type assertions required  
❌ Runtime shape doesn't match TypeScript

---

### Proposed Implementation

```typescript
// Typed action with schema-enforced return
import { createActionStateSchema } from '@/lib/types/actions/action-state.type';

const signInActionSchema = createActionStateSchema({
  email: z.string().optional(),
  redirectUrl: z.string().url().optional(),
});

export const signIn = typedAction(
  signInRequestSchema,
  signInActionSchema,
  async (data) => {
    return {
      error: 'Failed',
      email: data.email,
      // randomField: 123, // TypeScript error!
    };
  }
);

// Client: Full type inference
const [state, action] = useActionState(signIn, {});
// state.email is typed as string | undefined
// state.redirectUrl is typed as string | undefined
```

```typescript
// API with schema-driven type inference
import { z } from 'zod';
import { notificationListResponseSchema } from '@/lib/types/notifications';

// Type automatically inferred from schema
type NotificationListResponse = z.infer<typeof notificationListResponseSchema>;

// API returns validated data
export const GET = createValidatedApiHandler(
  requestSchema,
  notificationListResponseSchema,
  async ({ data, context }) => {
    // Return type enforced by schema
    return {
      notifications: [...],
      pagination: { ... },
    };
  }
);
```

**Improvements:**
✅ Schema is single source of truth  
✅ Automatic type inference  
✅ Compile-time and runtime type safety  
✅ No manual type assertions  
✅ Refactoring-safe

---

## 6. Input Sanitization

### Current Implementation

```typescript
// Minimal sanitization - relies on Zod alone
const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// No explicit string trimming, HTML sanitization, etc.
```

**Weaknesses:**
⚠️ Email might have leading/trailing spaces  
⚠️ Strings not normalized  
⚠️ No HTML sanitization for user content  
⚠️ XSS vulnerabilities possible

---

### Proposed Implementation

```typescript
// lib/validation/sanitization.util.ts
import { z } from 'zod';

export const sanitizedEmail = z
  .string()
  .email()
  .trim()
  .toLowerCase()
  .transform((email) => email.replace(/\s+/g, ''));

export const sanitizedString = (options?) =>
  z
    .string()
    .trim()
    .transform((val) => val.replace(/\s+/g, ' '));

export const sanitizedHtml = z.string().transform((html) => {
  // Use sanitize-html or DOMPurify
  return sanitizeHtml(html, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p'],
    allowedAttributes: { a: ['href'] },
  });
});
```

```typescript
// Usage in schemas
const signUpSchema = z.object({
  email: sanitizedEmail,
  name: sanitizedString({ min: 2, max: 100 }),
  bio: sanitizedHtml.optional(),
});
```

**Improvements:**
✅ Automatic data normalization  
✅ XSS prevention  
✅ Consistent formatting  
✅ Defense in depth

---

## 7. Developer Experience

### Current Implementation

**Creating a new API route:**

```typescript
// 1. Define schema inline or in separate file (inconsistent)
const mySchema = z.object({ ... });

// 2. Manually parse and validate
const result = mySchema.safeParse(data);
if (!result.success) {
  // 3. Manually format errors
  const errors = result.error.errors.map(...);
  // 4. Manually return error response
  return error(...);
}

// 5. Process data
const validData = result.data;

// 6. Return response (no validation)
return { data: validData };
```

**Issues:**
⚠️ Lots of boilerplate  
⚠️ Easy to forget steps  
⚠️ Inconsistent patterns  
⚠️ No guardrails

---

### Proposed Implementation

**Creating a new API route:**

```typescript
// 1. Define request and response schemas
import { myRequestSchema, myResponseSchema } from '@/lib/types/my-domain';

// 2. Use validated handler (handles all validation automatically)
export const POST = withApiAuth(
  createValidatedApiHandler(
    myRequestSchema,
    myResponseSchema,
    async ({ data, context }) => {
      // data is validated and typed
      // Just implement business logic

      // Return is automatically validated
      return {
        result: 'success',
      };
    }
  )
);
```

**Creating a new server action:**

```typescript
// 1. Define schemas
import {
  myActionRequestSchema,
  myActionStateSchema,
} from '@/lib/types/my-domain';

// 2. Use typed action wrapper
export const myAction = typedAction(
  myActionRequestSchema,
  myActionStateSchema,
  async (data) => {
    // Implement logic

    // Return is typed and validated
    return { success: 'Done' };
  }
);
```

**Improvements:**
✅ Minimal boilerplate  
✅ Consistent patterns enforced  
✅ Automatic validation  
✅ Cannot forget validation steps  
✅ Faster development  
✅ Better onboarding

---

## Summary: Key Improvements

| Aspect                  | Current                   | Proposed               | Benefit               |
| ----------------------- | ------------------------- | ---------------------- | --------------------- |
| **Input Validation**    | Manual + Wrapper patterns | Unified wrapper        | Consistency           |
| **Output Validation**   | ❌ None                   | ✅ Schema-based        | Security, Type Safety |
| **Schema Organization** | Inconsistent              | Standardized naming    | Discoverability       |
| **Error Handling**      | Inconsistent              | Unified with codes     | Better UX             |
| **Type Inference**      | Manual assertions         | Automatic from schemas | Developer Experience  |
| **Sanitization**        | Minimal                   | Comprehensive          | Security              |
| **Boilerplate**         | High                      | Low                    | Velocity              |
| **Documentation**       | Implicit                  | Schema-driven          | API Contracts         |

---

## Next Steps

1. ✅ Review this comparison
2. ⏭️ Approve implementation plan
3. ⏭️ Begin Phase 1: Foundation utilities
4. ⏭️ Migrate critical endpoints
5. ⏭️ Roll out to all APIs/actions

---

**Document Version:** 1.0  
**Date:** October 7, 2025
