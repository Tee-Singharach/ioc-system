import type { StatusHistoryEntry, TicketStatus } from "@/lib/types/ticket";

const STEPS = [
  { status: "รอรับเรื่อง" as TicketStatus, label: "คำร้องใหม่" },
  { status: "กำลังดำเนินการ" as TicketStatus, label: "กำลังดำเนินการ" },
  { status: "รออนุมัติ" as TicketStatus, label: "รออนุมัติ" },
  { status: "เสร็จสมบูรณ์" as TicketStatus, label: "เสร็จสิ้น" },
];

const TERMINAL: TicketStatus[] = ["ปฏิเสธ", "ยกเลิก"];

function stepIndex(status: TicketStatus, history: StatusHistoryEntry[]) {
  if (status === "เสร็จสมบูรณ์") return STEPS.length - 1;
  const idx = STEPS.findIndex((s) => s.status === status);
  if (idx >= 0) return idx;
  if (TERMINAL.includes(status)) {
    let max = 0;
    for (const h of history) {
      const i = STEPS.findIndex((s) => s.status === h.status);
      if (i > max) max = i;
    }
    return max;
  }
  return 0;
}

export function TicketStepper({
  status,
  history,
}: {
  status: TicketStatus;
  history: StatusHistoryEntry[];
}) {
  const current = stepIndex(status, history);
  const allDone = status === "เสร็จสมบูรณ์";
  const isTerminal = TERMINAL.includes(status);
  const progressPct = allDone ? 100 : (current / (STEPS.length - 1)) * 100;

  return (
    <div className="relative w-full">
      <div
        className="absolute top-4 right-4 left-4 h-0.5 bg-zinc-200"
        aria-hidden
      />
      {!isTerminal && (
        <div
          className="absolute top-4 left-4 h-0.5 bg-emerald-500 transition-[width]"
          style={{ width: `calc((100% - 2rem) * ${progressPct / 100})` }}
          aria-hidden
        />
      )}

      <ol className="relative flex w-full justify-between" aria-label="ขั้นตอนสถานะคำร้อง">
        {STEPS.map((step, index) => {
          const done = allDone || (!isTerminal && index < current);
          const active = !isTerminal && !allDone && index === current;

          return (
            <li key={step.status} className="flex flex-col items-center">
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-blue-600 text-white ring-4 ring-blue-100"
                      : "border-2 border-zinc-200 bg-white text-zinc-400"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {done ? (
                  <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" aria-hidden>
                    <path
                      d="M2 6l2.5 2.5L10 3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <p
                className={`mt-2 max-w-[4.5rem] text-center text-xs leading-snug font-medium sm:max-w-none sm:text-sm ${
                  done || active ? "text-zinc-900" : "text-zinc-400"
                }`}
              >
                {step.label}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
