'use client';

/**
 * Quick actions component for admin dashboard.
 * Provides shortcuts to common admin operations.
 */
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileText, ExternalLink } from 'lucide-react';
import { refreshStatsAction } from '@/app/actions/admin/refresh-stats.action';
import { toast } from 'sonner';

type QuickActionsProps = {
  className?: string;
};

export function QuickActions({ className }: QuickActionsProps) {
  const [isRefreshing, startTransition] = useTransition();

  const handleRefreshStats = () => {
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
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Button
          variant="outline"
          onClick={handleRefreshStats}
          disabled={isRefreshing}
          className="justify-start"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          {isRefreshing ? 'Refreshing...' : 'Refresh Stats'}
        </Button>

        <Button
          variant="outline"
          onClick={handleViewLogs}
          className="justify-start"
        >
          <FileText className="mr-2 h-4 w-4" />
          View Activity Logs
        </Button>

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
  );
}
