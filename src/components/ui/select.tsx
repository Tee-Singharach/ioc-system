import { type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  required?: boolean;
  error?: string;
}

export function Select({ label, options, required, error, className = "", id, ...props }: SelectProps) {
  const selectId = id ?? label?.replace(/\s/g, "-").toLowerCase();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="ioc-label">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${error ? "border-red-400" : ""} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
