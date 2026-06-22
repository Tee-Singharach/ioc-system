import type { Ticket } from "@/lib/types/ticket";
import { staffWorkflowHint } from "@/lib/ticket-workflow";

export function StaffWorkflowHint({ ticket }: { ticket: Pick<Ticket, "status" | "receivedById"> }) {
  const hint = staffWorkflowHint(ticket);
  if (!hint) return null;

  const tone =
    ticket.status === "รออนุมัติ"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : ticket.status === "กำลังดำเนินการ"
        ? "border-blue-200 bg-blue-50 text-blue-900"
        : ticket.status === "เสร็จสมบูรณ์"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-zinc-200 bg-zinc-50 text-zinc-700";

  return (
    <p className={`rounded-lg border px-3 py-2 text-sm font-medium ${tone}`} role="status">
      {hint}
    </p>
  );
}
