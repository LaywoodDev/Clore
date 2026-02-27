const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

function parseBooleanFlag(rawValue: string | undefined): boolean {
  if (!rawValue) {
    return false;
  }
  return TRUE_VALUES.has(rawValue.trim().toLowerCase());
}

export const AI_FEATURE_ENABLED =
  parseBooleanFlag(process.env.NEXT_PUBLIC_CLORE_AI_ENABLED) ||
  parseBooleanFlag(process.env.CLORE_AI_ENABLED);
