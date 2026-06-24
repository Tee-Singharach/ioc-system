export type UserRole = "staff" | "officer" | "manager" | "admin";

export type TicketStatus =
  | "รอรับเรื่อง"
  | "รออนุมัติ"
  | "กำลังดำเนินการ"
  | "เสร็จสมบูรณ์"
  | "ปฏิเสธ"
  | "ยกเลิก";

export type Priority = "ต่ำ" | "ปานกลาง" | "สูง" | "เร่งด่วน";

export interface TicketEvaluation {
  diagnosis: string;
  estimatedCost?: number | null;
  notes?: string;
  evaluatedAt: string;
  evaluatedById: string;
  evaluatedByName: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  departmentId: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  url?: string;
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
  attachments?: Attachment[];
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
  requesterDepartmentId?: string;
  requesterDepartmentName?: string;
  requesterId: string;
  requesterName: string;
  receivedById?: string;
  receivedByName?: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeDepartmentId?: string;
  evaluation?: TicketEvaluation;
  attachments: Attachment[];
  comments: Comment[];
  progressNotes: ProgressNote[];
  statusHistory: StatusHistoryEntry[];
  scheduledStartAt: string;
  scheduledEndAt: string;
  createdAt: string;
  updatedAt: string;
}

export const PRIORITIES: Priority[] = ["ต่ำ", "ปานกลาง", "สูง", "เร่งด่วน"];

export interface TicketAttachmentUpload {
  name: string;
  size: number;
  dataBase64: string;
}

export interface TicketFormData {
  title: string;
  description: string;
  priority: Priority;
  departmentId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  attachmentNames: string[];
  /** ไฟล์ใหม่ที่เลือกจากเครื่อง — ส่ง base64 ไปบันทึกฝั่ง server */
  attachmentUploads?: TicketAttachmentUpload[];
  /** ไฟล์เดิมที่ยังคงไว้ตอนแก้ไขคำร้อง */
  keptAttachmentIds?: string[];
}
