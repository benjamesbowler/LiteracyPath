// One original physical instance per ID, including interchangeable equal glyphs.
// A release updates that original row; it never appends another copy or removes
// accepted pieces. The controller separately owns carry state and motor events.
export function releaseWordBridgePhysicalPiece(tiles, carried, { x, y, returnT = 0, localReturn = false } = {}) {
  if (!Array.isArray(tiles) || !Number.isSafeInteger(carried?.physicalId) || carried.physicalId < 0
    || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(returnT) || returnT < 0
    || typeof localReturn !== 'boolean') return null;
  const indices = tiles.map((tile, index) => tile.physicalId === carried.physicalId ? index : -1).filter(index => index >= 0);
  if (indices.length !== 1) return null;
  const index = indices[0], original = tiles[index];
  if (original.placed !== true || original.lost || carried.placed !== true
    || original.glyph !== carried.glyph || original.correct !== carried.correct || original.order !== carried.order) return null;
  const tile = { ...original, x, y, placed: false, lost: false, returnT, localReturn };
  return { index, tile, tiles: tiles.map((row, rowIndex) => rowIndex === index ? tile : row) };
}

// A locally released object has left its authored bank. Resize/re-entry keeps
// its actual world location and deck-relative height instead of respawning it.
// Untouched bank pieces continue to use their existing authored layout.
export function relayoutWordBridgeReleasedPiece(tile, { previousGround, ground, previousWidth, width } = {}) {
  if (!tile || tile.localReturn !== true || ![tile.x, tile.y, tile.w, previousGround, ground, previousWidth, width].every(Number.isFinite)
    || tile.w <= 0 || previousWidth <= 0 || width <= 76 + tile.w) return null;
  const scaledX = width === previousWidth ? tile.x : tile.x * (width / previousWidth);
  const x = Math.max(38 + tile.w / 2, Math.min(width - 38 - tile.w / 2, scaledX));
  return { ...tile, x, y: tile.y + (ground - previousGround) };
}
