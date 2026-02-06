/**
 * Dashboard Layout
 * Main layout for authenticated dashboard pages with sidebar and header.
 */

import { Outlet } from '@tanstack/react-router';
import { Sidebar } from '@/shared/components/Sidebar/Sidebar';
import { Header } from '@/shared/components/Header/Header';
import { MobileSidebar } from '@/shared/components/Sidebar/MobileSidebar';
import { useSidebarStore } from '@/shared/stores/sidebar.store';
import { cn } from '@/shared/lib/utils';
import { RouteTitle } from '@/app/router/RouteTitle';

export function DashboardLayout() {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);

  return (
    <>
      <RouteTitle />
      <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-card border-r border-border transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <Sidebar />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <MobileSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-5">
          <Outlet />
        </main>
      </div>
      </div>
    </>
  );
}
