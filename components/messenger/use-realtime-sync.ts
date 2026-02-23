import { useEffect, useRef, useState } from "react";

const FALLBACK_SYNC_INTERVAL_MS = 25_000;
const RECONNECT_DELAY_MS = 1_500;
const MIN_SYNC_GAP_MS = 350;
const FALLBACK_THRESHOLD_ERRORS = 3;

export type RealtimeStatus = "connected" | "reconnecting" | "fallback";

type UseRealtimeSyncOptions = {
  userId: string;
  onSync: () => void;
};

export function useRealtimeSync({
  userId,
  onSync,
}: UseRealtimeSyncOptions): RealtimeStatus {
  const onSyncRef = useRef(onSync);
  const lastSyncAtRef = useRef(0);
  const scheduledSyncIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectErrorsRef = useRef(0);
  const [statusState, setStatusState] = useState<{
    userId: string;
    status: RealtimeStatus;
  }>({
    userId: "",
    status: "reconnecting",
  });

  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let isDisposed = false;
    let eventSource: EventSource | null = null;
    let reconnectId: ReturnType<typeof setTimeout> | null = null;
    reconnectErrorsRef.current = 0;

    const updateStatus = (nextStatus: RealtimeStatus) => {
      setStatusState((current) => {
        if (current.userId === userId && current.status === nextStatus) {
          return current;
        }
        return {
          userId,
          status: nextStatus,
        };
      });
    };

    const triggerSync = () => {
      const now = Date.now();
      const elapsed = now - lastSyncAtRef.current;
      if (elapsed >= MIN_SYNC_GAP_MS) {
        lastSyncAtRef.current = now;
        onSyncRef.current();
        return;
      }

      if (scheduledSyncIdRef.current) {
        return;
      }

      const waitFor = Math.max(0, MIN_SYNC_GAP_MS - elapsed);
      scheduledSyncIdRef.current = setTimeout(() => {
        scheduledSyncIdRef.current = null;
        lastSyncAtRef.current = Date.now();
        onSyncRef.current();
      }, waitFor);
    };

    const connect = () => {
      if (isDisposed) {
        return;
      }

      eventSource = new EventSource(
        `/api/messenger/events?userId=${encodeURIComponent(userId)}`
      );
      eventSource.addEventListener("store-update", triggerSync);
      eventSource.addEventListener("ready", () => {
        reconnectErrorsRef.current = 0;
        updateStatus("connected");
        triggerSync();
      });
      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        reconnectErrorsRef.current += 1;

        if (reconnectErrorsRef.current >= FALLBACK_THRESHOLD_ERRORS) {
          updateStatus("fallback");
        } else {
          updateStatus("reconnecting");
        }

        if (isDisposed || reconnectId) {
          return;
        }

        reconnectId = setTimeout(() => {
          reconnectId = null;
          connect();
        }, RECONNECT_DELAY_MS);
      };
    };

    connect();

    const fallbackId = setInterval(() => {
      triggerSync();
    }, FALLBACK_SYNC_INTERVAL_MS);

    return () => {
      isDisposed = true;
      if (reconnectId) {
        clearTimeout(reconnectId);
      }
      if (scheduledSyncIdRef.current) {
        clearTimeout(scheduledSyncIdRef.current);
        scheduledSyncIdRef.current = null;
      }
      clearInterval(fallbackId);
      eventSource?.close();
    };
  }, [userId]);

  if (!userId || statusState.userId !== userId) {
    return "reconnecting";
  }
  return statusState.status;
}
