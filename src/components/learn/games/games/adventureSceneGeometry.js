export const RIVER_ROUTE_ANCHORS = Object.freeze({
  bridgeStartX: 16,
  bridgeEndX: 82,
  friendStartX: 16,
  friendEndX: 90,
  friendFeetY: 244,
  friendWidth: 72,
  friendHeight: 96,
  homeX: 90,
  door: Object.freeze({ x: 864, y: 148, width: 72, height: 96 })
});

export const WORD_CONVEYOR_ANCHORS = Object.freeze({
  itemStart: 18,
  binA: 64,
  binB: 86,
  itemY: 42,
  binY: 84
});

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function riverFriendPosition(progress) {
  return RIVER_ROUTE_ANCHORS.friendStartX + ((RIVER_ROUTE_ANCHORS.friendEndX - RIVER_ROUTE_ANCHORS.friendStartX) * progress);
}

export function conveyorBinPosition(bin) {
  return bin === "bin-a" ? WORD_CONVEYOR_ANCHORS.binA : WORD_CONVEYOR_ANCHORS.binB;
}
