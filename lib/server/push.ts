import webpush from "web-push";

import { getStore } from "@/lib/server/store";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY?.trim() ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY?.trim() ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT?.trim() || "mailto:admin@clore.app";

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) {
    return true;
  }
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return false;
  }
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidConfigured = true;
    return true;
  } catch (error) {
    console.error("[push] Failed to configure VAPID:", error);
    return false;
  }
}

export type PushPayload = {
  title: string;
  body: string;
  chatId?: string;
};

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureVapidConfigured()) {
    return;
  }

  const store = await getStore();
  const subscriptions = store.pushSubscriptions[userId];
  if (!subscriptions || subscriptions.length === 0) {
    return;
  }

  const payloadString = JSON.stringify(payload);

  await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush
        .sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
          },
          payloadString
        )
        .catch((error) => {
          console.error(`[push] Failed to send to ${userId}:`, (error as Error).message);
        })
    )
  );
}
