import { requireSuperAdminContext } from '@/lib/auth/super-admin-context';
import { AdminLayoutClient } from './layout-client';

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
    <>
      {/* Preload Geist font for better performance */}
      <link
        rel="preload"
        href="/_next/static/media/geist-latin.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <AdminLayoutClient user={context.user}>{children}</AdminLayoutClient>
    </>
  );
}
