---
title: Admin Space Features
description: Comprehensive guide to all Admin Space features including dashboard, user management, organization oversight, analytics, and activity logs
---

# Admin Space Features

The Admin Space provides a comprehensive set of features for managing your SaaS application. This guide covers each feature in detail with practical examples.

## Dashboard

The admin dashboard (`/admin`) provides a comprehensive overview of your system's health and key metrics.

### System Statistics

Real-time metrics displayed as metric cards:

```typescript
// Displayed metrics
{
  totalUsers: number,              // All registered users
  totalOrganizations: number,      // All organizations
  totalActiveSubscriptions: number, // Active Stripe subscriptions
  totalMRR: number,                // Monthly Recurring Revenue
  activeUsersLast30Days: number,   // Active users in last 30 days
  newUsersLast30Days: number,      // New user registrations
  trialOrganizations: number,      // Organizations without subscriptions
}
```

**Metric Cards Display:**

- Total Users (with growth rate percentage)
- Total Organizations
- Active Subscriptions
- Monthly Revenue (with growth rate)
- Active Users (30-day window)
- New Users (30-day window)
- Trial Organizations

### Growth Charts

**User Growth Chart:**

- Visualizes user growth over time
- Shows new users vs total users
- 30-day trend analysis

**Revenue Chart:**

- Monthly Recurring Revenue trends
- Subscription count trends
- Growth rate calculations

### Quick Actions

Convenient shortcuts for common tasks:

- **Refresh Statistics** - Recalculate and update all metrics
- **View Recent Activity** - Jump to activity logs
- **Manage Users** - Quick access to user management
- **Analytics Dashboard** - Navigate to detailed analytics

### Recent Activity

Live feed of the most recent system activity:

- Last 10 activities across all users
- User names and actions
- Timestamps
- Quick link to full activity logs

### Performance

Dashboard uses cached statistics for optimal performance:

```typescript
// Statistics cached for 5 minutes
const stats = await getAdminStatistics();
// Returns cached value if available, or calculates fresh
```

To refresh manually:

1. Click "Refresh Statistics" in Quick Actions
2. Wait for calculation to complete (~500ms typical)
3. Dashboard updates with fresh data

## User Management

Access at `/admin/users` - comprehensive user administration interface.

### User Table

Searchable, filterable table displaying all users:

**Columns:**

- **Name** - User's full name
- **Email** - Email address with verification badge
- **Role** - Current role (user, admin, super-admin)
- **Status** - Active, banned, or email not verified
- **Created** - Registration date
- **Actions** - Management operations

### Search & Filters

**Search:**

```
Search by name or email
Example: "john@example.com" or "John Smith"
```

**Role Filter:**

- All Roles
- User
- Admin
- Super Admin

**Pagination:**

- Configurable items per page (10, 25, 50, 100)
- Page navigation controls
- Total count display

### User Actions

#### View User Details

Click on any user row to see detailed information:

```typescript
{
  id: string,
  name: string,
  email: string,
  emailVerified: boolean,
  role: 'user' | 'admin' | 'super-admin',
  banned: boolean,
  banReason: string | null,
  banExpires: Date | null,
  createdAt: Date,
  organizations: Array<{
    id: string,
    name: string,
    role: 'owner' | 'member',
  }>,
}
```

**Details Include:**

- Account information
- Organization memberships
- Activity history
- Ban status (if applicable)

#### Update User Role

Change a user's role:

1. Click "Update Role" action
2. Select new role from dropdown:
   - `user` - Regular access
   - `admin` - Admin panel access
   - `super-admin` - Full admin access
3. Confirm the change
4. Activity is logged automatically

**Implementation:**

```typescript
// Server action
await updateUserRoleAction({
  userId: 'user-id',
  role: 'admin',
});

// Uses Better Auth
await auth.api.setRole({
  userId: 'user-id',
  role: 'admin',
});
```

#### Ban User

Restrict user access with optional expiry:

1. Click "Ban User" action
2. Enter ban reason (minimum 10 characters)
3. Optionally set expiry date
4. Confirm the ban

**Ban Effects:**

- User cannot sign in
- Active sessions are invalidated
- Ban reason shown on login attempt
- Automatically unbanned after expiry (if set)

**Unban User:**

- Click "Unban" action on banned user
- Immediate restoration of access

**Implementation:**

```typescript
// Ban user
await banUserAction({
  userId: 'user-id',
  reason: 'Violation of terms of service',
  expiresInDays: 7, // Optional
});

// Uses Better Auth
await auth.api.banUser({
  userId: 'user-id',
  reason: 'Violation of terms of service',
  expiresIn: 86400 * 7, // 7 days in seconds
});
```

#### Delete User

::: danger Warning
User deletion is permanent and cannot be undone.
:::

Currently not implemented in UI for safety. Can be done via database or custom script if needed.

### User List API

The user management table is powered by an API endpoint:

**Endpoint:** `GET /api/admin/users`

**Query Parameters:**

```typescript
{
  search?: string,    // Search term
  role?: string,      // Filter by role
  limit?: number,     // Items per page (default: 50)
  offset?: number,    // Pagination offset (default: 0)
}
```

**Response:**

```typescript
{
  users: User[],
  total: number,
  limit: number,
  offset: number,
}
```

## Organization Management

Access at `/admin/organizations` - oversight of all organizations and subscriptions.

### Organization Table

Displays all organizations with subscription status:

**Columns:**

- **Name** - Organization name
- **Owner** - Organization owner email
- **Plan** - Subscription plan (Free, Basic, Pro, Enterprise)
- **Status** - Subscription status (active, trialing, canceled, etc.)
- **MRR** - Monthly Recurring Revenue contribution
- **Members** - Member count
- **Created** - Creation date
- **Actions** - Management operations

### Search & Filters

**Search:**

```
Search by organization name or owner email
Example: "Acme Corp" or "owner@example.com"
```

**Plan Filter:**

- All Plans
- Free (no subscription)
- Basic ($10/month)
- Pro ($25/month)
- Enterprise ($100/month)

**Status Filter:**

- All Statuses
- Active
- Trialing
- Canceled
- Past Due
- Incomplete

### Organization Actions

#### View Organization Details

Click on any organization to see:

```typescript
{
  id: string,
  name: string,
  stripeCustomerId: string | null,
  stripeSubscriptionId: string | null,
  planName: string | null,
  subscriptionStatus: string | null,
  createdAt: Date,
  members: Array<{
    userId: string,
    userName: string,
    userEmail: string,
    role: 'owner' | 'member',
    joinedAt: Date,
  }>,
}
```

**Details Include:**

- Stripe customer and subscription IDs
- Full member list with roles
- Subscription history
- Billing status

#### Delete Organization

::: danger Warning
Organization deletion is permanent and cascades to:

- All memberships
- All associated data
- Activity logs reference (nullified)
  :::

To delete an organization:

1. Click "Delete" action
2. Confirm deletion in dialog
3. Organization and related data removed
4. Activity logged

**Implementation:**

```typescript
await deleteOrganizationAction({
  organizationId: 'org-id',
});

// Cascades deletion to:
// - member records
// - organization-specific data
```

**Safety Checks:**

- Cannot delete organizations with active subscriptions (must cancel first)
- Confirmation dialog required
- Activity logging for audit trail

### Organization List API

**Endpoint:** `GET /api/admin/organizations`

**Query Parameters:**

```typescript
{
  search?: string,       // Search term
  planName?: string,     // Filter by plan
  status?: string,       // Filter by subscription status
  limit?: number,        // Items per page (default: 50)
  offset?: number,       // Pagination offset (default: 0)
}
```

**Response:**

```typescript
{
  organizations: Organization[],
  total: number,
  limit: number,
  offset: number,
}
```

## Analytics

Access at `/admin/analytics` - detailed subscription and revenue analytics.

### Revenue Metrics

Top-level revenue overview:

**Metric Cards:**

- **Total MRR** - Monthly Recurring Revenue
- **Active Subscriptions** - Count of active subscriptions
- **Average Revenue Per User (ARPU)** - MRR / Active Subscriptions
- **Lifetime Value (LTV)** - Estimated customer lifetime value

### Plan Distribution

Pie chart showing subscription distribution:

```typescript
{
  Free: number,       // Organizations without subscriptions
  Basic: number,      // $10/month subscribers
  Pro: number,        // $25/month subscribers
  Enterprise: number, // $100/month subscribers
}
```

**Insights:**

- Which plans are most popular
- Upgrade/downgrade trends
- Revenue distribution by plan

### Revenue Trend

Line chart showing revenue over time:

- MRR growth month-over-month
- Subscription count trends
- Growth rate calculations
- 12-month historical view

### Subscription Table

Detailed table of all active subscriptions:

**Columns:**

- Organization Name
- Plan Name
- Status
- MRR Contribution
- Start Date
- Current Period End
- Actions

**Filters:**

- By plan
- By status
- Date range

### Analytics API

**Endpoint:** `GET /api/admin/analytics/subscriptions`

**Response:**

```typescript
{
  totalMRR: number,
  activeSubscriptions: number,
  arpu: number,
  planDistribution: {
    [planName: string]: number,
  },
  revenueTrend: Array<{
    date: string,
    mrr: number,
    subscriptionCount: number,
  }>,
}
```

## Activity Logs

Access at `/admin/activity` - comprehensive audit trail of all system actions.

### Activity Table

Chronological log of all activities:

**Columns:**

- **Timestamp** - When the action occurred
- **User** - Who performed the action
- **Action** - What was done (e.g., `user.role.updated`)
- **Details** - Action-specific metadata
- **Actions** - View details

### Search & Filters

**Search:**

```
Search by user name, email, or action type
Example: "user.role" or "john@example.com"
```

**Action Type Filter:**

- All Actions
- User Actions (role updates, bans, etc.)
- Organization Actions (creation, deletion)
- Admin Actions (statistics refresh)

**Date Range Filter:**

- Last 24 hours
- Last 7 days
- Last 30 days
- Custom range

**User Filter:**

- All Users
- Specific user (dropdown)

### Activity Details

Click "View Details" to see full activity information:

```typescript
{
  id: number,
  userId: string,
  action: string,
  timestamp: Date,
  ipAddress: string | null,
  userAgent: string | null,
  metadata: {
    [key: string]: any, // Action-specific data
  },
}
```

**Metadata Examples:**

```typescript
// Role update
{
  targetUserId: 'user-id',
  previousRole: 'user',
  newRole: 'admin',
}

// User ban
{
  targetUserId: 'user-id',
  reason: 'Violation of terms',
  expiresAt: '2025-10-13T00:00:00Z',
}

// Organization deletion
{
  organizationId: 'org-id',
  organizationName: 'Acme Corp',
  memberCount: 5,
}
```

### Export Activity Logs

Export activity logs to CSV for compliance or analysis:

1. Apply desired filters
2. Click "Export CSV" button
3. File downloads with all filtered activities

**CSV Format:**

```csv
Timestamp,User ID,User Email,Action,IP Address,Metadata
2025-10-06 10:30:00,user-123,admin@example.com,user.role.updated,192.168.1.1,"{"targetUserId":"user-456","newRole":"admin"}"
```

**Implementation:**

```typescript
// Export endpoint
GET /api/admin/activity/export?filters=...

// Streams CSV response
export async function GET(request: NextRequest) {
  const activities = await getFilteredActivities(filters);
  const csv = generateCSV(activities);

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=activity-logs.csv',
    },
  });
}
```

### Activity List API

**Endpoint:** `GET /api/admin/activity`

**Query Parameters:**

```typescript
{
  search?: string,
  action?: string,      // Filter by action type
  userId?: string,      // Filter by user
  startDate?: string,   // ISO date string
  endDate?: string,     // ISO date string
  limit?: number,       // Items per page (default: 50)
  offset?: number,      // Pagination offset (default: 0)
}
```

**Response:**

```typescript
{
  activities: Activity[],
  total: number,
  limit: number,
  offset: number,
}
```

## Admin Statistics Refresh

Statistics can be refreshed manually or automatically:

### Manual Refresh

From the Dashboard Quick Actions:

1. Click "Refresh Statistics"
2. System recalculates all metrics from database
3. New statistics cached for 5 minutes
4. Dashboard updates automatically

**API Endpoint:**

```typescript
POST /api/admin/stats/refresh

// Response
{
  success: true,
  statistics: AdminStatistics,
  calculationDuration: number, // milliseconds
}
```

### Automatic Refresh

Set up a cron job or scheduled task to refresh regularly:

```typescript
// Example: Refresh statistics every hour
import { refreshAdminStatistics } from '@/lib/db/queries/admin-statistics.query';

export async function refreshStatisticsCron() {
  await refreshAdminStatistics();
  console.log('Statistics refreshed successfully');
}
```

### Statistics Calculation

The system calculates:

```typescript
{
  // User metrics
  totalUsers: count(user),
  activeUsersLast30Days: count(distinct activityLogs.userId where timestamp >= 30d ago),
  newUsersLast30Days: count(user where createdAt >= 30d ago),

  // Organization metrics
  totalOrganizations: count(organization),
  organizationsWithSubscriptions: count(organization where stripeSubscriptionId IS NOT NULL),
  trialOrganizations: count(organization where stripeSubscriptionId IS NULL),

  // Revenue metrics (based on plan prices)
  totalMRR: sum(planPrice where subscriptionStatus = 'active'),
  totalActiveSubscriptions: count(organization where subscriptionStatus = 'active'),

  // Growth rates (comparing to previous 30-day period)
  userGrowthRate: ((newUsersLast30Days - newUsersPrevious30Days) / newUsersPrevious30Days) * 100,
  revenueGrowthRate: calculated from historical data,
  churnRate: calculated from subscription cancellations,
}
```

**Performance:**

- Typical calculation: 200-500ms
- Cached for 5 minutes
- Historical data stored in `admin_statistics` table

## Common Workflows

### Promote User to Admin

1. Navigate to `/admin/users`
2. Search for user by email
3. Click "Update Role" action
4. Select `admin` role
5. Confirm change
6. User can now access admin panel

### Monitor Revenue

1. Go to `/admin` dashboard
2. View MRR metric card
3. Navigate to `/admin/analytics` for details
4. Review plan distribution
5. Check revenue trend chart
6. Export subscription data if needed

### Investigate User Activity

1. Go to `/admin/activity`
2. Filter by user email
3. Review chronological actions
4. Click "View Details" for specific actions
5. Export filtered logs for records

### Handle Problematic User

1. Navigate to `/admin/users`
2. Search for user
3. View user details
4. Click "Ban User"
5. Enter reason and optional expiry
6. Confirm ban
7. Activity automatically logged

### Clean Up Trial Organizations

1. Go to `/admin/organizations`
2. Filter by "Free" plan or no subscription
3. Review organization details
4. Contact organizations to convert
5. Delete inactive organizations if needed

## Keyboard Shortcuts

::: tip Pro Tip
Use keyboard shortcuts for faster navigation
:::

| Shortcut     | Action              |
| ------------ | ------------------- |
| `g` then `d` | Go to Dashboard     |
| `g` then `u` | Go to Users         |
| `g` then `o` | Go to Organizations |
| `g` then `a` | Go to Analytics     |
| `g` then `l` | Go to Activity Logs |
| `/`          | Focus search input  |
| `Esc`        | Close modal/dialog  |

## Related Documentation

- [Overview](./overview.md) - Admin Space introduction
- [Authentication](./authentication.md) - Access control details
- [API Reference](./api-reference.md) - Complete API documentation
- [Development Guide](./development.md) - Extending admin features

---

**Last Updated:** 2025-10-06
**Status:** ✅ Complete
