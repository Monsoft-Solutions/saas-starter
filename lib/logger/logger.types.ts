/**
 * Logger Type Definitions
 *
 * Provides type-safe types for the Winston logging system.
 * Eliminates `any` types and ensures consistent error payloads.
 */

/**
 * Standardized error payload structure for consistent logging
 */
export type ErrorPayload = {
  /** Error message */
  message: string;
  /** Error name (if available) */
  name?: string;
  /** Error stack trace (if available) */
  stack?: string;
  /** Additional error details as key-value pairs */
  details?: Record<string, unknown>;
};

/**
 * Metadata type for logging - allows any serializable data
 */
export type LogMetadata = Record<string, unknown>;

/**
 * Error input type - can be Error instance, plain object, or unknown value
 */
export type ErrorInput = Error | Record<string, unknown> | unknown;

/**
 * Logger method signatures with proper typing
 */
export type LoggerMethods = {
  logInfo: (message: string, meta?: LogMetadata) => void;
  logError: (message: string, error?: ErrorInput, meta?: LogMetadata) => void;
  logWarn: (message: string, meta?: LogMetadata) => void;
  logDebug: (message: string, meta?: LogMetadata) => void;
  logHttp: (message: string, meta?: LogMetadata) => void;
};

/**
 * Type guard to check if a value is an Error instance
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard to check if a value is a plain object (not null, not array, not primitive)
 */
export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !isError(value)
  );
}
