"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, PlusCircle } from "lucide-react";

const navItems = [
  { href: "/tickets", label: "คำร้องของฉัน", icon: ClipboardList },
  { href: "/tickets/new", label: "สร้างคำร้อง", icon: PlusCircle },
];

function isActive(href: string, pathname: string) {
  if (href === "/tickets/new") return pathname === "/tickets/new";
  return pathname === "/tickets" || /^\/tickets\/(?!new)[^/]+$/.test(pathname);
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        เมนูหลัก
      </p>
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = isActive(href, pathname);
        return (
          <Link
            key={href}
            href={href}
            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none ${
              active
                ? "bg-blue-600 text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white/90" />
            )}
            <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-zinc-400 group-hover:text-zinc-600"}`} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
