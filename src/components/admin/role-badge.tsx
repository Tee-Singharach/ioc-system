import { ROLE_BADGE_CLASS, ROLE_TAB_LABELS } from "@/lib/admin-ui";
import type { UserRole } from "@/lib/types/ticket";

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${ROLE_BADGE_CLASS[role]}`}
    >
      {ROLE_TAB_LABELS[role]}
    </span>
  );
}
