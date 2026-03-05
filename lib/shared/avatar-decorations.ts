export const AVATAR_DECORATION_OPTIONS = [
  {
    id: "none",
    label: "None",
    description: "Clean avatar without any frame.",
  },
  {
    id: "titanium",
    label: "Titanium",
    description: "Aerospace-grade alloy with a cool anisotropic sheen.",
  },
  {
    id: "obsidian",
    label: "Obsidian",
    description: "Volcanic glass with deep crystalline purple depth.",
  },
  {
    id: "carbon-fiber",
    label: "Carbon Fiber",
    description: "High-strength composite with a tight dark weave.",
  },
  {
    id: "gunmetal",
    label: "Gunmetal",
    description: "Military-grade alloy, cold dark and matte.",
  },
  {
    id: "platinum",
    label: "Platinum",
    description: "Rare precious metal with a bright polished finish.",
  },
  {
    id: "bronze",
    label: "Bronze",
    description: "Ancient warrior alloy, warm reddish-brown patina.",
  },
  {
    id: "tungsten",
    label: "Tungsten",
    description: "Densest natural metal, cold dark and heavy.",
  },
  {
    id: "cobalt",
    label: "Cobalt",
    description: "Deep industrial blue-gray with magnetic intensity.",
  },
  {
    id: "damascus",
    label: "Damascus Steel",
    description: "Pattern-welded layers of dark and light steel.",
  },
  {
    id: "graphite",
    label: "Graphite",
    description: "Pure carbon in its flattest, most matte form.",
  },
  {
    id: "onyx",
    label: "Onyx",
    description: "Polished black gemstone with a glassy mirror surface.",
  },
  {
    id: "mercury",
    label: "Mercury",
    description: "Liquid silver metal with a mirrored flowing surface.",
  },
  {
    id: "deep-space",
    label: "Deep Space",
    description: "The absolute void between stars, infinite black.",
  },
  {
    id: "meteorite",
    label: "Meteorite",
    description: "Iron-nickel alloy with slowly rotating Widmanstätten bands.",
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
  if (decoration === "titanium") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[linear-gradient(145deg,#7a8fa8_0%,#b8cad8_22%,#dce8f0_44%,#a4b8c8_66%,#68808e_100%)] before:shadow-[0_12px_28px_-18px_rgba(148,180,200,0.3)]";
  }
  if (decoration === "obsidian") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[conic-gradient(from_200deg,#0a0812,#1c1228,#3a1f5e,#1a1025,#0a0812)] before:shadow-[0_12px_28px_-18px_rgba(60,30,100,0.55)]";
  }
  if (decoration === "carbon-fiber") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[linear-gradient(135deg,#181818_0%,#2e2e2e_20%,#141414_40%,#272727_60%,#181818_80%,#1d1d1d_100%)] before:shadow-[0_12px_28px_-18px_rgba(0,0,0,0.9)]";
  }
  if (decoration === "gunmetal") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[linear-gradient(145deg,#222830_0%,#363e48_35%,#2a3038_65%,#1c2028_100%)] before:shadow-[0_12px_28px_-18px_rgba(20,30,45,0.75)]";
  }
  if (decoration === "platinum") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[linear-gradient(145deg,#d0dae4_0%,#ecf2f8_30%,#ffffff_55%,#dae2ea_75%,#c0cad4_100%)] before:shadow-[0_12px_26px_-18px_rgba(180,192,204,0.35)]";
  }
  if (decoration === "bronze") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[conic-gradient(from_205deg,#1c0e04,#6b3a14,#b07030,#cc8840,#1c0e04)] before:shadow-[0_12px_28px_-18px_rgba(176,112,48,0.4)]";
  }
  if (decoration === "tungsten") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[linear-gradient(145deg,#1a1c20_0%,#32353c_30%,#262a30_60%,#12141a_100%)] before:shadow-[0_12px_28px_-18px_rgba(0,0,0,0.95)]";
  }
  if (decoration === "cobalt") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[conic-gradient(from_195deg,#060c20,#112048,#1c3a8a,#162e7a,#060c20)] before:shadow-[0_12px_28px_-18px_rgba(28,58,138,0.5)]";
  }
  if (decoration === "damascus") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[conic-gradient(from_180deg,#242424,#484848,#1a1a1a,#565656,#242424,#383838,#1c1c1c)] before:shadow-[0_12px_28px_-18px_rgba(0,0,0,0.8)]";
  }
  if (decoration === "graphite") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[linear-gradient(150deg,#1e1e1e_0%,#2c2c2c_50%,#1e1e1e_100%)] before:shadow-[0_12px_28px_-18px_rgba(0,0,0,0.88)]";
  }
  if (decoration === "onyx") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[linear-gradient(145deg,#0a0a0a_0%,#1c1c1c_30%,#0e0e0e_55%,#161616_75%,#080808_100%)] before:shadow-[0_12px_28px_-18px_rgba(0,0,0,0.98)]";
  }
  if (decoration === "mercury") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[linear-gradient(145deg,#a0a8b0_0%,#d0d8e0_25%,#f0f4f8_50%,#b8c0c8_75%,#8890a0_100%)] before:shadow-[0_12px_28px_-18px_rgba(160,172,184,0.3)]";
  }
  if (decoration === "deep-space") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[radial-gradient(ellipse_at_35%_25%,rgba(20,10,35,0.95),transparent_50%),linear-gradient(145deg,#060410,#0c0818,#060410)] before:shadow-[0_12px_28px_-18px_rgba(0,0,0,1)]";
  }
  if (decoration === "meteorite") {
    return "before:absolute before:-inset-1.5 before:rounded-full before:content-[''] before:bg-[conic-gradient(from_0deg,#b2b0a6,#e2dece,#726a58,#cac6b4,#3e3c34,#d4cebe,#8a8272,#e6e2d2,#52504a,#bcb8a8,#b2b0a6)] before:shadow-[0_12px_28px_-18px_rgba(120,110,80,0.45)] before:[animation:meteorite-rotate_16s_linear_infinite]";
  }
  return "";
}

export function getAvatarDecorationSurfaceClassName(decoration: AvatarDecorationId): string {
  if (decoration === "none") {
    return "border-[3px] border-zinc-800 ring-1 ring-white/6 shadow-[0_10px_22px_-16px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.04)]";
  }
  if (decoration === "titanium") {
    return "border-[3px] border-[#c8d8e4] ring-1 ring-[#a4b8c8]/45 shadow-[0_0_0_1px_rgba(148,180,200,0.22),0_14px_26px_-18px_rgba(104,128,142,0.3)]";
  }
  if (decoration === "obsidian") {
    return "border-[3px] border-[#2d1f4a] ring-1 ring-[#6040a0]/30 shadow-[0_0_0_1px_rgba(60,30,100,0.3),0_14px_28px_-18px_rgba(20,10,50,0.5)]";
  }
  if (decoration === "carbon-fiber") {
    return "border-[3px] border-[#2a2a2a] ring-1 ring-[#404040]/30 shadow-[0_0_0_1px_rgba(40,40,40,0.5),0_14px_28px_-18px_rgba(0,0,0,0.9)]";
  }
  if (decoration === "gunmetal") {
    return "border-[3px] border-[#3a424c] ring-1 ring-[#5a6270]/30 shadow-[0_0_0_1px_rgba(34,40,48,0.5),0_14px_28px_-18px_rgba(20,30,45,0.7)]";
  }
  if (decoration === "platinum") {
    return "border-[3px] border-[#eef3f8] ring-1 ring-[#c8d4de]/55 shadow-[0_0_0_1px_rgba(200,212,222,0.35),0_14px_26px_-18px_rgba(160,176,188,0.28)]";
  }
  if (decoration === "bronze") {
    return "border-[3px] border-[#c08040] ring-1 ring-[#b07030]/40 shadow-[0_0_0_1px_rgba(176,112,48,0.25),0_14px_26px_-18px_rgba(108,60,20,0.35)]";
  }
  if (decoration === "tungsten") {
    return "border-[3px] border-[#363a42] ring-1 ring-[#4a4e56]/28 shadow-[0_0_0_1px_rgba(26,28,32,0.6),0_14px_28px_-18px_rgba(0,0,0,0.95)]";
  }
  if (decoration === "cobalt") {
    return "border-[3px] border-[#1c3a90] ring-1 ring-[#3060c8]/38 shadow-[0_0_0_1px_rgba(28,58,144,0.3),0_14px_28px_-18px_rgba(6,12,32,0.55)]";
  }
  if (decoration === "damascus") {
    return "border-[3px] border-[#3e3e3e] ring-1 ring-[#585858]/30 shadow-[0_0_0_1px_rgba(36,36,36,0.55),0_14px_28px_-18px_rgba(0,0,0,0.82)]";
  }
  if (decoration === "graphite") {
    return "border-[3px] border-[#282828] ring-1 ring-[#3a3a3a]/25 shadow-[0_0_0_1px_rgba(20,20,20,0.5),0_14px_28px_-18px_rgba(0,0,0,0.88)]";
  }
  if (decoration === "onyx") {
    return "border-[3px] border-[#141414] ring-1 ring-[#282828]/30 shadow-[0_0_0_1px_rgba(8,8,8,0.7),0_14px_28px_-18px_rgba(0,0,0,1)]";
  }
  if (decoration === "mercury") {
    return "border-[3px] border-[#d8e0e8] ring-1 ring-[#b0bcc8]/45 shadow-[0_0_0_1px_rgba(160,172,184,0.28),0_14px_26px_-18px_rgba(120,136,152,0.28)]";
  }
  if (decoration === "deep-space") {
    return "border-[3px] border-[#100820] ring-1 ring-[#30186a]/18 shadow-[0_0_0_1px_rgba(6,4,16,0.9),0_14px_28px_-18px_rgba(0,0,0,1)]";
  }
  if (decoration === "meteorite") {
    return "border-[3px] border-[#d0ccba] ring-1 ring-[#b0a888]/40 shadow-[0_0_0_1px_rgba(160,150,120,0.25),0_14px_26px_-18px_rgba(80,72,52,0.38)]";
  }
  return "";
}

export function getAvatarDecorationOverlayClassName(decoration: AvatarDecorationId): string {
  if (decoration === "none") {
    return "after:pointer-events-none after:absolute after:inset-[7%] after:rounded-full after:content-[''] after:bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.1),rgba(255,255,255,0.02)_24%,transparent_48%)]";
  }
  if (decoration === "titanium") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-[1.5px] after:ring-white/20 after:bg-[linear-gradient(135deg,rgba(255,255,255,0.1)_0%,transparent_40%,rgba(180,200,215,0.06)_70%,transparent_90%)]";
  }
  if (decoration === "obsidian") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-[1px] after:ring-[#a080e0]/18 after:bg-[radial-gradient(circle_at_28%_20%,rgba(180,140,240,0.07),transparent_32%),radial-gradient(circle_at_75%_75%,rgba(60,30,100,0.06),transparent_28%)]";
  }
  if (decoration === "carbon-fiber") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:bg-[linear-gradient(145deg,rgba(255,255,255,0.04)_0%,transparent_35%,rgba(60,60,60,0.04)_65%,transparent_85%)]";
  }
  if (decoration === "gunmetal") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-[1px] after:ring-white/6 after:bg-[linear-gradient(145deg,rgba(255,255,255,0.06)_0%,transparent_40%,rgba(90,98,110,0.04)_70%,transparent_90%)]";
  }
  if (decoration === "platinum") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-2 after:ring-white/65 after:bg-[radial-gradient(circle_at_26%_20%,rgba(255,255,255,0.14),transparent_28%),radial-gradient(circle_at_74%_76%,rgba(210,220,230,0.06),transparent_26%)]";
  }
  if (decoration === "bronze") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-[1.5px] after:ring-[#f0c880]/30 after:bg-[radial-gradient(circle_at_28%_20%,rgba(240,200,128,0.08),transparent_30%),radial-gradient(circle_at_74%_74%,rgba(108,60,20,0.06),transparent_28%)]";
  }
  if (decoration === "tungsten") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:bg-[linear-gradient(145deg,rgba(255,255,255,0.04)_0%,transparent_30%,rgba(50,53,60,0.05)_65%,transparent_88%)]";
  }
  if (decoration === "cobalt") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-[1.5px] after:ring-[#80a8ff]/22 after:bg-[conic-gradient(from_180deg,transparent,rgba(80,120,220,0.07),transparent,rgba(100,150,240,0.06),transparent)]";
  }
  if (decoration === "damascus") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-[1px] after:ring-white/8 after:bg-[conic-gradient(from_175deg,transparent,rgba(100,100,100,0.07),transparent,rgba(50,50,50,0.05),transparent)]";
  }
  if (decoration === "graphite") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:bg-[linear-gradient(150deg,rgba(255,255,255,0.03)_0%,transparent_45%,rgba(30,30,30,0.04)_75%,transparent_92%)]";
  }
  if (decoration === "onyx") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-[1.5px] after:ring-white/12 after:bg-[radial-gradient(circle_at_26%_18%,rgba(255,255,255,0.1),transparent_26%),radial-gradient(circle_at_76%_78%,rgba(255,255,255,0.03),transparent_22%)]";
  }
  if (decoration === "mercury") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-2 after:ring-white/35 after:bg-[linear-gradient(135deg,rgba(255,255,255,0.14)_0%,rgba(200,210,220,0.06)_30%,transparent_55%,rgba(180,192,204,0.05)_80%,transparent_95%)]";
  }
  if (decoration === "deep-space") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:bg-[radial-gradient(circle_at_30%_22%,rgba(120,80,200,0.06),transparent_28%),radial-gradient(circle_at_72%_74%,rgba(80,40,160,0.04),transparent_26%)]";
  }
  if (decoration === "meteorite") {
    return "after:pointer-events-none after:absolute after:inset-[5%] after:rounded-full after:content-[''] after:ring-[1.5px] after:ring-[#e6e0cc]/25 after:bg-[radial-gradient(circle_at_28%_20%,rgba(240,236,210,0.1),transparent_30%),radial-gradient(circle_at_74%_74%,rgba(80,72,52,0.08),transparent_28%)]";
  }
  return "";
}
