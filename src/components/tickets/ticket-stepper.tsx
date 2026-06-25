import type { StatusHistoryEntry, Ticket, TicketStatus } from "@/lib/types/ticket";
import { formatDateTime } from "@/lib/ticket-progress";
import { buildWorkflowTimeline, rejectionReasonFromNote, rejectionRejectorFromNote, TICKET_WORKFLOW_STEPS, workflowStepIndex } from "@/lib/ticket-workflow";

const TERMINAL: TicketStatus[] = ["ปฏิเสธ", "ยกเลิก"];
const STEPS = TICKET_WORKFLOW_STEPS.length;
const DOT = 32;
const DOT_CENTER = DOT / 2;
const TRACK_INSET = `${50 / STEPS}%`;

export function TicketStepper({
  ticket,
}: {
  ticket: Pick<Ticket, "status" | "receivedById" | "statusHistory" | "createdAt">;
}) {
  const { steps, terminal } = buildWorkflowTimeline(ticket);
  const rejectionReason =
    terminal?.status === "ปฏิเสธ" ? rejectionReasonFromNote(terminal.note) : null;
  const rejectionRejector =
    terminal?.status === "ปฏิเสธ" ? rejectionRejectorFromNote(terminal.note) : null;
  const current = workflowStepIndex(ticket);
  const allDone = ticket.status === "เสร็จสมบูรณ์";
  const isTerminal = TERMINAL.includes(ticket.status);
  const last = STEPS - 1;
  const progressPct = allDone ? 100 : (current / last) * 100;
  const trackWidth = `calc(100% - ${100 / STEPS}%)`;

  return (
    <div className="w-full">
      <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="relative min-w-[36rem] pt-0.5">
          <div
            className="pointer-events-none absolute h-[3px] rounded-full bg-zinc-200"
            style={{ top: DOT_CENTER - 1.5, left: TRACK_INSET, width: trackWidth }}
            aria-hidden
          />
          {!isTerminal && (
            <div
              className="pointer-events-none absolute h-[3px] rounded-full bg-blue-600 transition-[width] duration-300 ease-out"
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
              const tl = steps[index];
              const done = tl.state === "done";
              const rejectedHere = tl.state === "rejected";
              const active = tl.state === "current" && !isTerminal;
              const stepLabel = tl.caption ?? step.label;

              return (
                <li key={step.id} className="relative z-10 flex min-w-0 flex-col items-center px-0.5">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      rejectedHere
                        ? "bg-red-600 text-white shadow-sm shadow-red-600/20 ring-4 ring-red-100"
                        : done
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                          : active
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25 ring-4 ring-blue-100"
                            : "border-2 border-zinc-200 bg-white text-zinc-400"
                    }`}
                    aria-current={active || rejectedHere ? "step" : undefined}
                  >
                    {rejectedHere ? (
                      <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" aria-hidden>
                        <path
                          d="M3 3l6 6M9 3L3 9"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : done ? (
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
                    className={`mt-2 w-full text-center text-[10px] leading-snug font-semibold sm:text-xs ${
                      rejectedHere
                        ? "text-red-700"
                        : active
                          ? "text-blue-600"
                          : done
                            ? "text-emerald-700"
                            : "text-zinc-400"
                    }`}
                  >
                    {stepLabel}
                  </p>
                  <p
                    className={`mt-0.5 w-full text-center text-[10px] tabular-nums sm:text-xs ${
                      tl.displayAt
                        ? rejectedHere
                          ? "font-medium text-red-600"
                          : active
                            ? "font-medium text-blue-600"
                            : done
                              ? "text-zinc-500"
                              : "text-zinc-400"
                        : "text-zinc-300"
                    }`}
                  >
                    {tl.displayAt ? formatDateTime(tl.displayAt) : "—"}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {terminal && (
        <div
          className={`mt-3 rounded-lg border px-3 py-2.5 text-center ${
            terminal.status === "ปฏิเสธ"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-zinc-200 bg-zinc-50 text-zinc-700"
          }`}
          role="status"
        >
          <p className="text-sm font-medium">
            {rejectionRejector ? `ปฏิเสธโดย ${rejectionRejector}` : terminal.status}
            {" · "}
            {formatDateTime(terminal.at)}
          </p>
          {rejectionReason && (
            <p className="mt-1.5 text-sm leading-relaxed">
              <span className="font-medium">เหตุผล:</span> {rejectionReason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** @deprecated use ticket prop — kept for type export compatibility */
export type { StatusHistoryEntry };
