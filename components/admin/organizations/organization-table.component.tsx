'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { AdminTableWrapper } from '@/components/admin/generic/admin-table-wrapper.component';
import { OrganizationDetailsDialog } from './organization-details-dialog.component';
import { organizationTableConfig } from './organization-table.config';
import type {
  TableDataResponse,
  OrganizationTableData,
  OrganizationTableFilters,
} from '@/lib/types/table';
import { deleteOrganization } from '@/lib/actions/admin/delete-organization.action';

type OrganizationTableProps = {
  initialData: TableDataResponse<OrganizationTableData>;
  initialFilters: OrganizationTableFilters;
};

/**
 * Organization table component with dialogs.
 * Wraps generic AdminTableWrapper with organization-specific dialogs.
 */
export function OrganizationTable({
  initialData,
  initialFilters,
}: OrganizationTableProps) {
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    string | null
  >(null);
  const [, startTransition] = useTransition();

  /**
   * Handle organization deletion with proper error handling
   */
  const handleDelete = async (row: OrganizationTableData) => {
    if (
      !confirm(
        `Are you sure you want to delete "${row.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteOrganization(row.id);

      if (result.success) {
        toast.success('Organization deleted', {
          description: `"${row.name}" has been successfully deleted.`,
        });
      } else {
        toast.error('Failed to delete organization', {
          description: result.error || 'Please try again.',
        });
      }
    });
  };

  // Enhance config with dialog handlers
  const configWithDialogs = {
    ...organizationTableConfig,
    actions: organizationTableConfig.actions?.map((action) => {
      if (action.id === 'view-details') {
        return {
          ...action,
          onClick: (row: OrganizationTableData) => {
            setSelectedOrganizationId(row.id);
          },
        };
      }
      if (action.id === 'delete') {
        return {
          ...action,
          onClick: handleDelete,
        };
      }
      return action;
    }),
  };

  return (
    <>
      <AdminTableWrapper
        config={configWithDialogs}
        initialData={initialData}
        initialFilters={initialFilters}
      />

      {/* Organization Details Dialog */}
      {selectedOrganizationId && (
        <OrganizationDetailsDialog
          organizationId={selectedOrganizationId}
          open={!!selectedOrganizationId}
          onClose={() => setSelectedOrganizationId(null)}
        />
      )}
    </>
  );
}
