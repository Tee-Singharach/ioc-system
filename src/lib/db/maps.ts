import type { Priority as DbPriority, TicketStatus as DbStatus } from "../../../generated/prisma/client";
import type { Priority, TicketStatus } from "@/lib/types/ticket";

export const statusToApp: Record<DbStatus, TicketStatus> = {
  WAITING_ACK: "รอรับเรื่อง",
  PENDING_APPROVAL: "รออนุมัติ",
  IN_PROGRESS: "กำลังดำเนินการ",
  COMPLETED: "เสร็จสมบูรณ์",
  REJECTED: "ปฏิเสธ",
  CANCELLED: "ยกเลิก",
};

export const statusFromApp: Record<TicketStatus, DbStatus> = {
  "รอรับเรื่อง": "WAITING_ACK",
  "รออนุมัติ": "PENDING_APPROVAL",
  "กำลังดำเนินการ": "IN_PROGRESS",
  "เสร็จสมบูรณ์": "COMPLETED",
  "ปฏิเสธ": "REJECTED",
  "ยกเลิก": "CANCELLED",
};

export const priorityToApp: Record<DbPriority, Priority> = {
  LOW: "ต่ำ",
  MEDIUM: "ปานกลาง",
  HIGH: "สูง",
  URGENT: "เร่งด่วน",
};

export const priorityFromApp: Record<Priority, DbPriority> = {
  ต่ำ: "LOW",
  ปานกลาง: "MEDIUM",
  สูง: "HIGH",
  เร่งด่วน: "URGENT",
};
