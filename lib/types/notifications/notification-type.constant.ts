/**
 * Single source of truth for notification types.
 * When you change a value here, TypeScript will error everywhere it's used.
 * Used for: TypeScript types, Zod schemas, and pgEnum definitions.
 */
export const NOTIFICATION_TYPES = [
  'system.maintenance',
  'system.update',
  'security.password_changed',
  'security.login_new_device',
  'security.two_factor_enabled',
  'billing.payment_success',
  'billing.payment_failed',
  'billing.subscription_created',
  'billing.subscription_canceled',
  'billing.trial_ending',
  'team.invitation_received',
  'team.invitation_accepted',
  'team.member_added',
  'team.member_removed',
  'team.role_changed',
  'activity.comment_mention',
  'activity.task_assigned',
  'product.feature_released',
  'product.announcement',
] as const;

/**
 * TypeScript type derived from the constant array.
 * Notification types follow the pattern: {category}.{specific_event}
 */
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
