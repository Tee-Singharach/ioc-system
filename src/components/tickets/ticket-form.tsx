"use client";

import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { File, FileText, Image, Upload, X } from "lucide-react";
import type { Priority, TicketFormData } from "@/lib/types/ticket";
import { PRIORITIES } from "@/lib/types/ticket";
import { MOCK_DEPARTMENTS } from "@/lib/mock/data";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/datetime-local";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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

interface TicketFormProps {
  initialData?: Partial<TicketFormData>;
  submitLabel?: string;
  onSubmit: (data: TicketFormData) => void;
  onCancel?: () => void;
}

export function TicketForm({
  initialData,
  submitLabel = "สร้างคำร้อง",
  onSubmit,
  onCancel,
}: TicketFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [priority, setPriority] = useState<Priority>(initialData?.priority ?? "ปานกลาง");
  const [departmentId, setDepartmentId] = useState(initialData?.departmentId ?? MOCK_DEPARTMENTS[0].id);
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
    if (!title.trim()) newErrors.title = "กรุณากรอกหัวข้อ";
    if (!description.trim()) newErrors.description = "กรุณากรอกรายละเอียด";
    if (!scheduledStart) newErrors.scheduledStart = "กรุณาระบุวันที่เวลาเริ่มต้น";
    if (!scheduledEnd) newErrors.scheduledEnd = "กรุณาระบุวันที่เวลาสิ้นสุด";
    if (scheduledStart && scheduledEnd && new Date(scheduledEnd) <= new Date(scheduledStart)) {
      newErrors.scheduledEnd = "วันที่เวลาสิ้นสุดต้องอยู่หลังวันที่เวลาเริ่มต้น";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      departmentId,
      scheduledStartAt: fromDatetimeLocalValue(scheduledStart),
      scheduledEndAt: fromDatetimeLocalValue(scheduledEnd),
      attachmentNames: attachments.map((a) => a.name),
    });
  }

  const totalBytes = attachments.reduce((sum, a) => sum + (a.size ?? 0), 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="หัวข้อ"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        placeholder="ระบุหัวข้อคำร้อง"
      />
      <Textarea
        label="รายละเอียด"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={errors.description}
        placeholder="อธิบายรายละเอียดคำร้อง"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          label="ความสำคัญ"
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          options={PRIORITIES.map((p) => ({ value: p, label: p }))}
        />
        <Select
          label="แผนกที่เกี่ยวข้อง"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          options={MOCK_DEPARTMENTS.map((d) => ({ value: d.id, label: d.name }))}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          type="datetime-local"
          label="วันที่เวลาเริ่มต้น"
          value={scheduledStart}
          onChange={(e) => setScheduledStart(e.target.value)}
          error={errors.scheduledStart}
        />
        <Input
          type="datetime-local"
          label="วันที่เวลาสิ้นสุด"
          value={scheduledEnd}
          onChange={(e) => setScheduledEnd(e.target.value)}
          error={errors.scheduledEnd}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <label className="ioc-label">ไฟล์แนบ</label>
          {attachments.length > 0 && (
            <span className="text-xs text-zinc-500">
              {attachments.length} ไฟล์
              {totalBytes > 0 ? ` · ${formatFileSize(totalBytes)}` : ""}
            </span>
          )}
        </div>

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
          className={`rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
            dragActive
              ? "border-zinc-400 bg-white"
              : errors.attachments
                ? "border-red-300 bg-white"
                : "border-zinc-200 bg-white hover:border-zinc-300"
          }`}
        >
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm ring-1 ring-zinc-200/80">
            <Upload className="h-5 w-5" aria-hidden />
          </div>
          <p className="mt-3 text-sm font-medium text-zinc-800">ลากไฟล์มาวางที่นี่</p>
          <p className="mt-1 text-xs text-zinc-500">หรือเลือกจากเครื่อง · ขนาดรวมไม่เกิน {MAX_FILE_SIZE_MB} MB</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 inline-flex items-center rounded-lg border border-zinc-300 bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100"
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

        {errors.attachments && <p className="text-xs text-red-600">{errors.attachments}</p>}

        {attachments.length > 0 && (
          <ul className="space-y-2">
            {attachments.map((file, index) => {
              const Icon = attachmentIcon(file.name);
              const ext = file.name.split(".").pop()?.toUpperCase() ?? "FILE";
              return (
                <li
                  key={`${file.name}-${index}`}
                  className="ioc-file-row"
                >
                  <div className="ioc-icon-box-brand">
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-800">{file.name}</p>
                    <p className="text-xs text-zinc-500">
                      {ext}
                      {file.size != null ? ` · ${formatFileSize(file.size)}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`ลบไฟล์ ${file.name}`}
                    onClick={() => removeAttachment(index)}
                    className="shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-zinc-100 pt-5 sm:flex-row">
        <Button type="submit">{submitLabel}</Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            ยกเลิก
          </Button>
        )}
      </div>
    </form>
  );
}
