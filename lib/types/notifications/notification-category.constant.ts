/**
 * Single source of truth for notification categories.
 * Used for: TypeScript types, Zod schemas, and pgEnum definitions.
 */
export const NOTIFICATION_CATEGORIES = [
  'system',
  'security',
  'billing',
  'team',
  'activity',
  'product',
] as const;

/**
 * TypeScript type derived from the constant array.
 * - system: System-level notifications (maintenance, updates)
 * - security: Security-related notifications (password changes, login alerts)
 * - billing: Payment and subscription notifications
 * - team: Team collaboration notifications (invitations, member changes)
 * - activity: User activity notifications (mentions, assignments)
 * - product: Product updates and announcements
 */
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];
