export type UserRole = "staff" | "officer" | "manager" | "admin";

export type TicketStatus =
  | "รอรับเรื่อง"
  | "รออนุมัติ"
  | "กำลังดำเนินการ"
  | "เสร็จสมบูรณ์"
  | "ปฏิเสธ"
  | "ยกเลิก";

export type Priority = "ต่ำ" | "ปานกลาง" | "สูง" | "เร่งด่วน";

export type RecommendedAction =
  | "repair_onsite"
  | "replace_part"
  | "external_repair"
  | "replace_device"
  | "proceed"
  | "other";

/** @deprecated ข้อมูลเก่า — อ่านอย่างเดียว */
export interface RequestLineItem {
  name: string;
  quantity: string;
  unit?: string;
}

/** ชนิด + จำนวน + รายละเอียดต่อหน่วย (เช่น คอมพิวเตอร์ 2 เครื่อง) */
export interface RequestItemGroup {
  itemName: string;
  quantity: string;
  unit?: string;
  units: Record<string, string>[];
}

export interface TicketEvaluation {
  diagnosis: string;
  recommendedAction: RecommendedAction;
  estimatedCost?: number;
  notes?: string;
  details?: Record<string, string | number | RequestItemGroup>;
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

export interface Department {
  id: string;
  name: string;
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
  categoryId?: string;
  categoryLabel?: string;
  requestDetails?: Record<string, string | number | RequestLineItem[] | RequestItemGroup>;
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

export const TICKET_STATUSES: TicketStatus[] = [
  "รอรับเรื่อง",
  "รออนุมัติ",
  "กำลังดำเนินการ",
  "เสร็จสมบูรณ์",
  "ปฏิเสธ",
  "ยกเลิก",
];

export const PRIORITIES: Priority[] = ["ต่ำ", "ปานกลาง", "สูง", "เร่งด่วน"];

/** Officer ปิดงานได้เมื่อดำเนินการเสร็จแล้วเท่านั้น */
export const OFFICER_COMPLETABLE_STATUS: TicketStatus = "เสร็จสมบูรณ์";

export interface TicketFormData {
  title: string;
  description: string;
  priority: Priority;
  departmentId: string;
  categoryId: string;
  requestDetails: Record<string, string>;
  scheduledStartAt: string;
  scheduledEndAt: string;
  attachmentNames: string[];
}

/** ค่าเริ่มต้นตอนแก้ไข */
export type TicketFormInitialDetails = Record<
  string,
  string | number | RequestLineItem[] | RequestItemGroup
>;
