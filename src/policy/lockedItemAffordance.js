export const LOCKED_ITEM_AFFORDANCE_VERSION = "2026.07.24";

function wholeNonNegative(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
}

function currencyLabel(amount, currency) {
  const singular = String(currency?.singular || "coin").trim() || "coin";
  const plural = String(currency?.plural || `${singular}s`).trim() || `${singular}s`;
  return amount === 1 ? singular : plural;
}

export function lockedItemAffordance({
  cost,
  balance,
  currency = { singular: "coin", plural: "coins" }
} = {}) {
  const safeCost = wholeNonNegative(cost);
  const safeBalance = wholeNonNegative(balance);
  const shortfall = Math.max(0, safeCost - safeBalance);
  const priceText = `${safeCost} ${currencyLabel(safeCost, currency)}`;

  return Object.freeze({
    version: LOCKED_ITEM_AFFORDANCE_VERSION,
    cost: safeCost,
    balance: safeBalance,
    shortfall,
    locked: shortfall > 0,
    priceText,
    text: shortfall > 0 ? `${priceText} — earn ${shortfall} more` : priceText
  });
}
