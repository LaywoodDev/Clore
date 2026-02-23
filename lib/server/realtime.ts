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
