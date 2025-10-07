'use client';

import { formatDistanceToNow, format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Activity,
  Clock,
  Globe,
  User,
  Hash,
  AlertTriangle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Activity log data type for the dialog
 */
type ActivityLog = {
  id: number;
  userId: string;
  action: string;
  timestamp: Date;
  ipAddress: string | null;
  userEmail: string;
  userName: string | null;
  userImage: string | null;
  metadata?: Record<string, unknown> | null;
};

// Helper function to format action labels
function formatActionLabel(action: string): string {
  return action
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Helper function to get action badge variant
function getActionBadgeVariant(
  action: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (action.startsWith('admin.')) return 'destructive';
  if (action.includes('failed') || action.includes('error'))
    return 'destructive';
  if (action.includes('create') || action.includes('sign_up')) return 'default';
  if (action.includes('delete') || action.includes('remove'))
    return 'destructive';
  return 'secondary';
}

// Helper function to get action severity
function getActionSeverity(action: string): 'info' | 'warning' | 'danger' {
  if (action.startsWith('admin.')) return 'danger';
  if (
    action.includes('failed') ||
    action.includes('error') ||
    action.includes('ban')
  )
    return 'warning';
  return 'info';
}

/**
 * Activity details dialog component.
 * Displays comprehensive information about a single activity log entry.
 */
export function ActivityDetailsDialog({
  logId,
  onClose,
}: {
  logId: number;
  onClose: () => void;
}) {
  const [log, setLog] = useState<ActivityLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch activity log details
  useEffect(() => {
    const fetchLogDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/admin/activity/${logId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Activity log not found');
          }
          throw new Error(
            `Failed to load activity log: ${response.statusText}`
          );
        }

        const activityLog = await response.json();

        // Transform API response to component's ActivityLog type
        const log: ActivityLog = {
          id: activityLog.id,
          userId: activityLog.userId,
          action: activityLog.action,
          timestamp: new Date(activityLog.timestamp),
          ipAddress: activityLog.ipAddress,
          userEmail: activityLog.userEmail,
          userName: activityLog.userName,
          userImage: activityLog.userImage,
          metadata: activityLog.metadata,
        };

        setLog(log);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to load activity log details';
        setError(errorMessage);
        console.error('Error fetching activity log:', err);
      } finally {
        setLoading(false);
      }
    };

    if (logId) {
      fetchLogDetails();
    }
  }, [logId]);

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">
              Loading activity details...
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !log) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="text-destructive">
              {error || 'Activity log not found'}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const severity = getActionSeverity(log.action);

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this system activity
          </DialogDescription>
        </DialogHeader>

        <div className="stack-md">
          {/* Activity Information */}
          <div className="stack-sm">
            <h3 className="font-semibold">Activity Information</h3>
            <div className="grid gap-4 rounded-lg border bg-muted/30 p-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-muted-foreground">Action</div>
                <div className="col-span-2">
                  <Badge variant={getActionBadgeVariant(log.action)}>
                    {formatActionLabel(log.action)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-muted-foreground">Log ID</div>
                <div className="col-span-2 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{log.id}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-muted-foreground">Timestamp</div>
                <div className="col-span-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">
                      {format(new Date(log.timestamp), 'PPP p')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.timestamp), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {log.ipAddress && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-muted-foreground">
                    IP Address
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{log.ipAddress}</span>
                  </div>
                </div>
              )}

              {severity === 'warning' && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-amber-50 border border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-800">
                    This activity may require attention
                  </span>
                </div>
              )}

              {severity === 'danger' && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">
                    This is a sensitive administrative action
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* User Information */}
          <Separator />
          <div className="stack-sm">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              User Information
            </h3>
            <div className="grid gap-4 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={log.userImage ?? undefined} />
                  <AvatarFallback>
                    {log.userName
                      ? log.userName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                      : log.userEmail.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {log.userName || 'Unknown User'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {log.userEmail}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-muted-foreground">User ID</div>
                <div className="col-span-2">
                  <span className="font-mono text-sm">{log.userId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Section */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <>
              <Separator />
              <div className="stack-sm">
                <h3 className="font-semibold">Additional Metadata</h3>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="space-y-3">
                    {Object.entries(log.metadata).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-4">
                        <div className="text-sm text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="col-span-2">
                          {typeof value === 'object' && value !== null ? (
                            <pre className="text-xs bg-muted p-2 rounded font-mono overflow-x-auto">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          ) : (
                            <span className="text-sm font-mono">
                              {String(value)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
