import type { RecommendedAction, RequestItemGroup, Ticket, TicketEvaluation } from "@/lib/types/ticket";
import {
  getEvaluationFields,
  getRecommendedActionsForCategory,
  resolveCategoryId,
  validateFieldValues,
  type FieldValues,
} from "@/lib/ticket-categories";
import {
  buildPerUnitEvaluationPayload,
  usesPerUnitEvaluation,
} from "@/lib/ticket-evaluation-units";

export const RECOMMENDED_ACTIONS: { value: RecommendedAction; label: string }[] = [
  { value: "repair_onsite", label: "ซ่อมได้หน้างาน" },
  { value: "replace_part", label: "เปลี่ยนอะไหล่" },
  { value: "external_repair", label: "ส่งซ่อมภายนอก" },
  { value: "replace_device", label: "เปลี่ยนอุปกรณ์ใหม่" },
  { value: "proceed", label: "ดำเนินการตามคำร้อง" },
  { value: "other", label: "อื่นๆ" },
];

export function recommendedActionLabel(action: RecommendedAction): string {
  return RECOMMENDED_ACTIONS.find((a) => a.value === action)?.label ?? action;
}

function evaluationPayloadToFieldValues(e: Pick<TicketEvaluation, "details" | "estimatedCost">): FieldValues {
  const out: FieldValues = {};
  if (e.details) {
    for (const [k, v] of Object.entries(e.details)) out[k] = String(v);
  }
  if (e.estimatedCost != null && !out.estimatedCost && !out.quotedCost) {
    out.estimatedCost = String(e.estimatedCost);
  }
  return out;
}

/** ใช้กฎเดียวกับฟอร์มประเมิน */
export function validateEvaluationPayload(
  ticket: Pick<Ticket, "categoryId" | "departmentId" | "requestDetails">,
  payload: {
    diagnosis?: string;
    recommendedAction?: RecommendedAction | "";
    details?: Record<string, string | number | RequestItemGroup>;
    estimatedCost?: number;
  },
  formValues?: FieldValues,
): Record<string, string> {
  const categoryId = resolveCategoryId(ticket);
  if (usesPerUnitEvaluation(ticket)) {
    if (formValues) {
      const errors = validateFieldValues(getEvaluationFields(categoryId), formValues);
      const built = buildPerUnitEvaluationPayload(categoryId, ticket, formValues);
      if (!built?.diagnosis.trim()) errors.equipment = "กรุณากรอกผลประเมินให้ครบทุกเครื่อง";
      return errors;
    }
    const errors: Record<string, string> = {};
    if (!payload.diagnosis?.trim()) errors.diagnosis = "กรุณาระบุผลการตรวจสอบ";
    if (!payload.recommendedAction) errors.recommendedAction = "กรุณาเลือกแนวทาง";
    return errors;
  }

  const errors: Record<string, string> = {};
  if (!payload.diagnosis?.trim()) errors.diagnosis = "กรุณาระบุผลการตรวจสอบ";
  if (!payload.recommendedAction) errors.recommendedAction = "กรุณาเลือกแนวทาง";
  const fields = getEvaluationFields(categoryId);
  Object.assign(errors, validateFieldValues(fields, evaluationPayloadToFieldValues(payload)));
  return errors;
}

export function hasCompleteEvaluation(
  ticket: Pick<Ticket, "evaluation" | "categoryId" | "departmentId" | "requestDetails">,
): boolean {
  const e = ticket.evaluation;
  if (!e) return false;
  return Object.keys(validateEvaluationPayload(ticket, e)).length === 0;
}

export function canEditEvaluation(ticket: Ticket): boolean {
  return ticket.status === "รอรับเรื่อง" && !!ticket.receivedById;
}

export function formatEstimatedCost(cost?: number): string | null {
  if (cost == null || Number.isNaN(cost)) return null;
  return `${cost.toLocaleString("th-TH")} บาท`;
}

export function evaluationSummary(e: TicketEvaluation): string {
  const parts = [e.diagnosis, `แนะนำ: ${recommendedActionLabel(e.recommendedAction)}`];
  const cost = formatEstimatedCost(e.estimatedCost);
  if (cost) parts.push(`ประมาณ ${cost}`);
  if (e.notes?.trim()) parts.push(e.notes.trim());
  return parts.join(" · ");
}

export function actionsForCategory(categoryId: string) {
  const allowed = new Set(getRecommendedActionsForCategory(categoryId));
  return RECOMMENDED_ACTIONS.filter((a) => allowed.has(a.value));
}

export function parseEvaluationDetails(
  categoryId: string,
  details: FieldValues,
): { details: Record<string, string | number>; estimatedCost?: number } {
  const fields = getEvaluationFields(categoryId);
  const out: Record<string, string | number> = {};
  let estimatedCost: number | undefined;

  for (const f of fields) {
    const raw = String(details[f.key] ?? "").trim();
    if (!raw) continue;
    if (f.kind === "currency" || f.kind === "number") {
      const n = Number(raw.replace(/,/g, ""));
      if (!Number.isNaN(n)) {
        out[f.key] = n;
        if (f.kind === "currency" && estimatedCost == null) estimatedCost = n;
      }
    } else {
      out[f.key] = raw;
    }
  }

  return { details: out, estimatedCost };
}
