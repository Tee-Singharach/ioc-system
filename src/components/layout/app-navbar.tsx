"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// ponytail: mock until notification API exists
const MOCK_NOTIFICATIONS = [
  { id: "n1", title: "คำร้อง IOC-2024-003 เปลี่ยนเป็นกำลังดำเนินการ", at: "2024-06-17T09:30:00" },
  { id: "n2", title: "คำร้อง IOC-2024-001 ได้รับการอนุมัติ", at: "2024-06-16T14:15:00" },
  { id: "n3", title: "มีคำร้องใหม่รอดำเนินการ", at: "2024-06-15T11:00:00" },
] as const;

const BREADCRUMBS: Record<string, string> = {
  "/tickets": "คำร้องทั้งหมด",
  "/tickets/new": "สร้างคำร้องใหม่",
  "/officer/inbox": "กล่องงาน",
  "/officer/tickets": "คำร้องทั้งหมด",
  "/settings": "การตั้งค่า",
};

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
  if (/^\/tickets\/[^/]+$/.test(pathname)) return "รายละเอียดคำร้อง";
  if (/^\/officer\/tickets\/[^/]+$/.test(pathname)) return "รายละเอียดคำร้อง";
  return "IOC System";
}

interface AppNavbarProps {
  onMenuToggle?: () => void;
  menuOpen?: boolean;
}

export function AppNavbar({ onMenuToggle, menuOpen = false }: AppNavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const unread = MOCK_NOTIFICATIONS.length;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-zinc-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 lg:hidden">
        <Button
          type="button"
          variant="ghost"
          className="shrink-0 px-2.5"
          aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
          aria-expanded={menuOpen}
          onClick={onMenuToggle}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

        {breadcrumbLabel(pathname) === "รายละเอียดคำร้อง" ? (
          <nav aria-label="breadcrumb" className="hidden min-w-0 items-center gap-2 text-sm lg:flex">
            <Link
              href={pathname.startsWith("/officer") ? "/officer/tickets" : "/tickets"}
              className="text-zinc-500 transition-colors hover:text-zinc-800"
            >
              {pathname.startsWith("/officer") ? "คำร้องทั้งหมด" : "คำร้องทั้งหมด"}
            </Link>
            <span className="text-zinc-300" aria-hidden>
              /
            </span>
            <span className="truncate font-medium text-zinc-700">รายละเอียดคำร้อง</span>
          </nav>
        ) : (
          <p className="hidden truncate text-sm font-medium text-zinc-500 lg:block">
            {breadcrumbLabel(pathname)}
          </p>
        )}

      <div ref={rootRef} className="relative ml-auto">
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
}
