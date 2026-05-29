'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ReceiptText, LogOut, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '../ui/button';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Statements',
    href: '/dashboard/statements',
    icon: FileText,
  },
  {
    title: 'Transactions',
    href: '/dashboard/transactions',
    icon: ReceiptText,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="hidden md:flex w-64 flex-col border-r bg-card text-card-foreground shadow-sm min-h-screen sticky top-0 left-0">
      {/* Logo Area */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <FileText className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight">LedgerLens AI</span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-auto py-6 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </div>

      {/* User Area / Logout */}
      {/* The Fix: mt-auto pushes it to the bottom, shrink-0 prevents stretching */}
  <div className="mt-auto p-4 shrink-0 border-t">
    <Button 
      variant="ghost" 
      onClick={handleLogout}
      className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  </div>
    </div>
  );
}