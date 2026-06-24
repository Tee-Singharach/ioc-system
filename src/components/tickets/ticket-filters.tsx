"use client";

import type { Priority } from "@/lib/types/ticket";
import { PRIORITIES } from "@/lib/types/ticket";
import { useCatalog } from "@/providers/catalog-provider";
import { Search } from "lucide-react";
import { Select } from "@/components/ui/select";
import type { WorkflowFilterTab } from "@/lib/ticket-workflow";
import { TicketStatusTabs } from "@/components/tickets/ticket-status-tabs";

interface TicketFilterBarProps {
  search: string;
  statusTab: WorkflowFilterTab;
  tabCounts: Record<WorkflowFilterTab, number>;
  departmentId: string;
  priority: Priority | "";
  onSearchChange: (v: string) => void;
  onStatusTabChange: (tab: WorkflowFilterTab) => void;
  onDepartmentChange: (v: string) => void;
  onPriorityChange: (v: Priority | "") => void;
}

export function TicketFilterBar({
  search,
  statusTab,
  tabCounts,
  departmentId,
  priority,
  onSearchChange,
  onStatusTabChange,
  onDepartmentChange,
  onPriorityChange,
}: TicketFilterBarProps) {
  const { departments } = useCatalog();

  return (
    <div className="space-y-4 border-b border-zinc-100 bg-zinc-50/40 px-4 py-4 sm:px-5">
      <TicketStatusTabs
        active={statusTab}
        counts={tabCounts}
        onChange={onStatusTabChange}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <label className="relative block min-w-0 flex-1 sm:max-w-xs">
          <span className="sr-only">ค้นหา</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาเลขที่ หัวข้อ ผู้ยื่น..."
            className="h-[38px] w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <div className="flex gap-2 sm:shrink-0">
          <Select
            label=""
            aria-label="แผนก"
            value={departmentId}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="min-w-0 flex-1 sm:w-36"
            options={[
              { value: "", label: "ทุกฝ่าย" },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
          />
          <Select
            label=""
            aria-label="ความสำคัญ"
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value as Priority | "")}
            className="min-w-0 flex-1 sm:w-36"
            options={[
              { value: "", label: "ทุกความสำคัญ" },
              ...PRIORITIES.map((p) => ({ value: p, label: p })),
            ]}
          />
        </div>
      </div>
    </div>
  );
}
