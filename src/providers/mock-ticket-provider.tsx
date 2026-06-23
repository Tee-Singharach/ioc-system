"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Attachment, Ticket, TicketEvaluation, TicketFormData, TicketStatus } from "@/lib/types/ticket";
import { generateId, generateTicketNo, INITIAL_TICKETS, MOCK_DEPARTMENTS, MOCK_OFFICERS } from "@/lib/mock/data";
import { getOfficerTickets } from "@/lib/officer-access";
import { hasCompleteEvaluation } from "@/lib/ticket-evaluation";
import { approvalNote, canTransition } from "@/lib/ticket-workflow";
import { useMockAuth } from "@/providers/mock-auth-provider";

interface TicketActions {
  getTicket: (id: string) => Ticket | undefined;
  getMyTickets: (requesterId: string) => Ticket[];
  getOfficerTickets: (officerId: string, departmentId: string) => Ticket[];
  createTicket: (data: TicketFormData) => Ticket;
  updateTicket: (id: string, data: TicketFormData) => void;
  cancelTicket: (id: string) => void;
  resubmitTicket: (id: string, data: TicketFormData) => void;
  receiveTicket: (id: string) => void;
  saveEvaluation: (
    id: string,
    data: Omit<TicketEvaluation, "evaluatedAt" | "evaluatedById" | "evaluatedByName">,
  ) => void;
  submitForApproval: (id: string) => void;
  completeTicket: (id: string, summary?: string) => void;
  addProgressNote: (id: string, content: string) => void;
  updateTicketStatus: (id: string, status: TicketStatus) => void;
  assignTicket: (id: string, officerId: string) => void;
  addComment: (ticketId: string, content: string, attachments?: Attachment[]) => void;
  updateComment: (ticketId: string, commentId: string, content: string) => void;
  deleteComment: (ticketId: string, commentId: string) => void;
  approveTicket: (id: string) => void;
  rejectTicket: (id: string, reason: string) => void;
}

const TicketsStateContext = createContext<Ticket[] | null>(null);
const TicketActionsContext = createContext<TicketActions | null>(null);

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

  const getOfficerTicketsForUser = useCallback(
    (officerId: string, departmentId: string) =>
      getOfficerTickets(tickets, { id: officerId, departmentId }),
    [tickets],
  );

  const createTicket = useCallback(
    (data: TicketFormData): Ticket => {
      if (!user) throw new Error("Not authenticated");
      const dept = MOCK_DEPARTMENTS.find((d) => d.id === data.departmentId);
      const reqDept = MOCK_DEPARTMENTS.find((d) => d.id === user.departmentId);
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
        requesterDepartmentId: user.departmentId,
        requesterDepartmentName: reqDept?.name,
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
        scheduledStartAt: data.scheduledStartAt,
        scheduledEndAt: data.scheduledEndAt,
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
              scheduledStartAt: data.scheduledStartAt,
              scheduledEndAt: data.scheduledEndAt,
              updatedAt: now,
            }
          : t,
      ),
    );
  }, []);

  const cancelTicket = useCallback((id: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? appendHistory(t, "ยกเลิก", "ยกเลิกโดยผู้แจ้ง") : t)),
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
                  scheduledStartAt: data.scheduledStartAt,
                  scheduledEndAt: data.scheduledEndAt,
                  status: "รอรับเรื่อง",
                  receivedById: undefined,
                  receivedByName: undefined,
                  assigneeId: undefined,
                  assigneeName: undefined,
                  assigneeDepartmentId: undefined,
                  evaluation: undefined,
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

  const addComment = useCallback(
    (ticketId: string, content: string, attachments?: Attachment[]) => {
      if (!user) throw new Error("Not authenticated");
      const now = new Date().toISOString();
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                comments: [
                  ...t.comments,
                  {
                    id: generateId("cmt"),
                    ticketId,
                    authorId: user.id,
                    authorName: user.name,
                    content,
                    ...(attachments?.length ? { attachments } : {}),
                    createdAt: now,
                    updatedAt: now,
                  },
                ],
                updatedAt: now,
              }
            : t,
        ),
      );
    },
    [user],
  );

  const updateComment = useCallback(
    (ticketId: string, commentId: string, content: string) => {
      if (!user) throw new Error("Not authenticated");
      const now = new Date().toISOString();
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                comments: t.comments.map((c) =>
                  c.id === commentId && c.authorId === user.id
                    ? { ...c, content, updatedAt: now }
                    : c,
                ),
                updatedAt: now,
              }
            : t,
        ),
      );
    },
    [user],
  );

  const deleteComment = useCallback(
    (ticketId: string, commentId: string) => {
      if (!user) throw new Error("Not authenticated");
      const now = new Date().toISOString();
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                comments: t.comments.filter((c) => !(c.id === commentId && c.authorId === user.id)),
                updatedAt: now,
              }
            : t,
        ),
      );
    },
    [user],
  );

  const receiveTicket = useCallback(
    (id: string) => {
      if (!user) throw new Error("Not authenticated");
      const now = new Date().toISOString();
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id !== id || t.status !== "รอรับเรื่อง" || t.receivedById) return t;
          const note = `${user.name} รับเรื่องเพื่อตรวจสอบ`;
          return {
            ...t,
            receivedById: user.id,
            receivedByName: user.name,
            assigneeId: user.id,
            assigneeName: user.name,
            assigneeDepartmentId: user.departmentId,
            statusHistory: [...t.statusHistory, { status: "รอรับเรื่อง", note, at: now }],
            updatedAt: now,
          };
        }),
      );
    },
    [user],
  );

  const saveEvaluation = useCallback(
    (
      id: string,
      data: Omit<TicketEvaluation, "evaluatedAt" | "evaluatedById" | "evaluatedByName">,
    ) => {
      if (!user) throw new Error("Not authenticated");
      const now = new Date().toISOString();
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id !== id || t.status !== "รอรับเรื่อง" || !t.receivedById) return t;
          return {
            ...t,
            evaluation: {
              ...data,
              evaluatedAt: now,
              evaluatedById: user.id,
              evaluatedByName: user.name,
            },
            updatedAt: now,
          };
        }),
      );
    },
    [user],
  );

  const submitForApproval = useCallback(
    (id: string) => {
      if (!user) throw new Error("Not authenticated");
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id !== id || t.status !== "รอรับเรื่อง" || !t.receivedById || !hasCompleteEvaluation(t)) {
            return t;
          }
          return appendHistory(t, "รออนุมัติ", `${user.name} ส่งเรื่องขออนุมัติ`);
        }),
      );
    },
    [user],
  );

  const completeTicket = useCallback(
    (id: string, summary?: string) => {
      if (!user) throw new Error("Not authenticated");
      const trimmed = summary?.trim();
      const note = trimmed ? `${user.name} ส่งมอบ/ปิดงาน: ${trimmed}` : `${user.name} ส่งมอบ/ปิดงาน`;
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id !== id || t.status !== "กำลังดำเนินการ") return t;
          return appendHistory(t, "เสร็จสมบูรณ์", note);
        }),
      );
    },
    [user],
  );

  const addProgressNote = useCallback(
    (id: string, content: string) => {
      if (!user) throw new Error("Not authenticated");
      const trimmed = content.trim();
      if (!trimmed) return;
      const now = new Date().toISOString();
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id !== id || t.status !== "กำลังดำเนินการ") return t;
          return {
            ...t,
            progressNotes: [
              ...t.progressNotes,
              {
                id: generateId("prog"),
                authorId: user.id,
                authorName: user.name,
                content: trimmed,
                createdAt: now,
              },
            ],
            updatedAt: now,
          };
        }),
      );
    },
    [user],
  );

  const updateTicketStatus = useCallback(
    (id: string, status: TicketStatus) => {
      if (!user) throw new Error("Not authenticated");
      if (status === "เสร็จสมบูรณ์") {
        completeTicket(id);
        return;
      }
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id !== id || t.status === status || !canTransition(t.status, status)) return t;
          return appendHistory(t, status, `${user.name} เปลี่ยนสถานะเป็น ${status}`);
        }),
      );
    },
    [user, completeTicket],
  );

  const assignTicket = useCallback((id: string, officerId: string) => {
    const officer = MOCK_OFFICERS.find((o) => o.id === officerId);
    if (!officer) return;
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const note = `มอบหมายให้ ${officer.name}`;
        return {
          ...t,
          assigneeId: officer.id,
          assigneeName: officer.name,
          assigneeDepartmentId: officer.departmentId,
          statusHistory: [...t.statusHistory, { status: t.status, note, at: new Date().toISOString() }],
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }, []);

  const approveTicket = useCallback(
    (id: string) => {
      if (!user) throw new Error("Not authenticated");
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id !== id || t.status !== "รออนุมัติ") return t;
          return appendHistory(t, "กำลังดำเนินการ", approvalNote(user.name));
        }),
      );
    },
    [user],
  );

  const rejectTicket = useCallback(
    (id: string, reason: string) => {
      if (!user) throw new Error("Not authenticated");
      const trimmed = reason.trim();
      if (!trimmed) return;
      const now = new Date().toISOString();
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id !== id || t.status !== "รออนุมัติ") return t;
          return {
            ...appendHistory(t, "ปฏิเสธ", `${user.name} ปฏิเสธ: ${trimmed}`),
            comments: [
              ...t.comments,
              {
                id: generateId("cmt"),
                ticketId: id,
                authorId: user.id,
                authorName: user.name,
                content: trimmed,
                createdAt: now,
                updatedAt: now,
              },
            ],
          };
        }),
      );
    },
    [user],
  );

  const actions = useMemo(
    () => ({
      getTicket,
      getMyTickets,
      getOfficerTickets: getOfficerTicketsForUser,
      createTicket,
      updateTicket,
      cancelTicket,
      resubmitTicket,
      receiveTicket,
      saveEvaluation,
      submitForApproval,
      completeTicket,
      addProgressNote,
      updateTicketStatus,
      assignTicket,
      addComment,
      updateComment,
      deleteComment,
      approveTicket,
      rejectTicket,
    }),
    [
      getTicket,
      getMyTickets,
      getOfficerTicketsForUser,
      createTicket,
      updateTicket,
      cancelTicket,
      resubmitTicket,
      receiveTicket,
      saveEvaluation,
      submitForApproval,
      completeTicket,
      addProgressNote,
      updateTicketStatus,
      assignTicket,
      addComment,
      updateComment,
      deleteComment,
      approveTicket,
      rejectTicket,
    ],
  );

  return (
    <TicketsStateContext.Provider value={tickets}>
      <TicketActionsContext.Provider value={actions}>{children}</TicketActionsContext.Provider>
    </TicketsStateContext.Provider>
  );
}

/** Subscribe only to ticket list — sidebar badges, lists, dashboards. */
export function useTickets() {
  const tickets = useContext(TicketsStateContext);
  if (!tickets) throw new Error("useTickets must be used within MockTicketProvider");
  return tickets;
}

function useTicketActions() {
  const actions = useContext(TicketActionsContext);
  if (!actions) throw new Error("useTicketActions must be used within MockTicketProvider");
  return actions;
}

export function useMockTickets() {
  const tickets = useTickets();
  const actions = useTicketActions();
  return useMemo(() => ({ tickets, ...actions }), [tickets, actions]);
}
