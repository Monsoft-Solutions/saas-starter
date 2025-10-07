/**
 * Type definitions for logActivity function parameters.
 * Ensures type safety and enforces usage of ActivityType enum.
 */

import type { ActivityType } from './activity-type.enum';

/**
 * Parameters for logging activity with optional metadata.
 * Forces the action to be a valid ActivityType enum value.
 */
export type LogActivityParams = {
  /** The activity type from the ActivityType enum */
  action: ActivityType;
  /** Optional metadata to attach to the activity log */
  metadata?: Record<string, unknown>;
};

/**
 * Union type for logActivity function parameters.
 * Supports both simple activity type logging and detailed logging with metadata.
 */
export type LogActivityInput = ActivityType | LogActivityParams;
