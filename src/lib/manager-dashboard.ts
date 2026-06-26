import type { Ticket, TicketStatus, User } from "@/lib/types/ticket";
import { isTicketOverdue } from "@/lib/ticket-progress";
import { getManagerDepartmentTickets } from "@/lib/manager-access";
import { sortTicketsByRecent } from "@/lib/ticket-sort";

export interface DashboardStatBlock {
  newTickets: number;
  overdue: number;
  pending: number;
  slaPercent: number;
}

export interface ActivityDay {
  label: string;
  created: number;
  completed: number;
}

export interface StatusSlice {
  status: TicketStatus;
  count: number;
}

const DONUT_STATUSES: TicketStatus[] = [
  "รอรับเรื่อง",
  "กำลังดำเนินการ",
  "รออนุมัติ",
  "เสร็จสมบูรณ์",
  "ปฏิเสธ",
  "ยกเลิก",
];

/** แสดงใน legend เสมอ (แม้ count = 0) */
const DONUT_LEGEND_ALWAYS: TicketStatus[] = [
  "รอรับเรื่อง",
  "กำลังดำเนินการ",
  "รออนุมัติ",
  "เสร็จสมบูรณ์",
];

const DONUT_COLORS: Record<TicketStatus, string> = {
  "รอรับเรื่อง": "#0284c7",
  "กำลังดำเนินการ": "#f59e0b",
  "รออนุมัติ": "#9333ea",
  "เสร็จสมบูรณ์": "#22c55e",
  "ปฏิเสธ": "#dc2626",
  "ยกเลิก": "#78716c",
};

const DONUT_LABELS: Partial<Record<TicketStatus, string>> = {
  "รอรับเรื่อง": "คำร้องใหม่",
  "เสร็จสมบูรณ์": "เสร็จสิ้น",
};

export function donutColor(status: TicketStatus) {
  return DONUT_COLORS[status];
}

export function donutStatusLabel(status: TicketStatus) {
  return DONUT_LABELS[status] ?? status;
}

function dayStart(offset: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - offset);
  return d;
}

export function getManagerDashboardBlock(
  tickets: Ticket[],
  manager: Pick<User, "departmentId">,
): DashboardStatBlock {
  const dept = getManagerDepartmentTickets(tickets, manager);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newTickets = dept.filter((t) => new Date(t.createdAt).getTime() >= weekAgo).length;
  const overdue = dept.filter((t) => isTicketOverdue(t)).length;
  const pending = dept.filter((t) => t.status === "รออนุมัติ").length;
  const completed = dept.filter((t) => t.status === "เสร็จสมบูรณ์");
  const onTime = completed.filter(
    (t) => new Date(t.updatedAt).getTime() <= new Date(t.scheduledEndAt).getTime(),
  ).length;
  const slaPercent = completed.length === 0 ? 0 : Math.round((onTime / completed.length) * 100);

  return { newTickets, overdue, pending, slaPercent };
}

export function getTicketActivitySeries(
  tickets: Ticket[],
  manager: Pick<User, "departmentId">,
  days: number,
): ActivityDay[] {
  const dept = getManagerDepartmentTickets(tickets, manager);
  const series: ActivityDay[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const start = dayStart(i);
    const end = dayStart(i - 1);
    const label = start.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
    const created = dept.filter((t) => {
      const at = new Date(t.createdAt);
      return at >= start && at < end;
    }).length;
    const completed = dept.filter((t) =>
      t.statusHistory.some((h) => {
        if (h.status !== "เสร็จสมบูรณ์") return false;
        const at = new Date(h.at);
        return at >= start && at < end;
      }),
    ).length;
    series.push({ label, created, completed });
  }

  return series;
}

export function getStatusDistribution(
  tickets: Ticket[],
  manager: Pick<User, "departmentId">,
): StatusSlice[] {
  const dept = getManagerDepartmentTickets(tickets, manager);
  const counts = new Map<TicketStatus, number>();
  for (const status of DONUT_STATUSES) {
    counts.set(status, dept.filter((t) => t.status === status).length);
  }

  const always = DONUT_LEGEND_ALWAYS.map((status) => ({
    status,
    count: counts.get(status) ?? 0,
  }));

  const extra = DONUT_STATUSES.filter(
    (s) => !DONUT_LEGEND_ALWAYS.includes(s) && (counts.get(s) ?? 0) > 0,
  ).map((status) => ({ status, count: counts.get(status) ?? 0 }));

  return [...always, ...extra];
}

export function getLatestDepartmentTickets(
  tickets: Ticket[],
  manager: Pick<User, "departmentId">,
  limit = 5,
): Ticket[] {
  return sortTicketsByRecent(getManagerDepartmentTickets(tickets, manager)).slice(0, limit);
}
