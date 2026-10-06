const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const overlaps = (a, b) => a.x < b.right + 6 && a.right + 6 > b.x && a.y < b.bottom + 6 && a.bottom + 6 > b.y;

// A paper anchored at or behind the near plane has no usable perspective
// projection. Do not leave its previous frame's shifted sprite visible.
export function grovePlaqueProjectionVisible(depth, near, projectedDepth) {
  return Number.isFinite(depth) && Number.isFinite(near) && Number.isFinite(projectedDepth)
    && depth > near && projectedDepth >= -1 && projectedDepth < 1;
}

// Equal reading treatment at each actual tree anchor. This is a visual
// billboard layout only; the caller retains all world positions/colliders.
export function layoutGrovePlaques(items, { width, height, promptBottom, glyphFloor = 16, reserved = [] }) {
  const placed = [];
  for (const item of [...items].sort((a, b) => a.x - b.x)) {
    if (!(item.pixelsPerUnit > 0) || !(item.glyphFraction > 0)) continue;
    const minHeight = glyphFloor / item.glyphFraction;
    // Perspective can make a physically nearby, off-axis paper thousands of
    // pixels tall. Bound its screen extent while retaining the exact source
    // aspect, ink floor and tree anchor. Leave room for three reading papers.
    const maxHeight = Math.max(minHeight, Math.min(110,
      (height - promptBottom - 90 - 16) / 3, (width - 12) / item.aspect));
    const h = clamp(item.worldHeight * item.pixelsPerUnit, minHeight, maxHeight), w = h * item.aspect;
    const worldHeight = h / item.pixelsPerUnit;
    const nominalX = clamp(item.x - w / 2, 6, width - w - 6);
    const minY = promptBottom + 6, maxY = Math.max(minY, height - 84 - h);
    const nominalY = clamp(item.y - h / 2, minY, maxY);
    const xs = [nominalX, nominalX - w - 8, nominalX + w + 8, 6, width - w - 6].map(x => clamp(x, 6, width - w - 6));
    const ys = [nominalY, ...[1, -1, 2, -2, 3, -3].map(n => nominalY + n * (h + 8)), minY, maxY,
      ...reserved.flatMap(box => [box.y - h - 8, box.bottom + 8])].map(y => clamp(y, minY, maxY));
    const candidates = xs.flatMap(x => ys.map(y => ({ x, y, right: x + w, bottom: y + h })))
      .sort((a, b) => Math.hypot(a.x - nominalX, a.y - nominalY) - Math.hypot(b.x - nominalX, b.y - nominalY));
    const selected = candidates.find(candidate => !placed.some(other => overlaps(candidate, other.bounds))
      && !reserved.some(box => overlaps(candidate, box)));
    const { x, y } = selected || { x: nominalX, y: nominalY };
    const bounds = { x, y, width: w, height: h, right: x + w, bottom: y + h };
    placed.push({ id: item.id, anchor: { x: item.x, y: item.y }, bounds, worldHeight, clear: Boolean(selected),
      worldWidth: worldHeight * item.aspect, glyphPixels: worldHeight * item.pixelsPerUnit * item.glyphFraction,
      center: { x: (item.x - x) / w, y: 1 - (item.y - y) / h } });
  }
  return placed;
}
