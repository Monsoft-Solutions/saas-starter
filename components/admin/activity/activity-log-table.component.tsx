'use client';

import { useState } from 'react';
import { AdminTableWrapper } from '@/components/admin/generic/admin-table-wrapper.component';
import { activityLogTableConfig } from './activity-log-table.config';
import { ActivityDetailsDialog } from './activity-details-dialog.component';
import type { TableDataResponse } from '@/lib/types/table';
import type {
  ActivityLogTableData,
  ActivityLogTableFilters,
} from '@/lib/types/activity-log';

type ActivityLogTableProps = {
  initialData: TableDataResponse<ActivityLogTableData>;
  initialFilters: ActivityLogTableFilters;
};

/**
 * Activity log table component using the generic admin table system.
 * Displays activity logs with filtering, pagination, and detailed view capabilities.
 */
export function ActivityLogTable({
  initialData,
  initialFilters,
}: ActivityLogTableProps) {
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);

  // Enhance config with custom handlers
  const configWithHandlers = {
    ...activityLogTableConfig,
    actions: activityLogTableConfig.actions?.map((action) => {
      if (action.id === 'view-details') {
        return {
          ...action,
          onClick: (row: ActivityLogTableData) => setSelectedLogId(row.id),
        };
      }
      return action;
    }),
  };

  return (
    <>
      <AdminTableWrapper
        config={configWithHandlers}
        initialData={initialData}
        initialFilters={initialFilters}
      />

      {/* Activity Details Dialog */}
      {selectedLogId && (
        <ActivityDetailsDialog
          logId={selectedLogId}
          onClose={() => setSelectedLogId(null)}
        />
      )}
    </>
  );
}
