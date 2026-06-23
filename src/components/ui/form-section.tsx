import type { ReactNode } from "react";

export const FORM_FIELD_CLASS = "py-2 text-sm";

export function FormSection({
  title,
  hint,
  children,
  isFirst = false,
}: {
  title?: string;
  hint?: string;
  children: ReactNode;
  isFirst?: boolean;
}) {
  const hasHeader = title || hint;
  return (
    <section className={isFirst ? "" : "border-t border-zinc-100"}>
      <div className={`px-5 py-3 sm:px-6 ${isFirst ? "pt-3.5" : ""}`}>
        {hasHeader && (
          <div className="mb-1.5">
            {title && <h2 className="text-sm font-semibold text-zinc-800">{title}</h2>}
            {hint && (
              <p className={`text-xs leading-snug text-zinc-500 ${title ? "mt-0.5" : ""}`}>{hint}</p>
            )}
          </div>
        )}
        <div className="space-y-2">{children}</div>
      </div>
    </section>
  );
}
