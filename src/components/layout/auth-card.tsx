import type { ReactNode } from "react";
import { Card, CardBody } from "@/components/ui/card";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardBody className="p-8">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">IOC System</p>
            <h1 className="mt-2 text-2xl font-bold text-zinc-900">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
          </div>
          {children}
        </CardBody>
      </Card>
    </div>
  );
}
