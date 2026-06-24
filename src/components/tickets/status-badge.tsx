import type { ComponentProps } from "react";
import type { TicketStatus } from "@/lib/types/ticket";
import { workflowStatusLabel } from "@/lib/ticket-workflow";
import { Badge } from "@/components/ui/badge";

type BadgeColor = NonNullable<ComponentProps<typeof Badge>["color"]>;

const statusColors: Record<TicketStatus, BadgeColor> = {
  "รอรับเรื่อง": "gray",
  "รออนุมัติ": "yellow",
  "กำลังดำเนินการ": "blue",
  "เสร็จสมบูรณ์": "green",
  "ปฏิเสธ": "red",
  "ยกเลิก": "gray",
};

export function StatusBadge({
  status,
  receivedById,
}: {
  status: TicketStatus;
  receivedById?: string | null;
}) {
  const label = workflowStatusLabel({ status, receivedById: receivedById ?? undefined });
  const color =
    status === "รอรับเรื่อง" && receivedById ? "purple" : statusColors[status];
  return <Badge color={color}>{label}</Badge>;
}
