import type { RecommendedAction, RequestItemGroup, RequestLineItem } from "@/lib/types/ticket";
import { RECOMMENDED_ACTIONS } from "@/lib/ticket-evaluation";

export type FieldKind = "text" | "textarea" | "number" | "currency" | "itemGroup";

export interface UnitFieldDef {
  key: string;
  label: string;
  kind: "text" | "textarea" | "select" | "currency";
  required?: boolean;
  placeholder?: string;
}

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  phase: "request" | "evaluation";
  itemNameLabel?: string;
  quantityLabel?: string;
  unitSuffix?: string;
  showUnit?: boolean;
  unitDetailFields?: UnitFieldDef[];
  /** ชนิด/รายการอยู่ในแต่ละหน่วย (เช่น คอม + ปริ้นเตอร์ในคำร้องเดียว) */
  itemNamePerUnit?: boolean;
  /** จำนวนหน่วยตามฟิลด์คำร้อง (ใช้กับผลประเมินต่อเครื่อง) */
  syncFromRequestField?: string;
}

export interface CategoryFormHints {
  /** คำอธิบายหมวดสั้นๆ บรรทัดเดียว */
  summary?: string;
  titlePlaceholder?: string;
  descriptionPlaceholder?: string;
}

export interface TicketCategoryConfig {
  id: string;
  departmentId: string;
  label: string;
  formHints?: CategoryFormHints;
  requestFields: FieldDef[];
  evaluationFields: FieldDef[];
  recommendedActions: RecommendedAction[];
}

export type FieldValues = Record<string, string>;

function emptyUnit(field: FieldDef): Record<string, string> {
  return Object.fromEntries((field.unitDetailFields ?? []).map((u) => [u.key, ""]));
}

export function defaultItemGroupJson(field: FieldDef): string {
  const hasUnits = (field.unitDetailFields?.length ?? 0) > 0;
  const group: RequestItemGroup = {
    itemName: "",
    quantity: "1",
    unit: "",
    units: hasUnits ? [emptyUnit(field)] : [],
  };
  return JSON.stringify(group);
}

export function parseItemGroupJson(raw: string | undefined, field: FieldDef): RequestItemGroup {
  const fallback: RequestItemGroup = JSON.parse(defaultItemGroupJson(field));
  if (!raw?.trim()) return fallback;
  try {
    const parsed = JSON.parse(raw) as RequestItemGroup;
    let group: RequestItemGroup = {
      itemName: parsed.itemName ?? "",
      quantity: parsed.quantity ?? "1",
      unit: parsed.unit ?? "",
      units: Array.isArray(parsed.units) ? parsed.units : fallback.units,
    };
    if (field.itemNamePerUnit && group.itemName.trim() && !group.units[0]?.itemName?.trim()) {
      group = {
        ...group,
        units: group.units.map((u, i) =>
          i === 0 ? { ...u, itemName: group.itemName } : u,
        ),
        itemName: "",
      };
    }
    return group;
  } catch {
    return fallback;
  }
}

export function serializeItemGroup(group: RequestItemGroup): string {
  return JSON.stringify(group);
}

export function syncItemGroupUnits(group: RequestItemGroup, field: FieldDef): RequestItemGroup {
  const unitFields = field.unitDetailFields ?? [];
  if (unitFields.length === 0) return group;

  const qty = Math.max(1, Number(group.quantity.replace(/\D/g, "")) || 1);
  const empty = emptyUnit(field);
  const units = [...group.units];
  while (units.length < qty) units.push({ ...empty });
  while (units.length > qty) units.pop();
  return { ...group, quantity: String(qty), units };
}

export function itemGroupFromStored(
  value: string | number | RequestLineItem[] | RequestItemGroup | undefined,
  field: FieldDef,
): RequestItemGroup {
  if (value && typeof value === "object" && !Array.isArray(value) && ("units" in value || "itemName" in value)) {
    let group = value as RequestItemGroup;
    if (field.itemNamePerUnit && group.itemName?.trim() && !group.units[0]?.itemName?.trim()) {
      group = {
        ...group,
        units: (group.units ?? []).map((u, i) =>
          i === 0 ? { ...u, itemName: group.itemName } : u,
        ),
        itemName: "",
      };
    }
    return syncItemGroupUnits(group, field);
  }
  // ponytail: migrate legacy lineItems array → single itemGroup
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    return syncItemGroupUnits(
      {
        itemName: first.name ?? "",
        quantity: first.quantity ?? "1",
        unit: first.unit ?? "",
        units: [],
      },
      field,
    );
  }
  return parseItemGroupJson(typeof value === "string" ? value : undefined, field);
}

/** @deprecated legacy lineItems display only */
export function lineItemsFromStored(
  value: string | number | RequestLineItem[] | RequestItemGroup | undefined,
): RequestLineItem[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && "itemName" in value) {
    const g = value as RequestItemGroup;
    return [{ name: g.itemName, quantity: g.quantity, unit: g.unit }];
  }
  return [];
}

const ALL_ACTIONS = RECOMMENDED_ACTIONS.map((a) => a.value);

export const TICKET_CATEGORIES: TicketCategoryConfig[] = [
  {
    id: "it-repair",
    departmentId: "dept-it",
    label: "ซ่อม/บำรุง",
    formHints: {
      summary: "แจ้งซ่อมได้หลายชนิด — เพิ่มจำนวนแล้วกรอกแยกต่อเครื่อง",
      titlePlaceholder: "เช่น แจ้งซ่อมคอมพิวเตอร์",
      descriptionPlaceholder: "สรุปภาพรวม",
    },
    requestFields: [
      {
        key: "equipment",
        label: "อุปกรณ์ที่แจ้งซ่อม",
        kind: "itemGroup",
        required: true,
        phase: "request",
        placeholder: "เช่น คอมพิวเตอร์",
        unitSuffix: "เครื่อง",
        itemNamePerUnit: true,
        unitDetailFields: [
          { key: "itemName", label: "ชนิด / รายการ", kind: "text", required: true, placeholder: "เช่น คอมพิวเตอร์" },
          { key: "assetTag", label: "รหัสทรัพย์สิน", kind: "text", required: true, placeholder: "เช่น IT-NB-0042" },
          { key: "symptom", label: "อาการ/ปัญหา", kind: "textarea", required: true, placeholder: "เช่น เปิดเครื่องไม่ติด" },
          { key: "location", label: "สถานที่", kind: "text", placeholder: "เช่น ชั้น 3 ห้อง 301" },
        ],
      },
    ],
    evaluationFields: [
      {
        key: "equipment",
        label: "ผลประเมินต่อเครื่อง",
        kind: "itemGroup",
        required: true,
        phase: "evaluation",
        unitSuffix: "เครื่อง",
        syncFromRequestField: "equipment",
        unitDetailFields: [
          {
            key: "diagnosis",
            label: "ผลการตรวจสอบ",
            kind: "textarea",
            required: true,
            placeholder: "เช่น เปิดเครื่องตรวจพบแรมชำรุด",
          },
          { key: "recommendedAction", label: "แนวทางที่แนะนำ", kind: "select", required: true },
          {
            key: "partsNeeded",
            label: "อะไหล่/วัสดุที่ต้องใช้",
            kind: "textarea",
            placeholder: "ไม่บังคับ",
          },
          { key: "estimatedCost", label: "ประมาณค่าใช้จ่าย (บาท)", kind: "currency" },
        ],
      },
    ],
    recommendedActions: ["repair_onsite", "replace_part", "external_repair", "replace_device", "other"],
  },
  {
    id: "it-access",
    departmentId: "dept-it",
    label: "ขอสิทธิ์/บัญชี",
    formHints: {
      summary: "ขอสิทธิ์เข้าระบบ — ระบุชื่อระบบและเหตุผล",
      titlePlaceholder: "เช่น ขอสิทธิ์เข้า ERP",
      descriptionPlaceholder: "สรุปเหตุผล",
    },
    requestFields: [
      { key: "systemName", label: "ระบบที่ต้องการ", kind: "text", required: true, phase: "request", placeholder: "เช่น ERP, VPN" },
      { key: "accessReason", label: "เหตุผล", kind: "textarea", required: true, phase: "request" },
    ],
    evaluationFields: [],
    recommendedActions: ["proceed", "other"],
  },
  {
    id: "it-software",
    departmentId: "dept-it",
    label: "ติดตั้งซอฟต์แวร์",
    formHints: {
      summary: "ขอติดตั้งโปรแกรม — ระบุชื่อโปรแกรมและเครื่อง",
      titlePlaceholder: "เช่น ติดตั้ง Adobe Acrobat",
      descriptionPlaceholder: "สรุปรายละเอียด",
    },
    requestFields: [
      { key: "softwareName", label: "ชื่อโปรแกรม", kind: "text", required: true, phase: "request" },
      { key: "targetDevice", label: "เครื่อง/อุปกรณ์", kind: "text", phase: "request" },
    ],
    evaluationFields: [],
    recommendedActions: ["proceed", "other"],
  },
  {
    id: "hr-leave",
    departmentId: "dept-hr",
    label: "ลางาน",
    formHints: {
      summary: "ยื่นลา — ระบุประเภทและวันลา",
      titlePlaceholder: "เช่น ขอลาพักร้อน 3 วัน",
      descriptionPlaceholder: "หมายเหตุเพิ่มเติม",
    },
    requestFields: [
      { key: "leaveType", label: "ประเภทการลา", kind: "text", required: true, phase: "request", placeholder: "เช่น ลาพักร้อน" },
      { key: "leaveDates", label: "วันลา", kind: "text", required: true, phase: "request", placeholder: "เช่น 23–25 มิ.ย." },
    ],
    evaluationFields: [],
    recommendedActions: ["proceed", "other"],
  },
  {
    id: "hr-info",
    departmentId: "dept-hr",
    label: "ข้อมูลพนักงาน",
    formHints: {
      summary: "ขอแก้ไขข้อมูลพนักงาน",
      titlePlaceholder: "เช่น แก้ไขที่อยู่",
      descriptionPlaceholder: "สรุปรายละเอียด",
    },
    requestFields: [
      { key: "infoTopic", label: "เรื่องที่ต้องการแก้ไข", kind: "textarea", required: true, phase: "request" },
    ],
    evaluationFields: [],
    recommendedActions: ["proceed", "other"],
  },
  {
    id: "fin-payment",
    departmentId: "dept-finance",
    label: "บัญชี/เบิกจ่าย",
    formHints: {
      summary: "เบิกจ่าย — ระบุรายการและจำนวนเงิน",
      titlePlaceholder: "เช่น เบิกค่าอุปกรณ์",
      descriptionPlaceholder: "สรุปรายละเอียด",
    },
    requestFields: [
      {
        key: "items",
        label: "รายการ/เรื่อง",
        kind: "itemGroup",
        required: true,
        phase: "request",
        itemNameLabel: "รายการ",
        quantityLabel: "จำนวนเงิน (บาท)",
        placeholder: "เช่น ค่าอุปกรณ์สำนักงาน",
      },
    ],
    evaluationFields: [
      { key: "vendor", label: "ผู้ขาย/แหล่งที่เสนอ", kind: "text", phase: "evaluation" },
      { key: "quotedCost", label: "ราคาเสนอ (บาท)", kind: "currency", required: true, phase: "evaluation" },
    ],
    recommendedActions: ["proceed", "other"],
  },
  {
    id: "admin-supplies",
    departmentId: "dept-admin",
    label: "เบิกวัสดุ",
    formHints: {
      summary: "เบิกวัสดุ — ระบุรายการ จำนวน และหน่วย",
      titlePlaceholder: "เช่น เบิกกระดาษ A4",
      descriptionPlaceholder: "หมายเหตุเพิ่มเติม",
    },
    requestFields: [
      {
        key: "items",
        label: "รายการที่ต้องการ",
        kind: "itemGroup",
        required: true,
        phase: "request",
        itemNameLabel: "รายการ",
        quantityLabel: "จำนวน",
        placeholder: "เช่น กระดาษ A4",
        showUnit: true,
      },
    ],
    evaluationFields: [
      { key: "stockNote", label: "สต็อก/แหล่งจัดหา", kind: "text", phase: "evaluation" },
    ],
    recommendedActions: ["proceed", "other"],
  },
  {
    id: "admin-general",
    departmentId: "dept-admin",
    label: "ทั่วไป",
    formHints: {
      summary: "เรื่องทั่วไป — อธิบายในหัวข้อและรายละเอียด",
      titlePlaceholder: "ระบุหัวข้อ",
      descriptionPlaceholder: "อธิบายรายละเอียด",
    },
    requestFields: [],
    evaluationFields: [
      { key: "estimatedCost", label: "ประมาณค่าใช้จ่าย (บาท)", kind: "currency", phase: "evaluation" },
    ],
    recommendedActions: ["proceed", "other"],
  },
  {
    id: "ops-service",
    departmentId: "dept-ops",
    label: "ขอบริการ/งาน",
    formHints: {
      summary: "ขอบริการ — ระบุขอบเขตงานและสถานที่",
      titlePlaceholder: "เช่น ขอจัดเตรียมห้องประชุม",
      descriptionPlaceholder: "สรุปรายละเอียด",
    },
    requestFields: [
      { key: "scope", label: "ขอบเขตงาน", kind: "textarea", required: true, phase: "request" },
      { key: "location", label: "สถานที่", kind: "text", required: true, phase: "request" },
    ],
    evaluationFields: [
      { key: "manpower", label: "แรงคนที่ต้องใช้", kind: "number", phase: "evaluation" },
      { key: "estimatedCost", label: "ประมาณค่าใช้จ่าย (บาท)", kind: "currency", phase: "evaluation" },
    ],
    recommendedActions: ["proceed", "other"],
  },
  {
    id: "ops-general",
    departmentId: "dept-ops",
    label: "ทั่วไป",
    formHints: {
      summary: "เรื่องทั่วไป — อธิบายในหัวข้อและรายละเอียด",
      titlePlaceholder: "ระบุหัวข้อ",
      descriptionPlaceholder: "อธิบายรายละเอียด",
    },
    requestFields: [],
    evaluationFields: [],
    recommendedActions: ALL_ACTIONS,
  },
];

const byId = new Map(TICKET_CATEGORIES.map((c) => [c.id, c]));

export function getCategoryConfig(categoryId: string): TicketCategoryConfig | undefined {
  return byId.get(categoryId);
}

export function getCategoriesForDepartment(departmentId: string): TicketCategoryConfig[] {
  return TICKET_CATEGORIES.filter((c) => c.departmentId === departmentId);
}

export function resolveCategoryId(ticket: { categoryId?: string; departmentId: string }): string {
  if (ticket.categoryId && byId.has(ticket.categoryId)) return ticket.categoryId;
  return getCategoriesForDepartment(ticket.departmentId)[0]?.id ?? "admin-general";
}

export function getRequestFields(categoryId: string): FieldDef[] {
  return getCategoryConfig(categoryId)?.requestFields ?? [];
}

export function getEvaluationFields(categoryId: string): FieldDef[] {
  return getCategoryConfig(categoryId)?.evaluationFields ?? [];
}

export function getRecommendedActionsForCategory(categoryId: string): RecommendedAction[] {
  return getCategoryConfig(categoryId)?.recommendedActions ?? ALL_ACTIONS;
}

function validateItemGroup(f: FieldDef, values: FieldValues): string | undefined {
  const group = syncItemGroupUnits(parseItemGroupJson(values[f.key], f), f);
  if (
    !f.syncFromRequestField &&
    !f.itemNamePerUnit &&
    f.required &&
    !group.itemName.trim()
  ) {
    return `กรุณากรอก${f.itemNameLabel ?? "ชนิด / รายการ"}`;
  }
  if (f.required && !group.quantity.trim()) {
    return `กรุณาระบุ${f.quantityLabel ?? "จำนวน"}`;
  }
  const unitFields = f.unitDetailFields ?? [];
  if (unitFields.length === 0) return undefined;

  const qty = Math.max(1, Number(group.quantity.replace(/\D/g, "")) || 1);
  for (let i = 0; i < qty; i++) {
    const unit = group.units[i] ?? {};
    for (const uf of unitFields) {
      const raw = unit[uf.key]?.trim() ?? "";
      if (uf.required && !raw) {
        return `กรุณากรอก${uf.label}ของ${f.unitSuffix ?? "รายการ"}ที่ ${i + 1}`;
      }
      if (!raw) continue;
      if (uf.kind === "currency") {
        const n = Number(raw.replace(/,/g, ""));
        if (Number.isNaN(n) || n < 0) {
          return `${uf.label}ของ${f.unitSuffix ?? "รายการ"}ที่ ${i + 1} ไม่ถูกต้อง`;
        }
      }
    }
  }
  return undefined;
}

export function validateFieldValues(fields: FieldDef[], values: FieldValues): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    if (f.kind === "itemGroup") {
      const err = validateItemGroup(f, values);
      if (err) errors[f.key] = err;
      continue;
    }
    const raw = String(values[f.key] ?? "").trim();
    if (f.required && !raw) {
      errors[f.key] = `กรุณากรอก${f.label}`;
      continue;
    }
    if (!raw) continue;
    if (f.kind === "number" && Number.isNaN(Number(raw.replace(/,/g, "")))) {
      errors[f.key] = "ตัวเลขไม่ถูกต้อง";
    }
    if (f.kind === "currency") {
      const n = Number(raw.replace(/,/g, ""));
      if (Number.isNaN(n) || n < 0) errors[f.key] = "จำนวนเงินไม่ถูกต้อง";
    }
  }
  return errors;
}

export function parseFieldValues(
  categoryId: string,
  phase: "request" | "evaluation",
  values: FieldValues,
): Record<string, string | number | RequestItemGroup> {
  const fields =
    phase === "request" ? getRequestFields(categoryId) : getEvaluationFields(categoryId);
  const out: Record<string, string | number | RequestItemGroup> = {};
  for (const f of fields) {
    if (f.kind === "itemGroup") {
      const group = syncItemGroupUnits(parseItemGroupJson(values[f.key], f), f);
      if (f.itemNamePerUnit || f.syncFromRequestField) {
        const hasData = group.units.some((u) => Object.values(u).some((v) => v?.trim()));
        if (hasData) out[f.key] = group;
      } else if (group.itemName.trim()) {
        out[f.key] = group;
      }
      continue;
    }
    const raw = values[f.key]?.trim();
    if (!raw) continue;
    if (f.kind === "currency" || f.kind === "number") {
      const n = Number(raw.replace(/,/g, ""));
      if (!Number.isNaN(n)) out[f.key] = n;
    } else {
      out[f.key] = raw;
    }
  }
  return out;
}

export function formatFieldDisplay(
  field: FieldDef,
  value: string | number | RequestLineItem[] | RequestItemGroup | undefined,
): string | null {
  if (value == null || value === "") return null;

  if (field.kind === "itemGroup") {
    const group = itemGroupFromStored(value, field);
    const unitWord = field.unitSuffix ?? "";
    const qty = group.quantity.trim();
    const unit = group.unit?.trim();
    const unitFields = field.unitDetailFields ?? [];

    if (field.itemNamePerUnit) {
      const count = Math.max(1, Number(qty.replace(/\D/g, "")) || 1);
      const lines: string[] = [];
      if (qty) lines.push(`${qty}${unitWord ? ` ${unitWord}` : ""}`.trim());
      for (let i = 0; i < count; i++) {
        const u = group.units[i];
        if (!u) continue;
        const parts = unitFields
          .map((uf) => {
            const v = u[uf.key]?.trim();
            return v ? `${uf.label}: ${v}` : null;
          })
          .filter(Boolean);
        if (parts.length) {
          lines.push(`${unitWord || "รายการ"}ที่ ${i + 1}: ${parts.join(" · ")}`);
        }
      }
      return lines.length ? lines.join("\n") : null;
    }

    if (!group.itemName.trim()) return null;

    const headerParts = [group.itemName.trim()];
    if (qty) headerParts.push(`× ${qty}${unitWord ? ` ${unitWord}` : ""}`);
    if (unit) headerParts.push(unit);
    const lines: string[] = [headerParts.join(" ")];

    if (unitFields.length > 0) {
      const count = Math.max(1, Number(qty.replace(/\D/g, "")) || 1);
      for (let i = 0; i < count; i++) {
        const u = group.units[i];
        if (!u) continue;
        const parts = unitFields
          .map((uf) => {
            const v = u[uf.key]?.trim();
            return v ? `${uf.label}: ${v}` : null;
          })
          .filter(Boolean);
        if (parts.length) lines.push(`${unitWord || "รายการ"}ที่ ${i + 1}: ${parts.join(" · ")}`);
      }
    }
    return lines.join("\n");
  }

  if (field.kind === "currency" && typeof value === "number") {
    return `${value.toLocaleString("th-TH")} บาท`;
  }
  return String(value);
}

/** Migrate legacy flat it-repair fields into itemGroup JSON for edit form */
export function legacyDetailsToFormValues(
  categoryId: string,
  fromInitial: Record<string, string | number | RequestLineItem[] | RequestItemGroup>,
): FieldValues {
  const fields = getRequestFields(categoryId);
  const base = Object.fromEntries(
    fields.map((f) => [f.key, f.kind === "itemGroup" ? defaultItemGroupJson(f) : ""]),
  );

  for (const f of fields) {
    const v = fromInitial[f.key];
    if (v == null) continue;
    if (f.kind === "itemGroup") {
      if (typeof v === "object" && !Array.isArray(v) && "itemName" in v) {
        base[f.key] = serializeItemGroup(syncItemGroupUnits(v as RequestItemGroup, f));
      } else if (Array.isArray(v)) {
        base[f.key] = serializeItemGroup(itemGroupFromStored(v, f));
      } else if (typeof v === "string" && v.startsWith("{")) {
        base[f.key] = v;
      }
      continue;
    }
    base[f.key] = String(v);
  }

  // legacy it-repair: assetTag/symptom/location at top level
  if (categoryId === "it-repair" && fromInitial.assetTag) {
    const f = fields.find((x) => x.key === "equipment");
    if (f) {
      const group: RequestItemGroup = {
        itemName: "",
        quantity: "1",
        units: [
          {
            itemName: String(fromInitial.itemName ?? "อุปกรณ์"),
            assetTag: String(fromInitial.assetTag ?? ""),
            symptom: String(fromInitial.symptom ?? ""),
            location: String(fromInitial.location ?? ""),
          },
        ],
      };
      base.equipment = serializeItemGroup(syncItemGroupUnits(group, f));
    }
  }

  return base;
}
