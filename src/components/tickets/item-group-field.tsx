"use client";

import { Minus, Plus } from "lucide-react";
import type { RequestItemGroup } from "@/lib/types/ticket";
import type { FieldDef } from "@/lib/ticket-categories";
import {
  defaultItemGroupJson,
  parseItemGroupJson,
  serializeItemGroup,
  syncItemGroupUnits,
} from "@/lib/ticket-categories";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function QuantityStepper({
  label,
  value,
  onChange,
  suffix,
  compact,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  compact?: boolean;
}) {
  const n = Math.max(1, Number(value.replace(/\D/g, "")) || 1);

  const controls = (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-stretch overflow-hidden rounded-lg border border-zinc-300 bg-white ${
          compact ? "h-[34px]" : "h-[38px]"
        }`}
      >
        <button
          type="button"
          aria-label="ลดจำนวน"
          disabled={n <= 1}
          onClick={() => onChange(String(Math.max(1, n - 1)))}
          className="flex w-9 shrink-0 items-center justify-center text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          aria-label={label}
          value={value}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            onChange(digits || "1");
          }}
          className="w-12 border-x border-zinc-300 px-2 text-center text-sm outline-none focus:bg-blue-50/50"
        />
        <button
          type="button"
          aria-label="เพิ่มจำนวน"
          onClick={() => onChange(String(n + 1))}
          className="flex w-9 shrink-0 items-center justify-center text-zinc-600 transition-colors hover:bg-zinc-100"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {suffix && <span className="text-sm text-zinc-600">{suffix}</span>}
    </div>
  );

  if (compact) return controls;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label className="ioc-label">{label}</label>
      {controls}
    </div>
  );
}

export function ItemGroupField({
  field,
  value,
  error,
  onChange,
  sectionTitle,
  sectionHint,
}: {
  field: FieldDef;
  value: string;
  error?: string;
  onChange: (json: string) => void;
  sectionTitle?: string;
  sectionHint?: string;
}) {
  const unitFields = field.unitDetailFields ?? [];
  const hasUnitDetails = unitFields.length > 0;
  const perUnit = Boolean(field.itemNamePerUnit);
  const unitWord = field.unitSuffix ?? "รายการ";
  const data = syncItemGroupUnits(parseItemGroupJson(value, field), field);
  const qty = Math.max(1, Number(data.quantity.replace(/\D/g, "")) || 1);

  function commit(next: RequestItemGroup) {
    onChange(serializeItemGroup(syncItemGroupUnits(next, field)));
  }

  function patch(partial: Partial<RequestItemGroup>) {
    commit({ ...data, ...partial });
  }

  function patchUnit(index: number, key: string, val: string) {
    const units = data.units.map((row, i) => (i === index ? { ...row, [key]: val } : row));
    commit({ ...data, units });
  }

  function addOneUnit() {
    const empty = Object.fromEntries(unitFields.map((u) => [u.key, ""]));
    commit({
      ...data,
      quantity: String(qty + 1),
      units: [...data.units, empty],
    });
  }

  return (
    <div className="space-y-4">
      {perUnit && sectionTitle ? (
        <div className="border-b border-zinc-100 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-zinc-800">{sectionTitle}</h2>
              {sectionHint && (
                <p className="mt-1 text-sm text-zinc-500">{sectionHint}</p>
              )}
            </div>
            <QuantityStepper
              compact
              label={field.quantityLabel ?? "จำนวน"}
              value={data.quantity}
              onChange={(v) => patch({ quantity: v })}
              suffix={unitWord}
            />
          </div>
        </div>
      ) : (
        <>
          <p className="ioc-label">
            {field.label}
            {field.required && <span className="text-red-500"> *</span>}
            {hasUnitDetails && !perUnit && (
              <span className="font-normal text-zinc-400"> · กรอกแยกต่อ{unitWord}</span>
            )}
          </p>
          <div
            className={`grid gap-3 ${field.showUnit ? "sm:grid-cols-[1fr_9rem_5rem]" : "sm:grid-cols-[1fr_9rem]"}`}
          >
            <Input
              label={field.itemNameLabel ?? "ชนิด / รายการ"}
              value={data.itemName}
              onChange={(e) => patch({ itemName: e.target.value })}
              placeholder={field.placeholder ?? "เช่น คอมพิวเตอร์"}
            />
            <QuantityStepper
              label={field.quantityLabel ?? "จำนวน"}
              value={data.quantity}
              onChange={(v) => patch({ quantity: v })}
              suffix={hasUnitDetails ? unitWord : undefined}
            />
            {field.showUnit && (
              <Input
                label="หน่วย"
                value={data.unit ?? ""}
                onChange={(e) => patch({ unit: e.target.value })}
                placeholder="รีม, กล่อง"
              />
            )}
          </div>
        </>
      )}

      {hasUnitDetails &&
        data.units.slice(0, qty).map((unit, index) => (
          <div
            key={index}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              รายละเอียด{unitWord}ที่ {index + 1}
            </p>
            <div className="space-y-3">
              {unitFields.map((uf) => {
                const common = {
                  label: uf.label,
                  required: uf.required,
                  value: unit[uf.key] ?? "",
                  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                    patchUnit(index, uf.key, e.target.value),
                  placeholder: uf.placeholder,
                };
                if (uf.kind === "textarea") {
                  return <Textarea key={uf.key} rows={2} {...common} />;
                }
                return <Input key={uf.key} type="text" {...common} />;
              })}
            </div>
          </div>
        ))}

      {hasUnitDetails && !perUnit && (
        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-700 transition-colors hover:border-blue-300 hover:bg-blue-50/30">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            checked={false}
            onChange={(e) => {
              if (e.target.checked) addOneUnit();
              e.target.checked = false;
            }}
          />
          เพิ่ม{unitWord}อีก 1
        </label>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function itemGroupFormDefault(field: FieldDef): string {
  return defaultItemGroupJson(field);
}
