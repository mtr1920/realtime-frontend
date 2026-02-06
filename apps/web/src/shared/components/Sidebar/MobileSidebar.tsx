/**
 * Mobile Sidebar
 * Sheet-based sidebar for mobile devices.
 */

import { Sidebar } from './Sidebar';
import { useSidebarStore } from '@/shared/stores/sidebar.store';
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui';

export function MobileSidebar() {
  const isMobileOpen = useSidebarStore((state) => state.isMobileOpen);
  const setMobileOpen = useSidebarStore((state) => state.setMobileOpen);

  return (
    <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
}
