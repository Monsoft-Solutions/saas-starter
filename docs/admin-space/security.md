---
title: Admin Space Security
description: Comprehensive security architecture, threat mitigation, and best practices for the Admin Space
---

# Admin Space Security

The Admin Space implements a defense-in-depth security architecture with multiple layers of protection to ensure only authorized administrators can access sensitive system data and operations.

## Security Architecture

### Five-Layer Defense Model

The Admin Space uses a multi-layered security approach where each layer provides redundant protection:

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Middleware Protection                              │
│ • Route-level guards for /admin/* paths                    │
│ • Session validation                                        │
│ • Role verification                                         │
│ • Automatic redirects for unauthorized access               │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Server Context Validation                         │
│ • requireSuperAdminContext() on every page                 │
│ • User role re-verification                                │
│ • TypeScript type safety with SuperAdminContext            │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Server Action Authorization                       │
│ • Role checks in every action                              │
│ • Input validation with Zod schemas                        │
│ • Activity logging                                         │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: API Route Guards                                  │
│ • Admin context verification in handlers                   │
│ • Request validation                                       │
│ • Error handling with proper status codes                  │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 5: Component-Level Guards                            │
│ • Client-side permission checks (UI only)                  │
│ • Graceful degradation                                     │
│ • Never relied upon for security                           │
└─────────────────────────────────────────────────────────────┘
```

::: danger Critical Principle
Never trust client-side checks. Always validate permissions on the server.
:::

## Layer 1: Middleware Protection

The global middleware (`middleware.ts`) is the first line of defense.

### Implementation

```typescript
// middleware.ts
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Match route against guard registry
  const match = matchRouteGuard(pathname);

  if (match?.rule.superAdminRequired) {
    const session = await getServerSessionFromHeaders(requestHeaders);

    // No session = unauthorized
    if (!session) {
      return handleUnauthorized(rule.scope, request);
    }

    // Check role from session
    const { isUserAdmin } = await import('@/lib/auth/super-admin-context');
    const userRole = (session.user as { role?: string }).role;

    // Non-admin = forbidden
    if (!isUserAdmin(userRole)) {
      return handleSuperAdminRequired(rule.scope, request);
    }
  }

  return NextResponse.next();
}
```

### Route Guards

Route guards are defined in `lib/auth/route-guards.ts`:

```typescript
export const ROUTE_GUARDS: RouteGuardDefinition[] = [
  // Protect all /admin/* routes
  {
    pattern: /^\/admin($|\/)/,
    rule: {
      authRequired: true,
      organizationRequired: false,
      superAdminRequired: true,
      scope: 'page',
    },
  },

  // Protect all /api/admin/* endpoints
  {
    pattern: /^\/api\/admin\//,
    rule: {
      authRequired: true,
      organizationRequired: false,
      superAdminRequired: true,
      scope: 'api',
    },
  },
];
```

### Security Benefits

- **Early interception** - Blocks unauthorized requests before any handler runs
- **Pattern matching** - Protects entire route trees with regex patterns
- **Type safety** - Strongly typed guard definitions
- **Scope awareness** - Different handling for pages vs API routes

### Bypass Prevention

Routes cannot bypass middleware unless explicitly listed in bypass patterns:

```typescript
// Only these paths skip middleware entirely
const BYPASS_PATTERNS = [
  /^\/api\/auth\//, // BetterAuth endpoints
  /^\/_next\//, // Next.js internals
  /^\/favicon\.ico$/, // Static assets
];
```

## Layer 2: Server Context Validation

Every admin page must call `requireSuperAdminContext()`.

### Implementation

```typescript
// lib/auth/super-admin-context.ts
export async function requireSuperAdminContext(): Promise<SuperAdminContext> {
  // Get base server context (user + session + organization)
  const context = await requireServerContext();

  // Extract role from user object
  const userRole = (context.user as { role?: string }).role;

  // Verify admin role
  if (!isUserAdmin(userRole)) {
    throw new SuperAdminRequiredError('Super admin access required');
  }

  // Return typed context with guaranteed admin role
  return {
    ...context,
    user: {
      ...context.user,
      role: userRole as 'admin' | 'super-admin',
    },
  };
}
```

### Usage in Pages

```typescript
// app/(admin)/admin/users/page.tsx
export default async function AdminUsersPage() {
  // REQUIRED: Verify admin access
  const adminContext = await requireSuperAdminContext();

  // TypeScript now knows user.role is 'admin' | 'super-admin'
  // Safe to proceed with admin operations

  const users = await listAllUsers();
  return <UserTable users={users} />;
}
```

### Security Benefits

- **Redundant check** - Even if middleware fails, pages are protected
- **Type safety** - `SuperAdminContext` type guarantees admin role
- **Error handling** - Throws explicit error for unauthorized access
- **No bypass** - Cannot access page data without calling this function

## Layer 3: Server Action Authorization

Server actions verify admin role before executing operations.

### Implementation Pattern

```typescript
// app/actions/admin/update-user-role.action.ts
export async function updateUserRoleAction(
  input: UpdateUserRoleInput
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Verify admin context
    const adminContext = await requireSuperAdminContext();

    // 2. Validate input with Zod
    const validated = updateUserRoleSchema.parse(input);

    // 3. Perform operation
    await auth.api.setRole({
      userId: validated.userId,
      role: validated.role,
    });

    // 4. Log activity
    await logActivity({
      action: 'user.role.updated',
      metadata: {
        targetUserId: validated.userId,
        newRole: validated.role,
      },
    });

    // 5. Revalidate cache
    revalidatePath('/admin/users');

    return { success: true };
  } catch (error) {
    if (error instanceof SuperAdminRequiredError) {
      return { success: false, error: 'Unauthorized' };
    }

    if (error instanceof ZodError) {
      return { success: false, error: 'Invalid input' };
    }

    logger.error('[updateUserRole] Failed', { error });
    return { success: false, error: 'Operation failed' };
  }
}
```

### Security Checklist for Actions

✅ **Always verify admin context first**

```typescript
const adminContext = await requireSuperAdminContext();
```

✅ **Validate all inputs with Zod**

```typescript
const validated = schema.parse(input);
```

✅ **Log all operations**

```typescript
await logActivity({ action, metadata });
```

✅ **Handle errors gracefully**

```typescript
catch (error) {
  // Specific error handling
}
```

✅ **Revalidate affected caches**

```typescript
revalidatePath('/admin/users');
```

## Layer 4: API Route Guards

API routes implement their own authorization checks.

### Implementation Pattern

```typescript
// app/api/admin/users/route.ts
export async function GET(request: NextRequest) {
  try {
    // 1. Require admin context
    const adminContext = await requireSuperAdminContext();

    // 2. Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = userListFiltersSchema.parse({
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    });

    // 3. Fetch data
    const result = await listAllUsers(filters);

    // 4. Return response
    return NextResponse.json(result);
  } catch (error) {
    // Handle specific errors
    if (error instanceof SuperAdminRequiredError) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Super admin access required' },
        { status: 403 }
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'BadRequest', message: 'Invalid parameters' },
        { status: 400 }
      );
    }

    logger.error('[api/admin/users] Failed', { error });
    return NextResponse.json({ error: 'InternalServerError' }, { status: 500 });
  }
}
```

### Security Benefits

- **Context verification** - Independent of middleware
- **Input validation** - All parameters validated before use
- **Proper HTTP status codes** - Clear error responses
- **Logging** - All errors logged for monitoring

### Error Responses

| Status | Error               | Meaning                     | Response                     |
| ------ | ------------------- | --------------------------- | ---------------------------- |
| 401    | Unauthorized        | No valid session            | Redirect to sign-in          |
| 403    | Forbidden           | Valid session but not admin | Return error JSON            |
| 400    | BadRequest          | Invalid input parameters    | Return validation errors     |
| 404    | NotFound            | Resource doesn't exist      | Return not found             |
| 500    | InternalServerError | Server error                | Log and return generic error |

## Layer 5: Component Guards

Client components should check permissions for UI rendering only.

### Implementation

```typescript
'use client';

import { useSession } from '@/lib/auth/hooks/auth.hook';
import { isUserAdmin } from '@/lib/auth/super-admin-context';

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role;

  // Hide UI if not admin
  if (!isUserAdmin(userRole)) {
    return null;
  }

  return <>{children}</>;
}
```

::: warning Important
Client-side checks are for UX only. Never rely on them for security.
:::

### Why Client Checks Are Not Secure

1. **Client-side code is public** - Anyone can modify React DevTools
2. **Requests are separate** - Hidden UI doesn't prevent API calls
3. **Type safety doesn't help** - TypeScript is compile-time only

**Always validate on the server:**

```typescript
// ❌ BAD - Only client check
function AdminButton() {
  const { role } = useSession();

  if (role !== 'admin') return null;

  return <Button onClick={() => deleteUser()} />;  // VULNERABLE
}

// ✅ GOOD - Server action validates
function AdminButton() {
  const { role } = useSession();

  if (role !== 'admin') return null;  // UX only

  return (
    <Button onClick={() => deleteUserAction()}>   // Server validates
      Delete
    </Button>
  );
}
```

## Activity Logging & Audit Trail

All admin actions are logged for compliance and security monitoring.

### What Gets Logged

```typescript
{
  userId: string,           // Who performed the action
  action: string,           // What action was performed
  timestamp: Date,          // When it happened
  ipAddress: string,        // Where it came from
  userAgent: string,        // What browser/client
  metadata: object,         // Action-specific context
}
```

### Logged Actions

| Action                  | Description                   | Metadata                                            |
| ----------------------- | ----------------------------- | --------------------------------------------------- |
| `user.role.updated`     | User role changed             | `{ targetUserId, previousRole, newRole }`           |
| `user.banned`           | User banned                   | `{ targetUserId, reason, expiresAt }`               |
| `user.unbanned`         | User unbanned                 | `{ targetUserId }`                                  |
| `organization.deleted`  | Organization deleted          | `{ organizationId, organizationName, memberCount }` |
| `admin.stats.refreshed` | Statistics manually refreshed | `{ calculationDuration }`                           |
| `activity.exported`     | Activity logs exported        | `{ filterCriteria, resultCount }`                   |

### Implementation

```typescript
import { logActivity } from '@/lib/db/queries';

// In server action
await logActivity({
  action: 'user.role.updated',
  metadata: {
    targetUserId: userId,
    previousRole: user.role,
    newRole: newRole,
  },
});
```

### Audit Trail Query

```typescript
// Get all actions by a specific admin
const adminActions = await db
  .select()
  .from(activityLogs)
  .where(eq(activityLogs.userId, adminId))
  .orderBy(desc(activityLogs.timestamp));

// Get all role changes
const roleChanges = await db
  .select()
  .from(activityLogs)
  .where(eq(activityLogs.action, 'user.role.updated'))
  .orderBy(desc(activityLogs.timestamp));
```

## Threat Model & Mitigation

### Threat: Privilege Escalation

**Attack:** Non-admin user tries to access admin routes.

**Mitigation:**

- Middleware blocks at route level
- Server context verification on every page
- API routes validate independently
- Session role is server-authoritative (Better Auth managed)

### Threat: Session Hijacking

**Attack:** Attacker steals session cookie to gain admin access.

**Mitigation:**

- HTTPOnly cookies (not accessible to JavaScript)
- Secure flag in production (HTTPS only)
- SameSite attribute (CSRF protection)
- Short session lifetime with refresh
- IP address logging for forensics

### Threat: CSRF (Cross-Site Request Forgery)

**Attack:** Malicious site triggers admin actions via authenticated user.

**Mitigation:**

- Better Auth CSRF tokens on all mutations
- SameSite cookie attribute
- Origin header validation
- POST requests for state changes

### Threat: SQL Injection

**Attack:** Malicious input in search/filter parameters.

**Mitigation:**

- Drizzle ORM with parameterized queries
- Zod validation on all inputs
- No raw SQL with user input
- Type-safe query building

### Threat: XSS (Cross-Site Scripting)

**Attack:** Inject malicious scripts via user data.

**Mitigation:**

- React automatic escaping
- DOMPurify for rich text (if needed)
- Content Security Policy headers
- No `dangerouslySetInnerHTML` without sanitization

### Threat: Mass Assignment

**Attack:** Send extra fields to modify unintended data.

**Mitigation:**

- Zod schemas define exact shape
- No spreading of unknown objects
- Explicit field assignment only

### Threat: Denial of Service

**Attack:** Flood admin endpoints to overload system.

**Mitigation:**

- Rate limiting on admin routes
- Pagination on all list endpoints
- Query timeouts
- Resource limits on exports

## Best Practices

### Do's

✅ **Always use `requireSuperAdminContext()`**

```typescript
const adminContext = await requireSuperAdminContext();
```

✅ **Validate all inputs with Zod**

```typescript
const validated = schema.parse(input);
```

✅ **Log all admin operations**

```typescript
await logActivity({ action, metadata });
```

✅ **Use TypeScript strictly**

```typescript
// No 'any', leverage SuperAdminContext type
function handler(context: SuperAdminContext) {}
```

✅ **Handle errors properly**

```typescript
try {
  // Operation
} catch (error) {
  if (error instanceof SuperAdminRequiredError) {
    // Handle unauthorized
  }
  // Log and return safe error
}
```

✅ **Revalidate after mutations**

```typescript
revalidatePath('/admin/users');
revalidateTag('admin-stats');
```

### Don'ts

❌ **Don't trust client-side role checks**

```typescript
// BAD - Client can manipulate
if (session?.role === 'admin') {
  // Perform admin operation
}
```

❌ **Don't skip input validation**

```typescript
// BAD - Vulnerable to injection
const userId = request.query.userId; // No validation!
await deleteUser(userId);
```

❌ **Don't hardcode user IDs**

```typescript
// BAD - Privilege escalation risk
if (userId === 'admin_123') {
  // Grant admin access
}
```

❌ **Don't expose raw errors**

```typescript
// BAD - Leaks implementation details
catch (error) {
  return { error: error.message };  // Might expose DB structure
}
```

❌ **Don't forget activity logging**

```typescript
// BAD - No audit trail
await auth.api.setRole({ userId, role: 'admin' });
// Missing: await logActivity(...)
```

❌ **Don't bypass Drizzle ORM**

```typescript
// BAD - SQL injection risk
await db.execute(`DELETE FROM user WHERE id = ${userId}`);
```

## Rate Limiting

Recommended rate limits for admin endpoints:

| Endpoint                             | Limit   | Window   |
| ------------------------------------ | ------- | -------- |
| `POST /api/admin/stats?refresh=true` | 1 req   | 1 minute |
| `GET /api/admin/users`               | 60 reqs | 1 minute |
| `GET /api/admin/organizations`       | 60 reqs | 1 minute |
| `GET /api/admin/activity/export`     | 5 reqs  | 1 hour   |
| `POST /api/admin/users/[id]`         | 10 reqs | 1 minute |

### Implementation Example

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(1, '1 m'),
});

export async function POST(request: Request) {
  const adminContext = await requireSuperAdminContext();

  // Rate limit based on user ID
  const { success } = await ratelimit.limit(adminContext.user.id);

  if (!success) {
    return NextResponse.json(
      { error: 'TooManyRequests', message: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  // Continue with operation
}
```

## Security Checklist

Before deploying admin features:

- [ ] All `/admin/*` routes protected by middleware
- [ ] All admin pages call `requireSuperAdminContext()`
- [ ] All server actions verify admin role
- [ ] All API routes validate authorization
- [ ] All inputs validated with Zod schemas
- [ ] All operations logged with `logActivity()`
- [ ] No raw SQL queries with user input
- [ ] Error handling doesn't leak sensitive info
- [ ] Rate limiting implemented on mutation endpoints
- [ ] HTTPS enforced in production
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] Activity logs reviewed regularly
- [ ] Admin sessions have reasonable timeout
- [ ] Failed auth attempts monitored

## Incident Response

If you suspect unauthorized admin access:

1. **Immediate Actions:**
   - Review activity logs for suspicious actions
   - Revoke sessions for compromised accounts
   - Change admin user passwords
   - Check for unauthorized role changes

2. **Investigation:**
   - Query activity logs for anomalies
   - Check IP addresses for unexpected locations
   - Review recent role changes
   - Audit organization deletions

3. **Remediation:**
   - Reset affected user accounts
   - Restore deleted data from backups
   - Block malicious IP addresses
   - Increase monitoring sensitivity

4. **Prevention:**
   - Implement 2FA for admin users
   - Reduce admin session timeout
   - Add IP allowlisting
   - Increase rate limiting

## Related Documentation

- [Overview](./overview.md) - Admin Space introduction
- [Authentication](./authentication.md) - Auth implementation details
- [API Reference](./api-reference.md) - Complete API documentation
- [Development Guide](./development.md) - Extending admin features

---

**Last Updated:** 2025-10-06
**Status:** ✅ Complete
