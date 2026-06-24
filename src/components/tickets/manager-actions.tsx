"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import type { Ticket } from "@/lib/types/ticket";
import { getApprovalDecision } from "@/lib/manager-access";
import { canApprove, canReject } from "@/lib/manager-rules";
import { formatShortDate } from "@/lib/ticket-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Textarea } from "@/components/ui/textarea";

interface ManagerActionsProps {
  ticket: Ticket;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

export function ManagerActions({ ticket, onApprove, onReject }: ManagerActionsProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const decision = getApprovalDecision(ticket);
  const actionable = canApprove(ticket);
  const rejected = ticket.status === "ปฏิเสธ";
  const approved = !rejected && decision?.action === "approved";

  function outcomeMeta() {
    if (rejected) {
      const entry = [...ticket.statusHistory].reverse().find((h) => h.status === "ปฏิเสธ");
      return { at: decision?.at ?? entry?.at, note: decision?.note ?? entry?.note };
    }
    if (approved && decision) {
      return { at: decision.at, note: decision.note };
    }
    return null;
  }

  const meta = outcomeMeta();

  function handleReject() {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("กรุณาระบุเหตุผลการปฏิเสธ");
      return;
    }
    onReject(trimmed);
    setReason("");
    setError("");
    setRejectOpen(false);
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900">การอนุมัติ</h2>
        <Badge color="purple">ผู้จัดการ</Badge>
      </div>

      {rejected ? (
        <div className="mt-4">
          <Button type="button" variant="danger" className="w-full" disabled aria-disabled>
            <XCircle className="h-4 w-4" aria-hidden />
            ปฏิเสธ
          </Button>
        </div>
      ) : approved ? (
        <div className="mt-4 space-y-2">
          <Button type="button" className="w-full bg-green-600 hover:bg-green-600" disabled aria-disabled>
            <CheckCircle className="h-4 w-4" aria-hidden />
            อนุมัติแล้ว
          </Button>
          {meta?.at && (
            <p className="text-center text-xs text-zinc-500">{formatShortDate(meta.at)}</p>
          )}
          {meta?.note && (
            <p className="rounded-xl border border-green-100 bg-green-50/50 px-3 py-2 text-sm leading-relaxed text-green-800">
              {meta.note}
            </p>
          )}
        </div>
      ) : actionable ? (
        <div className="mt-4 space-y-2">
          <Button type="button" className="w-full" onClick={() => setApproveOpen(true)}>
            <CheckCircle className="h-4 w-4" aria-hidden />
            อนุมัติให้ดำเนินการ
          </Button>
          <Button
            type="button"
            variant="danger"
            className="w-full"
            onClick={() => setRejectOpen(true)}
            disabled={!canReject(ticket)}
          >
            <XCircle className="h-4 w-4" aria-hidden />
            ปฏิเสธคำร้อง
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-center text-xs text-zinc-500">คำร้องนี้ยังไม่ถึงขั้นตอนอนุมัติ</p>
      )}

      <ConfirmModal
        open={rejectOpen}
        title="ปฏิเสธคำร้อง"
        description="กรุณาระบุเหตุผล — ผู้ยื่นจะเห็นในคอมเมนต์"
        confirmLabel="ยืนยัน"
        cancelLabel="ยกเลิก"
        variant="danger"
        onConfirm={handleReject}
        onCancel={() => {
          setRejectOpen(false);
          setReason("");
          setError("");
        }}
      >
        <Textarea
          label="เหตุผลการปฏิเสธ"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError("");
          }}
          placeholder="ระบุเหตุผลที่ปฏิเสธคำร้อง..."
          rows={4}
          error={error}
        />
      </ConfirmModal>

      <ConfirmModal
        open={approveOpen}
        title="อนุมัติให้ดำเนินการ"
        description="ยืนยันอนุมัติให้เจ้าหน้าที่ดำเนินการต่อหรือไม่? สถานะจะเปลี่ยนเป็นกำลังดำเนินการ"
        confirmLabel="อนุมัติ"
        onConfirm={() => {
          onApprove();
          setApproveOpen(false);
        }}
        onCancel={() => setApproveOpen(false)}
      />
    </div>
  );
}
