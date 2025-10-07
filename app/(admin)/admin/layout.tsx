import { requireAdminContext } from '@/lib/auth/admin-context';
import { AdminLayoutClient } from './layout-client';
import type { AdminAccessContext } from '@/lib/types/admin/admin-access-context.type';

/**
 * Admin panel layout.
 * Server-side admin verification with dedicated admin UI shell.
 * Enforces admin or super-admin access and passes permission context to client.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side role verification (Better Auth)
  const context = await requireAdminContext();

  // Convert server AdminContext to client AdminAccessContext
  const adminAccess: AdminAccessContext = {
    role: context.admin.role,
    permissions: Array.from(context.admin.permissions),
    isSuperAdmin: context.admin.isSuperAdmin,
    canViewActivity: context.admin.canViewActivity,
    canViewAnalytics: context.admin.canViewAnalytics,
    canManageAnalytics: context.admin.canManageAnalytics,
    canViewOrganizations: context.admin.canViewOrganizations,
    canEditOrganizations: context.admin.canEditOrganizations,
    canViewUsers: context.admin.canViewUsers,
    canEditUsers: context.admin.canEditUsers,
  };

  return (
    <>
      {/* Preload Geist font for better performance */}

      <AdminLayoutClient user={context.user} adminAccess={adminAccess}>
        {children}
      </AdminLayoutClient>
    </>
  );
}
