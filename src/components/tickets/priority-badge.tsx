import type { ComponentProps } from "react";
import type { Priority } from "@/lib/types/ticket";
import { Badge } from "@/components/ui/badge";

type BadgeColor = NonNullable<ComponentProps<typeof Badge>["color"]>;

const priorityColors: Record<Priority, BadgeColor> = {
  ต่ำ: "gray", ปานกลาง: "blue", สูง: "yellow", เร่งด่วน: "red",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge color={priorityColors[priority]}>{priority}</Badge>;
}
