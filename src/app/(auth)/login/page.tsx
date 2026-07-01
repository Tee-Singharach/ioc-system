"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/layout/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROLE_TAB_LABELS } from "@/lib/admin-ui";
import { homePathForRole } from "@/lib/officer-access";
import { clearSession } from "@/lib/mock/session";
import { useMockAuth } from "@/providers/mock-auth-provider";
import type { UserRole } from "@/lib/types/ticket";

const DEMO_PASSWORD = "password123";

const QUICK_LOGINS: { username: string; role: UserRole; label: string }[] = [
  { username: "staff1", role: "staff", label: ROLE_TAB_LABELS.staff },
  { username: "officer1", role: "officer", label: ROLE_TAB_LABELS.officer },
  { username: "manager1", role: "manager", label: ROLE_TAB_LABELS.manager },
  { username: "admin1", role: "admin", label: ROLE_TAB_LABELS.admin },
];

export default function LoginPage() {
  const { login, user, sessionReady } = useMockAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (!sessionReady || !user) return;
    if (user.role === "staff" || user.role === "officer" || user.role === "manager" || user.role === "admin") {
      const home = homePathForRole(user.role);
      if (window.location.pathname !== home) {
        window.location.replace(home);
      }
      return;
    }
    clearSession();
  }, [user, sessionReady]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoginError("");
    const ok = await login(username, password);
    if (!ok) setLoginError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  }

  if (user?.role === "staff" || user?.role === "officer" || user?.role === "manager" || user?.role === "admin") {
    return (
      <div className="flex min-h-full items-center justify-center text-sm text-zinc-500">
        กำลังเข้าสู่ระบบ...
      </div>
    );
  }

  return (
    <AuthCard title="เข้าสู่ระบบ" subtitle="IOC System">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="ชื่อผู้ใช้"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="ชื่อผู้ใช้"
          autoComplete="username"
        />
        <Input
          label="รหัสผ่าน"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />
        {loginError ? <p className="text-sm text-red-600">{loginError}</p> : null}
        <Button type="submit" className="w-full">
          เข้าสู่ระบบ
        </Button>
        <p className="text-center text-sm text-zinc-500">
          <Link href="/reset-password" className="text-blue-600 hover:underline">
            ลืมรหัสผ่าน?
          </Link>
        </p>
      </form>

      <div className="mt-6 border-t border-zinc-100 pt-5">
        <p className="mb-1 text-center text-xs font-medium text-zinc-500">ทดลองใช้งาน</p>
        <p className="mb-3 text-center text-xs text-zinc-400">รหัสผ่าน: {DEMO_PASSWORD}</p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_LOGINS.map((item) => (
            <Button
              key={item.role}
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => void login(item.username, DEMO_PASSWORD)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>
    </AuthCard>
  );
}
