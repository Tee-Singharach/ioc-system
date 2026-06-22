"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ClipboardCheck, X } from "lucide-react";
import type { RecommendedAction, RequestItemGroup, Ticket, TicketEvaluation } from "@/lib/types/ticket";
import {
  actionsForCategory,
  formatEstimatedCost,
  parseEvaluationDetails,
  recommendedActionLabel,
  validateEvaluationPayload,
} from "@/lib/ticket-evaluation";
import {
  formatFieldDisplay,
  getEvaluationFields,
  getRequestFields,
  itemGroupFromStored,
  resolveCategoryId,
  type FieldValues,
} from "@/lib/ticket-categories";
import {
  buildPerUnitEvaluationPayload,
  equipmentEvalToFormValue,
  evaluationHasPerUnitDetails,
  formatUnitEvalDisplay,
  getPerUnitEvaluationField,
  usesPerUnitEvaluation,
} from "@/lib/ticket-evaluation-units";
import { formatShortDate } from "@/lib/ticket-progress";
import { EvaluationEquipmentField } from "@/components/tickets/evaluation-equipment-field";
import { DynamicFields } from "@/components/tickets/dynamic-fields";
import { RequestContextBanner } from "@/components/tickets/request-details-card";
import { Button } from "@/components/ui/button";
import { ModalPortal } from "@/components/ui/modal-portal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function evalToDetails(
  categoryId: string,
  ticket: Pick<Ticket, "categoryId" | "departmentId" | "requestDetails">,
  e?: TicketEvaluation,
): FieldValues {
  if (usesPerUnitEvaluation({ ...ticket, categoryId })) {
    const evalField = getPerUnitEvaluationField(categoryId)!;
    const existing = e?.details?.[evalField.key] as RequestItemGroup | undefined;
    return { [evalField.key]: equipmentEvalToFormValue(categoryId, ticket, existing) };
  }
  if (!e) return {};
  const out: FieldValues = {};
  if (e.details) {
    for (const [k, v] of Object.entries(e.details)) out[k] = String(v);
  }
  if (e.estimatedCost != null && !out.estimatedCost && !out.quotedCost) {
    out.estimatedCost = String(e.estimatedCost);
  }
  return out;
}

function PerUnitEvaluationDisplay({
  evaluation,
  categoryId,
  ticket,
}: {
  evaluation: TicketEvaluation;
  categoryId: string;
  ticket: Pick<Ticket, "requestDetails">;
}) {
  const evalField = getPerUnitEvaluationField(categoryId)!;
  const requestField = getRequestFields(categoryId).find(
    (f) => f.key === evalField.syncFromRequestField,
  )!;
  const evalGroup = itemGroupFromStored(evaluation.details?.[evalField.key], evalField);
  const reqGroup = itemGroupFromStored(ticket.requestDetails?.[evalField.key], requestField);
  const qty = Math.max(1, Number(evalGroup.quantity.replace(/\D/g, "")) || 1);
  const unitWord = evalField.unitSuffix ?? "เครื่อง";
  const cost = formatEstimatedCost(evaluation.estimatedCost);

  return (
    <>
      <div>
        <dt className="text-xs font-medium text-zinc-500">แนวทางรวม</dt>
        <dd className="mt-0.5 font-medium text-zinc-900">
          {recommendedActionLabel(evaluation.recommendedAction)}
          {evaluation.recommendedAction === "other" && (
            <span className="font-normal text-zinc-500"> (แยกต่อ{unitWord})</span>
          )}
        </dd>
      </div>
      {cost && (
        <div>
          <dt className="text-xs font-medium text-zinc-500">รวมประมาณค่าใช้จ่าย</dt>
          <dd className="mt-0.5 font-medium text-zinc-900">{cost}</dd>
        </div>
      )}
      <div>
        <dt className="mb-2 text-xs font-medium text-zinc-500">รายละเอียดต่อ{unitWord}</dt>
        <dd className="space-y-4">
          {Array.from({ length: qty }, (_, i) => {
            const evalUnit = evalGroup.units[i] ?? {};
            const reqUnit = reqGroup.units[i] ?? {};
            const rows = formatUnitEvalDisplay(evalUnit, evalField);
            if (!rows.length) return null;
            const label = [reqUnit.itemName, reqUnit.assetTag && `(${reqUnit.assetTag})`]
              .filter(Boolean)
              .join(" ");
            return (
              <div key={i}>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {unitWord}ที่ {i + 1}
                  {label ? ` · ${label}` : ""}
                </p>
                <dl className="mt-2 space-y-2">
                  {rows.map((row) => (
                    <div key={row.label}>
                      <dt className="text-xs text-zinc-500">{row.label}</dt>
                      <dd className="mt-0.5 text-sm leading-relaxed text-zinc-800">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            );
          })}
        </dd>
      </div>
    </>
  );
}

export function EvaluationCard({
  evaluation,
  categoryId,
  ticket,
}: {
  evaluation: TicketEvaluation;
  categoryId: string;
  ticket?: Pick<Ticket, "requestDetails">;
}) {
  const cost = formatEstimatedCost(evaluation.estimatedCost);
  const evalFields = getEvaluationFields(categoryId);
  const perUnit =
    ticket && evaluationHasPerUnitDetails(categoryId, evaluation);

  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900">ผลการประเมิน</h2>
        <p className="text-xs text-zinc-500">
          {evaluation.evaluatedByName} · {formatShortDate(evaluation.evaluatedAt)}
        </p>
      </div>
      <dl className="mt-3 space-y-2.5 text-sm">
        {perUnit && ticket ? (
          <PerUnitEvaluationDisplay
            evaluation={evaluation}
            categoryId={categoryId}
            ticket={ticket}
          />
        ) : (
          <>
            <div>
              <dt className="text-xs font-medium text-zinc-500">ผลการตรวจสอบ</dt>
              <dd className="mt-0.5 whitespace-pre-wrap leading-relaxed text-zinc-800">
                {evaluation.diagnosis}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">แนวทางที่แนะนำ</dt>
              <dd className="mt-0.5 font-medium text-zinc-900">
                {recommendedActionLabel(evaluation.recommendedAction)}
              </dd>
            </div>
            {evalFields.map((f) => {
              const val =
                evaluation.details?.[f.key] ??
                (f.key === "estimatedCost" ? evaluation.estimatedCost : undefined);
              const display = formatFieldDisplay(f, val);
              if (!display) return null;
              return (
                <div key={f.key}>
                  <dt className="text-xs font-medium text-zinc-500">{f.label}</dt>
                  <dd className="mt-0.5 font-medium text-zinc-900">{display}</dd>
                </div>
              );
            })}
            {cost && !evaluation.details?.estimatedCost && !evaluation.details?.quotedCost && (
              <div>
                <dt className="text-xs font-medium text-zinc-500">ประมาณค่าใช้จ่าย</dt>
                <dd className="mt-0.5 font-medium text-zinc-900">{cost}</dd>
              </div>
            )}
          </>
        )}
        {evaluation.notes?.trim() && (
          <div>
            <dt className="text-xs font-medium text-zinc-500">หมายเหตุ</dt>
            <dd className="mt-0.5 leading-relaxed text-zinc-700">{evaluation.notes}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export function EvaluationForm({
  ticket,
  initial,
  readOnly,
  onSave,
  showHeader = true,
  onSaved,
  className = "",
}: {
  ticket: Pick<
    Ticket,
    "departmentId" | "departmentName" | "categoryId" | "categoryLabel" | "requestDetails"
  >;
  initial?: TicketEvaluation;
  readOnly?: boolean;
  onSave: (data: Omit<TicketEvaluation, "evaluatedAt" | "evaluatedById" | "evaluatedByName">) => void;
  showHeader?: boolean;
  onSaved?: () => void;
  className?: string;
}) {
  const categoryId = resolveCategoryId(ticket);
  const evalFields = getEvaluationFields(categoryId);
  const actionOptions = actionsForCategory(categoryId);
  const perUnit = usesPerUnitEvaluation(ticket);
  const perUnitField = perUnit ? getPerUnitEvaluationField(categoryId)! : undefined;
  const requestField = perUnitField
    ? getRequestFields(categoryId).find((f) => f.key === perUnitField.syncFromRequestField)!
    : undefined;

  const [diagnosis, setDiagnosis] = useState(initial?.diagnosis ?? "");
  const [recommendedAction, setRecommendedAction] = useState<RecommendedAction | "">(
    initial?.recommendedAction ?? "",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [details, setDetails] = useState<FieldValues>(() => evalToDetails(categoryId, ticket, initial));
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (readOnly && initial) {
    return <EvaluationCard evaluation={initial} categoryId={categoryId} ticket={ticket} />;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (perUnit && perUnitField && requestField) {
      const next = validateEvaluationPayload(ticket, {}, details);
      if (Object.keys(next).length) {
        setErrors(next);
        return;
      }
      const built = buildPerUnitEvaluationPayload(categoryId, ticket, details)!;
      setErrors({});
      onSave({
        diagnosis: built.diagnosis,
        recommendedAction: built.recommendedAction,
        estimatedCost: built.estimatedCost,
        notes: notes.trim() || undefined,
        details: built.details,
      });
      onSaved?.();
      return;
    }

    const parsed = parseEvaluationDetails(categoryId, details);
    const payload = {
      diagnosis: diagnosis.trim(),
      recommendedAction,
      estimatedCost: parsed.estimatedCost,
      details: Object.keys(parsed.details).length ? parsed.details : undefined,
    };
    const next = validateEvaluationPayload(ticket, payload);
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    setErrors({});
    onSave({
      diagnosis: payload.diagnosis,
      recommendedAction: recommendedAction as RecommendedAction,
      estimatedCost: payload.estimatedCost,
      notes: notes.trim() || undefined,
      details: payload.details,
    });
    onSaved?.();
  }

  const requestEquipment =
    perUnitField && requestField
      ? itemGroupFromStored(ticket.requestDetails?.[perUnitField.syncFromRequestField!], requestField)
      : null;

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {showHeader && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">ผลประเมิน</h3>
          <p className="mt-1 text-sm text-zinc-500">กรอกหลังตรวจสอบจริง</p>
        </div>
      )}

      <RequestContextBanner
        departmentName={ticket.departmentName}
        categoryLabel={ticket.categoryLabel ?? categoryId}
        requestDetails={ticket.requestDetails}
        categoryId={categoryId}
      />

      {perUnit && perUnitField && requestField && requestEquipment ? (
        <EvaluationEquipmentField
          field={perUnitField}
          requestEquipment={requestEquipment}
          requestField={requestField}
          value={details[perUnitField.key] ?? equipmentEvalToFormValue(categoryId, ticket)}
          error={errors[perUnitField.key] ?? errors.equipment}
          categoryId={categoryId}
          onChange={(json) => setDetails((prev) => ({ ...prev, [perUnitField.key]: json }))}
        />
      ) : (
        <>
          <Textarea
            label="ผลการตรวจสอบ"
            required
            value={diagnosis}
            onChange={(ev) => setDiagnosis(ev.target.value)}
            placeholder="เช่น เปิดเครื่องตรวจพบแรมชำรุด ไม่ผ่าน POST"
            rows={3}
            error={errors.diagnosis}
          />

          <Select
            label="แนวทางที่แนะนำ"
            required
            value={recommendedAction}
            onChange={(ev) => setRecommendedAction(ev.target.value as RecommendedAction | "")}
            options={[
              { value: "", label: "— เลือกแนวทางที่แนะนำ —" },
              ...actionOptions.map((a) => ({ value: a.value, label: a.label })),
            ]}
            error={errors.recommendedAction}
          />

          {evalFields.length > 0 && (
            <DynamicFields
              fields={evalFields}
              values={details}
              errors={errors}
              onChange={(key, value) => setDetails((prev) => ({ ...prev, [key]: value }))}
            />
          )}
        </>
      )}

      <Textarea
        label="หมายเหตุเพิ่มเติม"
        value={notes}
        onChange={(ev) => setNotes(ev.target.value)}
        placeholder="ไม่บังคับ — เช่น มีอะไหล่ในสต็อก"
        rows={2}
      />

      <Button type="submit" className="w-full">
        บันทึกผลประเมิน
      </Button>
    </form>
  );
}

export function EvaluationModal({
  open,
  onClose,
  ticket,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  ticket: Pick<
    Ticket,
    "departmentId" | "departmentName" | "categoryId" | "categoryLabel" | "requestDetails"
  >;
  initial?: TicketEvaluation;
  onSave: (data: Omit<TicketEvaluation, "evaluatedAt" | "evaluatedById" | "evaluatedByName">) => void;
}) {
  const perUnit = usesPerUnitEvaluation(ticket);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <button
          type="button"
          className="absolute inset-0 bg-zinc-900/45 backdrop-blur-[2px]"
          aria-label="ปิด"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="evaluation-modal-title"
          className={`relative z-10 flex max-h-[min(90vh,48rem)] w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl ${
            perUnit ? "max-w-2xl" : "max-w-lg"
          }`}
        >
          <div className="flex shrink-0 items-start gap-3 border-b border-zinc-100 px-5 py-4 pr-12">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <ClipboardCheck className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 id="evaluation-modal-title" className="text-base font-semibold text-zinc-900">
                ผลประเมิน
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                {perUnit ? "กรอกแยกต่อเครื่อง — สรุปรวมอัตโนมัติ" : "กรอกหลังตรวจสอบจริง"}
              </p>
            </div>
            <button
              type="button"
              aria-label="ปิด"
              onClick={onClose}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-4">
            <EvaluationForm
              key={initial?.evaluatedAt ?? "draft"}
              ticket={ticket}
              initial={initial}
              showHeader={false}
              onSave={onSave}
              onSaved={onClose}
            />
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
