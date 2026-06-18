"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useMockAuth } from "@/providers/mock-auth-provider";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarBottom } from "@/components/layout/sidebar-bottom";
import { AppNavbar } from "@/components/layout/app-navbar";

function SidebarBrand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
        IOC
      </div>
      <div className="min-w-0">
        <p className="truncate text-base font-bold leading-tight text-zinc-900">IOC System</p>
        <p className="text-xs text-zinc-500">ระบบคำร้องภายใน</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useMockAuth();
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 });
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {menuOpen && (
        <button
          type="button"
          aria-label="ปิดเมนู"
          className="fixed inset-0 z-30 bg-zinc-900/40 lg:hidden"
          onClick={closeMenu}
        />
      )}

      <aside
        aria-label="เมนูหลัก"
        className={`fixed inset-y-0 left-0 z-40 flex h-svh w-64 max-w-[min(100vw,16rem)] flex-col overflow-hidden border-r border-zinc-200 bg-white transition-transform duration-200 ease-out lg:z-30 lg:max-w-none lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="shrink-0 px-4 py-5">
          <SidebarBrand />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <SidebarNav onNavigate={closeMenu} />
        </div>
        <SidebarBottom user={user} onLogout={logout} onNavigate={closeMenu} />
      </aside>

      <div className="fixed inset-y-0 left-0 right-0 flex flex-col overflow-hidden bg-zinc-50/80 lg:left-64">
        <AppNavbar onMenuToggle={() => setMenuOpen((open) => !open)} menuOpen={menuOpen} />
        <main
          ref={mainRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
        >
          <div className="mx-auto w-full max-w-[90rem] p-4 pb-8 sm:p-6 sm:pb-10">{children}</div>
        </main>
      </div>
    </>
  );
}
