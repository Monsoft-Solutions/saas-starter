import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';
import { listAllActivityLogs } from '@/lib/db/queries/admin-activity-log.query';
import { ActivityLogTable } from '@/components/admin/activity/activity-log-table.component';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

/**
 * Admin activity logs page.
 * Displays searchable, filterable table of system activity logs with export capabilities.
 */
export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: string;
    offset?: string;
  }>;
}) {
  await requireSuperAdminContext();

  const params = await searchParams;

  // Parse search parameters
  const filters = {
    search: params.search,
    action: params.action,
    startDate: params.startDate,
    endDate: params.endDate,
    limit: parseInt(params.limit ?? '100', 10),
    offset: parseInt(params.offset ?? '0', 10),
  };

  // Fetch activity logs data (convert string dates to Date objects for query)
  const queryFilters = {
    ...filters,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate) : undefined,
  };
  const activityLogsData = await listAllActivityLogs(queryFilters);

  // Convert to the format expected by the generic table (TableDataResponse)
  const tableData = activityLogsData.logs.map((log) => ({
    id: log.id,
    userId: log.userId,
    action: log.action,
    timestamp: log.timestamp,
    ipAddress: log.ipAddress,
    userEmail: log.userEmail,
    userName: log.userName,
    userImage: log.userImage,
  }));

  const initialData = {
    data: tableData,
    total: activityLogsData.total,
    limit: filters.limit,
    offset: filters.offset,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            System Activity Logs
          </h1>
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

      <ActivityLogTable initialData={initialData} initialFilters={filters} />
    </div>
  );
}
