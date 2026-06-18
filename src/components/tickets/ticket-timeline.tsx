import type { StatusHistoryEntry, TicketStatus } from "@/lib/types/ticket";

const PIPELINE = [
  { label: "รับเรื่อง", status: "รอรับเรื่อง" as TicketStatus },
  { label: "กำลังดำเนินการ", status: "กำลังดำเนินการ" as TicketStatus },
  { label: "รออนุมัติ", status: "รออนุมัติ" as TicketStatus },
  { label: "เสร็จสิ้น", status: "เสร็จสมบูรณ์" as TicketStatus },
] as const;

const TERMINAL: TicketStatus[] = ["ปฏิเสธ", "ยกเลิก"];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function activeStepIndex(status: TicketStatus, history: StatusHistoryEntry[]): number {
  if (status === "เสร็จสมบูรณ์") return PIPELINE.length;
  const idx = PIPELINE.findIndex((s) => s.status === status);
  if (idx >= 0) return idx;
  if (TERMINAL.includes(status)) {
    let max = 0;
    for (const h of history) {
      const i = PIPELINE.findIndex((s) => s.status === h.status);
      if (i > max) max = i;
    }
    return max;
  }
  return 0;
}

function stepTimestamp(index: number, history: StatusHistoryEntry[]): string | undefined {
  if (index === 0) {
    const received = history.find((h) => h.status === "กำลังดำเนินการ");
    if (received) return formatDateTime(received.at);
    const submitted = history.find((h) => h.status === "รอรับเรื่อง");
    return submitted ? formatDateTime(submitted.at) : undefined;
  }
  const entry = history.find((h) => h.status === PIPELINE[index].status);
  return entry ? formatDateTime(entry.at) : undefined;
}

export function TicketTimeline({
  status,
  history,
}: {
  status: TicketStatus;
  history: StatusHistoryEntry[];
}) {
  const current = activeStepIndex(status, history);
  const isTerminal = TERMINAL.includes(status);
  const allDone = status === "เสร็จสมบูรณ์";

  return (
    <div>
      <ol className="relative" aria-label="ขั้นตอนสถานะคำร้อง">
        {PIPELINE.map((step, index) => {
          const done = allDone || (!isTerminal && index < current);
          const active = !isTerminal && !allDone && index === current;
          const lineDone = allDone || index < current;
          const timestamp = stepTimestamp(index, history);

          return (
            <li key={step.label} className="relative flex gap-3 pb-0 last:pb-0">
              <div className="flex w-5 shrink-0 flex-col items-center">
                <div
                  className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    done
                      ? "border-blue-600 bg-blue-600"
                      : active
                        ? "border-blue-600 bg-white ring-4 ring-blue-100"
                        : "border-zinc-300 bg-white"
                  }`}
                  aria-current={active ? "step" : undefined}
                >
                  {done && (
                    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" aria-hidden>
                      <path
                        d="M2 6l2.5 2.5L10 3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {active && <span className="h-2 w-2 rounded-full bg-blue-600" aria-hidden />}
                </div>
                {index < PIPELINE.length - 1 && (
                  <div
                    className={`my-1 w-0.5 min-h-12 ${lineDone ? "bg-blue-600" : "bg-zinc-200"}`}
                    aria-hidden
                  />
                )}
              </div>

              <div className={`min-w-0 flex-1 ${index < PIPELINE.length - 1 ? "pb-6" : "pb-1"}`}>
                <p
                  className={`text-sm leading-tight font-medium ${
                    done || active ? "text-zinc-900" : "text-zinc-400"
                  }`}
                >
                  {step.label}
                </p>
                {timestamp && (
                  <p className="mt-0.5 text-xs text-zinc-400">{timestamp}</p>
                )}
                {active && !timestamp && (
                  <p className="mt-0.5 text-xs text-blue-600">ขั้นตอนปัจจุบัน</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {isTerminal && (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-xs font-medium ${
            status === "ปฏิเสธ" ? "bg-red-50 text-red-700" : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {status === "ปฏิเสธ" ? "คำร้องถูกปฏิเสธ" : "คำร้องถูกยกเลิก"}
        </p>
      )}
    </div>
  );
}
