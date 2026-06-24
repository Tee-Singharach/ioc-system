"use client";

import Link from "next/link";
import type { Ticket } from "@/lib/types/ticket";
import { userInitials } from "@/lib/ticket-progress";
import { StatusBadge } from "@/components/tickets/status-badge";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { Card } from "@/components/ui/card";

interface TicketTableProps {
  tickets: Ticket[];
  hrefPrefix?: string;
  emptyHint?: string;
}

function formatDeadline(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function TicketTable({ tickets, hrefPrefix = "/tickets", emptyHint }: TicketTableProps) {
  if (tickets.length === 0) {
    return (
      <Card variant="muted" className="border-dashed px-6 py-14 text-center">
        <p className="text-sm font-medium text-zinc-700">ไม่พบคำร้อง</p>
        <p className="mt-1 text-sm text-zinc-500">{emptyHint ?? "ลองเปลี่ยนตัวกรองหรือสร้างคำร้องใหม่"}</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[48rem] text-sm" aria-label="รายการคำร้อง">
          <thead className="border-b border-zinc-100 bg-zinc-50/80">
            <tr>
              <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">เลขที่</th>
              <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">ชื่อคำร้อง</th>
              <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">สถานะ</th>
              <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">ความสำคัญ</th>
              <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">ผู้ยื่น</th>
              <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">กำหนด</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="transition-colors hover:bg-zinc-50">
                <td className="px-5 py-4">
                  <Link href={`${hrefPrefix}/${ticket.id}`} className="font-medium text-blue-600 hover:underline">
                    {ticket.ticketNo}
                  </Link>
                </td>
                <td className="max-w-xs px-5 py-4">
                  <p className="truncate font-medium text-zinc-900">{ticket.title}</p>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={ticket.status} receivedById={ticket.receivedById} />
                </td>
                <td className="px-5 py-4">
                  <PriorityBadge priority={ticket.priority} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      aria-hidden
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600"
                    >
                      {userInitials(ticket.requesterName)}
                    </div>
                    <span className="truncate text-zinc-700">{ticket.requesterName}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-zinc-600">
                  {formatDeadline(ticket.scheduledEndAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
