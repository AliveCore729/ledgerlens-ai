"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Activity,
  BarChart3,
  CreditCard,
  FileText,
  Home,
  Settings,
  ShieldAlert,
  UploadCloud,
  Users,
  Wallet,
  Search,
  ChevronsUpDown
} from "lucide-react"

import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useAuthStore } from "@/store/auth-store"
import { cn } from "@/lib/utils"

const data = {
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Statements", url: "/dashboard/statements", icon: FileText },
    { title: "Categorization", url: "/dashboard/categorization", icon: BarChart3 },
    { title: "Upload Statement", url: "/dashboard/upload", icon: UploadCloud },
  ],
  navAdmin: [
    { title: "Billing", url: "/dashboard/billing", icon: CreditCard },
    { title: "Audit Logs", url: "/dashboard/audit", icon: ShieldAlert },
    { title: "Settings", url: "/dashboard/settings", icon: Settings },
  ],
  navApps: [
    { title: "Platform Metrics", url: "/dashboard/admin", icon: ShieldAlert },
    { title: "Organizations", url: "/dashboard/admin/organizations", icon: Users },
    { title: "Global Users", url: "/dashboard/admin/users", icon: Users },
  ],
}

export function AppSidebar() {
  const user = useAuthStore((state) => state.user)
  const pathname = usePathname()
  
  const isStatementsPage = pathname?.startsWith('/dashboard/statements');
  const isAppsPage = pathname?.startsWith('/dashboard/admin');
  
  const activeIndicatorClass = isStatementsPage 
    ? "bg-[#1C1C1E] shadow-[inset_-24px_0px_32px_-12px_rgba(255,84,27,0.4)] border-[#FF541B]"
    : isAppsPage
    ? "bg-[#1C1C1E] shadow-[inset_-24px_0px_32px_-12px_rgba(52,211,153,0.3)] border-[#34d399]"
    : "bg-[#1C1C1E] shadow-[inset_-24px_0px_32px_-12px_rgba(48,84,255,0.4)] border-[#3054ff]";

  return (
    <Sidebar className="border-r border-white/5 bg-[#0d1117] text-white/60">
      <SidebarHeader className="p-4 space-y-4">
        <div className="flex h-12 items-center px-2 font-bold text-xl tracking-tight text-white gap-3">
          <div className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-500",
            isStatementsPage ? "bg-gradient-to-tr from-[#FF541B] to-[#FF8C00]" : "bg-gradient-to-tr from-[#3054ff] to-[#00d2ff]"
          )}>
            <Wallet className="h-4 w-4 text-white" />
          </div>
          LedgerLens
        </div>

        <div className="relative px-2">
          <Search className="absolute left-4 top-2.5 h-4 w-4 text-white/40 pointer-events-none" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8 bg-[#1a1a1a] border-white/10 text-white placeholder:text-white/40 rounded-xl h-9 w-full"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/40 uppercase tracking-widest text-[10px] font-bold px-4 mb-2 mt-2">Home</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {data.navMain.map((item) => {
                const isActive = pathname === item.url || (pathname?.startsWith(item.url) && item.url !== '/dashboard');
                return (
                  <SidebarMenuItem key={item.title} className="relative">
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-indicator"
                        className={cn("absolute inset-0 rounded-xl border-r-2", activeIndicatorClass)}
                        initial={false}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <SidebarMenuButton asChild className={cn(
                      "relative z-10 transition-all rounded-xl h-11 px-4 duration-300",
                      isActive ? "text-white hover:bg-transparent" : "hover:bg-white/5 hover:text-white"
                    )}>
                      <Link href={item.url}>
                        <item.icon className={cn("mr-3 h-5 w-5 transition-colors", isActive ? "text-white" : "text-white/50")} />
                        <span className="font-medium text-[15px]">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-white/40 uppercase tracking-widest text-[10px] font-bold px-4 mb-2">Pages</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {data.navAdmin.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title} className="relative">
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-indicator"
                        className={cn("absolute inset-0 rounded-xl border-r-2", activeIndicatorClass)}
                        initial={false}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <SidebarMenuButton asChild className={cn(
                      "relative z-10 transition-all rounded-xl h-11 px-4 duration-300",
                      isActive ? "text-white hover:bg-transparent" : "hover:bg-white/5 hover:text-white"
                    )}>
                      <Link href={item.url}>
                        <item.icon className={cn("mr-3 h-5 w-5 transition-colors", isActive ? "text-white" : "text-white/50")} />
                        <span className="font-medium text-[15px]">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {user?.role === "SUPER_ADMIN" && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-emerald-400/80 uppercase tracking-widest text-[10px] font-bold px-4 mb-2">Apps</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {data.navApps.map((item) => {
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title} className="relative">
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active-indicator"
                          className={cn("absolute inset-0 rounded-xl border-r-2", activeIndicatorClass)}
                          initial={false}
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                      <SidebarMenuButton asChild className={cn(
                        "relative z-10 transition-all rounded-xl h-11 px-4 duration-300",
                        isActive ? "text-emerald-400 hover:bg-transparent" : "text-emerald-400/70 hover:bg-emerald-500/10 hover:text-emerald-400"
                      )}>
                        <Link href={item.url}>
                          <item.icon className={cn("mr-3 h-5 w-5 transition-colors", isActive ? "text-emerald-400" : "text-emerald-400/50")} />
                          <span className="font-medium text-[15px]">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 mb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1C1C1E] border border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" 
                alt="User Avatar" 
                className="h-9 w-9 rounded-full object-cover border border-white/10"
              />
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user?.firstName} {user?.lastName || 'Admin'}</p>
                <p className="text-xs text-white/40 truncate">{user?.email}</p>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-white/40" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right" sideOffset={12} className="w-56 bg-[#1a1a1a] border-white/10 text-white rounded-xl">
            <DropdownMenuLabel className="text-white/40">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
              <Link href="/dashboard/settings">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
              <Link href="/dashboard/billing">Billing</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem 
              className="focus:bg-white/10 focus:text-white cursor-pointer text-red-400 focus:text-red-300"
              onClick={() => {
                useAuthStore.getState().setToken("");
                useAuthStore.getState().setUser(null as any);
                window.location.href = "/";
              }}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
