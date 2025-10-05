import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';
import { AdminHeader } from '@/components/admin/admin-header.component';
import { AdminNav } from '@/components/admin/admin-nav.component';

/**
 * Admin panel layout.
 * Server-side super-admin verification with dedicated admin UI shell.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side role verification (Better Auth)
  const context = await requireSuperAdminContext();

  return (
    <div className="min-h-screen bg-muted/20">
      <AdminHeader user={context.user} />
      <div className="flex">
        <AdminNav />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
