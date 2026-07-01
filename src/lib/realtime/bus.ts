export type SyncEvent = {
  type: "sync";
  ticketId?: string;
};

type Subscriber = {
  enqueue: (chunk: string) => void;
  close: () => void;
};

type BusGlobal = typeof globalThis & {
  __iocRealtimeBus?: Map<string, Set<Subscriber>>;
};

function subscribers(): Map<string, Set<Subscriber>> {
  const g = globalThis as BusGlobal;
  if (!g.__iocRealtimeBus) g.__iocRealtimeBus = new Map();
  return g.__iocRealtimeBus;
}

export function subscribeUser(userId: string, sub: Subscriber): () => void {
  const bus = subscribers();
  let set = bus.get(userId);
  if (!set) {
    set = new Set();
    bus.set(userId, set);
  }
  set.add(sub);
  return () => {
    set!.delete(sub);
    if (set!.size === 0) bus.delete(userId);
  };
}

// ponytail: in-memory bus — single Node process only; multi-instance needs Redis pub/sub
export function emitToUser(userId: string, event: SyncEvent): void {
  const set = subscribers().get(userId);
  if (!set?.size) return;
  const chunk = `data: ${JSON.stringify(event)}\n\n`;
  for (const sub of set) sub.enqueue(chunk);
}
