"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import type { Priority, TicketStatus } from "@/lib/types/ticket";
import { useMockAuth } from "@/providers/mock-auth-provider";
import { useMockTickets } from "@/providers/mock-ticket-provider";
import { TicketFilters } from "@/components/tickets/ticket-filters";
import { TicketTable } from "@/components/tickets/ticket-table";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 5;

export default function StaffTicketsPage() {
  const { user } = useMockAuth();
  const { getMyTickets } = useMockTickets();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const base = user ? getMyTickets(user.id) : [];
    return base.filter((t) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.ticketNo.toLowerCase().includes(q);
      const matchStatus = !status || t.status === status;
      const matchPriority = !priority || t.priority === priority;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [user, getMyTickets, search, status, priority]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">คำร้องของฉัน</h1>
          <p className="text-sm text-zinc-500">ทั้งหมด {filtered.length} รายการ</p>
        </div>
        <Link href="/tickets/new">
          <Button>
            <PlusCircle className="h-4 w-4" />
            สร้างคำร้องใหม่
          </Button>
        </Link>
      </div>

      <TicketFilters
        search={search}
        status={status}
        priority={priority}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        onStatusChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
        onPriorityChange={(v) => {
          setPriority(v);
          setPage(1);
        }}
      />

      <TicketTable tickets={paginated} showRequester={false} />

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between">
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
