"use client";

import { useEffect, type ReactNode } from "react";
import { useMockAuth } from "@/providers/mock-auth-provider";
import { useNotifications } from "@/providers/notification-provider";
import { useTicketRefetch } from "@/providers/mock-ticket-provider";

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useMockAuth();
  const { refetch: refetchNotifications } = useNotifications();
  const refetchAllTickets = useTicketRefetch();

  useEffect(() => {
    if (!user) return;

    let es: EventSource | null = null;
    let retryMs = 1_000;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const onSync = () => {
      void refetchNotifications();
      void refetchAllTickets();
    };

    const connect = () => {
      if (stopped) return;
      es = new EventSource("/api/realtime");

      es.onopen = () => {
        retryMs = 1_000;
      };

      es.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as { type?: string };
          if (msg.type === "sync") onSync();
        } catch {
          /* ignore non-JSON comments */
        }
      };

      es.onerror = () => {
        es?.close();
        es = null;
        if (stopped) return;
        retryTimer = setTimeout(() => {
          retryMs = Math.min(retryMs * 2, 30_000);
          connect();
        }, retryMs);
      };
    };

    connect();

    return () => {
      stopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      es?.close();
    };
  }, [user, refetchNotifications, refetchAllTickets]);

  return children;
}
