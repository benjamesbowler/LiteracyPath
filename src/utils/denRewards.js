// Den reward helpers shared by the Rewards page and the home-page pop-up.
// Pure localStorage UI state ("has the child SEEN this prize yet"), never
// synced - real progress lives in the derived treasury (treasureTrail.js).

// Den backdrops the child unlocks with lifetime gems, then picks freely.
export const DEN_THEMES = [
  { id: "meadow", name: "Meadow Farm", at: 0, art: "/images/pals/meadow-panorama.webp" },
  { id: "dino", name: "Dinosaur Valley", at: 20, art: "/images/pals/dino-panorama.webp" },
  { id: "moonwood", name: "Moonwood Forest", at: 45, art: "/images/pals/moonwood-panorama.webp" }
];

const SEEN_KEY_PREFIX = "lp-den-seen:";

export function denSeenKey(scope) {
  return `${SEEN_KEY_PREFIX}${scope || "default"}`;
}

// Returns rewards earned since the child last visited the den (for the home
// page "You earned ...!" pop-up). Pure localStorage UI state, never synced.
export function newRewardsSinceLastVisit(scope, treasury) {
  if (typeof window === "undefined") return [];
  try {
    const seen = JSON.parse(window.localStorage.getItem(denSeenKey(scope)) || "null") || { treasures: [], badges: [] };
    const fresh = [];
    for (const item of treasury.treasures) {
      if (!seen.treasures.includes(item.id)) fresh.push({ kind: "treasure", label: item.name, icon: item.icon });
    }
    for (const badge of treasury.badges) {
      if (!seen.badges.includes(badge.id)) fresh.push({ kind: "badge", label: `${badge.name} badge`, icon: "🏅" });
    }
    return fresh;
  } catch {
    return [];
  }
}

export function markRewardsSeen(scope, treasury) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(denSeenKey(scope), JSON.stringify({
      treasures: treasury.treasures.map(item => item.id),
      badges: treasury.badges.map(badge => badge.id)
    }));
  } catch { /* best effort */ }
}

