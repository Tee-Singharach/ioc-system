import type { StatusHistoryEntry, Ticket, TicketStatus } from "@/lib/types/ticket";

/** ป้าย UI สำหรับสถานะ DB `รออนุมัติ` */
export const PENDING_APPROVAL_LABEL = "รอหัวหน้าอนุมัติ";

/** 5 ขั้นบน stepper (ขั้น 1–2 ใช้สถานะ DB เดียวกัน รอรับเรื่อง) */
export const TICKET_WORKFLOW_STEPS = [
  { id: "new", label: "คำร้องใหม่" },
  { id: "evaluating", label: "กำลังประเมิน" },
  { id: "pending_approval", label: PENDING_APPROVAL_LABEL },
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
  { id: "pending_approval", label: PENDING_APPROVAL_LABEL },
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
  if (status === "ปฏิเสธ") {
    const rejectAt = statusHistory.findIndex((h) => h.status === "ปฏิเสธ");
    if (rejectAt > 0) {
      let max = 0;
      for (let i = 0; i < rejectAt; i++) {
        const iStep = historyStepIndex(statusHistory[i]);
        if (iStep > max) max = iStep;
      }
      return max;
    }
    return 2;
  }
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
  if (ticket.status === "รออนุมัติ") return PENDING_APPROVAL_LABEL;
  return ticket.status;
}

export function staffWorkflowHint(ticket: Pick<Ticket, "status" | "receivedById">): string | null {
  if (ticket.status === "รอรับเรื่อง" && !ticket.receivedById) {
    return "รอเจ้าหน้าที่รับเรื่อง";
  }
  if (ticket.status === "รอรับเรื่อง" && ticket.receivedById) {
    return "เจ้าหน้าที่กำลังตรวจสอบและประเมิน";
  }
  if (ticket.status === "รออนุมัติ") return PENDING_APPROVAL_LABEL;
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
  /** ข้อความใต้ชื่อขั้น — สะท้อนผลลัพธ์จริง (ผ่านการประเมิน / อนุมัติ / ปฏิเสธ) */
  caption: string | null;
  /** เวลาที่จับคู่กับ caption */
  displayAt: string | null;
  note?: string;
  state: "done" | "current" | "upcoming" | "rejected";
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

function isApprovalNote(note?: string) {
  return !!note?.includes("อนุมัติ");
}

function stepCaptionAndTime(
  index: number,
  state: WorkflowTimelineStep["state"],
  ticket: Pick<Ticket, "status" | "receivedById">,
  milestones: {
    createdAt: string;
    receiveAt: string | null;
    evalDoneAt: string | null;
    approvalAt: string | null;
    progressAt: string | null;
    doneAt: string | null;
    rejectAt: string | null;
  },
): { caption: string | null; displayAt: string | null } {
  if (state === "upcoming") return { caption: null, displayAt: null };

  switch (index) {
    case 0:
      if (state === "current" && !ticket.receivedById) {
        return { caption: "รอรับเรื่อง", displayAt: milestones.createdAt };
      }
      return { caption: "รับคำร้อง", displayAt: milestones.createdAt };
    case 1:
      if (state === "current") {
        return { caption: "กำลังประเมิน", displayAt: milestones.receiveAt };
      }
      return { caption: "ผ่านการประเมิน", displayAt: milestones.evalDoneAt };
    case 2:
      if (state === "rejected") {
        return { caption: "ปฏิเสธ", displayAt: milestones.rejectAt };
      }
      if (state === "current") {
        return { caption: PENDING_APPROVAL_LABEL, displayAt: milestones.approvalAt };
      }
      return { caption: "อนุมัติ", displayAt: milestones.progressAt };
    case 3:
      if (state === "current") {
        return { caption: "กำลังดำเนินการ", displayAt: milestones.progressAt };
      }
      return { caption: "ดำเนินการแล้ว", displayAt: milestones.progressAt };
    case 4:
      return { caption: "เสร็จสิ้น", displayAt: milestones.doneAt };
    default:
      return { caption: null, displayAt: null };
  }
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
  const progressEntry = firstHistoryEntry(
    statusHistory,
    (e) => e.status === "กำลังดำเนินการ" && isApprovalNote(e.note),
  );
  const progressAnyEntry = firstHistoryEntry(statusHistory, (e) => e.status === "กำลังดำเนินการ");
  const doneEntry = firstHistoryEntry(statusHistory, (e) => e.status === "เสร็จสมบูรณ์");
  const rejectEntry = firstHistoryEntry(statusHistory, (e) => e.status === "ปฏิเสธ");

  const milestoneTimes = {
    createdAt: newEntry?.at ?? createdAt,
    receiveAt: receiveEntry?.at ?? null,
    evalDoneAt: approvalEntry?.at ?? null,
    approvalAt: approvalEntry?.at ?? null,
    progressAt: progressEntry?.at ?? progressAnyEntry?.at ?? null,
    doneAt: doneEntry?.at ?? null,
    rejectAt: rejectEntry?.at ?? null,
  };

  const milestones: { at: string | null; note?: string }[] = [
    { at: milestoneTimes.createdAt, note: newEntry?.note },
    { at: milestoneTimes.receiveAt, note: receiveEntry?.note },
    { at: milestoneTimes.approvalAt, note: approvalEntry?.note },
    { at: milestoneTimes.progressAt, note: progressEntry?.note ?? progressAnyEntry?.note },
    { at: milestoneTimes.doneAt, note: doneEntry?.note },
  ];

  const steps: WorkflowTimelineStep[] = TICKET_WORKFLOW_STEPS.map((step, index) => {
    let state: WorkflowTimelineStep["state"];
    if (allDone) state = "done";
    else if (isTerminal) {
      if (index < currentIdx) state = "done";
      else if (index === currentIdx && status === "ปฏิเสธ") state = "rejected";
      else if (index === currentIdx) state = "current";
      else state = "upcoming";
    } else if (index < currentIdx) state = "done";
    else if (index === currentIdx) state = "current";
    else state = "upcoming";

    const { caption, displayAt } = stepCaptionAndTime(index, state, ticket, milestoneTimes);

    return {
      id: step.id,
      label: step.label,
      at: milestones[index]?.at ?? null,
      caption,
      displayAt,
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
  if (tl.steps[2]?.state !== "current" || tl.steps[2]?.caption !== PENDING_APPROVAL_LABEL) {
    throw new Error("ticket-workflow: timeline pending approval");
  }
  if (tl.steps[0]?.caption !== "รับคำร้อง" || tl.steps[1]?.caption !== "ผ่านการประเมิน") {
    throw new Error("ticket-workflow: timeline captions past eval");
  }
  if (rejectionRejectorFromNote("วราภรณ์ ผู้จัดการ ปฏิเสธ: เต็ม") !== "วราภรณ์ ผู้จัดการ") {
    throw new Error("ticket-workflow: rejection rejector");
  }
  const rejectedTl = buildWorkflowTimeline({
    status: "ปฏิเสธ",
    receivedById: "officer-001",
    createdAt: "2026-06-17T08:00:00Z",
    statusHistory: [
      ...sampleHistory,
      { status: "ปฏิเสธ", note: "ผู้จัดการ ปฏิเสธ: test", at: "2026-06-19T08:00:00Z" },
    ],
  });
  if (rejectedTl.steps[2]?.state !== "rejected" || rejectedTl.steps[2]?.caption !== "ปฏิเสธ") {
    throw new Error("ticket-workflow: rejected at pending approval step");
  }

  const newTl = buildWorkflowTimeline({
    status: "รอรับเรื่อง",
    receivedById: undefined,
    createdAt: "2026-06-17T08:00:00Z",
    statusHistory: [{ status: "รอรับเรื่อง", at: "2026-06-17T08:00:00Z" }],
  });
  if (newTl.steps[0]?.caption !== "รอรับเรื่อง" || newTl.steps[1]?.caption !== null) {
    throw new Error("ticket-workflow: new ticket captions");
  }

  const approvedTl = buildWorkflowTimeline({
    status: "กำลังดำเนินการ",
    receivedById: "officer-001",
    createdAt: "2026-06-17T08:00:00Z",
    statusHistory: [
      ...sampleHistory,
      { status: "กำลังดำเนินการ", note: "ผู้จัดการ อนุมัติให้ดำเนินการ", at: "2026-06-19T09:00:00Z" },
    ],
  });
  if (approvedTl.steps[2]?.caption !== "อนุมัติ") {
    throw new Error("ticket-workflow: approved caption");
  }
}
