"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ClipboardCheck, X } from "lucide-react";
import type { RecommendedAction, Ticket, TicketEvaluation } from "@/lib/types/ticket";
import {
  formatEstimatedCost,
  parseEstimatedCost,
  RECOMMENDED_ACTIONS,
  recommendedActionLabel,
  validateEvaluationPayload,
} from "@/lib/ticket-evaluation";
import { formatShortDate } from "@/lib/ticket-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalPortal } from "@/components/ui/modal-portal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function EvaluationCard({ evaluation }: { evaluation: TicketEvaluation }) {
  const cost = formatEstimatedCost(evaluation.estimatedCost);

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900">ผลการประเมิน</h2>
        <p className="text-xs text-zinc-500">
          {evaluation.evaluatedByName} · {formatShortDate(evaluation.evaluatedAt)}
        </p>
      </div>
      <dl className="mt-3 space-y-2.5 text-sm">
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
        {cost && (
          <div>
            <dt className="text-xs font-medium text-zinc-500">ประมาณค่าใช้จ่าย</dt>
            <dd className="mt-0.5 font-medium text-zinc-900">{cost}</dd>
          </div>
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
  ticket: Pick<Ticket, "departmentId" | "departmentName" | "title" | "description">;
  initial?: TicketEvaluation;
  readOnly?: boolean;
  onSave: (data: Omit<TicketEvaluation, "evaluatedAt" | "evaluatedById" | "evaluatedByName">) => void;
  showHeader?: boolean;
  onSaved?: () => void;
  className?: string;
}) {
  const [diagnosis, setDiagnosis] = useState(initial?.diagnosis ?? "");
  const [recommendedAction, setRecommendedAction] = useState<RecommendedAction | "">(
    initial?.recommendedAction ?? "",
  );
  const [estimatedCost, setEstimatedCost] = useState(
    initial?.estimatedCost != null ? String(initial.estimatedCost) : "",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (readOnly && initial) {
    return <EvaluationCard evaluation={initial} />;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      diagnosis: diagnosis.trim(),
      recommendedAction,
      estimatedCost: parseEstimatedCost(estimatedCost),
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
    });
    onSaved?.();
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {showHeader && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">ผลประเมิน</h3>
          <p className="mt-1 text-sm text-zinc-500">กรอกหลังตรวจสอบจริง</p>
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 text-sm">
        <p className="text-xs font-medium text-zinc-500">คำร้อง</p>
        <p className="mt-0.5 font-medium text-zinc-900">{ticket.title}</p>
        <p className="mt-1 text-xs text-zinc-500">{ticket.departmentName}</p>
      </div>

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
          ...RECOMMENDED_ACTIONS.map((a) => ({ value: a.value, label: a.label })),
        ]}
        error={errors.recommendedAction}
      />

      <Input
        label="ประมาณค่าใช้จ่าย (บาท)"
        value={estimatedCost}
        onChange={(ev) => setEstimatedCost(ev.target.value)}
        placeholder="ไม่บังคับ"
        inputMode="decimal"
      />

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
          className="relative z-10 flex max-h-[min(90vh,48rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl"
        >
          <div className="flex shrink-0 items-start gap-3 border-b border-zinc-100 px-5 py-4 pr-12">
            <div className="ioc-icon-box-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
              <ClipboardCheck className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 id="evaluation-modal-title" className="text-base font-semibold text-zinc-900">
                ผลประเมิน
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500">กรอกหลังตรวจสอบจริง</p>
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
