"use client";

import type { TicketStatus } from "@/lib/types/ticket";

export type StatusTab = "all" | TicketStatus;

export const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "รอรับเรื่อง", label: "คำร้องใหม่" },
  { id: "กำลังดำเนินการ", label: "กำลังดำเนินการ" },
  { id: "รออนุมัติ", label: "รออนุมัติ" },
  { id: "เสร็จสมบูรณ์", label: "เสร็จสิ้น" },
  { id: "ปฏิเสธ", label: "ปฏิเสธ" },
];

interface TicketStatusTabsProps {
  active: StatusTab;
  counts: Record<StatusTab, number>;
  onChange: (tab: StatusTab) => void;
  className?: string;
}

export function TicketStatusTabs({ active, counts, onChange, className = "" }: TicketStatusTabsProps) {
  return (
    <div
      className={`flex gap-1.5 overflow-x-auto ${className}`}
      role="tablist"
      aria-label="กรองตามสถานะ"
    >
      {STATUS_TABS.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              selected
                ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
            }`}
          >
            {tab.label}
            <span className={`ml-1 ${selected ? "text-blue-600" : "text-zinc-400"}`}>
              {counts[tab.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
