"use client";

import { useState } from "react";
import type { TicketStatus } from "@/lib/types/ticket";
import { OFFICER_UPDATABLE_STATUSES } from "@/lib/types/ticket";
import { MOCK_DEPARTMENTS, MOCK_OFFICERS } from "@/lib/mock/data";
import { canAddProgress, canAssign, canReceive, canUpdateStatus } from "@/lib/officer-rules";
import type { Ticket } from "@/lib/types/ticket";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface OfficerActionsProps {
  ticket: Ticket;
  currentOfficerId: string;
  onReceive: () => void;
  onUpdateStatus: (status: TicketStatus) => void;
  onAssign: (officerId: string) => void;
  onAddProgress: (content: string) => void;
}

export function OfficerActions({
  ticket,
  currentOfficerId,
  onReceive,
  onUpdateStatus,
  onAssign,
  onAddProgress,
}: OfficerActionsProps) {
  const [newStatus, setNewStatus] = useState<TicketStatus>(ticket.status);
  const [assignOfficerId, setAssignOfficerId] = useState("");
  const [progressNote, setProgressNote] = useState("");

  const officersWithDept = MOCK_OFFICERS.map((o) => {
    const dept = MOCK_DEPARTMENTS.find((d) => d.id === o.departmentId);
    return { ...o, departmentName: dept?.name ?? "" };
  });

  return (
    <div className="space-y-6 border-t border-zinc-100 pt-6">
      <h2 className="text-base font-semibold text-zinc-900">การดำเนินการ (เจ้าหน้าที่)</h2>

      {canReceive(ticket) && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">คำร้องนี้ยังไม่มีผู้รับเรื่อง</p>
          <Button className="mt-3" onClick={onReceive}>รับเรื่องและเริ่มดำเนินการ</Button>
        </div>
      )}

      {canAssign(ticket) && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-3">
          <p className="text-sm font-medium text-zinc-700">มอบหมายงาน (รวมข้ามแผนก)</p>
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
          <Button
            variant="secondary"
            disabled={!assignOfficerId}
            onClick={() => {
              onAssign(assignOfficerId);
              setAssignOfficerId("");
            }}
          >
            มอบหมายงาน
          </Button>
        </div>
      )}

      {canUpdateStatus(ticket) && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-3">
          <p className="text-sm font-medium text-zinc-700">ปรับปรุงสถานะงาน</p>
          <Select
            label="สถานะใหม่"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
            options={OFFICER_UPDATABLE_STATUSES.map((s) => ({ value: s, label: s }))}
          />
          <Button variant="secondary" onClick={() => onUpdateStatus(newStatus)}>
            บันทึกสถานะ
          </Button>
        </div>
      )}

      {canAddProgress(ticket) && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-3">
          <p className="text-sm font-medium text-zinc-700">รายงานความคืบหน้า</p>
          <Textarea
            label="บันทึกความคืบหน้า"
            placeholder="อธิบายความคืบหน้าล่าสุด..."
            value={progressNote}
            onChange={(e) => setProgressNote(e.target.value)}
          />
          <Button
            disabled={!progressNote.trim()}
            onClick={() => {
              onAddProgress(progressNote.trim());
              setProgressNote("");
            }}
          >
            บันทึกความคืบหน้า
          </Button>
        </div>
      )}

      {ticket.assigneeId === currentOfficerId && ticket.status === "กำลังดำเนินการ" && (
        <p className="text-xs text-zinc-500">คุณเป็นผู้รับผิดชอบงานนี้</p>
      )}
    </div>
  );
}
