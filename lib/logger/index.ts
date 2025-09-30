/**
 * Logger Module Exports
 *
 * Centralized exports for the Winston logging system.
 * Import from this file for consistent logging across the application.
 */

export {
  default as logger,
  morganStream,
  logInfo,
  logError,
  logWarn,
  logDebug,
  logHttp,
} from './logger.service';

// Export logger types for type safety
export type {
  ErrorPayload,
  LogMetadata,
  ErrorInput,
  LoggerMethods,
} from './logger.types';

// Re-export winston types for convenience
export type { LeveledLogMethod, LogEntry } from 'winston';
