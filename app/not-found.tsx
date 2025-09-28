import Link from 'next/link';
import { CircleIcon } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-background text-foreground">
      <div className="max-w-md space-y-8 p-4 text-center">
        <div className="flex justify-center">
          <CircleIcon className="size-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Page Not Found
        </h1>
        <p className="text-base text-muted-foreground">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <Link
          href="/"
          className="max-w-48 mx-auto flex justify-center py-2 px-4 border border-border rounded-full shadow-sm text-sm font-medium text-muted-foreground bg-card hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
