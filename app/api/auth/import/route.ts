import { NextResponse } from "next/server";

import {
  createEntityId,
  normalizeEmail,
  normalizeUsername,
  updateStore,
} from "@/lib/server/store";

type LegacyUser = {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  password?: string;
};

type ImportPayload = {
  users?: LegacyUser[];
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ImportPayload | null;
  const candidates = Array.isArray(body?.users) ? body.users : [];
  if (candidates.length === 0) {
    return NextResponse.json({ imported: 0 });
  }

  const imported = await updateStore<number>((store) => {
    let added = 0;

    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== "object") {
        continue;
      }

      const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
      const username = normalizeUsername(
        typeof candidate.username === "string" ? candidate.username : ""
      );
      const email = normalizeEmail(
        typeof candidate.email === "string" ? candidate.email : ""
      );
      const password =
        typeof candidate.password === "string" ? candidate.password : "";

      if (!name || !username || !password) {
        continue;
      }

      const duplicate = store.users.some(
        (user) =>
          user.username === username || (email.length > 0 && user.email === email)
      );
      if (duplicate) {
        continue;
      }

      const id =
        typeof candidate.id === "string" && candidate.id.trim()
          ? candidate.id.trim()
          : createEntityId("u");

      store.users.push({
        id,
        name,
        username,
        email,
        password,
        bio: "",
        birthday: "",
        showLastSeen: true,
        lastSeenVisibility: "everyone",
        avatarVisibility: "everyone",
        bioVisibility: "everyone",
        lastSeenAllowedUserIds: [],
        avatarAllowedUserIds: [],
        bioAllowedUserIds: [],
        lastSeenAt: 0,
        avatarUrl: "",
        bannerUrl: "",
      });
      added += 1;
    }

    return added;
  });

  return NextResponse.json({ imported });
}
