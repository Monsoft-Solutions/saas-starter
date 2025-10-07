'use client';

/**
 * Quick actions component for admin dashboard.
 * Provides shortcuts to common admin operations.
 */
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RefreshCw, FileText, ExternalLink } from 'lucide-react';
import { refreshStatsAction } from '@/app/actions/admin/refresh-stats.action';
import { toast } from 'sonner';
import { useAdminAccess } from '@/components/admin/shared/admin-access.provider';

type QuickActionsProps = {
  className?: string;
};

export function QuickActions({ className }: QuickActionsProps) {
  const [isRefreshing, startTransition] = useTransition();
  const { canManageAnalytics, canViewActivity } = useAdminAccess();

  const handleRefreshStats = () => {
    if (!canManageAnalytics) {
      toast.error('Permission denied', {
        description: 'You need analytics:write permission to refresh stats',
      });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      const result = await refreshStatsAction(formData);

      if (result.error) {
        toast.error('Failed to refresh statistics', {
          description: result.error,
        });
      } else {
        toast.success('Statistics refreshed successfully', {
          description: `Calculation took ${result.stats?.calculationDurationMs}ms`,
        });
        // Trigger page refresh to show updated stats
        window.location.reload();
      }
    });
  };

  const handleViewLogs = () => {
    window.location.href = '/admin/activity';
  };

  const handleViewStripe = () => {
    window.open('https://dashboard.stripe.com', '_blank');
  };

  return (
    <TooltipProvider>
      <div className={className}>
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  variant="outline"
                  onClick={handleRefreshStats}
                  disabled={isRefreshing || !canManageAnalytics}
                  className="justify-start w-full"
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                  {isRefreshing ? 'Refreshing...' : 'Refresh Stats'}
                </Button>
              </div>
            </TooltipTrigger>
            {!canManageAnalytics && (
              <TooltipContent>
                <p>Requires analytics:write permission</p>
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  variant="outline"
                  onClick={handleViewLogs}
                  disabled={!canViewActivity}
                  className="justify-start w-full"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Activity Logs
                </Button>
              </div>
            </TooltipTrigger>
            {!canViewActivity && (
              <TooltipContent>
                <p>Requires activity:read permission</p>
              </TooltipContent>
            )}
          </Tooltip>

          <Button
            variant="outline"
            onClick={handleViewStripe}
            className="justify-start"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Stripe Dashboard
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
