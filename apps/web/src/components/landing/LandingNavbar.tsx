'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Sun, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function LandingNavbar() {
  const token = useAuthStore((state) => state.token);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Sun className="h-6 w-6 text-white" />
        <span className="text-white font-semibold" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>
          LedgerLens AI
        </span>
      </div>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/80" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>
        <Link href="#features" className="hover:text-white transition-colors flex items-center gap-1">
          Features <ChevronDown className="h-4 w-4" />
        </Link>
        <Link href="#banks" className="hover:text-white transition-colors">
          Supported Banks
        </Link>
        <Link href="#docs" className="hover:text-white transition-colors">
          Documentation
        </Link>
        <Link href="#pricing" className="hover:text-white transition-colors">
          Pricing
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/book" className="hidden sm:block text-white/80 hover:text-white text-sm font-medium transition-colors" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>
          Book A Demo
        </Link>
        
        {mounted && (
          <Link href={token ? "/dashboard" : "/register"}>
            <button className="bg-white text-black rounded-full px-5 py-2.5 font-semibold text-sm hover:bg-white/90 transition-colors" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>
              {token ? "Dashboard" : "Get Started"}
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
}
