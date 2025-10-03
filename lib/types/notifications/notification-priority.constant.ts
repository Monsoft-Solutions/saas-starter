/**
 * Single source of truth for notification priorities.
 * Used for: TypeScript types, Zod schemas, and pgEnum definitions.
 */
export const NOTIFICATION_PRIORITIES = [
  'critical',
  'important',
  'info',
] as const;

/**
 * TypeScript type derived from the constant array.
 * - critical: Red - requires immediate action
 * - important: Yellow - should be addressed soon
 * - info: Blue - informational only
 */
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];
