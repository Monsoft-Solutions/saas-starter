import { authClient } from '@/lib/auth/auth-client';
import { SWRProvider } from '@/components/providers/swr-provider';
import { NotificationProvider } from '@/components/notifications/notification-provider.component';

// TODO: improve this
export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await authClient.getSession();
  const user = session?.data?.user;

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
