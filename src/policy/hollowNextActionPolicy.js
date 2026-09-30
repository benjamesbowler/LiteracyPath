export const HOLLOW_NEXT_ACTION_COPY = Object.freeze({
  gift: "Open your gift.",
  market: "Visit the Market to find something for your Hollow."
});

export function hollowNextAction({ placeable = [], spots = [], slots = {}, welcomeEggWaiting = false } = {}) {
  const spotId = placeable.length ? spots.find(spot => !slots[spot.spotId])?.spotId || "" : "";
  if (spotId) return { id: "place", spotId, label: "Place next", instruction: "Tap a glow to place something." };
  if (welcomeEggWaiting) return { id: "gift", label: "Open your gift", instruction: HOLLOW_NEXT_ACTION_COPY.gift };
  return { id: "market", label: "Visit the Market", instruction: HOLLOW_NEXT_ACTION_COPY.market };
}
