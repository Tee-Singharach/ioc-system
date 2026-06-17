"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/layout/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearSession } from "@/lib/mock/session";
import { useMockAuth } from "@/providers/mock-auth-provider";

export default function LoginPage() {
  const { login, user } = useMockAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user?.role === "staff") {
      router.replace("/tickets");
    } else if (user) {
      clearSession();
    }
  }, [user, router]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    login(username, password);
  }

  if (user?.role === "staff") {
    return (
      <div className="flex min-h-full items-center justify-center text-sm text-zinc-500">
        กำลังเข้าสู่ระบบ...
      </div>
    );
  }

  return (
    <AuthCard title="เข้าสู่ระบบ" subtitle="พนักงาน — IOC System">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="ชื่อผู้ใช้" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="staff1" autoComplete="username" />
        <Input label="รหัสผ่าน" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
        <Button type="submit" className="w-full">เข้าสู่ระบบ</Button>
        <p className="text-center text-sm text-zinc-500">
          <Link href="/reset-password" className="text-blue-600 hover:underline">ลืมรหัสผ่าน?</Link>
        </p>
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-center text-xs text-blue-700">Mock: กรอกอะไรก็ได้ (เช่น staff1)</p>
      </form>
    </AuthCard>
  );
}
