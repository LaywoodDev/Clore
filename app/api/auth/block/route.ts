import { NextResponse } from "next/server";

import { toPublicUser, type StoredUser, updateStore } from "@/lib/server/store";

type BlockPayload = {
  userId?: string;
  targetUserId?: string;
  blocked?: boolean;
};

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as BlockPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const targetUserId = body?.targetUserId?.trim() ?? "";
  const blocked = body?.blocked;

  if (!userId || !targetUserId || userId === targetUserId || typeof blocked !== "boolean") {
    return NextResponse.json({ error: "Invalid block payload." }, { status: 400 });
  }

  try {
    const updated = await updateStore<StoredUser>((store) => {
      const user = store.users.find((candidate) => candidate.id === userId);
      const targetUser = store.users.find((candidate) => candidate.id === targetUserId);
      if (!user || !targetUser) {
        throw new Error("User not found.");
      }

      const next = new Set(user.blockedUserIds);
      if (blocked) {
        next.add(targetUserId);
      } else {
        next.delete(targetUserId);
      }
      user.blockedUserIds = [...next];
      return user;
    });

    return NextResponse.json({ user: toPublicUser(updated) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update block list.";
    const status = message === "User not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
