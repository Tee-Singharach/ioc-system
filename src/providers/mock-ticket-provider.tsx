"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Attachment, Ticket, TicketEvaluation, TicketFormData } from "@/lib/types/ticket";
import {
  actionAddComment,
  actionAddProgressNote,
  actionApproveTicket,
  actionAssignTicket,
  actionCancelTicket,
  actionCompleteTicket,
  actionCreateTicket,
  actionDeleteComment,
  actionReceiveTicket,
  actionRejectTicket,
  actionResubmitTicket,
  actionSaveEvaluation,
  actionSubmitForApproval,
  actionUpdateComment,
  actionUpdateTicket,
  fetchAllTickets,
} from "@/lib/actions/data";
import { useMockAuth } from "@/providers/mock-auth-provider";

interface TicketActions {
  getTicket: (id: string) => Ticket | undefined;
  createTicket: (data: TicketFormData) => Promise<Ticket>;
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
  assignTicket: (id: string, officerId: string) => void;
  addComment: (ticketId: string, content: string, attachments?: Attachment[]) => void;
  updateComment: (ticketId: string, commentId: string, content: string) => void;
  deleteComment: (ticketId: string, commentId: string) => void;
  approveTicket: (id: string) => void;
  rejectTicket: (id: string, reason: string) => void;
}

const TicketsStateContext = createContext<Ticket[] | null>(null);
const TicketActionsContext = createContext<TicketActions | null>(null);

export function MockTicketProvider({ children }: { children: ReactNode }) {
  const { user } = useMockAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const patchTicket = useCallback((updated: Ticket | undefined) => {
    if (!updated) return;
    setTickets((prev) => {
      const idx = prev.findIndex((t) => t.id === updated.id);
      if (idx === -1) return [updated, ...prev];
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchAllTickets().then((list) => {
      if (cancelled) return;
      setTickets(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const getTicket = useCallback((id: string) => tickets.find((t) => t.id === id), [tickets]);

  const createTicket = useCallback(
    async (data: TicketFormData): Promise<Ticket> => {
      if (!user) throw new Error("Not authenticated");
      const ticket = await actionCreateTicket(user, data);
      patchTicket(ticket);
      return ticket;
    },
    [user, patchTicket],
  );

  const updateTicket = useCallback(
    (id: string, data: TicketFormData) => {
      if (!user) return;
      void actionUpdateTicket(id, user, data).then(patchTicket);
    },
    [user, patchTicket],
  );

  const cancelTicket = useCallback(
    (id: string) => {
      if (!user) return;
      void actionCancelTicket(id, user).then(patchTicket);
    },
    [user, patchTicket],
  );

  const resubmitTicket = useCallback(
    (id: string, data: TicketFormData) => {
      if (!user) return;
      void actionResubmitTicket(id, user, data).then(patchTicket);
    },
    [user, patchTicket],
  );

  const receiveTicket = useCallback(
    (id: string) => {
      if (!user) return;
      void actionReceiveTicket(id, user).then(patchTicket);
    },
    [user, patchTicket],
  );

  const saveEvaluation = useCallback(
    (
      id: string,
      data: Omit<TicketEvaluation, "evaluatedAt" | "evaluatedById" | "evaluatedByName">,
    ) => {
      if (!user) return;
      void actionSaveEvaluation(id, user, data).then(patchTicket);
    },
    [user, patchTicket],
  );

  const submitForApproval = useCallback(
    (id: string) => {
      if (!user) return;
      void actionSubmitForApproval(id, user).then(patchTicket);
    },
    [user, patchTicket],
  );

  const completeTicket = useCallback(
    (id: string, summary?: string) => {
      if (!user) return;
      void actionCompleteTicket(id, user, summary).then(patchTicket);
    },
    [user, patchTicket],
  );

  const addProgressNote = useCallback(
    (id: string, content: string) => {
      if (!user) return;
      void actionAddProgressNote(id, user, content).then(patchTicket);
    },
    [user, patchTicket],
  );

  const assignTicket = useCallback(
    (id: string, officerId: string) => {
      if (!user) return;
      void actionAssignTicket(id, user, officerId).then(patchTicket);
    },
    [user, patchTicket],
  );

  const addComment = useCallback(
    (ticketId: string, content: string, attachments?: Attachment[]) => {
      if (!user) return;
      void actionAddComment(ticketId, user, content, attachments).then(patchTicket);
    },
    [user, patchTicket],
  );

  const updateComment = useCallback(
    (ticketId: string, commentId: string, content: string) => {
      if (!user) return;
      void actionUpdateComment(ticketId, user, commentId, content).then(patchTicket);
    },
    [user, patchTicket],
  );

  const deleteComment = useCallback(
    (ticketId: string, commentId: string) => {
      if (!user) return;
      void actionDeleteComment(ticketId, user, commentId).then(patchTicket);
    },
    [user, patchTicket],
  );

  const approveTicket = useCallback(
    (id: string) => {
      if (!user) return;
      void actionApproveTicket(id, user).then(patchTicket);
    },
    [user, patchTicket],
  );

  const rejectTicket = useCallback(
    (id: string, reason: string) => {
      if (!user) return;
      void actionRejectTicket(id, user, reason).then(patchTicket);
    },
    [user, patchTicket],
  );

  const actions = useMemo(
    () => ({
      getTicket,
      createTicket,
      updateTicket,
      cancelTicket,
      resubmitTicket,
      receiveTicket,
      saveEvaluation,
      submitForApproval,
      completeTicket,
      addProgressNote,
      assignTicket,
      addComment,
      updateComment,
      deleteComment,
      approveTicket,
      rejectTicket,
    }),
    [
      getTicket,
      createTicket,
      updateTicket,
      cancelTicket,
      resubmitTicket,
      receiveTicket,
      saveEvaluation,
      submitForApproval,
      completeTicket,
      addProgressNote,
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
