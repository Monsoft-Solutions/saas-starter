'use client';

import { createContext, useContext } from 'react';
import type { AdminAccessContext } from '@/lib/types/admin/admin-access-context.type';

/**
 * React context for admin permission awareness.
 * Provides role, permissions, and convenience flags to child components.
 */
const AdminAccessContext = createContext<AdminAccessContext | null>(null);

type AdminAccessProviderProps = {
  value: AdminAccessContext;
  children: React.ReactNode;
};

/**
 * Provider component that injects admin access context into the React tree.
 * Should be placed at the root of the admin layout to make permissions available to all child components.
 *
 * @example
 * ```tsx
 * <AdminAccessProvider value={adminAccess}>
 *   <AdminContent />
 * </AdminAccessProvider>
 * ```
 */
export function AdminAccessProvider({
  value,
  children,
}: AdminAccessProviderProps) {
  return (
    <AdminAccessContext.Provider value={value}>
      {children}
    </AdminAccessContext.Provider>
  );
}

/**
 * Hook to access admin permission context.
 * Must be used within an AdminAccessProvider.
 *
 * @throws {Error} If used outside of AdminAccessProvider
 * @returns {AdminAccessContext} The current admin access context
 *
 * @example
 * ```tsx
 * const { isSuperAdmin, canEditUsers } = useAdminAccess();
 * ```
 */
export function useAdminAccess(): AdminAccessContext {
  const context = useContext(AdminAccessContext);

  if (!context) {
    throw new Error('useAdminAccess must be used within AdminAccessProvider');
  }

  return context;
}
