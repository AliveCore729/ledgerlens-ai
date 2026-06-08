"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";
import Link from "next/link";
import { ArrowRight, Check, Zap, PieChart, Search, Lock } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import VideoBackground from "./VideoBackground";

export default function ScrollSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const token = useAuthStore((state) => state.token);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Apply a spring to the scroll progress for buttery smooth animations
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // --- Phase 1: The Clutter & Initial Statement (0.0 to 0.25) ---
  const initialTextOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);
  const initialTextScale = useTransform(smoothProgress, [0, 0.15], [1, 1.2]);
  
  const clutterOpacity = useTransform(smoothProgress, [0, 0.15, 0.25], [1, 1, 0]);
  const clutterScale = useTransform(smoothProgress, [0, 0.25], [1, 3]);
  const clutterBlur = useTransform(smoothProgress, [0, 0.25], ["blur(0px)", "blur(10px)"]);

  // Floating elements transforms
  const float1Y = useTransform(smoothProgress, [0, 0.25], [0, -500]);
  const float1X = useTransform(smoothProgress, [0, 0.25], [0, -500]);
  const float1Rotate = useTransform(smoothProgress, [0, 0.25], [-12, -90]);

  const float2Y = useTransform(smoothProgress, [0, 0.25], [0, 600]);
  const float2X = useTransform(smoothProgress, [0, 0.25], [0, 400]);
  const float2Rotate = useTransform(smoothProgress, [0, 0.25], [15, 120]);

  const float3Y = useTransform(smoothProgress, [0, 0.25], [0, -400]);
  const float3X = useTransform(smoothProgress, [0, 0.25], [0, 600]);
  
  // --- Phase 2: Hero Text (0.2 to 0.5) ---
  const heroOpacity = useTransform(smoothProgress, [0.15, 0.25, 0.4, 0.5], [0, 1, 1, 0]);
  const heroScale = useTransform(smoothProgress, [0.15, 0.25, 0.4, 0.5], [0.8, 1, 1, 1.2]);
  const heroY = useTransform(smoothProgress, [0.4, 0.5], [0, -100]);

  // --- Phase 3: Features (0.45 to 0.75) ---
  const featuresOpacity = useTransform(smoothProgress, [0.45, 0.55, 0.65, 0.75], [0, 1, 1, 0]);
  const featuresY = useTransform(smoothProgress, [0.45, 0.55, 0.65, 0.75], [100, 0, 0, -100]);
  const featuresScale = useTransform(smoothProgress, [0.65, 0.75], [1, 0.9]);

  // --- Phase 4: Pricing (0.7 to 1.0) ---
  const pricingOpacity = useTransform(smoothProgress, [0.7, 0.8, 1.0], [0, 1, 1]);
  const pricingY = useTransform(smoothProgress, [0.7, 0.8, 1.0], [100, 0, 0]);

  return (
    <div ref={containerRef} className="relative w-full h-[400vh] bg-[#000000]">
      
      {/* Sticky Viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        <VideoBackground />

        {/* Phase 1: The Clutter */}
        <motion.div 
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{ opacity: clutterOpacity, scale: clutterScale, filter: clutterBlur }}
        >
          {/* Central Initial Statement */}
          <motion.div
            className="absolute z-20 text-center"
            style={{ opacity: initialTextOpacity, scale: initialTextScale }}
          >
            <h2 className="text-4xl md:text-7xl font-bold text-white tracking-tighter" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>
              Are your finances a mess?
            </h2>
          </motion.div>
          {/* Mock Receipt 1 */}
          <motion.div 
            className="absolute p-4 bg-white/10 border border-white/20 rounded-lg backdrop-blur-md w-64 shadow-2xl"
            style={{ top: "20%", left: "15%", y: float1Y, x: float1X, rotate: float1Rotate }}
          >
            <div className="h-2 w-1/2 bg-white/40 rounded mb-4"></div>
            <div className="h-2 w-3/4 bg-white/20 rounded mb-2"></div>
            <div className="h-2 w-full bg-white/20 rounded mb-2"></div>
            <div className="flex justify-between mt-6 pt-4 border-t border-white/10">
              <div className="h-3 w-12 bg-white/40 rounded"></div>
              <div className="h-3 w-16 bg-[#3054ff] rounded"></div>
            </div>
          </motion.div>

          {/* Mock Data 2 */}
          <motion.div 
            className="absolute p-4 bg-[#3054ff]/20 border border-[#3054ff]/30 rounded-lg backdrop-blur-md w-48 shadow-2xl text-[#b4c0ff] text-xs font-mono"
            style={{ bottom: "25%", right: "20%", y: float2Y, x: float2X, rotate: float2Rotate }}
          >
            Uncategorized spend...<br/>
            Missing receipt...<br/>
            Unknown vendor...<br/>
            Manual review needed
          </motion.div>

          {/* Mock Text 3 */}
          <motion.div 
            className="absolute text-5xl font-serif text-white/30 tracking-tighter"
            style={{ top: "60%", left: "30%", y: float3Y, x: float1X, rotate: float2Rotate }}
          >
            Endless sheets.
          </motion.div>

          {/* Mock Text 4 */}
          <motion.div 
            className="absolute text-5xl font-bold text-white/20 tracking-widest text-center"
            style={{ top: "30%", right: "30%", y: float1Y, x: float3X, rotate: float1Rotate }}
          >
            HOURS OF<br/>TYPING
          </motion.div>
        </motion.div>

        {/* Phase 2: Hero Text */}
        <motion.div 
          className="absolute z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center px-6 pointer-events-none"
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        >
          <p
            className="text-3xl sm:text-5xl lg:text-[48px] leading-[1.1] text-white mb-6"
            style={{ fontFamily: '"Instrument Serif", serif' }}
          >
            From scattered PDFs to total clarity
          </p>

          <h1
            className="text-6xl sm:text-8xl lg:text-[136px] leading-[0.9] tracking-tighter font-semibold bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-[#b4c0ff] mb-8"
            style={{ fontFamily: '"Instrument Sans", sans-serif' }}
          >
            Understand Everything
          </h1>

          <p
            className="text-lg sm:text-[20px] leading-[1.65] text-white max-w-xl mx-auto"
            style={{ fontFamily: '"Instrument Sans", sans-serif' }}
          >
            Just drop in your bank statements, and we'll instantly turn them into beautiful, organized financial insights. Say goodbye to manual data entry and endless, confusing spreadsheets.
          </p>
        </motion.div>

        {/* Phase 3: Features */}
        <motion.div 
          className="absolute z-20 w-full max-w-6xl mx-auto px-6"
          style={{ opacity: featuresOpacity, y: featuresY, scale: featuresScale }}
        >
          <div className="text-center mb-12">
            <h2 
              className="text-4xl md:text-6xl font-semibold mb-4 text-white tracking-tight"
              style={{ fontFamily: '"Instrument Sans", sans-serif' }}
            >
              Everything you need to master your money.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-12 h-12 rounded-full bg-[#3054ff]/20 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-[#3054ff]" />
              </div>
              <h3 className="text-xl font-medium mb-3 text-white" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>
                Instant Data Entry
              </h3>
              <p className="text-white/60 leading-relaxed">
                We read your PDFs just like a human would, instantly pulling out every transaction flawlessly so you never have to type a single thing.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-12 h-12 rounded-full bg-[#3054ff]/20 flex items-center justify-center mb-6">
                <PieChart className="w-6 h-6 text-[#3054ff]" />
              </div>
              <h3 className="text-xl font-medium mb-3 text-white" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>
                Smart Categorization
              </h3>
              <p className="text-white/60 leading-relaxed">
                Stop wasting hours tagging expenses. Our system automatically figures out exactly where your money went and organizes it perfectly.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Phase 4: Pricing */}
        <motion.div 
          className="absolute z-30 w-full max-w-5xl mx-auto px-6"
          style={{ opacity: pricingOpacity, y: pricingY }}
        >
          <div className="text-center mb-12">
            <h2 
              className="text-4xl md:text-6xl font-semibold mb-4 text-white tracking-tight"
              style={{ fontFamily: '"Instrument Sans", sans-serif' }}
            >
              Simple, transparent pricing.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Trial Plan */}
            <div className="p-8 rounded-3xl bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 flex flex-col relative overflow-hidden">
              <div className="mb-8">
                <h3 className="text-2xl font-semibold mb-2 text-white">Free Trial</h3>
                <p className="text-white/60">Perfect for testing the waters.</p>
              </div>
              <div className="mb-8 flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white">$0</span>
                <span className="text-white/60">forever</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                  <span className="text-white/80">Process up to <strong className="text-white">2 statements</strong> total</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                  <span className="text-white/80">Gemini 2.0 AI Extraction</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                  <span className="text-white/80">Export to CSV</span>
                </li>
              </ul>
              {token ? (
                <Link href="/dashboard" className="w-full">
                  <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors font-medium relative z-40">
                    Start Free Trial
                  </button>
                </Link>
              ) : (
                <button onClick={openAuthModal} className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors font-medium relative z-40">
                  Start Free Trial
                </button>
              )}
            </div>

            {/* Premium Plan */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-[#1a255c]/90 to-[#0a0a0a]/90 backdrop-blur-xl border border-[#3054ff]/50 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#3054ff] via-[#8a9eff] to-[#3054ff]"></div>
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-2xl font-semibold text-white">Premium</h3>
                  <span className="px-3 py-1 text-xs font-medium bg-[#3054ff]/20 text-[#8a9eff] rounded-full border border-[#3054ff]/30">Most Popular</span>
                </div>
                <p className="text-white/60">For serious professionals & businesses.</p>
              </div>
              <div className="mb-8 flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white">$29</span>
                <span className="text-white/60">/month</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#8a9eff] shrink-0 mt-0.5" />
                  <span className="text-white/90"><strong className="text-white">Unlimited statement unlocks</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#8a9eff] shrink-0 mt-0.5" />
                  <span className="text-white/90">Advanced AI Categorization</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#8a9eff] shrink-0 mt-0.5" />
                  <span className="text-white/90">Multi-Organization Support</span>
                </li>
              </ul>
              {token ? (
                <Link href="/dashboard/billing" className="w-full">
                  <button className="w-full py-3 rounded-xl bg-[#3054ff] hover:bg-[#2040e0] text-white transition-colors font-medium flex items-center justify-center gap-2 relative z-40">
                    Get Premium <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              ) : (
                <button onClick={openAuthModal} className="w-full py-3 rounded-xl bg-[#3054ff] hover:bg-[#2040e0] text-white transition-colors font-medium flex items-center justify-center gap-2 relative z-40">
                  Get Premium <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
