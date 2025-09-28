'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isDark, setIsDark] = React.useState(theme === 'dark');

  React.useEffect(() => {
    setIsDark(theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        isDark ? 'bg-primary' : 'bg-gray-300'
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
