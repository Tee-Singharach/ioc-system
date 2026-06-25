"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Banknote, Building2, Check, ClipboardCheck, FileText, X } from "lucide-react";
import type { Ticket, TicketEvaluation } from "@/lib/types/ticket";
import {
  formatEstimatedCost,
  parseEstimatedCost,
  validateEvaluationPayload,
} from "@/lib/ticket-evaluation";
import { formatDateTime } from "@/lib/ticket-progress";
import { Button } from "@/components/ui/button";
import { FORM_FIELD_CLASS, FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { ModalPortal } from "@/components/ui/modal-portal";
import { Textarea } from "@/components/ui/textarea";

function TicketRefBanner({
  title,
  departmentName,
  description,
}: {
  title: string;
  departmentName: string;
  description?: string;
}) {
  const detail = description?.trim();
  return (
    <div className="flex gap-3 rounded-xl border border-zinc-200/80 bg-gradient-to-br from-zinc-50 to-white px-3.5 py-3">
      <div className="ioc-icon-box-brand h-9 w-9 shrink-0">
        <FileText className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">คำร้องอ้างอิง</p>
        <p className="mt-0.5 text-sm font-semibold text-zinc-900">{title}</p>
        {detail && (
          <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-zinc-600">
            {detail}
          </p>
        )}
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs text-zinc-600 ring-1 ring-zinc-200/80">
          <Building2 className="h-3 w-3 shrink-0 text-zinc-400" aria-hidden />
          {departmentName}
        </span>
      </div>
    </div>
  );
}

function EvaluationField({
  label,
  children,
  highlight,
}: {
  label: string;
  children: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${
        highlight
          ? "border-emerald-200/80 bg-emerald-50/40"
          : "border-zinc-100 bg-white"
      }`}
    >
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm leading-relaxed text-zinc-800">{children}</dd>
    </div>
  );
}

export function EvaluationCard({ evaluation }: { evaluation: TicketEvaluation }) {
  const hasCost = evaluation.estimatedCost != null && !Number.isNaN(evaluation.estimatedCost);
  const costLabel = hasCost ? formatEstimatedCost(evaluation.estimatedCost) : null;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-50/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="ioc-icon-box-brand h-8 w-8">
            <ClipboardCheck className="h-4 w-4" aria-hidden />
          </div>
          <h2 className="text-sm font-semibold text-zinc-900">ผลการประเมิน</h2>
        </div>
        <p className="text-xs text-zinc-500">
          {evaluation.evaluatedByName} · {formatDateTime(evaluation.evaluatedAt)}
        </p>
      </div>
      <dl className="space-y-2 p-4">
        <EvaluationField label="ผลการตรวจสอบ">
          <span className="whitespace-pre-wrap">{evaluation.diagnosis}</span>
        </EvaluationField>
        {hasCost && costLabel && (
          <EvaluationField label="ประมาณค่าใช้จ่าย" highlight>
            <span className="font-semibold text-emerald-800">{costLabel}</span>
          </EvaluationField>
        )}
        {evaluation.notes?.trim() && (
          <EvaluationField label="หมายเหตุ">{evaluation.notes}</EvaluationField>
        )}
      </dl>
    </div>
  );
}

function CostToggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
          checked
            ? "border-blue-200 bg-blue-50/50"
            : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/80"
        }`}
      >
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
            checked ? "border-blue-600 bg-blue-600 text-white" : "border-zinc-300 bg-white"
          }`}
        >
          {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-800">
            <Banknote className="h-4 w-4 text-zinc-500" aria-hidden />
            มีค่าใช้จ่าย
          </span>
          <span className="mt-0.5 block text-xs leading-snug text-zinc-500">
            ติ๊กเมื่องานนี้มีงบ — กรอกจำนวนได้ถ้าทราบ ไม่บังคับ
          </span>
        </span>
      </button>
      {checked && children && (
        <div className="pl-1 transition-opacity duration-200">{children}</div>
      )}
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
  ticket: Pick<Ticket, "departmentId" | "departmentName" | "title" | "description">;
  initial?: TicketEvaluation;
  readOnly?: boolean;
  onSave: (data: Omit<TicketEvaluation, "evaluatedAt" | "evaluatedById" | "evaluatedByName">) => void;
  showHeader?: boolean;
  onSaved?: () => void;
  className?: string;
}) {
  const [diagnosis, setDiagnosis] = useState(initial?.diagnosis ?? "");
  const [hasCost, setHasCost] = useState(initial?.estimatedCost != null);
  const [estimatedCost, setEstimatedCost] = useState(
    initial?.estimatedCost != null ? String(initial.estimatedCost) : "",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (readOnly && initial) {
    return <EvaluationCard evaluation={initial} />;
  }

  function handleCostToggle(checked: boolean) {
    setHasCost(checked);
    if (!checked) {
      setEstimatedCost("");
      setErrors((prev) => {
        const next = { ...prev };
        delete next.estimatedCost;
        return next;
      });
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsedCost = hasCost ? parseEstimatedCost(estimatedCost) : null;
    const payload = { diagnosis: diagnosis.trim() };
    const next = validateEvaluationPayload(ticket, payload);
    if (hasCost && estimatedCost.trim() && parsedCost == null) {
      setErrors({ estimatedCost: "รูปแบบจำนวนเงินไม่ถูกต้อง" });
      return;
    }
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    setErrors({});
    onSave({
      diagnosis: payload.diagnosis,
      estimatedCost: parsedCost,
      notes: notes.trim() || undefined,
    });
    onSaved?.();
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <FormSection
        isFirst
        title={showHeader ? "ผลประเมิน" : undefined}
        hint={showHeader ? "กรอกหลังตรวจสอบจริง" : undefined}
      >
        <TicketRefBanner
          title={ticket.title}
          departmentName={ticket.departmentName}
          description={ticket.description}
        />
      </FormSection>

      <FormSection title="ผลการตรวจสอบ" hint="สรุปผลหลังตรวจสอบจริง">
        <Textarea
          required
          value={diagnosis}
          onChange={(ev) => setDiagnosis(ev.target.value)}
          placeholder="เช่น เปิดเครื่องตรวจพบแรมชำรุด ไม่ผ่าน POST"
          rows={3}
          error={errors.diagnosis}
          className={`min-h-20 ${FORM_FIELD_CLASS}`}
          aria-label="ผลการตรวจสอบ"
        />
        <CostToggle checked={hasCost} onChange={handleCostToggle}>
          <Input
            label="ประมาณค่าใช้จ่าย (บาท)"
            value={estimatedCost}
            onChange={(ev) => setEstimatedCost(ev.target.value)}
            placeholder="ไม่บังคับ — เช่น 1,500"
            inputMode="decimal"
            error={errors.estimatedCost}
            className={FORM_FIELD_CLASS}
          />
        </CostToggle>
      </FormSection>

      <FormSection title="หมายเหตุ" hint="ไม่บังคับ — ข้อมูลเพิ่มเติมที่เกี่ยวข้อง">
        <Textarea
          value={notes}
          onChange={(ev) => setNotes(ev.target.value)}
          placeholder="เช่น มีอะไหล่ในสต็อก"
          rows={2}
          className={`min-h-16 ${FORM_FIELD_CLASS}`}
          aria-label="หมายเหตุเพิ่มเติม"
        />
      </FormSection>

      <div className="flex flex-col gap-2 border-t border-zinc-100 bg-zinc-50/50 px-5 py-3 sm:flex-row sm:justify-end sm:px-6">
        <Button type="submit" className="px-5 py-2 sm:min-w-36">
          บันทึกผลประเมิน
        </Button>
      </div>
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
  ticket: Pick<Ticket, "departmentId" | "departmentName" | "title" | "description">;
  initial?: TicketEvaluation;
  onSave: (data: Omit<TicketEvaluation, "evaluatedAt" | "evaluatedById" | "evaluatedByName">) => void;
}) {
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
          className="ioc-card relative z-10 flex max-h-[min(90vh,44rem)] w-full max-w-2xl flex-col overflow-hidden"
        >
          <div className="flex shrink-0 items-start gap-3 border-b border-zinc-100 bg-white px-5 py-3.5 pr-12">
            <div className="ioc-icon-box-brand h-10 w-10 shrink-0 rounded-xl">
              <ClipboardCheck className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="evaluation-modal-title" className="text-sm font-semibold text-zinc-900">
                บันทึกผลประเมิน
              </h2>
              <p className="mt-0.5 truncate text-xs text-zinc-500">{ticket.title}</p>
              <p className="mt-0.5 text-xs text-zinc-400">{ticket.departmentName}</p>
            </div>
            <button
              type="button"
              aria-label="ปิด"
              onClick={onClose}
              className="absolute top-3 right-3 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto bg-white">
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
