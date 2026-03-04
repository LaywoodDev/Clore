export type StoreUpdateEvent = {
  revision: number;
  at: number;
};

type StoreUpdateListener = (event: StoreUpdateEvent) => void;

let storeRevision = 0;
let listenerIdCounter = 0;
const listeners = new Map<number, StoreUpdateListener>();

export function getCurrentStoreRevision(): number {
  return storeRevision;
}

export function subscribeToStoreUpdates(
  listener: StoreUpdateListener
): () => void {
  listenerIdCounter += 1;
  const listenerId = listenerIdCounter;
  listeners.set(listenerId, listener);

  return () => {
    listeners.delete(listenerId);
  };
}

export function publishStoreUpdate(): void {
  storeRevision += 1;
  const event: StoreUpdateEvent = {
    revision: storeRevision,
    at: Date.now(),
  };

  for (const listener of listeners.values()) {
    try {
      listener(event);
    } catch {
      // Ignore subscriber errors to keep broadcast loop alive.
    }
  }
}

// --- User-specific events ---

export type UserEventPayload = {
  type: string;
  [key: string]: unknown;
};

type UserEventListener = (payload: UserEventPayload) => void;

let userListenerIdCounter = 0;
const userListeners = new Map<number, { userId: string; listener: UserEventListener }>();

export function subscribeToUserEvents(
  userId: string,
  listener: UserEventListener
): () => void {
  userListenerIdCounter += 1;
  const id = userListenerIdCounter;
  userListeners.set(id, { userId, listener });
  return () => {
    userListeners.delete(id);
  };
}

export function publishUserEvent(userId: string, payload: UserEventPayload): void {
  for (const { userId: uid, listener } of userListeners.values()) {
    if (uid !== userId) continue;
    try {
      listener(payload);
    } catch {
      // ignore
    }
  }
}
