"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/mock/session";
import { useMockAuth } from "@/providers/mock-auth-provider";
import { AppShell } from "@/components/layout/app-shell";

function subscribeNoop() {
  return () => {};
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user } = useMockAuth();
  const router = useRouter();
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);

  useEffect(() => {
    if (!isClient) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "staff") {
      clearSession();
      router.replace("/login");
    }
  }, [user, isClient, router]);

  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500">
        กำลังโหลด...
      </div>
    );
  }

  if (!user || user.role !== "staff") {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500">
        กำลังเปลี่ยนหน้า...
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
