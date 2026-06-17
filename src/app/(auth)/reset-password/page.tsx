"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/layout/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("รหัสผ่านไม่ตรงกัน"); return; }
    if (!username.trim() || !newPassword) { setError("กรุณากรอกข้อมูลให้ครบ"); return; }
    setError("");
    setSubmitted(true);
  }

  return (
    <AuthCard title="รีเซ็ตรหัสผ่าน" subtitle="พนักงาน — IOC System">
      {submitted ? (
        <div className="space-y-4 text-center">
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">รีเซ็ตรหัสผ่านสำเร็จ (mock)</div>
          <Link href="/login"><Button className="w-full">กลับไปหน้าเข้าสู่ระบบ</Button></Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="ชื่อผู้ใช้" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="staff1" />
          <Input label="รหัสผ่านใหม่" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <Input label="ยืนยันรหัสผ่านใหม่" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={error} />
          <Button type="submit" className="w-full">รีเซ็ตรหัสผ่าน</Button>
          <p className="text-center text-sm text-zinc-500">
            <Link href="/login" className="text-blue-600 hover:underline">กลับไปหน้าเข้าสู่ระบบ</Link>
          </p>
        </form>
      )}
    </AuthCard>
  );
}
