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
    <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900">การอนุมัติ</h2>
        <Badge color="purple">ผู้จัดการ</Badge>
      </div>

      {decision && !actionable ? (
        <div className="mt-4 rounded-xl border border-zinc-200/80 bg-white p-3">
          <p className="text-xs font-medium text-zinc-500">ผลการพิจารณา</p>
          <p
            className={`mt-1 text-sm font-semibold ${
              decision.action === "approved" ? "text-green-700" : "text-red-600"
            }`}
          >
            {decision.action === "approved" ? "อนุมัติแล้ว" : "ปฏิเสธแล้ว"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{formatShortDate(decision.at)}</p>
          {decision.note && (
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">{decision.note}</p>
          )}
        </div>
      ) : actionable ? (
        <div className="mt-4 space-y-2">
          <Button type="button" className="w-full" onClick={() => setApproveOpen(true)}>
            <CheckCircle className="h-4 w-4" aria-hidden />
            อนุมัติคำร้อง
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

      {rejectOpen && (
        <div className="mt-4 space-y-2 rounded-xl border border-zinc-200/80 bg-white p-3">
          <Textarea
            label="เหตุผลการปฏิเสธ"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError("");
            }}
            placeholder="ระบุเหตุผลที่ปฏิเสธคำร้อง..."
            rows={3}
            error={error}
          />
          <div className="flex gap-2">
            <Button type="button" variant="danger" className="flex-1" onClick={handleReject}>
              ยืนยันปฏิเสธ
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setRejectOpen(false);
                setReason("");
                setError("");
              }}
            >
              ยกเลิก
            </Button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={approveOpen}
        title="อนุมัติคำร้อง"
        description="ยืนยันอนุมัติคำร้องนี้หรือไม่? สถานะจะเปลี่ยนเป็นเสร็จสมบูรณ์"
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
