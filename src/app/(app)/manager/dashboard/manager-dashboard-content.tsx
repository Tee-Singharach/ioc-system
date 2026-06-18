"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  getLatestDepartmentTickets,
  getManagerDashboardBlock,
  getStatusDistribution,
  getTicketActivitySeries,
} from "@/lib/manager-dashboard";
import { formatShortDate } from "@/lib/ticket-progress";
import { useMockAuth } from "@/providers/mock-auth-provider";
import { useMockTickets } from "@/providers/mock-ticket-provider";
import {
  CreatedFinishedChart,
  DashboardStatTile,
  StatusDonutChart,
} from "@/components/manager/dashboard-charts";
import { StatusBadge } from "@/components/tickets/status-badge";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function ManagerDashboardContent() {
  const { user } = useMockAuth();
  const { tickets } = useMockTickets();
  const [rangeDays, setRangeDays] = useState<7 | 30>(7);

  const block = useMemo(
    () => (user ? getManagerDashboardBlock(tickets, user) : null),
    [tickets, user],
  );

  const series = useMemo(
    () => (user ? getTicketActivitySeries(tickets, user, rangeDays) : []),
    [tickets, user, rangeDays],
  );

  const distribution = useMemo(
    () => (user ? getStatusDistribution(tickets, user) : []),
    [tickets, user],
  );

  const latest = useMemo(
    () => (user ? getLatestDepartmentTickets(tickets, user, 5) : []),
    [tickets, user],
  );

  if (!user || !block) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="แดชบอร์ด"
        description={`สวัสดี ${user.name} · ภาพรวมคำร้องในแผนก`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatTile label="คำร้องใหม่" value={block.newTickets} />
        <DashboardStatTile label="เกินกำหนด" value={block.overdue} />
        <DashboardStatTile label="รออนุมัติ" value={block.pending} />
        <DashboardStatTile label="SLA (%)" value={`${block.slaPercent}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CreatedFinishedChart
            series={series}
            rangeDays={rangeDays}
            onRangeChange={setRangeDays}
          />
        </div>
        <StatusDonutChart slices={distribution} />
      </div>

      <Card>
        <CardBody className="p-0">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-zinc-900">คำร้องล่าสุด</h2>
            <Link href="/manager/approvals" className="text-sm font-medium text-blue-600 hover:underline">
              ดูทั้งหมด →
            </Link>
          </div>
          {latest.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-zinc-500">ยังไม่มีคำร้องในแผนก</p>
          ) : (
            <ul>
              {latest.map((ticket) => (
                <li key={ticket.id} className="border-b border-zinc-100 px-5 py-3.5 last:border-b-0">
                  <Link
                    href={`/manager/tickets/${ticket.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 hover:opacity-90"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-zinc-900">{ticket.title}</p>
                      <p className="mt-0.5 font-mono text-xs text-zinc-500">{ticket.ticketNo}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <time className="text-xs text-zinc-400">{formatShortDate(ticket.updatedAt)}</time>
                      <StatusBadge status={ticket.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
