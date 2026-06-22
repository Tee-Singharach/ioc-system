"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Priority } from "@/lib/types/ticket";
import { useMockAuth } from "@/providers/mock-auth-provider";
import { useTickets } from "@/providers/mock-ticket-provider";
import type { WorkflowFilterTab } from "@/lib/ticket-workflow";
import { countByWorkflowFilterTab, matchesWorkflowFilterTab } from "@/lib/ticket-workflow";
import { TicketFilterBar } from "@/components/tickets/ticket-filters";
import { TicketTable } from "@/components/tickets/ticket-table";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

const PAGE_SIZE = 8;

export default function StaffTicketsPage() {
  const { user } = useMockAuth();
  const tickets = useTickets();

  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<WorkflowFilterTab>("all");
  const [departmentId, setDepartmentId] = useState("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [page, setPage] = useState(1);

  const myTickets = useMemo(
    () => (user ? tickets.filter((t) => t.requesterId === user.id) : []),
    [user, tickets],
  );

  const tabCounts = useMemo(() => countByWorkflowFilterTab(myTickets), [myTickets]);

  const filtered = useMemo(() => {
    return myTickets.filter((t) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.ticketNo.toLowerCase().includes(q) ||
        t.requesterName.toLowerCase().includes(q);
      const matchTab = matchesWorkflowFilterTab(t, statusTab);
      const matchDept = !departmentId || t.departmentId === departmentId;
      const matchPriority = !priority || t.priority === priority;
      return matchSearch && matchTab && matchDept && matchPriority;
    });
  }, [myTickets, search, statusTab, departmentId, priority]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">คำร้องของฉัน</h1>
          <p className="mt-1 text-sm text-zinc-500">{filtered.length} รายการ</p>
        </div>
        <Link href="/tickets/new" className="shrink-0">
          <Button>
            <Plus className="h-4 w-4" />
            สร้างคำร้องใหม่
          </Button>
        </Link>
      </div>

      <Card>
        <CardBody className="p-0 sm:p-0">
          <TicketFilterBar
            search={search}
            statusTab={statusTab}
            tabCounts={tabCounts}
            departmentId={departmentId}
            priority={priority}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            onStatusTabChange={(tab) => {
              setStatusTab(tab);
              setPage(1);
            }}
            onDepartmentChange={(v) => {
              setDepartmentId(v);
              setPage(1);
            }}
            onPriorityChange={(v) => {
              setPriority(v);
              setPage(1);
            }}
          />
          <TicketTable tickets={paginated} />
        </CardBody>
      </Card>

      {filtered.length > PAGE_SIZE && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-500">
            หน้า {currentPage} จาก {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              ก่อนหน้า
            </Button>
            <Button
              variant="secondary"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              ถัดไป
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
