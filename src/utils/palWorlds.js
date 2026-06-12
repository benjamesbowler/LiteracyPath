// Literacy Pals world themes. Each child-facing surface carries a
// data-pal-world attribute; these helpers decide which world applies.
export const PAL_WORLDS = {
  meadow: {
    id: "meadow",
    name: "Meadow Pals",
    accent: "#4E8C44",
    accentSoft: "#EAF4E6",
    deep: "#35652E",
    banner: "/images/pals/meadow-panorama.webp",
    emblem: "/images/pals/meadow-emblem.webp",
    cheer: "/images/pals/meadow-cheer.webp",
    point: "/images/pals/meadow-point.webp"
  },
  dino: {
    id: "dino",
    name: "Dino Pals",
    accent: "#C2702A",
    accentSoft: "#FBEFE2",
    deep: "#92511B",
    banner: "/images/pals/dino-panorama.webp",
    emblem: "/images/pals/dino-emblem.webp",
    cheer: "/images/pals/dino-cheer.webp",
    point: "/images/pals/dino-point.webp"
  },
  moonwood: {
    id: "moonwood",
    name: "Moonwood",
    accent: "#5E4D9C",
    accentSoft: "#EFEBFA",
    deep: "#443678",
    banner: "/images/pals/moonwood-panorama.webp",
    emblem: "/images/pals/moonwood-emblem.webp",
    cheer: "/images/pals/moonwood-cheer.webp",
    point: "/images/pals/moonwood-point.webp"
  }
};

export function worldForDifficulty(difficulty) {
  if (difficulty === "hard") return PAL_WORLDS.moonwood;
  if (difficulty === "medium") return PAL_WORLDS.dino;
  return PAL_WORLDS.meadow;
}

export function worldForCycle(cycleNumber) {
  if (cycleNumber >= 19) return PAL_WORLDS.moonwood;
  if (cycleNumber >= 10) return PAL_WORLDS.dino;
  return PAL_WORLDS.meadow;
}

export function worldForLevel(level) {
  const normalized = String(level || "A").toUpperCase();
  if (normalized >= "C") return PAL_WORLDS.moonwood;
  if (normalized === "B") return PAL_WORLDS.dino;
  return PAL_WORLDS.meadow;
}

export function worldStyle(world) {
  return {
    "--pal-accent": world.accent,
    "--pal-accent-soft": world.accentSoft,
    "--pal-deep": world.deep
  };
}

// World for a student based on their quest progress (cycle band).
export function worldForScope(scope) {
  if (typeof window === "undefined") return PAL_WORLDS.meadow;
  try {
    const quest = JSON.parse(window.localStorage.getItem(`lp-el-quest:${scope || "default"}`) || "null");
    const done = Object.values(quest?.cycles || {}).filter(item => item?.stars > 0).length;
    return worldForCycle(done + 1);
  } catch {
    return PAL_WORLDS.meadow;
  }
}
