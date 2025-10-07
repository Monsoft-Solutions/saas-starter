import { useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for debouncing callbacks with proper cleanup.
 * Prevents memory leaks by clearing timeout on unmount or dependency change.
 * Uses ref to avoid stale closures.
 *
 * @template TArgs - Argument types for the callback
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns Debounced callback function
 */
export function useDebouncedCallback<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delay: number = 300
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    (...args: TArgs) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  return debouncedCallback;
}
