"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { AppNotification } from "@/lib/types/notification";
import {
  fetchMyNotifications,
  fetchMyUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/data";
import { useMockAuth } from "@/providers/mock-auth-provider";

interface NotificationContextValue {
  items: AppNotification[];
  unread: number;
  refreshing: boolean;
  refetch: () => Promise<void>;
  markRead: (id: string) => Promise<boolean>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useMockAuth();
  const pathname = usePathname();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const itemsRef = useRef(items);
  const refetchGen = useRef(0);
  const markingRef = useRef(new Set<string>());

  itemsRef.current = items;

  const refetch = useCallback(async () => {
    if (!user) {
      setItems([]);
      setUnread(0);
      setRefreshing(false);
      return;
    }
    const gen = ++refetchGen.current;
    setRefreshing(true);
    try {
      const [list, count] = await Promise.all([
        fetchMyNotifications(user.id),
        fetchMyUnreadCount(user.id),
      ]);
      if (gen !== refetchGen.current) return;
      setItems(list);
      const unreadInList = list.filter((n) => !n.readAt).length;
      setUnread(Math.max(count, unreadInList));
    } finally {
      if (gen === refetchGen.current) setRefreshing(false);
    }
  }, [user]);

  const markRead = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;
      const current = itemsRef.current.find((n) => n.id === id);
      if (!current || current.readAt) return true;
      if (markingRef.current.has(id)) return false;
      markingRef.current.add(id);
      try {
        await markNotificationRead(user.id, id);
        const now = new Date().toISOString();
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: now } : n)));
        setUnread((c) => Math.max(0, c - 1));
        return true;
      } catch {
        return false;
      } finally {
        markingRef.current.delete(id);
      }
    },
    [user],
  );

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
    setUnread(0);
  }, [user]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    void refetch();
  }, [pathname, refetch]);

  useEffect(() => {
    const onFocus = () => void refetch();
    const onVis = () => {
      if (document.visibilityState === "visible") void refetch();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refetch]);

  useEffect(() => {
    if (!user) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void refetch();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [user, refetch]);

  const value = useMemo(
    () => ({ items, unread, refreshing, refetch, markRead, markAllRead }),
    [items, unread, refreshing, refetch, markRead, markAllRead],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
