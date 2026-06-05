import { Wallet } from "lucide-react"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left Pane - Branding & Info */}
      <div className="hidden md:flex flex-col flex-1 bg-primary p-10 text-primary-foreground justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2911&auto=format&fit=crop')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="relative z-10 flex items-center gap-2 text-2xl font-bold">
          <Wallet className="h-8 w-8" />
          LedgerLens AI
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold mb-4">Enterprise Fintech Intelligence</h1>
          <p className="text-lg opacity-80">
            Automate bank statement analysis, categorize transactions with AI, and manage your financial operations securely.
          </p>
        </div>
        <div className="relative z-10 text-sm opacity-60">
          &copy; {new Date().getFullYear()} LedgerLens AI. All rights reserved.
        </div>
      </div>

      {/* Right Pane - Auth Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative">
        <div className="absolute top-4 left-4 md:hidden flex items-center gap-2 text-xl font-bold text-primary">
          <Wallet className="h-6 w-6" />
          LedgerLens AI
        </div>
        <div className="w-full max-w-sm space-y-6">
          {children}
        </div>
      </div>
    </div>
  )
}
