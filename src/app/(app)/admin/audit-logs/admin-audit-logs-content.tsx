"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Shield } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSearch } from "@/components/admin/admin-search";
import { FilterPills } from "@/components/admin/filter-pills";
import { ListPagination } from "@/components/admin/list-pagination";
import { fetchAuditLogs } from "@/lib/actions/data";
import {
  AUDIT_CATEGORY_BADGE,
  AUDIT_CATEGORY_LABELS,
  ROLE_BADGE_CLASS,
  ROLE_TAB_LABELS,
  auditCategory,
  formatAuditTimestamp,
  type AuditCategory,
} from "@/lib/admin-ui";
import { auditActionLabel, auditActorEmail } from "@/lib/audit-actions";
import type { AuditLogEntry } from "@/lib/types/admin";
import { formatRelativeTime, userInitials } from "@/lib/ticket-progress";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

const DEFAULT_PAGE_SIZE = 15;

export default function AdminAuditLogsContent() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<AuditCategory>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const logs = await fetchAuditLogs();
      setAuditLogs(logs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
        log.actorUsername.toLowerCase().includes(q) ||
        log.actorDepartment.toLowerCase().includes(q) ||
        (log.detail ?? "").toLowerCase().includes(q)
      );
    });
  }, [categorized, category, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, category, pageSize]);

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
        description={`บันทึกกิจกรรมทั้งหมดในระบบ · ${auditLogs.length} รายการ`}
        actions={
          <Button
            type="button"
            variant="secondary"
            className="gap-2 px-3 py-2"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
            รีเฟรช
          </Button>
        }
      />

      <Card>
        <CardBody className="space-y-4 p-5">
          <AdminSearch
            value={search}
            onChange={setSearch}
            placeholder="ค้นหา action, เลขคำร้อง, ผู้ทำ, รายละเอียด..."
          />
          <FilterPills options={filterOptions} value={category} onChange={setCategory} />
          {filtered.length !== auditLogs.length && (
            <p className="text-xs text-zinc-500">
              แสดง {filtered.length} จาก {auditLogs.length} รายการ
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {loading && auditLogs.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-zinc-500">กำลังโหลดบันทึก...</p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-300">
                <Shield className="h-8 w-8" strokeWidth={1.5} aria-hidden />
              </div>
              <p className="mt-5 text-sm font-medium text-zinc-700">ไม่พบบันทึก</p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {paginated.map(({ log, cat }) => (
                <li key={log.id} className="px-5 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-6">
                    <div className="shrink-0 lg:w-40">
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
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900">{log.actorName}</p>
                        <p className="text-xs text-zinc-500">{auditActorEmail(log.actorUsername)}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${ROLE_BADGE_CLASS[log.actorRole]}`}
                          >
                            {ROLE_TAB_LABELS[log.actorRole]}
                          </span>
                          <span className="text-xs text-zinc-400">{log.actorDepartment}</span>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0 flex-[1.2]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${AUDIT_CATEGORY_BADGE[cat]}`}
                        >
                          {AUDIT_CATEGORY_LABELS[cat]}
                        </span>
                        <span className="text-sm font-semibold text-zinc-900">
                          {auditActionLabel(log.action)}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-zinc-600">{log.target}</p>
                      {log.detail && (
                        <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{log.detail}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {filtered.length > 0 && (
            <ListPagination
              total={filtered.length}
              page={currentPage}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
