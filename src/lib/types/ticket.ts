export type UserRole = "staff" | "officer" | "manager" | "admin";

export type TicketStatus =
  | "รอรับเรื่อง"
  | "รออนุมัติ"
  | "กำลังดำเนินการ"
  | "เสร็จสมบูรณ์"
  | "ปฏิเสธ"
  | "ยกเลิก";

export type Priority = "ต่ำ" | "ปานกลาง" | "สูง" | "เร่งด่วน";

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  departmentId: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
}

export interface ProgressNote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistoryEntry {
  status: TicketStatus;
  note?: string;
  at: string;
}

export interface Ticket {
  id: string;
  ticketNo: string;
  title: string;
  description: string;
  priority: Priority;
  status: TicketStatus;
  departmentId: string;
  departmentName: string;
  requesterId: string;
  requesterName: string;
  receivedById?: string;
  receivedByName?: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeDepartmentId?: string;
  attachments: Attachment[];
  comments: Comment[];
  progressNotes: ProgressNote[];
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export const TICKET_STATUSES: TicketStatus[] = [
  "รอรับเรื่อง",
  "รออนุมัติ",
  "กำลังดำเนินการ",
  "เสร็จสมบูรณ์",
  "ปฏิเสธ",
  "ยกเลิก",
];

export const PRIORITIES: Priority[] = ["ต่ำ", "ปานกลาง", "สูง", "เร่งด่วน"];

export const OFFICER_UPDATABLE_STATUSES: TicketStatus[] = [
  "กำลังดำเนินการ",
  "รออนุมัติ",
  "เสร็จสมบูรณ์",
];

export interface TicketFormData {
  title: string;
  description: string;
  priority: Priority;
  departmentId: string;
  attachmentNames: string[];
}
