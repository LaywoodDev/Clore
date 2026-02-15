import { NextResponse } from "next/server";

import {
  createEntityId,
  type StoredCallSignal,
  updateStore,
} from "@/lib/server/store";

type CallSignalPayload = {
  userId?: string;
  chatId?: string;
  toUserId?: string;
  type?: StoredCallSignal["type"];
  data?: unknown;
};

const SIGNAL_TTL_MS = 10 * 60 * 1000;
const ALLOWED_SIGNAL_TYPES = new Set<StoredCallSignal["type"]>([
  "offer",
  "answer",
  "ice",
  "hangup",
  "reject",
]);

function normalizeSignalPayload(value: unknown): string {
  if (!value || typeof value !== "object") {
    return "{}";
  }
  try {
    return JSON.stringify(value);
  } catch {
    return "{}";
  }
}

function pruneExpiredSignals(signals: StoredCallSignal[]): StoredCallSignal[] {
  const minCreatedAt = Date.now() - SIGNAL_TTL_MS;
  return signals.filter((signal) => signal.createdAt >= minCreatedAt);
}

function parseSignalPayload(payload: string): unknown {
  try {
    return JSON.parse(payload);
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as CallSignalPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const chatId = body?.chatId?.trim() ?? "";
  const toUserId = body?.toUserId?.trim() ?? "";
  const type = body?.type;
  const payload = normalizeSignalPayload(body?.data);

  if (!userId || !chatId || !toUserId || !type) {
    return NextResponse.json({ error: "Missing call signal fields." }, { status: 400 });
  }
  if (!ALLOWED_SIGNAL_TYPES.has(type)) {
    return NextResponse.json({ error: "Unsupported call signal type." }, { status: 400 });
  }
  if (userId === toUserId) {
    return NextResponse.json({ error: "Invalid call target." }, { status: 400 });
  }

  try {
    await updateStore<void>((store) => {
      store.callSignals = pruneExpiredSignals(store.callSignals);

      const hasSender = store.users.some((user) => user.id === userId);
      const hasTarget = store.users.some((user) => user.id === toUserId);
      if (!hasSender || !hasTarget) {
        throw new Error("User not found.");
      }

      const thread = store.threads.find(
        (candidate) =>
          candidate.id === chatId &&
          candidate.threadType === "direct" &&
          candidate.memberIds.includes(userId) &&
          candidate.memberIds.includes(toUserId)
      );
      if (!thread) {
        throw new Error("Direct chat not found.");
      }

      store.callSignals.push({
        id: createEntityId("signal"),
        chatId,
        fromUserId: userId,
        toUserId,
        type,
        payload,
        createdAt: Date.now(),
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to deliver call signal.";
    const status =
      message === "User not found."
        ? 404
        : message === "Direct chat not found."
          ? 404
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId")?.trim() ?? "";

  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }

  try {
    const result = await updateStore<{
      signals: Array<{
        id: string;
        chatId: string;
        fromUserId: string;
        toUserId: string;
        type: StoredCallSignal["type"];
        data: unknown;
        createdAt: number;
      }>;
    }>((store) => {
      store.callSignals = pruneExpiredSignals(store.callSignals);

      const outgoing: Array<{
        id: string;
        chatId: string;
        fromUserId: string;
        toUserId: string;
        type: StoredCallSignal["type"];
        data: unknown;
        createdAt: number;
      }> = [];
      const remaining: StoredCallSignal[] = [];

      for (const signal of store.callSignals) {
        if (signal.toUserId === userId) {
          outgoing.push({
            id: signal.id,
            chatId: signal.chatId,
            fromUserId: signal.fromUserId,
            toUserId: signal.toUserId,
            type: signal.type,
            data: parseSignalPayload(signal.payload),
            createdAt: signal.createdAt,
          });
        } else {
          remaining.push(signal);
        }
      }

      store.callSignals = remaining;
      outgoing.sort((a, b) => a.createdAt - b.createdAt);

      return {
        signals: outgoing,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load call signals.";
    const status = 400;
    return NextResponse.json({ error: message }, { status });
  }
}
