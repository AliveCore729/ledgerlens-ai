import Sidebar from '@/components/dashboard/sidebar';
import { ReactNode } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 1. Lock the entire app to the screen height and hide global scrolling
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      
      {/* 2. Sidebar container: Fixed width, full height */}
      <aside className="w-64 hidden md:block border-r bg-card h-full shrink-0">
        <Sidebar />
      </aside>

      {/* 3. Main content container: Fills the rest of the space, scrolls independently */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
      
    </div>
  );
}