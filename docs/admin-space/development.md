---
title: Admin Space Development Guide
description: Comprehensive guide for developers to extend and customize the Admin Space with new features, pages, and functionality
---

# Admin Space Development Guide

This guide covers how to extend the Admin Space with new features, pages, API endpoints, and functionality while maintaining security and following established patterns.

## Development Overview

The Admin Space follows consistent architectural patterns across all features:

1. **Database Schema** - Define tables and types
2. **Query Functions** - Create reusable database queries
3. **API Routes** - Expose data via REST endpoints
4. **Server Actions** - Handle mutations with validation
5. **UI Components** - Build admin interface pages
6. **Route Guards** - Protect new routes
7. **Activity Logging** - Track admin actions
8. **Testing** - Write comprehensive tests

## Project Structure

```
saas-starter/
├── app/
│   ├── (admin)/
│   │   └── admin/
│   │       ├── layout.tsx              # Admin shell
│   │       ├── page.tsx                # Dashboard
│   │       ├── users/page.tsx          # User management
│   │       ├── organizations/page.tsx  # Org management
│   │       ├── analytics/page.tsx      # Analytics
│   │       └── activity/page.tsx       # Activity logs
│   ├── api/
│   │   └── admin/
│   │       ├── stats/route.ts          # Statistics API
│   │       ├── users/route.ts          # User list API
│   │       ├── organizations/route.ts  # Organization list API
│   │       ├── activity/route.ts       # Activity logs API
│   │       └── analytics/              # Analytics APIs
│   └── actions/
│       └── admin/
│           ├── update-user-role.action.ts
│           ├── ban-user.action.ts
│           └── refresh-stats.action.ts
├── components/
│   └── admin/
│       ├── dashboard/                  # Dashboard components
│       ├── users/                      # User management components
│       ├── organizations/              # Organization components
│       ├── analytics/                  # Analytics components
│       ├── activity/                   # Activity log components
│       ├── generic/                    # Reusable admin components
│       └── shared/                     # Shared utilities
├── lib/
│   ├── auth/
│   │   ├── super-admin-context.ts      # Admin context helpers
│   │   └── super-admin-middleware.ts   # Admin middleware
│   ├── db/
│   │   ├── schemas/
│   │   │   └── admin-statistics.table.ts
│   │   └── queries/
│   │       ├── admin-statistics.query.ts
│   │       ├── admin-user.query.ts
│   │       └── admin-organization.query.ts
│   └── types/
│       └── admin/
│           ├── user-role.enum.ts
│           ├── update-user-role.schema.ts
│           └── ban-user.schema.ts
└── docs/
    └── admin-space/                    # This documentation
```

## Adding a New Admin Feature

Let's walk through adding a complete admin feature: **System Settings Management**.

### Step 1: Define Database Schema

Create the database table and types.

**File:** `lib/db/schemas/admin-settings.table.ts`

```typescript
import { pgTable, serial, text, boolean, timestamp } from 'drizzle-orm/pg-core';

/**
 * System-wide settings managed by admins.
 */
export const adminSettings = pgTable('admin_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  isPublic: boolean('is_public').default(false).notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: text('updated_by').notNull(), // User ID
});

export type AdminSetting = typeof adminSettings.$inferSelect;
export type NewAdminSetting = typeof adminSettings.$inferInsert;
```

**Register in schema index:**

```typescript
// lib/db/schemas/index.ts
export * from './admin-settings.table';
```

**Run migration:**

```bash
pnpm db:generate
pnpm db:migrate
```

### Step 2: Create Query Functions

**File:** `lib/db/queries/admin-settings.query.ts`

```typescript
import 'server-only';
import { db } from '../drizzle';
import { adminSettings } from '../schemas';
import { eq, desc } from 'drizzle-orm';
import logger from '@/lib/logger/logger.service';
import type { AdminSetting, NewAdminSetting } from '../schemas';

/**
 * Get all admin settings.
 */
export async function getAllSettings(): Promise<AdminSetting[]> {
  return await db.select().from(adminSettings).orderBy(adminSettings.key);
}

/**
 * Get a specific setting by key.
 */
export async function getSetting(key: string): Promise<AdminSetting | null> {
  const [setting] = await db
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.key, key))
    .limit(1);

  return setting || null;
}

/**
 * Update or create a setting.
 */
export async function upsertSetting(
  key: string,
  value: string,
  userId: string
): Promise<AdminSetting> {
  const [setting] = await db
    .insert(adminSettings)
    .values({
      key,
      value,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: adminSettings.key,
      set: {
        value,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    })
    .returning();

  logger.info('[admin-settings] Setting upserted', { key, userId });
  return setting;
}
```

### Step 3: Define Types and Schemas

**File:** `lib/types/admin/update-setting.schema.ts`

```typescript
import { z } from 'zod';

export const updateSettingSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(1, 'Value is required'),
  description: z.string().optional(),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
```

**Export in index:**

```typescript
// lib/types/admin/index.ts
export * from './update-setting.schema';
```

### Step 4: Create API Endpoint

**File:** `app/api/admin/settings/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';
import { getAllSettings } from '@/lib/db/queries/admin-settings.query';
import logger from '@/lib/logger/logger.service';

/**
 * GET /api/admin/settings
 *
 * Retrieve all admin settings.
 *
 * @requires Super-admin role
 * @returns Array of settings
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminContext();

    const settings = await getAllSettings();

    return NextResponse.json({ settings });
  } catch (error) {
    logger.error('[api/admin/settings] Failed to get settings', { error });

    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    );
  }
}
```

### Step 5: Create Server Action

**File:** `app/actions/admin/update-setting.action.ts`

```typescript
'use server';

import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';
import {
  updateSettingSchema,
  type UpdateSettingInput,
} from '@/lib/types/admin';
import { upsertSetting } from '@/lib/db/queries/admin-settings.query';
import { logActivity } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import logger from '@/lib/logger/logger.service';

export async function updateSettingAction(
  input: UpdateSettingInput
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify admin context
    const adminContext = await requireSuperAdminContext();

    // Validate input
    const validated = updateSettingSchema.parse(input);

    // Update setting
    await upsertSetting(validated.key, validated.value, adminContext.user.id);

    // Log activity
    await logActivity({
      userId: adminContext.user.id,
      action: 'admin.setting.updated',
      metadata: {
        settingKey: validated.key,
        settingValue: validated.value,
      },
    });

    // Revalidate cache
    revalidatePath('/admin/settings');

    return { success: true };
  } catch (error) {
    logger.error('[updateSetting] Failed', { error });
    return { success: false, error: 'Failed to update setting' };
  }
}
```

### Step 6: Create UI Components

**File:** `components/admin/settings/settings-table.component.tsx`

```typescript
'use client';

import { useState, useTransition } from 'react';
import { updateSettingAction } from '@/app/actions/admin/update-setting.action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { AdminSetting } from '@/lib/db/schemas';

export function SettingsTable({ settings }: { settings: AdminSetting[] }) {
  const [isPending, startTransition] = useTransition();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (setting: AdminSetting) => {
    setEditingKey(setting.key);
    setEditValue(setting.value);
  };

  const handleSave = (key: string) => {
    startTransition(async () => {
      const result = await updateSettingAction({
        key,
        value: editValue,
      });

      if (result.success) {
        toast.success('Setting updated successfully');
        setEditingKey(null);
      } else {
        toast.error(result.error || 'Failed to update setting');
      }
    });
  };

  return (
    <div className="rounded-lg border bg-card">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="p-4 text-left">Key</th>
            <th className="p-4 text-left">Value</th>
            <th className="p-4 text-left">Description</th>
            <th className="p-4 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {settings.map((setting) => (
            <tr key={setting.key} className="border-b">
              <td className="p-4 font-mono text-sm">{setting.key}</td>
              <td className="p-4">
                {editingKey === setting.key ? (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    disabled={isPending}
                  />
                ) : (
                  <span>{setting.value}</span>
                )}
              </td>
              <td className="p-4 text-sm text-muted-foreground">
                {setting.description}
              </td>
              <td className="p-4">
                {editingKey === setting.key ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(setting.key)}
                      disabled={isPending}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingKey(null)}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(setting)}
                  >
                    Edit
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Step 7: Create Admin Page

**File:** `app/(admin)/admin/settings/page.tsx`

```typescript
import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';
import { getAllSettings } from '@/lib/db/queries/admin-settings.query';
import { SettingsTable } from '@/components/admin/settings/settings-table.component';

export default async function AdminSettingsPage() {
  await requireSuperAdminContext();

  const settings = await getAllSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Manage system-wide configuration settings
        </p>
      </div>

      <SettingsTable settings={settings} />
    </div>
  );
}
```

### Step 8: Update Navigation

**File:** `components/admin/admin-nav.component.tsx`

Add the new page to navigation:

```typescript
const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/organizations', label: 'Organizations', icon: Building2 },
  { href: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/admin/activity', label: 'Activity Logs', icon: Activity },
  { href: '/admin/settings', label: 'Settings', icon: Settings }, // NEW
];
```

### Step 9: Write Tests

**File:** `app/actions/admin/update-setting.action.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateSettingAction } from './update-setting.action';

// Mock dependencies
vi.mock('@/lib/auth/super-admin-context');
vi.mock('@/lib/db/queries/admin-settings.query');
vi.mock('@/lib/db/queries');

describe('updateSettingAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update setting successfully', async () => {
    // Mock admin context
    vi.mocked(requireSuperAdminContext).mockResolvedValue({
      user: { id: 'admin_1', role: 'admin' },
    } as any);

    // Mock upsert
    vi.mocked(upsertSetting).mockResolvedValue({
      id: 1,
      key: 'test_key',
      value: 'test_value',
    } as any);

    const result = await updateSettingAction({
      key: 'test_key',
      value: 'test_value',
    });

    expect(result.success).toBe(true);
    expect(upsertSetting).toHaveBeenCalledWith(
      'test_key',
      'test_value',
      'admin_1'
    );
  });

  it('should reject non-admin users', async () => {
    vi.mocked(requireSuperAdminContext).mockRejectedValue(
      new SuperAdminRequiredError()
    );

    const result = await updateSettingAction({
      key: 'test_key',
      value: 'test_value',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

## Reusable Components

The Admin Space includes generic, reusable components:

### AdminTable

Generic table with sorting, filtering, and pagination.

```typescript
import { AdminTable } from '@/components/admin/generic/admin-table.component';

<AdminTable
  columns={columns}
  data={data}
  onRowClick={(row) => console.log(row)}
  isLoading={false}
/>
```

### AdminTableWrapper

Wrapper with search and filters.

```typescript
import { AdminTableWrapper } from '@/components/admin/generic/admin-table-wrapper.component';

<AdminTableWrapper
  title="User Management"
  description="Manage all users"
  searchPlaceholder="Search by name or email"
  filters={[
    { key: 'role', label: 'Role', options: ['user', 'admin'] },
  ]}
  apiEndpoint="/api/admin/users"
  columns={columns}
/>
```

### MetricCard

Dashboard metric display card.

```typescript
import { MetricCard } from '@/components/admin/dashboard/metric-card.component';
import { Users } from 'lucide-react';

<MetricCard
  label="Total Users"
  value="1,523"
  icon={Users}
  trend={{ value: 12.5, isPositive: true }}
/>
```

### TablePagination

Pagination controls for tables.

```typescript
import { TablePagination } from '@/components/admin/shared/table-pagination.component';

<TablePagination
  total={1523}
  limit={50}
  offset={0}
  onPageChange={(newOffset) => setOffset(newOffset)}
/>
```

## Common Patterns

### Pattern: Cached Query with Manual Refresh

```typescript
export async function getCachedData() {
  const { cacheService, CacheKeys } = await import('@/lib/cache');

  return cacheService.getOrSet(
    CacheKeys.custom('admin', 'data-key'),
    async () => {
      // Expensive query
      return await db.select().from(table);
    },
    { ttl: 300 } // 5 minutes
  );
}

export async function refreshData() {
  const data = await calculateData();

  await db.insert(table).values(data);

  // Invalidate cache
  const { cacheService, CacheKeys } = await import('@/lib/cache');
  await cacheService.delete(CacheKeys.custom('admin', 'data-key'));

  return data;
}
```

### Pattern: Filterable List API

```typescript
export async function GET(request: NextRequest) {
  await requireSuperAdminContext();

  const searchParams = request.nextUrl.searchParams;

  const filters = filterSchema.parse({
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
  });

  const result = await queryWithFilters(filters);

  return NextResponse.json(result);
}
```

### Pattern: Server Action with Validation

```typescript
export async function adminAction(input: ActionInput) {
  try {
    const adminContext = await requireSuperAdminContext();
    const validated = actionSchema.parse(input);

    await performOperation(validated);

    await logActivity({
      userId: adminContext.user.id,
      action: 'action.performed',
      metadata: validated,
    });

    revalidatePath('/admin/relevant-page');

    return { success: true };
  } catch (error) {
    logger.error('[adminAction] Failed', { error });
    return { success: false, error: 'Operation failed' };
  }
}
```

## Testing Admin Features

### Unit Tests

Test individual functions:

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('adminQuery', () => {
  it('should return filtered results', async () => {
    const result = await adminQuery({ search: 'test' });
    expect(result).toHaveLength(5);
  });
});
```

### Integration Tests

Test complete flows:

```typescript
describe('Admin User Management', () => {
  it('should update user role and log activity', async () => {
    const result = await updateUserRoleAction({
      userId: 'user_123',
      role: 'admin',
    });

    expect(result.success).toBe(true);

    // Verify activity logged
    const activities = await getActivityLogs({
      action: 'user.role.updated',
    });

    expect(activities).toHaveLength(1);
    expect(activities[0].metadata.targetUserId).toBe('user_123');
  });
});
```

### E2E Tests

Test from UI to database:

```typescript
import { test, expect } from '@playwright/test';

test('admin can ban user', async ({ page }) => {
  await page.goto('/admin/users');

  await page.fill(
    '[placeholder="Search by name or email"]',
    'john@example.com'
  );
  await page.click('text=Ban User');
  await page.fill('[name="reason"]', 'Violation of terms');
  await page.click('text=Confirm Ban');

  await expect(page.locator('text=User banned successfully')).toBeVisible();
});
```

## Performance Optimization

### Use Caching

Cache expensive queries:

```typescript
const { cacheService, CacheKeys } = await import('@/lib/cache');

return cacheService.getOrSet(
  CacheKeys.custom('admin', 'expensive-query'),
  async () => await expensiveQuery(),
  { ttl: 600 } // 10 minutes
);
```

### Paginate Large Datasets

Always use pagination:

```typescript
const result = await db
  .select()
  .from(table)
  .limit(filters.limit)
  .offset(filters.offset);
```

### Index Database Columns

Add indexes for search fields:

```sql
CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_user_name ON "user"(name);
CREATE INDEX idx_organization_name ON organization(name);
```

### Use Database Aggregations

Let the database do heavy lifting:

```typescript
const stats = await db
  .select({
    total: count(),
    active: sql<number>`COUNT(CASE WHEN status = 'active' THEN 1 END)`,
  })
  .from(table);
```

## Debugging

### Enable Debug Logging

```typescript
import logger from '@/lib/logger/logger.service';

logger.debug('[admin-feature] Debug info', { data });
```

### Inspect Database Queries

Use Drizzle Studio:

```bash
pnpm db:studio
```

### Monitor API Requests

Check Network tab in DevTools or use logging middleware.

## Deployment Checklist

Before deploying new admin features:

- [ ] All new routes added to route guards
- [ ] All pages call `requireSuperAdminContext()`
- [ ] All server actions validate admin role
- [ ] All inputs validated with Zod schemas
- [ ] All operations logged with `logActivity()`
- [ ] Unit tests written and passing
- [ ] Integration tests cover main flows
- [ ] Database migrations run successfully
- [ ] Performance tested with large datasets
- [ ] Security review completed
- [ ] Documentation updated

## Best Practices Summary

1. **Security First** - Always verify admin role at every layer
2. **Validate Everything** - Use Zod for all inputs
3. **Log All Actions** - Maintain complete audit trail
4. **Cache Wisely** - Cache expensive queries with appropriate TTL
5. **Type Safety** - Leverage TypeScript types throughout
6. **Error Handling** - Handle errors gracefully, don't leak details
7. **Test Thoroughly** - Unit, integration, and E2E tests
8. **Document Well** - Keep documentation up to date

## Related Documentation

- [Overview](./overview.md) - Admin Space introduction
- [Authentication](./authentication.md) - Access control details
- [Features Guide](./features.md) - Feature documentation
- [API Reference](./api-reference.md) - Complete API documentation
- [Security Architecture](./security.md) - Security implementation

---

**Last Updated:** 2025-10-06
**Status:** ✅ Complete
