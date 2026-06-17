"use client";

import { useRouter } from "next/navigation";
import { TicketForm } from "@/components/tickets/ticket-form";
import { useMockTickets } from "@/providers/mock-ticket-provider";

export default function NewTicketPage() {
  const router = useRouter();
  const { createTicket } = useMockTickets();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">สร้างคำร้องใหม่</h1>
        <p className="text-sm text-zinc-500">กรอกข้อมูลและแนบไฟล์ประกอบคำร้องของคุณ</p>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <TicketForm
          onSubmit={(data) => {
            const ticket = createTicket(data);
            router.push(`/tickets/${ticket.id}`);
          }}
          onCancel={() => router.push("/tickets")}
        />
      </div>
    </div>
  );
}
