import { NextResponse } from "next/server";

import { assertUserCanReadMessenger } from "@/lib/server/admin";
import {
  getStore,
  isValidGroupUsername,
  normalizeGroupUsername,
  type GroupKind,
} from "@/lib/server/store";

type PublicGroupSearchResult = {
  chatId: string;
  title: string;
  description: string;
  username: string;
  avatarUrl: string;
  bannerUrl: string;
  memberCount: number;
  updatedAt: number;
  groupKind: GroupKind;
};

const MAX_RESULTS = 20;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId")?.trim() ?? "";
  const queryRaw = searchParams.get("q")?.trim() ?? "";
  const query = queryRaw.toLowerCase();
  const usernameQuery = normalizeGroupUsername(queryRaw);
  const now = Date.now();

  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }
  if (!query) {
    return NextResponse.json({ groups: [] as PublicGroupSearchResult[] });
  }

  const store = await getStore();
  const requester = store.users.find((candidate) => candidate.id === userId);
  if (!requester) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  try {
    assertUserCanReadMessenger(store, userId, now);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Your account is suspended.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  const groups = store.threads
    .map((thread) => {
      if (thread.threadType !== "group" || thread.groupAccess !== "public") {
        return null;
      }

      const username = normalizeGroupUsername(thread.groupUsername ?? "");
      if (!isValidGroupUsername(username)) {
        return null;
      }
      if (thread.memberIds.includes(userId)) {
        return null;
      }

      const title = thread.title.trim();
      const description = thread.description.trim();
      const titleAndDescription = `${title} ${description}`.toLowerCase();
      const matchesByTitleOrDescription = titleAndDescription.includes(query);
      const matchesByUsername =
        usernameQuery.length > 0 && username.includes(usernameQuery);

      if (!matchesByTitleOrDescription && !matchesByUsername) {
        return null;
      }

      return {
        chatId: thread.id,
        title: title || `@${username}`,
        description,
        username,
        avatarUrl: thread.avatarUrl ?? "",
        bannerUrl: thread.bannerUrl ?? "",
        memberCount: thread.memberIds.length,
        updatedAt: thread.updatedAt,
        groupKind: thread.groupKind === "channel" ? "channel" : "group",
      } satisfies PublicGroupSearchResult;
    })
    .filter((group): group is PublicGroupSearchResult => group !== null)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_RESULTS);

  return NextResponse.json({ groups });
}
