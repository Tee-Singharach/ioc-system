"use client";

import { useMemo } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { getApprovalDecision, getApprovalHistoryTickets } from "@/lib/manager-access";
import { formatShortDate } from "@/lib/ticket-progress";
import { useMockAuth } from "@/providers/mock-auth-provider";
import { useMockTickets } from "@/providers/mock-ticket-provider";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function ManagerHistoryContent() {
  const { user } = useMockAuth();
  const { tickets } = useMockTickets();

  const history = useMemo(
    () => (user ? getApprovalHistoryTickets(tickets, user) : []),
    [tickets, user],
  );

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="ประวัติการอนุมัติ"
        description={`คำร้องที่ผ่านการพิจารณาแล้ว · ${history.length} รายการ`}
      />

      <Card>
        <CardBody className="p-0">
          {history.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-300">
                <History className="h-8 w-8" strokeWidth={1.5} aria-hidden />
              </div>
              <p className="mt-5 text-sm font-medium text-zinc-700">ยังไม่มีประวัติการอนุมัติ</p>
              <p className="mt-1 text-sm text-zinc-500">รายการที่อนุมัติหรือปฏิเสธจะแสดงที่นี่</p>
            </div>
          ) : (
            <ul>
              {history.map((ticket) => {
                const decision = getApprovalDecision(ticket);
                return (
                  <li
                    key={ticket.id}
                    className="border-b border-zinc-100 px-5 py-4 last:border-b-0"
                  >
                    <Link href={`/manager/tickets/${ticket.id}`} className="block min-w-0 hover:opacity-90">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-blue-600">{ticket.ticketNo}</span>
                        <PriorityBadge priority={ticket.priority} />
                        {decision ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              decision.action === "approved"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {decision.action === "approved" ? "อนุมัติ" : "ปฏิเสธ"}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate font-medium text-zinc-900">{ticket.title}</p>
                      <p className="mt-0.5 text-sm text-zinc-500">
                        {ticket.requesterName}
                        {decision ? ` · ${formatShortDate(decision.at)}` : ""}
                      </p>
                      {decision?.note && (
                        <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{decision.note}</p>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
