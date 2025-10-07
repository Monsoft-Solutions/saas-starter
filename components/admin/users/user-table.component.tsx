'use client';

import { useState } from 'react';
import { AdminTableWrapper } from '@/components/admin/generic/admin-table-wrapper.component';
import { UserDetailsDialog } from './user-details-dialog.component';
import { UpdateRoleDialog } from './update-role-dialog.component';
import { BanUserDialog } from './ban-user-dialog.component';
import { userTableConfig } from './user-table.config';
import type {
  TableDataResponse,
  UserTableData,
  UserTableFilters,
} from '@/lib/types/table';

type UserTableProps = {
  initialData: TableDataResponse<UserTableData>;
  initialFilters: UserTableFilters;
};

/**
 * User table component with dialogs.
 * Wraps generic AdminTableWrapper with user-specific dialogs.
 */
export function UserTable({ initialData, initialFilters }: UserTableProps) {
  const [selectedUser, setSelectedUser] = useState<UserTableData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);

  // Enhance config with dialog handlers
  const configWithDialogs = {
    ...userTableConfig,
    actions: userTableConfig.actions?.map((action) => ({
      ...action,
      onClick: (row: UserTableData) => {
        setSelectedUser(row);
        if (action.id === 'view-details') setDetailsOpen(true);
        if (action.id === 'update-role') setRoleDialogOpen(true);
        if (action.id === 'ban-user') setBanDialogOpen(true);
      },
    })),
  };

  return (
    <>
      <AdminTableWrapper
        config={configWithDialogs}
        initialData={initialData}
        initialFilters={initialFilters}
      />

      {/* Dialogs */}
      {selectedUser && (
        <>
          <UserDetailsDialog
            user={{ ...selectedUser, banned: selectedUser.banned ?? false }}
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
          />
          <UpdateRoleDialog
            user={selectedUser}
            open={roleDialogOpen}
            onOpenChange={setRoleDialogOpen}
          />
          <BanUserDialog
            user={{ ...selectedUser, banned: selectedUser.banned ?? false }}
            open={banDialogOpen}
            onOpenChange={setBanDialogOpen}
          />
        </>
      )}
    </>
  );
}
