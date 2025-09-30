/**
 * Instrumentation
 *
 * This file runs once when the Next.js server starts.
 * Use it to initialize global error handlers and other setup tasks.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on the server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeErrorHandlers } = await import(
      './lib/logger/error-handler.util'
    );

    // Initialize global error handlers for uncaught exceptions and unhandled rejections
    initializeErrorHandlers();
  }
}
