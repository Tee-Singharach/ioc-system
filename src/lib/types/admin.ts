import type { UserRole } from "@/lib/types/ticket";

export interface ManagedUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  departmentId: string;
  deletedAt?: string;
}

export interface ManagedDepartment {
  id: string;
  name: string;
  shortName?: string;
  deletedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  target: string;
  actorId: string;
  actorName: string;
  at: string;
  detail?: string;
}
