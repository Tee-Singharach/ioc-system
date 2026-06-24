"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { useCatalog } from "@/providers/catalog-provider";
import { userInitials } from "@/lib/ticket-progress";
import type { User, UserRole } from "@/lib/types/ticket";

interface SidebarBottomProps {
  user: User | null;
  onLogout: () => void;
  onNavigate?: () => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  staff: "พนักงาน",
  officer: "เจ้าหน้าที่",
  manager: "ผู้จัดการ",
  admin: "ผู้ดูแลระบบ",
};

export function SidebarBottom({ user, onLogout, onNavigate }: SidebarBottomProps) {
  const pathname = usePathname();
  const { departments } = useCatalog();
  const settingsActive = pathname === "/settings";
  const departmentName =
    departments.find((d) => d.id === user?.departmentId)?.name ?? "—";

  return (
    <div className="shrink-0 space-y-4 border-t border-zinc-100 bg-white p-4">
      <div>
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          ทั่วไป
        </p>
        <Link
          href="/settings"
          onClick={onNavigate}
          aria-current={settingsActive ? "page" : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-100 ${
            settingsActive
              ? "bg-blue-600 text-white"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          }`}
        >
          <Settings className={`h-4 w-4 shrink-0 ${settingsActive ? "text-white" : "text-zinc-400"}`} />
          การตั้งค่า
        </Link>
      </div>

      {user && (
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
          <div
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700"
          >
            {userInitials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-900">{user.name}</p>
            <p className="truncate text-xs text-zinc-500">
              {ROLE_LABELS[user.role]} · {departmentName}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="ออกจากระบบ"
            title="ออกจากระบบ"
            className="flex shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-100"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
