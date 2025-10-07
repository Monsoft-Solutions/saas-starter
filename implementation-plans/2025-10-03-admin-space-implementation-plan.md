# Super Admin Space Implementation Plan

**Created:** October 3, 2025
**Updated:** October 3, 2025
**Status:** Draft
**Priority:** High
**Estimated Effort:** 10-12 days (Reduced from 15 days due to Better Auth integration)
**Complexity:** Medium

## Executive Summary

This implementation plan outlines the development of a comprehensive super-admin control panel for the SaaS application. The system will enable app owners to monitor system health, manage users and organizations, analyze subscription metrics, and control the entire application from a secure, isolated admin interface.

**Key Change:** This plan leverages **Better Auth's built-in admin plugin** for role management, user operations, and permission handling, significantly simplifying implementation compared to building custom role infrastructure from scratch.

## Current State Analysis

### ✅ Existing Infrastructure

- Next.js 15 with App Router and route groups
- PostgreSQL database with Drizzle ORM
- **BetterAuth session management with admin plugin support**
- Comprehensive route guard system (`route-guards.ts`)
- Organization-scoped operations via `withOrganization()` wrapper
- Server context helpers (`requireServerContext`, `requireOrganizationContext`, `requireAdminContext`)
- Activity logging system (`activityLogs` table)
- Member role system (currently: owner, member)
- Design system with tokens and utilities (`/lib/design-system/`)
- Type-safe server actions with `validatedActionWithUser`
- Zod validation throughout the stack

### ❌ Missing Critical Features

1. **Better Auth Admin Plugin:**
   - Admin plugin not configured in `lib/auth.ts`
   - Admin client plugin not configured in `lib/auth/auth-client.ts`
   - No super-admin context helpers wrapping Better Auth
   - No super-admin route guards
   - Database migration for admin fields not run

2. **Admin Data Layer:**
   - No admin statistics aggregation
   - No cached metrics for dashboard
   - No admin-specific query functions
   - No system-wide analytics tables

3. **Admin Interface:**
   - No isolated admin route structure
   - No admin navigation configuration
   - No admin dashboard UI
   - No user management interface
   - No organization management interface
   - No subscription analytics views
   - No system activity monitoring

4. **Security Controls:**
   - No super-admin verification at middleware level
   - No admin-scoped API routes
   - No admin action authorization wrappers

## Technical Analysis

### Better Auth Admin Plugin Architecture

**Decision: Use Better Auth's Built-in Admin Plugin**

Better Auth provides a comprehensive admin plugin that handles:

1. **Role Management:**
   - Automatic `role` field in user table (managed by Better Auth)
   - Configurable admin roles (default: ["admin"])
   - Specific admin user IDs
   - Default role assignment for new users

2. **User Operations:**
   - Create users programmatically
   - List users with filters
   - Update user details
   - Set user roles
   - Reset user passwords
   - Remove users

3. **User Control:**
   - Ban/unban users
   - Ban with reason and expiry
   - Automatic `banned`, `banReason`, `banExpires` fields

4. **Session Management:**
   - List user sessions
   - Revoke sessions
   - Impersonate users (with tracking via `impersonatedBy`)

5. **Permission System:**
   - Role-based permissions
   - Custom access control
   - Permission checking API

### Multi-Layer Security Architecture

We will implement super-admin access control using Better Auth + custom guards:

1. **Database-Level Role Storage (Better Auth Managed):**
   - `role` field added to user table automatically
   - Default role: 'user'
   - Role changes via Better Auth API
   - All admin operations logged

2. **Multi-Layer Security:**
   - **Layer 1: Middleware** - Route-level protection for `/admin/*` paths
   - **Layer 2: Server Context** - `requireSuperAdminContext()` helper (wraps Better Auth)
   - **Layer 3: Action Wrappers** - `withSuperAdmin()` for server actions
   - **Layer 4: API Guards** - Role verification in admin API routes
   - **Layer 5: Component Guards** - Client-side role checks for UI rendering

3. **Security Best Practices:**
   - Never trust client-side role checks alone
   - Always verify role using Better Auth's permission API
   - Log all admin actions with full audit trail
   - Rate limit admin API endpoints
   - Monitor and alert on admin role changes

### Admin Dashboard Architecture

The admin space operates independently from organization-scoped features:

- **Isolated Route Group:** `/app/(admin)/admin/*` separate from `/app/(app)/*`
- **Global Data Access:** Super-admins can view all users and organizations
- **No Organization Context:** Admin routes don't require active organization
- **Separate Navigation:** Admin nav tree distinct from app nav tree
- **Independent Layout:** Admin layout with different header, sidebar, and styling
- **Cached Metrics:** Admin statistics table for fast dashboard rendering

### Tech Stack Selection

| Component        | Technology                           | Rationale                                 |
| ---------------- | ------------------------------------ | ----------------------------------------- |
| Role Management  | **Better Auth Admin Plugin**         | Built-in, battle-tested, feature-complete |
| Storage          | PostgreSQL                           | Already in use, complex queries supported |
| Authorization    | Better Auth + Multi-layer validation | Defense in depth security                 |
| UI Components    | shadcn/ui + Design System            | Consistent with existing app              |
| Charts/Analytics | Recharts                             | Modern, accessible, React-based           |
| Data Tables      | TanStack Table                       | Powerful, flexible, type-safe             |
| Type Safety      | Zod + TypeScript                     | Runtime + compile-time validation         |

## Dependencies & Prerequisites

### NPM Packages

```bash
# Better Auth is already installed - no additional auth packages needed

# New dependencies to install
pnpm add recharts                  # Charts for analytics dashboard
pnpm add @tanstack/react-table     # Powerful data tables
pnpm add date-fns                  # Date manipulation for analytics

# Already installed - no additional packages needed
better-auth                        # Better Auth with admin plugin
zod                                # Runtime validation
drizzle-orm                        # Database ORM
@radix-ui/*                        # UI primitives (via shadcn/ui)
lucide-react                       # Icons
```

### Environment Variables

No new environment variables required. Uses existing:

- `POSTGRES_URL` - Database connection
- `BETTER_AUTH_SECRET` - Session management
- `BETTER_AUTH_URL` - Auth base URL

## Architecture Overview

### Better Auth Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                  Better Auth Admin Plugin                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Database Schema (Auto-managed)                            │ │
│  │  • user.role (string, default: "user")                     │ │
│  │  • user.banned (boolean)                                   │ │
│  │  • user.banReason (string)                                 │ │
│  │  • user.banExpires (date)                                  │ │
│  │  • session.impersonatedBy (string)                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Server API (auth.api.*)                                   │ │
│  │  • createUser()                                            │ │
│  │  • listUsers()                                             │ │
│  │  • setRole()                                               │ │
│  │  • banUser() / unbanUser()                                 │ │
│  │  • setPassword()                                           │ │
│  │  • impersonateUser()                                       │ │
│  │  • listSessions() / revokeSessions()                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Client API (authClient.admin.*)                           │ │
│  │  • hasPermission()                                         │ │
│  │  • checkRolePermission()                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Custom Super Admin Helpers (Wrapper around Better Auth)   │ │
│  │  • requireSuperAdminContext()                              │ │
│  │  • withSuperAdmin() wrapper                                │ │
│  │  • Admin route guards                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Custom Admin Queries                                      │ │
│  │  • getAdminStatistics() (our custom analytics)            │ │
│  │  • getAllOrganizations() (org management)                 │ │
│  │  • getSubscriptionAnalytics() (revenue metrics)           │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                      Middleware Layer                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Global Middleware (middleware.ts)                         │ │
│  │  • Checks /admin/* routes                                  │ │
│  │  • Uses Better Auth to verify user.role                    │ │
│  │  • Redirects unauthorized users to /app                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Server Context Layer                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  requireSuperAdminContext()                                │ │
│  │  • Hydrates session and user                               │ │
│  │  • Checks user.role via Better Auth                        │ │
│  │  • Throws UnauthorizedError if not admin                   │ │
│  │  • Returns ServerContext with role validation              │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Admin Route Layer                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  /app/(admin)/admin/                                       │ │
│  │  ├── layout.tsx (Admin shell with separate nav)           │ │
│  │  ├── page.tsx (Dashboard with metrics)                    │ │
│  │  ├── users/page.tsx (User management)                     │ │
│  │  ├── organizations/page.tsx (Org management)              │ │
│  │  ├── analytics/page.tsx (Subscription analytics)          │ │
│  │  └── activity/page.tsx (System activity logs)             │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API & Action Layer                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Admin API Routes (Uses Better Auth where applicable)     │ │
│  │  • GET /api/admin/stats (Custom analytics)                │ │
│  │  • GET /api/admin/users (Better Auth listUsers)           │ │
│  │  • PATCH /api/admin/users/[id] (Better Auth setRole)      │ │
│  │  • GET /api/admin/organizations (Custom query)            │ │
│  │  • GET /api/admin/analytics (Custom query)                │ │
│  │  • GET /api/admin/activity (Custom query)                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Admin Server Actions                                      │ │
│  │  • updateUserRoleAction() (wraps Better Auth setRole)     │ │
│  │  • banUserAction() (wraps Better Auth banUser)            │ │
│  │  • refreshAdminStatsAction() (custom analytics)           │ │
│  │  • exportActivityLogsAction() (custom export)             │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL Tables                                         │ │
│  │  • user (with Better Auth admin fields)                    │ │
│  │  • session (with impersonatedBy)                           │ │
│  │  • admin_statistics (custom cached metrics)                │ │
│  │  • organization (subscription data)                        │ │
│  │  • activity_logs (audit trail)                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Better Auth Admin Features Mapping

| Feature                | Better Auth Provides                             | Custom Implementation Needed          |
| ---------------------- | ------------------------------------------------ | ------------------------------------- |
| Role storage           | ✅ `user.role` field                             | ❌ None                               |
| User listing           | ✅ `auth.api.listUsers()`                        | ❌ None (can wrap for custom filters) |
| Set user role          | ✅ `auth.api.setRole()`                          | ❌ None (just call the API)           |
| Ban/unban users        | ✅ `auth.api.banUser()`, `unbanUser()`           | ❌ None                               |
| Password reset         | ✅ `auth.api.setPassword()`                      | ❌ None                               |
| Session management     | ✅ `auth.api.listSessions()`, `revokeSessions()` | ❌ None                               |
| Impersonation          | ✅ `auth.api.impersonateUser()`                  | ❌ None                               |
| Permission check       | ✅ `authClient.admin.hasPermission()`            | ❌ None                               |
| Dashboard statistics   | ❌                                               | ✅ Custom aggregation queries         |
| Organization analytics | ❌                                               | ✅ Custom queries for org data        |
| Subscription metrics   | ❌                                               | ✅ Custom revenue/MRR calculations    |
| Activity log exports   | ❌                                               | ✅ Custom CSV export                  |

## Data Model

### Better Auth Managed Schema

Better Auth automatically adds these fields when the admin plugin is configured:

#### user Table (Better Auth Additions)

```typescript
// Added automatically by Better Auth admin plugin
export const user = pgTable('user', {
  // ... existing fields
  role: text('role').default('user').notNull(), // ✅ Better Auth managed
  banned: boolean('banned').default(false), // ✅ Better Auth managed
  banReason: text('ban_reason'), // ✅ Better Auth managed
  banExpires: timestamp('ban_expires'), // ✅ Better Auth managed
});
```

#### session Table (Better Auth Additions)

```typescript
// Added automatically by Better Auth admin plugin
export const session = pgTable('session', {
  // ... existing fields
  impersonatedBy: text('impersonated_by'), // ✅ Better Auth managed
});
```

**Migration Command:**

```bash
npx @better-auth/cli migrate
```

### Custom Schema

#### admin_statistics Table (Custom)

```typescript
// lib/db/schemas/admin-statistics.table.ts
import {
  pgTable,
  serial,
  timestamp,
  integer,
  text,
  real,
} from 'drizzle-orm/pg-core';

/**
 * Cached admin dashboard statistics.
 * Updated periodically via cron job or manual refresh.
 */
export const adminStatistics = pgTable('admin_statistics', {
  id: serial('id').primaryKey(),

  // User metrics
  totalUsers: integer('total_users').notNull(),
  activeUsersLast30Days: integer('active_users_last_30_days').notNull(),
  newUsersLast30Days: integer('new_users_last_30_days').notNull(),

  // Organization metrics
  totalOrganizations: integer('total_organizations').notNull(),
  organizationsWithSubscriptions: integer(
    'organizations_with_subscriptions'
  ).notNull(),

  // Subscription metrics
  totalMRR: real('total_mrr').notNull(), // Monthly Recurring Revenue
  totalActiveSubscriptions: integer('total_active_subscriptions').notNull(),
  trialOrganizations: integer('trial_organizations').notNull(),

  // Growth metrics
  userGrowthRate: real('user_growth_rate'), // Percentage
  revenueGrowthRate: real('revenue_growth_rate'), // Percentage
  churnRate: real('churn_rate'), // Percentage

  // Metadata
  calculatedAt: timestamp('calculated_at').notNull().defaultNow(),
  calculationDurationMs: integer('calculation_duration_ms'),
  metadata: text('metadata'), // JSON for additional metrics
});

export type AdminStatistics = typeof adminStatistics.$inferSelect;
export type NewAdminStatistics = typeof adminStatistics.$inferInsert;
```

### Type System

#### User Role Types

```typescript
// lib/types/admin/user-role.enum.ts
/**
 * User role enum values (aligned with Better Auth).
 */
export const USER_ROLES = ['user', 'admin', 'super-admin'] as const;

export type UserRole = (typeof USER_ROLES)[number];

/**
 * Check if a role is admin or super-admin
 */
export function isAdmin(role: UserRole | string): boolean {
  return role === 'admin' || role === 'super-admin';
}

export function isSuperAdmin(role: UserRole | string): boolean {
  return role === 'super-admin';
}
```

#### Admin Context Types

```typescript
// lib/types/admin/admin-context.type.ts
import type { ServerContext } from '@/lib/auth/server-context';

/**
 * Server context with super-admin verification.
 * Guaranteed to have admin role
 */
export type SuperAdminContext = ServerContext & {
  user: ServerContext['user'] & {
    role: 'admin' | 'super-admin';
  };
};
```

#### Zod Schemas

```typescript
// lib/types/admin/update-user-role.schema.ts
import { z } from 'zod';
import { USER_ROLES } from './user-role.enum';

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(USER_ROLES, {
    errorMap: () => ({ message: 'Invalid role' }),
  }),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

// lib/types/admin/ban-user.schema.ts
export const banUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  expiresInDays: z.number().int().positive().optional(),
});

export type BanUserInput = z.infer<typeof banUserSchema>;
```

## Implementation Phases

### Phase 1: Better Auth Admin Plugin Setup (Days 1-2) (DONE)

#### 1.1 Configure Better Auth Admin Plugin

**Files to modify:**

- `lib/auth.ts`
- `lib/auth/auth-client.ts`

**Tasks:**

- ✅ Add admin plugin to Better Auth server configuration
- ✅ Configure admin roles (super-admin, admin)
- ✅ Set default role to 'user'
- ✅ Configure impersonation settings
- ✅ Add adminClient plugin to client configuration

**Server Implementation:**

```typescript
// lib/auth.ts
import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';

export const auth = betterAuth({
  // ... existing config
  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['admin', 'super-admin'],
      impersonationSessionDuration: 3600, // 1 hour
      defaultBanReason: 'Violation of terms of service',
      bannedUserMessage:
        'Your account has been suspended. Please contact support.',
    }),
    // ... other plugins
  ],
});
```

**Client Implementation:**

```typescript
// lib/auth/auth-client.ts
import { createAuthClient } from 'better-auth/client';
import { adminClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  // ... existing config
  plugins: [
    adminClient(),
    // ... other plugins
  ],
});
```

#### 1.2 Run Better Auth Migration

**Migration Command:**

```bash
# Generate migration for Better Auth schema changes
npx @better-auth/cli migrate

# Or if using Drizzle directly
npx @better-auth/cli generate
pnpm db:migrate
```

**Schema Changes Applied:**

- `user.role` (text, default: 'user')
- `user.banned` (boolean, default: false)
- `user.banReason` (text, nullable)
- `user.banExpires` (timestamp, nullable)
- `session.impersonatedBy` (text, nullable)

#### 1.3 Create Admin Statistics Table

**Files to create:**

- `lib/db/schemas/admin-statistics.table.ts`
- `lib/types/admin/admin-statistics.type.ts`
- Update `lib/db/schemas/index.ts`

**Tasks:**

- ✅ Create admin_statistics table schema
- ✅ Export type inference
- ✅ Generate and apply Drizzle migration
- ✅ Seed initial statistics row

**Migration:**

```bash
pnpm db:generate
pnpm db:migrate
```

#### 1.4 Update Seed Script for Super Admin

**Files to modify:**

- `lib/db/seed.ts`

**Tasks:**

- ✅ Update existing test user or create new super-admin user
- ✅ Set role to 'super-admin' using Better Auth
- ✅ Email: `admin@test.com`
- ✅ Password: `admin123`
- ✅ Document in CLAUDE.md

**Seed Implementation:**

```typescript
// lib/db/seed.ts
import { auth } from '@/lib/auth';

// Option 1: Update existing test user to super-admin
const testUser = await db.query.user.findFirst({
  where: eq(user.email, 'test@test.com'),
});

if (testUser) {
  await auth.api.setRole({
    userId: testUser.id,
    role: 'super-admin',
  });
}

// Option 2: Create dedicated super-admin
await auth.api.createUser({
  email: 'admin@test.com',
  password: 'admin123',
  name: 'Super Admin',
  role: 'super-admin',
  emailVerified: true,
});

// Seed initial admin statistics
await db.insert(adminStatistics).values({
  totalUsers: 1,
  activeUsersLast30Days: 1,
  newUsersLast30Days: 1,
  totalOrganizations: 0,
  organizationsWithSubscriptions: 0,
  totalMRR: 0,
  totalActiveSubscriptions: 0,
  trialOrganizations: 0,
  calculatedAt: new Date(),
});
```

### Phase 2: Auth Infrastructure (Days 2-3) (DONE)

#### 2.1 Super Admin Context Helpers

**Files to create:**

- `lib/auth/super-admin-context.ts`

**Features:**

- ✅ Wraps Better Auth permission checking
- ✅ `requireSuperAdminContext()` - Throws if not super-admin
- ✅ `getSuperAdminContext()` - Returns null if not super-admin
- ✅ `isUserAdmin()` - Boolean check helper

**Implementation:**

```typescript
// lib/auth/super-admin-context.ts
import 'server-only';
import { auth } from '@/lib/auth';
import {
  requireServerContext,
  type ServerContext,
  UnauthorizedError,
} from './server-context';

/**
 * Super admin context with guaranteed admin role verification.
 */
export type SuperAdminContext = ServerContext & {
  user: ServerContext['user'] & {
    role: 'admin' | 'super-admin';
  };
};

/**
 * Error thrown when super-admin access is required but user doesn't have permission.
 */
export class SuperAdminRequiredError extends Error {
  constructor(message = 'Super admin access required') {
    super(message);
    this.name = 'SuperAdminRequiredError';
  }
}

/**
 * Check if user has admin role (admin or super-admin).
 */
export function isUserAdmin(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'super-admin';
}

/**
 * Check if user has super-admin role specifically.
 */
export function isUserSuperAdmin(role: string | null | undefined): boolean {
  return role === 'super-admin';
}

/**
 * Get super-admin context if user has permission, otherwise return null.
 */
export async function getSuperAdminContext(): Promise<SuperAdminContext | null> {
  const context = await requireServerContext();

  // Check role from user object (Better Auth populates this)
  if (!isUserAdmin(context.user.role)) {
    return null;
  }

  return {
    ...context,
    user: {
      ...context.user,
      role: context.user.role as 'admin' | 'super-admin',
    },
  };
}

/**
 * Require super-admin context, throw error if user doesn't have permission.
 */
export async function requireSuperAdminContext(): Promise<SuperAdminContext> {
  const context = await getSuperAdminContext();

  if (!context) {
    throw new SuperAdminRequiredError();
  }

  return context;
}
```

#### 2.2 Super Admin Action Wrapper

**Files to create:**

- `lib/auth/super-admin-middleware.ts`

**Features:**

- ✅ `withSuperAdmin()` wrapper for server actions
- ✅ Type-safe action signatures
- ✅ Automatic error handling and logging
- ✅ Activity log integration

**Implementation:**

```typescript
// lib/auth/super-admin-middleware.ts
import { redirect } from 'next/navigation';
import {
  requireSuperAdminContext,
  SuperAdminRequiredError,
  type SuperAdminContext,
} from './super-admin-context';
import type { ActionState } from './middleware';
import { logActivity } from '@/lib/db/queries/activity-log.query';
import logger from '@/lib/logger/logger.service';

type SuperAdminActionFunction<T> = (
  formData: FormData,
  context: SuperAdminContext
) => Promise<T> | T;

type SuperAdminActionWrapper<T> = {
  (formData: FormData): Promise<T>;
  (prevState: ActionState, formData: FormData): Promise<ActionState>;
};

/**
 * Wraps a server action with super-admin authorization.
 * Uses Better Auth role checking under the hood.
 */
export function withSuperAdmin<T>(
  action: SuperAdminActionFunction<T>,
  options?: {
    logAction?: string;
  }
): SuperAdminActionWrapper<T> {
  const handler = async (
    ...args: [FormData] | [ActionState, FormData]
  ): Promise<T | ActionState> => {
    const isStatefulCall = args.length === 2;
    const formData = (isStatefulCall ? args[1] : args[0]) as FormData;
    const prevState = (isStatefulCall ? args[0] : undefined) as
      | ActionState
      | undefined;

    try {
      // Verify super-admin context (uses Better Auth role)
      const context = await requireSuperAdminContext();

      // Optional: Log admin action
      if (options?.logAction) {
        await logActivity({
          userId: context.user.id,
          action: options.logAction,
          ipAddress: context.headers.get('x-forwarded-for') ?? undefined,
          userAgent: context.headers.get('user-agent') ?? undefined,
        });
      }

      // Execute action
      const result = await action(formData, context);

      if (isStatefulCall) {
        return (result ?? {}) as ActionState;
      }

      return result as T;
    } catch (error) {
      logger.error('[withSuperAdmin] Action failed', { error });

      if (error instanceof SuperAdminRequiredError) {
        redirect('/app'); // Redirect non-admins to regular app
      }

      if (isStatefulCall && prevState) {
        return {
          ...prevState,
          error: error instanceof Error ? error.message : 'Action failed',
        } satisfies ActionState;
      }

      throw error;
    }
  };

  return handler as SuperAdminActionWrapper<T>;
}
```

#### 2.3 Admin Route Guards

**Files to modify:**

- `lib/auth/route-guards.ts`

**Tasks:**

- ✅ Add super-admin route guard pattern
- ✅ Register `/admin/*` routes in guard registry
- ✅ Add `superAdminRequired` flag to RouteGuardRule type

**Implementation:**

```typescript
// lib/auth/route-guards.ts (add to existing)

export type RouteGuardRule = {
  id: string;
  scope: RouteGuardScope;
  pattern: RouteGuardPattern;
  authRequired: boolean;
  organizationRequired?: boolean;
  superAdminRequired?: boolean; // ✅ NEW FIELD
};

function buildRegistry(): RouteGuardRegistry {
  const guards: RouteGuardRule[] = [
    ...deriveAppGuards(),

    // ✅ NEW: Super admin routes
    {
      id: 'admin:dashboard',
      scope: 'app',
      pattern: createPrefixPattern('/admin'),
      authRequired: true,
      superAdminRequired: true,
    },

    {
      id: 'api:admin',
      scope: 'api',
      pattern: createPrefixPattern('/api/admin'),
      authRequired: true,
      superAdminRequired: true,
    },

    // ... existing guards
  ];

  // ... rest of registry
}
```

#### 2.4 Middleware Integration

**Files to modify:**

- `middleware.ts`

**Tasks:**

- ✅ Check `superAdminRequired` flag in matched guard
- ✅ Verify user role from session (Better Auth populates this)
- ✅ Redirect non-admins to `/app`
- ✅ Allow admins to proceed

**Implementation:**

```typescript
// middleware.ts (add to existing logic)
import { isUserAdmin } from '@/lib/auth/super-admin-context';

export async function middleware(request: NextRequest) {
  // ... existing session checks

  const match = matchRouteGuard(pathname);

  if (match?.rule.superAdminRequired) {
    const userRole = session.user.role; // Better Auth populates this

    if (!isUserAdmin(userRole)) {
      logger.warn('[middleware] Non-admin attempted to access admin route', {
        userId: session.user.id,
        role: userRole,
        path: pathname,
      });

      return NextResponse.redirect(new URL('/app', request.url));
    }
  }

  // ... rest of middleware
}
```

### Phase 3: Admin Query Functions (Days 3-5) (DONE)

#### 3.1 Admin Statistics Queries

**Files to create:**

- `lib/db/queries/admin-statistics.query.ts`

**Features:**

- ✅ `getAdminStatistics()` - Get latest cached statistics
- ✅ `calculateAdminStatistics()` - Compute fresh statistics
- ✅ `refreshAdminStatistics()` - Update cache
- ✅ Complex SQL aggregations for metrics

**Key Functions:**

```typescript
// lib/db/queries/admin-statistics.query.ts
import { db } from '../drizzle';
import { adminStatistics, user, organization, activityLogs } from '../schemas';
import { sql, gte, count } from 'drizzle-orm';
import logger from '@/lib/logger/logger.service';

/**
 * Get latest cached admin statistics.
 */
export async function getAdminStatistics() {
  const result = await db
    .select()
    .from(adminStatistics)
    .orderBy(adminStatistics.calculatedAt.desc())
    .limit(1);

  return result[0] ?? null;
}

/**
 * Calculate and store fresh admin statistics.
 */
export async function refreshAdminStatistics() {
  const startTime = Date.now();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  try {
    // User metrics
    const [totalUsersResult] = await db.select({ count: count() }).from(user);

    const [activeUsersResult] = await db
      .select({ count: count() })
      .from(activityLogs)
      .where(gte(activityLogs.timestamp, thirtyDaysAgo));

    const [newUsersResult] = await db
      .select({ count: count() })
      .from(user)
      .where(gte(user.createdAt, thirtyDaysAgo));

    // Organization metrics
    const [totalOrgsResult] = await db
      .select({ count: count() })
      .from(organization);

    const [orgsWithSubsResult] = await db
      .select({ count: count() })
      .from(organization)
      .where(sql`${organization.stripeSubscriptionId} IS NOT NULL`);

    // Revenue metrics
    const subscriptionRevenue = await db
      .select({
        total: count(),
        mrr: sql<number>`
          SUM(CASE
            WHEN ${organization.planName} = 'Basic' THEN 10
            WHEN ${organization.planName} = 'Pro' THEN 25
            WHEN ${organization.planName} = 'Enterprise' THEN 100
            ELSE 0
          END)
        `,
      })
      .from(organization)
      .where(sql`${organization.subscriptionStatus} = 'active'`);

    // Insert new statistics
    const [newStats] = await db
      .insert(adminStatistics)
      .values({
        totalUsers: totalUsersResult.count,
        activeUsersLast30Days: activeUsersResult.count,
        newUsersLast30Days: newUsersResult.count,
        totalOrganizations: totalOrgsResult.count,
        organizationsWithSubscriptions: orgsWithSubsResult.count,
        totalMRR: subscriptionRevenue[0]?.mrr ?? 0,
        totalActiveSubscriptions: subscriptionRevenue[0]?.total ?? 0,
        trialOrganizations: 0,
        calculationDurationMs: Date.now() - startTime,
        calculatedAt: new Date(),
      })
      .returning();

    logger.info('[admin-stats] Statistics refreshed', {
      duration: Date.now() - startTime,
    });

    return newStats;
  } catch (error) {
    logger.error('[admin-stats] Failed to refresh statistics', { error });
    throw error;
  }
}
```

#### 3.2 Admin User Queries (Using Better Auth)

**Files to create:**

- `lib/db/queries/admin-user.query.ts`

**Features:**

- ✅ Wrap Better Auth `listUsers()` for custom filters
- ✅ `getUserWithDetails()` - User + organizations + activity
- ✅ Use Better Auth `setRole()` for role changes
- ✅ `searchUsers()` - Search by email/name

**Key Functions:**

```typescript
// lib/db/queries/admin-user.query.ts
import { auth } from '@/lib/auth';
import { db } from '../drizzle';
import { user, member, organization } from '../schemas';
import { eq } from 'drizzle-orm';

export type UserListFilters = {
  search?: string;
  role?: string;
  limit?: number;
  offset?: number;
};

/**
 * List all users using Better Auth API with custom filters.
 */
export async function listAllUsers(filters: UserListFilters = {}) {
  // Use Better Auth's built-in listUsers
  const users = await auth.api.listUsers({
    limit: filters.limit ?? 50,
    offset: filters.offset ?? 0,
  });

  // Apply additional filters if needed
  let filteredUsers = users;

  if (filters.role) {
    filteredUsers = users.filter((u) => u.role === filters.role);
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredUsers = filteredUsers.filter(
      (u) =>
        u.email.toLowerCase().includes(searchLower) ||
        u.name?.toLowerCase().includes(searchLower)
    );
  }

  return {
    users: filteredUsers,
    total: filteredUsers.length,
  };
}

/**
 * Get user with full details (organizations, activity).
 */
export async function getUserWithDetails(userId: string) {
  const [userRecord] = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!userRecord) {
    return null;
  }

  const organizations = await db
    .select({
      organizationId: organization.id,
      name: organization.name,
      role: member.role,
      joinedAt: member.createdAt,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(eq(member.userId, userId));

  return {
    ...userRecord,
    organizations,
  };
}

/**
 * Update user role using Better Auth API.
 */
export async function updateUserRole(
  userId: string,
  newRole: 'user' | 'admin' | 'super-admin'
) {
  await auth.api.setRole({
    userId,
    role: newRole,
  });
}

/**
 * Ban user using Better Auth API.
 */
export async function banUserById(
  userId: string,
  reason: string,
  expiresInDays?: number
) {
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : undefined;

  await auth.api.banUser({
    userId,
    reason,
    expiresAt,
  });
}

/**
 * Unban user using Better Auth API.
 */
export async function unbanUserById(userId: string) {
  await auth.api.unbanUser({ userId });
}
```

#### 3.3 Admin Organization Queries

**Files to create:**

- `lib/db/queries/admin-organization.query.ts`

**Features:**

- ✅ `getAllOrganizations()` - Paginated org list
- ✅ `getOrganizationWithMembers()` - Org + members + subscription
- ✅ `getSubscriptionAnalytics()` - Revenue metrics
- ✅ Filter by subscription status

### Phase 4: Admin API Routes (Days 5-7) (DONE)

#### 4.1 Admin Statistics API

**Files to create:**

- `app/api/admin/stats/route.ts`

**Features:**

- ✅ GET endpoint for dashboard metrics
- ✅ Super-admin verification
- ✅ Cached response
- ✅ Optional force refresh parameter

**Implementation:**

```typescript
// app/api/admin/stats/route.ts
import { NextResponse } from 'next/server';
import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';
import {
  getAdminStatistics,
  refreshAdminStatistics,
} from '@/lib/db/queries/admin-statistics.query';
import logger from '@/lib/logger/logger.service';

export async function GET(request: Request) {
  try {
    await requireSuperAdminContext();

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    let stats;
    if (forceRefresh) {
      stats = await refreshAdminStatistics();
    } else {
      stats = await getAdminStatistics();

      if (!stats) {
        stats = await refreshAdminStatistics();
      }
    }

    return NextResponse.json(stats);
  } catch (error) {
    logger.error('[api/admin/stats] Failed to get statistics', { error });
    return NextResponse.json(
      { error: 'Failed to load statistics' },
      { status: 500 }
    );
  }
}
```

#### 4.2 Admin Users API

**Files to create:**

- `app/api/admin/users/route.ts` (GET - list users via Better Auth)
- `app/api/admin/users/[id]/route.ts` (GET - user details, PATCH - update via Better Auth)

**Implementation:**

```typescript
// app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';
import { listAllUsers } from '@/lib/db/queries/admin-user.query';

export async function GET(request: Request) {
  try {
    await requireSuperAdminContext();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? undefined;
    const role = searchParams.get('role') ?? undefined;
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const result = await listAllUsers({
      search,
      role,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load users' },
      { status: 500 }
    );
  }
}
```

#### 4.3 Admin Organizations API

**Files to create:**

- `app/api/admin/organizations/route.ts`
- `app/api/admin/organizations/[id]/route.ts`

#### 4.4 Admin Activity Logs API

**Files to create:**

- `app/api/admin/activity/route.ts`
- `app/api/admin/activity/export/route.ts`

### Phase 5: Admin UI Components (Days 7-9)

#### 5.1 Admin Layout (DONE)

**Files to create:**

- `app/(admin)/layout.tsx`
- `app/(admin)/admin/layout.tsx`
- `components/admin/admin-header.component.tsx`
- `components/admin/admin-nav.component.tsx`

**Features:**

- ✅ Separate layout from main app
- ✅ Admin-specific navigation
- ✅ "Exit Admin Mode" button
- ✅ User dropdown with admin indicator

**Layout Structure:**

```typescript
// app/(admin)/admin/layout.tsx
import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';
import { AdminHeader } from '@/components/admin/admin-header.component';
import { AdminNav } from '@/components/admin/admin-nav.component';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side role verification (Better Auth)
  const context = await requireSuperAdminContext();

  return (
    <div className="admin-layout">
      <AdminHeader user={context.user} />
      <div className="admin-content">
        <AdminNav />
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
```

#### 5.2 Admin Dashboard Page (DONE)

**Files to create:**

- `app/(admin)/admin/page.tsx`
- `components/admin/dashboard/metric-card.component.tsx`
- `components/admin/dashboard/user-growth-chart.component.tsx`
- `components/admin/dashboard/revenue-chart.component.tsx`
- `components/admin/dashboard/recent-activity.component.tsx`

**Features:**

- ✅ Key metrics cards (users, orgs, revenue, growth)
- ✅ User growth chart (last 30 days)
- ✅ Revenue trend chart
- ✅ Recent system activity
- ✅ Quick actions (refresh stats, view logs)

#### 5.3 User Management Page (DONE)

**Files to create:**

- `app/(admin)/admin/users/page.tsx`
- `components/admin/users/user-table.component.tsx`
- `components/admin/users/user-filters.component.tsx`
- `components/admin/users/user-details-dialog.component.tsx`
- `components/admin/users/update-role-dialog.component.tsx`
- `components/admin/users/ban-user-dialog.component.tsx`

**Features:**

- ✅ Searchable, sortable user table
- ✅ Filter by role
- ✅ Pagination
- ✅ View user details (orgs, activity)
- ✅ Update user role (using Better Auth setRole)
- ✅ Ban/unban user (using Better Auth banUser)
- ✅ Bulk actions

**User Table Columns:**

- Name
- Email
- Role (from Better Auth)
- Banned Status (from Better Auth)
- Email Verified
- Organizations Count
- Created At
- Actions (View, Edit Role, Ban)

#### 5.4 Organization Management Page (Done)

**Files to create:**

- `app/(admin)/admin/organizations/page.tsx`
- `components/admin/organizations/organization-table.component.tsx`
- `components/admin/organizations/organization-table.config.tsx`
- `components/admin/organizations/organization-details-dialog.component.tsx`

**Implementation Status:**

- ✅ Uses generic admin table system
- ✅ Pull data from backend via `/api/admin/organizations`
- ✅ Server-side rendering with initial data
- ✅ Client-side filtering, pagination, and URL sync

**Generic Table System Reference:**

This page uses the generic admin table system documented in `implementation-plans/2025-10-05-generic-admin-table-system-implementation-plan.md`. See the implementation for reference on:

- Type-safe table configuration (`TableConfig<TData, TFilters>`)
- Filter definitions using `FilterFieldType` enum
- Action definitions with dynamic variants
- URL synchronization with `useTableUrlSync` hook
- Server-side data fetching with pagination
- Toast notifications for user feedback

#### 5.5 Subscription Analytics Page (DONE)

**Implementation Approach:** Use Generic Admin Table System + Custom Charts

**Files to create:**

- `app/(admin)/admin/analytics/page.tsx` - Main analytics page with server-side data fetching
- `components/admin/analytics/subscription-table.config.tsx` - **Table configuration** for subscriptions
- `components/admin/analytics/subscription-table.component.tsx` - Subscription table using generic wrapper
- `components/admin/analytics/revenue-metrics.component.tsx` - Revenue metric cards
- `components/admin/analytics/plan-distribution-chart.component.tsx` - Plan distribution visualization
- `components/admin/analytics/revenue-trend-chart.component.tsx` - Revenue over time chart
- `lib/db/queries/admin-subscription-analytics.query.ts` - Analytics data queries
- `lib/types/analytics/subscription-analytics.type.ts` - Type definitions
- `app/api/admin/analytics/subscriptions/route.ts` - API endpoint for subscription data

**Generic Table Integration:**

Use the generic admin table system to display subscription data with:

**Table Columns:**

- Organization name (with logo)
- Plan name
- Subscription status (with color-coded badges)
- MRR (Monthly Recurring Revenue)
- Start date
- Renewal/trial end date
- Customer lifetime value

**Filter Definitions:**

```typescript
// components/admin/analytics/subscription-table.config.tsx
import { FilterFieldType } from '@/lib/types/table';

export type SubscriptionTableFilters = {
  search?: string;
  status?: string; // active, trialing, canceled, past_due
  planName?: string;
  minMRR?: number;
  maxMRR?: number;
  limit?: number;
  offset?: number;
};

export const subscriptionTableConfig: TableConfig<
  SubscriptionTableData,
  SubscriptionTableFilters
> = {
  tableId: 'subscriptions',
  apiEndpoint: '/api/admin/analytics/subscriptions',

  columns: [
    // Organization column with logo
    // Plan name with badge
    // Status with color variant
    // MRR formatted as currency
    // Dates with relative time
  ],

  filters: [
    {
      key: 'search',
      type: FilterFieldType.SEARCH,
      placeholder: 'Search organizations...',
      debounceMs: 300,
    },
    {
      key: 'status',
      type: FilterFieldType.SELECT,
      placeholder: 'All Statuses',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Trialing', value: 'trialing' },
        { label: 'Canceled', value: 'canceled' },
        { label: 'Past Due', value: 'past_due' },
      ],
    },
    {
      key: 'planName',
      type: FilterFieldType.SELECT,
      placeholder: 'All Plans',
      options: [
        { label: 'Basic', value: 'Basic' },
        { label: 'Pro', value: 'Pro' },
        { label: 'Enterprise', value: 'Enterprise' },
      ],
    },
  ],

  actions: [
    {
      id: 'view-stripe',
      label: 'View in Stripe',
      icon: ExternalLink,
      onClick: (row) => {
        window.open(
          `https://dashboard.stripe.com/customers/${row.stripeCustomerId}`,
          '_blank'
        );
      },
    },
  ],

  pagination: {
    defaultLimit: 50,
    pageSizeOptions: [25, 50, 100],
    showPageSizeSelector: true,
  },
};
```

**Data Fetching:**

- Pull subscription data from Stripe via webhooks (already synced to database)
- Calculate MRR, churn rate, LTV from organization table
- Aggregate revenue metrics for charts
- Server-side pagination and filtering

**Page Structure:**

```typescript
// app/(admin)/admin/analytics/page.tsx
export default async function SubscriptionAnalyticsPage({ searchParams }) {
  const filters = parseFiltersFromSearchParams(searchParams);

  // Fetch initial data server-side
  const [initialTableData, revenueMetrics, planDistribution] = await Promise.all([
    getSubscriptionTableData(filters),
    getRevenueMetrics(),
    getPlanDistribution(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Subscription Analytics" />

      {/* Metric Cards */}
      <RevenueMetrics data={revenueMetrics} />

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <PlanDistributionChart data={planDistribution} />
        <RevenueTrendChart />
      </div>

      {/* Subscription Table using generic system */}
      <SubscriptionTable
        initialData={initialTableData}
        initialFilters={filters}
      />
    </div>
  );
}
```

**Additional Features:**

- Export subscription data to CSV
- Revenue trend over time (30/60/90 days)
- Churn rate calculation
- Plan distribution pie chart
- Top customers by MRR

#### 5.6 System Activity Logs Page (DONE)

**Implementation Approach:** Use Generic Admin Table System

**Files to create:**

- `app/(admin)/admin/activity/page.tsx` - Main activity logs page with server-side data
- `components/admin/activity/activity-log-table.config.tsx` - **Table configuration** for activity logs
- `components/admin/activity/activity-log-table.component.tsx` - Activity table using generic wrapper
- `components/admin/activity/activity-details-dialog.component.tsx` - Detailed view of log entry
- `lib/db/queries/admin-activity-logs.query.ts` - Activity log queries with advanced filtering
- `lib/types/activity/activity-log-filters.type.ts` - Type definitions
- `app/api/admin/activity/route.ts` - API endpoint for activity log data
- `app/api/admin/activity/export/route.ts` - CSV export endpoint

**Generic Table Integration:**

Use the generic admin table system to display activity logs with:

**Table Columns:**

- Timestamp (with relative time display)
- User (name, email, avatar)
- Action type (with icon and color-coded badge)
- Description (formatted based on action type)
- IP Address
- User Agent (browser/device)
- Status (success/failure)

**Filter Definitions:**

```typescript
// components/admin/activity/activity-log-table.config.tsx
import { FilterFieldType } from '@/lib/types/table';

export type ActivityLogTableFilters = {
  search?: string; // Search user email or action
  userId?: string;
  action?: string; // Filter by action type
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  status?: 'success' | 'failure';
  limit?: number;
  offset?: number;
};

export const activityLogTableConfig: TableConfig<
  ActivityLogTableData,
  ActivityLogTableFilters
> = {
  tableId: 'activity-logs',
  apiEndpoint: '/api/admin/activity',

  columns: [
    {
      accessorKey: 'timestamp',
      header: 'Time',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {format(row.original.timestamp, 'MMM d, HH:mm:ss')}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatDistanceToNow(row.original.timestamp, { addSuffix: true })}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.original.user.avatar} />
            <AvatarFallback>{row.original.user.initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{row.original.user.name}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.user.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <Badge variant={getActionBadgeVariant(row.original.action)}>
          {formatActionLabel(row.original.action)}
        </Badge>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'ipAddress',
      header: 'IP Address',
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.ipAddress || '—'}
        </span>
      ),
    },
  ],

  filters: [
    {
      key: 'search',
      type: FilterFieldType.SEARCH,
      placeholder: 'Search by user or action...',
      debounceMs: 300,
      formatBadgeLabel: (value) => `Search: ${value}`,
    },
    {
      key: 'action',
      type: FilterFieldType.SELECT,
      placeholder: 'All Actions',
      options: [
        { label: 'User Login', value: 'user.login' },
        { label: 'User Logout', value: 'user.logout' },
        { label: 'User Created', value: 'user.created' },
        { label: 'Organization Created', value: 'organization.created' },
        { label: 'Subscription Created', value: 'subscription.created' },
        { label: 'Subscription Canceled', value: 'subscription.canceled' },
        { label: 'Admin Role Updated', value: 'admin.user.role_updated' },
        { label: 'Admin User Banned', value: 'admin.user.banned' },
      ],
      formatBadgeLabel: (value) => `Action: ${formatActionLabel(value)}`,
    },
    {
      key: 'status',
      type: FilterFieldType.SELECT,
      placeholder: 'All Statuses',
      options: [
        { label: 'Success', value: 'success' },
        { label: 'Failure', value: 'failure' },
      ],
      formatBadgeLabel: (value) => `Status: ${value}`,
    },
    {
      key: 'startDate',
      type: FilterFieldType.DATE,
      label: 'Start Date',
      placeholder: 'Select start date',
    },
    {
      key: 'endDate',
      type: FilterFieldType.DATE,
      label: 'End Date',
      placeholder: 'Select end date',
    },
  ],

  actions: [
    {
      id: 'view-details',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => {
        // Open dialog with full log entry details including metadata
      },
    },
  ],

  pagination: {
    defaultLimit: 100,
    pageSizeOptions: [50, 100, 250, 500],
    showPageSizeSelector: true,
  },

  emptyState: {
    icon: Activity,
    title: 'No activity logs found',
    description: 'Try adjusting your filters or date range',
  },
};
```

**Data Fetching:**

- Query `activity_logs` table with filters
- Join with `user` table for user details
- Filter by date range (optimized with index on timestamp)
- Server-side pagination for large datasets
- Support CSV export for audit reports

**Page Structure:**

```typescript
// app/(admin)/admin/activity/page.tsx
import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';
import { getActivityLogs } from '@/lib/db/queries/admin-activity-logs.query';
import { ActivityLogTable } from '@/components/admin/activity/activity-log-table.component';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default async function ActivityLogsPage({ searchParams }) {
  await requireSuperAdminContext();

  const filters = parseActivityFiltersFromSearchParams(searchParams);
  const initialData = await getActivityLogs(filters);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Activity Logs</h1>
          <p className="text-muted-foreground mt-1">
            Monitor all system activities and user actions
          </p>
        </div>

        <Button variant="outline" asChild>
          <a href="/api/admin/activity/export" download>
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </a>
        </Button>
      </div>

      {/* Activity Log Table using generic system */}
      <ActivityLogTable
        initialData={initialData}
        initialFilters={filters}
      />
    </div>
  );
}
```

**Additional Features:**

- Real-time log updates (optional with polling or WebSocket)
- Export logs to CSV with filters applied
- View full log entry details in dialog
- Filter by date range with date picker
- Group logs by action type
- Highlight suspicious activities (multiple failed logins, etc.)

**Database Optimization:**

Ensure proper indexes exist for performance:

```sql
-- Already defined in plan, but emphasize for activity logs
CREATE INDEX idx_activity_timestamp_desc ON activity_logs(timestamp DESC);
CREATE INDEX idx_activity_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_action ON activity_logs(action);
CREATE INDEX idx_activity_timestamp_range ON activity_logs(timestamp) WHERE timestamp >= NOW() - INTERVAL '90 days';
```

### Phase 6: Admin Server Actions (Days 9-10) (DONE)

#### 6.1 User Management Actions

**Files to create:**

- `app/actions/admin/update-user-role.action.ts`
- `app/actions/admin/ban-user.action.ts`
- `app/actions/admin/unban-user.action.ts`

**Implementation:**

```typescript
// app/actions/admin/update-user-role.action.ts
import { z } from 'zod';
import { withSuperAdmin } from '@/lib/auth/super-admin-middleware';
import { updateUserRole } from '@/lib/db/queries/admin-user.query';
import { logActivity } from '@/lib/db/queries/activity-log.query';
import { updateUserRoleSchema } from '@/lib/types/admin';

export const updateUserRoleAction = withSuperAdmin(
  async (formData, context) => {
    const data = updateUserRoleSchema.parse({
      userId: formData.get('userId'),
      role: formData.get('role'),
    });

    // Update role via Better Auth
    await updateUserRole(data.userId, data.role);

    // Log admin action
    await logActivity({
      userId: context.user.id,
      action: 'admin.user.role_updated',
      metadata: {
        targetUserId: data.userId,
        newRole: data.role,
      },
    });

    return { success: 'User role updated successfully' };
  },
  {
    logAction: 'admin.user.role_updated',
  }
);

// app/actions/admin/ban-user.action.ts
import { withSuperAdmin } from '@/lib/auth/super-admin-middleware';
import { banUserById } from '@/lib/db/queries/admin-user.query';
import { banUserSchema } from '@/lib/types/admin';

export const banUserAction = withSuperAdmin(
  async (formData, context) => {
    const data = banUserSchema.parse({
      userId: formData.get('userId'),
      reason: formData.get('reason'),
      expiresInDays: formData.get('expiresInDays')
        ? parseInt(formData.get('expiresInDays') as string)
        : undefined,
    });

    // Ban user via Better Auth
    await banUserById(data.userId, data.reason, data.expiresInDays);

    return { success: 'User banned successfully' };
  },
  {
    logAction: 'admin.user.banned',
  }
);
```

#### 6.2 Statistics Actions

**Files to create:**

- `app/actions/admin/refresh-stats.action.ts`

### Phase 7: Navigation & Configuration (Day 10)

#### 7.1 Admin Navigation Config

**Files to modify:**

- `config/navigation.ts`

**Tasks:**

- ✅ Add admin navigation tree
- ✅ Admin navigation items (dashboard, users, orgs, analytics, activity)
- ✅ Update navigation types to support admin scope

**Implementation:**

```typescript
// config/navigation.ts (add to existing)
import { BarChart3, Users, Building2, Activity, Shield } from 'lucide-react';

const adminItems: NavigationItem[] = [
  {
    key: 'admin.dashboard',
    slug: '',
    label: 'Dashboard',
    description: 'System overview and metrics',
    icon: BarChart3,
  },
  {
    key: 'admin.users',
    slug: 'users',
    label: 'Users',
    description: 'Manage all users',
    icon: Users,
  },
  {
    key: 'admin.organizations',
    slug: 'organizations',
    label: 'Organizations',
    description: 'Manage all organizations',
    icon: Building2,
  },
  {
    key: 'admin.analytics',
    slug: 'analytics',
    label: 'Analytics',
    description: 'Subscription and revenue analytics',
    icon: BarChart3,
  },
  {
    key: 'admin.activity',
    slug: 'activity',
    label: 'Activity',
    description: 'System activity logs',
    icon: Activity,
  },
];

export const adminNav: NavigationTree = {
  key: 'admin',
  basePath: '/admin',
  items: adminItems,
};

export const navigationTrees: readonly NavigationTree[] = [
  marketingNav,
  appNav,
  adminNav, // ✅ NEW
];
```

#### 7.2 Admin Access Link in App Header

**Files to modify:**

- `app/(app)/app-header.component.tsx` (or equivalent)

**Tasks:**

- ✅ Show "Admin" link in header for admins only
- ✅ Check user role on server side (from Better Auth)
- ✅ Styled with admin badge/icon

### Phase 8: Unit Testing (Days 11)

#### 8.1 Auth Infrastructure Tests

**Files to create:**

- `tests/auth/super-admin-context.test.ts`
- `tests/auth/super-admin-middleware.test.ts`

**Test Coverage:**

- ✅ `requireSuperAdminContext()` throws for non-admins
- ✅ `getSuperAdminContext()` returns null for non-admins
- ✅ `isUserAdmin()` correctly identifies roles
- ✅ `withSuperAdmin()` wrapper authorization
- ✅ Better Auth integration

#### 8.2 Query Function Tests

**Files to create:**

- `tests/db/queries/admin-statistics.test.ts`
- `tests/db/queries/admin-user.test.ts`
- `tests/db/queries/admin-organization.test.ts`

**Test Coverage:**

- ✅ Statistics calculation accuracy
- ✅ User listing with Better Auth
- ✅ Role update via Better Auth API
- ✅ Ban/unban operations

#### 8.3 API Route Tests

**Files to create:**

- `tests/api/admin/stats.test.ts`
- `tests/api/admin/users.test.ts`

**Test Coverage:**

- ✅ Super-admin authentication enforcement
- ✅ Non-admins receive 403 Forbidden
- ✅ Response data structure
- ✅ Better Auth integration

#### 8.4 Server Action Tests

**Files to create:**

- `tests/actions/admin/update-user-role.test.ts`
- `tests/actions/admin/ban-user.test.ts`

**Test Coverage:**

- ✅ Role update validation
- ✅ Activity logging
- ✅ Authorization checks via Better Auth

### Phase 9: Documentation (Day 12)

#### 9.1 Technical Documentation

**Files to create:**

- `docs/admin/overview.md`
- `docs/admin/better-auth-integration.md`
- `docs/admin/authentication.md`
- `docs/admin/user-management.md`
- `docs/admin/analytics.md`
- `docs/admin/security.md`

**Content:**

- Architecture overview
- Better Auth admin plugin setup
- Role-based access control
- Query function reference
- API endpoint documentation
- Server action examples
- Security best practices
- Testing guide

#### 9.2 User Guide

**Files to create:**

- `docs/admin/user-guide.md`

**Content:**

- How to access admin panel
- Dashboard overview
- Managing users (promote, ban)
- Organization management
- Reading analytics
- Activity log filtering
- Exporting data

#### 9.3 Update Project Documentation

**Files to modify:**

- `CLAUDE.md`
- `README.md` (if applicable)

**Tasks:**

- ✅ Document super-admin test credentials
- ✅ Add Better Auth admin plugin configuration
- ✅ Document admin panel features
- ✅ Link to admin documentation

## Configuration Files

### Better Auth Admin Configuration

```typescript
// lib/auth.ts
import { admin } from 'better-auth/plugins';

export const auth = betterAuth({
  // ... existing config
  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['admin', 'super-admin'],
      impersonationSessionDuration: 3600,
      defaultBanReason: 'Violation of terms of service',
      bannedUserMessage: 'Your account has been suspended.',
    }),
  ],
});
```

### Admin Panel Constants

```typescript
// lib/admin/admin.config.ts

/**
 * Admin panel configuration constants.
 */
export const ADMIN_CONFIG = {
  // Routes
  BASE_PATH: '/admin',

  // Pagination defaults
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,

  // Statistics refresh
  STATS_CACHE_TTL: 300, // 5 minutes
  STATS_REFRESH_INTERVAL: 3600000, // 1 hour in ms

  // Activity logs
  ACTIVITY_LOG_PAGE_SIZE: 100,
  ACTIVITY_LOG_EXPORT_LIMIT: 10000,

  // User management
  MAX_BULK_ACTION_SIZE: 100,
} as const;
```

## Performance Considerations

### Optimization Strategies

1. **Database Indexes:**

   ```sql
   -- Better Auth manages role indexes automatically
   -- We only need indexes for custom queries

   -- User search
   CREATE INDEX idx_user_email_trgm ON "user" USING gin(email gin_trgm_ops);
   CREATE INDEX idx_user_name_trgm ON "user" USING gin(name gin_trgm_ops);

   -- Activity logs for admin panel
   CREATE INDEX idx_activity_timestamp_desc ON activity_logs(timestamp DESC);
   CREATE INDEX idx_activity_user_id ON activity_logs(user_id);
   ```

2. **Caching Strategy:**
   - Admin statistics cached for 5 minutes
   - Better Auth handles role caching internally
   - Invalidate caches on writes
   - Use stale-while-revalidate pattern

3. **Query Optimization:**
   - Use Better Auth's optimized `listUsers()` API
   - Implement pagination for large datasets
   - Limit SELECT columns to needed fields only

4. **Component Performance:**
   - Virtualize large tables
   - Lazy load chart components
   - Debounce search inputs (300ms)
   - Memoize expensive calculations

## Security Considerations

### Multi-Layer Security Model

1. **Database Level (Better Auth Managed):**
   - Role stored in database (single source of truth)
   - Better Auth handles role updates securely
   - All role changes can be logged
   - Ban status enforced at auth level

2. **Middleware Level:**
   - Verify role for `/admin/*` routes
   - Check `user.role` from Better Auth session
   - Block access before page renders
   - Redirect unauthorized users

3. **Server Context Level:**
   - `requireSuperAdminContext()` checks role from session
   - Never trust client-side role claims
   - Better Auth ensures session integrity
   - Automatic session validation

4. **Action/API Level:**
   - `withSuperAdmin()` wrapper for server actions
   - Role verification in every admin API route
   - Activity logging for all admin actions
   - Rate limiting on sensitive endpoints

5. **Component Level:**
   - Hide admin UI elements for non-admins
   - Client-side checks for UX only (not security)
   - Server-side validation always enforced

### Better Auth Security Features

- **Role Management:** Secure role updates via API
- **Ban System:** Built-in user banning with reason tracking
- **Session Tracking:** Impersonation tracking via `impersonatedBy`
- **Permission Checks:** Built-in permission validation
- **Audit Trail:** All admin operations logged

### Audit Trail

All admin actions must be logged:

- User role changes (via Better Auth)
- User bans/unbans
- Organization modifications
- System configuration updates
- Data exports
- Failed admin access attempts

## Migration Strategy

### Better Auth Migration

#### Step 1: Run Better Auth Migration

```bash
# Better Auth will add required fields to user and session tables
npx @better-auth/cli migrate

# Or generate and run with Drizzle
npx @better-auth/cli generate
pnpm db:migrate
```

**Schema Changes Applied:**

- `user.role` (text, default: 'user')
- `user.banned` (boolean, default: false)
- `user.banReason` (text, nullable)
- `user.banExpires` (timestamp, nullable)
- `session.impersonatedBy` (text, nullable)

#### Step 2: Create Custom Admin Statistics Table

```bash
pnpm db:generate
pnpm db:migrate
```

### Seed Updates

Update seed script to create super-admin test user:

```bash
pnpm db:seed
```

Test credentials:

- Email: `admin@test.com`
- Password: `admin123`
- Role: `super-admin` (set via Better Auth)

### Rollback Plan

If issues arise:

1. **Revert Middleware:**
   - Remove super-admin route guards
   - Deploy middleware without admin checks

2. **Revert Better Auth Config:**

   ```typescript
   // Remove admin plugin from lib/auth.ts
   plugins: [
     // admin(), // ← commented out
   ];
   ```

3. **Revert Database:**

   ```bash
   pnpm db:rollback
   ```

4. **Remove Admin Routes:**
   - Delete `app/(admin)` directory
   - Remove admin navigation from config

5. **Restore Git State:**
   ```bash
   git revert <commit-hash>
   ```

## Success Metrics

### Key Performance Indicators

1. **Security:**
   - Zero unauthorized admin access incidents
   - 100% of admin actions logged
   - Role-based access enforced at all layers
   - Better Auth handles authentication securely

2. **Performance:**
   - Dashboard loads in < 2 seconds
   - User list queries < 500ms (p95)
   - Statistics calculation < 10 seconds
   - Admin API response time < 300ms (p95)

3. **Functionality:**
   - Super-admin can view all users and organizations
   - User role changes via Better Auth work immediately
   - Ban/unban operations function correctly
   - Statistics refresh completes without errors

4. **Usability:**
   - Admin panel intuitive for non-technical users
   - Clear error messages
   - Responsive design works on all screen sizes
   - Search and filters work as expected

## Risk Assessment

### Technical Risks

| Risk                                   | Probability | Impact | Mitigation                               |
| -------------------------------------- | ----------- | ------ | ---------------------------------------- |
| Better Auth migration issues           | Low         | Medium | Test migration in staging first          |
| Performance issues with large datasets | Medium      | Medium | Pagination, indexing, caching            |
| Better Auth API changes                | Low         | Low    | Pin Better Auth version, monitor updates |
| Statistics calculation timeout         | Low         | Low    | Background jobs, incremental updates     |

### Business Risks

| Risk                       | Probability | Impact   | Mitigation                                  |
| -------------------------- | ----------- | -------- | ------------------------------------------- |
| Privacy concerns           | Medium      | High     | Document in privacy policy, GDPR compliance |
| Admin abuse of access      | Low         | Critical | Audit logs, multi-admin oversight           |
| Complexity for small teams | Low         | Low      | Progressive disclosure, good documentation  |

## Testing Strategy

### Unit Tests

**Coverage Target:** 80% minimum

- Auth context helpers
- Query functions (Better Auth wrappers)
- Server actions
- Utility functions

### Integration Tests

- End-to-end admin flows
- Role verification across layers
- Better Auth integration
- Statistics calculation accuracy

### Manual Testing Checklist

- [ ] Non-admin cannot access `/admin`
- [ ] Admin and super-admin can access admin pages
- [ ] Dashboard metrics display correctly
- [ ] User table shows Better Auth role field
- [ ] Role update via Better Auth succeeds
- [ ] Ban user via Better Auth works
- [ ] Unban user via Better Auth works
- [ ] Organization details show subscription info
- [ ] Analytics charts render correctly
- [ ] Activity logs exportable
- [ ] Navigation works correctly
- [ ] "Exit Admin Mode" returns to app
- [ ] Mobile responsive layout

## Timeline & Deliverables

**Estimated Timeline:** 10-12 days (Reduced from 15 days due to Better Auth)

| Phase | Duration  | Deliverable                                       | Dependencies  |
| ----- | --------- | ------------------------------------------------- | ------------- |
| 1     | 1-2 days  | Better Auth setup + custom statistics table       | None          |
| 2     | 2-3 days  | Auth infrastructure (wrappers around Better Auth) | Phase 1       |
| 3     | 3-5 days  | Admin query functions (Better Auth + custom)      | Phase 1       |
| 4     | 5-7 days  | Admin API routes                                  | Phase 2, 3    |
| 5     | 7-9 days  | Admin UI components                               | Phase 4       |
| 6     | 9-10 days | Admin server actions                              | Phase 2, 3, 4 |
| 7     | 10 days   | Navigation & configuration                        | Phase 5       |
| 8     | 11 days   | Unit testing                                      | All phases    |
| 9     | 12 days   | Documentation                                     | All phases    |

### Critical Path

```
Phase 1 (Better Auth + Schema) → Phase 2 (Auth Wrappers) → Phase 3 (Queries) → Phase 4 (API) → Phase 5 (UI)
                                                          ↓
                                                   Phase 6 (Actions) → Phase 7 (Nav) → Phase 8 (Tests) → Phase 9 (Docs)
```

### Time Savings from Better Auth

- **Role Infrastructure:** Saved 2-3 days (no custom role system)
- **User Operations:** Saved 1-2 days (ban, role updates built-in)
- **Session Management:** Saved 1 day (impersonation built-in)
- **Permission System:** Saved 1 day (Better Auth handles this)

**Total Time Saved:** 5-7 days

## Next Steps

1. ✅ Review and approve this implementation plan
2. ✅ Install Better Auth admin plugin
3. ✅ Run Better Auth migration: `npx @better-auth/cli migrate`
4. ✅ Set up admin plugin configuration (Phase 1)
5. ✅ Create auth infrastructure wrappers (Phase 2)
6. ✅ Build query layer using Better Auth (Phase 3)
7. ✅ Create API routes (Phase 4)
8. ✅ Develop UI components (Phase 5)
9. ✅ Implement server actions (Phase 6)
10. ✅ Configure navigation (Phase 7)
11. ✅ Write tests (Phase 8)
12. ✅ Document everything (Phase 9)
13. ✅ Code review and QA
14. ✅ Merge and deploy

## Generic Admin Table System Reference

### Overview

The generic admin table system is a reusable, type-safe table framework built for the admin panel. It eliminates code duplication and provides a consistent UX across all admin tables.

**Implementation Plan:** `implementation-plans/2025-10-05-generic-admin-table-system-implementation-plan.md`

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Generic Admin Table System                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Table Configuration (*.config.tsx)                        │ │
│  │  • TableConfig<TData, TFilters> type                       │ │
│  │  • Column definitions with custom cell renderers           │ │
│  │  • Filter definitions with FilterFieldType enum            │ │
│  │  • Action definitions with dynamic variants                │ │
│  │  • Pagination config                                       │ │
│  │  • Empty state config                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  AdminTableWrapper Component                               │ │
│  │  • State management (filters, data, loading)               │ │
│  │  • URL synchronization with useTableUrlSync hook           │ │
│  │  • Client-side data fetching with pagination               │ │
│  │  • Toast notifications for errors                          │ │
│  │  • Automatic filter reset on offset change                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  AdminTable Component                                      │ │
│  │  • TanStack Table v8 integration                           │ │
│  │  • Sortable columns                                        │ │
│  │  • Row actions dropdown menu                               │ │
│  │  • Loading skeletons                                       │ │
│  │  • Empty state display                                     │ │
│  │  • Accessibility (ARIA labels, screen readers)             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  AdminTableFilters Component                               │ │
│  │  • Search input with debounce (300ms)                      │ │
│  │  • Select dropdowns for categorical filters                │ │
│  │  • Boolean toggles for yes/no filters                      │ │
│  │  • Date pickers for date range filters                     │ │
│  │  • Active filter badges with clear buttons                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Core Files

**Type Definitions:**

- `lib/types/table/table-config.type.ts` - Main configuration type
- `lib/types/table/column-definition.type.ts` - Column configuration
- `lib/types/table/filter-definition.type.ts` - Filter configuration
- `lib/types/table/filter-field-type.enum.ts` - Filter type enum (SEARCH, SELECT, BOOLEAN, DATE)
- `lib/types/table/action-definition.type.ts` - Action button configuration with dynamic variants
- `lib/types/table/pagination-config.type.ts` - Pagination settings
- `lib/types/table/table-data-response.type.ts` - API response structure

**Generic Components:**

- `components/admin/generic/admin-table-wrapper.component.tsx` - State management wrapper
- `components/admin/generic/admin-table.component.tsx` - Table rendering with TanStack Table
- `components/admin/generic/admin-table-filters.component.tsx` - Filter UI components

**Custom Hooks:**

- `lib/hooks/table/use-table-url-sync.hook.ts` - Sync filters with URL parameters
- `lib/hooks/table/use-debounced-callback.hook.ts` - Debounce callbacks with proper cleanup

### Usage Pattern

#### 1. Create Table Configuration File

```typescript
// components/admin/[feature]/[feature]-table.config.tsx
import { FilterFieldType } from '@/lib/types/table';
import type { TableConfig } from '@/lib/types/table';

export type MyTableData = {
  id: string;
  name: string;
  // ... other fields
};

export type MyTableFilters = {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
};

export const myTableConfig: TableConfig<MyTableData, MyTableFilters> = {
  tableId: 'my-table',
  apiEndpoint: '/api/admin/my-endpoint',

  columns: [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span>{row.original.name}</span>,
    },
    // ... more columns
  ],

  filters: [
    {
      key: 'search',
      type: FilterFieldType.SEARCH,
      placeholder: 'Search...',
      debounceMs: 300,
      formatBadgeLabel: (value) => `Search: ${value}`,
    },
    {
      key: 'status',
      type: FilterFieldType.SELECT,
      placeholder: 'All Statuses',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
      formatBadgeLabel: (value) => `Status: ${value}`,
    },
  ],

  actions: [
    {
      id: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (row) => console.log(row.id),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: async (row) => {
        // Handle delete
      },
    },
  ],

  pagination: {
    defaultLimit: 50,
    pageSizeOptions: [10, 25, 50, 100],
    showPageSizeSelector: true,
  },

  emptyState: {
    icon: Building2,
    title: 'No items found',
    description: 'Try adjusting your filters',
  },
};
```

#### 2. Create Wrapper Component

```typescript
// components/admin/[feature]/[feature]-table.component.tsx
'use client';

import { useState } from 'react';
import { AdminTableWrapper } from '@/components/admin/generic/admin-table-wrapper.component';
import { myTableConfig, type MyTableData, type MyTableFilters } from './my-table.config';
import type { TableDataResponse } from '@/lib/types/table';

type MyTableProps = {
  initialData: TableDataResponse<MyTableData>;
  initialFilters: MyTableFilters;
};

export function MyTable({ initialData, initialFilters }: MyTableProps) {
  // Add any custom state or handlers here
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Optionally enhance config with custom handlers
  const configWithHandlers = {
    ...myTableConfig,
    actions: myTableConfig.actions?.map((action) => {
      if (action.id === 'view') {
        return {
          ...action,
          onClick: (row: MyTableData) => setSelectedId(row.id),
        };
      }
      return action;
    }),
  };

  return (
    <>
      <AdminTableWrapper
        config={configWithHandlers}
        initialData={initialData}
        initialFilters={initialFilters}
      />

      {/* Add dialogs or modals here */}
      {selectedId && <MyDetailsDialog id={selectedId} onClose={() => setSelectedId(null)} />}
    </>
  );
}
```

#### 3. Create Server-Side Page

```typescript
// app/(admin)/admin/[feature]/page.tsx
import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';
import { getMyTableData } from '@/lib/db/queries/my-query';
import { MyTable } from '@/components/admin/[feature]/my-table.component';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MyPage({ searchParams }: PageProps) {
  await requireSuperAdminContext();

  const params = await searchParams;
  const filters = {
    search: typeof params.search === 'string' ? params.search : undefined,
    status: typeof params.status === 'string' ? params.status : undefined,
    limit: params.limit ? parseInt(params.limit as string) : 50,
    offset: params.offset ? parseInt(params.offset as string) : 0,
  };

  const initialData = await getMyTableData(filters);

  return (
    <div className="space-y-6">
      <h1>My Admin Page</h1>
      <MyTable initialData={initialData} initialFilters={filters} />
    </div>
  );
}
```

#### 4. Create API Route

```typescript
// app/api/admin/my-endpoint/route.ts
import { NextResponse } from 'next/server';
import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';
import { getMyTableData } from '@/lib/db/queries/my-query';

export async function GET(request: Request) {
  try {
    await requireSuperAdminContext();

    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      limit: parseInt(searchParams.get('limit') ?? '50'),
      offset: parseInt(searchParams.get('offset') ?? '0'),
    };

    const data = await getMyTableData(filters);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}
```

### Key Features

**Type Safety:**

- Full TypeScript generics throughout (`TData`, `TFilters`)
- Zod schemas for runtime validation
- Type inference from table configuration

**Performance:**

- Debounced search input (300ms)
- Memoized columns to prevent re-renders
- Server-side pagination
- URL synchronization for shareable links

**Accessibility:**

- ARIA labels on interactive elements
- Screen reader announcements for loading states
- Keyboard navigation support
- Semantic HTML

**User Experience:**

- Toast notifications for errors
- Loading skeletons during fetches
- Active filter badges with clear buttons
- Empty state with helpful messaging
- Responsive design

**Developer Experience:**

- Minimal boilerplate
- Consistent patterns across tables
- Easy to extend with custom handlers
- Clear separation of concerns
- JSDoc comments throughout

### Filter Types

**FilterFieldType.SEARCH:**

- Text input with debounce
- Searches across multiple fields
- Clear button to reset

**FilterFieldType.SELECT:**

- Dropdown with predefined options
- Supports single selection
- Shows selected value in badge

**FilterFieldType.BOOLEAN:**

- Toggle between true/false
- Useful for yes/no filters
- Shows state in badge

**FilterFieldType.DATE:**

- Date picker for date ranges
- startDate and endDate filters
- ISO string format

### Action Variants

**Static Variants:**

```typescript
{
  id: 'delete',
  variant: 'destructive', // Always destructive
}
```

**Dynamic Variants:**

```typescript
{
  id: 'ban-user',
  variant: (row) => (row.banned ? 'success' : 'destructive'),
  label: (row) => (row.banned ? 'Unban User' : 'Ban User'),
}
```

### Best Practices

1. **Always use `.config.tsx` suffix** for table configuration files
2. **Import FilterFieldType enum** instead of type casting strings
3. **Define types for TData and TFilters** explicitly
4. **Use formatBadgeLabel** to provide clear filter feedback
5. **Add JSDoc comments** to table configurations
6. **Implement server-side filtering** in query functions
7. **Return TableDataResponse<TData>** from API routes
8. **Handle errors with toast notifications**
9. **Use async actions** for delete/update operations
10. **Add loading states** during data mutations

### Examples in Codebase

- **User Management:** `components/admin/users/user-table.config.tsx`
- **Organization Management:** `components/admin/organizations/organization-table.config.tsx`

Both examples demonstrate:

- Complete table configuration
- Multiple filter types
- Dynamic action variants
- Custom cell renderers
- Dialog integration
- Server action handling

## References

### Official Documentation

- [Better Auth Admin Plugin](https://www.better-auth.com/docs/plugins/admin) - Core admin functionality
- [Better Auth Plugins](https://www.better-auth.com/docs/concepts/plugins) - Plugin system overview
- [Next.js 15 App Router](https://nextjs.org/docs/app) - Route groups, middleware, server components
- [Drizzle ORM](https://orm.drizzle.team/) - Schema definition, migrations, queries
- [TanStack Table](https://tanstack.com/table/latest) - Powerful data tables
- [Recharts](https://recharts.org/) - React charting library
- [shadcn/ui](https://ui.shadcn.com/) - UI component library

### Best Practices

- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Security best practices
- [GDPR Compliance](https://gdpr.eu/) - Data privacy regulations
- [Role-Based Access Control](https://en.wikipedia.org/wiki/Role-based_access_control) - RBAC patterns

### Internal Documentation

- `docs/environment-configuration.md` - Environment setup
- `CLAUDE.md` - Development standards and conventions
- `implementation-plans/2025-10-05-generic-admin-table-system-implementation-plan.md` - Generic table system

## Conclusion

This implementation plan provides a comprehensive roadmap for building a **secure, scalable super-admin control panel** using **Better Auth's built-in admin plugin**. By leveraging Better Auth's battle-tested admin infrastructure, we significantly reduce implementation complexity and time while maintaining enterprise-grade security.

### Key Benefits

- ✅ **Better Auth Integration** - Leverage built-in role, ban, and permission systems
- ✅ **Reduced Complexity** - 40% less code to maintain vs custom implementation
- ✅ **Faster Development** - 5-7 days saved by using Better Auth features
- ✅ **Battle-Tested Security** - Better Auth handles role management securely
- ✅ **Type-Safe** - TypeScript + Zod throughout
- ✅ **Performant** - Cached metrics, indexed queries, pagination
- ✅ **Auditable** - All admin actions logged
- ✅ **Scalable** - Designed for growth
- ✅ **Maintainable** - Clear separation of concerns
- ✅ **Extensible** - Easy to add features
- ✅ **Well-Documented** - Comprehensive docs

### Architecture Highlights

1. **Better Auth Admin Plugin** - Core role and permission management
2. **Custom Wrappers** - Application-specific helpers around Better Auth
3. **Multi-Layer Validation** - Defense in depth security
4. **Isolated Admin Space** - Separate route group and layout
5. **Cached Metrics** - Custom statistics for dashboard
6. **Comprehensive Logging** - Full audit trail
7. **Follows Conventions** - Uses existing patterns

### Better Auth Advantages

- **Built-in Role System** - No custom role field needed
- **User Operations** - Create, list, update via API
- **Ban System** - Built-in ban/unban with reason tracking
- **Session Management** - Impersonation and session control
- **Permission Checks** - Client and server-side validation
- **Database Migrations** - Automatic schema updates
- **Type Safety** - Full TypeScript support

### Timeline Summary

**Total Duration:** 10-12 days (down from 15 days)

- Phase 1-2 (Days 1-3): Better Auth setup + wrappers
- Phase 3-4 (Days 3-7): Data layer and API
- Phase 5-6 (Days 7-10): UI and actions
- Phase 7-9 (Days 10-12): Integration, testing, docs

Ready to start building once approved!
