"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { KeyRound, Pencil, User } from "lucide-react";
import type { UserRole } from "@/lib/types/ticket";
import { useCatalog } from "@/providers/catalog-provider";
import { useMockAuth } from "@/providers/mock-auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";

const ROLE_LABELS: Record<UserRole, string> = {
  staff: "พนักงาน",
  officer: "เจ้าหน้าที่",
  manager: "ผู้จัดการ",
  admin: "ผู้ดูแลระบบ",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`;
  return name.slice(0, 2);
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-center sm:gap-4">
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className="text-sm font-medium text-zinc-900">{children}</dd>
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateName } = useMockAuth();
  const { departments } = useCatalog();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameSaved, setNameSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const departmentName =
    departments.find((d) => d.id === user?.departmentId)?.name ?? "—";

  if (!user) return null;

  const profile = user;

  function startEditName() {
    setNameDraft(profile.name);
    setNameError("");
    setNameSaved(false);
    setEditingName(true);
  }

  function cancelEditName() {
    setEditingName(false);
    setNameDraft("");
    setNameError("");
  }

  function saveName() {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameError("กรุณากรอกชื่อ-นามสกุล");
      return;
    }
    if (trimmed === profile.name) {
      setEditingName(false);
      return;
    }
    updateName(trimmed);
    setNameError("");
    setEditingName(false);
    setNameSaved(true);
  }

  function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }
    if (newPassword === currentPassword) {
      setError("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสปัจจุบัน");
      return;
    }
    // TODO: replace with real password change API
    setError("");
    setSubmitted(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="ตั้งค่า"
        description="จัดการโปรไฟล์และความปลอดภัยของบัญชี"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-zinc-900">โปรไฟล์</h2>
            </div>
            {editingName ? (
              <div className="flex shrink-0 gap-2">
                <Button type="button" className="px-3 py-1.5" onClick={saveName}>
                  บันทึก
                </Button>
                <Button type="button" variant="secondary" className="px-3 py-1.5" onClick={cancelEditName}>
                  ยกเลิก
                </Button>
              </div>
            ) : (
              <Button type="button" variant="secondary" className="px-3 py-1.5" onClick={startEditName}>
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                แก้ไข
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="flex items-center gap-4">
            <div
              aria-hidden
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700"
            >
              {initials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-bold text-zinc-900">{user.name}</p>
              <p className="truncate text-sm text-zinc-500">@{user.username}</p>
            </div>
          </div>
          {nameSaved && !editingName && (
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              บันทึกชื่อสำเร็จ
            </div>
          )}
          <dl className="space-y-4 border-t border-zinc-100 pt-6">
            <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-start sm:gap-4">
              <dt className="text-sm text-zinc-500 sm:pt-2">ชื่อ-นามสกุล</dt>
              <dd className="min-w-0">
                {editingName ? (
                  <div className="max-w-md space-y-2">
                    <Input
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveName();
                        }
                        if (e.key === "Escape") cancelEditName();
                      }}
                      autoComplete="name"
                      error={nameError}
                    />
                  </div>
                ) : (
                  <span className="text-sm font-medium text-zinc-900">{user.name}</span>
                )}
              </dd>
            </div>
            <InfoRow label="ชื่อผู้ใช้">
              <span className="font-mono text-sm">@{user.username}</span>
            </InfoRow>
            <InfoRow label="บทบาท">
              <Badge color="blue">{ROLE_LABELS[user.role]}</Badge>
            </InfoRow>
            <InfoRow label="แผนก">{departmentName}</InfoRow>
            <InfoRow label="รหัสผู้ใช้">
              <span className="font-mono text-xs text-zinc-600">{user.id}</span>
            </InfoRow>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-900">ความปลอดภัย</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {submitted ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                เปลี่ยนรหัสผ่านสำเร็จ (mock)
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSubmitted(false)}
              >
                เปลี่ยนรหัสผ่านอีกครั้ง
              </Button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
              <Input
                label="รหัสผ่านปัจจุบัน"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
              <Input
                label="รหัสผ่านใหม่"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <Input
                label="ยืนยันรหัสผ่านใหม่"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                error={error}
              />
              <Button type="submit">
                <KeyRound className="h-4 w-4" />
                เปลี่ยนรหัสผ่าน
              </Button>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
