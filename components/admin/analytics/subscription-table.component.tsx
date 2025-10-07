'use client';

import { AdminTableWrapper } from '@/components/admin/generic/admin-table-wrapper.component';
import { subscriptionTableConfig } from './subscription-table.config';
import type {
  TableDataResponse,
  SubscriptionTableData,
  SubscriptionTableFilters,
} from '@/lib/types/table';

type SubscriptionTableProps = {
  initialData: TableDataResponse<SubscriptionTableData>;
  initialFilters: SubscriptionTableFilters;
};

/**
 * Subscription table component.
 * Displays subscription data using the generic admin table system.
 */
export function SubscriptionTable({
  initialData,
  initialFilters,
}: SubscriptionTableProps) {
  // Enhance config with specific handlers
  const configWithHandlers = {
    ...subscriptionTableConfig,
    actions: subscriptionTableConfig.actions?.map((action) => {
      if (action.id === 'view-details') {
        return {
          ...action,
          onClick: (row: SubscriptionTableData) => {
            // TODO: Open subscription details dialog
            console.log('View subscription details:', row.id);
          },
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

      {/* TODO: Add subscription details dialog if needed */}
    </>
  );
}
