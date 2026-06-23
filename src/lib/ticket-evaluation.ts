import type { Ticket, TicketEvaluation } from "@/lib/types/ticket";

export const RECOMMENDED_ACTIONS = [
  { value: "repair_onsite", label: "ซ่อมได้หน้างาน" },
  { value: "replace_part", label: "เปลี่ยนอะไหล่" },
  { value: "external_repair", label: "ส่งซ่อมภายนอก" },
  { value: "replace_device", label: "เปลี่ยนอุปกรณ์ใหม่" },
  { value: "proceed", label: "ดำเนินการตามคำร้อง" },
  { value: "other", label: "อื่นๆ" },
] as const;

/** @deprecated ใช้กับ config หมวดเก่าเท่านั้น */
export function recommendedActionLabel(
  action: import("@/lib/types/ticket").RecommendedAction,
): string {
  return RECOMMENDED_ACTIONS.find((a) => a.value === action)?.label ?? action;
}

export function validateEvaluationPayload(
  _ticket: Pick<Ticket, "departmentId">,
  payload: {
    diagnosis?: string;
    hasCost?: boolean;
    estimatedCost?: number;
  },
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!payload.diagnosis?.trim()) errors.diagnosis = "กรุณาระบุผลการตรวจสอบ";
  if (payload.hasCost && payload.estimatedCost == null) {
    errors.estimatedCost = "กรุณาระบุประมาณค่าใช้จ่าย";
  }
  return errors;
}

export function hasCompleteEvaluation(ticket: Pick<Ticket, "evaluation">): boolean {
  const e = ticket.evaluation;
  if (!e) return false;
  return (
    Object.keys(
      validateEvaluationPayload(
        { departmentId: "" },
        {
          diagnosis: e.diagnosis,
          hasCost: e.estimatedCost != null,
          estimatedCost: e.estimatedCost,
        },
      ),
    ).length === 0
  );
}

export function canEditEvaluation(ticket: Ticket): boolean {
  return ticket.status === "รอรับเรื่อง" && !!ticket.receivedById;
}

export function formatEstimatedCost(cost?: number): string | null {
  if (cost == null || Number.isNaN(cost)) return null;
  return `${cost.toLocaleString("th-TH")} บาท`;
}

export function evaluationSummary(e: TicketEvaluation): string {
  const parts = [e.diagnosis];
  const cost = formatEstimatedCost(e.estimatedCost);
  if (cost) parts.push(`ประมาณ ${cost}`);
  if (e.notes?.trim()) parts.push(e.notes.trim());
  return parts.join(" · ");
}

export function parseEstimatedCost(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed.replace(/,/g, ""));
  return Number.isNaN(n) ? undefined : n;
}
