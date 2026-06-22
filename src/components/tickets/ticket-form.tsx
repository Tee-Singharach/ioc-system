"use client";

import { useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent, type ReactNode } from "react";
import { File, FileText, Image, Upload, X } from "lucide-react";
import type { Priority, TicketFormData, TicketFormInitialDetails } from "@/lib/types/ticket";
import { PRIORITIES } from "@/lib/types/ticket";
import { MOCK_DEPARTMENTS } from "@/lib/mock/data";
import {
  defaultItemGroupJson,
  getCategoriesForDepartment,
  getCategoryConfig,
  getRequestFields,
  legacyDetailsToFormValues,
  validateFieldValues,
  type FieldDef,
  type FieldValues,
} from "@/lib/ticket-categories";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/datetime-local";
import { DynamicFields } from "@/components/tickets/dynamic-fields";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

const MAX_FILE_SIZE_MB = 200;

interface AttachmentItem {
  name: string;
  size?: number;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function attachmentIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext ?? "")) return Image;
  if (["pdf", "doc", "docx", "txt"].includes(ext ?? "")) return FileText;
  return File;
}

function emptyRequestDetails(fields: FieldDef[]): FieldValues {
  return Object.fromEntries(
    fields.map((f) => [f.key, f.kind === "itemGroup" ? defaultItemGroupJson(f) : ""]),
  );
}

function FormSection({
  title,
  hint,
  children,
  isFirst = false,
}: {
  title?: string;
  hint?: string;
  children: ReactNode;
  isFirst?: boolean;
}) {
  const hasHeader = title || hint;
  return (
    <section className={isFirst ? "" : "border-t border-zinc-100"}>
      {hasHeader && (
        <div
          className={`px-6 sm:px-8 ${isFirst ? "pt-6 sm:pt-8" : "pt-6"}`}
        >
          {title && <h2 className="text-sm font-semibold text-zinc-800">{title}</h2>}
          {hint && (
            <p className={`text-sm text-zinc-500 ${title ? "mt-1" : ""}`}>{hint}</p>
          )}
        </div>
      )}
      <div
        className={`space-y-5 px-6 pb-7 sm:px-8 sm:pb-8 ${
          hasHeader ? "pt-4" : isFirst ? "pt-6 sm:pt-8" : "pt-6"
        }`}
      >
        {children}
      </div>
    </section>
  );
}

const fieldClass = "py-2.5 text-base";

interface TicketFormProps {
  header?: { title: string; description?: string };
  initialData?: Omit<Partial<TicketFormData>, "requestDetails"> & {
    requestDetails?: TicketFormInitialDetails;
  };
  submitLabel?: string;
  onSubmit: (data: TicketFormData) => void;
  onCancel?: () => void;
}

export function TicketForm({
  header,
  initialData,
  submitLabel = "สร้างคำร้อง",
  onSubmit,
  onCancel,
}: TicketFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [departmentId, setDepartmentId] = useState(
    initialData?.departmentId ?? MOCK_DEPARTMENTS[0].id,
  );
  const deptCategories = useMemo(() => getCategoriesForDepartment(departmentId), [departmentId]);
  const [categoryId, setCategoryId] = useState(
    initialData?.categoryId ?? deptCategories[0]?.id ?? "",
  );

  const activeCategoryId = deptCategories.some((c) => c.id === categoryId)
    ? categoryId
    : (deptCategories[0]?.id ?? "");

  const requestFields = useMemo(() => getRequestFields(activeCategoryId), [activeCategoryId]);
  const categoryConfig = getCategoryConfig(activeCategoryId);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [priority, setPriority] = useState<Priority>(initialData?.priority ?? "ปานกลาง");
  const [requestDetails, setRequestDetails] = useState<FieldValues>(() => {
    const catId = initialData?.categoryId ?? deptCategories[0]?.id ?? "";
    return legacyDetailsToFormValues(catId, initialData?.requestDetails ?? {});
  });
  const [scheduledStart, setScheduledStart] = useState(
    initialData?.scheduledStartAt ? toDatetimeLocalValue(initialData.scheduledStartAt) : "",
  );
  const [scheduledEnd, setScheduledEnd] = useState(
    initialData?.scheduledEndAt ? toDatetimeLocalValue(initialData.scheduledEndAt) : "",
  );
  const [attachments, setAttachments] = useState<AttachmentItem[]>(
    initialData?.attachmentNames?.map((name) => ({ name })) ?? [],
  );
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleDepartmentChange(nextDeptId: string) {
    setDepartmentId(nextDeptId);
    const cats = getCategoriesForDepartment(nextDeptId);
    const nextCat = cats[0]?.id ?? "";
    setCategoryId(nextCat);
    setRequestDetails(emptyRequestDetails(getRequestFields(nextCat)));
    setErrors((prev) => {
      const cleaned = { ...prev };
      for (const key of Object.keys(cleaned)) {
        if (key !== "title" && key !== "description" && !["scheduledStart", "scheduledEnd", "attachments", "categoryId"].includes(key)) {
          delete cleaned[key];
        }
      }
      return cleaned;
    });
  }

  function handleCategoryChange(nextCatId: string) {
    setCategoryId(nextCatId);
    setRequestDetails(emptyRequestDetails(getRequestFields(nextCatId)));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.categoryId;
      for (const f of getRequestFields(nextCatId)) delete next[f.key];
      return next;
    });
  }

  function addFiles(files: File[]) {
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, attachments: `ขนาดไฟล์รวมต้องไม่เกิน ${MAX_FILE_SIZE_MB} MB` }));
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.attachments;
      return next;
    });
    setAttachments(files.map((f) => ({ name: f.name, size: f.size })));
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(e.target.files ?? []));
    e.target.value = "";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    addFiles(Array.from(e.dataTransfer.files));
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!activeCategoryId) newErrors.categoryId = "กรุณาเลือกหมวดหมู่คำร้อง";
    if (!title.trim()) newErrors.title = "กรุณากรอกหัวข้อ";
    if (!description.trim()) newErrors.description = "กรุณากรอกรายละเอียด";
    if (!scheduledStart) newErrors.scheduledStart = "กรุณาระบุวันที่เวลาเริ่มต้น";
    if (!scheduledEnd) newErrors.scheduledEnd = "กรุณาระบุวันที่เวลาสิ้นสุด";
    if (scheduledStart && scheduledEnd && new Date(scheduledEnd) <= new Date(scheduledStart)) {
      newErrors.scheduledEnd = "วันที่เวลาสิ้นสุดต้องอยู่หลังวันที่เวลาเริ่มต้น";
    }
    Object.assign(newErrors, validateFieldValues(requestFields, requestDetails));
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      departmentId,
      categoryId: activeCategoryId,
      requestDetails,
      scheduledStartAt: fromDatetimeLocalValue(scheduledStart),
      scheduledEndAt: fromDatetimeLocalValue(scheduledEnd),
      attachmentNames: attachments.map((a) => a.name),
    });
  }

  const totalBytes = attachments.reduce((sum, a) => sum + (a.size ?? 0), 0);
  const hints = categoryConfig?.formHints;
  const hasCategoryFields = requestFields.length > 0;
  const perUnitItemGroup =
    requestFields.length === 1 &&
    requestFields[0].kind === "itemGroup" &&
    requestFields[0].itemNamePerUnit;

  return (
    <Card>
      {header && (
        <CardHeader>
          <h2 className="text-lg font-semibold text-zinc-900">{header.title}</h2>
          {header.description && (
            <p className="mt-1 text-sm text-zinc-500">{header.description}</p>
          )}
        </CardHeader>
      )}
      <CardBody className="p-0">
        <form onSubmit={handleSubmit}>
          <FormSection isFirst title="เรื่องที่แจ้ง" hint="เลือกแผนกและหมวดให้ตรงกับงาน">
            <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
              <Select
                label="ส่งเรื่องไปแผนก"
                required
                value={departmentId}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                options={MOCK_DEPARTMENTS.map((d) => ({ value: d.id, label: d.name }))}
                className={fieldClass}
              />
              <Select
                label="หมวดหมู่คำร้อง"
                required
                value={activeCategoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                error={errors.categoryId}
                className={fieldClass}
                options={[
                  ...(deptCategories.length === 0
                    ? [{ value: "", label: "— ไม่มีหมวดในแผนกนี้ —" }]
                    : [{ value: "", label: "— เลือกหมวดหมู่ —" }]),
                  ...deptCategories.map((c) => ({ value: c.id, label: c.label })),
                ]}
              />
            </div>
            {hints?.summary && !perUnitItemGroup && (
              <p className="text-sm text-zinc-600">{hints.summary}</p>
            )}
          </FormSection>

          <FormSection
            title="หัวข้อและรายละเอียด"
            hint={
              hasCategoryFields
                ? "เขียนหัวข้อสรุปสั้นๆ และอธิบายภาพรวมของเรื่อง — ข้อมูลเฉพาะหมวดกรอกในส่วนถัดไป"
                : "เขียนหัวข้อสรุปสั้นๆ และอธิบายเรื่องที่ต้องการให้แผนกช่วยให้ครบถ้วน"
            }
          >
            <Input
              label="หัวข้อ"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
              placeholder={hints?.titlePlaceholder ?? "ระบุหัวข้อคำร้อง"}
              className={fieldClass}
            />
            <Textarea
              label="รายละเอียด"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={errors.description}
              placeholder={hints?.descriptionPlaceholder ?? "อธิบายรายละเอียด"}
              className={`min-h-28 ${fieldClass}`}
            />
          </FormSection>

          {categoryConfig && hasCategoryFields && (
            <FormSection title={perUnitItemGroup ? undefined : categoryConfig.label}>
              <DynamicFields
                fields={requestFields}
                values={requestDetails}
                errors={errors}
                sectionTitle={perUnitItemGroup ? categoryConfig.label : undefined}
                sectionHint={perUnitItemGroup ? hints?.summary : undefined}
                onChange={(key, value) => setRequestDetails((prev) => ({ ...prev, [key]: value }))}
              />
            </FormSection>
          )}

          <FormSection
            title="ความสำคัญและช่วงเวลา"
            hint="เลือกความสำคัญของงาน และระบุช่วงวันเวลาที่ต้องการให้ดำเนินการ"
          >
        <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
          <Select
            label="ความสำคัญ"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            options={PRIORITIES.map((p) => ({ value: p, label: p }))}
            className={fieldClass}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
            <Input
              type="datetime-local"
              label="ช่วงเวลาเริ่มต้น"
              value={scheduledStart}
              onChange={(e) => setScheduledStart(e.target.value)}
              error={errors.scheduledStart}
              className={fieldClass}
            />
            <Input
              type="datetime-local"
              label="ช่วงเวลาสิ้นสุด"
              value={scheduledEnd}
              onChange={(e) => setScheduledEnd(e.target.value)}
              error={errors.scheduledEnd}
              className={fieldClass}
            />
          </div>
        </div>
          </FormSection>

          <FormSection
            title="ไฟล์แนบ"
            hint="ไม่บังคับ · รองรับ PDF, Word, Excel และรูปภาพ · ขนาดรวมไม่เกิน 200 MB"
          >
        <div className="flex flex-col gap-3">
          {attachments.length > 0 && (
            <span className="text-sm text-zinc-500">
              {attachments.length} ไฟล์
              {totalBytes > 0 ? ` · ${formatFileSize(totalBytes)}` : ""}
            </span>
          )}

          <div
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              setDragActive(false);
            }}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed px-8 py-12 text-center transition-colors sm:py-14 ${
              dragActive
                ? "border-zinc-400 bg-zinc-50"
                : errors.attachments
                  ? "border-red-300 bg-white"
                  : "border-zinc-200 bg-zinc-50/60 hover:border-zinc-300"
            }`}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm ring-1 ring-zinc-200/80">
              <Upload className="h-6 w-6" aria-hidden />
            </div>
            <p className="mt-4 text-sm font-medium text-zinc-800">ลากไฟล์มาวางที่นี่</p>
            <p className="mt-1 text-xs text-zinc-500">หรือกดเลือกไฟล์จากเครื่อง</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 inline-flex items-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100"
            >
              เลือกไฟล์
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="sr-only"
              onChange={handleFileChange}
            />
          </div>

          {errors.attachments && <p className="text-sm text-red-600">{errors.attachments}</p>}

          {attachments.length > 0 && (
            <ul className="space-y-2">
              {attachments.map((file, index) => {
                const Icon = attachmentIcon(file.name);
                const ext = file.name.split(".").pop()?.toUpperCase() ?? "FILE";
                return (
                  <li key={`${file.name}-${index}`} className="ioc-file-row px-4 py-3">
                    <div className="ioc-icon-box-brand h-10 w-10">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-800">{file.name}</p>
                      <p className="text-sm text-zinc-500">
                        {ext}
                        {file.size != null ? ` · ${formatFileSize(file.size)}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`ลบไฟล์ ${file.name}`}
                      onClick={() => removeAttachment(index)}
                      className="shrink-0 rounded-md p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
          </FormSection>

          <div className="flex flex-col gap-3 border-t border-zinc-100 bg-zinc-50/50 px-6 py-5 sm:flex-row sm:justify-end sm:px-8 sm:py-6">
            {onCancel && (
              <Button type="button" variant="secondary" className="px-6 py-2.5" onClick={onCancel}>
                ยกเลิก
              </Button>
            )}
            <Button type="submit" className="px-6 py-2.5">
              {submitLabel}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
