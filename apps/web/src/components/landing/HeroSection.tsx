'use client';

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import VideoBackground from "./VideoBackground";

export default function HeroSection() {
  const token = useAuthStore((state) => state.token);

  return (
    <div className="relative w-full min-h-screen bg-[#000000] text-white overflow-hidden flex items-center justify-center">
      
      <VideoBackground />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center mt-20 space-y-12 px-6 pointer-events-none">
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-5xl lg:text-[48px] leading-[1.1] text-white"
          style={{ fontFamily: '"Instrument Serif", serif' }}
        >
          From messy PDFs to clear insights
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-6xl sm:text-8xl lg:text-[136px] leading-[0.9] tracking-tighter font-semibold bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-[#b4c0ff]"
          style={{ fontFamily: '"Instrument Sans", sans-serif' }}
        >
          Analyze Faster
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-lg sm:text-[20px] leading-[1.65] text-white max-w-xl mx-auto"
          style={{ fontFamily: '"Instrument Sans", sans-serif' }}
        >
          Upload bank statements in any format. Let our advanced Gemini 2.0 engine extract, clean, and auto-categorize hundreds of transactions in seconds with bulletproof ledger math.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-6 items-center pointer-events-auto"
        >
          <Link href={token ? "/dashboard" : "/register"}>
            <button className="flex items-center gap-3 pl-6 pr-2 py-2 rounded-full bg-white group hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300">
              <span className="font-medium text-lg text-[#0a0400]" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>
                Start Analyzing Free
              </span>
              <div className="w-[40px] h-[40px] rounded-full bg-[#3054ff] group-hover:bg-[#2040e0] flex items-center justify-center transition-colors">
                <ArrowRight className="text-white w-5 h-5" />
              </div>
            </button>
          </Link>

          <Link href="/demo" className="group flex items-center gap-2 px-4 py-2 rounded-lg text-white/70 hover:text-white backdrop-blur-sm hover:bg-white/5 transition-all">
            <span style={{ fontFamily: '"Instrument Sans", sans-serif' }}>View Dashboard Demo</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
