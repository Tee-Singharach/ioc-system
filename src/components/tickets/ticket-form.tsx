"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Paperclip, X } from "lucide-react";
import type { Priority, TicketFormData } from "@/lib/types/ticket";
import { PRIORITIES } from "@/lib/types/ticket";
import { MOCK_DEPARTMENTS } from "@/lib/mock/data";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const MAX_FILE_SIZE_MB = 200;

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
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [priority, setPriority] = useState<Priority>(initialData?.priority ?? "ปานกลาง");
  const [departmentId, setDepartmentId] = useState(initialData?.departmentId ?? MOCK_DEPARTMENTS[0].id);
  const [attachmentNames, setAttachmentNames] = useState<string[]>(initialData?.attachmentNames ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrors({ attachments: `ขนาดไฟล์รวมต้องไม่เกิน ${MAX_FILE_SIZE_MB} MB` });
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.attachments;
      return next;
    });
    setAttachmentNames(files.map((f) => f.name));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "กรุณากรอกหัวข้อ";
    if (!description.trim()) newErrors.description = "กรุณากรอกรายละเอียด";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      departmentId,
      attachmentNames,
    });
  }

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

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700">ไฟล์แนบ</label>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-sm text-zinc-500 transition-colors hover:border-blue-400 hover:bg-blue-50">
          <Paperclip className="h-4 w-4" />
          <span>คลิกเพื่อเลือกไฟล์ (ขนาดรวมไม่เกิน {MAX_FILE_SIZE_MB} MB)</span>
          <input type="file" multiple className="hidden" onChange={handleFileChange} />
        </label>
        {errors.attachments && <p className="text-xs text-red-600">{errors.attachments}</p>}
        {attachmentNames.length > 0 && (
          <ul className="mt-1 space-y-1">
            {attachmentNames.map((name) => (
              <li key={name} className="flex items-center gap-2 text-sm text-zinc-600">
                <Paperclip className="h-3.5 w-3.5" />
                {name}
                <button
                  type="button"
                  onClick={() => setAttachmentNames((prev) => prev.filter((n) => n !== name))}
                  className="ml-auto text-zinc-400 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-3 pt-2">
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
