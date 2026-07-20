// Den reward constants. Real progress lives in the derived treasury
// (treasureTrail.js) - nothing here is stored per-child.

// Den backdrops the child unlocks with lifetime gems, then picks freely.
export const DEN_THEMES = [
  { id: "meadow", name: "Meadow Farm", at: 0, art: "/images/pals/meadow-panorama.webp" },
  { id: "dino", name: "Dinosaur Valley", at: 20, art: "/images/pals/dino-panorama.webp" },
  { id: "moonwood", name: "Moonwood Forest", at: 45, art: "/images/pals/moonwood-panorama.webp" }
];

export function isDenThemeUnlocked(theme, lifetimeGems = 0) {
  return Boolean(theme) && Math.max(0, Number(lifetimeGems) || 0) >= Math.max(0, Number(theme.at) || 0);
}
