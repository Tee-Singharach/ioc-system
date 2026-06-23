"use client";

import { useMemo, useState } from "react";
import { Shield } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSearch } from "@/components/admin/admin-search";
import { FilterPills } from "@/components/admin/filter-pills";
import {
  AUDIT_CATEGORY_BADGE,
  AUDIT_CATEGORY_LABELS,
  auditCategory,
  formatAuditTimestamp,
  mockUserEmail,
  type AuditCategory,
} from "@/lib/admin-ui";
import { formatRelativeTime, userInitials } from "@/lib/ticket-progress";
import { useMockAdmin } from "@/providers/mock-admin-provider";
import { Card, CardBody } from "@/components/ui/card";

export default function AdminAuditLogsContent() {
  const { auditLogs } = useMockAdmin();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<AuditCategory>("all");

  const categorized = useMemo(
    () => auditLogs.map((log) => ({ log, cat: auditCategory(log) })),
    [auditLogs],
  );

  const categoryCounts = useMemo(() => {
    const counts = { workflow: 0, user: 0, security: 0, system: 0 };
    for (const { cat } of categorized) counts[cat]++;
    return counts;
  }, [categorized]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categorized.filter(({ log, cat }) => {
      if (category !== "all" && cat !== category) return false;
      if (!q) return true;
      return (
        log.action.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q) ||
        log.actorName.toLowerCase().includes(q) ||
        (log.detail ?? "").toLowerCase().includes(q)
      );
    });
  }, [categorized, category, search]);

  const filterOptions: { value: AuditCategory; label: string; count?: number }[] = [
    { value: "all", label: "ทั้งหมด", count: auditLogs.length },
    { value: "workflow", label: AUDIT_CATEGORY_LABELS.workflow, count: categoryCounts.workflow },
    { value: "user", label: AUDIT_CATEGORY_LABELS.user, count: categoryCounts.user },
    { value: "security", label: AUDIT_CATEGORY_LABELS.security, count: categoryCounts.security },
    { value: "system", label: AUDIT_CATEGORY_LABELS.system, count: categoryCounts.system },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Shield}
        title="Audit Log"
        description="ประวัติการทำงานและการเข้าใช้ระบบ"
      />

      <Card>
        <CardBody className="space-y-4 p-5">
          <AdminSearch
            value={search}
            onChange={setSearch}
            placeholder="ค้นหา action, target..."
          />
          <FilterPills options={filterOptions} value={category} onChange={setCategory} />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-300">
                <Shield className="h-8 w-8" strokeWidth={1.5} aria-hidden />
              </div>
              <p className="mt-5 text-sm font-medium text-zinc-700">ไม่พบบันทึก</p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {filtered.map(({ log, cat }) => (
                <li
                  key={log.id}
                  className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-start sm:gap-6"
                >
                  <div className="shrink-0 sm:w-36">
                    <p className="text-sm font-medium text-zinc-800">
                      {formatAuditTimestamp(log.at)}
                    </p>
                    <p suppressHydrationWarning className="mt-0.5 text-xs text-zinc-400">
                      {formatRelativeTime(log.at)}
                    </p>
                  </div>

                  <div className="flex min-w-0 flex-1 gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600"
                      aria-hidden
                    >
                      {userInitials(log.actorName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-900">{log.actorName}</p>
                      <p className="text-xs text-zinc-400">{mockUserEmail(log.actorId)}</p>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 sm:text-right">
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${AUDIT_CATEGORY_BADGE[cat]}`}
                      >
                        {AUDIT_CATEGORY_LABELS[cat]}
                      </span>
                      <span className="text-sm font-semibold text-zinc-900">{log.action}</span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-zinc-500">{log.target}</p>
                    {log.detail && (
                      <p className="mt-1 text-sm text-zinc-600">{log.detail}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
