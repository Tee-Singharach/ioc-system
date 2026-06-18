"use client";

import { Pencil, Plus, X } from "lucide-react";
import { DEPT_THEMES } from "@/lib/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalPortal } from "@/components/ui/modal-portal";

export interface DepartmentFormValue {
  slug: string;
  name: string;
  shortName: string;
  colorIndex: number;
}

export interface DepartmentFieldErrors {
  slug?: string;
  name?: string;
  shortName?: string;
}

interface DepartmentFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  value: DepartmentFormValue;
  fieldErrors?: DepartmentFieldErrors;
  formError?: string | null;
  onClose: () => void;
  onChange: (patch: Partial<DepartmentFormValue>) => void;
  onSubmit: () => void;
}

export function DepartmentFormModal({
  open,
  mode,
  value,
  fieldErrors = {},
  formError,
  onClose,
  onChange,
  onSubmit,
}: DepartmentFormModalProps) {
  if (!open) return null;

  const isEdit = mode === "edit";
  const theme = DEPT_THEMES[value.colorIndex] ?? DEPT_THEMES[0];

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <button
          type="button"
          className="absolute inset-0 bg-zinc-900/45 backdrop-blur-[2px]"
          aria-label="ปิด"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dept-form-title"
          className="ioc-card relative z-10 w-full max-w-lg overflow-hidden"
        >
          <div className="relative border-b border-zinc-100 px-6 py-5">
            <div className="flex items-start gap-3 pr-8">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  isEdit ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                }`}
              >
                {isEdit ? (
                  <Pencil className="h-5 w-5" aria-hidden />
                ) : (
                  <Plus className="h-5 w-5" aria-hidden />
                )}
              </div>
              <div>
                <h2 id="dept-form-title" className="text-lg font-semibold text-zinc-900">
                  {isEdit ? "แก้ไขแผนก" : "เพิ่มแผนก"}
                </h2>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {isEdit ? "แก้ไขรายละเอียดแผนก" : "สร้างแผนกใหม่ในระบบ"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
              aria-label="ปิด"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <div className="space-y-4 px-6 py-5">
              <Input
                label={isEdit ? "รหัสแผนก (ID) (แก้ไขไม่ได้)" : "รหัสแผนก (ID)"}
                required={!isEdit}
                className="w-full font-mono"
                value={value.slug}
                onChange={(e) => onChange({ slug: e.target.value })}
                disabled={isEdit}
                placeholder="เช่น admin"
                error={fieldErrors.slug}
              />

              <Input
                label="ชื่อแผนก"
                required
                className="w-full"
                value={value.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="เช่น ฝ่ายธุรการ"
                error={fieldErrors.name}
              />

              <Input
                label="ชื่อย่อ"
                required
                className="w-full"
                value={value.shortName}
                onChange={(e) => onChange({ shortName: e.target.value })}
                placeholder="เช่น Admin"
                error={fieldErrors.shortName}
              />

              <div>
                <p className="ioc-label">สีประจำแผนก</p>
                <div className="mt-2 flex flex-wrap gap-2.5">
                  {DEPT_THEMES.map((t, i) => {
                    const selected = value.colorIndex === i;
                    return (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => onChange({ colorIndex: i })}
                        className={`h-8 w-8 rounded-full transition-transform ${t.dot} ${
                          selected
                            ? `scale-110 ring-2 ring-offset-2 ${t.ring}`
                            : "hover:scale-105"
                        }`}
                        aria-label={t.label}
                        aria-pressed={selected}
                      />
                    );
                  })}
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                  <span className={`h-2 w-2 rounded-full ${theme.dot}`} aria-hidden />
                  {theme.label}
                </p>
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
              <Button type="button" variant="secondary" onClick={onClose}>
                ยกเลิก
              </Button>
              <Button type="submit">{isEdit ? "บันทึก" : "เพิ่มแผนก"}</Button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
