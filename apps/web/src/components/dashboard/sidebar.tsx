'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ReceiptText, 
  LogOut, 
  FileText, 
  Sun,
  Upload,
  BrainCircuit,
  Store,
  PieChart,
  Download,
  Users,
  CreditCard,
  Activity,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '../ui/button';

const navItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Upload Statements', href: '/dashboard/upload', icon: Upload },
  { title: 'Statements', href: '/dashboard/statements', icon: FileText },
  { title: 'Transactions', href: '/dashboard/transactions', icon: ReceiptText },
  { title: 'AI Categorization', href: '/dashboard/categorization', icon: BrainCircuit },
  { title: 'Vendors', href: '/dashboard/vendors', icon: Store },
  { title: 'Reports', href: '/dashboard/reports', icon: PieChart },
  { title: 'Exports', href: '/dashboard/exports', icon: Download },
  { title: 'Team Management', href: '/dashboard/team', icon: Users },
  { title: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { title: 'Audit Logs', href: '/dashboard/audit', icon: Activity },
  { title: 'Settings', href: '/dashboard/settings', icon: Settings },
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
    <div className="hidden md:flex w-64 flex-col border-r border-white/5 bg-[#050505] text-white shadow-sm min-h-screen sticky top-0 left-0">
      {/* Logo Area */}
      <div className="flex h-16 items-center gap-2 border-b border-white/5 px-6">
        <Sun className="h-6 w-6 text-white" />
        <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>LedgerLens AI</span>
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
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-[#3054ff]/10 text-[#b4c0ff] border border-[#3054ff]/20 shadow-[0_0_15px_rgba(48,84,255,0.1)]" 
                  : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </div>

      {/* User Area / Logout */}
      <div className="mt-auto p-4 shrink-0 border-t border-white/5">
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="w-full justify-start text-white/50 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}