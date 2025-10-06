'use client';

import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/admin/admin-header.component';
import { AdminNav } from '@/components/admin/admin-nav.component';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface AdminLayoutClientProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: 'admin' | 'super-admin';
  };
  children: React.ReactNode;
}

/**
 * Client-side admin layout component with responsive sidebar.
 */
export function AdminLayoutClient({ user, children }: AdminLayoutClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on screen resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // lg breakpoint
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-muted/20">
      <AdminHeader
        user={user}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            'hidden lg:flex transition-all duration-300',
            sidebarCollapsed ? 'w-16' : 'w-64'
          )}
        >
          <AdminNav
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <AdminNav />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
