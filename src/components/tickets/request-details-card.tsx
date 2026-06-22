"use client";

import type { RequestItemGroup } from "@/lib/types/ticket";
import type { Ticket } from "@/lib/types/ticket";
import type { FieldDef, TicketCategoryConfig } from "@/lib/ticket-categories";
import {
  formatFieldDisplay,
  getCategoryConfig,
  getRequestFields,
  itemGroupFromStored,
  resolveCategoryId,
} from "@/lib/ticket-categories";

function ReadOnlyField({
  label,
  value,
  multiline,
}: {
  label: string;
  value?: string | null;
  multiline?: boolean;
}) {
  const text = value?.trim();
  if (!text) return null;
  return (
    <div>
      <p className="ioc-label">{label}</p>
      <p
        className={`mt-1.5 text-sm text-zinc-900 ${multiline ? "whitespace-pre-wrap leading-relaxed" : ""}`}
      >
        {text}
      </p>
    </div>
  );
}

function ItemGroupFields({
  field,
  value,
  showHeader,
  sectionTitle,
  sectionHint,
}: {
  field: FieldDef;
  value: string | number | RequestItemGroup | undefined;
  showHeader?: boolean;
  sectionTitle?: string;
  sectionHint?: string;
}) {
  const group = itemGroupFromStored(value, field);
  const unitFields = field.unitDetailFields ?? [];
  const hasUnitDetails = unitFields.length > 0;
  const unitWord = field.unitSuffix ?? "รายการ";
  const qty = Math.max(1, Number(group.quantity.replace(/\D/g, "")) || 1);

  const unitBlocks = hasUnitDetails
    ? group.units.slice(0, qty).map((unit, index) => (
        <div key={index} className={index > 0 ? "pt-4" : undefined}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            รายละเอียด{unitWord}ที่ {index + 1}
          </p>
          <div className="space-y-3">
            {unitFields.map((uf) => (
              <ReadOnlyField
                key={uf.key}
                label={uf.label}
                value={unit[uf.key]}
                multiline={uf.kind === "textarea"}
              />
            ))}
          </div>
        </div>
      ))
    : null;

  if (field.itemNamePerUnit && hasUnitDetails) {
    return (
      <>
        {showHeader && (
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              {sectionTitle && (
                <h2 className="text-sm font-semibold text-zinc-800">{sectionTitle}</h2>
              )}
              {sectionHint && (
                <p className={`text-sm text-zinc-500 ${sectionTitle ? "mt-1" : ""}`}>{sectionHint}</p>
              )}
            </div>
            <p className="text-sm font-medium text-zinc-700">
              {qty} {unitWord}
            </p>
          </div>
        )}
        <div className="space-y-4">{unitBlocks}</div>
      </>
    );
  }

  return (
    <div className="space-y-4">
      {!showHeader && sectionTitle && (
        <p className="ioc-label">
          {sectionTitle}
          {sectionHint && (
            <span className="font-normal text-zinc-400"> · {sectionHint}</span>
          )}
        </p>
      )}
      <div
        className={`grid gap-4 ${field.showUnit ? "sm:grid-cols-[1fr_9rem_5rem]" : "sm:grid-cols-[1fr_9rem]"}`}
      >
        <ReadOnlyField label={field.itemNameLabel ?? "ชนิด / รายการ"} value={group.itemName} />
        <ReadOnlyField
          label={field.quantityLabel ?? "จำนวน"}
          value={`${group.quantity}${hasUnitDetails ? ` ${unitWord}` : ""}`}
        />
        {field.showUnit && <ReadOnlyField label="หน่วย" value={group.unit} />}
      </div>
      {unitBlocks}
    </div>
  );
}

function RequestFieldDisplay({ field, value }: { field: FieldDef; value: unknown }) {
  if (field.kind === "itemGroup") return null;

  const display = formatFieldDisplay(field, value as string | number | undefined);
  if (!display) return null;

  return (
    <ReadOnlyField
      label={field.label}
      value={display}
      multiline={field.kind === "textarea"}
    />
  );
}

function CategoryRequestFields({
  config,
  fields,
  details,
}: {
  config: TicketCategoryConfig;
  fields: FieldDef[];
  details: Record<string, unknown>;
}) {
  const categoryHints = config.formHints;
  const perUnitItemGroup =
    fields.length === 1 && fields[0].kind === "itemGroup" && fields[0].itemNamePerUnit;

  const visibleFields = fields.filter((field) => {
    if (field.kind === "itemGroup") {
      return formatFieldDisplay(field, details[field.key] as string | number | RequestItemGroup | undefined) != null;
    }
    const v = details[field.key];
    return v != null && v !== "";
  });

  if (visibleFields.length === 0) return null;

  return (
    <section className="mt-6">
      {!perUnitItemGroup && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-zinc-800">{config.label}</h2>
          {categoryHints?.summary && (
            <p className="mt-1 text-sm text-zinc-500">{categoryHints.summary}</p>
          )}
        </div>
      )}

      <div className="space-y-4">
        {visibleFields.map((field) => {
          if (field.kind === "itemGroup") {
            return (
              <ItemGroupFields
                key={field.key}
                field={field}
                value={details[field.key] as string | number | RequestItemGroup | undefined}
                showHeader={perUnitItemGroup}
                sectionTitle={perUnitItemGroup ? config.label : field.label}
                sectionHint={perUnitItemGroup ? categoryHints?.summary : undefined}
              />
            );
          }
          return (
            <RequestFieldDisplay key={field.key} field={field} value={details[field.key]} />
          );
        })}
      </div>
    </section>
  );
}

export function RequestDetailsCard({
  ticket,
  showSummary = true,
  showTitleInSummary = false,
}: {
  ticket: Ticket;
  showSummary?: boolean;
  /** หน้ารายละเอียดมี h1 อยู่แล้ว — ค่าเริ่มต้นไม่แสดงหัวข้อซ้ำ */
  showTitleInSummary?: boolean;
}) {
  const categoryId = resolveCategoryId(ticket);
  const config = getCategoryConfig(categoryId);
  const fields = getRequestFields(categoryId);
  const details = ticket.requestDetails ?? {};

  if (!config) return null;

  const hasCategoryFields = fields.some((f) => {
    if (f.kind === "itemGroup") {
      return formatFieldDisplay(f, details[f.key]) != null;
    }
    const v = details[f.key];
    return v != null && v !== "";
  });

  if (!showSummary && !hasCategoryFields) return null;

  return (
    <div>
      {showSummary && (showTitleInSummary || ticket.description?.trim()) && (
        showTitleInSummary ? (
          <div className="space-y-4">
            <ReadOnlyField label="หัวข้อ" value={ticket.title} />
            <ReadOnlyField label="รายละเอียด" value={ticket.description} multiline />
          </div>
        ) : (
          <ReadOnlyField label="รายละเอียด" value={ticket.description} multiline />
        )
      )}

      {hasCategoryFields && (
        <CategoryRequestFields config={config} fields={fields} details={details} />
      )}
    </div>
  );
}

export function RequestContextBanner({
  departmentName,
  categoryLabel,
  requestDetails,
  categoryId,
}: {
  departmentName: string;
  categoryLabel: string;
  requestDetails?: Record<string, string | number | import("@/lib/types/ticket").RequestItemGroup | import("@/lib/types/ticket").RequestLineItem[]>;
  categoryId: string;
}) {
  const fields = getRequestFields(categoryId);
  const details = requestDetails ?? {};
  const preview = fields
    .slice(0, 2)
    .map((f) => {
      const v = details[f.key];
      if (f.kind === "itemGroup") {
        const group = itemGroupFromStored(v, f);
        if (f.itemNamePerUnit) {
          const qty = Math.max(1, Number(group.quantity.replace(/\D/g, "")) || 1);
          const names = group.units
            .slice(0, qty)
            .map((u) => u.itemName?.trim())
            .filter(Boolean);
          return names.length ? `${names.join(", ")} (${qty} ${f.unitSuffix ?? "รายการ"})` : null;
        }
        return group.itemName.trim() ? `${group.itemName.trim()} × ${group.quantity}` : null;
      }
      const display = formatFieldDisplay(f, v as string | number | undefined);
      return display ? `${f.label}: ${display}` : null;
    })
    .filter(Boolean);

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 text-sm">
      <p className="font-medium text-zinc-800">
        {departmentName} · {categoryLabel}
      </p>
      {preview.length > 0 && (
        <p className="mt-1 text-xs leading-relaxed text-zinc-600">{preview.join(" · ")}</p>
      )}
    </div>
  );
}
