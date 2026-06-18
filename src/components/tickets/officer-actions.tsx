"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Play, Users } from "lucide-react";
import type { Ticket, TicketStatus } from "@/lib/types/ticket";
import { OFFICER_UPDATABLE_STATUSES } from "@/lib/types/ticket";
import { MOCK_DEPARTMENTS, MOCK_OFFICERS } from "@/lib/mock/data";
import { canAssign, canReceive, canUpdateStatus } from "@/lib/officer-rules";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

interface OfficerActionsProps {
  ticket: Ticket;
  currentOfficerId: string;
  onReceive: () => void;
  onUpdateStatus: (status: TicketStatus) => void;
  onAssign: (officerId: string) => void;
}

function ActionTile({
  label,
  icon: Icon,
  disabled,
  active,
  onClick,
}: {
  label: string;
  icon: typeof Play;
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-blue-300 bg-white shadow-sm"
          : "border-zinc-200/80 bg-white/80 hover:border-blue-200 hover:bg-white"
      }`}
    >
      <Icon className="h-4 w-4 text-zinc-500" aria-hidden />
      <span className="text-[11px] font-medium leading-tight text-zinc-700">{label}</span>
    </button>
  );
}

export function OfficerActions({
  ticket,
  currentOfficerId,
  onReceive,
  onUpdateStatus,
  onAssign,
}: OfficerActionsProps) {
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignOfficerId, setAssignOfficerId] = useState("");
  const [newStatus, setNewStatus] = useState<TicketStatus>(ticket.status);

  useEffect(() => {
    setNewStatus(ticket.status);
  }, [ticket.status]);

  const officersWithDept = MOCK_OFFICERS.map((o) => {
    const dept = MOCK_DEPARTMENTS.find((d) => d.id === o.departmentId);
    return { ...o, departmentName: dept?.name ?? "" };
  });

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900">การดำเนินการ</h2>
        <Badge color="blue">เจ้าหน้าที่</Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <ActionTile label="รับงาน" icon={Play} disabled={!canReceive(ticket)} onClick={onReceive} />
        <ActionTile
          label="มอบหมาย"
          icon={Users}
          disabled={!canAssign(ticket)}
          active={assignOpen}
          onClick={() => setAssignOpen((open) => !open)}
        />
      </div>

      {assignOpen && canAssign(ticket) && (
        <div className="mt-3 space-y-2 rounded-xl border border-zinc-200/80 bg-white p-3">
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
            type="button"
            className="w-full"
            disabled={!assignOfficerId}
            onClick={() => {
              onAssign(assignOfficerId);
              setAssignOfficerId("");
              setAssignOpen(false);
            }}
          >
            มอบหมายงาน
          </Button>
        </div>
      )}

      {canUpdateStatus(ticket) && (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-white/70 p-3">
          <Select
            label="เปลี่ยนสถานะ"
            value={newStatus}
            onChange={(e) => {
              const status = e.target.value as TicketStatus;
              setNewStatus(status);
              onUpdateStatus(status);
            }}
            options={OFFICER_UPDATABLE_STATUSES.map((s) => ({ value: s, label: s }))}
          />
        </div>
      )}

      {ticket.assigneeId === currentOfficerId && ticket.status === "กำลังดำเนินการ" && (
        <p className="mt-3 text-center text-xs text-zinc-500">คุณเป็นผู้รับผิดชอบงานนี้</p>
      )}
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
