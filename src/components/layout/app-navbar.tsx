"use client";

import { memo, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu, X } from "lucide-react";
import { useTickets } from "@/providers/mock-ticket-provider";
import { useNotifications } from "@/providers/notification-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { parseNotificationDisplay } from "@/lib/notification-display";

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
  const router = useRouter();
  const tickets = useTickets();
  const { items, unread, refreshing, refetch, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const unreadInList = items.filter((n) => !n.readAt).length;
  const olderUnread = Math.max(0, unread - unreadInList);

  const managerId = managerTicketId(pathname);
  const managerTicketStatus = managerId
    ? tickets.find((t) => t.id === managerId)?.status
    : undefined;

  useEffect(() => {
    if (!open) return;
    void refetch();
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, refetch]);

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
            aria-label={
              unread > 0 ? `แจ้งเตือน, ยังไม่อ่าน ${unread} รายการ` : "แจ้งเตือน"
            }
            aria-expanded={open}
            aria-haspopup="true"
            onClick={() => setOpen((v) => !v)}
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Button>

          {open && (
            <div
              role="menu"
              aria-label="รายการแจ้งเตือน"
              className="absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
            >
              <div className="flex items-start justify-between gap-2 border-b border-zinc-100 bg-white px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900">แจ้งเตือน</p>
                  <p className="text-xs text-zinc-500">
                    {refreshing && items.length === 0
                      ? "กำลังโหลดรายการ..."
                      : unread > 0
                        ? olderUnread > 0
                          ? `ยังไม่อ่าน ${unread} รายการ (แสดงล่าสุด ${items.length} รายการ) — กดปุ่ม อ่านทั้งหมด เพื่อล้าง badge`
                          : `ยังไม่อ่าน ${unread} รายการ — คลิกรายการเพื่อเปิดและทำเครื่องหมายว่าอ่านแล้ว`
                        : items.length > 0
                          ? `อ่านครบแล้ว · แสดง ${items.length} รายการล่าสุด`
                          : "ยังไม่มีแจ้งเตือน"}
                  </p>
                </div>
                {unread > 0 && (
                  <button
                    type="button"
                    className="shrink-0 whitespace-nowrap text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline"
                    onClick={() => void markAllRead()}
                  >
                    อ่านทั้งหมด
                  </button>
                )}
              </div>
              <ul className="max-h-80 divide-y divide-zinc-100 overflow-y-auto">
                {refreshing && items.length === 0 ? (
                  <li className="px-4 py-6 text-center text-sm text-zinc-500">กำลังโหลด...</li>
                ) : items.length === 0 ? (
                  <li className="px-4 py-6 text-center text-sm text-zinc-500">ไม่มีแจ้งเตือน</li>
                ) : (
                  items.map((item) => {
                    const display = parseNotificationDisplay(item);
                    const isUnread = !item.readAt;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          role="menuitem"
                          aria-label={item.title}
                          className={`flex w-full gap-2.5 px-4 py-3 text-left transition-colors hover:bg-zinc-50 ${
                            isUnread ? "bg-sky-50" : "bg-white"
                          }`}
                          onClick={async () => {
                            if (isUnread) {
                              const ok = await markRead(item.id);
                              if (!ok) return;
                            }
                            setOpen(false);
                            router.push(item.href);
                          }}
                        >
                          <span
                            className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                              isUnread ? "bg-sky-500" : "bg-transparent"
                            }`}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <span className="min-w-0 text-sm font-medium leading-snug text-zinc-900">
                                {display.headline}
                              </span>
                              <Badge color={display.badgeColor} className="shrink-0">
                                {display.kindLabel}
                              </Badge>
                            </span>
                            {display.subject ? (
                              <span className="mt-1 block truncate text-sm text-zinc-600">
                                {display.subject}
                              </span>
                            ) : null}
                            <span className="mt-0.5 block text-xs text-zinc-400">{display.meta}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
              {refreshing && items.length > 0 ? (
                <p className="border-t border-zinc-100 px-4 py-2 text-center text-xs text-zinc-400">
                  กำลังอัปเดต...
                </p>
              ) : null}
            </div>
          )}
        </div>
    </header>
  );
});
