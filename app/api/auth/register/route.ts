import { NextResponse } from "next/server";

import {
  createEntityId,
  normalizeEmail,
  normalizeUsername,
  toPublicUser,
  type StoredUser,
  updateStore,
} from "@/lib/server/store";

type RegisterPayload = {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RegisterPayload | null;
  const name = body?.name?.trim() ?? "";
  const username = normalizeUsername(body?.username ?? "");
  const email = normalizeEmail(body?.email ?? "");
  const password = body?.password ?? "";

  if (!name || !username || !email || !password) {
    return NextResponse.json({ error: "Fill all fields." }, { status: 400 });
  }

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return NextResponse.json(
      { error: "Username: 3-20 chars, latin letters, digits or underscore." },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  try {
    const user = await updateStore<StoredUser>((store) => {
      const emailTaken = store.users.some((candidate) => candidate.email === email);
      if (emailTaken) {
        throw new Error("Email is already registered.");
      }

      const usernameTaken = store.users.some(
        (candidate) => candidate.username === username
      );
      if (usernameTaken) {
        throw new Error("Username is already taken.");
      }

      const created: StoredUser = {
        id: createEntityId("u"),
        name,
        username,
        email,
        password,
        blockedUserIds: [],
        bio: "",
        birthday: "",
        showLastSeen: true,
        lastSeenVisibility: "everyone",
        avatarVisibility: "everyone",
        bioVisibility: "everyone",
        birthdayVisibility: "everyone",
        callVisibility: "everyone",
        forwardVisibility: "everyone",
        groupAddVisibility: "everyone",
        lastSeenAllowedUserIds: [],
        avatarAllowedUserIds: [],
        bioAllowedUserIds: [],
        birthdayAllowedUserIds: [],
        callAllowedUserIds: [],
        forwardAllowedUserIds: [],
        groupAddAllowedUserIds: [],
        lastSeenAt: 0,
        avatarUrl: "",
        bannerUrl: "",
        archiveLockEnabled: false,
        archivePasscode: "",
      };
      store.users.push(created);
      return created;
    });

    return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create account.";
    const status =
      message === "Email is already registered." ||
      message === "Username is already taken."
        ? 409
        : 500;

    return NextResponse.json(
      {
        error: message,
      },
      { status }
    );
  }
}
