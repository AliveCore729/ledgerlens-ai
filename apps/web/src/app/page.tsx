'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [isMounted, setIsMounted] = useState(false);

  // We use isMounted to prevent Next.js hydration errors when reading local storage
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      if (token) {
        // If they have a token, send them to the dashboard
        router.push('/dashboard');
      } else {
        // If they don't, send them to our shiny new login page
        router.push('/login');
      }
    }
  }, [isMounted, token, router]);

  // Show a smooth loading spinner while deciding where to route them
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}