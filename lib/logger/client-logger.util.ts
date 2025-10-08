/**
 * Client-Side Logger Utility
 *
 * Provides a safe logging interface for client-side code that sends
 * error information to a server-side API endpoint for logging.
 *
 * This avoids importing Winston (Node.js library) in client bundles.
 */

import { apiRequest } from '@/lib/api/client.util';
import { apiRoutes } from '@/lib/api/routes.config';
import type { ClientErrorPayload } from '@/lib/types/logger/client-error-payload.schema';

/**
 * Log an error from the client side
 *
 * Sends error information to the server for logging via type-safe API endpoint.
 * Falls back to console.error if the API call fails.
 *
 * @param message - Error message to log
 * @param error - Optional error object with details
 */
export async function logClientError(
  message: string,
  error?: Error & { digest?: string }
) {
  // Always log to console for immediate visibility
  console.error(message, error);

  // Send to server for persistent logging
  try {
    const payload: ClientErrorPayload = {
      message,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            digest: error.digest,
            name: error.name,
          }
        : undefined,
      timestamp: new Date().toISOString(),
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    // Use type-safe API client with route definition
    await apiRequest(apiRoutes.logger.logError, {
      data: payload,
    });
  } catch (apiError) {
    // If logging to server fails, just use console
    console.error('Failed to send error to server:', apiError);
  }
}
