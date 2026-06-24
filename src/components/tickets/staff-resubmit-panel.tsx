import Link from "next/link";
import { FilePlus, RotateCcw } from "lucide-react";
import type { Ticket } from "@/lib/types/ticket";
import {
  canResubmit,
  countRejections,
  isResubmitExhausted,
  MAX_RESUBMITS_AFTER_REJECT,
} from "@/lib/ticket-rules";
import { Button } from "@/components/ui/button";

export function StaffResubmitPanel({
  ticket,
  onResubmit,
}: {
  ticket: Ticket;
  onResubmit: () => void;
}) {
  if (ticket.status !== "ปฏิเสธ") return null;

  if (isResubmitExhausted(ticket)) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
        <p className="text-sm font-medium text-amber-900">
          ถูกปฏิเสธเกิน {MAX_RESUBMITS_AFTER_REJECT} ครั้งแล้ว
        </p>
        <p className="mt-1 text-sm text-amber-800">
          ไม่สามารถส่งคำร้องนี้ซ้ำได้อีก กรุณาเขียนคำร้องใหม่
        </p>
        <Link
          href="/tickets/new"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:w-auto"
        >
          <FilePlus className="h-4 w-4" aria-hidden />
          สร้างคำร้องใหม่
        </Link>
      </div>
    );
  }

  if (!canResubmit(ticket)) return null;

  const used = countRejections(ticket);
  const left = MAX_RESUBMITS_AFTER_REJECT - used + 1;

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4">
      <p className="text-sm font-medium text-blue-900">ส่งคำร้องนี้เข้าระบบอีกครั้งได้</p>
      <p className="mt-1 text-sm text-blue-800">
        ปรับข้อมูลแล้วส่งใหม่ (เหลืออีก {left} ครั้ง)
      </p>
      <Button type="button" className="mt-4 w-full sm:w-auto" onClick={onResubmit}>
        <RotateCcw className="h-4 w-4" aria-hidden />
        ส่งคำร้องใหม่
      </Button>
    </div>
  );
}
