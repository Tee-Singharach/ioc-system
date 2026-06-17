"use client";

import type { TicketStatus, Priority } from "@/lib/types/ticket";
import { PRIORITIES, TICKET_STATUSES } from "@/lib/types/ticket";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface TicketFiltersProps {
  search: string;
  status: TicketStatus | "";
  priority: Priority | "";
  onSearchChange: (v: string) => void;
  onStatusChange: (v: TicketStatus | "") => void;
  onPriorityChange: (v: Priority | "") => void;
}

export function TicketFilters({ search, status, priority, onSearchChange, onStatusChange, onPriorityChange }: TicketFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Input label="ค้นหา" placeholder="เลขที่, หัวข้อ, ผู้แจ้ง..." value={search} onChange={(e) => onSearchChange(e.target.value)} />
      <Select label="สถานะ" value={status} onChange={(e) => onStatusChange(e.target.value as TicketStatus | "")} options={[{ value: "", label: "ทั้งหมด" }, ...TICKET_STATUSES.map((s) => ({ value: s, label: s }))]} />
      <Select label="ความสำคัญ" value={priority} onChange={(e) => onPriorityChange(e.target.value as Priority | "")} options={[{ value: "", label: "ทั้งหมด" }, ...PRIORITIES.map((p) => ({ value: p, label: p }))]} />
    </div>
  );
}
