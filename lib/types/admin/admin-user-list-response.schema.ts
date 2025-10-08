import { z } from 'zod';
import { USER_ROLES } from './user-role.enum';

/**
 * User table data schema for admin user list responses.
 * Represents a single user row in the admin users table.
 */
export const userTableDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(USER_ROLES).nullable(),
  emailVerified: z.boolean(),
  banned: z.boolean().nullable(),
  banReason: z.string().nullable(),
  banExpires: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  image: z.string().nullable(),
});

/**
 * Admin user list response schema.
 * Returns paginated list of users with metadata.
 */
export const adminUserListResponseSchema = z.object({
  data: z.array(userTableDataSchema),
  total: z.number().int().min(0),
  limit: z.number().int().min(1).max(100),
  offset: z.number().int().min(0),
});

/**
 * Admin user list response type (inferred from schema).
 */
export type AdminUserListResponse = z.infer<typeof adminUserListResponseSchema>;

/**
 * User table data type (inferred from schema).
 */
export type UserTableData = z.infer<typeof userTableDataSchema>;
