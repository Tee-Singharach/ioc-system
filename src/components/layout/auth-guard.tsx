"use client";

import { useLayoutEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isAdminRoute } from "@/lib/admin-access";
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
    /^\/officer\/inbox\/[^/]+$/.test(pathname) ||
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

function redirectTo(href: string) {
  if (window.location.pathname === href) return;
  window.location.replace(href);
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500">
      {message}
    </div>
  );
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, sessionReady } = useMockAuth();
  const pathname = usePathname();

  const wrongRoute = user && isAppRole(user.role) ? isWrongRoute(user.role, pathname) : false;

  useLayoutEffect(() => {
    if (!sessionReady) return;
    if (!user) {
      redirectTo("/login");
      return;
    }
    if (!isAppRole(user.role)) {
      clearSession();
      redirectTo("/login");
      return;
    }
    if (isWrongRoute(user.role, pathname)) {
      redirectTo(homePathForRole(user.role));
    }
  }, [user, sessionReady, pathname]);

  if (!sessionReady) {
    return <LoadingScreen message="กำลังโหลด..." />;
  }

  if (!user || !isAppRole(user.role)) {
    return <LoadingScreen message="กำลังเปลี่ยนหน้า..." />;
  }

  if (wrongRoute) {
    return <LoadingScreen message="กำลังเปลี่ยนหน้า..." />;
  }

  return <AppShell>{children}</AppShell>;
}
