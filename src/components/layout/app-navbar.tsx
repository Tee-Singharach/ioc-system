"use client";

import { memo, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, X } from "lucide-react";
import { useTickets } from "@/providers/mock-ticket-provider";
import { Button } from "@/components/ui/button";

// ponytail: mock until notification API exists
const MOCK_NOTIFICATIONS = [
  { id: "n1", title: "คำร้อง IOC-2024-003 เปลี่ยนเป็นกำลังดำเนินการ", at: "2024-06-17T09:30:00" },
  { id: "n2", title: "คำร้อง IOC-2024-001 ได้รับการอนุมัติ", at: "2024-06-16T14:15:00" },
  { id: "n3", title: "มีคำร้องใหม่รอดำเนินการ", at: "2024-06-15T11:00:00" },
] as const;

const BREADCRUMBS: Record<string, string> = {
  "/tickets": "คำร้องของฉัน",
  "/tickets/new": "สร้างคำร้องใหม่",
  "/officer/inbox": "กล่องงาน",
  "/officer/tickets": "คำร้องทั้งหมด",
  "/manager/dashboard": "แดชบอร์ด",
  "/manager/approvals": "รออนุมัติ",
  "/manager/history": "ประวัติการอนุมัติ",
  "/admin/users": "ผู้ใช้และบทบาท",
  "/admin/departments": "จัดการแผนก",
  "/admin/audit-logs": "Audit Log",
  "/settings": "การตั้งค่า",
};

function isTicketDetailPath(pathname: string) {
  return (
    /^\/tickets\/[^/]+$/.test(pathname) ||
    /^\/officer\/inbox\/[^/]+$/.test(pathname) ||
    /^\/officer\/tickets\/[^/]+$/.test(pathname) ||
    /^\/manager\/tickets\/[^/]+$/.test(pathname)
  );
}

function managerTicketId(pathname: string) {
  const m = pathname.match(/^\/manager\/tickets\/([^/]+)$/);
  return m?.[1] ?? null;
}

function ticketDetailParent(pathname: string, managerTicketStatus?: string) {
  if (/^\/officer\/inbox\/[^/]+$/.test(pathname)) {
    return { href: "/officer/inbox", label: "กล่องงาน" };
  }
  if (pathname.startsWith("/officer")) {
    return { href: "/officer/tickets", label: "คำร้องทั้งหมด" };
  }
  if (pathname.startsWith("/manager")) {
    if (managerTicketStatus === "รออนุมัติ") {
      return { href: "/manager/approvals", label: "รออนุมัติ" };
    }
    return { href: "/manager/history", label: "ประวัติการอนุมัติ" };
  }
  return { href: "/tickets", label: "คำร้องของฉัน" };
}

function formatRelative(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function breadcrumbLabel(pathname: string) {
  if (BREADCRUMBS[pathname]) return BREADCRUMBS[pathname];
  if (isTicketDetailPath(pathname)) return "รายละเอียดคำร้อง";
  return null;
}

function isAdminPath(pathname: string) {
  return pathname.startsWith("/admin/");
}

function adminBreadcrumbLabel(pathname: string) {
  return BREADCRUMBS[pathname] ?? null;
}

interface AppNavbarProps {
  onMenuToggle?: () => void;
  menuOpen?: boolean;
}

export const AppNavbar = memo(function AppNavbar({ onMenuToggle, menuOpen = false }: AppNavbarProps) {
  const pathname = usePathname();
  const tickets = useTickets();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const unread = MOCK_NOTIFICATIONS.length;

  const managerId = managerTicketId(pathname);
  const managerTicketStatus = managerId
    ? tickets.find((t) => t.id === managerId)?.status
    : undefined;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const label = breadcrumbLabel(pathname);
  const detailParent = isTicketDetailPath(pathname)
    ? ticketDetailParent(pathname, managerTicketStatus)
    : null;
  const adminLabel = isAdminPath(pathname) ? adminBreadcrumbLabel(pathname) : null;

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-4 sm:px-6">
      <Button
        type="button"
        variant="ghost"
        className="shrink-0 px-2.5 lg:hidden"
        aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
        aria-expanded={menuOpen}
        onClick={onMenuToggle}
      >
        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <div className="min-w-0 flex-1">
        {detailParent && label === "รายละเอียดคำร้อง" ? (
          <nav aria-label="breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
            <Link
              href={detailParent.href}
              className="shrink-0 text-zinc-500 transition-colors hover:text-zinc-800"
            >
              {detailParent.label}
            </Link>
            <span className="shrink-0 text-zinc-300" aria-hidden>
              /
            </span>
            <span className="truncate font-medium text-zinc-700">รายละเอียดคำร้อง</span>
          </nav>
        ) : adminLabel ? (
          <nav aria-label="breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
            <span className="hidden shrink-0 text-zinc-500 sm:inline">ผู้ดูแลระบบ</span>
            <span className="hidden shrink-0 text-zinc-300 sm:inline" aria-hidden>
              /
            </span>
            <span className="truncate font-medium text-zinc-700">{adminLabel}</span>
          </nav>
        ) : label ? (
          <p className="truncate text-sm font-medium text-zinc-700">{label}</p>
        ) : null}
      </div>

      <div ref={rootRef} className="relative shrink-0">
          <Button
            type="button"
            variant="ghost"
            className="relative px-2.5"
            aria-label="แจ้งเตือน"
            aria-expanded={open}
            aria-haspopup="true"
            onClick={() => setOpen((v) => !v)}
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                {unread}
              </span>
            )}
          </Button>

          {open && (
            <div
              role="menu"
              aria-label="รายการแจ้งเตือน"
              className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
            >
              <div className="border-b border-zinc-100 px-4 py-3">
                <p className="text-sm font-semibold text-zinc-900">แจ้งเตือน</p>
                <p className="text-xs text-zinc-500">{unread} รายการใหม่</p>
              </div>
              <ul className="max-h-72 divide-y divide-zinc-100 overflow-y-auto">
                {MOCK_NOTIFICATIONS.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full px-4 py-3 text-left transition-colors hover:bg-zinc-50"
                      onClick={() => setOpen(false)}
                    >
                      <p className="text-sm text-zinc-800">{item.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-400">{formatRelative(item.at)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
    </header>
  );
});
