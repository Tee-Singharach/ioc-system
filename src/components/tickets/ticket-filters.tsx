"use client";

import type { Priority } from "@/lib/types/ticket";
import { PRIORITIES } from "@/lib/types/ticket";
import { MOCK_DEPARTMENTS } from "@/lib/mock/data";
import { Search } from "lucide-react";
import { Select } from "@/components/ui/select";
import { TicketStatusTabs, type StatusTab } from "@/components/tickets/ticket-status-tabs";

interface TicketFilterBarProps {
  search: string;
  statusTab: StatusTab;
  tabCounts: Record<StatusTab, number>;
  departmentId: string;
  priority: Priority | "";
  onSearchChange: (v: string) => void;
  onStatusTabChange: (tab: StatusTab) => void;
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
  return (
    <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-4 sm:px-5 xl:flex-row xl:items-center xl:gap-4">
      <TicketStatusTabs
        active={statusTab}
        counts={tabCounts}
        onChange={onStatusTabChange}
        className="min-w-0 xl:flex-1"
      />

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:gap-2">
        <label className="relative block w-full sm:w-36 lg:w-40">
          <span className="sr-only">ค้นหา</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหา..."
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <Select
          label=""
          aria-label="แผนก"
          value={departmentId}
          onChange={(e) => onDepartmentChange(e.target.value)}
          className="w-full min-w-[9rem] sm:w-auto"
          options={[
            { value: "", label: "ทุกฝ่าย" },
            ...MOCK_DEPARTMENTS.map((d) => ({ value: d.id, label: d.name })),
          ]}
        />
        <Select
          label=""
          aria-label="ความสำคัญ"
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value as Priority | "")}
          className="w-full min-w-[9rem] sm:w-auto"
          options={[
            { value: "", label: "ทุกความสำคัญ" },
            ...PRIORITIES.map((p) => ({ value: p, label: p })),
          ]}
        />
      </div>
    </div>
  );
}
