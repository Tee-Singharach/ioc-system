"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types/ticket";
import { MOCK_STAFF_USER } from "@/lib/mock/data";
import { clearSession, getServerSessionSnapshot, getSessionRaw, parseSession, setSession, subscribeSession } from "@/lib/mock/session";

interface MockAuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => void;
  logout: () => void;
}

const MockAuthContext = createContext<MockAuthContextValue | null>(null);

function subscribeNoop() {
  return () => {};
}

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const sessionRaw = useSyncExternalStore(subscribeSession, getSessionRaw, getServerSessionSnapshot);
  const user = useMemo(() => parseSession(sessionRaw), [sessionRaw]);
  const isLoading = useSyncExternalStore(subscribeNoop, () => false, () => true);

  const login = useCallback((username: string, password: string) => {
    // TODO: replace with real JWT authentication (password: ${password})
    void password;
    const sessionUser: User = { ...MOCK_STAFF_USER, username: username || MOCK_STAFF_USER.username };
    setSession(sessionUser);
    router.push("/tickets");
  }, [router]);

  const logout = useCallback(() => {
    clearSession();
    router.push("/login");
  }, [router]);

  return (
    <MockAuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </MockAuthContext.Provider>
  );
}

export function useMockAuth() {
  const ctx = useContext(MockAuthContext);
  if (!ctx) throw new Error("useMockAuth must be used within MockAuthProvider");
  return ctx;
}
