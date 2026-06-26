"use client";

import { X } from "lucide-react";
import { ROLE_TAB_LABELS } from "@/lib/admin-ui";
import type { UserRole } from "@/lib/types/ticket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalPortal } from "@/components/ui/modal-portal";
import { Select } from "@/components/ui/select";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "staff", label: ROLE_TAB_LABELS.staff },
  { value: "officer", label: ROLE_TAB_LABELS.officer },
  { value: "manager", label: ROLE_TAB_LABELS.manager },
  { value: "admin", label: ROLE_TAB_LABELS.admin },
];

const PREFIX_OPTIONS = [
  { value: "นาย", label: "นาย" },
  { value: "นาง", label: "นาง" },
  { value: "นางสาว", label: "นางสาว" },
];

export interface CreateUserFormValue {
  prefix: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  departmentId: string;
}

export interface CreateUserFieldErrors {
  prefix?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  departmentId?: string;
  form?: string;
}

interface CreateUserModalProps {
  open: boolean;
  value: CreateUserFormValue;
  deptOptions: { value: string; label: string }[];
  fieldErrors?: CreateUserFieldErrors;
  onClose: () => void;
  onChange: (patch: Partial<CreateUserFormValue>) => void;
  onSubmit: () => void;
}

export function CreateUserModal({
  open,
  value,
  deptOptions,
  fieldErrors = {},
  onClose,
  onChange,
  onSubmit,
}: CreateUserModalProps) {
  if (!open) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <button
          type="button"
          className="absolute inset-0 bg-zinc-900/45 backdrop-blur-[2px]"
          aria-label="ปิด"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-user-title"
          className="ioc-card relative z-10 flex max-h-[min(92vh,760px)] w-full max-w-xl flex-col overflow-hidden"
        >
          <div className="relative border-b border-zinc-100 px-6 py-5">
            <h2 id="create-user-title" className="text-lg font-semibold text-zinc-900">
              เพิ่มผู้ใช้ใหม่
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">สร้างบัญชีผู้ใช้ใหม่</p>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
              aria-label="ปิด"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <div className="flex-1 space-y-4 overflow-x-hidden overflow-y-auto px-6 py-5">
              {fieldErrors.form && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{fieldErrors.form}</p>
              )}
              <Select
                label="คำนำหน้า"
                required
                className="w-full"
                value={value.prefix}
                onChange={(e) => onChange({ prefix: e.target.value })}
                options={PREFIX_OPTIONS}
                error={fieldErrors.prefix}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="ชื่อ"
                  required
                  className="w-full"
                  value={value.firstName}
                  onChange={(e) => onChange({ firstName: e.target.value })}
                  placeholder="ชื่อจริง"
                  autoComplete="given-name"
                  error={fieldErrors.firstName}
                />
                <Input
                  label="นามสกุล"
                  required
                  className="w-full"
                  value={value.lastName}
                  onChange={(e) => onChange({ lastName: e.target.value })}
                  placeholder="นามสกุล"
                  autoComplete="family-name"
                  error={fieldErrors.lastName}
                />
              </div>

              <Input
                label="อีเมล"
                required
                type="email"
                className="w-full"
                value={value.email}
                onChange={(e) => onChange({ email: e.target.value })}
                placeholder="name@company.com"
                autoComplete="email"
                error={fieldErrors.email}
              />

              <Input
                label="รหัสผ่าน"
                required
                type="password"
                className="w-full"
                value={value.password}
                onChange={(e) => onChange({ password: e.target.value })}
                autoComplete="new-password"
                error={fieldErrors.password}
              />

              <Input
                label="ยืนยันรหัสผ่าน"
                required
                type="password"
                className="w-full"
                value={value.confirmPassword}
                onChange={(e) => onChange({ confirmPassword: e.target.value })}
                placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                autoComplete="new-password"
                error={fieldErrors.confirmPassword}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="บทบาท"
                  className="w-full"
                  value={value.role}
                  onChange={(e) => onChange({ role: e.target.value as UserRole })}
                  options={ROLE_OPTIONS}
                />
                <Select
                  label="ฝ่าย"
                  className="w-full"
                  value={value.departmentId}
                  onChange={(e) => onChange({ departmentId: e.target.value })}
                  options={deptOptions}
                  error={fieldErrors.departmentId}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
              <Button type="button" variant="secondary" onClick={onClose}>
                ยกเลิก
              </Button>
              <Button type="submit">เพิ่มผู้ใช้</Button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
