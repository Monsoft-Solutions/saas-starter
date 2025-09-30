/**
 * Client-Side Logger Utility
 *
 * Provides a safe logging interface for client-side code that sends
 * error information to a server-side API endpoint for logging.
 *
 * This avoids importing Winston (Node.js library) in client bundles.
 */

/**
 * Log an error from the client side
 *
 * Sends error information to the server for logging via API endpoint.
 * Falls back to console.error if the API call fails.
 */
export async function logClientError(
  message: string,
  error?: Error & { digest?: string }
) {
  // Always log to console for immediate visibility
  console.error(message, error);

  // Send to server for persistent logging
  try {
    await fetch('/api/log-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    });
  } catch (fetchError) {
    // If logging to server fails, just use console
    console.error('Failed to send error to server:', fetchError);
  }
}
