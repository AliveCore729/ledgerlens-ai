'use client';

import { Search, Bell, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';

export default function TopNav() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="sticky top-0 z-40 w-full flex h-16 shrink-0 items-center gap-4 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md px-6">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            type="search"
            placeholder="Search transactions, vendors, reports..."
            className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/40 pl-9 focus-visible:ring-[#3054ff] transition-all"
            style={{ fontFamily: '"Instrument Sans", sans-serif' }}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/5 rounded-full relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#3054ff] rounded-full border border-[#050505]"></span>
        </Button>
        
        <div className="flex items-center gap-3 border-l border-white/10 pl-4">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-sm font-medium text-white leading-tight" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Guest User'}
            </span>
            <span className="text-xs text-[#b4c0ff] font-medium" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>Enterprise</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#3054ff] to-[#607dff] flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(48,84,255,0.3)]">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}
