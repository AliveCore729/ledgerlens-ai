'use client';

import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';

export default function RootPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <LandingNavbar />
      <HeroSection />
    </div>
  );
}