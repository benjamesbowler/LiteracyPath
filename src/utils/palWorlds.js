// Literacy Pals world themes. Each child-facing surface carries a
// data-pal-world attribute; these helpers decide which world applies.
export const PAL_WORLDS = {
  meadow: {
    id: "meadow",
    name: "Meadow Pals",
    accent: "#4E8C44",
    accentSoft: "#EAF4E6",
    deep: "#35652E",
    banner: "/images/pals/meadow-panorama.png",
    fallbackBanner: "/guided-reading/series/meadow-pals/book-01/cover.webp"
  },
  dino: {
    id: "dino",
    name: "Dino Pals",
    accent: "#C2702A",
    accentSoft: "#FBEFE2",
    deep: "#92511B",
    banner: "/images/pals/dino-panorama.png",
    fallbackBanner: "/guided-reading/series/dino-pals/book-01/cover.webp"
  },
  moonwood: {
    id: "moonwood",
    name: "Moonwood",
    accent: "#5E4D9C",
    accentSoft: "#EFEBFA",
    deep: "#443678",
    banner: "/images/pals/moonwood-panorama.png",
    fallbackBanner: "/guided-reading/series/moonwood-tales/book-01/cover.webp"
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
