"use client";

import { useMemo, useState } from "react";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  DepartmentFormModal,
  type DepartmentFieldErrors,
  type DepartmentFormValue,
} from "@/components/admin/department-form-modal";
import { deptSlugFromId } from "@/lib/admin-ui";
import { useMockAdmin } from "@/providers/mock-admin-provider";
import { useTickets } from "@/providers/mock-ticket-provider";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const EMPTY_DEPT: DepartmentFormValue = {
  slug: "",
  name: "",
  shortName: "",
};

export default function AdminDepartmentsContent() {
  const {
    activeUsers,
    activeDepartments,
    createDepartment,
    updateDepartment,
    softDeleteDepartment,
  } = useMockAdmin();
  const tickets = useTickets();

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_DEPT);
  const [addErrors, setAddErrors] = useState<DepartmentFieldErrors>({});
  const [addFormError, setAddFormError] = useState<string | null>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_DEPT);
  const [editErrors, setEditErrors] = useState<DepartmentFieldErrors>({});
  const [editFormError, setEditFormError] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const userCountByDept = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of activeUsers) {
      map.set(u.departmentId, (map.get(u.departmentId) ?? 0) + 1);
    }
    return map;
  }, [activeUsers]);

  const ticketCountByDept = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tickets) {
      map.set(t.departmentId, (map.get(t.departmentId) ?? 0) + 1);
    }
    return map;
  }, [tickets]);

  const deleteDept = activeDepartments.find((d) => d.id === deleteId);

  function validateDeptForm(form: DepartmentFormValue, isEdit: boolean): DepartmentFieldErrors {
    const next: DepartmentFieldErrors = {};
    if (!isEdit && !form.slug.trim()) next.slug = "กรุณาระบุรหัสแผนก";
    if (!form.name.trim()) next.name = "กรุณาระบุชื่อแผนก";
    if (!form.shortName.trim()) next.shortName = "กรุณาระบุชื่อย่อ";
    return next;
  }

  async function handleAdd() {
    const nextErrors = validateDeptForm(addForm, false);
    if (Object.keys(nextErrors).length > 0) {
      setAddErrors(nextErrors);
      return;
    }
    setAddErrors({});
    const err = await createDepartment(addForm);
    if (err) {
      setAddFormError(err);
      return;
    }
    setAddFormError(null);
    setAddForm(EMPTY_DEPT);
    setAddOpen(false);
  }

  function openEdit(id: string) {
    const dept = activeDepartments.find((d) => d.id === id);
    if (!dept) return;
    setEditId(id);
    setEditForm({
      slug: deptSlugFromId(dept.id),
      name: dept.name,
      shortName: dept.shortName ?? "",
    });
    setEditErrors({});
    setEditFormError(null);
  }

  async function handleEdit() {
    if (!editId) return;
    const nextErrors = validateDeptForm(editForm, true);
    if (Object.keys(nextErrors).length > 0) {
      setEditErrors(nextErrors);
      return;
    }
    setEditErrors({});
    const err = await updateDepartment(editId, {
      name: editForm.name,
      shortName: editForm.shortName,
    });
    if (err) {
      setEditFormError(err);
      return;
    }
    setEditId(null);
  }

  async function handleDelete() {
    if (!deleteId) return;
    const err = await softDeleteDepartment(deleteId);
    if (err) {
      setDeleteError(err);
      return;
    }
    setDeleteId(null);
    setDeleteError(null);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Building2}
        title="จัดการแผนก"
        description="จัดการข้อมูลแผนกในระบบ"
        actions={
          <Button
            type="button"
            onClick={() => {
              setAddForm(EMPTY_DEPT);
              setAddErrors({});
              setAddFormError(null);
              setAddOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            เพิ่มแผนก
          </Button>
        }
      />

      {activeDepartments.length === 0 ? (
        <Card>
          <CardBody>
            <div className="flex flex-col items-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-300">
                <Building2 className="h-8 w-8" strokeWidth={1.5} aria-hidden />
              </div>
              <p className="mt-5 text-sm font-medium text-zinc-700">ยังไม่มีแผนก</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {activeDepartments.map((d) => (
            <Card key={d.id} className="overflow-hidden">
              <CardBody className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600"
                      aria-hidden
                    >
                      <Building2 className="h-6 w-6" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-zinc-900">{d.name}</p>
                      <p className="mt-1 text-sm text-zinc-400">
                        {d.shortName ?? deptSlugFromId(d.id)} · {deptSlugFromId(d.id)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() => openEdit(d.id)}
                      className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                      aria-label={`แก้ไข ${d.name}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteId(d.id);
                      }}
                      className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label={`ลบ ${d.name}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-zinc-50 px-3 py-3.5 text-center text-zinc-700">
                    <p className="text-xl font-bold">{ticketCountByDept.get(d.id) ?? 0}</p>
                    <p className="text-xs font-medium text-zinc-500">คำร้อง</p>
                  </div>
                  <div className="rounded-xl bg-zinc-50 px-3 py-3.5 text-center text-zinc-700">
                    <p className="text-xl font-bold">{userCountByDept.get(d.id) ?? 0}</p>
                    <p className="text-xs font-medium text-zinc-500">ผู้ใช้</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <DepartmentFormModal
        open={addOpen}
        mode="create"
        value={addForm}
        fieldErrors={addErrors}
        formError={addFormError}
        onChange={(patch) => {
          setAddForm((s) => ({ ...s, ...patch }));
          setAddFormError(null);
          setAddErrors((prev) => {
            const next = { ...prev };
            if (patch.slug !== undefined) delete next.slug;
            if (patch.name !== undefined) delete next.name;
            if (patch.shortName !== undefined) delete next.shortName;
            return next;
          });
        }}
        onClose={() => {
          setAddOpen(false);
          setAddFormError(null);
          setAddErrors({});
        }}
        onSubmit={handleAdd}
      />

      <DepartmentFormModal
        open={editId !== null}
        mode="edit"
        value={editForm}
        fieldErrors={editErrors}
        formError={editFormError}
        onChange={(patch) => {
          setEditForm((s) => ({ ...s, ...patch }));
          setEditFormError(null);
          setEditErrors((prev) => {
            const next = { ...prev };
            if (patch.name !== undefined) delete next.name;
            if (patch.shortName !== undefined) delete next.shortName;
            return next;
          });
        }}
        onClose={() => setEditId(null)}
        onSubmit={handleEdit}
      />

      <ConfirmModal
        open={deleteId !== null}
        title="ลบแผนก"
        description={
          deleteError ??
          (deleteDept ? `ลบแผนก "${deleteDept.name}" — บันทึกใน Audit Log` : undefined)
        }
        confirmLabel="ลบ"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteId(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
