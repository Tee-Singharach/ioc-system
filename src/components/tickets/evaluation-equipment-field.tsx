"use client";

import type { RecommendedAction, RequestItemGroup } from "@/lib/types/ticket";
import type { FieldDef } from "@/lib/ticket-categories";
import {
  itemGroupFromStored,
  parseItemGroupJson,
  serializeItemGroup,
  syncItemGroupUnits,
} from "@/lib/ticket-categories";
import { actionsForCategory } from "@/lib/ticket-evaluation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function RequestUnitContext({ unit }: { unit: Record<string, string> }) {
  const parts = [
    unit.itemName?.trim() && `ชนิด: ${unit.itemName.trim()}`,
    unit.assetTag?.trim() && `รหัส: ${unit.assetTag.trim()}`,
    unit.symptom?.trim() && `อาการที่แจ้ง: ${unit.symptom.trim()}`,
  ].filter(Boolean);
  if (!parts.length) return null;
  return <p className="text-sm leading-relaxed text-zinc-600">{parts.join(" · ")}</p>;
}

export function EvaluationEquipmentField({
  field,
  requestEquipment,
  requestField,
  value,
  error,
  categoryId,
  onChange,
}: {
  field: FieldDef;
  requestEquipment: RequestItemGroup;
  requestField: FieldDef;
  value: string;
  error?: string;
  categoryId: string;
  onChange: (json: string) => void;
}) {
  const unitWord = field.unitSuffix ?? "เครื่อง";
  const unitFields = field.unitDetailFields ?? [];
  const data = syncItemGroupUnits(parseItemGroupJson(value, field), field);
  const qty = Math.max(1, Number(data.quantity.replace(/\D/g, "")) || 1);
  const req = itemGroupFromStored(requestEquipment, requestField);
  const actionOptions = actionsForCategory(categoryId);

  function commit(next: RequestItemGroup) {
    onChange(serializeItemGroup(syncItemGroupUnits(next, field)));
  }

  function patchUnit(index: number, key: string, val: string) {
    const units = data.units.map((row, i) => (i === index ? { ...row, [key]: val } : row));
    commit({ ...data, units });
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">ผลประเมินต่อ{unitWord}</h3>
        <p className="mt-1 text-sm text-zinc-500">
          กรอกแยกต่อ{unitWord} — ระบบสรุปรวมให้อัตโนมัติเมื่อบันทึก
        </p>
      </div>

      {Array.from({ length: qty }, (_, index) => {
        const evalUnit = data.units[index] ?? {};
        const reqUnit = req.units[index] ?? {};
        return (
          <div key={index} className={index > 0 ? "pt-1" : undefined}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {unitWord}ที่ {index + 1}
            </p>
            <RequestUnitContext unit={reqUnit} />
            <div className="mt-3 space-y-3">
              {unitFields.map((uf) => {
                const common = {
                  label: uf.label,
                  required: uf.required,
                  value: evalUnit[uf.key] ?? "",
                  placeholder: uf.placeholder,
                };
                if (uf.kind === "select") {
                  return (
                    <Select
                      key={uf.key}
                      {...common}
                      value={evalUnit[uf.key] ?? ""}
                      onChange={(ev) =>
                        patchUnit(index, uf.key, ev.target.value as RecommendedAction)
                      }
                      options={[
                        { value: "", label: "— เลือกแนวทาง —" },
                        ...actionOptions.map((a) => ({ value: a.value, label: a.label })),
                      ]}
                    />
                  );
                }
                if (uf.kind === "textarea") {
                  return (
                    <Textarea
                      key={uf.key}
                      rows={2}
                      className="min-h-20 py-2.5 text-base"
                      {...common}
                      onChange={(ev) => patchUnit(index, uf.key, ev.target.value)}
                    />
                  );
                }
                return (
                  <Input
                    key={uf.key}
                    type="text"
                    className="py-2.5 text-base"
                    inputMode={uf.kind === "currency" ? "decimal" : undefined}
                    {...common}
                    onChange={(ev) => patchUnit(index, uf.key, ev.target.value)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
