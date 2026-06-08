'use client';

import LandingNavbar from '@/components/landing/LandingNavbar';
import ScrollSequence from '@/components/landing/ScrollSequence';

export default function RootPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#000000] selection:bg-primary/20">
      <LandingNavbar />
      <ScrollSequence />
    </div>
  );
}