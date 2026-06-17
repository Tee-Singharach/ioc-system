import { type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = "", id, ...props }: SelectProps) {
  const selectId = id ?? label?.replace(/\s/g, "-").toLowerCase();
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={selectId} className="text-sm font-medium text-zinc-700">{label}</label>}
      <select
        id={selectId}
        className={`rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
