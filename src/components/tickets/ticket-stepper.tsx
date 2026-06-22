import type { StatusHistoryEntry, TicketStatus } from "@/lib/types/ticket";
import type { Ticket } from "@/lib/types/ticket";
import { TICKET_WORKFLOW_STEPS, workflowStepIndex } from "@/lib/ticket-workflow";

const TERMINAL: TicketStatus[] = ["ปฏิเสธ", "ยกเลิก"];
const STEPS = TICKET_WORKFLOW_STEPS.length;
const DOT = 32;
const DOT_CENTER = DOT / 2;
/** จุดกลางวงแรก/สุดท้ายบน grid เท่าๆ กัน (1/10 กับ 9/10) */
const TRACK_INSET = `${50 / STEPS}%`;

export function TicketStepper({
  ticket,
}: {
  ticket: Pick<Ticket, "status" | "receivedById" | "statusHistory">;
}) {
  const current = workflowStepIndex(ticket);
  const allDone = ticket.status === "เสร็จสมบูรณ์";
  const isTerminal = TERMINAL.includes(ticket.status);
  const last = STEPS - 1;
  const progressPct = allDone ? 100 : (current / last) * 100;
  const trackWidth = `calc(100% - ${100 / STEPS}%)`;

  return (
    <div className="relative w-full pt-0.5">
      <div
        className="pointer-events-none absolute h-[3px] rounded-full bg-zinc-200"
        style={{ top: DOT_CENTER - 1.5, left: TRACK_INSET, width: trackWidth }}
        aria-hidden
      />
      {!isTerminal && (
        <div
          className="pointer-events-none absolute h-[3px] rounded-full bg-emerald-500 transition-[width] duration-300 ease-out"
          style={{
            top: DOT_CENTER - 1.5,
            left: TRACK_INSET,
            width: `calc(${trackWidth} * ${progressPct / 100})`,
          }}
          aria-hidden
        />
      )}

      <ol
        className="relative grid w-full gap-0"
        style={{ gridTemplateColumns: `repeat(${STEPS}, minmax(0, 1fr))` }}
        aria-label="ขั้นตอนสถานะคำร้อง"
      >
        {TICKET_WORKFLOW_STEPS.map((step, index) => {
          const done = allDone || (!isTerminal && index < current);
          const active = !isTerminal && !allDone && index === current;

          return (
            <li key={step.id} className="relative z-10 flex min-w-0 flex-col items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25"
                    : active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25 ring-4 ring-blue-100"
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
                className={`mt-2 w-full px-0.5 text-center text-[10px] leading-snug font-medium sm:text-xs ${
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

/** @deprecated use ticket prop — kept for type export compatibility */
export type { StatusHistoryEntry };
