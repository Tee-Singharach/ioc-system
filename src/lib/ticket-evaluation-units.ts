import type { RecommendedAction, RequestItemGroup, Ticket } from "@/lib/types/ticket";
import { recommendedActionLabel } from "@/lib/ticket-evaluation";
import {
  getEvaluationFields,
  getRequestFields,
  itemGroupFromStored,
  parseItemGroupJson,
  resolveCategoryId,
  serializeItemGroup,
  syncItemGroupUnits,
  type FieldDef,
  type FieldValues,
} from "@/lib/ticket-categories";

function emptyUnit(field: FieldDef): Record<string, string> {
  return Object.fromEntries((field.unitDetailFields ?? []).map((u) => [u.key, ""]));
}

export function getPerUnitEvaluationField(categoryId: string): FieldDef | undefined {
  return getEvaluationFields(categoryId).find(
    (f) => f.kind === "itemGroup" && f.syncFromRequestField,
  );
}

export function usesPerUnitEvaluation(
  ticket: Pick<Ticket, "categoryId" | "departmentId" | "requestDetails">,
): boolean {
  const categoryId = resolveCategoryId(ticket);
  const evalField = getPerUnitEvaluationField(categoryId);
  if (!evalField?.syncFromRequestField) return false;
  const requestField = getRequestFields(categoryId).find(
    (f) => f.key === evalField.syncFromRequestField,
  );
  if (!requestField) return false;
  const req = ticket.requestDetails?.[evalField.syncFromRequestField];
  if (req == null) return false;
  const group = itemGroupFromStored(req, requestField);
  return group.units.length > 0;
}

function requestFieldForEval(categoryId: string, evalField: FieldDef): FieldDef | undefined {
  if (!evalField.syncFromRequestField) return undefined;
  return getRequestFields(categoryId).find((f) => f.key === evalField.syncFromRequestField);
}

export function seedEquipmentEvaluation(
  categoryId: string,
  ticket: Pick<Ticket, "requestDetails">,
  existing?: RequestItemGroup,
): RequestItemGroup {
  const evalField = getPerUnitEvaluationField(categoryId)!;
  const requestField = requestFieldForEval(categoryId, evalField)!;
  const req = itemGroupFromStored(ticket.requestDetails?.[evalField.syncFromRequestField!], requestField);
  const qty = Math.max(1, Number(req.quantity.replace(/\D/g, "")) || 1);
  const existingGroup = existing
    ? syncItemGroupUnits(existing, evalField)
    : parseItemGroupJson(undefined, evalField);
  const blank = emptyUnit(evalField);
  const units = Array.from({ length: qty }, (_, i) => ({
    ...blank,
    ...(existingGroup.units[i] ?? {}),
  }));
  return { itemName: "", quantity: String(qty), units };
}

export function equipmentEvalToFormValue(
  categoryId: string,
  ticket: Pick<Ticket, "requestDetails">,
  initial?: RequestItemGroup,
): string {
  return serializeItemGroup(seedEquipmentEvaluation(categoryId, ticket, initial));
}

export function aggregateEquipmentEvaluation(
  group: RequestItemGroup,
  evalField: FieldDef,
  requestUnits: Record<string, string>[],
): {
  diagnosis: string;
  recommendedAction: RecommendedAction;
  estimatedCost?: number;
  details: { equipment: RequestItemGroup };
} {
  const qty = Math.max(1, Number(group.quantity.replace(/\D/g, "")) || 1);
  const unitWord = evalField.unitSuffix ?? "เครื่อง";
  const lines: string[] = [];
  const actions = new Set<RecommendedAction>();
  let totalCost = 0;
  let hasCost = false;

  for (let i = 0; i < qty; i++) {
    const evalUnit = group.units[i] ?? {};
    const reqUnit = requestUnits[i] ?? {};
    const label = [reqUnit.itemName, reqUnit.assetTag && `(${reqUnit.assetTag})`]
      .filter(Boolean)
      .join(" ");
    const parts: string[] = [];
    if (evalUnit.diagnosis?.trim()) parts.push(evalUnit.diagnosis.trim());
    if (evalUnit.recommendedAction) {
      actions.add(evalUnit.recommendedAction as RecommendedAction);
      parts.push(`แนวทาง: ${recommendedActionLabel(evalUnit.recommendedAction as RecommendedAction)}`);
    }
    if (evalUnit.partsNeeded?.trim()) parts.push(`อะไหล่: ${evalUnit.partsNeeded.trim()}`);
    const unitCost = Number(String(evalUnit.estimatedCost ?? "").replace(/,/g, ""));
    if (!Number.isNaN(unitCost) && unitCost > 0) {
      hasCost = true;
      totalCost += unitCost;
      parts.push(`ประมาณ ${unitCost.toLocaleString("th-TH")} บาท`);
    }
    if (parts.length) {
      lines.push(`${unitWord}ที่ ${i + 1}${label ? ` ${label}` : ""}: ${parts.join(" · ")}`);
    }
  }

  const actionList = [...actions];
  const recommendedAction: RecommendedAction =
    actionList.length === 1 ? actionList[0]! : "other";

  return {
    diagnosis: lines.join("\n"),
    recommendedAction,
    estimatedCost: hasCost ? totalCost : undefined,
    details: { equipment: syncItemGroupUnits(group, evalField) },
  };
}

export function buildPerUnitEvaluationPayload(
  categoryId: string,
  ticket: Pick<Ticket, "requestDetails">,
  formValues: FieldValues,
): ReturnType<typeof aggregateEquipmentEvaluation> | null {
  const evalField = getPerUnitEvaluationField(categoryId);
  if (!evalField) return null;
  const requestField = requestFieldForEval(categoryId, evalField);
  if (!requestField) return null;
  const group = syncItemGroupUnits(parseItemGroupJson(formValues[evalField.key], evalField), evalField);
  const req = itemGroupFromStored(ticket.requestDetails?.[evalField.syncFromRequestField!], requestField);
  return aggregateEquipmentEvaluation(group, evalField, req.units);
}

export function evaluationHasPerUnitDetails(
  categoryId: string,
  evaluation: { details?: Record<string, unknown> },
): boolean {
  const evalField = getPerUnitEvaluationField(categoryId);
  if (!evalField) return false;
  const raw = evaluation.details?.[evalField.key];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const group = raw as RequestItemGroup;
  return group.units?.some((u) => u.diagnosis?.trim() || u.recommendedAction?.trim()) ?? false;
}

export function formatUnitEvalDisplay(
  evalUnit: Record<string, string>,
  evalField: FieldDef,
): { label: string; value: string }[] {
  return (evalField.unitDetailFields ?? [])
    .map((uf) => {
      const raw = evalUnit[uf.key]?.trim();
      if (!raw) return null;
      let value = raw;
      if (uf.key === "recommendedAction") value = recommendedActionLabel(raw as RecommendedAction);
      if (uf.kind === "currency") {
        const n = Number(raw.replace(/,/g, ""));
        if (!Number.isNaN(n)) value = `${n.toLocaleString("th-TH")} บาท`;
      }
      return { label: uf.label, value };
    })
    .filter(Boolean) as { label: string; value: string }[];
}
