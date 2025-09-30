'use client';

import { useEffect } from 'react';
import { logClientError } from '@/lib/logger/client-logger.util';

/**
 * Global Error Boundary
 *
 * Catches errors in the root layout and logs them.
 * This is a special Next.js file that handles errors at the global level.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error with full details (sends to server for Winston logging)
    logClientError('Global error caught', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="max-w-md text-center">
            <h2 className="mb-4 text-2xl font-bold">Something went wrong!</h2>
            <p className="mb-6 text-muted-foreground">
              An unexpected error occurred. Our team has been notified.
            </p>
            <button
              onClick={reset}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
