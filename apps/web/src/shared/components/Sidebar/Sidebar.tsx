/**
 * Sidebar Component
 * Main sidebar navigation with collapsible support.
 */

import { SidebarHeader } from './SidebarHeader';
import { SidebarNav } from './SidebarNav';
import { SidebarFooter } from './SidebarFooter';

export function Sidebar() {
  return (
    <div className="flex flex-col h-full">
      <SidebarHeader />
      <SidebarNav />
      <SidebarFooter />
    </div>
  );
}
