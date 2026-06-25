import type { LucideIcon } from "lucide-react";

export function ListEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-300">
        <Icon className="h-8 w-8" strokeWidth={1.5} aria-hidden />
      </div>
      <p className="mt-5 text-sm font-medium text-zinc-700">{title}</p>
      {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
    </div>
  );
}
