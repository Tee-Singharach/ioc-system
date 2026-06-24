"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";
import type { Ticket } from "@/lib/types/ticket";
import {
  getInboxPendingTickets,
  getOfficerAssignedTasks,
  getOfficerInProgressTasks,
} from "@/lib/officer-access";
import { formatShortDate } from "@/lib/ticket-progress";
import { TICKET_WORKFLOW_STEPS, workflowStepIndex } from "@/lib/ticket-workflow";
import { useMockAuth } from "@/providers/mock-auth-provider";
import { useMockTickets } from "@/providers/mock-ticket-provider";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import { StatusBadge } from "@/components/tickets/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

type InboxTab = "pending" | "mine" | "in_progress";

function InboxEmpty({ tab }: { tab: InboxTab }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-300">
        <Inbox className="h-8 w-8" strokeWidth={1.5} aria-hidden />
      </div>
      {tab === "pending" ? (
        <>
          <p className="mt-5 text-sm font-medium text-zinc-700">ไม่มีงานรอรับ</p>
          <p className="mt-1 text-sm text-zinc-500">งานทั้งหมดถูกรับแล้ว</p>
        </>
      ) : tab === "mine" ? (
        <>
          <p className="mt-5 text-sm font-medium text-zinc-700">ยังไม่มีงานของคุณ</p>
          <p className="mt-1 text-sm text-zinc-500">รับเรื่องจากแท็บงานรอรับ — งานจะอยู่ที่นี่ระหว่างประเมินและรออนุมัติ</p>
        </>
      ) : (
        <>
          <p className="mt-5 text-sm font-medium text-zinc-700">ไม่มีงานที่กำลังดำเนินการ</p>
          <p className="mt-1 text-sm text-zinc-500">งานที่คุณรับผิดชอบและได้รับอนุมัติแล้วจะแสดงที่นี่</p>
        </>
      )}
    </div>
  );
}

function PendingRow({
  ticket,
  onReceive,
}: {
  ticket: Ticket;
  onReceive: (id: string) => void;
}) {
  return (
    <li className="flex flex-col gap-3 border-b border-zinc-100 px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/officer/inbox/${ticket.id}`}
            className="font-mono text-sm font-semibold text-blue-600 hover:underline"
          >
            {ticket.ticketNo}
          </Link>
          <StatusBadge status={ticket.status} receivedById={ticket.receivedById} />
          <PriorityBadge priority={ticket.priority} />
        </div>
        <p className="mt-1 truncate font-medium text-zinc-900">{ticket.title}</p>
        <p className="mt-0.5 text-sm text-zinc-500">
          {ticket.requesterName} · กำหนด {formatShortDate(ticket.scheduledEndAt)}
        </p>
      </div>
      <Button type="button" className="shrink-0" onClick={() => onReceive(ticket.id)}>
        รับเรื่อง
      </Button>
    </li>
  );
}

function MyTaskRow({ ticket }: { ticket: Ticket }) {
  const step = workflowStepIndex(ticket);
  const stepLabel = TICKET_WORKFLOW_STEPS[step]?.label ?? ticket.status;

  return (
    <li className="border-b border-zinc-100 px-5 py-4 last:border-b-0">
      <Link href={`/officer/inbox/${ticket.id}`} className="block min-w-0 hover:opacity-90">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold text-blue-600">{ticket.ticketNo}</span>
          <StatusBadge status={ticket.status} receivedById={ticket.receivedById} />
          <PriorityBadge priority={ticket.priority} />
        </div>
        <p className="mt-1 truncate font-medium text-zinc-900">{ticket.title}</p>
        <p className="mt-0.5 text-sm text-zinc-500">
          {ticket.requesterName} · ขั้น {step + 1}: {stepLabel}
        </p>
      </Link>
    </li>
  );
}

export default function OfficerInboxContent() {
  const { user } = useMockAuth();
  const { tickets, receiveTicket } = useMockTickets();
  const [tab, setTab] = useState<InboxTab>("pending");

  const pending = useMemo(
    () => (user ? getInboxPendingTickets(tickets, user) : []),
    [tickets, user],
  );
  const assignedTasks = useMemo(() => {
    if (!user) return [];
    return getOfficerAssignedTasks(tickets, user).sort(
      (a, b) => workflowStepIndex(a) - workflowStepIndex(b),
    );
  }, [tickets, user]);
  const inProgressTasks = useMemo(() => {
    if (!user) return [];
    return getOfficerInProgressTasks(tickets, user).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [tickets, user]);

  const list =
    tab === "pending" ? pending : tab === "mine" ? assignedTasks : inProgressTasks;

  function handleReceive(id: string) {
    receiveTicket(id);
    setTab("mine");
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">กล่องงาน</h1>
        <p className="mt-1 text-sm text-zinc-500">
          สวัสดี {user.name} · บริหารงานของคุณ
        </p>
      </div>

      <div className="border-b border-zinc-200">
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => setTab("pending")}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              tab === "pending"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            งานรอรับ ({pending.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("mine")}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              tab === "mine"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            งานของฉัน ({assignedTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("in_progress")}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              tab === "in_progress"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            ดำเนินการ ({inProgressTasks.length})
          </button>
        </div>
      </div>

      <Card>
        <CardBody className="p-0">
          {list.length === 0 ? (
            <InboxEmpty tab={tab} />
          ) : (
            <ul>
              {tab === "pending"
                ? pending.map((ticket) => (
                    <PendingRow key={ticket.id} ticket={ticket} onReceive={handleReceive} />
                  ))
                : list.map((ticket) => <MyTaskRow key={ticket.id} ticket={ticket} />)}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
