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
    description: "Icy polished ring with a glassy highlight.",
  },
  {
    id: "sunset-flare",
    label: "Sunset Flare",
    description: "Hot orange-pink gradient with a warm bloom.",
  },
  {
    id: "starlight-halo",
    label: "Starlight Halo",
    description: "Cool silver-blue ring with a cosmic shimmer.",
  },
  {
    id: "emerald-pulse",
    label: "Emerald Pulse",
    description: "Fresh green ring with a vivid energetic edge.",
  },
  {
    id: "rose-glow",
    label: "Rose Glow",
    description: "Soft rose ring with a glossy candy highlight.",
  },
  {
    id: "arctic-bloom",
    label: "Arctic Bloom",
    description: "Frosted cyan ring with a light polar glow.",
  },
  {
    id: "solar-crown",
    label: "Solar Crown",
    description: "Bright amber ring with a radiant core highlight.",
  },
  {
    id: "midnight-orbit",
    label: "Midnight Orbit",
    description: "Deep navy ring with subtle orbital contrast.",
  },
  {
    id: "violet-comet",
    label: "Violet Comet",
    description: "Vivid violet ring with a comet-like sheen.",
  },
  {
    id: "mint-luxe",
    label: "Mint Luxe",
    description: "Soft mint ring with a premium pearlescent finish.",
  },
  {
    id: "ruby-flare",
    label: "Ruby Flare",
    description: "Rich ruby ring with a bright reflective accent.",
  },
] as const;

export type AvatarDecorationId = (typeof AVATAR_DECORATION_OPTIONS)[number]["id"];

export function isAvatarDecorationId(value: string): value is AvatarDecorationId {
  return AVATAR_DECORATION_OPTIONS.some((option) => option.id === value);
}

export function getAvatarDecorationFrameClassName(decoration: AvatarDecorationId): string {
  if (decoration === "none") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[linear-gradient(145deg,rgba(63,63,70,0.92),rgba(24,24,27,0.98))] before:shadow-[0_10px_24px_-18px_rgba(0,0,0,0.9)]";
  }
  if (decoration === "golden-aura") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[conic-gradient(from_200deg,#faf7f2,#efe3cf,#c7ab82,#8f7553,#faf7f2)] before:shadow-[0_12px_28px_-18px_rgba(143,117,83,0.34)]";
  }
  if (decoration === "neon-ring") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[conic-gradient(from_190deg,#101114,#1d2330,#2d4e74,#4bd5ff,#101114)] before:shadow-[0_12px_28px_-18px_rgba(34,74,123,0.42)]";
  }
  if (decoration === "crystal-frame") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[linear-gradient(135deg,#fbfdff_0%,#eef2f6_28%,#cfd7df_58%,#f6f8fb_100%)] before:shadow-[0_12px_26px_-18px_rgba(148,163,184,0.28)]";
  }
  if (decoration === "sunset-flare") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[conic-gradient(from_210deg,#ffedd5,#fb923c,#f97316,#ec4899,#ffedd5)] before:shadow-[0_12px_28px_-18px_rgba(249,115,22,0.34)]";
  }
  if (decoration === "starlight-halo") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[conic-gradient(from_180deg,#fcfdff,#e9edf2,#c7d0da,#eef2f6,#fcfdff)] before:shadow-[0_12px_24px_-18px_rgba(148,163,184,0.24)]";
  }
  if (decoration === "emerald-pulse") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[conic-gradient(from_205deg,#06281d,#0f766e,#10b981,#6ee7b7,#06281d)] before:shadow-[0_12px_28px_-18px_rgba(16,185,129,0.34)]";
  }
  if (decoration === "rose-glow") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[conic-gradient(from_210deg,#231b20,#5a4a52,#8d747d,#d4c1c6,#231b20)] before:shadow-[0_12px_28px_-18px_rgba(90,74,82,0.34)]";
  }
  if (decoration === "arctic-bloom") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[conic-gradient(from_180deg,#ecfeff,#a5f3fc,#67e8f9,#c4b5fd,#ecfeff)] before:shadow-[0_12px_28px_-18px_rgba(103,232,249,0.3)]";
  }
  if (decoration === "solar-crown") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[conic-gradient(from_180deg,#fff7ed,#fcd34d,#f59e0b,#f97316,#fff7ed)] before:shadow-[0_12px_28px_-18px_rgba(245,158,11,0.34)]";
  }
  if (decoration === "midnight-orbit") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[conic-gradient(from_180deg,#020617,#0f172a,#1d4ed8,#1e293b,#020617)] before:shadow-[0_12px_28px_-18px_rgba(30,64,175,0.34)]";
  }
  if (decoration === "violet-comet") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[conic-gradient(from_190deg,#2e1065,#6d28d9,#a855f7,#f0abfc,#2e1065)] before:shadow-[0_12px_28px_-18px_rgba(168,85,247,0.34)]";
  }
  if (decoration === "mint-luxe") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[conic-gradient(from_180deg,#f0fdf4,#bbf7d0,#6ee7b7,#99f6e4,#f0fdf4)] before:shadow-[0_12px_28px_-18px_rgba(110,231,183,0.3)]";
  }
  if (decoration === "ruby-flare") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[conic-gradient(from_200deg,#450a0a,#b91c1c,#ef4444,#fca5a5,#450a0a)] before:shadow-[0_12px_28px_-18px_rgba(239,68,68,0.34)]";
  }
  return "";
}

export function getAvatarDecorationSurfaceClassName(decoration: AvatarDecorationId): string {
  if (decoration === "none") {
    return "border-[3px] border-zinc-800 ring-1 ring-white/6 shadow-[0_10px_22px_-16px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.04)]";
  }
  if (decoration === "golden-aura") {
    return "border-[3px] border-[#f6efe6] ring-1 ring-[#d9c3a1]/45 shadow-[0_0_0_1px_rgba(199,171,130,0.2),0_14px_26px_-18px_rgba(143,117,83,0.28)]";
  }
  if (decoration === "neon-ring") {
    return "border-[3px] border-[#e0f2fe] ring-1 ring-[#38bdf8]/45 shadow-[0_0_0_1px_rgba(56,189,248,0.24),0_14px_28px_-18px_rgba(14,116,144,0.32)]";
  }
  if (decoration === "crystal-frame") {
    return "border-[3px] border-white/95 ring-1 ring-[#d6dde5]/45 shadow-[0_0_0_1px_rgba(226,232,240,0.28),0_14px_26px_-18px_rgba(148,163,184,0.24)]";
  }
  if (decoration === "sunset-flare") {
    return "border-[3px] border-[#ffedd5] ring-1 ring-[#fb923c]/40 shadow-[0_0_0_1px_rgba(249,115,22,0.2),0_14px_26px_-18px_rgba(236,72,153,0.28)]";
  }
  if (decoration === "starlight-halo") {
    return "border-[3px] border-[#f8fafc] ring-1 ring-[#d9e1e8]/40 shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_14px_24px_-18px_rgba(148,163,184,0.2)]";
  }
  if (decoration === "emerald-pulse") {
    return "border-[3px] border-[#ecfdf5] ring-1 ring-[#34d399]/40 shadow-[0_0_0_1px_rgba(16,185,129,0.22),0_14px_26px_-18px_rgba(5,150,105,0.28)]";
  }
  if (decoration === "rose-glow") {
    return "border-[3px] border-[#f3ecef] ring-1 ring-[#b89da7]/38 shadow-[0_0_0_1px_rgba(141,116,125,0.2),0_14px_26px_-18px_rgba(90,74,82,0.28)]";
  }
  if (decoration === "arctic-bloom") {
    return "border-[3px] border-[#ecfeff] ring-1 ring-[#67e8f9]/42 shadow-[0_0_0_1px_rgba(103,232,249,0.2),0_14px_26px_-18px_rgba(139,92,246,0.18)]";
  }
  if (decoration === "solar-crown") {
    return "border-[3px] border-[#fef3c7] ring-1 ring-[#f59e0b]/42 shadow-[0_0_0_1px_rgba(245,158,11,0.22),0_14px_26px_-18px_rgba(249,115,22,0.22)]";
  }
  if (decoration === "midnight-orbit") {
    return "border-[3px] border-[#dbeafe] ring-1 ring-[#60a5fa]/38 shadow-[0_0_0_1px_rgba(59,130,246,0.24),0_14px_26px_-18px_rgba(30,64,175,0.32)]";
  }
  if (decoration === "violet-comet") {
    return "border-[3px] border-[#f3e8ff] ring-1 ring-[#c084fc]/42 shadow-[0_0_0_1px_rgba(168,85,247,0.24),0_14px_26px_-18px_rgba(109,40,217,0.28)]";
  }
  if (decoration === "mint-luxe") {
    return "border-[3px] border-[#ecfdf5] ring-1 ring-[#6ee7b7]/40 shadow-[0_0_0_1px_rgba(110,231,183,0.22),0_14px_26px_-18px_rgba(45,212,191,0.22)]";
  }
  if (decoration === "ruby-flare") {
    return "border-[3px] border-[#fee2e2] ring-1 ring-[#f87171]/42 shadow-[0_0_0_1px_rgba(239,68,68,0.24),0_14px_26px_-18px_rgba(185,28,28,0.28)]";
  }
  return "";
}

export function getAvatarDecorationOverlayClassName(decoration: AvatarDecorationId): string {
  if (decoration === "none") {
    return "after:pointer-events-none after:absolute after:inset-[7%] after:rounded-full after:content-[''] after:bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.1),rgba(255,255,255,0.02)_24%,transparent_48%)]";
  }
  if (decoration === "golden-aura") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-2 after:ring-[#fbf6ef]/70 after:bg-[radial-gradient(circle_at_28%_20%,rgba(255,248,240,0.09),transparent_36%)]";
  }
  if (decoration === "neon-ring") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-2 after:ring-[#e0f2fe]/65 after:bg-[conic-gradient(from_160deg,transparent,rgba(34,211,238,0.08),transparent,rgba(59,130,246,0.08),transparent)]";
  }
  if (decoration === "crystal-frame") {
    return "after:pointer-events-none after:absolute after:inset-[6%] after:rounded-full after:content-[''] after:ring-[1.5px] after:ring-white/70 after:bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_42%,rgba(226,232,240,0.09)_60%,transparent_80%)]";
  }
  if (decoration === "sunset-flare") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-2 after:ring-[#fff7ed]/65 after:bg-[radial-gradient(circle_at_30%_22%,rgba(255,237,213,0.09),transparent_32%),radial-gradient(circle_at_72%_78%,rgba(244,114,182,0.07),transparent_30%)]";
  }
  if (decoration === "starlight-halo") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-2 after:ring-white/75 after:bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.09),transparent_26%),radial-gradient(circle_at_70%_68%,rgba(199,208,218,0.04),transparent_28%)]";
  }
  if (decoration === "emerald-pulse") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-2 after:ring-[#ecfdf5]/65 after:bg-[linear-gradient(145deg,rgba(236,253,245,0.08),transparent_36%,rgba(52,211,153,0.08)_60%,transparent_84%)]";
  }
  if (decoration === "rose-glow") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-2 after:ring-[#f6eef1]/65 after:bg-[radial-gradient(circle_at_28%_20%,rgba(248,241,244,0.07),transparent_32%),radial-gradient(circle_at_75%_72%,rgba(212,193,198,0.05),transparent_30%)]";
  }
  if (decoration === "arctic-bloom") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-2 after:ring-[#ecfeff]/68 after:bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.1),transparent_30%),radial-gradient(circle_at_76%_74%,rgba(196,181,253,0.08),transparent_30%)]";
  }
  if (decoration === "solar-crown") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-2 after:ring-[#fef3c7]/68 after:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.11),transparent_28%),radial-gradient(circle_at_74%_76%,rgba(251,146,60,0.08),transparent_28%)]";
  }
  if (decoration === "midnight-orbit") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-2 after:ring-[#dbeafe]/62 after:bg-[conic-gradient(from_180deg,transparent,rgba(96,165,250,0.08),transparent,rgba(191,219,254,0.06),transparent)]";
  }
  if (decoration === "violet-comet") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-2 after:ring-[#f5d0fe]/62 after:bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.08),transparent_28%),conic-gradient(from_150deg,transparent,rgba(216,180,254,0.08),transparent)]";
  }
  if (decoration === "mint-luxe") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-2 after:ring-[#d1fae5]/62 after:bg-[linear-gradient(145deg,rgba(255,255,255,0.08),transparent_36%,rgba(153,246,228,0.07)_60%,transparent_84%)]";
  }
  if (decoration === "ruby-flare") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-2 after:ring-[#fee2e2]/62 after:bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_75%_74%,rgba(252,165,165,0.08),transparent_28%)]";
  }
  return "";
}
