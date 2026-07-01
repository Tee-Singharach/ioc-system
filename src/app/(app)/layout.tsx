"use client";

import type { ReactNode } from "react";
import { NotificationProvider } from "@/providers/notification-provider";
import { MockAdminProvider } from "@/providers/mock-admin-provider";
import { MockTicketProvider } from "@/providers/mock-ticket-provider";
import { RealtimeProvider } from "@/providers/realtime-provider";
import { CatalogProvider } from "@/providers/catalog-provider";
import { AuthGuard } from "@/components/layout/auth-guard";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <NotificationProvider>
      <CatalogProvider>
        <MockTicketProvider>
          <RealtimeProvider>
            <MockAdminProvider>
              <AuthGuard>{children}</AuthGuard>
            </MockAdminProvider>
          </RealtimeProvider>
        </MockTicketProvider>
      </CatalogProvider>
    </NotificationProvider>
  );
}
