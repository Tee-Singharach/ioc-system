import type { StatusHistoryEntry } from "@/lib/types/ticket";
import { StatusBadge } from "@/components/tickets/status-badge";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function TicketTimeline({ history }: { history: StatusHistoryEntry[] }) {
  return (
    <div className="space-y-4">
      {history.map((entry, index) => (
        <div key={`${entry.status}-${entry.at}`} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`h-3 w-3 rounded-full ${index === history.length - 1 ? "bg-blue-600" : "bg-zinc-300"}`} />
            {index < history.length - 1 && <div className="w-px flex-1 bg-zinc-200" />}
          </div>
          <div className="pb-4">
            <StatusBadge status={entry.status} />
            {entry.note && <p className="mt-1 text-sm text-zinc-600">{entry.note}</p>}
            <p className="mt-0.5 text-xs text-zinc-400">{formatDateTime(entry.at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
