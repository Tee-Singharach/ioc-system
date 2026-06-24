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
const WORKFLOW_PRIMARY_FILTER_TABS: {
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

const WORKFLOW_TERMINAL_FILTER_TABS: {
  id: WorkflowFilterTab;
  label: string;
}[] = [
  { id: "rejected", label: "ปฏิเสธ" },
  { id: "cancelled", label: "ยกเลิก" },
];

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

/** ป้ายสถานะบน UI — ขั้นประเมินใช้สถานะ DB เดิม + receivedById */
export function workflowStatusLabel(ticket: Pick<Ticket, "status" | "receivedById">): string {
  if (ticket.status === "รอรับเรื่อง" && ticket.receivedById) return "กำลังประเมิน";
  return ticket.status;
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

export type WorkflowTimelineStep = {
  id: (typeof TICKET_WORKFLOW_STEPS)[number]["id"];
  label: string;
  at: string | null;
  note?: string;
  state: "done" | "current" | "upcoming";
};

export type WorkflowTimeline = {
  steps: WorkflowTimelineStep[];
  terminal?: { status: TicketStatus; at: string; note?: string };
};

function isReceiveNote(note?: string) {
  return !!note?.includes("รับเรื่อง");
}

function firstHistoryEntry(
  history: StatusHistoryEntry[],
  pred: (e: StatusHistoryEntry) => boolean,
): StatusHistoryEntry | undefined {
  return history.find(pred);
}

/** วันที่เหตุการณ์แต่ละขั้น workflow — จาก statusHistory */
export function buildWorkflowTimeline(
  ticket: Pick<Ticket, "status" | "receivedById" | "statusHistory" | "createdAt">,
): WorkflowTimeline {
  const { status, statusHistory, createdAt } = ticket;
  const currentIdx = workflowStepIndex(ticket);
  const allDone = status === "เสร็จสมบูรณ์";
  const isTerminal = TERMINAL.includes(status);

  const newEntry = firstHistoryEntry(
    statusHistory,
    (e) => e.status === "รอรับเรื่อง" && !isReceiveNote(e.note),
  );
  const receiveEntry = firstHistoryEntry(
    statusHistory,
    (e) => e.status === "รอรับเรื่อง" && isReceiveNote(e.note),
  );
  const approvalEntry = firstHistoryEntry(statusHistory, (e) => e.status === "รออนุมัติ");
  const progressEntry = firstHistoryEntry(statusHistory, (e) => e.status === "กำลังดำเนินการ");
  const doneEntry = firstHistoryEntry(statusHistory, (e) => e.status === "เสร็จสมบูรณ์");

  const milestones: { at: string | null; note?: string }[] = [
    { at: newEntry?.at ?? createdAt, note: newEntry?.note },
    { at: receiveEntry?.at ?? null, note: receiveEntry?.note },
    { at: approvalEntry?.at ?? null, note: approvalEntry?.note },
    { at: progressEntry?.at ?? null, note: progressEntry?.note },
    { at: doneEntry?.at ?? null, note: doneEntry?.note },
  ];

  const steps: WorkflowTimelineStep[] = TICKET_WORKFLOW_STEPS.map((step, index) => {
    let state: WorkflowTimelineStep["state"];
    if (allDone) state = "done";
    else if (isTerminal) {
      if (index < currentIdx) state = "done";
      else if (index === currentIdx) state = "current";
      else state = "upcoming";
    } else if (index < currentIdx) state = "done";
    else if (index === currentIdx) state = "current";
    else state = "upcoming";

    return {
      id: step.id,
      label: step.label,
      at: milestones[index]?.at ?? null,
      note: milestones[index]?.note,
      state,
    };
  });

  let terminal: WorkflowTimeline["terminal"];
  if (isTerminal) {
    const entry = [...statusHistory].reverse().find((e) => TERMINAL.includes(e.status));
    if (entry) terminal = { status: entry.status, at: entry.at, note: entry.note };
  }

  return { steps, terminal };
}

/** ดึงชื่อผู้ปฏิเสธจาก note ประวัติ */
export function rejectionRejectorFromNote(note?: string): string | null {
  if (!note?.trim()) return null;
  const m = note.match(/^(.+?)\s+ปฏิเสธ:/);
  return m?.[1]?.trim() ?? null;
}

/** ดึงข้อความเหตุผลจาก note ประวัติปฏิเสธ */
export function rejectionReasonFromNote(note?: string): string | null {
  if (!note?.trim()) return null;
  const marker = "ปฏิเสธ:";
  const idx = note.indexOf(marker);
  if (idx !== -1) return note.slice(idx + marker.length).trim();
  return note.trim();
}

if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  if (TICKET_WORKFLOW_STEPS.length !== 5) {
    throw new Error("ticket-workflow: expected 5 steps");
  }
  if (workflowStepIndex({ status: "รอรับเรื่อง", receivedById: "x", statusHistory: [] }) !== 1) {
    throw new Error("ticket-workflow: evaluating step index");
  }
  if (workflowStatusLabel({ status: "รอรับเรื่อง", receivedById: "x" }) !== "กำลังประเมิน") {
    throw new Error("ticket-workflow: evaluating label");
  }

  const sampleHistory: StatusHistoryEntry[] = [
    { status: "รอรับเรื่อง", at: "2026-06-17T08:00:00Z" },
    {
      status: "รอรับเรื่อง",
      note: "วิชัย รับเรื่องเพื่อตรวจสอบ",
      at: "2026-06-17T09:00:00Z",
    },
    {
      status: "รออนุมัติ",
      note: "วิชัย ส่งเรื่องขออนุมัติ",
      at: "2026-06-18T11:00:00Z",
    },
  ];
  const tl = buildWorkflowTimeline({
    status: "รออนุมัติ",
    receivedById: "officer-001",
    createdAt: "2026-06-17T08:00:00Z",
    statusHistory: sampleHistory,
  });
  if (tl.steps[2]?.state !== "current" || !tl.steps[2]?.at?.startsWith("2026-06-18")) {
    throw new Error("ticket-workflow: timeline pending approval");
  }
  if (rejectionRejectorFromNote("วราภรณ์ ผู้จัดการ ปฏิเสธ: เต็ม") !== "วราภรณ์ ผู้จัดการ") {
    throw new Error("ticket-workflow: rejection rejector");
  }
}
