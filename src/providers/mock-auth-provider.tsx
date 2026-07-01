"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@/lib/types/ticket";
import { loginWithPassword } from "@/lib/actions/data";
import { actionClearSessionCookie, actionSetSessionCookie } from "@/lib/actions/session";
import {
  clearSession,
  getSessionRaw,
  parseSession,
  setSession,
  subscribeSession,
} from "@/lib/mock/session";

interface MockAuthContextValue {
  user: User | null;
  sessionReady: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateName: (name: string) => void;
}

const MockAuthContext = createContext<MockAuthContextValue | null>(null);

function readSessionUser(): User | null {
  return parseSession(getSessionRaw());
}

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useLayoutEffect(() => {
    setUser(readSessionUser());
    setSessionReady(true);
    return subscribeSession(() => {
      setUser(readSessionUser());
    });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const sessionUser = await loginWithPassword(username, password);
    if (!sessionUser) return false;
    setSession(sessionUser);
    setUser(sessionUser);
    await actionSetSessionCookie(sessionUser.id);
    return true;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    void actionClearSessionCookie();
    window.location.assign("/login");
  }, []);

  useEffect(() => {
    if (user) void actionSetSessionCookie(user.id);
  }, [user]);

  const updateName = useCallback((name: string) => {
    const current = readSessionUser();
    if (!current) return;
    const next = { ...current, name: name.trim() };
    setSession(next);
    setUser(next);
  }, []);

  const value = useMemo(
    () => ({ user, sessionReady, login, logout, updateName }),
    [user, sessionReady, login, logout, updateName],
  );

  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
}

export function useMockAuth() {
  const ctx = useContext(MockAuthContext);
  if (!ctx) throw new Error("useMockAuth must be used within MockAuthProvider");
  return ctx;
}
