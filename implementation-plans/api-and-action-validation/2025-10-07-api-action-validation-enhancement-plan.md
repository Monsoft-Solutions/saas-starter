# API & Server Action Validation Enhancement Implementation Plan

**Date:** October 7, 2025  
**Status:** Draft  
**Priority:** High  
**Complexity:** Medium-High

---

## Executive Summary

This plan addresses comprehensive improvements to input/output validation across API routes and server actions, implementing industry best practices from Next.js 15, Zod validation patterns, and type-safe API design. The current implementation has strong input validation but lacks consistent output validation, schema organization, and type inference patterns that ensure runtime and compile-time safety.

---

## Table of Contents

1. [Research Summary & Best Practices](#research-summary--best-practices)
2. [Current Implementation Analysis](#current-implementation-analysis)
3. [Identified Gaps & Issues](#identified-gaps--issues)
4. [Proposed Architecture](#proposed-architecture)
5. [Implementation Phases](#implementation-phases)
6. [File Structure Changes](#file-structure-changes)
7. [Migration Strategy](#migration-strategy)
8. [Testing Strategy](#testing-strategy)
9. [Success Criteria](#success-criteria)

---

## Research Summary & Best Practices

### Key Findings from Industry Research

#### 1. **Schema-Based Validation (Zod)**

- ✅ **Currently Implemented:** Input validation with `safeParse`
- ⚠️ **Missing:** Output validation and schema-based DTOs
- **Best Practice:** Use Zod schemas for both request and response validation
- **Benefit:** Runtime type safety + TypeScript inference

#### 2. **Data Transfer Objects (DTOs)**

- ❌ **Not Implemented:** No standardized DTO pattern
- **Best Practice:** Define explicit response shapes with Zod schemas
- **Benefit:** Prevents accidental data exposure, ensures consistency

#### 3. **Type-Safe API Responses**

- ⚠️ **Partially Implemented:** `ApiResponse<T>` provides compile-time types but no runtime validation
- **Best Practice:** Combine TypeScript generics with Zod schema validation
- **Benefit:** Full type safety from API to client

#### 4. **Consistent Error Handling**

- ✅ **Well Implemented:** Standardized error responses via `error()` helper
- 🔄 **Enhancement Needed:** Add error code enums and structured error details

#### 5. **Input Sanitization**

- ⚠️ **Minimal Implementation:** Relies on Zod validation only
- **Best Practice:** Add explicit sanitization for HTML content, trim strings
- **Benefit:** XSS prevention, data consistency

#### 6. **Validation Middleware Pattern**

- ✅ **Good Implementation:** `validatedAction` and `withApiAuth` wrappers
- 🔄 **Enhancement Needed:** Unify patterns, add output validation

---

## Current Implementation Analysis

### Strengths

1. **Server Actions Validation (`lib/auth/middleware.ts`)**
   - ✅ `validatedAction` provides Zod-based input validation
   - ✅ `validatedActionWithUser` enforces authentication
   - ✅ Clear error messages from Zod validation
   - ✅ Consistent `ActionState` return type

2. **API Handler Wrapper (`lib/server/api-handler.ts`)**
   - ✅ `createApiHandler` normalizes responses
   - ✅ `withApiAuth` and `withOrganization` provide auth layers
   - ✅ Centralized error logging
   - ✅ Flexible result normalization

3. **Schema Organization**
   - ✅ Dedicated `*.schema.ts` files in `lib/types/*`
   - ✅ Co-located schemas with type inference
   - ✅ Naming convention established

4. **Type Safety**
   - ✅ Strong TypeScript usage throughout
   - ✅ Type inference from Zod schemas
   - ✅ `ServerContext` and `OrganizationContext` types

### Weaknesses

1. **Output Validation**
   - ❌ No runtime validation of response payloads
   - ❌ Server actions return loosely-typed `ActionState`
   - ❌ API routes don't validate outgoing data against schemas

2. **Schema Consistency**
   - ⚠️ Some schemas inline in route files (e.g., `updateNotificationSchema`)
   - ⚠️ Others in dedicated files (e.g., `banUserSchema`)
   - ⚠️ No clear convention for when to extract schemas

3. **Code Duplication**
   - 🔄 Validation error formatting duplicated across files
   - 🔄 Auth checks partially duplicated between actions and API
   - 🔄 Manual `safeParse` + error response pattern repeated

4. **Type Inference Gaps**
   - ❌ Client code cannot infer API response types from schemas
   - ❌ `ActionState` doesn't preserve action-specific return types
   - ❌ No shared type source between server and client

5. **Error Handling Inconsistency**
   - ⚠️ Mix of string errors and structured error objects
   - ⚠️ Some routes use custom error formatting
   - ⚠️ No error code standardization

---

## Identified Gaps & Issues

### Critical Issues

1. **No Output Schema Validation**

   ```typescript
   // Current: No validation
   return ok(someData); // What if someData doesn't match expected shape?

   // Desired: Schema-validated output
   return ok(someData, responseSchema);
   ```

2. **Weak Action Return Types**

   ```typescript
   // Current: Generic ActionState
   export type ActionState = {
     error?: string;
     success?: string;
   } & Record<string, string | number | undefined>;

   // Problem: No type safety for action-specific data
   ```

3. **Schema Discoverability**
   - Inline schemas hard to reuse
   - No central registry of API contracts
   - Client teams must guess response shapes

### Medium Priority Issues

1. **Validation Middleware Duplication**
   - API routes manually call `safeParse`
   - Server actions use `validatedAction` wrapper
   - No shared validation helper

2. **Missing Request Schema Types**
   - Query params validated but not strongly typed
   - Route params not validated
   - Headers not validated

3. **Error Response Structure**
   - Inconsistent error detail formatting
   - No error code enums
   - Stack traces sometimes exposed

### Low Priority Issues

1. **Schema File Organization**
   - Flat structure in `lib/types/*`
   - Could benefit from better grouping

2. **Documentation**
   - No API contract documentation
   - Schema comments minimal

---

## Proposed Architecture

### Core Principles

1. **Single Source of Truth:** Zod schemas define both runtime validation and TypeScript types
2. **Validate at Boundaries:** Input and output validation at API/action entry/exit points
3. **Type Inference:** Automatic type derivation from schemas
4. **Fail Fast:** Validation errors caught immediately with clear messages
5. **DRY:** Shared validation utilities across actions and APIs

### New Validation Utilities

#### 1. **Validated Response Helper**

```typescript
// lib/validation/validated-response.util.ts
import { z } from 'zod';
import { ok, error, type ApiResponse } from '@/lib/http/response';

/**
 * Validates response data against schema before returning
 */
export function validatedOk<T extends z.ZodTypeAny>(
  data: unknown,
  schema: T,
  options?: { status?: number }
): NextResponse<ApiResponse<z.infer<T>>> {
  const result = schema.safeParse(data);

  if (!result.success) {
    logger.error('Response validation failed', {
      errors: result.error.errors,
      data,
    });

    // In development, expose validation errors
    if (process.env.NODE_ENV === 'development') {
      return error('Response validation failed', {
        status: 500,
        details: result.error.message,
      });
    }

    return error('Internal server error', { status: 500 });
  }

  return ok(result.data, options?.status);
}
```

#### 2. **Unified Request Validator**

```typescript
// lib/validation/request-validator.util.ts
import { z } from 'zod';

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };

/**
 * Validates request data with consistent error formatting
 */
export function validateRequest<T extends z.ZodTypeAny>(
  data: unknown,
  schema: T
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const firstError = result.error.errors[0];
    return {
      success: false,
      error: firstError?.message ?? 'Validation failed',
      details:
        process.env.NODE_ENV === 'development'
          ? result.error.format()
          : undefined,
    };
  }

  return { success: true, data: result.data };
}
```

#### 3. **Enhanced API Handler with Validation**

```typescript
// lib/server/validated-api-handler.ts
import { z } from 'zod';
import { type NextRequest } from 'next/server';
import { validateRequest } from '@/lib/validation/request-validator.util';
import { validatedOk } from '@/lib/validation/validated-response.util';
import { error } from '@/lib/http/response';

type ValidatedApiHandler<
  TInput extends z.ZodTypeAny,
  TOutput extends z.ZodTypeAny,
  TContext = void,
> = (args: {
  data: z.infer<TInput>;
  request: NextRequest;
  route: RouteContext;
  context: TContext;
}) => Promise<z.infer<TOutput>>;

export function createValidatedApiHandler<
  TInput extends z.ZodTypeAny,
  TOutput extends z.ZodTypeAny,
  TContext = void,
>(
  inputSchema: TInput,
  outputSchema: TOutput,
  handler: ValidatedApiHandler<TInput, TOutput, TContext>
) {
  return async (args: ApiHandlerArgs<TContext>) => {
    // Parse request body
    const rawBody = await args.request.json();
    const validation = validateRequest(rawBody, inputSchema);

    if (!validation.success) {
      return error(validation.error, {
        status: 400,
        details: validation.details,
      });
    }

    // Execute handler
    const result = await handler({
      data: validation.data,
      ...args,
    });

    // Validate and return response
    return validatedOk(result, outputSchema);
  };
}
```

#### 4. **Typed Action State**

```typescript
// lib/types/actions/action-state.type.ts
import { z } from 'zod';

/**
 * Base action state schema
 */
export const actionStateSchema = z.object({
  error: z.string().optional(),
  success: z.string().optional(),
});

/**
 * Create typed action state with additional data
 */
export function createActionStateSchema<T extends z.ZodRawShape>(dataShape: T) {
  return actionStateSchema.extend(dataShape);
}

// Example usage:
const signInStateSchema = createActionStateSchema({
  email: z.string().optional(),
  redirectUrl: z.string().url().optional(),
});

export type SignInState = z.infer<typeof signInStateSchema>;
```

#### 5. **Input Sanitization Utilities**

```typescript
// lib/validation/sanitization.util.ts
import { z } from 'zod';

/**
 * Zod transform to trim and sanitize strings
 */
export const sanitizedString = (options?: {
  min?: number;
  max?: number;
  pattern?: RegExp;
}) => {
  let schema = z.string().trim();

  if (options?.min) schema = schema.min(options.min);
  if (options?.max) schema = schema.max(options.max);
  if (options?.pattern) schema = schema.regex(options.pattern);

  return schema.transform((val) => {
    // Remove multiple spaces
    return val.replace(/\s+/g, ' ');
  });
};

/**
 * Email sanitization
 */
export const sanitizedEmail = z
  .string()
  .email()
  .trim()
  .toLowerCase()
  .transform((email) => email.replace(/\s+/g, ''));

/**
 * HTML content sanitization schema
 */
export const sanitizedHtml = z.string().transform((html) => {
  // In production, use DOMPurify or similar
  // For server-side, use a package like 'sanitize-html'
  return html; // Placeholder
});
```

### Schema Organization Structure

```
lib/
  types/
    [domain]/
      # Request schemas
      [feature]-request.schema.ts

      # Response schemas
      [feature]-response.schema.ts

      # Shared data schemas
      [feature].schema.ts

      # Action state schemas
      [feature]-action.schema.ts

# Examples:
lib/types/auth/
  sign-in-request.schema.ts
  sign-in-response.schema.ts
  sign-in-action.schema.ts
  user-profile.schema.ts

lib/types/notifications/
  notification-list-request.schema.ts
  notification-list-response.schema.ts
  notification.schema.ts
  notification-action.schema.ts
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1) (DONE)

**Goal:** Create validation utilities and establish patterns

#### Tasks

1. **Create Validation Utilities**
   - [ ] `lib/validation/validated-response.util.ts`
   - [ ] `lib/validation/request-validator.util.ts`
   - [ ] `lib/validation/sanitization.util.ts`
   - [ ] `lib/validation/error-codes.enum.ts`
   - [ ] Unit tests for all utilities

2. **Create Typed Action State System**
   - [ ] `lib/types/actions/action-state.type.ts`
   - [ ] `lib/types/actions/create-typed-action.util.ts`
   - [ ] Update `ActionState` type in middleware
   - [ ] Documentation

3. **Establish Schema Naming Convention**
   - [ ] Document schema file naming in TypeScript agent rules
   - [ ] Create schema template examples
   - [ ] Update `CLAUDE.md` with schema guidelines

**Deliverables:**

- Validation utility functions
- Schema organization guidelines
- Unit tests (95%+ coverage)

---

### Phase 2: API Route Enhancement (Week 2)

**Goal:** Enhance API routes with input/output validation

#### Tasks

1. **Create Response Schemas** ✅ DONE
   - [x] `lib/types/notifications/notification-list-response.schema.ts`
   - [x] `lib/types/notifications/notification-response.schema.ts`
   - [x] `lib/types/auth/user-profile-response.schema.ts`
   - [x] `lib/types/common/pagination-response.schema.ts`
   - [x] `lib/types/common/success-response.schema.ts`

2. **Enhance API Handler** ✅ DONE
   - [x] Create `createValidatedApiHandler` in `lib/server/validated-api-handler.ts`
   - [x] Add optional output validation to existing `createApiHandler`
   - [x] Maintain backward compatibility

3. **Migrate Critical API Routes** ✅ DONE (Phase 2.3)
   - [x] `/api/notifications` (GET) - Add response validation
   - [x] `/api/notifications/[id]` (PATCH) - Add request/response validation
   - [x] `/api/log-error` (POST) - Already has input validation, add output
   - [x] `/api/user` routes - Add full validation
   - [x] Create comprehensive test suite
   - See: `implementation-plans/api-and-action-validation/phase-2.3-migration-summary.md`

4. **Add Query & Route Param Validation**
   - [ ] Create query param validator helper
   - [ ] Create route param validator helper
   - [ ] Apply to paginated endpoints

**Deliverables:**

- ✅ 4 API routes with full validation (notifications, log-error, user)
- ✅ Response schemas for common patterns
- ✅ Comprehensive test suite created
- ⚠️ Integration tests need proper test environment setup (8/13 passing)

---

### Phase 3: Server Action Enhancement (Week 3)

**Goal:** Type-safe server actions with validated outputs

#### Tasks

1. **Create Action Response Schemas**
   - [ ] `lib/types/auth/sign-in-action.schema.ts`
   - [ ] `lib/types/auth/update-password-action.schema.ts`
   - [ ] `lib/types/organization/invite-member-action.schema.ts`
   - [ ] Common success/error schemas

2. **Enhance Action Middleware**
   - [ ] Update `validatedAction` to support output schemas
   - [ ] Update `validatedActionWithUser` similarly
   - [ ] Preserve backward compatibility
   - [ ] Add `typedAction` wrapper for strongly-typed returns

3. **Migrate High-Impact Actions**
   - [ ] `signIn` - Type-safe return with redirect handling
   - [ ] `signUp` - Validate output
   - [ ] `updatePassword` - Validate output
   - [ ] `inviteOrganizationMember` - Full validation

4. **Client-Side Type Inference**
   - [ ] Create `ActionReturn<T>` utility type
   - [ ] Update `useActionState` usage patterns
   - [ ] Documentation for consuming typed actions

**Deliverables:**

- Typed server actions
- Client-side type inference
- Migration guide

---

### Phase 4: Advanced Validation Patterns (Week 4)

**Goal:** Advanced validation features and developer experience

#### Tasks

1. **Add Conditional Validation**
   - [ ] Create `conditionalSchema` helper
   - [ ] Implement dependent field validation
   - [ ] Add examples and tests

2. **Add Sanitization Pipeline**
   - [ ] Integrate `sanitize-html` for server-side HTML sanitization
   - [ ] Create sanitization middleware
   - [ ] Apply to user-generated content endpoints

3. **Error Code Standardization**
   - [ ] Define error code enum
   - [ ] Map validation errors to codes
   - [ ] Update error responses to include codes
   - [ ] Client-side error code handling

4. **Add Schema Versioning Support**
   - [ ] Create versioned schema pattern
   - [ ] Document migration strategy for breaking changes
   - [ ] Example: `v1/` and `v2/` schema directories

5. **Performance Optimization**
   - [ ] Benchmark validation performance
   - [ ] Add schema parsing caching where beneficial
   - [ ] Optimize common validation paths

**Deliverables:**

- Advanced validation patterns
- Error code system
- Performance benchmarks

---

### Phase 5: Documentation & Developer Experience (Week 5)

**Goal:** Comprehensive documentation and tooling

#### Tasks

1. **API Documentation**
   - [ ] Generate OpenAPI/Swagger spec from schemas
   - [ ] Create API reference documentation
   - [ ] Add example requests/responses

2. **Developer Guides**
   - [ ] "Creating Validated APIs" guide
   - [ ] "Building Type-Safe Actions" guide
   - [ ] "Schema Organization Best Practices" guide
   - [ ] Migration guide for existing code

3. **Tooling**
   - [ ] VSCode snippets for common patterns
   - [ ] Script to validate all schemas
   - [ ] Script to check schema coverage

4. **Testing Infrastructure**
   - [ ] Schema test utilities
   - [ ] Mock data generators from schemas
   - [ ] Test helpers for validated endpoints

**Deliverables:**

- Complete documentation
- Developer tooling
- Testing utilities

---

## File Structure Changes

### New Files

```
lib/
  validation/
    validated-response.util.ts         # NEW
    request-validator.util.ts          # NEW
    sanitization.util.ts               # NEW
    error-codes.enum.ts                # NEW
    query-params.util.ts               # NEW
    route-params.util.ts               # NEW

  server/
    validated-api-handler.ts           # NEW

  types/
    actions/
      action-state.type.ts             # NEW
      create-typed-action.util.ts      # NEW

    common/
      pagination-response.schema.ts    # NEW
      success-response.schema.ts       # NEW
      error-response.schema.ts         # NEW

  # Domain-specific response schemas
  types/notifications/
    notification-list-response.schema.ts   # NEW
    notification-response.schema.ts        # NEW

  types/auth/
    sign-in-request.schema.ts         # NEW
    sign-in-response.schema.ts        # NEW
    sign-in-action.schema.ts          # NEW
    user-profile-response.schema.ts   # NEW

docs/
  validation/
    api-validation-guide.md            # NEW
    action-validation-guide.md         # NEW
    schema-organization.md             # NEW
    migration-guide.md                 # NEW
```

### Modified Files

```
lib/
  auth/
    middleware.ts                      # MODIFY - Add output validation support

  server/
    api-handler.ts                     # MODIFY - Add optional output validation

  http/
    response.ts                        # MODIFY - Add error codes, enhance types

app/
  api/
    notifications/
      route.ts                         # MODIFY - Add response validation
      [id]/route.ts                    # MODIFY - Add full validation

  (login)/
    actions.ts                         # MODIFY - Add typed returns
```

---

## Migration Strategy

### Backward Compatibility Approach

1. **Additive Changes**
   - All new utilities are additions, not replacements
   - Existing API handlers continue to work
   - Output validation is opt-in initially

2. **Gradual Migration**
   - Phase 2-3: Migrate high-traffic routes first
   - Phase 4: Migrate remaining routes
   - No big-bang rewrites

3. **Feature Flags**
   - Use environment variable to enable strict validation
   - `STRICT_VALIDATION_ENABLED=true` for staging/prod

### Migration Checklist Per Route

```markdown
## API Route Migration

- [ ] Extract inline schemas to `lib/types/[domain]/`
- [ ] Create request schema (`*-request.schema.ts`)
- [ ] Create response schema (`*-response.schema.ts`)
- [ ] Update route to use `validateRequest` helper
- [ ] Add `validatedOk` for responses
- [ ] Update tests to cover validation
- [ ] Update API documentation

## Server Action Migration

- [ ] Extract inline schemas
- [ ] Create action state schema
- [ ] Update action to use typed middleware
- [ ] Add output validation
- [ ] Update client usage to use inferred types
- [ ] Update tests
```

---

## Testing Strategy

### Unit Tests

1. **Validation Utilities**
   - Test `validateRequest` with valid/invalid inputs
   - Test `validatedOk` with valid/invalid outputs
   - Test sanitization transforms
   - Test error formatting

2. **Schemas**
   - Test each schema with valid data
   - Test edge cases (empty, null, undefined)
   - Test boundary conditions (min/max lengths)
   - Test type coercion

### Integration Tests

1. **API Routes**
   - Test request validation (400 on invalid input)
   - Test response validation (500 on invalid output in dev)
   - Test auth middleware integration
   - Test error response format

2. **Server Actions**
   - Test form data parsing
   - Test validation error messages
   - Test typed return values
   - Test `useActionState` integration

### E2E Tests

1. **Critical Flows**
   - Sign in/sign up with validation
   - API consumption with type safety
   - Error handling across stack

---

## Success Criteria

### Technical Metrics

- [ ] 100% of API routes have input validation
- [ ] 90%+ of API routes have output validation
- [ ] 100% of public API routes have response schemas
- [ ] 95%+ test coverage for validation utilities
- [ ] Zero validation-related production errors in 30 days

### Developer Experience Metrics

- [ ] Schema reuse: 3+ routes using each common schema
- [ ] Documentation: 100% of validation patterns documented
- [ ] Type safety: 0 `any` types in validation layer
- [ ] Migration: 80%+ of routes migrated to new patterns

### Performance Metrics

- [ ] Validation adds <10ms to P95 response time
- [ ] No memory leaks from schema caching
- [ ] Schema parsing cached where beneficial

---

## Risks & Mitigation

### Risk 1: Breaking Changes

**Mitigation:**

- Maintain backward compatibility in Phase 1-3
- Feature flag for strict validation
- Comprehensive testing before rollout

### Risk 2: Performance Overhead

**Mitigation:**

- Benchmark validation performance
- Cache parsed schemas
- Only validate in development if overhead is high

### Risk 3: Developer Adoption

**Mitigation:**

- Clear documentation and examples
- VSCode snippets for common patterns
- Pair programming sessions for migration

### Risk 4: Schema Drift

**Mitigation:**

- Automated schema validation in CI
- Regular schema audits
- Strong typing prevents runtime drift

---

## Next Steps

1. **Review & Approval**
   - [ ] Technical review by team leads
   - [ ] Security review of sanitization approach
   - [ ] Approve implementation timeline

2. **Phase 1 Kickoff**
   - [ ] Create feature branch
   - [ ] Set up project tracking
   - [ ] Begin utility implementation

3. **Continuous Monitoring**
   - [ ] Weekly progress reviews
   - [ ] Performance monitoring
   - [ ] Developer feedback collection

---

## Appendix

### Reference Examples

#### Example: Fully Validated API Route

```typescript
// app/api/notifications/route.ts
import { createValidatedApiHandler } from '@/lib/server/validated-api-handler';
import { withApiAuth } from '@/lib/server/api-handler';
import {
  notificationListRequestSchema,
  notificationListResponseSchema,
} from '@/lib/types/notifications';

export const GET = withApiAuth(
  createValidatedApiHandler(
    notificationListRequestSchema,
    notificationListResponseSchema,
    async ({ data, context }) => {
      const { limit, offset } = data;
      const { user } = context;

      const notifications = await getNotifications(user.id, {
        limit,
        offset,
      });

      // Response automatically validated against schema
      return {
        notifications,
        pagination: {
          limit,
          offset,
          hasMore: notifications.length === limit,
        },
      };
    }
  )
);
```

#### Example: Typed Server Action

```typescript
// app/(login)/actions.ts
import { typedAction } from '@/lib/auth/middleware';
import { signInRequestSchema, signInActionSchema } from '@/lib/types/auth';

export const signIn = typedAction(
  signInRequestSchema,
  signInActionSchema,
  async (data) => {
    // data is typed from request schema
    const { email, password } = data;

    const result = await auth.api.signInEmail({
      body: { email, password },
    });

    if (!result.user) {
      return {
        error: 'Invalid credentials',
        email, // Typed field
      };
    }

    // Return matches action schema
    return {
      success: 'Signed in successfully',
      redirectUrl: '/app',
    };
  }
);

// Client usage with full type inference
const [state, formAction] = useActionState(signIn, initialState);
// state.redirectUrl is typed as string | undefined
```

---

**Document Version:** 1.0  
**Last Updated:** October 7, 2025  
**Author:** AI Engineering Assistant  
**Status:** Ready for Review
