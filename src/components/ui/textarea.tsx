import { type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = "", id, ...props }: TextareaProps) {
  const textareaId = id ?? label?.replace(/\s/g, "-").toLowerCase();
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={textareaId} className="text-sm font-medium text-zinc-700">{label}</label>}
      <textarea
        id={textareaId}
        className={`min-h-24 resize-y rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${error ? "border-red-400" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
