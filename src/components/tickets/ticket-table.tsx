"use client";

import Link from "next/link";
import type { Ticket } from "@/lib/types/ticket";
import { StatusBadge } from "@/components/tickets/status-badge";
import { PriorityBadge } from "@/components/tickets/priority-badge";

interface TicketTableProps {
  tickets: Ticket[];
  showRequester?: boolean;
}

export function TicketTable({ tickets, showRequester = true }: TicketTableProps) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white py-12 text-center text-sm text-zinc-500">
        ไม่พบคำร้อง
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">เลขที่</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">หัวข้อ</th>
            {showRequester && (
              <th className="px-4 py-3 text-left font-medium text-zinc-600">ผู้แจ้ง</th>
            )}
            <th className="px-4 py-3 text-left font-medium text-zinc-600">แผนก</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">ความสำคัญ</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">สถานะ</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-600">ผู้รับผิดชอบ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="hover:bg-zinc-50">
              <td className="px-4 py-3">
                <Link href={`/tickets/${ticket.id}`} className="font-medium text-blue-600 hover:underline">
                  {ticket.ticketNo}
                </Link>
              </td>
              <td className="max-w-xs truncate px-4 py-3">{ticket.title}</td>
              {showRequester && (
                <td className="px-4 py-3 text-zinc-600">{ticket.requesterName}</td>
              )}
              <td className="px-4 py-3 text-zinc-600">{ticket.departmentName}</td>
              <td className="px-4 py-3">
                <PriorityBadge priority={ticket.priority} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={ticket.status} />
              </td>
              <td className="px-4 py-3 text-zinc-500">{ticket.assigneeName ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
