"use client";

interface FilterPillOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface FilterPillsProps<T extends string> {
  options: FilterPillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: "dark" | "brand";
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  variant = "brand",
}: FilterPillsProps<T>) {
  const activeClass =
    variant === "brand"
      ? "bg-blue-600 text-white shadow-sm"
      : "bg-zinc-900 text-white shadow-sm";
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active
                ? activeClass
                : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
            }`}
          >
            {opt.label}
            {opt.count != null ? ` (${opt.count})` : ""}
          </button>
        );
      })}
    </div>
  );
}
