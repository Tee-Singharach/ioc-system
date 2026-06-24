import type { Ticket } from "@/lib/types/ticket";

export function validateEvaluationPayload(
  _ticket: Pick<Ticket, "departmentId">,
  payload: { diagnosis?: string },
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!payload.diagnosis?.trim()) errors.diagnosis = "กรุณาระบุผลการตรวจสอบ";
  return errors;
}

export function hasCompleteEvaluation(ticket: Pick<Ticket, "evaluation">): boolean {
  const e = ticket.evaluation;
  if (!e?.diagnosis?.trim()) return false;
  return Object.keys(validateEvaluationPayload({ departmentId: "" }, e)).length === 0;
}

export function formatEstimatedCost(cost?: number | null): string | null {
  if (cost == null || Number.isNaN(cost)) return null;
  return `${cost.toLocaleString("th-TH")} บาท`;
}

export function parseEstimatedCost(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.replace(/,/g, "").replace(/[^\d.]/g, "");
  if (!normalized) return undefined;
  const n = Number(normalized);
  return Number.isNaN(n) ? undefined : n;
}

if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  if (parseEstimatedCost("1,500 บาท") !== 1500) {
    throw new Error("parseEstimatedCost: strip non-numeric");
  }
}
