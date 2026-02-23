import { NextResponse } from "next/server";

import {
  getCurrentStoreRevision,
  subscribeToStoreUpdates,
} from "@/lib/server/realtime";
import { getStore, getStoreUpdateMarker } from "@/lib/server/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const HEARTBEAT_INTERVAL_MS = 25_000;
const CROSS_INSTANCE_POLL_INTERVAL_MS = 2_500;

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
  let markerPollId: ReturnType<typeof setInterval> | null = null;
  let streamClosed = false;
  let pollInFlight = false;
  let lastMarker = 0;

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

      const pollStoreMarker = async () => {
        if (streamClosed || pollInFlight) {
          return;
        }
        pollInFlight = true;
        try {
          const marker = await getStoreUpdateMarker();
          if (!Number.isFinite(marker) || marker <= 0) {
            return;
          }
          if (lastMarker === 0) {
            lastMarker = marker;
            return;
          }
          if (marker > lastMarker) {
            lastMarker = marker;
            send("store-update", {
              revision: getCurrentStoreRevision(),
              at: Date.now(),
              source: "marker-poll",
            });
          }
        } catch {
          // Best-effort: keep SSE stream alive even if marker polling fails.
        } finally {
          pollInFlight = false;
        }
      };

      void pollStoreMarker();
      markerPollId = setInterval(() => {
        void pollStoreMarker();
      }, CROSS_INSTANCE_POLL_INTERVAL_MS);
    },
    cancel() {
      streamClosed = true;
      if (heartbeatId) {
        clearInterval(heartbeatId);
      }
      if (markerPollId) {
        clearInterval(markerPollId);
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
