'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { CommandPalette } from '@/components/layout/command-palette';
import { PageHeader } from '@/components/layout/page-header';
import { ContentContainer } from '@/components/layout/content-container';
import { cn } from '@/lib/design-system';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <SidebarNav
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-full"
        />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4 mr-2" />
                Menu
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarNav />
            </SheetContent>
          </Sheet>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <ContentContainer className="h-full">
            <div className="space-y-6">
              <PageHeader onSearchClick={() => setCommandPaletteOpen(true)} />
              {children}
            </div>
          </ContentContainer>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </div>
  );
}
