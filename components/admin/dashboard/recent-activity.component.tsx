/**
 * Recent activity component for admin dashboard.
 * Displays the latest system activity logs.
 */
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Activity } from 'lucide-react';
import { listAllActivityLogs } from '@/lib/db/queries/admin-activity-log.query';

/**
 * Recent activity server component.
 * Fetches and displays recent activity logs.
 */
export async function RecentActivity() {
  const { logs } = await listAllActivityLogs({ limit: 5 });

  if (logs.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
        <p className="text-sm text-muted-foreground">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
        <Link
          href="/admin/activity"
          className="text-sm text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-start justify-between gap-3 pb-3 border-b last:border-0 last:pb-0"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  {log.userName || log.userEmail}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {log.action}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(log.timestamp), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
