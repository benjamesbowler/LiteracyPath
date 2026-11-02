// Decorative art follows the current place without covering a numbered stop,
// its label or the fixed map controls. Inputs are measured viewport rectangles;
// the authored atlas coordinates remain the route authority.
export function adventureMapGuidePlacement({ anchor, size, bounds, obstacles, gap = 8 }) {
  const width = size.width, height = size.height;
  const left = bounds.left + gap, right = bounds.right - width - gap;
  const top = bounds.top + gap, bottom = bounds.bottom - height - gap;
  const unique = values => [...new Set(values.map(value => Math.round(value)))];
  const xs = unique([anchor.x - width - 44, anchor.x + 44, anchor.x - width / 2,
    left, right, ...obstacles.flatMap(rect => [rect.left - width - gap, rect.right + gap])]);
  const ys = unique([anchor.y - height / 2, anchor.y - height - 44, anchor.y + 44,
    top, bottom, ...obstacles.flatMap(rect => [rect.top - height - gap, rect.bottom + gap])]);
  let best = null;
  for (const x of xs) for (const y of ys) {
    if (x < left - 1 || x > right + 1 || y < top - 1 || y > bottom + 1) continue;
    const overlap = obstacles.reduce((area, rect) => area
      + Math.max(0, Math.min(x + width, rect.right + gap) - Math.max(x, rect.left - gap))
      * Math.max(0, Math.min(y + height, rect.bottom + gap) - Math.max(y, rect.top - gap)), 0);
    const distance = (x + width / 2 - anchor.x) ** 2 + (y + height / 2 - anchor.y) ** 2;
    const score = overlap * 1e7 + distance;
    if (!best || score < best.score) best = { x, y, clear: overlap === 0, score };
  }
  return best || { x: left, y: top, clear: false };
}
