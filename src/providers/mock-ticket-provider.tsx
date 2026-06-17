"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { Ticket, TicketFormData, TicketStatus } from "@/lib/types/ticket";
import { generateId, generateTicketNo, INITIAL_TICKETS, MOCK_DEPARTMENTS } from "@/lib/mock/data";
import { useMockAuth } from "@/providers/mock-auth-provider";

interface MockTicketContextValue {
  tickets: Ticket[];
  getTicket: (id: string) => Ticket | undefined;
  getMyTickets: (requesterId: string) => Ticket[];
  createTicket: (data: TicketFormData) => Ticket;
  updateTicket: (id: string, data: TicketFormData) => void;
  cancelTicket: (id: string) => void;
  resubmitTicket: (id: string, data: TicketFormData) => void;
}

const MockTicketContext = createContext<MockTicketContextValue | null>(null);

function appendHistory(ticket: Ticket, status: TicketStatus, note?: string): Ticket {
  const now = new Date().toISOString();
  return {
    ...ticket,
    status,
    statusHistory: [...ticket.statusHistory, { status, note, at: now }],
    updatedAt: now,
  };
}

export function MockTicketProvider({ children }: { children: ReactNode }) {
  const { user } = useMockAuth();
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);

  const getTicket = useCallback((id: string) => tickets.find((t) => t.id === id), [tickets]);

  const getMyTickets = useCallback(
    (requesterId: string) => tickets.filter((t) => t.requesterId === requesterId),
    [tickets],
  );

  const createTicket = useCallback(
    (data: TicketFormData): Ticket => {
      if (!user) throw new Error("Not authenticated");
      const dept = MOCK_DEPARTMENTS.find((d) => d.id === data.departmentId);
      const now = new Date().toISOString();
      const ticket: Ticket = {
        id: generateId("tkt"),
        ticketNo: generateTicketNo(),
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: "รอรับเรื่อง",
        departmentId: data.departmentId,
        departmentName: dept?.name ?? "",
        requesterId: user.id,
        requesterName: user.name,
        attachments: data.attachmentNames.map((name) => ({
          id: generateId("att"),
          name,
          size: 0,
        })),
        comments: [],
        progressNotes: [],
        statusHistory: [{ status: "รอรับเรื่อง", at: now }],
        createdAt: now,
        updatedAt: now,
      };
      setTickets((prev) => [ticket, ...prev]);
      return ticket;
    },
    [user],
  );

  const updateTicket = useCallback((id: string, data: TicketFormData) => {
    const dept = MOCK_DEPARTMENTS.find((d) => d.id === data.departmentId);
    const now = new Date().toISOString();
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              title: data.title,
              description: data.description,
              priority: data.priority,
              departmentId: data.departmentId,
              departmentName: dept?.name ?? t.departmentName,
              attachments: data.attachmentNames.map((name) => ({
                id: generateId("att"),
                name,
                size: 0,
              })),
              updatedAt: now,
            }
          : t,
      ),
    );
  }, []);

  const cancelTicket = useCallback((id: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? appendHistory(t, "ยกเลิก", "ยกเลิกโดยผู้แจ้ง")
          : t,
      ),
    );
  }, []);

  const resubmitTicket = useCallback((id: string, data: TicketFormData) => {
    const dept = MOCK_DEPARTMENTS.find((d) => d.id === data.departmentId);
    const now = new Date().toISOString();
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...appendHistory(
                {
                  ...t,
                  title: data.title,
                  description: data.description,
                  priority: data.priority,
                  departmentId: data.departmentId,
                  departmentName: dept?.name ?? t.departmentName,
                  attachments: data.attachmentNames.map((name) => ({
                    id: generateId("att"),
                    name,
                    size: 0,
                  })),
                  status: "รอรับเรื่อง",
                },
                "รอรับเรื่อง",
                "ส่งคำร้องใหม่หลังถูกปฏิเสธ",
              ),
              updatedAt: now,
            }
          : t,
      ),
    );
  }, []);

  return (
    <MockTicketContext.Provider
      value={{ tickets, getTicket, getMyTickets, createTicket, updateTicket, cancelTicket, resubmitTicket }}
    >
      {children}
    </MockTicketContext.Provider>
  );
}

export function useMockTickets() {
  const ctx = useContext(MockTicketContext);
  if (!ctx) throw new Error("useMockTickets must be used within MockTicketProvider");
  return ctx;
}
