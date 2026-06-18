"use client";

import { useRouter } from "next/navigation";
import { TicketForm } from "@/components/tickets/ticket-form";
import { useMockTickets } from "@/providers/mock-ticket-provider";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function NewTicketPage() {
  const router = useRouter();
  const { createTicket } = useMockTickets();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="สร้างคำร้องใหม่"
        description="กรอกข้อมูลและแนบไฟล์ประกอบคำร้องของคุณ"
      />
      <Card>
        <CardBody>
          <TicketForm
            onSubmit={(data) => {
              const ticket = createTicket(data);
              router.push(`/tickets/${ticket.id}`);
            }}
            onCancel={() => router.push("/tickets")}
          />
        </CardBody>
      </Card>
    </div>
  );
}
