"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, ClipboardCheck, Play, Send } from "lucide-react";
import type { Ticket, TicketEvaluation } from "@/lib/types/ticket";
import { useCatalog } from "@/providers/catalog-provider";
import { hasCompleteEvaluation } from "@/lib/ticket-evaluation";
import {
  canAssign,
  canComplete,
  canReceive,
  canSaveEvaluation,
} from "@/lib/officer-rules";
import { TICKET_WORKFLOW_STEPS, workflowStepIndex } from "@/lib/ticket-workflow";
import { EvaluationModal } from "@/components/tickets/ticket-evaluation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface OfficerActionsProps {
  ticket: Ticket;
  currentOfficerId: string;
  onReceive: () => void;
  onSaveEvaluation: (
    data: Omit<TicketEvaluation, "evaluatedAt" | "evaluatedById" | "evaluatedByName">,
  ) => void;
  onSubmitForApproval: () => void;
  onComplete: (summary: string) => void;
  onAssign: (officerId: string) => void;
}

function AssignPanel({
  assignOfficerId,
  setAssignOfficerId,
  officersWithDept,
  onConfirm,
}: {
  assignOfficerId: string;
  setAssignOfficerId: (id: string) => void;
  officersWithDept: { id: string; name: string; departmentName: string }[];
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-zinc-200/80 bg-white p-3">
      <Select
        label="เลือกเจ้าหน้าที่"
        value={assignOfficerId}
        onChange={(e) => setAssignOfficerId(e.target.value)}
        options={[
          { value: "", label: "— เลือกเจ้าหน้าที่ —" },
          ...officersWithDept.map((o) => ({
            value: o.id,
            label: `${o.name} (${o.departmentName})`,
          })),
        ]}
      />
      <Button type="button" className="w-full" disabled={!assignOfficerId} onClick={onConfirm}>
        มอบหมายงาน
      </Button>
    </div>
  );
}

export function OfficerActions({
  ticket,
  currentOfficerId,
  onReceive,
  onSaveEvaluation,
  onSubmitForApproval,
  onComplete,
  onAssign,
}: OfficerActionsProps) {
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignOfficerId, setAssignOfficerId] = useState("");
  const [completeOpen, setCompleteOpen] = useState(false);
  const [evalOpen, setEvalOpen] = useState(false);
  const [completeSummary, setCompleteSummary] = useState("");
  const [completeError, setCompleteError] = useState("");

  const { officers: officersWithDept } = useCatalog();

  const step = workflowStepIndex(ticket);
  const stepMeta = TICKET_WORKFLOW_STEPS[step];
  const evaluating = canSaveEvaluation(ticket);
  const evaluationReady = hasCompleteEvaluation(ticket);
  const hasEvalRecord = Boolean(ticket.evaluation);
  const showAssign = canAssign(ticket);

  function confirmAssign() {
    onAssign(assignOfficerId);
    setAssignOfficerId("");
    setAssignOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-900">การดำเนินการ</h2>
          <Badge color="blue">เจ้าหน้าที่</Badge>
        </div>

        <p className="mt-3 text-xs font-medium text-zinc-500">
          ขั้นที่ {step + 1} · {stepMeta?.label ?? "—"}
        </p>

        <div className="mt-3 space-y-3">
          {step === 0 && canReceive(ticket) && (
            <Button type="button" className="w-full gap-2" onClick={onReceive}>
              <Play className="h-4 w-4" aria-hidden />
              รับเรื่อง
            </Button>
          )}

          {step === 1 && evaluating && (
            <div className="space-y-2">
              {evaluationReady && (
                <Button type="button" className="w-full gap-2" onClick={onSubmitForApproval}>
                  <Send className="h-4 w-4" aria-hidden />
                  ส่งอนุมัติ
                </Button>
              )}
              <Button
                type="button"
                variant={evaluationReady ? "secondary" : "primary"}
                className="w-full gap-2"
                onClick={() => setEvalOpen(true)}
              >
                <ClipboardCheck className="h-4 w-4" aria-hidden />
                {hasEvalRecord ? "แก้ไขผลประเมิน" : "กรอกผลประเมิน"}
              </Button>
              {!evaluationReady && (
                <p className="text-center text-[11px] leading-relaxed text-zinc-500">
                  {hasEvalRecord
                    ? "กรอกฟิลด์ที่จำเป็นให้ครบ แล้วบันทึกอีกครั้ง"
                    : "เปิดฟอร์ม → กรอก → บันทึก แล้วจึงส่งอนุมัติ"}
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <p className="rounded-lg bg-zinc-100 px-3 py-2.5 text-center text-xs leading-relaxed text-zinc-600">
              รอผู้จัดการอนุมัติ — ยังไม่เริ่มดำเนินการจริง
            </p>
          )}

          {step === 3 && canComplete(ticket) && (
            <Button type="button" className="w-full gap-2" onClick={() => setCompleteOpen(true)}>
              <CheckCircle className="h-4 w-4" aria-hidden />
              ส่งมอบ / ปิดงาน
            </Button>
          )}

          {step === 4 && (
            <p className="text-center text-xs text-zinc-500">ดำเนินการเสร็จสิ้นแล้ว</p>
          )}

          {showAssign && (
            <div className="border-t border-zinc-200/80 pt-3">
              <button
                type="button"
                onClick={() => setAssignOpen((open) => !open)}
                className="w-full text-center text-xs font-medium text-zinc-600 transition-colors hover:text-blue-700"
              >
                {assignOpen ? "ยกเลิกมอบหมาย" : "มอบหมายให้เจ้าหน้าที่อื่น"}
              </button>
              {assignOpen && (
                <div className="mt-2">
                  <AssignPanel
                    assignOfficerId={assignOfficerId}
                    setAssignOfficerId={setAssignOfficerId}
                    officersWithDept={officersWithDept}
                    onConfirm={confirmAssign}
                  />
                </div>
              )}
            </div>
          )}

          {ticket.assigneeId === currentOfficerId && step === 3 && (
            <p className="text-center text-xs text-zinc-500">คุณเป็นผู้รับผิดชอบงานนี้</p>
          )}
        </div>
      </div>

      {evaluating && (
        <EvaluationModal
          open={evalOpen}
          onClose={() => setEvalOpen(false)}
          ticket={ticket}
          initial={ticket.evaluation}
          onSave={onSaveEvaluation}
        />
      )}

      <ConfirmModal
        open={completeOpen}
        title="ส่งมอบ / ปิดงาน"
        description="ยืนยันว่าดำเนินการเสร็จและส่งมอบแล้ว"
        confirmLabel="ปิดงาน"
        onConfirm={() => {
          const trimmed = completeSummary.trim();
          if (!trimmed) {
            setCompleteError("กรุณาระบุสรุปการส่งมอบ");
            return;
          }
          onComplete(trimmed);
          setCompleteSummary("");
          setCompleteError("");
          setCompleteOpen(false);
        }}
        onCancel={() => {
          setCompleteOpen(false);
          setCompleteSummary("");
          setCompleteError("");
        }}
      >
        <Textarea
          label="สรุปการส่งมอบ"
          value={completeSummary}
          onChange={(e) => {
            setCompleteSummary(e.target.value);
            if (completeError) setCompleteError("");
          }}
          placeholder="เช่น เปลี่ยนแรมเรียบร้อย ส่งคืนเครื่องที่โต๊ะแล้ว"
          rows={3}
          error={completeError}
        />
      </ConfirmModal>
    </div>
  );
}

export function OverdueBadge() {
  return (
    <Badge color="red" className="gap-1">
      <AlertTriangle className="h-3 w-3" aria-hidden />
      เกินกำหนด
    </Badge>
  );
}
