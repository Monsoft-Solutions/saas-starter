---
title: Admin API Reference
description: Complete reference for Admin Space API endpoints, server actions, and database queries
---

# Admin API Reference

Complete documentation of all Admin Space API endpoints, server actions, and database query functions.

## API Endpoints

All admin API endpoints require super-admin authentication and are protected by middleware.

### Base URL

```
/api/admin/*
```

All endpoints return JSON responses and follow RESTful conventions.

### Authentication

All endpoints require:

- Valid session cookie
- User with `admin` or `super-admin` role

**Unauthorized Response (403):**

```json
{
  "error": "Forbidden",
  "message": "Super admin access required"
}
```

## Statistics API

### Get Admin Statistics

Retrieve cached admin statistics for the dashboard.

```http
GET /api/admin/stats
```

**Query Parameters:**

| Parameter | Type    | Required | Description                  |
| --------- | ------- | -------- | ---------------------------- |
| `refresh` | boolean | No       | Force refresh (bypass cache) |

**Example Request:**

```bash
curl -X GET https://your-app.com/api/admin/stats \
  -H "Cookie: better-auth.session_token=..."

# Force refresh
curl -X GET https://your-app.com/api/admin/stats?refresh=true \
  -H "Cookie: better-auth.session_token=..."
```

**Response (200):**

```typescript
{
  id: number,
  totalUsers: number,
  activeUsersLast30Days: number,
  newUsersLast30Days: number,
  totalOrganizations: number,
  organizationsWithSubscriptions: number,
  totalMRR: number,
  totalActiveSubscriptions: number,
  trialOrganizations: number,
  userGrowthRate: number | null,
  revenueGrowthRate: number | null,
  churnRate: number | null,
  calculatedAt: string,        // ISO date string
  calculationDurationMs: number,
  metadata: string | null,      // JSON string
}
```

**Example Response:**

```json
{
  "id": 1,
  "totalUsers": 1523,
  "activeUsersLast30Days": 892,
  "newUsersLast30Days": 145,
  "totalOrganizations": 456,
  "organizationsWithSubscriptions": 234,
  "totalMRR": 5850,
  "totalActiveSubscriptions": 234,
  "trialOrganizations": 222,
  "userGrowthRate": 12.5,
  "revenueGrowthRate": 8.3,
  "churnRate": 2.1,
  "calculatedAt": "2025-10-06T10:30:00Z",
  "calculationDurationMs": 342,
  "metadata": null
}
```

**Error Responses:**

| Status | Description                            |
| ------ | -------------------------------------- |
| 403    | Forbidden - Not authenticated as admin |
| 500    | Internal Server Error                  |

**Implementation:**

```typescript
// app/api/admin/stats/route.ts
export async function GET(request: Request) {
  await requireSuperAdminContext();

  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';

  let stats;
  if (forceRefresh) {
    stats = await refreshAdminStatistics();
  } else {
    stats = await getAdminStatistics();
  }

  return NextResponse.json(stats);
}
```

## Users API

### List Users

Retrieve paginated list of all users with optional filtering.

```http
GET /api/admin/users
```

**Query Parameters:**

| Parameter | Type   | Required | Default | Description                               |
| --------- | ------ | -------- | ------- | ----------------------------------------- |
| `search`  | string | No       | -       | Search by name or email                   |
| `role`    | string | No       | -       | Filter by role (user, admin, super-admin) |
| `limit`   | number | No       | 50      | Items per page (max 100)                  |
| `offset`  | number | No       | 0       | Pagination offset                         |

**Example Request:**

```bash
# List all users
curl -X GET https://your-app.com/api/admin/users \
  -H "Cookie: better-auth.session_token=..."

# Search for specific user
curl -X GET "https://your-app.com/api/admin/users?search=john@example.com" \
  -H "Cookie: better-auth.session_token=..."

# Filter by role
curl -X GET "https://your-app.com/api/admin/users?role=admin&limit=25&offset=0" \
  -H "Cookie: better-auth.session_token=..."
```

**Response (200):**

```typescript
{
  users: Array<{
    id: string,
    name: string,
    email: string,
    emailVerified: boolean,
    role: string,
    banned: boolean,
    banReason: string | null,
    banExpires: string | null,  // ISO date string
    createdAt: string,           // ISO date string
  }>,
  total: number,
  limit: number,
  offset: number,
}
```

**Example Response:**

```json
{
  "users": [
    {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "emailVerified": true,
      "role": "user",
      "banned": false,
      "banReason": null,
      "banExpires": null,
      "createdAt": "2025-09-15T14:20:00Z"
    }
  ],
  "total": 1523,
  "limit": 50,
  "offset": 0
}
```

**Error Responses:**

| Status | Description                            |
| ------ | -------------------------------------- |
| 403    | Forbidden - Not authenticated as admin |
| 500    | Internal Server Error                  |

### Get User Details

Retrieve detailed information about a specific user.

```http
GET /api/admin/users/:id
```

**Path Parameters:**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `id`      | string | Yes      | User ID     |

**Example Request:**

```bash
curl -X GET https://your-app.com/api/admin/users/user_123 \
  -H "Cookie: better-auth.session_token=..."
```

**Response (200):**

```typescript
{
  id: string,
  name: string,
  email: string,
  emailVerified: boolean,
  role: string,
  banned: boolean,
  banReason: string | null,
  banExpires: string | null,
  createdAt: string,
  organizations: Array<{
    id: string,
    name: string,
    role: 'owner' | 'member',
    joinedAt: string,
  }>,
}
```

**Error Responses:**

| Status | Description           |
| ------ | --------------------- |
| 403    | Forbidden             |
| 404    | User not found        |
| 500    | Internal Server Error |

## Organizations API

### List Organizations

Retrieve paginated list of all organizations with optional filtering.

```http
GET /api/admin/organizations
```

**Query Parameters:**

| Parameter  | Type   | Required | Default | Description                             |
| ---------- | ------ | -------- | ------- | --------------------------------------- |
| `search`   | string | No       | -       | Search by name or owner email           |
| `planName` | string | No       | -       | Filter by plan (Basic, Pro, Enterprise) |
| `status`   | string | No       | -       | Filter by subscription status           |
| `limit`    | number | No       | 50      | Items per page (max 100)                |
| `offset`   | number | No       | 0       | Pagination offset                       |

**Example Request:**

```bash
# List all organizations
curl -X GET https://your-app.com/api/admin/organizations \
  -H "Cookie: better-auth.session_token=..."

# Filter by plan
curl -X GET "https://your-app.com/api/admin/organizations?planName=Pro&limit=25" \
  -H "Cookie: better-auth.session_token=..."
```

**Response (200):**

```typescript
{
  organizations: Array<{
    id: string,
    name: string,
    ownerEmail: string,
    planName: string | null,
    subscriptionStatus: string | null,
    mrr: number,
    memberCount: number,
    createdAt: string,
  }>,
  total: number,
  limit: number,
  offset: number,
}
```

**Error Responses:**

| Status | Description           |
| ------ | --------------------- |
| 403    | Forbidden             |
| 500    | Internal Server Error |

### Get Organization Details

Retrieve detailed information about a specific organization.

```http
GET /api/admin/organizations/:id
```

**Response (200):**

```typescript
{
  id: string,
  name: string,
  stripeCustomerId: string | null,
  stripeSubscriptionId: string | null,
  planName: string | null,
  subscriptionStatus: string | null,
  createdAt: string,
  members: Array<{
    userId: string,
    userName: string,
    userEmail: string,
    role: 'owner' | 'member',
    joinedAt: string,
  }>,
}
```

## Activity Logs API

### List Activity Logs

Retrieve paginated activity logs with filtering options.

```http
GET /api/admin/activity
```

**Query Parameters:**

| Parameter   | Type   | Required | Default | Description                |
| ----------- | ------ | -------- | ------- | -------------------------- |
| `search`    | string | No       | -       | Search by user or action   |
| `action`    | string | No       | -       | Filter by action type      |
| `userId`    | string | No       | -       | Filter by user             |
| `startDate` | string | No       | -       | Filter by start date (ISO) |
| `endDate`   | string | No       | -       | Filter by end date (ISO)   |
| `limit`     | number | No       | 50      | Items per page (max 100)   |
| `offset`    | number | No       | 0       | Pagination offset          |

**Example Request:**

```bash
# List recent activity
curl -X GET https://your-app.com/api/admin/activity \
  -H "Cookie: better-auth.session_token=..."

# Filter by action type and date range
curl -X GET "https://your-app.com/api/admin/activity?action=user.role.updated&startDate=2025-10-01T00:00:00Z" \
  -H "Cookie: better-auth.session_token=..."
```

**Response (200):**

```typescript
{
  activities: Array<{
    id: number,
    userId: string,
    userName: string,
    userEmail: string,
    action: string,
    timestamp: string,
    ipAddress: string | null,
    userAgent: string | null,
    metadata: object | null,
  }>,
  total: number,
  limit: number,
  offset: number,
}
```

### Export Activity Logs

Export activity logs as CSV file with applied filters.

```http
GET /api/admin/activity/export
```

**Query Parameters:** Same as List Activity Logs

**Example Request:**

```bash
curl -X GET "https://your-app.com/api/admin/activity/export?startDate=2025-10-01T00:00:00Z" \
  -H "Cookie: better-auth.session_token=..." \
  -o activity-logs.csv
```

**Response (200):**

```
Content-Type: text/csv
Content-Disposition: attachment; filename=activity-logs-[timestamp].csv

Timestamp,User ID,User Email,Action,IP Address,Metadata
2025-10-06 10:30:00,user_123,admin@example.com,user.role.updated,192.168.1.1,"{""targetUserId"":""user_456""}"
```

## Analytics API

### Get Subscription Analytics

Retrieve detailed subscription and revenue analytics.

```http
GET /api/admin/analytics/subscriptions
```

**Example Request:**

```bash
curl -X GET https://your-app.com/api/admin/analytics/subscriptions \
  -H "Cookie: better-auth.session_token=..."
```

**Response (200):**

```typescript
{
  totalMRR: number,
  activeSubscriptions: number,
  arpu: number,                    // Average Revenue Per User
  planDistribution: {
    [planName: string]: number,    // Count per plan
  },
  revenueTrend: Array<{
    date: string,
    mrr: number,
    subscriptionCount: number,
  }>,
  subscriptions: Array<{
    organizationId: string,
    organizationName: string,
    planName: string,
    status: string,
    mrr: number,
    startDate: string,
    currentPeriodEnd: string,
  }>,
}
```

## Server Actions

Server actions are called from client components using `useTransition` or `useFormState`.

### Update User Role

Update a user's role.

**Location:** `app/actions/admin/update-user-role.action.ts`

**Function Signature:**

```typescript
export async function updateUserRoleAction(
  input: UpdateUserRoleInput
): Promise<{ success: boolean; error?: string }>;
```

**Input Schema:**

```typescript
{
  userId: string,        // Required, non-empty
  role: 'user' | 'admin' | 'super-admin',  // Required
}
```

**Example Usage:**

```typescript
'use client';

import { updateUserRoleAction } from '@/app/actions/admin/update-user-role.action';

export function UpdateRoleButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleUpdateRole = () => {
    startTransition(async () => {
      const result = await updateUserRoleAction({
        userId,
        role: 'admin',
      });

      if (result.success) {
        toast.success('Role updated successfully');
      } else {
        toast.error(result.error || 'Failed to update role');
      }
    });
  };

  return (
    <Button onClick={handleUpdateRole} disabled={isPending}>
      Promote to Admin
    </Button>
  );
}
```

**Implementation:**

```typescript
export async function updateUserRoleAction(input: UpdateUserRoleInput) {
  // Verify admin context
  const adminContext = await requireSuperAdminContext();

  // Validate input
  const validated = updateUserRoleSchema.parse(input);

  // Update role via Better Auth
  await auth.api.setRole({
    userId: validated.userId,
    role: validated.role,
  });

  // Log activity
  await logActivity({
    action: 'user.role.updated',
    metadata: {
      targetUserId: validated.userId,
      newRole: validated.role,
    },
  });

  revalidatePath('/admin/users');
  return { success: true };
}
```

### Ban User

Ban a user with optional expiry.

**Location:** `app/actions/admin/ban-user.action.ts`

**Function Signature:**

```typescript
export async function banUserAction(
  input: BanUserInput
): Promise<{ success: boolean; error?: string }>;
```

**Input Schema:**

```typescript
{
  userId: string,           // Required, non-empty
  reason: string,           // Required, min 10 characters
  expiresInDays?: number,   // Optional, positive integer
}
```

**Example Usage:**

```typescript
const result = await banUserAction({
  userId: 'user_123',
  reason: 'Violation of terms of service',
  expiresInDays: 7,
});
```

**Implementation:**

```typescript
export async function banUserAction(input: BanUserInput) {
  const adminContext = await requireSuperAdminContext();
  const validated = banUserSchema.parse(input);

  // Calculate expiry if provided
  const expiresIn = validated.expiresInDays
    ? validated.expiresInDays * 86400 // Convert days to seconds
    : undefined;

  // Ban user via Better Auth
  await auth.api.banUser({
    userId: validated.userId,
    reason: validated.reason,
    expiresIn,
  });

  // Log activity
  await logActivity({
    action: 'user.banned',
    metadata: {
      targetUserId: validated.userId,
      reason: validated.reason,
      expiresInDays: validated.expiresInDays,
    },
  });

  revalidatePath('/admin/users');
  return { success: true };
}
```

### Refresh Admin Statistics

Manually trigger statistics refresh.

**Location:** `app/actions/admin/refresh-stats.action.ts`

**Function Signature:**

```typescript
export async function refreshStatsAction(): Promise<{
  success: boolean;
  calculationDuration?: number;
  error?: string;
}>;
```

**Example Usage:**

```typescript
const result = await refreshStatsAction();

if (result.success) {
  console.log(`Statistics refreshed in ${result.calculationDuration}ms`);
}
```

### Delete Organization

Delete an organization and all related data.

**Location:** `lib/actions/admin/delete-organization.action.ts`

**Function Signature:**

```typescript
export async function deleteOrganizationAction(input: {
  organizationId: string;
}): Promise<{ success: boolean; error?: string }>;
```

::: danger Warning
This action permanently deletes the organization and cascades to all memberships.
:::

## Database Query Functions

Query functions for admin operations.

### Admin Statistics Queries

**Location:** `lib/db/queries/admin-statistics.query.ts`

#### getAdminStatistics()

Get latest cached admin statistics.

```typescript
export async function getAdminStatistics(): Promise<AdminStatistics | null>;
```

**Returns:** Cached statistics or null if none exist.

**Caching:** 5 minutes

#### calculateAdminStatistics()

Calculate fresh statistics from database.

```typescript
export async function calculateAdminStatistics(): Promise<AdminStatistics>;
```

**Returns:** Newly calculated statistics (not yet persisted).

**Performance:** ~200-500ms typical

#### refreshAdminStatistics()

Calculate and persist fresh statistics, invalidate cache.

```typescript
export async function refreshAdminStatistics(): Promise<AdminStatistics>;
```

**Returns:** Newly calculated and stored statistics.

#### getHistoricalStatistics()

Get historical statistics for trend analysis.

```typescript
export async function getHistoricalStatistics(
  days: number = 30
): Promise<AdminStatistics[]>;
```

**Parameters:**

- `days` - Number of days to look back (default: 30)

**Returns:** Array of historical statistics.

**Caching:** 10 minutes

### Admin User Queries

**Location:** `lib/db/queries/admin-user.query.ts`

#### listAllUsers()

List users with filtering and pagination.

```typescript
export async function listAllUsers(filters: UserListFilters): Promise<{
  users: User[];
  total: number;
}>;
```

**Parameters:**

```typescript
type UserListFilters = {
  search?: string;
  role?: string;
  limit?: number;
  offset?: number;
};
```

#### getUserDetails()

Get detailed user information including organizations.

```typescript
export async function getUserDetails(
  userId: string
): Promise<UserDetails | null>;
```

### Admin Organization Queries

**Location:** `lib/db/queries/admin-organization.query.ts`

#### listAllOrganizations()

List organizations with filtering and pagination.

```typescript
export async function listAllOrganizations(
  filters: OrganizationListFilters
): Promise<{
  organizations: Organization[];
  total: number;
}>;
```

**Parameters:**

```typescript
type OrganizationListFilters = {
  search?: string;
  planName?: string;
  status?: string;
  limit?: number;
  offset?: number;
};
```

## Type Definitions

### Admin Statistics

```typescript
// lib/types/admin/dashboard-stats.type.ts
export type AdminStatistics = {
  id: number;
  totalUsers: number;
  activeUsersLast30Days: number;
  newUsersLast30Days: number;
  totalOrganizations: number;
  organizationsWithSubscriptions: number;
  totalMRR: number;
  totalActiveSubscriptions: number;
  trialOrganizations: number;
  userGrowthRate: number | null;
  revenueGrowthRate: number | null;
  churnRate: number | null;
  calculatedAt: Date;
  calculationDurationMs: number | null;
  metadata: string | null;
};
```

### User Role

```typescript
// lib/types/admin/user-role.enum.ts
export const USER_ROLES = ['user', 'admin', 'super-admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];
```

### Filter Types

```typescript
// lib/types/admin/user-list-filters.type.ts
export type UserListFilters = {
  search?: string;
  role?: string;
  limit?: number;
  offset?: number;
};

// lib/types/admin/organization-list-filters.type.ts
export type OrganizationListFilters = {
  search?: string;
  planName?: string;
  status?: string;
  limit?: number;
  offset?: number;
};
```

## Error Handling

### Standard Error Response

```typescript
{
  error: string,          // Error type
  message?: string,       // Human-readable message
  details?: unknown,      // Additional context
}
```

### Common Error Status Codes

| Status | Meaning               | When it occurs              |
| ------ | --------------------- | --------------------------- |
| 400    | Bad Request           | Invalid input data          |
| 401    | Unauthorized          | No valid session            |
| 403    | Forbidden             | Valid session but not admin |
| 404    | Not Found             | Resource doesn't exist      |
| 500    | Internal Server Error | Server-side error           |

## Rate Limiting

::: tip Recommended
Implement rate limiting on admin API endpoints in production.
:::

Suggested limits:

- Statistics refresh: 1 request per minute
- User/org listings: 60 requests per minute
- Activity exports: 5 requests per hour

## Related Documentation

- [Overview](./overview.md) - Admin Space introduction
- [Authentication](./authentication.md) - Access control details
- [Features Guide](./features.md) - Feature documentation
- [Development Guide](./development.md) - Extending admin features

---

**Last Updated:** 2025-10-06
**Status:** ✅ Complete
