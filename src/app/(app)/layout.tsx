"use client";

import type { ReactNode } from "react";
import { MockAuthProvider } from "@/providers/mock-auth-provider";
import { MockAdminProvider } from "@/providers/mock-admin-provider";
import { MockTicketProvider } from "@/providers/mock-ticket-provider";
import { CatalogProvider } from "@/providers/catalog-provider";
import { AuthGuard } from "@/components/layout/auth-guard";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <MockAuthProvider>
      <CatalogProvider>
        <MockTicketProvider>
          <MockAdminProvider>
            <AuthGuard>{children}</AuthGuard>
          </MockAdminProvider>
        </MockTicketProvider>
      </CatalogProvider>
    </MockAuthProvider>
  );
}
