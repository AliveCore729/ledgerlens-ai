"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  
  // We use a mounting state to prevent hydration mismatch
  // between server-rendered HTML and client-side auth state
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const isDashboardRoute = pathname.startsWith("/dashboard");
    const isAdminRoute = pathname.startsWith("/dashboard/admin");

    // 1. If trying to access protected route without token, boot to login
    if (!token && isDashboardRoute) {
      router.replace("/login");
      return;
    }

    // 2. If trying to access admin route but not a super admin, boot to dashboard
    if (token && isAdminRoute && user?.role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
      return;
    }

    // 3. If on login/register page but ALREADY logged in, boot to dashboard
    if (token && isPublicRoute && pathname !== "/") {
      router.replace("/dashboard");
      return;
    }
  }, [pathname, token, user, isMounted, router]);

  // Prevent rendering protected routes flash before redirect
  if (!isMounted) {
    return <div className="min-h-screen bg-background" />;
  }

  // If token is missing and route is protected, render nothing while we redirect
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  if (!token && !isPublicRoute) {
    return <div className="min-h-screen bg-background" />;
  }

  return <>{children}</>;
}
