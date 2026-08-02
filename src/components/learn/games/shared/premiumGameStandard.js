// Small, reusable implementation rules for visually intensive games. The
// canonical product standard lives in docs/design/GAME_DESIGN_BIBLE.md; this
// module only contains behaviour that runtime games need to share.

const TIER_BUDGETS = Object.freeze({
  low: Object.freeze({ setpieceKinds: 0, setpieceCopies: 0 }),
  medium: Object.freeze({ setpieceKinds: 4, setpieceCopies: 14 }),
  high: Object.freeze({ setpieceKinds: 6, setpieceCopies: 22 })
});

export function premiumSetpieceBudget(tier) {
  return TIER_BUDGETS[tier] || TIER_BUDGETS.medium;
}

export function hasCompletePremiumSetpieceSet(loadedCount, budget) {
  const required = Number(budget?.setpieceCopies) || 0;
  return required > 0 && Number(loadedCount) === required;
}

export function laneDirectionForKey(key) {
  if (key === "ArrowLeft" || String(key).toLowerCase() === "a") return -1;
  if (key === "ArrowRight" || String(key).toLowerCase() === "d") return 1;
  return 0;
}
