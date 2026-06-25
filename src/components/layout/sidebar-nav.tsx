"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardCheck,
  ClipboardList,
  History,
  Inbox,
  LayoutDashboard,
  Plus,
  ScrollText,
  Users,
} from "lucide-react";
import { getInboxPendingTickets } from "@/lib/officer-access";
import { getPendingApprovalTickets } from "@/lib/manager-access";
import type { User } from "@/lib/types/ticket";
import { useMockAuth } from "@/providers/mock-auth-provider";
import { useTickets } from "@/providers/mock-ticket-provider";

const staffNavItems = [
  { href: "/tickets", label: "คำร้องของฉัน", icon: ClipboardList },
  { href: "/tickets/new", label: "สร้างคำร้องใหม่", icon: Plus },
];

const officerNavItems = [
  { href: "/officer/inbox", label: "กล่องงาน", icon: Inbox },
  { href: "/officer/tickets", label: "คำร้องทั้งหมด", icon: ClipboardList },
];

const managerNavItems = [
  { href: "/manager/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
  { href: "/manager/approvals", label: "รออนุมัติ", icon: ClipboardCheck },
  { href: "/manager/history", label: "ประวัติการอนุมัติ", icon: History },
];

const adminNavItems = [
  { href: "/admin/users", label: "ผู้ใช้และบทบาท", icon: Users },
  { href: "/admin/departments", label: "จัดการแผนก", icon: Building2 },
  { href: "/admin/audit-logs", label: "Audit log", icon: ScrollText },
];

function managerTicketId(pathname: string) {
  const m = pathname.match(/^\/manager\/tickets\/([^/]+)$/);
  return m?.[1] ?? null;
}

function isActive(href: string, pathname: string, managerTicketStatus?: string) {
  if (href === "/tickets/new") return pathname === "/tickets/new";
  if (href === "/officer/inbox") {
    return pathname === "/officer/inbox" || /^\/officer\/inbox\/[^/]+$/.test(pathname);
  }
  if (href === "/officer/tickets") {
    return pathname === "/officer/tickets" || /^\/officer\/tickets\/[^/]+$/.test(pathname);
  }
  if (href === "/manager/dashboard") return pathname === "/manager/dashboard";
  if (href === "/manager/approvals") {
    if (pathname === "/manager/approvals") return true;
    const id = managerTicketId(pathname);
    return id != null && managerTicketStatus === "รออนุมัติ";
  }
  if (href === "/manager/history") {
    if (pathname === "/manager/history") return true;
    const id = managerTicketId(pathname);
    return id != null && managerTicketStatus !== "รออนุมัติ";
  }
  if (href === "/admin/users") return pathname === "/admin/users";
  if (href === "/admin/departments") return pathname === "/admin/departments";
  if (href === "/admin/audit-logs") return pathname === "/admin/audit-logs";
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

function NavList({
  items,
  pathname,
  badgeFor,
  onNavigate,
  managerTicketStatus,
}: {
  items: typeof staffNavItems;
  pathname: string;
  badgeFor?: (href: string) => number | undefined;
  onNavigate?: () => void;
  managerTicketStatus?: string;
}) {
  return (
    <>
      {items.map((item) => (
        <NavLink
          key={item.href}
          {...item}
          active={isActive(item.href, pathname, managerTicketStatus)}
          badge={badgeFor?.(item.href)}
          onNavigate={onNavigate}
        />
      ))}
    </>
  );
}

function OfficerSidebarLinks({
  user,
  pathname,
  onNavigate,
}: {
  user: User;
  pathname: string;
  onNavigate?: () => void;
}) {
  const tickets = useTickets();
  const inboxPending = useMemo(
    () => getInboxPendingTickets(tickets, user).length,
    [tickets, user],
  );

  return (
    <NavList
      items={officerNavItems}
      pathname={pathname}
      onNavigate={onNavigate}
      badgeFor={(href) => (href === "/officer/inbox" ? inboxPending : undefined)}
    />
  );
}

function ManagerSidebarLinks({
  user,
  pathname,
  onNavigate,
}: {
  user: User;
  pathname: string;
  onNavigate?: () => void;
}) {
  const tickets = useTickets();
  const pending = useMemo(
    () => getPendingApprovalTickets(tickets, user).length,
    [tickets, user],
  );

  const detailId = managerTicketId(pathname);
  const managerTicketStatus = detailId
    ? tickets.find((t) => t.id === detailId)?.status
    : undefined;

  return (
    <NavList
      items={managerNavItems}
      pathname={pathname}
      onNavigate={onNavigate}
      managerTicketStatus={managerTicketStatus}
      badgeFor={(href) => (href === "/manager/approvals" ? pending : undefined)}
    />
  );
}

function AdminSidebarLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <NavList items={adminNavItems} pathname={pathname} onNavigate={onNavigate} />
  );
}

function SidebarNavInner({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useMockAuth();

  return (
    <nav className="h-full min-h-0 overflow-y-auto px-4 py-4" aria-label="นำทาง">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        เมนูหลัก
      </p>
      <div className="flex flex-col gap-1">
        {user?.role === "admin" ? (
          <AdminSidebarLinks pathname={pathname} onNavigate={onNavigate} />
        ) : user?.role === "manager" ? (
          <ManagerSidebarLinks user={user} pathname={pathname} onNavigate={onNavigate} />
        ) : user?.role === "officer" ? (
          <OfficerSidebarLinks user={user} pathname={pathname} onNavigate={onNavigate} />
        ) : (
          <NavList items={staffNavItems} pathname={pathname} onNavigate={onNavigate} />
        )}
      </div>
    </nav>
  );
}

export const SidebarNav = memo(SidebarNavInner);
