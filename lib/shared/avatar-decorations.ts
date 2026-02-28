export const AVATAR_DECORATION_OPTIONS = [
  {
    id: "none",
    label: "None",
    description: "Clean avatar without extra effects.",
  },
  {
    id: "golden-aura",
    label: "Golden Aura",
    description: "Warm premium glow with a gold ring.",
  },
  {
    id: "neon-ring",
    label: "Neon Ring",
    description: "Bright cyber ring with electric color shifts.",
  },
  {
    id: "crystal-frame",
    label: "Crystal Frame",
    description: "Icy polished frame with a soft glass shine.",
  },
  {
    id: "sunset-flare",
    label: "Sunset Flare",
    description: "Hot orange-pink gradient with a soft sunset bloom.",
  },
  {
    id: "starlight-halo",
    label: "Starlight Halo",
    description: "Cool silver-blue ring with a subtle cosmic glow.",
  },
  {
    id: "emerald-pulse",
    label: "Emerald Pulse",
    description: "Fresh green frame with a vivid energetic edge.",
  },
  {
    id: "rose-glow",
    label: "Rose Glow",
    description: "Soft rose frame with a glossy candy highlight.",
  },
] as const;

export type AvatarDecorationId = (typeof AVATAR_DECORATION_OPTIONS)[number]["id"];

export function isAvatarDecorationId(value: string): value is AvatarDecorationId {
  return AVATAR_DECORATION_OPTIONS.some((option) => option.id === value);
}

export function getAvatarDecorationFrameClassName(decoration: AvatarDecorationId): string {
  if (decoration === "none") {
    return "before:absolute before:-inset-2 before:rounded-full before:content-[''] before:bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.12),rgba(39,39,42,0.92)_42%,rgba(9,9,11,0.98)_100%)] before:shadow-[0_18px_44px_-28px_rgba(0,0,0,0.9)]";
  }
  if (decoration === "golden-aura") {
    return "before:absolute before:-inset-2 before:rounded-full before:content-[''] before:bg-[conic-gradient(from_210deg,#fff7ed,#f59e0b,#fde68a,#f59e0b,#fff7ed)] before:opacity-95 before:shadow-[0_0_18px_rgba(251,191,36,0.35),0_0_44px_rgba(251,191,36,0.48)]";
  }
  if (decoration === "neon-ring") {
    return "before:absolute before:-inset-2 before:rounded-full before:content-[''] before:bg-[conic-gradient(from_180deg,#22d3ee,#38bdf8,#6366f1,#a855f7,#22d3ee)] before:shadow-[0_0_18px_rgba(34,211,238,0.3),0_0_48px_rgba(34,211,238,0.45)] before:[filter:saturate(1.35)]";
  }
  if (decoration === "crystal-frame") {
    return "before:absolute before:-inset-2 before:rotate-45 before:rounded-[32%] before:content-[''] before:bg-[linear-gradient(135deg,#ffffff_0%,#dbeafe_32%,#93c5fd_55%,#c4b5fd_78%,#ffffff_100%)] before:shadow-[0_0_16px_rgba(191,219,254,0.26),0_0_36px_rgba(191,219,254,0.35)]";
  }
  if (decoration === "sunset-flare") {
    return "before:absolute before:-inset-2 before:rounded-full before:content-[''] before:bg-[radial-gradient(circle_at_28%_30%,#fde68a_0%,#fb923c_26%,#fb7185_62%,#7c2d12_100%)] before:shadow-[0_0_16px_rgba(251,146,60,0.26),0_0_44px_rgba(249,115,22,0.4)]";
  }
  if (decoration === "starlight-halo") {
    return "before:absolute before:-inset-2 before:rounded-full before:content-[''] before:bg-[conic-gradient(from_200deg,#ffffff,#e2e8f0,#93c5fd,#ffffff,#cbd5e1,#ffffff)] before:shadow-[0_0_14px_rgba(255,255,255,0.24),0_0_40px_rgba(226,232,240,0.36)] before:[box-shadow:0_0_0_2px_rgba(255,255,255,0.22),0_0_40px_rgba(226,232,240,0.36)]";
  }
  if (decoration === "emerald-pulse") {
    return "before:absolute before:-inset-2 before:rotate-12 before:rounded-[38%] before:content-[''] before:bg-[conic-gradient(from_210deg,#d1fae5,#34d399,#10b981,#065f46,#d1fae5)] before:shadow-[0_0_18px_rgba(52,211,153,0.24),0_0_42px_rgba(16,185,129,0.34)]";
  }
  if (decoration === "rose-glow") {
    return "before:absolute before:-inset-2 before:rounded-full before:content-[''] before:bg-[conic-gradient(from_210deg,#fdf2f8,#f9a8d4,#fb7185,#ec4899,#fdf2f8)] before:shadow-[0_0_18px_rgba(244,114,182,0.24),0_0_42px_rgba(244,114,182,0.38)]";
  }
  return "";
}

export function getAvatarDecorationSurfaceClassName(decoration: AvatarDecorationId): string {
  if (decoration === "none") {
    return "border-[3px] border-zinc-800 ring-1 ring-white/5 shadow-[0_12px_30px_-20px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.06)]";
  }
  if (decoration === "golden-aura") {
    return "border-[3px] border-amber-100/90 ring-2 ring-amber-300/35 shadow-[0_0_0_1px_rgba(251,191,36,0.25),0_16px_32px_-18px_rgba(251,191,36,0.5)]";
  }
  if (decoration === "neon-ring") {
    return "border-[3px] border-cyan-100/90 ring-2 ring-cyan-400/35 shadow-[0_0_0_1px_rgba(34,211,238,0.28),0_0_22px_rgba(34,211,238,0.24),0_16px_34px_-20px_rgba(79,70,229,0.5)]";
  }
  if (decoration === "crystal-frame") {
    return "border-[3px] border-white/90 ring-2 ring-sky-100/40 shadow-[0_0_0_1px_rgba(255,255,255,0.35),0_16px_36px_-20px_rgba(148,163,184,0.45)]";
  }
  if (decoration === "sunset-flare") {
    return "border-[3px] border-orange-100/85 ring-2 ring-orange-300/35 shadow-[0_0_0_1px_rgba(251,146,60,0.22),0_16px_34px_-18px_rgba(251,113,133,0.44)]";
  }
  if (decoration === "starlight-halo") {
    return "border-[3px] border-slate-50/90 ring-2 ring-sky-100/35 shadow-[0_0_0_1px_rgba(255,255,255,0.28),0_16px_34px_-20px_rgba(148,163,184,0.42)]";
  }
  if (decoration === "emerald-pulse") {
    return "border-[3px] border-emerald-100/85 ring-2 ring-emerald-300/35 shadow-[0_0_0_1px_rgba(52,211,153,0.2),0_16px_34px_-18px_rgba(16,185,129,0.42)]";
  }
  if (decoration === "rose-glow") {
    return "border-[3px] border-pink-100/90 ring-2 ring-pink-300/35 shadow-[0_0_0_1px_rgba(249,168,212,0.24),0_16px_34px_-18px_rgba(236,72,153,0.44)]";
  }
  return "";
}

export function getAvatarDecorationOverlayClassName(decoration: AvatarDecorationId): string {
  if (decoration === "none") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.16),rgba(255,255,255,0.03)_26%,transparent_50%)]";
  }
  if (decoration === "golden-aura") {
    return "after:pointer-events-none after:absolute after:inset-[3%] after:rounded-full after:content-[''] after:ring-[3px] after:ring-amber-100/90 after:bg-[radial-gradient(circle_at_28%_20%,rgba(255,251,235,0.26),transparent_38%)]";
  }
  if (decoration === "neon-ring") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-2 after:ring-cyan-200/90 after:bg-[conic-gradient(from_160deg,transparent,rgba(103,232,249,0.14),transparent,rgba(165,180,252,0.14),transparent)]";
  }
  if (decoration === "crystal-frame") {
    return "after:pointer-events-none after:absolute after:inset-[4%] after:rotate-45 after:rounded-[28%] after:content-[''] after:ring-2 after:ring-white/85 after:bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_38%,rgba(191,219,254,0.16)_58%,transparent_78%)]";
  }
  if (decoration === "sunset-flare") {
    return "after:pointer-events-none after:absolute after:inset-[4%] after:rounded-full after:content-[''] after:ring-2 after:ring-orange-100/85 after:bg-[radial-gradient(circle_at_30%_22%,rgba(255,237,213,0.22),transparent_34%),radial-gradient(circle_at_72%_78%,rgba(251,113,133,0.14),transparent_32%)]";
  }
  if (decoration === "starlight-halo") {
    return "after:pointer-events-none after:absolute after:inset-[4%] after:rounded-full after:content-[''] after:ring-2 after:ring-white/90 after:bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.22),transparent_28%),radial-gradient(circle_at_70%_68%,rgba(147,197,253,0.12),transparent_30%)]";
  }
  if (decoration === "emerald-pulse") {
    return "after:pointer-events-none after:absolute after:inset-[4%] after:rotate-12 after:rounded-[34%] after:content-[''] after:ring-2 after:ring-emerald-100/85 after:bg-[linear-gradient(145deg,rgba(236,253,245,0.18),transparent_34%,rgba(52,211,153,0.16)_62%,transparent_86%)]";
  }
  if (decoration === "rose-glow") {
    return "after:pointer-events-none after:absolute after:inset-[4%] after:rounded-full after:content-[''] after:ring-[3px] after:ring-pink-100/85 after:bg-[radial-gradient(circle_at_28%_20%,rgba(253,242,248,0.24),transparent_34%),radial-gradient(circle_at_75%_72%,rgba(244,114,182,0.14),transparent_32%)]";
  }
  return "";
}
