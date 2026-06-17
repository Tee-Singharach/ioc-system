"use client";

import type { ReactNode } from "react";
import { MockAuthProvider } from "@/providers/mock-auth-provider";
import { MockTicketProvider } from "@/providers/mock-ticket-provider";
import { AuthGuard } from "@/components/layout/auth-guard";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <MockAuthProvider>
      <MockTicketProvider>
        <AuthGuard>{children}</AuthGuard>
      </MockTicketProvider>
    </MockAuthProvider>
  );
}
