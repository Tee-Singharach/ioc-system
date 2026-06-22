"use client";

import {
  WORKFLOW_FILTER_TABS,
  type WorkflowFilterTab,
} from "@/lib/ticket-workflow";

export type { WorkflowFilterTab as StatusTab };

interface TicketStatusTabsProps {
  active: WorkflowFilterTab;
  counts: Record<WorkflowFilterTab, number>;
  onChange: (tab: WorkflowFilterTab) => void;
  className?: string;
}

export function TicketStatusTabs({ active, counts, onChange, className = "" }: TicketStatusTabsProps) {
  return (
    <div
      className={`-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      role="tablist"
      aria-label="กรองตามขั้นตอนงาน"
    >
      <div className="inline-flex min-w-min items-center gap-0.5 rounded-xl border border-zinc-200/80 bg-zinc-50 p-1">
        {WORKFLOW_FILTER_TABS.map((tab) => {
          const selected = active === tab.id;
          const showDivider = tab.id === "rejected";
          return (
            <span key={tab.id} className="contents">
              {showDivider && (
                <span
                  className="mx-0.5 h-5 w-px shrink-0 bg-zinc-200"
                  aria-hidden
                />
              )}
              <button
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onChange(tab.id)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
                  selected
                    ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/60"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-md px-1.5 py-0.5 text-xs tabular-nums ${
                    selected ? "bg-blue-50 text-blue-600" : "bg-zinc-100/80 text-zinc-400"
                  }`}
                >
                  {counts[tab.id]}
                </span>
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}
