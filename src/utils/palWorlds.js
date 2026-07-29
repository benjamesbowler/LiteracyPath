// Little Literacy Guides world themes. Each child-facing surface carries a
// data-pal-world attribute; these helpers decide which world applies.
export const PAL_WORLDS = {
  meadow: {
    id: "meadow",
    name: "Meadow Pals",
    accent: "#4E8C44",
    accentSoft: "#EAF4E6",
    deep: "#35652E",
    banner: "/images/pals/meadow-panorama.webp",
    // A CLEAN backdrop: no characters painted into it, so a screen may place
    // its own pal on top without the art ending up with two of them. The
    // panorama above is NOT clean — it already has pals walking the path.
    backdrop: "/images/backdrops/activity-bg-meadow.webp",
    emblem: "/images/pals/meadow-emblem.webp",
    cheer: "/images/pals/meadow-cheer.webp",
    point: "/images/pals/meadow-point.webp",
    scenes: [
      "/guided-reading/series/meadow-pals/book-01/page-001.webp",
      "/guided-reading/series/meadow-pals/book-03/page-002.webp",
      "/guided-reading/series/meadow-pals/book-05/page-001.webp",
      "/guided-reading/series/meadow-pals/book-08/page-003.webp",
      "/guided-reading/series/meadow-pals/book-12/page-001.webp",
      "/guided-reading/series/meadow-pals/book-16/page-002.webp",
      "/guided-reading/series/meadow-pals/book-20/page-001.webp",
      "/guided-reading/series/meadow-pals/book-24/page-002.webp"
    ]
  },
  dino: {
    id: "dino",
    name: "Dino Pals",
    accent: "#C2702A",
    accentSoft: "#FBEFE2",
    deep: "#92511B",
    banner: "/images/pals/dino-panorama.webp",
    // A CLEAN backdrop: no characters painted into it, so a screen may place
    // its own pal on top without the art ending up with two of them. The
    // panorama above is NOT clean — it already has pals walking the path.
    backdrop: "/images/backdrops/activity-bg-dino.webp",
    emblem: "/images/pals/dino-emblem.webp",
    cheer: "/images/pals/dino-cheer.webp",
    point: "/images/pals/dino-point.webp",
    scenes: [
      "/guided-reading/series/dino-pals/book-01/page-001.webp",
      "/guided-reading/series/dino-pals/book-03/page-002.webp",
      "/guided-reading/series/dino-pals/book-05/page-001.webp",
      "/guided-reading/series/dino-pals/book-08/page-002.webp",
      "/guided-reading/series/dino-pals/book-11/page-001.webp",
      "/guided-reading/series/dino-pals/book-14/page-003.webp",
      "/guided-reading/series/dino-pals/book-17/page-001.webp",
      "/guided-reading/series/dino-pals/book-20/page-002.webp"
    ]
  },
  moonwood: {
    id: "moonwood",
    name: "Moonwood",
    accent: "#5E4D9C",
    accentSoft: "#EFEBFA",
    deep: "#443678",
    banner: "/images/pals/moonwood-panorama.webp",
    // A CLEAN backdrop: no characters painted into it, so a screen may place
    // its own pal on top without the art ending up with two of them. The
    // panorama above is NOT clean — it already has pals walking the path.
    backdrop: "/images/backdrops/activity-bg-moonwood.webp",
    emblem: "/images/pals/moonwood-emblem.webp",
    cheer: "/images/pals/moonwood-cheer.webp",
    point: "/images/pals/moonwood-point.webp",
    scenes: [
      "/guided-reading/series/moonwood-tales/book-01/page-001.webp",
      "/guided-reading/series/moonwood-tales/book-03/page-002.webp",
      "/guided-reading/series/moonwood-tales/book-06/page-001.webp",
      "/guided-reading/series/moonwood-tales/book-09/page-003.webp",
      "/guided-reading/series/moonwood-tales/book-12/page-001.webp",
      "/guided-reading/series/moonwood-tales/book-15/page-002.webp",
      "/guided-reading/series/moonwood-tales/book-19/page-001.webp",
      "/guided-reading/series/moonwood-tales/book-23/page-002.webp"
    ]
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

// Theme used by the poems + Present deck. This MUST match the quest map's
// 9-cycle land bands (worldForCycle) so a child standing in Dinosaur Valley
// never gets a Meadow poem: the poem, the deck and the map stop all belong
// to the same land. (Previously this rotated every 3 cycles, which put 18 of
// the 27 poems/decks in the wrong land.)
export function themeWorldForCycle(cycleNumber) {
  return worldForCycle(Math.max(1, Number(cycleNumber) || 1));
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

// Deterministic scene from the world's own book pages.
export function sceneForKey(world, key) {
  const scenes = world?.scenes || [];
  if (!scenes.length) return world?.banner || "";
  let hash = 0;
  const text = String(key || "");
  for (let index = 0; index < text.length; index += 1) hash = (hash * 31 + text.charCodeAt(index)) % 100000;
  return scenes[hash % scenes.length];
}
