"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "@/lib/mock/session";
import { homePathForRole } from "@/lib/officer-access";
import { useMockAuth } from "@/providers/mock-auth-provider";
import { AppShell } from "@/components/layout/app-shell";

const APP_ROLES = ["staff", "officer"] as const;

function subscribeNoop() {
  return () => {};
}

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

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user } = useMockAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);

  useEffect(() => {
    if (!isClient) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!APP_ROLES.includes(user.role as (typeof APP_ROLES)[number])) {
      clearSession();
      router.replace("/login");
      return;
    }
    if (user.role === "staff" && isOfficerRoute(pathname)) {
      router.replace("/tickets");
      return;
    }
    if (user.role === "officer" && isStaffRoute(pathname)) {
      router.replace("/officer/inbox");
    }
  }, [user, isClient, router, pathname]);

  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500">
        กำลังโหลด...
      </div>
    );
  }

  if (!user || !APP_ROLES.includes(user.role as (typeof APP_ROLES)[number])) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500">
        กำลังเปลี่ยนหน้า...
      </div>
    );
  }

  if (user.role === "staff" && isOfficerRoute(pathname)) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500">
        กำลังเปลี่ยนหน้า...
      </div>
    );
  }

  if (user.role === "officer" && isStaffRoute(pathname)) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500">
        กำลังเปลี่ยนหน้า...
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
