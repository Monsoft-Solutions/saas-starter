/**
 * User table data type.
 * Represents a single user row in the admin users table.
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
 * User table filters type.
 * Defines available filter options for the admin users table.
 */
export type UserTableFilters = {
  search?: string;
  role?: string;
  limit?: number;
  offset?: number;
};
