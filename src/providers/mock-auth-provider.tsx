"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types/ticket";
import { resolveMockUser } from "@/lib/mock/resolve-user";
import { homePathForRole } from "@/lib/officer-access";
import { clearSession, getServerSessionSnapshot, getSessionRaw, parseSession, setSession, subscribeSession } from "@/lib/mock/session";

interface MockAuthContextValue {
  user: User | null;
  login: (username: string, password: string) => void;
  logout: () => void;
  updateName: (name: string) => void;
}

const MockAuthContext = createContext<MockAuthContextValue | null>(null);

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const sessionRaw = useSyncExternalStore(subscribeSession, getSessionRaw, getServerSessionSnapshot);
  const user = useMemo(() => parseSession(sessionRaw), [sessionRaw]);

  const login = useCallback((username: string, password: string) => {
    // TODO: replace with real JWT authentication (password: ${password})
    void password;
    const sessionUser = resolveMockUser(username);
    setSession(sessionUser);
    router.push(homePathForRole(sessionUser.role));
  }, [router]);

  const logout = useCallback(() => {
    clearSession();
    router.push("/login");
  }, [router]);

  const updateName = useCallback((name: string) => {
    const current = parseSession(getSessionRaw());
    if (!current) return;
    setSession({ ...current, name: name.trim() });
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, updateName }),
    [user, login, logout, updateName],
  );

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
}

export function useMockAuth() {
  const ctx = useContext(MockAuthContext);
  if (!ctx) throw new Error("useMockAuth must be used within MockAuthProvider");
  return ctx;
}
