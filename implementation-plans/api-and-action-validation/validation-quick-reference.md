# Validation Patterns Quick Reference

**Quick guide for implementing validated APIs and server actions**

---

## Current Patterns (As of October 2025)

### ✅ Good Practices Already in Use

```typescript
// ✅ Using Zod schemas for input validation
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// ✅ Using validation wrappers for server actions
export const myAction = validatedAction(schema, async (data) => {
  // data is validated and typed
});

// ✅ Using auth wrappers for API routes
export const GET = withApiAuth(async ({ context }) => {
  // context includes authenticated user
});

// ✅ Extracting schemas to dedicated files
// lib/types/domain/feature.schema.ts
export const featureSchema = z.object({ ... });
```

---

## Proposed Best Practices

### Schema Organization

```typescript
// lib/types/[domain]/[feature]-request.schema.ts
export const createUserRequestSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
});

// lib/types/[domain]/[feature]-response.schema.ts
export const userResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  createdAt: z.string().datetime(),
});

// lib/types/[domain]/[feature]-action.schema.ts
export const createUserActionSchema = createActionStateSchema({
  userId: z.string().optional(),
});
```

### API Route Pattern

```typescript
// app/api/users/route.ts
import { createValidatedApiHandler } from '@/lib/server/validated-api-handler';
import { withApiAuth } from '@/lib/server/api-handler';
import { createUserRequestSchema, userResponseSchema } from '@/lib/types/users';

export const POST = withApiAuth(
  createValidatedApiHandler(
    createUserRequestSchema, // Input schema
    userResponseSchema, // Output schema
    async ({ data, context }) => {
      // data is validated and typed
      const { name, email } = data;

      // context includes authenticated user
      const { user } = context;

      // Business logic
      const newUser = await createUser({ name, email });

      // Return is automatically validated against userResponseSchema
      return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt.toISOString(),
      };
    }
  )
);
```

### Server Action Pattern

```typescript
// app/actions/users.ts
import { typedAction } from '@/lib/auth/middleware';
import {
  createUserRequestSchema,
  createUserActionSchema,
} from '@/lib/types/users';

export const createUser = typedAction(
  createUserRequestSchema, // Input schema
  createUserActionSchema, // Output schema
  async (data) => {
    // data is validated and typed
    const { name, email } = data;

    try {
      const user = await db.insert(userTable).values({
        name,
        email,
      });

      // Return matches createUserActionSchema
      return {
        success: 'User created successfully',
        userId: user.id,
      };
    } catch (error) {
      return {
        error: 'Failed to create user',
      };
    }
  }
);

// Client usage with type inference
const [state, formAction] = useActionState(createUser, {});
// state.userId is typed as string | undefined
// state.success is typed as string | undefined
```

### Sanitization Pattern

```typescript
// Use sanitization utilities in schemas
import {
  sanitizedEmail,
  sanitizedString,
  sanitizedHtml,
} from '@/lib/validation/sanitization.util';

export const createPostRequestSchema = z.object({
  title: sanitizedString({ min: 3, max: 200 }),
  content: sanitizedHtml,
  authorEmail: sanitizedEmail,
});

// This will:
// - Trim whitespace
// - Normalize spaces
// - Sanitize HTML (prevent XSS)
// - Lowercase and clean email
```

---

## Common Schemas

### Pagination

```typescript
// lib/types/common/pagination.schema.ts
export const paginationRequestSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const paginationResponseSchema = z.object({
  limit: z.number(),
  offset: z.number(),
  total: z.number(),
  hasMore: z.boolean(),
});

// Usage
const listUsersRequestSchema = paginationRequestSchema.extend({
  role: z.enum(['admin', 'user']).optional(),
});
```

### Success/Error Responses

```typescript
// lib/types/common/responses.schema.ts
export const successResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
});

export const errorResponseSchema = z.object({
  error: z.string(),
  code: z.nativeEnum(ErrorCode).optional(),
  details: z.unknown().optional(),
});
```

---

## Error Handling

### Error Codes

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

### Consistent Error Responses

```typescript
// API Route
import { error } from '@/lib/http/response';
import { ErrorCode } from '@/lib/validation/error-codes.enum';

if (!validation.success) {
  return error(validation.error, {
    status: 400,
    code: ErrorCode.VALIDATION_ERROR,
    details: validation.details,
  });
}

// Server Action
if (!validation.success) {
  return {
    error: validation.error,
    code: ErrorCode.VALIDATION_ERROR,
  };
}
```

---

## Advanced Patterns

### Conditional Validation

```typescript
// Validate field B only if field A has specific value
const conditionalSchema = z
  .object({
    type: z.enum(['email', 'sms']),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'email' && !data.email) return false;
      if (data.type === 'sms' && !data.phone) return false;
      return true;
    },
    {
      message: 'Email is required when type is email, phone when type is sms',
    }
  );
```

### Nested Object Validation

```typescript
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zipCode: z.string().regex(/^\d{5}$/),
});

const userWithAddressSchema = z.object({
  name: z.string(),
  email: sanitizedEmail,
  address: addressSchema,
});
```

### Array Validation

```typescript
const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1)
    .max(50),
});
```

### Transform & Preprocess

```typescript
const dateSchema = z.string().transform((val) => new Date(val));

const upperCaseSchema = z.string().transform((val) => val.toUpperCase());

const jsonSchema = z.string().transform((val) => JSON.parse(val));
```

---

## Migration Checklist

### For API Routes

- [ ] Extract inline schemas to `lib/types/[domain]/`
- [ ] Create `*-request.schema.ts` for input
- [ ] Create `*-response.schema.ts` for output
- [ ] Replace manual validation with `validateRequest` helper
- [ ] Replace `ok()` with `validatedOk()` for output
- [ ] Update tests to cover validation edge cases
- [ ] Add JSDoc comments to schemas

### For Server Actions

- [ ] Extract inline schemas
- [ ] Create action state schema using `createActionStateSchema`
- [ ] Replace `validatedAction` with `typedAction`
- [ ] Update client code to use type inference
- [ ] Test action state types
- [ ] Update tests

---

## Testing Patterns

### Schema Testing

```typescript
import { describe, it, expect } from 'vitest';
import { userSchema } from './user.schema';

describe('userSchema', () => {
  it('should validate valid user data', () => {
    const result = userSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = userSchema.safeParse({
      name: 'John Doe',
      email: 'invalid-email',
    });

    expect(result.success).toBe(false);
    expect(result.error?.errors[0]?.path).toEqual(['email']);
  });

  it('should trim and normalize strings', () => {
    const result = userSchema.safeParse({
      name: '  John   Doe  ',
      email: '  john@example.com  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('John Doe');
      expect(result.data.email).toBe('john@example.com');
    }
  });
});
```

### API Route Testing

```typescript
import { POST } from './route';

describe('POST /api/users', () => {
  it('should return 400 on invalid input', async () => {
    const request = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid' }),
    });

    const response = await POST(request, { params: {} });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('should create user on valid input', async () => {
    const request = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
      }),
    });

    const response = await POST(request, { params: {} });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.email).toBe('john@example.com');
  });
});
```

---

## Common Pitfalls

### ❌ Don't: Inline complex schemas

```typescript
// Bad - hard to reuse and test
export const POST = async (request) => {
  const schema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    // ... 20 more fields
  });

  const result = schema.safeParse(await request.json());
  // ...
};
```

### ✅ Do: Extract to dedicated files

```typescript
// Good - reusable and testable
import { createUserRequestSchema } from '@/lib/types/users';

export const POST = createValidatedApiHandler(
  createUserRequestSchema
  // ...
);
```

### ❌ Don't: Return unvalidated data

```typescript
// Bad - might leak sensitive fields
return ok(user); // user might have password, tokens, etc.
```

### ✅ Do: Validate outputs

```typescript
// Good - only returns approved fields
return validatedOk(user, userResponseSchema);
```

### ❌ Don't: Use `any` types

```typescript
// Bad
const data: any = await request.json();
```

### ✅ Do: Infer from schemas

```typescript
// Good
type UserInput = z.infer<typeof userRequestSchema>;
```

---

## Resources

- [Zod Documentation](https://zod.dev)
- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- Internal: `docs/validation/api-validation-guide.md`
- Internal: `docs/validation/action-validation-guide.md`

---

**Last Updated:** October 7, 2025  
**Version:** 1.0
