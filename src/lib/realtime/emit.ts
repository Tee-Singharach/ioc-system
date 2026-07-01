import { emitToUser } from "@/lib/realtime/bus";

export function emitSyncToUsers(userIds: string[], ticketId?: string): void {
  const event = { type: "sync" as const, ticketId };
  for (const id of [...new Set(userIds)].filter(Boolean)) {
    emitToUser(id, event);
  }
}
