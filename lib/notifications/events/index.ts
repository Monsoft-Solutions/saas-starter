/**
 * Notification event helper functions
 *
 * This module provides type-safe, reusable functions for creating notifications
 * across different categories. Each helper function handles:
 * - Event payload construction
 * - Job queue enqueuing via job dispatcher
 * - Idempotency key generation
 * - Metadata population
 *
 * Usage:
 * ```typescript
 * import { createPaymentFailedNotification } from '@/lib/notifications/events';
 *
 * await createPaymentFailedNotification(userId, amount, organizationId);
 * ```
 */

// Billing events
export {
  createPaymentFailedNotification,
  createPaymentSuccessNotification,
  createSubscriptionCreatedNotification,
  createSubscriptionCanceledNotification,
  createTrialEndingNotification,
} from './billing-events.helper';

// Team events
export {
  createTeamInvitationNotification,
  createInvitationAcceptedNotification,
  createMemberAddedNotification,
  createMemberRemovedNotification,
  createRoleChangedNotification,
} from './team-events.helper';

// Security events
export {
  createPasswordChangedNotification,
  createLoginNewDeviceNotification,
  createTwoFactorEnabledNotification,
} from './security-events.helper';

// System events
export {
  createSystemMaintenanceNotification,
  createSystemUpdateNotification,
} from './system-events.helper';

// Product events
export {
  createFeatureReleasedNotification,
  createProductAnnouncementNotification,
} from './product-events.helper';

// Activity events
export {
  createCommentMentionNotification,
  createTaskAssignedNotification,
} from './activity-events.helper';
