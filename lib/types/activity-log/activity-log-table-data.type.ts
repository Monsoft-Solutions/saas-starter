/**
 * Activity log table data types.
 * Defines the structure of data displayed in the admin activity logs table.
 */

export type ActivityLogTableData = {
  id: number;
  userId: string;
  action: string;
  timestamp: Date;
  ipAddress: string | null;
  userEmail: string;
  userName: string | null;
  userImage: string | null;
};

export type ActivityLogTableFilters = {
  search?: string; // Search user email or action
  userId?: string;
  action?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  limit?: number;
  offset?: number;
};
