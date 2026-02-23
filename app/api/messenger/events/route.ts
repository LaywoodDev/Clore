import { NextResponse } from "next/server";

import {
  getCurrentStoreRevision,
  subscribeToStoreUpdates,
} from "@/lib/server/realtime";
import { getStore } from "@/lib/server/store";

export const dynamic = "force-dynamic";

const HEARTBEAT_INTERVAL_MS = 25_000;

function toSseChunk(event: string, payload: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId")?.trim() ?? "";

  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }

  const store = await getStore();
  const hasUser = store.users.some((user) => user.id === userId);
  if (!hasUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeatId: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, payload: unknown) => {
        try {
          controller.enqueue(encoder.encode(toSseChunk(event, payload)));
        } catch {
          // Ignore enqueue errors after disconnect.
        }
      };

      send("ready", {
        revision: getCurrentStoreRevision(),
        at: Date.now(),
      });

      unsubscribe = subscribeToStoreUpdates((event) => {
        send("store-update", event);
      });

      heartbeatId = setInterval(() => {
        send("ping", { at: Date.now() });
      }, HEARTBEAT_INTERVAL_MS);
    },
    cancel() {
      if (heartbeatId) {
        clearInterval(heartbeatId);
      }
      unsubscribe?.();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
