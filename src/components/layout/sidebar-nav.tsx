"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Inbox, Plus } from "lucide-react";
import { useMemo } from "react";
import { getInboxPendingTickets, getOfficerTickets } from "@/lib/officer-access";
import { useMockAuth } from "@/providers/mock-auth-provider";
import { useMockTickets } from "@/providers/mock-ticket-provider";

const staffNavItems = [
  { href: "/tickets", label: "คำร้องของฉัน", icon: ClipboardList },
  { href: "/tickets/new", label: "สร้างคำร้องใหม่", icon: Plus },
];

const officerNavItems = [
  { href: "/officer/inbox", label: "กล่องงาน", icon: Inbox },
  { href: "/officer/tickets", label: "คำร้องทั้งหมด", icon: ClipboardList },
];

function isActive(href: string, pathname: string) {
  if (href === "/tickets/new") return pathname === "/tickets/new";
  if (href === "/officer/inbox") return pathname === "/officer/inbox";
  if (href === "/officer/tickets") {
    return pathname === "/officer/tickets" || /^\/officer\/tickets\/[^/]+$/.test(pathname);
  }
  return pathname === "/tickets" || /^\/tickets\/(?!new)[^/]+$/.test(pathname);
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  badge,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: typeof ClipboardList;
  active: boolean;
  badge?: number;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-100 ${
        active
          ? "bg-blue-600 text-white"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-zinc-400"}`} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge != null && badge > 0 && (
        <span
          className={`flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
            active ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useMockAuth();
  const { tickets } = useMockTickets();

  const officerBadges = useMemo(() => {
    if (!user || user.role !== "officer") return { inbox: 0, all: 0 };
    const pending = getInboxPendingTickets(tickets, user).length;
    const all = getOfficerTickets(tickets, user).length;
    return { inbox: pending, all };
  }, [tickets, user]);

  const items = user?.role === "officer" ? officerNavItems : staffNavItems;

  return (
    <nav className="h-full min-h-0 overflow-y-auto px-4 py-4" aria-label="นำทาง">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        เมนูหลัก
      </p>
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={isActive(item.href, pathname)}
            badge={
              user?.role === "officer"
                ? item.href === "/officer/inbox"
                  ? officerBadges.inbox
                  : item.href === "/officer/tickets"
                    ? officerBadges.all
                    : undefined
                : undefined
            }
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </nav>
  );
}
