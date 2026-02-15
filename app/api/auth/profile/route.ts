import { NextResponse } from "next/server";

import {
  normalizeUsername,
  toPublicUser,
  type StoredUser,
  updateStore,
} from "@/lib/server/store";

type ProfilePayload = {
  userId?: string;
  name?: string;
  username?: string;
  bio?: string;
  birthday?: string;
  avatarUrl?: string;
  bannerUrl?: string;
};

function isValidBirthday(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.toISOString().slice(0, 10) === value;
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as ProfilePayload | null;
  const userId = body?.userId?.trim() ?? "";
  const name = body?.name?.trim() ?? "";
  const username = normalizeUsername(body?.username ?? "");
  const bio = body?.bio?.trim() ?? "";
  const birthday = body?.birthday?.trim() ?? "";
  const avatarUrl = body?.avatarUrl?.trim() ?? "";
  const bannerUrl = body?.bannerUrl?.trim() ?? "";

  if (!userId || !name || !username) {
    return NextResponse.json({ error: "Missing profile fields." }, { status: 400 });
  }

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return NextResponse.json(
      { error: "Username: 3-20 chars, latin letters, digits or underscore." },
      { status: 400 }
    );
  }

  if (birthday && !isValidBirthday(birthday)) {
    return NextResponse.json(
      { error: "Birthday must be in YYYY-MM-DD format." },
      { status: 400 }
    );
  }

  try {
    const updated = await updateStore<StoredUser>((store) => {
      const target = store.users.find((candidate) => candidate.id === userId);
      if (!target) {
        throw new Error("User not found.");
      }

      const usernameTaken = store.users.some(
        (candidate) =>
          candidate.id !== userId && candidate.username === username
      );
      if (usernameTaken) {
        throw new Error("Username is already used by another account.");
      }

      target.name = name;
      target.username = username;
      target.bio = bio;
      target.birthday = birthday;
      target.avatarUrl = avatarUrl;
      target.bannerUrl = bannerUrl;
      return target;
    });

    return NextResponse.json({ user: toPublicUser(updated) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save profile.";
    const status = message === "User not found." ? 404 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
