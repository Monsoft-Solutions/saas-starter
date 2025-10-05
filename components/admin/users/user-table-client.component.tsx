'use client';

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import {
  MoreHorizontal,
  Shield,
  Ban,
  Eye,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { UserDetailsDialog } from './user-details-dialog.component';
import { UpdateRoleDialog } from './update-role-dialog.component';
import { BanUserDialog } from './ban-user-dialog.component';

/**
 * User data type for the table
 */
export type UserTableData = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  emailVerified: boolean;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
};

/**
 * Client-side user table component.
 * Displays users with sorting, actions, and dialogs for management.
 */
export function UserTableClient({ users }: { users: UserTableData[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedUser, setSelectedUser] = useState<UserTableData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);

  // Define columns
  const columns: ColumnDef<UserTableData>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="font-medium">{row.original.name}</div>
          {row.original.banned && (
            <Badge variant="destructive" className="text-xs">
              Banned
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.email}
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.original.role || 'user';
        const variant =
          role === 'super-admin'
            ? 'default'
            : role === 'admin'
              ? 'secondary'
              : 'outline';

        return (
          <Badge variant={variant} className="capitalize">
            {role === 'super-admin' && <Shield className="mr-1 h-3 w-3" />}
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'emailVerified',
      header: 'Verified',
      cell: ({ row }) =>
        row.original.emailVerified ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground" />
        ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(row.original.createdAt), {
            addSuffix: true,
          })}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user);
                  setDetailsOpen(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user);
                  setRoleDialogOpen(true);
                }}
              >
                <Shield className="mr-2 h-4 w-4" />
                Update Role
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user);
                  setBanDialogOpen(true);
                }}
                className={user.banned ? 'text-green-600' : 'text-destructive'}
              >
                <Ban className="mr-2 h-4 w-4" />
                {user.banned ? 'Unban User' : 'Ban User'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      {selectedUser && (
        <>
          <UserDetailsDialog
            user={{
              ...selectedUser,
              banned: selectedUser.banned ?? false,
            }}
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
          />
          <UpdateRoleDialog
            user={selectedUser}
            open={roleDialogOpen}
            onOpenChange={setRoleDialogOpen}
          />
          <BanUserDialog
            user={{
              ...selectedUser,
              banned: selectedUser.banned ?? false,
            }}
            open={banDialogOpen}
            onOpenChange={setBanDialogOpen}
          />
        </>
      )}
    </>
  );
}
