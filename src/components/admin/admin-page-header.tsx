import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface AdminPageHeaderProps {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function AdminPageHeader({
  icon: Icon,
  iconClassName = "bg-blue-100 text-blue-600",
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}
          aria-hidden
        >
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-zinc-900">{title}</h1>
          <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
