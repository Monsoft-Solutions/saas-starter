import { logError, logInfo } from './logger.service';
import type { LogMetadata } from './logger.types';

/**
 * Error Handler Utility
 *
 * Provides utilities for handling and logging errors throughout the application.
 */

/**
 * Initialize global error handlers
 *
 * Sets up handlers for uncaught exceptions and unhandled promise rejections.
 * Should be called once at application startup.
 */
export function initializeErrorHandlers() {
  // Handle uncaught exceptions
  if (typeof process !== 'undefined') {
    process.on('uncaughtException', (error: Error) => {
      logError('Uncaught Exception', error);

      // In production, you might want to exit the process
      // or perform cleanup operations here
      if (process.env.NODE_ENV === 'production') {
        console.error('Uncaught Exception - Process will exit');
        process.exit(1);
      }
    });

    // Handle unhandled promise rejections
    process.on(
      'unhandledRejection',
      (reason: unknown, promise: Promise<unknown>) => {
        const meta: LogMetadata = {
          promise: String(promise),
        };

        logError('Unhandled Promise Rejection', reason, meta);

        // In production, you might want to exit the process
        if (process.env.NODE_ENV === 'production') {
          console.error('Unhandled Rejection - Process will exit');
          process.exit(1);
        }
      }
    );

    // Log that error handlers have been initialized
    logInfo('Global error handlers initialized');
  }
}

/**
 * Async error handler wrapper
 *
 * Wraps an async function to catch and log any errors.
 * Useful for wrapping API routes, server actions, etc.
 */
export function withErrorHandling<
  T extends (...args: unknown[]) => Promise<unknown>,
>(fn: T, context?: string): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorMessage = context
        ? `Error in ${context}`
        : 'Error in async function';

      const meta: LogMetadata = {
        args: args.length > 0 ? JSON.stringify(args) : undefined,
      };

      logError(errorMessage, error, meta);

      throw error;
    }
  }) as T;
}

/**
 * Safe async function executor
 *
 * Executes an async function and catches any errors, logging them.
 * Returns undefined if an error occurs.
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    const errorMessage = context
      ? `Error in ${context}`
      : 'Error in async function';

    logError(errorMessage, error);

    return undefined;
  }
}
