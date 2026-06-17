import type { ComponentProps } from "react";
import type { TicketStatus } from "@/lib/types/ticket";
import { Badge } from "@/components/ui/badge";

type BadgeColor = NonNullable<ComponentProps<typeof Badge>["color"]>;

const statusColors: Record<TicketStatus, BadgeColor> = {
  "รอรับเรื่อง": "yellow",
  "รออนุมัติ": "purple",
  "กำลังดำเนินการ": "blue",
  "เสร็จสมบูรณ์": "green",
  "ปฏิเสธ": "red",
  "ยกเลิก": "gray",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <Badge color={statusColors[status]}>{status}</Badge>;
}
