import type { StatusHistoryEntry, Ticket, TicketStatus } from "@/lib/types/ticket";

/** 5 ขั้นบน stepper (ขั้น 1–2 ใช้สถานะ DB เดียวกัน รอรับเรื่อง) */
export const TICKET_WORKFLOW_STEPS = [
  { id: "new", label: "คำร้องใหม่" },
  { id: "evaluating", label: "กำลังประเมิน" },
  { id: "pending_approval", label: "รออนุมัติ" },
  { id: "in_progress", label: "กำลังดำเนินการ" },
  { id: "done", label: "เสร็จสิ้น" },
] as const;

export type WorkflowFilterTab =
  | "all"
  | "new"
  | "evaluating"
  | "pending_approval"
  | "in_progress"
  | "done"
  | "rejected"
  | "cancelled";

/** แท็บกรองรายการ — ลำดับตรง stepper */
export const WORKFLOW_PRIMARY_FILTER_TABS: {
  id: WorkflowFilterTab;
  label: string;
}[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "new", label: "คำร้องใหม่" },
  { id: "evaluating", label: "กำลังประเมิน" },
  { id: "pending_approval", label: "รออนุมัติ" },
  { id: "in_progress", label: "กำลังดำเนินการ" },
  { id: "done", label: "เสร็จสิ้น" },
];

export const WORKFLOW_TERMINAL_FILTER_TABS: {
  id: WorkflowFilterTab;
  label: string;
}[] = [
  { id: "rejected", label: "ปฏิเสธ" },
  { id: "cancelled", label: "ยกเลิก" },
];

/** @deprecated use PRIMARY + TERMINAL */
export const WORKFLOW_FILTER_TABS = [
  ...WORKFLOW_PRIMARY_FILTER_TABS,
  ...WORKFLOW_TERMINAL_FILTER_TABS,
];

const TERMINAL: TicketStatus[] = ["ปฏิเสธ", "ยกเลิก"];

export function matchesWorkflowFilterTab(
  ticket: Pick<Ticket, "status" | "receivedById">,
  tab: WorkflowFilterTab,
): boolean {
  if (tab === "all") return true;
  const { status, receivedById } = ticket;
  if (tab === "rejected") return status === "ปฏิเสธ";
  if (tab === "cancelled") return status === "ยกเลิก";
  if (status === "ปฏิเสธ" || status === "ยกเลิก") return false;
  if (tab === "new") return status === "รอรับเรื่อง" && !receivedById;
  if (tab === "evaluating") return status === "รอรับเรื่อง" && !!receivedById;
  if (tab === "pending_approval") return status === "รออนุมัติ";
  if (tab === "in_progress") return status === "กำลังดำเนินการ";
  if (tab === "done") return status === "เสร็จสมบูรณ์";
  return false;
}

export function countByWorkflowFilterTab(
  tickets: Pick<Ticket, "status" | "receivedById">[],
): Record<WorkflowFilterTab, number> {
  const counts: Record<WorkflowFilterTab, number> = {
    all: tickets.length,
    new: 0,
    evaluating: 0,
    pending_approval: 0,
    in_progress: 0,
    done: 0,
    rejected: 0,
    cancelled: 0,
  };
  for (const t of tickets) {
    for (const { id } of WORKFLOW_FILTER_TABS) {
      if (id === "all") continue;
      if (matchesWorkflowFilterTab(t, id)) counts[id]++;
    }
  }
  return counts;
}

export function workflowStepIndex(
  ticket: Pick<Ticket, "status" | "receivedById" | "statusHistory">,
): number {
  const { status, receivedById, statusHistory } = ticket;
  if (status === "เสร็จสมบูรณ์") return 4;
  if (status === "กำลังดำเนินการ") return 3;
  if (status === "รออนุมัติ") return 2;
  if (status === "รอรับเรื่อง") return receivedById ? 1 : 0;
  if (TERMINAL.includes(status)) {
    let max = 0;
    for (const h of statusHistory) {
      const i = historyStepIndex(h);
      if (i > max) max = i;
    }
    return max;
  }
  return 0;
}

function historyStepIndex(entry: StatusHistoryEntry): number {
  if (entry.status === "เสร็จสมบูรณ์") return 4;
  if (entry.status === "กำลังดำเนินการ") return 3;
  if (entry.status === "รออนุมัติ") return 2;
  if (entry.status === "รอรับเรื่อง") {
    return entry.note?.includes("รับเรื่อง") ? 1 : 0;
  }
  return 0;
}

export function staffWorkflowHint(ticket: Pick<Ticket, "status" | "receivedById">): string | null {
  if (ticket.status === "รอรับเรื่อง" && !ticket.receivedById) {
    return "รอเจ้าหน้าที่รับเรื่อง";
  }
  if (ticket.status === "รอรับเรื่อง" && ticket.receivedById) {
    return "เจ้าหน้าที่กำลังตรวจสอบและประเมิน";
  }
  if (ticket.status === "รออนุมัติ") return "รอหัวหน้าอนุมัติ";
  if (ticket.status === "กำลังดำเนินการ") return "เจ้าหน้าที่กำลังดำเนินการ";
  if (ticket.status === "เสร็จสมบูรณ์") return "ดำเนินการเสร็จสิ้นแล้ว";
  return null;
}

export function approvalNote(actorName: string) {
  return `${actorName} อนุมัติให้ดำเนินการ`;
}

const ALLOWED_TRANSITIONS: Partial<Record<TicketStatus, TicketStatus[]>> = {
  รอรับเรื่อง: ["รออนุมัติ", "ยกเลิก"],
  รออนุมัติ: ["กำลังดำเนินการ", "ปฏิเสธ"],
  กำลังดำเนินการ: ["เสร็จสมบูรณ์"],
  ปฏิเสธ: ["รอรับเรื่อง"],
};

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  if (TICKET_WORKFLOW_STEPS.length !== 5) {
    throw new Error("ticket-workflow: expected 5 steps");
  }
  if (workflowStepIndex({ status: "รอรับเรื่อง", receivedById: "x", statusHistory: [] }) !== 1) {
    throw new Error("ticket-workflow: evaluating step index");
  }
}
