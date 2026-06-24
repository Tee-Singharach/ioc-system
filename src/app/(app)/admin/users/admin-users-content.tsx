"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  ClipboardList,
  KeyRound,
  Pencil,
  Plus,
  Shield,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSearch } from "@/components/admin/admin-search";
import { FilterPills } from "@/components/admin/filter-pills";
import { RoleBadge } from "@/components/admin/role-badge";
import {
  ROLE_STAT_META,
  ROLE_TAB_LABELS,
  mockUserEmail,
} from "@/lib/admin-ui";
import { userInitials } from "@/lib/ticket-progress";
import { actionAdminResetUserPassword } from "@/lib/actions/data";
import type { ManagedUser } from "@/lib/types/admin";
import type { UserRole } from "@/lib/types/ticket";
import { useMockAdmin } from "@/providers/mock-admin-provider";
import { useMockAuth } from "@/providers/mock-auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { CreateUserModal, type CreateUserFieldErrors } from "@/components/admin/create-user-modal";
import { Input } from "@/components/ui/input";
import { ModalPortal } from "@/components/ui/modal-portal";
import { Select } from "@/components/ui/select";

type RoleFilter = UserRole | "all";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "staff", label: ROLE_TAB_LABELS.staff },
  { value: "officer", label: ROLE_TAB_LABELS.officer },
  { value: "manager", label: ROLE_TAB_LABELS.manager },
  { value: "admin", label: ROLE_TAB_LABELS.admin },
];

const ROLE_ICONS = {
  staff: UserRound,
  officer: ClipboardList,
  manager: BarChart3,
  admin: Shield,
} as const;

function emailToUsername(email: string) {
  const local = email.trim().toLowerCase().split("@")[0] ?? "";
  return local.replace(/[^a-z0-9_]/g, "");
}

const EMPTY_USER = {
  prefix: "นาย",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "staff" as UserRole,
  departmentId: "dept-it",
};

export default function AdminUsersContent() {
  const { user } = useMockAuth();
  const {
    activeUsers,
    activeDepartments,
    updateUserRole,
    updateUserDepartment,
    softDeleteUser,
    createUser,
  } = useMockAdmin();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ManagedUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<ManagedUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetErrors, setResetErrors] = useState<{ password?: string; confirm?: string; form?: string }>({});
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [editPromptUser, setEditPromptUser] = useState<ManagedUser | null>(null);
  const [resetPromptUser, setResetPromptUser] = useState<ManagedUser | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CreateUserFieldErrors>({});
  const [newUser, setNewUser] = useState(EMPTY_USER);
  const [editForm, setEditForm] = useState({
    name: "",
    role: "staff" as UserRole,
    departmentId: "dept-it",
  });

  const deptMap = useMemo(
    () => new Map(activeDepartments.map((d) => [d.id, d.name])),
    [activeDepartments],
  );
  const deptOptions = activeDepartments.map((d) => ({ value: d.id, label: d.name }));

  const roleCounts = useMemo(() => {
    const counts: Record<UserRole, number> = {
      staff: 0,
      officer: 0,
      manager: 0,
      admin: 0,
    };
    for (const u of activeUsers) counts[u.role]++;
    return counts;
  }, [activeUsers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeUsers.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        mockUserEmail(u.username).includes(q) ||
        (deptMap.get(u.departmentId) ?? "").toLowerCase().includes(q)
      );
    });
  }, [activeUsers, roleFilter, search, deptMap]);

  if (!user) return null;

  function validateCreateForm(): CreateUserFieldErrors {
    const next: CreateUserFieldErrors = {};
    if (!newUser.prefix.trim()) next.prefix = "กรุณาเลือกคำนำหน้า";
    if (!newUser.firstName.trim()) next.firstName = "กรุณากรอกชื่อ";
    if (!newUser.lastName.trim()) next.lastName = "กรุณากรอกนามสกุล";
    const email = newUser.email.trim().toLowerCase();
    if (!email) next.email = "กรุณากรอกอีเมล";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "รูปแบบอีเมลไม่ถูกต้อง";
    else if (!emailToUsername(email)) next.email = "อีเมลต้องมีชื่อผู้ใช้ก่อน @";
    if (!newUser.password.trim()) next.password = "กรุณากรอกรหัสผ่าน";
    else if (newUser.password.length < 6) next.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    if (!newUser.confirmPassword.trim()) next.confirmPassword = "กรุณายืนยันรหัสผ่าน";
    else if (newUser.password !== newUser.confirmPassword) {
      next.confirmPassword = "รหัสผ่านไม่ตรงกัน";
    }
    return next;
  }

  async function handleCreate() {
    const nextFieldErrors = validateCreateForm();
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }
    setFieldErrors({});
    const username = emailToUsername(newUser.email);
    const name = [newUser.prefix, newUser.firstName, newUser.lastName]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" ");
    const err = await createUser(
      {
        username,
        name,
        role: newUser.role,
        departmentId: newUser.departmentId,
      },
      newUser.password,
    );
    if (err) {
      if (err.includes("ชื่อผู้ใช้")) setFieldErrors({ email: err });
      else setFieldErrors({ firstName: err });
      return;
    }
    setCreateOpen(false);
    setNewUser(EMPTY_USER);
  }

  function openEdit(target: ManagedUser) {
    setEditTarget(target);
    setEditForm({
      name: target.name,
      role: target.role,
      departmentId: target.departmentId,
    });
  }

  function openReset(target: ManagedUser) {
    setResetTarget(target);
    setResetPassword("");
    setResetConfirm("");
    setResetErrors({});
  }

  function editHasChanges() {
    if (!editTarget) return false;
    return (
      editForm.role !== editTarget.role || editForm.departmentId !== editTarget.departmentId
    );
  }

  async function handleSaveEdit() {
    if (!editTarget) return;
    if (!editHasChanges()) {
      setEditTarget(null);
      return;
    }
    if (editForm.role !== editTarget.role) {
      const err = await updateUserRole(editTarget.id, editForm.role);
      if (err) return;
    }
    if (editForm.departmentId !== editTarget.departmentId) {
      const err = await updateUserDepartment(editTarget.id, editForm.departmentId);
      if (err) return;
    }
    setEditTarget(null);
  }

  async function handleResetPassword() {
    if (!user || !resetTarget) return;
    const next: { password?: string; confirm?: string; form?: string } = {};
    if (!resetPassword.trim()) next.password = "กรุณากรอกรหัสผ่าน";
    else if (resetPassword.length < 6) next.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    if (!resetConfirm.trim()) next.confirm = "กรุณายืนยันรหัสผ่าน";
    else if (resetPassword !== resetConfirm) next.confirm = "รหัสผ่านไม่ตรงกัน";
    if (Object.keys(next).length > 0) {
      setResetErrors(next);
      return;
    }
    if (resetSubmitting) return;
    setResetSubmitting(true);
    setResetErrors({});
    const result = await actionAdminResetUserPassword(user, resetTarget.id, resetPassword);
    setResetSubmitting(false);
    if (!result.ok) {
      setResetErrors({ form: result.error });
      return;
    }
    setResetTarget(null);
    setResetPassword("");
    setResetConfirm("");
  }

  const deleteUser = activeUsers.find((u) => u.id === deleteTarget);

  const roleFilterOptions: { value: RoleFilter; label: string; count?: number }[] = [
    { value: "all", label: ROLE_TAB_LABELS.all, count: activeUsers.length },
    ...(["staff", "officer", "manager", "admin"] as UserRole[]).map((r) => ({
      value: r,
      label: ROLE_TAB_LABELS[r],
      count: roleCounts[r],
    })),
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Users}
        title="ผู้ใช้และบทบาท"
        description="จัดการบัญชีผู้ใช้และบทบาทในระบบ"
        actions={
          <Button
            type="button"
            onClick={() => {
              setFieldErrors({});
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            เพิ่มผู้ใช้
          </Button>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {(["staff", "officer", "manager", "admin"] as UserRole[]).map((role) => {
          const meta = ROLE_STAT_META[role];
          const Icon = ROLE_ICONS[role];
          return (
            <Card key={role}>
              <CardBody className="flex min-h-[7.5rem] items-start gap-4 px-6 py-6">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${meta.iconBg}`}
                  aria-hidden
                >
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-zinc-900">{meta.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-500">{meta.description}</p>
                </div>
                <span
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-lg font-bold ${meta.countBg}`}
                >
                  {roleCounts[role]}
                </span>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardBody className="p-0">
          <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <AdminSearch
              value={search}
              onChange={setSearch}
              placeholder="ค้นหาชื่อ หรืออีเมล..."
              className="lg:max-w-xs"
            />
            <FilterPills options={roleFilterOptions} value={roleFilter} onChange={setRoleFilter} />
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-300">
                <UserRound className="h-8 w-8" strokeWidth={1.5} aria-hidden />
              </div>
              <p className="mt-5 text-sm font-medium text-zinc-700">ไม่พบผู้ใช้</p>
              <p className="mt-1 text-sm text-zinc-500">ลองเปลี่ยนตัวกรองหรือเพิ่มผู้ใช้ใหม่</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50/60">
                  <tr>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-zinc-500">
                      ผู้ใช้
                    </th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-zinc-500">
                      บทบาท
                    </th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-zinc-500">
                      ฝ่าย
                    </th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-zinc-500">
                      อีเมล
                    </th>
                    <th scope="col" className="w-28 px-5 py-3" aria-hidden />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filtered.map((u) => {
                    const avatarClass = ROLE_STAT_META[u.role].iconBg;
                    return (
                      <tr key={u.id} className="transition-colors hover:bg-zinc-50/80">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${avatarClass}`}
                              aria-hidden
                            >
                              {userInitials(u.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-zinc-900">{u.name}</p>
                              <p className="font-mono text-xs text-zinc-400">{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="px-5 py-4 text-zinc-700">
                          {deptMap.get(u.departmentId) ?? "—"}
                        </td>
                        <td className="px-5 py-4 text-zinc-600">{mockUserEmail(u.username)}</td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              disabled={u.id === user.id}
                              onClick={() => setEditPromptUser(u)}
                              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={`แก้ไข ${u.name}`}
                            >
                              <Pencil className="h-4 w-4" aria-hidden />
                            </button>
                            {u.id !== user.id && u.role !== "admin" && (
                              <button
                                type="button"
                                onClick={() => setResetPromptUser(u)}
                                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-amber-50 hover:text-amber-700"
                                aria-label={`รีเซ็ตรหัสผ่าน ${u.name}`}
                              >
                                <KeyRound className="h-4 w-4" aria-hidden />
                              </button>
                            )}
                            {u.id !== user.id && u.role !== "admin" && (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(u.id)}
                                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                aria-label={`ลบ ${u.name}`}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <CreateUserModal
        open={createOpen}
        value={newUser}
        deptOptions={deptOptions}
        fieldErrors={fieldErrors}
        onChange={(patch) => {
          setNewUser((s) => ({ ...s, ...patch }));
          setFieldErrors((prev) => {
            const next = { ...prev };
            if (patch.prefix !== undefined) delete next.prefix;
            if (patch.firstName !== undefined) delete next.firstName;
            if (patch.lastName !== undefined) delete next.lastName;
            if (patch.email !== undefined) delete next.email;
            if (patch.password !== undefined) delete next.password;
            if (patch.confirmPassword !== undefined) delete next.confirmPassword;
            return next;
          });
        }}
        onClose={() => {
          setCreateOpen(false);
          setFieldErrors({});
        }}
        onSubmit={handleCreate}
      />

      {editTarget && (
        <UserFormModal title="แก้ไขผู้ใช้" onClose={() => setEditTarget(null)} onSubmit={handleSaveEdit}>
          <Input label="ชื่อ-นามสกุล" value={editForm.name} disabled />
          <p className="-mt-2 text-xs text-zinc-400">ชื่อผู้ใช้: {editTarget.username}</p>
          <Select
            label="บทบาท"
            value={editForm.role}
            disabled={editTarget.id === user.id}
            onChange={(e) => setEditForm((s) => ({ ...s, role: e.target.value as UserRole }))}
            options={ROLE_OPTIONS}
          />
          <Select
            label="ฝ่าย"
            value={editForm.departmentId}
            disabled={editTarget.id === user.id}
            onChange={(e) => setEditForm((s) => ({ ...s, departmentId: e.target.value }))}
            options={deptOptions}
          />
        </UserFormModal>
      )}

      {resetTarget && (
        <UserFormModal
          title="รีเซ็ตรหัสผ่าน"
          submitLabel={resetSubmitting ? "กำลังบันทึก..." : "รีเซ็ตรหัสผ่าน"}
          submitDisabled={resetSubmitting}
          onClose={() => {
            if (resetSubmitting) return;
            setResetTarget(null);
            setResetErrors({});
          }}
          onSubmit={() => void handleResetPassword()}
        >
          <p className="text-sm text-zinc-600">
            ตั้งรหัสผ่านใหม่ให้ <span className="font-medium text-zinc-900">{resetTarget.name}</span>{" "}
            (<span className="font-mono text-xs">{resetTarget.username}</span>)
          </p>
          <Input
            label="รหัสผ่านใหม่"
            type="password"
            value={resetPassword}
            onChange={(e) => {
              setResetPassword(e.target.value);
              setResetErrors((prev) => {
                const next = { ...prev };
                delete next.password;
                delete next.form;
                return next;
              });
            }}
            autoComplete="new-password"
            error={resetErrors.password}
          />
          <Input
            label="ยืนยันรหัสผ่านใหม่"
            type="password"
            value={resetConfirm}
            onChange={(e) => {
              setResetConfirm(e.target.value);
              setResetErrors((prev) => {
                const next = { ...prev };
                delete next.confirm;
                delete next.form;
                return next;
              });
            }}
            autoComplete="new-password"
            error={resetErrors.confirm}
          />
          {resetErrors.form && <p className="text-sm text-red-600">{resetErrors.form}</p>}
          <p className="text-xs text-zinc-500">บันทึกใน Audit Log — แจ้งผู้ใช้ทางช่องทางอื่น</p>
        </UserFormModal>
      )}

      <ConfirmModal
        open={editPromptUser !== null}
        title="แก้ไขผู้ใช้"
        description={
          editPromptUser
            ? `ต้องการแก้ไขบทบาทหรือฝ่ายของ ${editPromptUser.name} (${editPromptUser.username})?`
            : undefined
        }
        confirmLabel="ดำเนินการต่อ"
        onConfirm={() => {
          if (editPromptUser) openEdit(editPromptUser);
          setEditPromptUser(null);
        }}
        onCancel={() => setEditPromptUser(null)}
      />

      <ConfirmModal
        open={resetPromptUser !== null}
        title="รีเซ็ตรหัสผ่าน"
        description={
          resetPromptUser
            ? `ต้องการตั้งรหัสผ่านใหม่ให้ ${resetPromptUser.name} (${resetPromptUser.username})?`
            : undefined
        }
        confirmLabel="ดำเนินการต่อ"
        onConfirm={() => {
          if (resetPromptUser) openReset(resetPromptUser);
          setResetPromptUser(null);
        }}
        onCancel={() => setResetPromptUser(null)}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title="ยืนยันลบผู้ใช้"
        description={
          deleteUser
            ? `ลบ ${deleteUser.name} (${deleteUser.username}) ออกจากระบบ? การดำเนินการนี้บันทึกใน Audit Log`
            : undefined
        }
        confirmLabel="ลบผู้ใช้"
        variant="danger"
        onConfirm={async () => {
          if (deleteTarget) {
            const err = await softDeleteUser(deleteTarget);
            if (err) return;
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function UserFormModal({
  title,
  children,
  onClose,
  onSubmit,
  submitLabel = "บันทึก",
  submitDisabled = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
}) {
  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button type="button" className="absolute inset-0 bg-black/40" aria-label="ปิด" onClick={onClose} />
        <div
          role="dialog"
          aria-modal="true"
          className="ioc-card relative z-10 w-full max-w-md overflow-hidden"
        >
          <div className="border-b border-zinc-100 px-6 py-5">
            <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
          </div>
          <div className="space-y-4 px-6 py-5">{children}</div>
          <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="button" onClick={onSubmit} disabled={submitDisabled}>
              {submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
