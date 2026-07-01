import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/mock/session-cookie";
import { prisma } from "@/lib/prisma";
import { subscribeUser } from "@/lib/realtime/bus";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true },
  });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let unsub: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const enqueue = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          /* stream closed */
        }
      };
      const close = () => {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      unsub = subscribeUser(userId, { enqueue, close });
      enqueue(": connected\n\n");

      heartbeat = setInterval(() => {
        enqueue(": heartbeat\n\n");
      }, 30_000);
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      unsub?.();
    },
  });

  request.signal.addEventListener("abort", () => {
    if (heartbeat) clearInterval(heartbeat);
    unsub?.();
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
