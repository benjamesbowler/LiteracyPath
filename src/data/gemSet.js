// Collectible gem definitions shared across the app.
export const GEM_SET = [
  { id: "gem-teal", name: "Tide Gem", color: "teal" },
  { id: "gem-amber", name: "Ember Gem", color: "amber" },
  { id: "gem-violet", name: "Storm Gem", color: "violet" },
  { id: "gem-blue", name: "Sky Gem", color: "blue" },
  { id: "gem-rose", name: "Dawn Gem", color: "rose" },
  { id: "gem-emerald", name: "Forest Gem", color: "emerald" }
];

export function gemForIndex(index) {
  return GEM_SET[Math.abs(index) % GEM_SET.length];
}
