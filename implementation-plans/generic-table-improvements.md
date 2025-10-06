Generic Admin Table System - Improvements Implementation Plan

Date: October 5, 2025Priority: MediumEs stimated Time: 4-6 hours

Issues Identified

🔴 Critical Issues

1. Type Safety Issues
   - Multiple as unknown as type assertions in admin-table-wrapper.component.tsx:117,130
   - variant function type not supported in ActionDefinition (user-table-config.tsx:150)
   - Type casting in filters (organization-table-config.tsx:145,153,168)

2. Error Handling
   - No error UI/toast notifications (admin-table-wrapper.component.tsx:104)
   - Using console.log instead of proper handlers (user-table-config.tsx:133,141,153)
   - Using alert() and window.location.reload() (organization-table-config.tsx:219,216)

3. Missing React Keys
   - Fragment without key in actions dropdown (admin-table.component.tsx:110-115)

🟡 Performance Issues

4. Unnecessary Re-renders
   - useDebouncedCallback has stale closure issue (callback/delay in deps)
   - Missing memoization for expensive operations (column building, filter rendering)

5. Duplicate URL Parameter Logic
   - URL sync code duplicated in wrapper (lines 68-80, 84-90)
   - use-table-url-sync.hook.ts exists but not used

🟢 Code Quality Issues

6. Inconsistent Patterns
   - Action handlers defined inline vs. in config
   - Mixing concerns: delete action has API logic in config
   - Missing file naming convention: configs should be .config.tsx not .tsx

7. Accessibility
   - No aria-label on action buttons
   - Missing loading announcements for screen readers
   - No keyboard shortcuts for common actions

8. Documentation
   - Missing JSDoc on exported types
   - No usage examples in comments

Implementation Plan

Phase 1: Fix Critical Type Safety Issues (1-2 hours)

Files to modify:

- lib/types/table/action-definition.type.ts
- components/admin/generic/admin-table-wrapper.component.tsx
- components/admin/users/user-table-config.tsx
- components/admin/organizations/organization-table-config.tsx

Tasks:

1. Update ActionDefinition to support function-based variant
2. Remove all as unknown as casts by fixing filter types
3. Add proper type guards for filter value types
4. Fix FilterFieldType enum usage (remove as FilterFieldType casts)

Phase 2: Implement Error Handling & User Feedback (1-2 hours)

Files to create/modify:

- lib/utils/toast.util.ts (create toast helper)
- components/admin/generic/admin-table-wrapper.component.tsx
- components/admin/organizations/organization-table-config.tsx

Tasks:

1. Add sonner toast notifications for errors
2. Replace console.log with proper dialog handlers
3. Extract delete action to Server Action
4. Add optimistic updates instead of window.location.reload()
5. Add loading states for actions

Phase 3: Fix Performance Issues (1 hour)

Files to modify:

- lib/hooks/table/use-debounced-callback.hook.ts
- components/admin/generic/admin-table.component.tsx
- components/admin/generic/admin-table-filters.component.tsx
- components/admin/generic/admin-table-wrapper.component.tsx

Tasks:

1. Fix debounce hook closure issue using useRef
2. Use existing use-table-url-sync.hook.ts to DRY up URL logic
3. Memoize columns array using useMemo
4. Memoize filter renderers using useMemo

Phase 4: Code Quality & Accessibility (1 hour)

Files to modify:

- components/admin/generic/admin-table.component.tsx
- Rename config files to .config.tsx convention

Tasks:

1. Add React keys to fragments
2. Add aria-label attributes to interactive elements
3. Add screen reader announcements for loading/errors
4. Rename config files: user-table-config.tsx → user-table.config.tsx
5. Add JSDoc comments to all exported types

Detailed Changes

Change 1: Fix ActionDefinition Type

// lib/types/table/action-definition.type.ts
export type ActionDefinition<TData> = {
id: string;
label: string | ((row: TData) => string);
icon?: LucideIcon;
onClick: (row: TData) => void | Promise<void>; // Support async
separator?: boolean;
show?: (row: TData) => boolean;
variant?: 'default' | 'destructive' | 'success' | ((row: TData) => 'default' | 'destructive' |
'success'); // Support function
disabled?: (row: TData) => boolean;
};

Change 2: Fix Debounce Hook

// lib/hooks/table/use-debounced-callback.hook.ts
export function useDebouncedCallback<TArgs extends unknown[]>(
callback: (...args: TArgs) => void,
delay: number = 300
) {
const timeoutRef = useRef<NodeJS.Timeout | null>(null);
const callbackRef = useRef(callback); // Fix: Store callback in ref

    useEffect(() => {
      callbackRef.current = callback; // Update ref when callback changes
    }, [callback]);

    useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);

    const debouncedCallback = useCallback(
      (...args: TArgs) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          callbackRef.current(...args); // Use ref
        }, delay);
      },
      [delay] // Only delay in deps
    );

    return debouncedCallback;

}

Change 3: Use URL Sync Hook

// components/admin/generic/admin-table-wrapper.component.tsx
import { useTableUrlSync } from '@/lib/hooks/table/use-table-url-sync.hook';

export function AdminTableWrapper<TData, TFilters extends Record<string, unknown>>({
config,
initialData,
initialFilters,
}: AdminTableWrapperProps<TData, TFilters>) {
const { updateUrlParams } = useTableUrlSync<TFilters>();

    const updateFilters = useCallback(async (newFilters: Partial<TFilters>) => {
      const updatedFilters = { ...filters, ...newFilters };

      // Reset offset logic...

      setFilters(updatedFilters);
      updateUrlParams(updatedFilters); // Use hook instead of duplicate logic

      // Fetch data...
    }, [filters, updateUrlParams]);

}

Change 4: Add Error Toast

// components/admin/generic/admin-table-wrapper.component.tsx
import { toast } from 'sonner';

// In updateFilters catch block:
} catch (error) {
console.error(`Failed to fetch ${config.tableId}:`, error);
toast.error(`Failed to load ${config.tableId}`, {
description: error instanceof Error ? error.message : 'Please try again',
});
} finally {
setIsLoading(false);
}

Change 5: Fix Fragment Key

// components/admin/generic/admin-table.component.tsx
if (action.separator && index < config.actions!.length - 1) {
return (
<React.Fragment key={action.id}> {/_ Add key _/}
{menuItem}
<DropdownMenuSeparator />
</React.Fragment>
);
}

Success Criteria

- Zero TypeScript errors (pnpm type-check)
- No any or unknown type assertions
- Toast notifications for all error states
- No console.log in production code
- All interactive elements have aria-label
- Configs follow .config.tsx naming convention
- All exported types have JSDoc comments
- Debounce hook doesn't cause stale closures
- URL sync logic not duplicated

Files Summary

Modified: 8 filesCreated: 0 filesRenamed: 2 files

---

This plan addresses the most critical issues while maintaining the excellent foundation of the generic
table system. The improvements focus on type safety, error handling, performance, and code quality
without requiring major architectural changes.
