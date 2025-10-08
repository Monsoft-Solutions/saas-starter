# Admin Table Refactoring - Type-Safe API Integration

## Overview

This document describes the refactoring of the admin table system to use centralized route definitions and type-safe API clients, eliminating hardcoded endpoints and direct fetch calls.

## Changes Made

### 1. Updated TableConfig Type

**File:** `lib/types/table/table-config.type.ts`

- **Before:** Used hardcoded `apiEndpoint: string`
- **After:** Uses `route: RouteDefinition<z.ZodTypeAny, z.ZodTypeAny>` from routes.config.ts

**Benefits:**

- Type-safe route definitions
- Centralized endpoint management
- Automatic request/response validation
- Better IDE autocomplete and refactoring support

```typescript
export type TableConfig<TData, TFilters> = {
  // ... other properties

  /** API route definition from routes.config.ts */
  route: RouteDefinition<z.ZodTypeAny, z.ZodTypeAny>;

  // ... other properties
};
```

### 2. Refactored AdminTableWrapper

**File:** `components/admin/generic/admin-table-wrapper.component.tsx`

**Before:**

```typescript
// Manual fetch with URL building
const response = await fetch(`${config.apiEndpoint}?${queryParams.toString()}`);
const newData = await response.json();
```

**After:**

```typescript
// Type-safe API client with automatic validation
const newData = await apiRequest(config.route, {
  queryParams: updatedFilters as Record<
    string,
    string | number | boolean | undefined
  >,
});
```

**Benefits:**

- Automatic request/response validation using Zod schemas
- Centralized error handling with `ApiError` class
- Timeout management
- Consistent API interface
- Better error messages

### 3. Updated All Table Configurations

All table configs now use centralized route definitions:

#### User Table Config

**File:** `components/admin/users/user-table.config.tsx`

```typescript
import { apiRoutes } from '@/lib/api/routes.config';

export const userTableConfig: TableConfig<UserTableData, AdminUserListRequest> =
  {
    tableId: 'users',
    route: apiRoutes.admin.users.list, // ✅ Type-safe route
    // ...
  };
```

#### Organization Table Config

**File:** `components/admin/organizations/organization-table.config.tsx`

```typescript
export const organizationTableConfig: TableConfig<
  OrganizationTableData,
  AdminOrganizationListRequest
> = {
  tableId: 'organizations',
  route: apiRoutes.admin.organizations.list, // ✅ Type-safe route
  // ...
};
```

#### Activity Log Table Config

**File:** `components/admin/activity/activity-log-table.config.tsx`

```typescript
export const activityLogTableConfig: TableConfig<
  ActivityLogTableData,
  ActivityLogTableFilters
> = {
  tableId: 'activity-logs',
  route: apiRoutes.admin.activity.list, // ✅ Type-safe route
  // ...
};
```

#### Subscription Analytics Table Config

**File:** `components/admin/analytics/subscription-table.config.tsx`

```typescript
export const subscriptionTableConfig: TableConfig<
  SubscriptionTableData,
  SubscriptionTableFilters
> = {
  tableId: 'subscriptions',
  route: apiRoutes.admin.analytics.subscriptions, // ✅ Type-safe route
  // ...
};
```

## Architecture Benefits

### 1. Centralized Route Management

- All API routes are defined in one place: `lib/api/routes.config.ts`
- Easy to discover and modify endpoints
- Prevents endpoint duplication and inconsistencies

### 2. Type Safety

- Compile-time validation of request/response structures
- IDE autocomplete for route definitions
- Prevents runtime errors from API changes

### 3. Automatic Validation

- Request parameters validated against Zod schemas
- Response data validated before use
- Clear error messages when validation fails

### 4. Error Handling

- Consistent error handling using `ApiError` class
- Detailed error messages with context
- Network error detection and handling

### 5. Maintainability

- Single source of truth for API contracts
- Easy to update API endpoints
- Refactoring support in IDEs

## Usage Example

### Before (Old Pattern)

```typescript
// Hardcoded endpoint
const config = {
  apiEndpoint: '/api/admin/users',
  // ...
};

// Manual fetch
const response = await fetch(`${config.apiEndpoint}?${queryParams.toString()}`);
const data = await response.json();
```

### After (New Pattern)

```typescript
// Type-safe route reference
import { apiRoutes } from '@/lib/api/routes.config';

const config = {
  route: apiRoutes.admin.users.list,
  // ...
};

// Type-safe API client
const data = await apiRequest(config.route, {
  queryParams: { limit: 50, offset: 0, search: 'john' },
});
```

## Testing Considerations

When testing components using table configs:

1. **Mock the apiRequest function:**

```typescript
vi.mock('@/lib/api/client.util', () => ({
  apiRequest: vi.fn(),
}));
```

2. **Mock route definitions:**

```typescript
const mockRoute = {
  path: '/api/admin/users',
  method: 'GET',
  querySchema: z.object({}),
  responseSchema: z.object({}),
};
```

3. **Test error scenarios:**

```typescript
(apiRequest as Mock).mockRejectedValue(
  new ApiError('Test error', 500, undefined, '/api/admin/users', 'GET')
);
```

## Migration Checklist

When creating new admin tables:

- [ ] Define route in `lib/api/routes.config.ts` with proper schemas
- [ ] Reference route in table config using `apiRoutes.your.route.here`
- [ ] Use `AdminTableWrapper` component for data fetching
- [ ] Ensure request/response types match Zod schemas
- [ ] Test error scenarios

## Related Files

- **Route Config:** `lib/api/routes.config.ts`
- **API Client:** `lib/api/client.util.ts`
- **Table Type:** `lib/types/table/table-config.type.ts`
- **Table Wrapper:** `components/admin/generic/admin-table-wrapper.component.tsx`

## Future Enhancements

Consider these improvements for future iterations:

1. **SWR Integration:**
   - Add SWR for automatic caching and revalidation
   - Implement optimistic updates
   - Add background refetching

2. **Query Invalidation:**
   - Invalidate queries when data changes
   - Implement mutation callbacks

3. **Infinite Scroll:**
   - Replace pagination with infinite scroll
   - Use SWR infinite for data loading

4. **Export Functionality:**
   - Add CSV/Excel export using route data
   - Maintain type safety in exports
