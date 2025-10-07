---
title: Admin Space Overview
description: Comprehensive overview of the Super Admin control panel for managing users, organizations, subscriptions, and system analytics
---

# Admin Space Overview

The Admin Space is a comprehensive super-admin control panel that enables application owners to monitor system health, manage users and organizations, analyze subscription metrics, and control the entire application from a secure, isolated interface.

## What is the Admin Space?

The Admin Space is a separate, protected area of your SaaS application designed exclusively for administrators. It provides:

- **System-wide visibility** - View all users, organizations, and activity across the platform
- **User management** - Update roles, ban users, reset passwords, and manage access
- **Organization oversight** - Monitor all organizations, subscriptions, and billing status
- **Analytics dashboard** - Track growth metrics, revenue, subscriptions, and user activity
- **Activity monitoring** - View and export comprehensive audit logs

## Key Features

### Dashboard & Analytics

- Real-time system statistics with cached performance
- User growth charts and trends
- Revenue metrics and MRR (Monthly Recurring Revenue) tracking
- Subscription analytics and plan distribution
- Quick actions for common administrative tasks

### User Management

- Searchable, filterable user directory
- Role assignment (user, admin, super-admin)
- User banning with reason and expiry
- Email verification status tracking
- Detailed user activity views

### Organization Management

- Complete organization listing with search and filters
- Subscription status monitoring
- Stripe integration visibility
- Organization deletion with safeguards
- Member relationship tracking

### Activity Logs

- Comprehensive audit trail of all system actions
- Filterable by user, action type, and date range
- Detailed activity views with metadata
- CSV export functionality for compliance

## Who Can Access the Admin Space?

Access to the Admin Space is restricted to users with `admin` or `super-admin` roles. These roles are managed through Better Auth's admin plugin.

### Role Hierarchy

- **user** (default) - Regular application user with organization access
- **admin** - Administrative user with full system access
- **super-admin** - Top-level administrator (alias for admin in most contexts)

## Architecture Overview

The Admin Space is built as an isolated route group separate from the main application:

```
/app/(admin)/admin/*     Admin routes (isolated)
/app/(app)/*              Regular app routes
/app/api/admin/*          Admin API endpoints
```

### Key Design Principles

1. **Isolation** - Admin routes operate independently from organization-scoped features
2. **Multi-layer Security** - Protection at middleware, context, action, and API levels
3. **Performance** - Cached statistics and optimized queries
4. **Audit Trail** - All admin actions are logged for compliance
5. **Type Safety** - Full TypeScript coverage with Zod validation

## Getting Started

### Prerequisites

- Application deployed with database migrations run
- Better Auth admin plugin configured
- At least one user with admin role assigned

### Quick Start

1. **Assign Admin Role**

First, you need to manually promote a user to admin in your database:

```sql
-- Using PostgreSQL
UPDATE "user" SET role = 'admin' WHERE email = 'your-admin@example.com';
```

2. **Access Admin Panel**

Navigate to `/admin` in your application. The middleware will verify your role and grant access.

3. **Explore the Dashboard**

The admin dashboard displays:

- System statistics (users, organizations, revenue)
- Growth trends and charts
- Recent activity
- Quick action shortcuts

### Navigation

The Admin Space includes a dedicated navigation sidebar with these sections:

- **Dashboard** (`/admin`) - Overview and metrics
- **Users** (`/admin/users`) - User management
- **Organizations** (`/admin/organizations`) - Organization oversight
- **Analytics** (`/admin/analytics`) - Subscription and revenue analytics
- **Activity Logs** (`/admin/activity`) - Audit trail and exports

## Common Use Cases

### Promote a User to Admin

Use the User Management page to update any user's role:

1. Navigate to `/admin/users`
2. Find the user using search or filters
3. Click "Update Role" action
4. Select `admin` or `super-admin` role
5. Confirm the change

All role changes are logged in the activity logs.

### Ban a Problematic User

When you need to restrict access for a user:

1. Go to `/admin/users`
2. Locate the user
3. Click "Ban User" action
4. Provide a reason (minimum 10 characters)
5. Optionally set an expiry date
6. Confirm the ban

Banned users cannot sign in until unbanned.

### Monitor Revenue

Track your subscription revenue:

1. Visit `/admin` for overall MRR in dashboard
2. Navigate to `/admin/analytics` for detailed metrics
3. View plan distribution charts
4. See subscription trends over time
5. Filter by date ranges

### Export Activity Logs

For compliance or auditing:

1. Go to `/admin/activity`
2. Apply desired filters (date range, user, action type)
3. Click "Export CSV" button
4. Download contains all filtered activities

## Technical Stack

The Admin Space leverages:

- **Better Auth Admin Plugin** - Built-in role management and user operations
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** - Reliable data storage with complex query support
- **shadcn/ui** - Consistent UI components with design system
- **TanStack Table** - Powerful data tables with sorting, filtering, pagination
- **Recharts** - Modern, accessible charts for analytics
- **Zod** - Runtime validation for all inputs

## Security Features

The Admin Space implements defense-in-depth security:

1. **Middleware Protection** - Route-level guards for `/admin/*` paths
2. **Server Context Validation** - `requireSuperAdminContext()` on all pages
3. **Action Authorization** - Role verification in server actions
4. **API Guards** - Additional checks on admin API routes
5. **Activity Logging** - Complete audit trail of all admin actions

Learn more in the [Security Documentation](./security.md).

## Performance Considerations

### Cached Statistics

Admin dashboard statistics are cached for 5 minutes to ensure fast page loads:

- Statistics calculated on-demand or via scheduled jobs
- Cached in Redis (if configured) or in-memory
- Manual refresh available via Quick Actions

### Optimized Queries

- Pagination for all large data sets
- Indexed database columns for search fields
- Efficient aggregation queries for analytics

## Next Steps

- **[Authentication & Authorization](./authentication.md)** - Learn how admin access control works
- **[Features Guide](./features.md)** - Detailed feature documentation
- **[API Reference](./api-reference.md)** - Admin API endpoints and server actions
- **[Security Architecture](./security.md)** - Multi-layer security details
- **[Development Guide](./development.md)** - Extend admin features

## Troubleshooting

### Cannot Access Admin Panel

If you get redirected to `/app` when accessing `/admin`:

1. Verify your user has `admin` or `super-admin` role in the database
2. Clear browser cookies and sign in again
3. Check server logs for middleware errors

### Statistics Not Showing

If the dashboard shows "No statistics available":

1. Statistics are calculated on first activity
2. Manually trigger refresh using Quick Actions
3. Check `admin_statistics` table exists in database
4. Verify cache configuration is working

### Slow Page Loads

If admin pages are slow:

1. Enable Redis cache for better performance
2. Check database indexes on user and organization tables
3. Reduce pagination limit in URL parameters
4. Monitor database query performance

---

**Last Updated:** 2025-10-06
**Status:** ✅ Complete
