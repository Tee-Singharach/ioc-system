"use client";

import type { ChangeEvent } from "react";
import type { FieldDef, FieldValues } from "@/lib/ticket-categories";
import { ItemGroupField } from "@/components/tickets/item-group-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function DynamicFields({
  fields,
  values,
  errors,
  onChange,
  sectionTitle,
  sectionHint,
}: {
  fields: FieldDef[];
  values: FieldValues;
  errors: Record<string, string>;
  onChange: (key: string, value: string) => void;
  sectionTitle?: string;
  sectionHint?: string;
}) {
  if (fields.length === 0) return null;

  return (
    <div className="space-y-5">
      {fields.map((field) => {
        if (field.kind === "itemGroup") {
          return (
            <ItemGroupField
              key={field.key}
              field={field}
              value={values[field.key] ?? ""}
              error={errors[field.key]}
              onChange={(json) => onChange(field.key, json)}
              sectionTitle={field.itemNamePerUnit ? sectionTitle : undefined}
              sectionHint={field.itemNamePerUnit ? sectionHint : undefined}
            />
          );
        }

        const common = {
          label: field.label,
          required: field.required,
          value: values[field.key] ?? "",
          onChange: (ev: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            onChange(field.key, ev.target.value),
          error: errors[field.key],
          placeholder: field.placeholder,
        };

        if (field.kind === "textarea") {
          return <Textarea key={field.key} rows={3} className="min-h-28 py-2.5 text-base" {...common} />;
        }

        return (
          <Input
            key={field.key}
            type="text"
            className="py-2.5 text-base"
            inputMode={field.kind === "number" || field.kind === "currency" ? "decimal" : undefined}
            {...common}
          />
        );
      })}
    </div>
  );
}
