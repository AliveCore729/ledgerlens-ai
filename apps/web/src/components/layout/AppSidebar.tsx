"use client"

import * as React from "react"
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
} from "lucide-react"

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
} from "@/components/ui/sidebar"

import { useAuthStore } from "@/store/auth-store"

const data = {
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Statements", url: "/dashboard/statements", icon: FileText },
    { title: "Upload Statements", url: "/dashboard/upload", icon: UploadCloud },
    { title: "Categorization", url: "/dashboard/categorization", icon: BarChart3 },
    { title: "Vendors", url: "/dashboard/vendors", icon: Users },
  ],
  navAdmin: [
    { title: "Billing", url: "/dashboard/billing", icon: CreditCard },
    { title: "Audit Logs", url: "/dashboard/audit", icon: ShieldAlert },
    { title: "Settings", url: "/dashboard/settings", icon: Settings },
  ],
}

export function AppSidebar() {
  const user = useAuthStore((state) => state.user)

  return (
    <Sidebar className="border-r border-white/5 bg-black/40 backdrop-blur-xl">
      <SidebarHeader>
        <div className="flex h-12 items-center px-4 font-semibold text-lg text-primary">
          <Wallet className="mr-2 h-6 w-6" />
          LedgerLens AI
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navAdmin.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {user?.role === "SUPER_ADMIN" && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary font-semibold">Super Admin Console</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="bg-primary/10 text-primary hover:bg-primary/20">
                    <a href="/dashboard/admin">
                      <ShieldAlert />
                      <span>Platform Metrics</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/dashboard/admin/organizations">
                      <Users />
                      <span>Organizations</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/dashboard/admin/users">
                      <Users />
                      <span>Global Users</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
