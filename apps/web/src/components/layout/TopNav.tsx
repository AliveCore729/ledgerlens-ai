"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function TopNav() {
  const { setTheme } = useTheme()
  const pathname = usePathname()
  
  const isStatementsPage = pathname?.startsWith('/dashboard/statements');

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center gap-4 border-b border-white/5 bg-[#0a0a0a] px-4 md:px-6 pointer-events-auto">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-white/70 hover:text-white" />
      </div>
      
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial" />

        <Button variant="ghost" size="icon" className="relative text-white/70 hover:text-white hover:bg-white/5 rounded-full">
          <Bell className="h-5 w-5" />
          <span className={cn(
            "absolute top-2 right-2 h-2 w-2 rounded-full transition-colors duration-500",
            isStatementsPage ? "bg-[#FF541B]" : "bg-[#3054ff]"
          )} />
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </div>
    </header>
  )
}
