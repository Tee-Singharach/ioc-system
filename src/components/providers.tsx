"use client";

import type { ReactNode } from "react";
import { MockAuthProvider } from "@/providers/mock-auth-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return <MockAuthProvider>{children}</MockAuthProvider>;
}
