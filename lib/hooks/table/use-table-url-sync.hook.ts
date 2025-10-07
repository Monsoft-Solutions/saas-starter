import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Custom hook for synchronizing table filters with URL parameters.
 * Handles URL updates without page reload and proper scroll behavior.
 *
 * @template TFilters - The shape of filter state
 */
export function useTableUrlSync<TFilters extends Record<string, unknown>>() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Update URL with new filter values
   */
  const updateUrlParams = useCallback(
    (filters: Partial<TFilters>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          params.delete(key);
        } else if (typeof value === 'boolean') {
          params.set(key, value.toString());
        } else {
          params.set(key, String(value));
        }
      });

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  /**
   * Get current filter values from URL
   */
  const getFiltersFromUrl = useCallback(<T extends Partial<TFilters>>(): T => {
    const filters: Record<string, unknown> = {};

    searchParams.forEach((value, key) => {
      // Type conversion: try parsing as number, boolean, then string
      if (value === 'true') {
        filters[key] = true;
      } else if (value === 'false') {
        filters[key] = false;
      } else if (!isNaN(Number(value)) && value !== '') {
        filters[key] = Number(value);
      } else {
        filters[key] = value;
      }
    });

    return filters as T;
  }, [searchParams]);

  return { updateUrlParams, getFiltersFromUrl };
}
