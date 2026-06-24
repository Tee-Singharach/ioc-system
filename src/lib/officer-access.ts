import type { Ticket, TicketStatus, User } from "@/lib/types/ticket";

const TERMINAL_STATUSES: TicketStatus[] = ["เสร็จสมบูรณ์", "ปฏิเสธ", "ยกเลิก"];

export function getInboxPendingTickets(
  tickets: Ticket[],
  officer: Pick<User, "departmentId">,
): Ticket[] {
  return tickets.filter(
    (t) =>
      t.status === "รอรับเรื่อง" &&
      !t.receivedById &&
      t.departmentId === officer.departmentId,
  );
}

function isOfficerMyTask(
  t: Ticket,
  officer: Pick<User, "id">,
): boolean {
  if (TERMINAL_STATUSES.includes(t.status)) return false;
  if (t.assigneeId !== officer.id && t.receivedById !== officer.id) return false;
  if (t.status === "รอรับเรื่อง" && !t.receivedById) return false;
  return true;
}

export function getOfficerMyTasks(
  tickets: Ticket[],
  officer: Pick<User, "id" | "departmentId">,
): Ticket[] {
  return tickets.filter((t) => isOfficerMyTask(t, officer));
}

/** งานของฉัน — ประเมิน / รออนุมัติ (ยังไม่เข้าขั้นดำเนินการ) */
export function getOfficerAssignedTasks(
  tickets: Ticket[],
  officer: Pick<User, "id" | "departmentId">,
): Ticket[] {
  return getOfficerMyTasks(tickets, officer).filter((t) => t.status !== "กำลังดำเนินการ");
}

/** แท็บดำเนินการ — กำลังดำเนินการที่รับหรือได้รับมอบหมาย */
export function getOfficerInProgressTasks(
  tickets: Ticket[],
  officer: Pick<User, "id" | "departmentId">,
): Ticket[] {
  return getOfficerMyTasks(tickets, officer).filter((t) => t.status === "กำลังดำเนินการ");
}

export function getOfficerTickets(tickets: Ticket[], officer: Pick<User, "id" | "departmentId">): Ticket[] {
  return tickets.filter(
    (t) =>
      t.departmentId === officer.departmentId ||
      t.assigneeId === officer.id ||
      t.receivedById === officer.id,
  );
}

export function canOfficerViewTicket(ticket: Ticket, officer: Pick<User, "id" | "departmentId">): boolean {
  return getOfficerTickets([ticket], officer).length > 0;
}

/** ดำเนินการ workflow ได้จากกล่องงาน — งานรอรับในแผนก หรืองานที่รับ/ได้รับมอบหมายแล้ว */
export function canOfficerActOnTicket(ticket: Ticket, officer: Pick<User, "id" | "departmentId">): boolean {
  if (
    ticket.status === "รอรับเรื่อง" &&
    !ticket.receivedById &&
    ticket.departmentId === officer.departmentId
  ) {
    return true;
  }
  return ticket.receivedById === officer.id || ticket.assigneeId === officer.id;
}

export function homePathForRole(role: User["role"]): string {
  if (role === "officer") return "/officer/inbox";
  if (role === "manager") return "/manager/dashboard";
  if (role === "admin") return "/admin/users";
  if (role === "staff") return "/tickets";
  return "/login";
}

if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  const sample: Ticket[] = [
    {
      id: "a",
      status: "กำลังดำเนินการ",
      departmentId: "dept-it",
      assigneeId: "officer-001",
      receivedById: "officer-001",
    } as Ticket,
    {
      id: "b",
      status: "กำลังดำเนินการ",
      departmentId: "dept-it",
      assigneeId: "officer-001",
      receivedById: "officer-001",
    } as Ticket,
  ];
  const assigned = getOfficerAssignedTasks(sample, { id: "officer-001", departmentId: "dept-it" });
  const inProgress = getOfficerInProgressTasks(sample, { id: "officer-001", departmentId: "dept-it" });
  if (assigned.length !== 0 || inProgress.length !== 2) {
    throw new Error("officer-access: assigned vs in-progress split");
  }
  const peer = getOfficerInProgressTasks(sample, { id: "officer-002", departmentId: "dept-it" });
  if (peer.length !== 0) {
    throw new Error("officer-access: in-progress tab is own tasks only");
  }
}
