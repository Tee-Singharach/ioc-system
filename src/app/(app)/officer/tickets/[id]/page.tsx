"use client";

import { use } from "react";
import { OfficerTicketDetailView } from "@/components/tickets/officer-ticket-detail-view";

export default function OfficerTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <OfficerTicketDetailView ticketId={id} backHref="/officer/tickets" readOnly />;
}
