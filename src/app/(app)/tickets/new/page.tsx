"use client";

import { useRouter } from "next/navigation";
import { TicketForm } from "@/components/tickets/ticket-form";
import { useMockTickets } from "@/providers/mock-ticket-provider";
import { PageHeader } from "@/components/ui/page-header";

export default function NewTicketPage() {
  const router = useRouter();
  const { createTicket } = useMockTickets();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <PageHeader
        title="สร้างคำร้องใหม่"
        description="เลือกแผนกและกรอกข้อมูลให้ครบ"
      />
      <TicketForm
        onSubmit={(data) => {
          const ticket = createTicket(data);
          router.push(`/tickets/${ticket.id}`);
        }}
        onCancel={() => router.push("/tickets")}
      />
    </div>
  );
}
