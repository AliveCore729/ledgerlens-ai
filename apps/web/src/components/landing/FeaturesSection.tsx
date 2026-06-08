"use client";

import { motion } from "motion/react";
import { Search, Zap, PieChart, Lock } from "lucide-react";

const features = [
  {
    icon: <Zap className="w-6 h-6 text-[#3054ff]" />,
    title: "Instant OCR Extraction",
    description: "Upload any bank statement PDF. Our Gemini 2.0 integration instantly extracts transactions with 99.9% accuracy.",
  },
  {
    icon: <PieChart className="w-6 h-6 text-[#3054ff]" />,
    title: "AI Categorization",
    description: "Never manually tag a transaction again. The AI intelligently assigns categories to every spend based on vendor context.",
  },
  {
    icon: <Search className="w-6 h-6 text-[#3054ff]" />,
    title: "Advanced Search",
    description: "Instantly locate specific transactions across hundreds of pages using our lightning-fast search engine.",
  },
  {
    icon: <Lock className="w-6 h-6 text-[#3054ff]" />,
    title: "Enterprise Security",
    description: "Your financial data is encrypted at rest and in transit. Secure Google OAuth ensures only you have access.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="w-full py-24 bg-[#050505] text-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-semibold mb-4"
            style={{ fontFamily: '"Instrument Sans", sans-serif' }}
          >
            Everything you need to master your ledger.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-white/60 text-lg max-w-2xl mx-auto"
          >
            Built for scale, speed, and accuracy. LedgerLens completely automates the painful process of manual data entry.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              <div className="w-12 h-12 rounded-full bg-[#3054ff]/20 flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-medium mb-3" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>
                {feature.title}
              </h3>
              <p className="text-white/60 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
