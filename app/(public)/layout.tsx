import { PropsWithChildren } from 'react';
import { PublicFooter } from '@/components/layout/public/public-footer.component';
import { PublicHeader } from '@/components/layout/public/public-header.component';

export default function MarketingLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
