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
  actionAdminCreateDepartment,
  actionAdminCreateUser,
  actionAdminRestoreDepartment,
  actionAdminRestoreUser,
  actionAdminSoftDeleteDepartment,
  actionAdminSoftDeleteUser,
  actionAdminUpdateDepartment,
  actionAdminUpdateUserDepartment,
  actionAdminUpdateUserName,
  actionAdminUpdateUserRole,
} from "@/lib/actions/data";
import type { ManagedDepartment, ManagedUser } from "@/lib/types/admin";
import type { UserRole } from "@/lib/types/ticket";
import { useMockAuth } from "@/providers/mock-auth-provider";

interface MockAdminContextValue {
  activeUsers: ManagedUser[];
  deletedUsers: ManagedUser[];
  activeDepartments: ManagedDepartment[];
  deletedDepartments: ManagedDepartment[];
  updateUserName: (id: string, name: string) => Promise<string | null>;
  updateUserRole: (id: string, role: UserRole) => Promise<string | null>;
  updateUserDepartment: (id: string, departmentId: string) => Promise<string | null>;
  softDeleteUser: (id: string) => Promise<string | null>;
  restoreUser: (id: string) => Promise<string | null>;
  createUser: (
    input: Omit<ManagedUser, "id" | "deletedAt">,
    password: string,
  ) => Promise<string | null>;
  createDepartment: (input: {
    slug: string;
    name: string;
    shortName: string;
  }) => Promise<string | null>;
  updateDepartment: (
    id: string,
    input: { name: string; shortName: string },
  ) => Promise<string | null>;
  softDeleteDepartment: (id: string) => Promise<string | null>;
  restoreDepartment: (id: string) => Promise<string | null>;
}

const MockAdminContext = createContext<MockAdminContextValue | null>(null);

export function MockAdminProvider({ children }: { children: ReactNode }) {
  const { user: actor } = useMockAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [departments, setDepartments] = useState<ManagedDepartment[]>([]);

  const reload = useCallback(async () => {
    const [u, d] = await Promise.all([fetchAdminUsers(), fetchAdminDepartments()]);
    setUsers(u);
    setDepartments(d);
  }, []);

  useEffect(() => {
    let cancelled = false;
    reload().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const activeUsers = useMemo(() => users.filter((u) => !u.deletedAt), [users]);
  const deletedUsers = useMemo(() => users.filter((u) => !!u.deletedAt), [users]);
  const activeDepartments = useMemo(() => departments.filter((d) => !d.deletedAt), [departments]);
  const deletedDepartments = useMemo(
    () => departments.filter((d) => !!d.deletedAt),
    [departments],
  );

  const updateUserName = useCallback(
    async (id: string, name: string) => {
      if (!actor) return "ไม่มีสิทธิ์ดำเนินการ";
      const result = await actionAdminUpdateUserName(actor, id, name);
      if (!result.ok) return result.error;
      await reload();
      return null;
    },
    [actor, reload],
  );

  const updateUserRole = useCallback(
    async (id: string, role: UserRole) => {
      if (!actor) return "ไม่มีสิทธิ์ดำเนินการ";
      const result = await actionAdminUpdateUserRole(actor, id, role);
      if (!result.ok) return result.error;
      await reload();
      return null;
    },
    [actor, reload],
  );

  const updateUserDepartment = useCallback(
    async (id: string, departmentId: string) => {
      if (!actor) return "ไม่มีสิทธิ์ดำเนินการ";
      const result = await actionAdminUpdateUserDepartment(actor, id, departmentId);
      if (!result.ok) return result.error;
      await reload();
      return null;
    },
    [actor, reload],
  );

  const softDeleteUser = useCallback(
    async (id: string) => {
      if (!actor) return "ไม่มีสิทธิ์ดำเนินการ";
      const result = await actionAdminSoftDeleteUser(actor, id);
      if (!result.ok) return result.error;
      await reload();
      return null;
    },
    [actor, reload],
  );

  const restoreUser = useCallback(
    async (id: string) => {
      if (!actor) return "ไม่มีสิทธิ์ดำเนินการ";
      const result = await actionAdminRestoreUser(actor, id);
      if (!result.ok) return result.error;
      await reload();
      return null;
    },
    [actor, reload],
  );

  const createUser = useCallback(
    async (
      input: Omit<ManagedUser, "id" | "deletedAt">,
      password: string,
    ): Promise<string | null> => {
      if (!actor) return "ไม่มีสิทธิ์ดำเนินการ";
      const result = await actionAdminCreateUser(actor, input, password);
      if (!result.ok) return result.error;
      await reload();
      return null;
    },
    [actor, reload],
  );

  const createDepartment = useCallback(
    async (input: {
      slug: string;
      name: string;
      shortName: string;
    }): Promise<string | null> => {
      if (!actor) return "ไม่มีสิทธิ์ดำเนินการ";
      const result = await actionAdminCreateDepartment(actor, input);
      if (!result.ok) return result.error;
      await reload();
      return null;
    },
    [actor, reload],
  );

  const updateDepartment = useCallback(
    async (
      id: string,
      input: { name: string; shortName: string },
    ): Promise<string | null> => {
      if (!actor) return "ไม่มีสิทธิ์ดำเนินการ";
      const result = await actionAdminUpdateDepartment(actor, id, input);
      if (!result.ok) return result.error;
      await reload();
      return null;
    },
    [actor, reload],
  );

  const softDeleteDepartment = useCallback(
    async (id: string): Promise<string | null> => {
      if (!actor) return "ไม่มีสิทธิ์ดำเนินการ";
      const result = await actionAdminSoftDeleteDepartment(actor, id);
      if (!result.ok) return result.error;
      await reload();
      return null;
    },
    [actor, reload],
  );

  const restoreDepartment = useCallback(
    async (id: string): Promise<string | null> => {
      if (!actor) return "ไม่มีสิทธิ์ดำเนินการ";
      const result = await actionAdminRestoreDepartment(actor, id);
      if (!result.ok) return result.error;
      await reload();
      return null;
    },
    [actor, reload],
  );

  const value = useMemo(
    () => ({
      activeUsers,
      deletedUsers,
      activeDepartments,
      deletedDepartments,
      updateUserName,
      updateUserRole,
      updateUserDepartment,
      softDeleteUser,
      restoreUser,
      createUser,
      createDepartment,
      updateDepartment,
      softDeleteDepartment,
      restoreDepartment,
    }),
    [
      activeUsers,
      deletedUsers,
      activeDepartments,
      deletedDepartments,
      updateUserName,
      updateUserRole,
      updateUserDepartment,
      softDeleteUser,
      restoreUser,
      createUser,
      createDepartment,
      updateDepartment,
      softDeleteDepartment,
      restoreDepartment,
    ],
  );

  return <MockAdminContext.Provider value={value}>{children}</MockAdminContext.Provider>;
}

export function useMockAdmin() {
  const ctx = useContext(MockAdminContext);
  if (!ctx) throw new Error("useMockAdmin must be used within MockAdminProvider");
  return ctx;
}
