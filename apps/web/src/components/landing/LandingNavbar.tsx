'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Sun, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function LandingNavbar() {
  const token = useAuthStore((state) => state.token);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);
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

      {/* Center navigation links removed as requested */}

      <div className="flex items-center gap-4">
        {mounted && !token && (
          <button 
            onClick={openAuthModal}
            className="hidden sm:block text-white/80 hover:text-white text-sm font-medium transition-colors" 
            style={{ fontFamily: '"Instrument Sans", sans-serif' }}
          >
            Start Free Trial
          </button>
        )}
        
        {mounted && (
          <div className="flex gap-4">
            {token ? (
              <Link href="/dashboard">
                <button className="px-6 py-2.5 rounded-full font-semibold bg-white hover:bg-white/90 text-black transition-colors" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>
                  Go to Dashboard
                </button>
              </Link>
            ) : (
              <button 
                onClick={openAuthModal}
                className="px-6 py-2.5 rounded-full font-semibold bg-white hover:bg-white/90 text-black transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                style={{ fontFamily: '"Instrument Sans", sans-serif' }}
              >
                Get Started
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
