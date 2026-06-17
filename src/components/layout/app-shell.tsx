"use client";

import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { useMockAuth } from "@/providers/mock-auth-provider";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useMockAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              IOC
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-zinc-900">IOC System</p>
              <p className="text-xs text-zinc-500">พนักงาน</p>
            </div>
          </div>
        </div>

        <SidebarNav />

        <div className="mt-auto border-t border-zinc-100 p-4">
          <div className="mb-3 rounded-lg bg-zinc-50 px-3 py-2.5">
            <p className="truncate text-sm font-medium text-zinc-900">{user?.name}</p>
            <p className="truncate text-xs text-zinc-500">@{user?.username}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
          >
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-zinc-200 bg-white px-6 py-4">
          <h1 className="text-lg font-semibold text-zinc-900">ระบบจัดการคำร้อง</h1>
          <p className="text-sm text-zinc-500">Internal Operations Control</p>
        </header>
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-6">{children}</main>
      </div>
    </div>
  );
}
