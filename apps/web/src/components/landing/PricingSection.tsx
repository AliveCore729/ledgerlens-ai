"use client";

import { motion } from "motion/react";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";

export default function PricingSection() {
  const token = useAuthStore((state) => state.token);

  return (
    <section className="w-full py-24 bg-[#000000] text-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-semibold mb-4"
            style={{ fontFamily: '"Instrument Sans", sans-serif' }}
          >
            Simple, transparent pricing.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-white/60 text-lg max-w-2xl mx-auto"
          >
            Start for free to test the power of AI extraction, then upgrade when you're ready to unlock unlimited statements.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Trial Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 flex flex-col relative overflow-hidden"
          >
            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-2">Free Trial</h3>
              <p className="text-white/60">Perfect for testing the waters.</p>
            </div>
            <div className="mb-8 flex items-baseline gap-2">
              <span className="text-5xl font-bold">$0</span>
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
                <span className="text-white/80">Basic categorization rules</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
                <span className="text-white/80">Export to CSV</span>
              </li>
            </ul>
            <Link href={token ? "/dashboard" : "/register"} className="w-full">
              <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors font-medium">
                Start Free Trial
              </button>
            </Link>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="p-8 rounded-3xl bg-gradient-to-b from-[#1a255c] to-[#0a0a0a] border border-[#3054ff]/50 flex flex-col relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#3054ff] via-[#8a9eff] to-[#3054ff]"></div>
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-2xl font-semibold">Premium</h3>
                <span className="px-3 py-1 text-xs font-medium bg-[#3054ff]/20 text-[#8a9eff] rounded-full border border-[#3054ff]/30">Most Popular</span>
              </div>
              <p className="text-white/60">For serious professionals & businesses.</p>
            </div>
            <div className="mb-8 flex items-baseline gap-2">
              <span className="text-5xl font-bold">$29</span>
              <span className="text-white/60">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#8a9eff] shrink-0 mt-0.5" />
                <span className="text-white/90"><strong className="text-white">Unlimited statement unlocks</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#8a9eff] shrink-0 mt-0.5" />
                <span className="text-white/90">Advanced AI Categorization Review</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#8a9eff] shrink-0 mt-0.5" />
                <span className="text-white/90">Multi-Organization Support</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#8a9eff] shrink-0 mt-0.5" />
                <span className="text-white/90">Priority Email Support</span>
              </li>
            </ul>
            <Link href={token ? "/dashboard/billing" : "/register"} className="w-full">
              <button className="w-full py-3 rounded-xl bg-[#3054ff] hover:bg-[#2040e0] transition-colors font-medium flex items-center justify-center gap-2">
                Get Premium <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
