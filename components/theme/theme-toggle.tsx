'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [isDark, setIsDark] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Mount component once to prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Track resolved theme changes (handles "system" theme correctly)
  React.useEffect(() => {
    setIsDark(resolvedTheme === 'dark');
  }, [resolvedTheme]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <button
        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-muted transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Toggle theme"
      >
        <span className="sr-only">Toggle theme</span>
        <span className="pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out translate-x-0" />
      </button>
    );
  }

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        isDark ? 'bg-primary' : 'bg-muted'
      )}
    >
      <span className="sr-only">Toggle theme</span>
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
          isDark ? 'translate-x-5' : 'translate-x-0'
        )}
      >
        <span
          className={cn(
            'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
            isDark
              ? 'opacity-0 duration-100 ease-out'
              : 'opacity-100 duration-200 ease-in'
          )}
        >
          <Sun className="h-3 w-3 text-gray-500" />
        </span>
        <span
          className={cn(
            'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
            isDark
              ? 'opacity-100 duration-200 ease-in'
              : 'opacity-0 duration-100 ease-out'
          )}
        >
          <Moon className="h-3 w-3 text-primary" />
        </span>
      </span>
    </button>
  );
}
