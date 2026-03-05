import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import { updateStore } from "@/lib/server/store";

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { enabled?: boolean }
    | null;

  const userId = await requireAuth(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const enabled = body?.enabled === true;

  try {
    await updateStore<void>((store) => {
      const user = store.users.find((u) => u.id === userId);
      if (!user) throw new Error("User not found.");
      user.loginVerificationEnabled = enabled;
    });

    return NextResponse.json({ loginVerificationEnabled: enabled });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update setting.";
    return NextResponse.json({ error: message }, { status: message === "User not found." ? 404 : 400 });
  }
}
