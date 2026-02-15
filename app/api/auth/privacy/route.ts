import { NextResponse } from "next/server";

import { toPublicUser, type StoredUser, updateStore } from "@/lib/server/store";

type VisibilityScope = "everyone" | "selected" | "nobody";

type PrivacyPayload = {
  userId?: string;
  lastSeenVisibility?: VisibilityScope;
  avatarVisibility?: VisibilityScope;
  bioVisibility?: VisibilityScope;
  lastSeenAllowedUserIds?: string[];
  avatarAllowedUserIds?: string[];
  bioAllowedUserIds?: string[];
};

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as PrivacyPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const lastSeenVisibility = body?.lastSeenVisibility;
  const avatarVisibility = body?.avatarVisibility;
  const bioVisibility = body?.bioVisibility;
  const lastSeenAllowedUserIds = Array.isArray(body?.lastSeenAllowedUserIds)
    ? body.lastSeenAllowedUserIds
    : [];
  const avatarAllowedUserIds = Array.isArray(body?.avatarAllowedUserIds)
    ? body.avatarAllowedUserIds
    : [];
  const bioAllowedUserIds = Array.isArray(body?.bioAllowedUserIds)
    ? body.bioAllowedUserIds
    : [];
  const isValidVisibility = (value: unknown): value is VisibilityScope =>
    value === "everyone" || value === "selected" || value === "nobody";
  const sanitizeAllowedUserIds = (value: string[]) => {
    const unique = new Set<string>();
    for (const item of value) {
      if (typeof item !== "string") {
        continue;
      }
      const trimmed = item.trim();
      if (!trimmed) {
        continue;
      }
      unique.add(trimmed);
    }
    return [...unique];
  };

  if (
    !userId ||
    !isValidVisibility(lastSeenVisibility) ||
    !isValidVisibility(avatarVisibility) ||
    !isValidVisibility(bioVisibility)
  ) {
    return NextResponse.json({ error: "Missing privacy fields." }, { status: 400 });
  }

  try {
    const updated = await updateStore<StoredUser>((store) => {
      const target = store.users.find((candidate) => candidate.id === userId);
      if (!target) {
        throw new Error("User not found.");
      }
      target.lastSeenVisibility = lastSeenVisibility;
      target.avatarVisibility = avatarVisibility;
      target.bioVisibility = bioVisibility;
      target.lastSeenAllowedUserIds = sanitizeAllowedUserIds(lastSeenAllowedUserIds);
      target.avatarAllowedUserIds = sanitizeAllowedUserIds(avatarAllowedUserIds);
      target.bioAllowedUserIds = sanitizeAllowedUserIds(bioAllowedUserIds);
      target.showLastSeen = lastSeenVisibility !== "nobody";
      return target;
    });

    return NextResponse.json({ user: toPublicUser(updated) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save privacy.";
    const status = message === "User not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
