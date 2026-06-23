import type { Ticket } from "@/lib/types/ticket";
import { staffWorkflowHint } from "@/lib/ticket-workflow";

export function StaffWorkflowHint({ ticket }: { ticket: Pick<Ticket, "status" | "receivedById"> }) {
  const hint = staffWorkflowHint(ticket);
  if (!hint) return null;

  const tone =
    ticket.status === "เสร็จสมบูรณ์"
      ? "border-green-200 bg-green-50 text-green-800"
      : ticket.status === "ปฏิเสธ"
        ? "border-red-200 bg-red-50 text-red-800"
        : "border-zinc-200 bg-zinc-50 text-zinc-700";

  return (
    <p className={`rounded-lg border px-3 py-2 text-sm font-medium ${tone}`} role="status">
      {hint}
    </p>
  );
}
