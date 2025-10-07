import { SWRProvider } from '@/components/providers/swr-provider';
import { NotificationProvider } from '@/components/notifications/notification-provider.component';
import { authClient } from '@/lib/auth/auth-client';

// Force dynamic rendering for admin routes
export const dynamic = 'force-dynamic';

/**
 * Admin route group layout.
 * Provides SWR and notification context for admin pages.
 */
export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = authClient.getSession().then((session) => session?.data?.user);

  return (
    <SWRProvider
      value={{
        fallback: {
          '/api/user': user,
        },
      }}
    >
      <NotificationProvider>{children}</NotificationProvider>
    </SWRProvider>
  );
}
