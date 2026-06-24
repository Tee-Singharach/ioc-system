"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchAdminDepartments,
  fetchAdminUsers,
  fetchAuditLogs,
} from "@/lib/actions/data";
import type { AuditLogEntry, ManagedDepartment, ManagedUser } from "@/lib/types/admin";
import type { UserRole } from "@/lib/types/ticket";
import { useMockAuth } from "@/providers/mock-auth-provider";

function newId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

interface MockAdminContextValue {
  activeUsers: ManagedUser[];
  activeDepartments: ManagedDepartment[];
  auditLogs: AuditLogEntry[];
  updateUserRole: (id: string, role: UserRole) => void;
  updateUserDepartment: (id: string, departmentId: string) => void;
  softDeleteUser: (id: string) => void;
  createUser: (input: Omit<ManagedUser, "id" | "deletedAt">) => string | null;
  createDepartment: (input: {
    slug: string;
    name: string;
    shortName: string;
  }) => string | null;
  updateDepartment: (
    id: string,
    input: { name: string; shortName: string },
  ) => string | null;
  softDeleteDepartment: (id: string) => string | null;
}

const MockAdminContext = createContext<MockAdminContextValue | null>(null);

export function MockAdminProvider({ children }: { children: ReactNode }) {
  const { user: actor } = useMockAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [departments, setDepartments] = useState<ManagedDepartment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchAdminUsers(), fetchAdminDepartments(), fetchAuditLogs()]).then(
      ([u, d, logs]) => {
        if (cancelled) return;
        setUsers(u);
        setDepartments(d);
        setAuditLogs(logs);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const appendLog = useCallback(
    (action: string, target: string, detail?: string) => {
      if (!actor) return;
      const entry: AuditLogEntry = {
        id: newId("log"),
        action,
        target,
        actorId: actor.id,
        actorName: actor.name,
        at: new Date().toISOString(),
        detail,
      };
      setAuditLogs((prev) => [entry, ...prev]);
    },
    [actor],
  );

  const activeUsers = useMemo(() => users.filter((u) => !u.deletedAt), [users]);
  const activeDepartments = useMemo(() => departments.filter((d) => !d.deletedAt), [departments]);

  const updateUserRole = useCallback(
    (id: string, role: UserRole) => {
      const target = users.find((u) => u.id === id);
      if (!target || target.deletedAt) return;
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
      appendLog("อัปเดตสิทธิ์", target.username, `เปลี่ยนสิทธิ์เป็น ${role}`);
    },
    [users, appendLog],
  );

  const updateUserDepartment = useCallback(
    (id: string, departmentId: string) => {
      const target = users.find((u) => u.id === id);
      if (!target || target.deletedAt) return;
      const dept = departments.find((d) => d.id === departmentId && !d.deletedAt);
      if (!dept) return;
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, departmentId } : u)));
      appendLog("อัปเดตแผนก", target.username, `ย้ายไปแผนก ${dept.name}`);
    },
    [users, departments, appendLog],
  );

  const softDeleteUser = useCallback(
    (id: string) => {
      const target = users.find((u) => u.id === id);
      if (!target || target.deletedAt || target.role === "admin") return;
      const at = new Date().toISOString();
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, deletedAt: at } : u)));
      appendLog("ลบผู้ใช้", target.username, `ลบผู้ใช้ ${target.name}`);
    },
    [users, appendLog],
  );

  const createUser = useCallback(
    (input: Omit<ManagedUser, "id" | "deletedAt">): string | null => {
      const username = input.username.trim().toLowerCase();
      if (!username || !input.name.trim()) return "กรุณากรอกชื่อผู้ใช้และชื่อ-นามสกุล";
      if (users.some((u) => u.username === username && !u.deletedAt)) {
        return "ชื่อผู้ใช้นี้มีอยู่แล้ว";
      }
      if (!departments.some((d) => d.id === input.departmentId && !d.deletedAt)) {
        return "แผนกไม่ถูกต้อง";
      }
      const id = newId("user");
      setUsers((prev) => [...prev, { ...input, id, username }]);
      appendLog("สร้างผู้ใช้", username, `สิทธิ์ ${input.role}`);
      return null;
    },
    [users, departments, appendLog],
  );

  const createDepartment = useCallback(
    (input: {
      slug: string;
      name: string;
      shortName: string;
    }): string | null => {
      const name = input.name.trim();
      const shortName = input.shortName.trim();
      const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
      if (!slug) return "กรุณาระบุรหัสแผนก";
      if (!name) return "กรุณาระบุชื่อแผนก";
      if (!shortName) return "กรุณาระบุชื่อย่อ";
      const id = slug.startsWith("dept-") ? slug : `dept-${slug}`;
      if (departments.some((d) => d.id === id && !d.deletedAt)) {
        return "รหัสแผนกนี้มีอยู่แล้ว";
      }
      if (departments.some((d) => d.name === name && !d.deletedAt)) {
        return "ชื่อแผนกนี้มีอยู่แล้ว";
      }
      setDepartments((prev) => [
        ...prev,
        { id, name, shortName },
      ]);
      appendLog("สร้างแผนก", id, `ชื่อแผนก: ${name}`);
      return null;
    },
    [departments, appendLog],
  );

  const updateDepartment = useCallback(
    (
      id: string,
      input: { name: string; shortName: string },
    ): string | null => {
      const name = input.name.trim();
      const shortName = input.shortName.trim();
      const target = departments.find((d) => d.id === id);
      if (!target || target.deletedAt) return "ไม่พบแผนก";
      if (!name) return "กรุณาระบุชื่อแผนก";
      if (!shortName) return "กรุณาระบุชื่อย่อ";
      if (departments.some((d) => d.id !== id && d.name === name && !d.deletedAt)) {
        return "ชื่อแผนกนี้มีอยู่แล้ว";
      }
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, name, shortName }
            : d,
        ),
      );
      appendLog("แก้ไขแผนก", target.id, `อัปเดต ${name}`);
      return null;
    },
    [departments, appendLog],
  );

  const softDeleteDepartment = useCallback(
    (id: string): string | null => {
      const target = departments.find((d) => d.id === id);
      if (!target || target.deletedAt) return null;
      const activeCount = users.filter((u) => !u.deletedAt && u.departmentId === id).length;
      if (activeCount > 0) return `มีผู้ใช้ ${activeCount} คนในแผนกนี้ — ย้ายผู้ใช้ก่อนลบ`;
      const at = new Date().toISOString();
      setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, deletedAt: at } : d)));
      appendLog("ลบแผนก", target.id, `ลบแผนก ${target.name}`);
      return null;
    },
    [departments, users, appendLog],
  );

  const value = useMemo(
    () => ({
      activeUsers,
      activeDepartments,
      auditLogs,
      updateUserRole,
      updateUserDepartment,
      softDeleteUser,
      createUser,
      createDepartment,
      updateDepartment,
      softDeleteDepartment,
    }),
    [
      activeUsers,
      activeDepartments,
      auditLogs,
      updateUserRole,
      updateUserDepartment,
      softDeleteUser,
      createUser,
      createDepartment,
      updateDepartment,
      softDeleteDepartment,
    ],
  );

  return <MockAdminContext.Provider value={value}>{children}</MockAdminContext.Provider>;
}

export function useMockAdmin() {
  const ctx = useContext(MockAdminContext);
  if (!ctx) throw new Error("useMockAdmin must be used within MockAdminProvider");
  return ctx;
}
