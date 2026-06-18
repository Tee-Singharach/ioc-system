"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAdminRoute } from "@/lib/admin-access";
import { useMounted } from "@/hooks/use-mounted";
import { clearSession } from "@/lib/mock/session";
import { homePathForRole } from "@/lib/officer-access";
import { useMockAuth } from "@/providers/mock-auth-provider";
import { AppShell } from "@/components/layout/app-shell";
import type { UserRole } from "@/lib/types/ticket";

const APP_ROLES = ["staff", "officer", "manager", "admin"] as const;
type AppRole = (typeof APP_ROLES)[number];

function isStaffRoute(pathname: string) {
  return pathname === "/tickets" || pathname === "/tickets/new" || /^\/tickets\/[^/]+$/.test(pathname);
}

function isOfficerRoute(pathname: string) {
  return (
    pathname === "/officer/inbox" ||
    pathname === "/officer/tickets" ||
    /^\/officer\/tickets\/[^/]+$/.test(pathname)
  );
}

function isManagerRoute(pathname: string) {
  return (
    pathname === "/manager/dashboard" ||
    pathname === "/manager/approvals" ||
    pathname === "/manager/history" ||
    /^\/manager\/tickets\/[^/]+$/.test(pathname)
  );
}

function isSettingsRoute(pathname: string) {
  return pathname === "/settings";
}

function isAppRole(role: UserRole): role is AppRole {
  return APP_ROLES.includes(role as AppRole);
}

function isWrongRoute(role: AppRole, pathname: string) {
  if (isSettingsRoute(pathname)) return false;
  if (role === "admin") return !isAdminRoute(pathname);
  if (isAdminRoute(pathname)) return true;
  if (role === "staff") return isOfficerRoute(pathname) || isManagerRoute(pathname);
  if (role === "officer") return isStaffRoute(pathname) || isManagerRoute(pathname);
  if (role === "manager") return isStaffRoute(pathname) || isOfficerRoute(pathname);
  return false;
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500">
      {message}
    </div>
  );
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const mounted = useMounted();
  const { user } = useMockAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!mounted) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!isAppRole(user.role)) {
      clearSession();
      router.replace("/login");
      return;
    }
    if (isWrongRoute(user.role, pathname)) {
      router.replace(homePathForRole(user.role));
    }
  }, [user, mounted, router, pathname]);

  if (!mounted) {
    return <LoadingScreen message="กำลังโหลด..." />;
  }

  if (!user || !isAppRole(user.role)) {
    return <LoadingScreen message="กำลังเปลี่ยนหน้า..." />;
  }

  if (isWrongRoute(user.role, pathname)) {
    return <LoadingScreen message="กำลังเปลี่ยนหน้า..." />;
  }

  return <AppShell>{children}</AppShell>;
}
