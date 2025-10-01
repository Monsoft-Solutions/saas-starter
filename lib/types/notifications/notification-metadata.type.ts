/**
 * Notification metadata type.
 * Contains optional contextual information and action data.
 */
export type NotificationMetadata = {
  /** URL to navigate to when notification is clicked */
  actionUrl?: string;
  /** Label for the action button */
  actionLabel?: string;
  /** ID of the user who triggered the notification */
  actorId?: string;
  /** Name of the user who triggered the notification */
  actorName?: string;
  /** ID of the related entity (e.g., invoice ID, team ID) */
  entityId?: string;
  /** Type of the related entity (e.g., 'invoice', 'team', 'project') */
  entityType?: string;
  /** URL to an associated image or avatar */
  imageUrl?: string;
  /** Additional dynamic metadata fields */
  [key: string]: unknown;
};
