export const RESCUE_ANCHORS = Object.freeze({
  bridgeStart: 16,
  bridgeEnd: 82,
  friendY: 61,
  homeX: 88,
  homeY: 51
});

export const SORT_ANCHORS = Object.freeze({
  itemStart: 18,
  binA: 64,
  binB: 90,
  itemY: 51
});

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function rescueFriendX(progress) {
  return RESCUE_ANCHORS.bridgeStart + ((RESCUE_ANCHORS.bridgeEnd - RESCUE_ANCHORS.bridgeStart) * progress);
}

export function sortTargetX(bin) {
  return bin === "bin-a" ? SORT_ANCHORS.binA : SORT_ANCHORS.binB;
}
