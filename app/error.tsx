'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { logClientError } from '@/lib/logger/client-logger.util';

/**
 * Error Boundary
 *
 * Catches errors in the app and logs them.
 * This is a Next.js error boundary that wraps the entire application.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error with full details (sends to server for Winston logging)
    logClientError('Application error caught', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h2 className="mb-4 text-2xl font-bold">Something went wrong!</h2>
        <p className="mb-6 text-muted-foreground">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
