---
title: Server Actions & Permissions
description: Complete guide to creating permission-protected server actions with admin access control
---

# Server Actions & Permissions

This guide explains how to create server actions with permission-based access control for admin features.

## Table of Contents

- [Overview](#overview)
- [Permission System](#permission-system)
- [Creating Server Actions](#creating-server-actions)
- [Permission Wrappers](#permission-wrappers)
- [Admin Context](#admin-context)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

Server actions with permissions provide a secure way to implement admin functionality with fine-grained access control. The permission system automatically verifies user permissions before executing actions.

### Key Features

- ✅ **Automatic permission verification** - No manual checks required
- ✅ **Type-safe actions** - Full TypeScript support
- ✅ **Admin context** - Access to user and permission data
- ✅ **Standardized error handling** - Consistent permission denied responses
- ✅ **Activity logging** - Automatic audit trail

## Permission System

### Available Permissions

Permissions are defined in `lib/types/admin/permission.enum.ts`:

```typescript
export enum AdminPermission {
  // User management
  'users:read' = 'users:read',
  'users:write' = 'users:write',

  // Organization management
  'organizations:read' = 'organizations:read',
  'organizations:write' = 'organizations:write',

  // Analytics
  'analytics:read' = 'analytics:read',

  // System administration
  'system:admin' = 'system:admin',
}
```

### Permission Hierarchy

Permissions are checked individually - a user must have ALL required permissions to execute an action.

::: tip Super Admin
Users with `system:admin` permission have access to all features regardless of other permissions.
:::

## Creating Server Actions

### Basic Server Action

Create a server action file in `lib/actions/[domain]/`:

```typescript
// lib/actions/admin/list-users.action.ts
'use server';

import { withPermission } from '@/lib/auth/permission-middleware';
import {
  listAllUsers,
  type UserFilters,
} from '@/lib/db/queries/admin-user.query';

/**
 * Server action to list all users with filters.
 * Requires the `users:read` admin permission.
 */
export const listAllUsersAction = withPermission(
  'users:read',
  async (filters: UserFilters) => {
    return await listAllUsers(filters);
  },
  'admin.users.list'
);
```

### File Naming Convention

Follow the naming pattern: `[action-name].action.ts`

```
lib/actions/
├── admin/
│   ├── list-users.action.ts
│   ├── update-user.action.ts
│   └── delete-user.action.ts
└── [domain]/
    └── [action].action.ts
```

## Permission Wrappers

### Single Permission

Use `withPermission()` when a single permission is required:

```typescript
export const viewUsersAction = withPermission(
  'users:read',
  async (filters, context) => {
    // context contains admin user and permissions
    return await listAllUsers(filters);
  },
  'admin.users.view'
);
```

### Multiple Permissions

Use `withPermissions()` when multiple permissions are ALL required:

```typescript
export const updateUserRoleAction = withPermissions(
  ['users:read', 'users:write'],
  async (userId: string, role: UserRole, context) => {
    // User must have BOTH permissions
    const user = await getUser(userId);
    return await updateUserRole(user.id, role);
  },
  'admin.users.update-role'
);
```

### Super Admin Only

Use `withSuperAdminPermission()` for critical actions:

```typescript
export const deleteAllDataAction = withSuperAdminPermission(
  async (confirmation: string, context) => {
    if (confirmation !== 'DELETE ALL DATA') {
      throw new Error('Invalid confirmation');
    }
    return await deleteAllData();
  },
  'admin.system.delete-all'
);
```

## Admin Context

Permission wrappers provide an `AdminContext` object with user and permission data:

```typescript
type AdminContext = {
  user: User;
  admin: {
    permissions: Set<AdminPermission>;
    isSuperAdmin: boolean;
  };
};
```

### Accessing Context

```typescript
export const getUserPermissionsAction = withPermission(
  'users:read',
  async (userId: string, context) => {
    // Access current admin user
    console.log('Admin:', context.user.email);

    // Check specific permissions
    if (context.admin.permissions.has('users:write')) {
      // Additional logic for write access
    }

    // Check super admin status
    if (context.admin.isSuperAdmin) {
      // Super admin logic
    }

    return await getUserPermissions(userId);
  },
  'admin.users.permissions'
);
```

## Error Handling

### Permission Denied

When a user lacks required permissions, the wrapper automatically:

1. Logs the permission denial
2. Returns an `ActionState` with error message (for form actions)
3. Redirects to `/app` (for non-form actions)

```typescript
// User with only 'users:read' permission
export const deleteUserAction = withPermission(
  'users:write', // ❌ User doesn't have this
  async (userId) => {
    return await deleteUser(userId);
  },
  'admin.users.delete'
);

// Result: Permission denied error
// "Forbidden: users:write permission required. Resource: admin.users.delete"
```

### Custom Error Handling

For custom error handling, catch errors in your action:

```typescript
export const updateUserAction = withPermission(
  'users:write',
  async (userId: string, data: UpdateData, context) => {
    try {
      return await updateUser(userId, data);
    } catch (error) {
      if (error instanceof DatabaseError) {
        return { error: 'Database error occurred' };
      }
      throw error;
    }
  },
  'admin.users.update'
);
```

## Best Practices

### 1. Use Descriptive Resource Names

Resource names appear in logs and help with debugging:

```typescript
// ✅ Good: Clear, descriptive resource name
export const action = withPermission(
  'users:read',
  async (data) => {
    /* ... */
  },
  'admin.users.list' // Clear resource identifier
);

// ❌ Bad: Generic or unclear name
export const action = withPermission(
  'users:read',
  async (data) => {
    /* ... */
  },
  'action' // Too generic
);
```

### 2. Document Required Permissions

Always document which permissions are required:

```typescript
/**
 * Updates user profile information.
 *
 * @requires users:read - To fetch current user data
 * @requires users:write - To update user data
 * @param userId - User ID to update
 * @param data - Update data
 */
export const updateUserAction = withPermissions(
  ['users:read', 'users:write'],
  async (userId: string, data: UpdateData) => {
    return await updateUser(userId, data);
  },
  'admin.users.update'
);
```

### 3. Use Appropriate Permission Level

Choose the minimum required permissions:

```typescript
// ✅ Good: Read-only action uses read permission
export const viewUserAction = withPermission(
  'users:read',
  async (userId) => {
    return await getUser(userId);
  },
  'admin.users.view'
);

// ❌ Bad: Read-only action requires write permission
export const viewUserAction = withPermission(
  'users:write', // Unnecessarily restrictive
  async (userId) => {
    return await getUser(userId);
  },
  'admin.users.view'
);
```

### 4. Keep Actions Focused

Each action should have a single responsibility:

```typescript
// ✅ Good: Focused action
export const updateUserEmailAction = withPermission(
  'users:write',
  async (userId: string, email: string) => {
    return await updateUserEmail(userId, email);
  },
  'admin.users.update-email'
);

// ❌ Bad: Action does too much
export const updateEverythingAction = withPermission(
  'users:write',
  async (userId: string, data: AllData) => {
    await updateUser(userId, data);
    await updateOrganization(data.orgId, data.orgData);
    await sendEmails(data.emails);
    // Too many responsibilities
  },
  'admin.update-everything'
);
```

## Examples

### Example 1: List Resources with Filters

```typescript
// lib/actions/admin/list-activity-logs.action.ts
'use server';

import { withPermission } from '@/lib/auth/permission-middleware';
import {
  listAllActivityLogs,
  type ActivityLogFilters,
} from '@/lib/db/queries/admin-activity-log.query';

/**
 * Server action to list all activity logs with filters and pagination.
 * Requires the `analytics:read` admin permission.
 */
export const listAllActivityLogsAction = withPermission(
  'analytics:read',
  async (filters: ActivityLogFilters) => {
    return await listAllActivityLogs(filters);
  },
  'admin.activity-logs.list'
);
```

### Example 2: Get Statistics

```typescript
// lib/actions/admin/get-statistics.action.ts
'use server';

import { withPermission } from '@/lib/auth/permission-middleware';
import { getActivityStatistics } from '@/lib/db/queries/admin-activity-log.query';

/**
 * Server action to get activity statistics for admin dashboard.
 * Requires the `analytics:read` admin permission.
 */
export const getActivityStatisticsAction = withPermission(
  'analytics:read',
  async (days: number = 30) => {
    return await getActivityStatistics(days);
  },
  'admin.activity-logs.statistics'
);
```

### Example 3: Update Resource

```typescript
// lib/actions/admin/update-organization.action.ts
'use server';

import { withPermissions } from '@/lib/auth/permission-middleware';
import { updateOrganization } from '@/lib/db/queries/admin-organization.query';

/**
 * Server action to update organization details.
 * Requires both read and write permissions.
 *
 * @requires organizations:read - To fetch current data
 * @requires organizations:write - To update data
 */
export const updateOrganizationAction = withPermissions(
  ['organizations:read', 'organizations:write'],
  async (organizationId: string, data: UpdateOrganizationData, context) => {
    // Log admin action
    console.log(`Admin ${context.user.email} updating org ${organizationId}`);

    return await updateOrganization(organizationId, data);
  },
  'admin.organizations.update'
);
```

### Example 4: Delete Resource (Super Admin)

```typescript
// lib/actions/admin/delete-user.action.ts
'use server';

import { withSuperAdminPermission } from '@/lib/auth/permission-middleware';
import { deleteUser } from '@/lib/db/queries/admin-user.query';

/**
 * Server action to permanently delete a user.
 * SUPER ADMIN ONLY - This is a destructive operation.
 */
export const deleteUserAction = withSuperAdminPermission(
  async (userId: string, context) => {
    // Double-check super admin status
    if (!context.admin.isSuperAdmin) {
      throw new Error('Unauthorized');
    }

    // Log critical action
    console.warn(
      `CRITICAL: Super admin ${context.user.email} deleting user ${userId}`
    );

    return await deleteUser(userId);
  },
  'admin.users.delete-permanent'
);
```

### Example 5: Export Data

```typescript
// lib/actions/admin/export-activity-logs.action.ts
'use server';

import { withPermission } from '@/lib/auth/permission-middleware';
import {
  exportActivityLogsToCSV,
  type ActivityLogFilters,
} from '@/lib/db/queries/admin-activity-log.query';

/**
 * Server action to export activity logs to CSV format.
 * Requires the `analytics:read` admin permission.
 */
export const exportActivityLogsToCSVAction = withPermission(
  'analytics:read',
  async (filters: ActivityLogFilters, context) => {
    // Log export action for audit trail
    console.log(`Admin ${context.user.email} exporting activity logs`, filters);

    return await exportActivityLogsToCSV(filters);
  },
  'admin.activity-logs.export'
);
```

## Testing

### Testing Permission-Protected Actions

When testing server actions with permissions, mock the admin context:

```typescript
import { vi } from 'vitest';
import * as adminContext from '@/lib/auth/admin-context';

describe('listAllUsersAction', () => {
  it('should list users when user has permission', async () => {
    // Mock admin context
    vi.spyOn(adminContext, 'requireAdminContext').mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@test.com' },
      admin: {
        permissions: new Set(['users:read']),
        isSuperAdmin: false,
      },
    });

    const result = await listAllUsersAction({ limit: 10 });

    expect(result).toBeDefined();
    expect(result.data).toBeInstanceOf(Array);
  });

  it('should throw when user lacks permission', async () => {
    // Mock admin without permission
    vi.spyOn(adminContext, 'requireAdminContext').mockResolvedValue({
      user: { id: 'admin-2', email: 'limited@test.com' },
      admin: {
        permissions: new Set([]), // No permissions
        isSuperAdmin: false,
      },
    });

    await expect(listAllUsersAction({ limit: 10 })).rejects.toThrow(
      'Permission denied'
    );
  });
});
```

## Troubleshooting

### Permission Denied Errors

If you're getting permission denied errors:

1. Check the user's permissions in the database
2. Verify the permission is spelled correctly
3. Check if super admin access is required
4. Review the action logs for details

### Type Errors

```typescript
// ❌ Wrong: Context parameter missing
export const action = withPermission('users:read', async (data) => {
  /* context not available */
});

// ✅ Right: Include context parameter
export const action = withPermission('users:read', async (data, context) => {
  /* context available */
});
```

## Related Documentation

- [API Handlers & Validation](./handlers-and-validation.md)
- [Admin Space Overview](../admin-space/overview.md)
- [Authentication](../auth/index.md)

---

**Last Updated:** 2025-10-08  
**Status:** ✅ Complete
