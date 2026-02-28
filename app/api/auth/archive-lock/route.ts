import { NextResponse } from "next/server";

import { updateStore } from "@/lib/server/store";

type ArchiveLockPayload = {
  userId?: string;
  enabled?: boolean;
  passcode?: string;
  currentPasscode?: string;
  nextPasscode?: string;
};

type ArchiveUnlockPayload = {
  userId?: string;
  passcode?: string;
};

const MIN_ARCHIVE_PASSCODE_LENGTH = 4;

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as ArchiveLockPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const enabled = body?.enabled === true;
  const passcode = body?.passcode ?? "";
  const currentPasscode = body?.currentPasscode ?? "";
  const nextPasscode = body?.nextPasscode ?? "";

  if (!userId) {
    return NextResponse.json({ error: "Missing archive lock fields." }, { status: 400 });
  }

  try {
    const result = await updateStore<{ archiveLockEnabled: boolean }>((store) => {
      const user = store.users.find((candidate) => candidate.id === userId);
      if (!user) {
        throw new Error("User not found.");
      }

      if (!enabled) {
        user.archiveLockEnabled = false;
        user.archivePasscode = "";
      } else if (user.archiveLockEnabled === true && user.archivePasscode) {
        if (currentPasscode !== user.archivePasscode) {
          throw new Error("Current archive passcode is invalid.");
        }
        if (nextPasscode.trim().length < MIN_ARCHIVE_PASSCODE_LENGTH) {
          throw new Error(
            `Passcode must be at least ${MIN_ARCHIVE_PASSCODE_LENGTH} characters.`
          );
        }
        user.archiveLockEnabled = true;
        user.archivePasscode = nextPasscode;
      } else {
        if (passcode.trim().length < MIN_ARCHIVE_PASSCODE_LENGTH) {
          throw new Error(
            `Passcode must be at least ${MIN_ARCHIVE_PASSCODE_LENGTH} characters.`
          );
        }
        user.archiveLockEnabled = true;
        user.archivePasscode = passcode;
      }

      return {
        archiveLockEnabled: user.archiveLockEnabled === true,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update archive lock.";
    const status =
      message === "User not found."
        ? 404
        : message === "Current archive passcode is invalid."
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ArchiveUnlockPayload | null;
  const userId = body?.userId?.trim() ?? "";
  const passcode = body?.passcode ?? "";

  if (!userId || !passcode) {
    return NextResponse.json({ error: "Missing archive unlock fields." }, { status: 400 });
  }

  try {
    await updateStore<void>((store) => {
      const user = store.users.find((candidate) => candidate.id === userId);
      if (!user) {
        throw new Error("User not found.");
      }
      if (user.archiveLockEnabled !== true || !user.archivePasscode) {
        throw new Error("Archive lock is disabled.");
      }
      if (user.archivePasscode !== passcode) {
        throw new Error("Invalid archive passcode.");
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to unlock archive.";
    const status =
      message === "User not found."
        ? 404
        : message === "Invalid archive passcode."
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
