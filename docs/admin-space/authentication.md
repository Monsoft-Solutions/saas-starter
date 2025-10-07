---
title: Admin Authentication & Authorization
description: Deep dive into Better Auth admin plugin integration, role-based access control, and multi-layer security architecture
---

# Admin Authentication & Authorization

The Admin Space uses Better Auth's built-in admin plugin for role management combined with custom middleware and validation helpers to provide comprehensive access control.

## Overview

The authentication system for the Admin Space provides:

- **Role-based Access Control (RBAC)** - Using Better Auth's admin plugin
- **Multi-layer Security** - Protection at 5 different levels
- **Session Management** - Secure session handling with role verification
- **Activity Auditing** - Complete logging of all admin actions

## Better Auth Admin Plugin

The Admin Space leverages Better Auth's admin plugin, which automatically manages:

### Database Fields

Better Auth automatically adds these fields to your schema:

```typescript
// user table (Better Auth managed)
{
  role: string,              // 'user' (default), 'admin', or 'super-admin'
  banned: boolean,           // User ban status
  banReason: string | null,  // Reason for ban
  banExpires: Date | null,   // Ban expiration date
}

// session table (Better Auth managed)
{
  impersonatedBy: string | null,  // Track admin impersonation
}
```

### Server API Methods

Better Auth provides server-side methods for user management:

```typescript
import { auth } from '@/lib/auth';

// User operations
await auth.api.listUsers({ query, limit, offset });
await auth.api.setRole({ userId, role: 'admin' });
await auth.api.banUser({ userId, reason, expiresIn });
await auth.api.unbanUser({ userId });
await auth.api.setPassword({ userId, newPassword });

// Session management
await auth.api.listSessions({ userId });
await auth.api.revokeSessions({ userId, sessionId });
await auth.api.impersonateUser({ userId });
```

### Client API Methods

For client-side permission checks:

```typescript
import { authClient } from '@/lib/auth/auth-client';

// Check permissions
const hasPermission = await authClient.admin.hasPermission('admin');
const canEdit = await authClient.admin.checkRolePermission('admin');
```

## Configuration

### Server Configuration

The Better Auth admin plugin is configured in `lib/auth.ts`:

```typescript
import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';

export const auth = betterAuth({
  // ... other config
  plugins: [
    admin({
      defaultRole: 'user', // Default role for new users
      adminRoles: ['admin', 'super-admin'], // Roles with admin access
      impersonationSessionDuration: 3600, // 1 hour for impersonation
      defaultBanReason: 'Violation of terms of service',
      bannedUserMessage:
        'Your account has been suspended. Please contact support.',
    }),
  ],
});
```

### Client Configuration

The admin client plugin is configured in `lib/auth/auth-client.ts`:

```typescript
import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  // ... other config
  plugins: [adminClient()],
});
```

## Role System

### Role Types

The system defines three user roles:

```typescript
// lib/types/admin/user-role.enum.ts
export const USER_ROLES = ['user', 'admin', 'super-admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];
```

| Role          | Description                             | Access Level               |
| ------------- | --------------------------------------- | -------------------------- |
| `user`        | Default role for all new users          | Regular application access |
| `admin`       | Administrative user                     | Full admin panel access    |
| `super-admin` | Alias for admin with highest privileges | Full admin panel access    |

### Role Checking Functions

Helper functions for role verification:

```typescript
// lib/auth/super-admin-context.ts

// Check if user has admin or super-admin role
export function isUserAdmin(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'super-admin';
}

// Check specifically for super-admin role
export function isUserSuperAdmin(role: string | null | undefined): boolean {
  return role === 'super-admin';
}
```

## Multi-Layer Security Architecture

The Admin Space implements a defense-in-depth approach with five security layers:

### Layer 1: Middleware Protection

Global middleware intercepts all requests to `/admin/*` paths:

```typescript
// middleware.ts
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const match = matchRouteGuard(pathname);

  if (match?.rule.superAdminRequired) {
    const session = await getServerSessionFromHeaders(requestHeaders);

    if (!session) {
      return handleUnauthorized(rule.scope, request);
    }

    const { isUserAdmin } = await import('@/lib/auth/super-admin-context');
    const userRole = (session.user as { role?: string }).role;

    if (!isUserAdmin(userRole)) {
      // Redirect non-admins to /app
      return NextResponse.redirect(new URL('/app', request.url));
    }
  }

  return NextResponse.next();
}
```

**Key Points:**

- Runs before any route handler
- Checks user session and role
- Redirects unauthorized users to `/app`
- Returns 403 for admin API routes

### Layer 2: Server Context Validation

Each admin page calls `requireSuperAdminContext()`:

```typescript
// lib/auth/super-admin-context.ts
export async function requireSuperAdminContext(): Promise<SuperAdminContext> {
  const context = await getSuperAdminContext();

  if (!context) {
    throw new SuperAdminRequiredError();
  }

  return context;
}

export async function getSuperAdminContext(): Promise<SuperAdminContext | null> {
  const context = await requireServerContext();
  const userRole = (context.user as { role?: string }).role;

  if (!isUserAdmin(userRole)) {
    return null;
  }

  return {
    ...context,
    user: {
      ...context.user,
      role: userRole as 'admin' | 'super-admin',
    },
  };
}
```

**Usage in Pages:**

```typescript
// app/(admin)/admin/page.tsx
export default async function AdminDashboardPage() {
  const context = await requireSuperAdminContext();

  // Guaranteed to have admin role here
  const stats = await getAdminStatistics();

  return <div>Welcome, {context.user.name}</div>;
}
```

### Layer 3: Server Action Authorization

Server actions verify admin role before execution:

```typescript
// app/actions/admin/update-user-role.action.ts
export async function updateUserRoleAction(input: UpdateUserRoleInput) {
  // Verify admin context
  const adminContext = await requireSuperAdminContext();

  // Validate input
  const validated = updateUserRoleSchema.parse(input);

  // Perform action using Better Auth
  await auth.api.setRole({
    userId: validated.userId,
    role: validated.role,
  });

  // Log activity
  await logActivity({
    action: 'user.role.updated',
    metadata: { targetUserId: validated.userId, newRole: validated.role },
  });

  return { success: true };
}
```

### Layer 4: API Route Guards

Admin API endpoints verify role in the handler:

```typescript
// app/api/admin/users/route.ts
export async function GET(request: NextRequest) {
  try {
    // Require super-admin context
    const context = await requireSuperAdminContext();

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    // Fetch data
    const result = await listAllUsers(filters);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SuperAdminRequiredError) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Super admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

### Layer 5: Component-Level Guards

Client components check permissions for UI rendering:

```typescript
// components/admin/admin-header.component.tsx
'use client';

import { useSession } from '@/lib/auth/hooks/auth.hook';

export function AdminHeader() {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role;

  // Only render for admins
  if (userRole !== 'admin' && userRole !== 'super-admin') {
    return null;
  }

  return (
    <header>
      {/* Admin header content */}
    </header>
  );
}
```

::: warning Important
Never rely solely on client-side checks. Always validate on the server.
:::

## Super Admin Context Type

TypeScript type for guaranteed admin access:

```typescript
// lib/auth/super-admin-context.ts
export type SuperAdminContext = ServerContext & {
  user: ServerContext['user'] & {
    role: 'admin' | 'super-admin';
  };
};
```

This type ensures that when you have a `SuperAdminContext`, the user is guaranteed to have admin privileges.

## Activity Logging

All admin actions are automatically logged to the `activity_logs` table:

```typescript
import { logActivity } from '@/lib/db/queries';

await logActivity({
  action: 'user.role.updated',
  metadata: {
    targetUserId: userId,
    previousRole: 'user',
    newRole: 'admin',
  },
});
```

### Logged Actions

Common admin actions that are logged:

- `user.role.updated` - Role changes
- `user.banned` - User bans
- `user.unbanned` - User unbans
- `organization.deleted` - Organization deletions
- `admin.stats.refreshed` - Statistics refresh
- `activity.exported` - Activity log exports

## Route Guards

Route guards are defined in `lib/auth/route-guards.ts`:

```typescript
export const ROUTE_GUARDS: RouteGuardDefinition[] = [
  // Admin routes - super-admin required
  {
    pattern: /^\/admin($|\/)/,
    rule: {
      authRequired: true,
      organizationRequired: false,
      superAdminRequired: true,
      scope: 'page',
    },
  },

  // Admin API routes - super-admin required
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

## Session Management

### Session Validation

Better Auth handles session validation automatically:

```typescript
// lib/auth/server-context.ts
export async function requireServerContext(): Promise<ServerContext> {
  const session = await auth.api.getSession({ headers });

  if (!session?.user) {
    throw new UnauthorizedError('Authentication required');
  }

  return {
    session,
    user: session.user,
    organization: await getActiveOrganization(session.user.id),
  };
}
```

### Session Impersonation

Admins can impersonate users for troubleshooting:

```typescript
// Impersonate a user
await auth.api.impersonateUser({ userId: targetUserId });

// Session will have impersonatedBy field
const session = await auth.api.getSession({ headers });
console.log(session.impersonatedBy); // Admin user ID
```

::: tip Best Practice
Always log impersonation events and display a clear banner when impersonating.
:::

## Banning Users

### Ban a User

```typescript
import { auth } from '@/lib/auth';

await auth.api.banUser({
  userId: 'user-id',
  reason: 'Violation of terms of service',
  expiresIn: 86400 * 7, // 7 days in seconds (optional)
});
```

### Unban a User

```typescript
await auth.api.unbanUser({
  userId: 'user-id',
});
```

### Check Ban Status

Banned users cannot sign in. Better Auth automatically blocks authentication for banned users.

## Security Best Practices

### Do's

✅ **Always verify admin role on server**

- Use `requireSuperAdminContext()` in pages and actions
- Check role in API routes

✅ **Log all admin actions**

- Use `logActivity()` for audit trail
- Include relevant metadata

✅ **Validate all inputs**

- Use Zod schemas for validation
- Sanitize user inputs

✅ **Use TypeScript strictly**

- Leverage `SuperAdminContext` type
- No `any` types in admin code

### Don'ts

❌ **Don't trust client-side role checks**

- Always validate on server
- Client checks are for UI only

❌ **Don't hardcode user IDs**

- Use dynamic role checks
- Avoid privilege escalation risks

❌ **Don't skip activity logging**

- Log all state changes
- Include context and metadata

❌ **Don't expose sensitive admin endpoints**

- Always protect with `superAdminRequired`
- Rate limit admin API routes

## Error Handling

### Custom Error Classes

```typescript
// lib/auth/super-admin-context.ts
export class SuperAdminRequiredError extends Error {
  constructor(message = 'Super admin access required') {
    super(message);
    this.name = 'SuperAdminRequiredError';
  }
}
```

### Error Responses

**Page Routes:**

- Redirect to `/app` with message

**API Routes:**

- Return 403 Forbidden with error details

```typescript
if (error instanceof SuperAdminRequiredError) {
  return NextResponse.json(
    {
      error: 'Forbidden',
      message: 'Super admin access required',
    },
    { status: 403 }
  );
}
```

## Testing Admin Access

### Unit Tests

Test admin context validation:

```typescript
import { describe, it, expect, vi } from 'vitest';
import {
  requireSuperAdminContext,
  SuperAdminRequiredError,
} from '@/lib/auth/super-admin-context';

describe('requireSuperAdminContext', () => {
  it('should throw when user is not admin', async () => {
    // Mock non-admin user
    vi.mock('@/lib/auth/server-context', () => ({
      requireServerContext: async () => ({
        user: { id: '1', role: 'user' },
      }),
    }));

    await expect(requireSuperAdminContext()).rejects.toThrow(
      SuperAdminRequiredError
    );
  });

  it('should return context when user is admin', async () => {
    vi.mock('@/lib/auth/server-context', () => ({
      requireServerContext: async () => ({
        user: { id: '1', role: 'admin' },
      }),
    }));

    const context = await requireSuperAdminContext();
    expect(context.user.role).toBe('admin');
  });
});
```

### Integration Tests

Test complete auth flow:

```typescript
describe('Admin Routes', () => {
  it('should deny access to non-admin users', async () => {
    const response = await fetch('/admin', {
      headers: { cookie: regularUserCookie },
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/app');
  });

  it('should allow access to admin users', async () => {
    const response = await fetch('/admin', {
      headers: { cookie: adminUserCookie },
    });

    expect(response.status).toBe(200);
  });
});
```

## Related Documentation

- [Overview](./overview.md) - Admin Space introduction
- [Security Architecture](./security.md) - Detailed security implementation
- [API Reference](./api-reference.md) - Admin API endpoints
- [Development Guide](./development.md) - Extending admin features

---

**Last Updated:** 2025-10-06
**Status:** ✅ Complete
