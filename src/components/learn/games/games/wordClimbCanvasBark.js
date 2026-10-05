// The same retained bark albedo used by the Three route, shaded once into a
// world-owned Canvas bank. This is renderer work: it never sees a target word,
// response or choice eligibility and never changes the real route coordinates.
export const WORD_CLIMB_BARK_PATH = '/game-assets/arcade-worlds/textures/bark.webp';

const tints = { meadow: '#e6c7a2', dino: '#d0ad85', moonwood: '#c5b9a3' };

export function createWordClimbCanvasBark(world, { makeImage = () => new Image(),
  makeCanvas = () => document.createElement('canvas'), setTimer = setTimeout, clearTimer = clearTimeout,
  onDelivery = () => {} } = {}) {
  const image = makeImage(); let state = 'pending', surface = null, disposed = false, settled = false, resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  function settle(next) {
    if (settled) return;
    settled = true; clearTimer(timer); image.onload = image.onerror = null;
    state = disposed ? 'disposed' : next;
    if (!disposed) onDelivery(state);
    resolveReady(state === 'delivered');
  }
  const timer = setTimer(() => settle('unavailable'), 10000);
  image.onerror = () => settle('unavailable');
  image.onload = async () => {
    try {
      if (!(image.naturalWidth > 0 && image.naturalHeight > 0)) { settle('unavailable'); return; }
      await image.decode?.();
      if (disposed || settled) return;
      const tile = makeCanvas(); tile.width = 512; tile.height = 512;
      const ctx = tile.getContext('2d');
      if (!ctx) { tile.width = tile.height = 1; settle('unavailable'); return; }
      // Front half of the cylindrical UV surface repeats the same wood map.
      for (let column = 0; column < 2; column++) ctx.drawImage(image, column * 256, 0, 256, 512);
      ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = tints[world] || tints.moonwood;
      ctx.fillRect(0, 0, 512, 512); ctx.globalCompositeOperation = 'source-over';
      const shade = ctx.createLinearGradient(0, 0, 512, 0);
      for (const [position, color] of [[0, '#20130fc4'], [.15, '#2417115c'], [.42, '#ffdb9e22'], [.62, '#f8dfb910'], [1, '#241710a6']]) shade.addColorStop(position, color);
      ctx.fillStyle = shade; ctx.fillRect(0, 0, 512, 512);
      surface = tile; settle('delivered');
    } catch { settle('unavailable'); }
  };
  image.src = WORD_CLIMB_BARK_PATH;
  return {
    ready, delivery: () => state, surface: () => surface,
    inspect: () => ({ delivery: state, source: WORD_CLIMB_BARK_PATH, surfaceCount: surface ? 1 : 0,
      representation: surface ? 'retained-bark-albedo-cylindrical-shading' : 'unavailable' }),
    dispose() {
      if (disposed) return;
      disposed = true; state = 'disposed'; settle('disposed'); clearTimer(timer);
      image.onload = image.onerror = null; image.removeAttribute?.('src');
      if (surface) surface.width = surface.height = 1;
      surface = null;
    }
  };
}

// Horizontal strips follow the actual moving route's silhouette. The texture
// repeats by world height, so it cannot swim when the camera ascends or pauses.
export function drawWordClimbBarkStrips(ctx, surface, points, physical) {
  if (!surface || points.length < 2) return 0;
  let draws = 0;
  const between = (first, last, t) => ({ x: first.x + (last.x - first.x) * t, y: first.y + (last.y - first.y) * t });
  // A single silhouette mask keeps the true route boundary. Repeated masks at
  // every strip would reveal the underlying flat fill at their antialiased
  // horizontal edges, even when both sides have identical registered UVs.
  ctx.save(); ctx.beginPath();
  points.forEach((point, index) => { const p = physical(point.x - point.radius, point.y); if (index) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
  [...points].reverse().forEach(point => { const p = physical(point.x + point.radius, point.y); ctx.lineTo(p.x, p.y); });
  ctx.closePath(); ctx.clip();
  function triangle(sourceY, sourceHeight, first, second, third, lower) {
    // Both triangles share the same measured edge vertices and UVs. A bounding
    // rectangle clipped to each bent strip would reset the horizontal texture
    // at every edge, producing the observed horizontal patchwork seams.
    const a = (lower ? second.x - third.x : second.x - first.x) / surface.width;
    const b = (lower ? second.y - third.y : second.y - first.y) / surface.width;
    const c = (lower ? third.x - first.x : third.x - second.x) / sourceHeight;
    const d = (lower ? third.y - first.y : third.y - second.y) / sourceHeight;
    const vertices = [first, second, third];
    const signedArea = (second.x - first.x) * (third.y - first.y) - (second.y - first.y) * (third.x - first.x);
    const side = Math.sign(signedArea) || 1;
    const normals = vertices.map((point, index) => {
      const next = vertices[(index + 1) % 3], dx = next.x - point.x, dy = next.y - point.y, length = Math.max(1e-9, Math.hypot(dx, dy));
      return { x: side * dy / length, y: -side * dx / length };
    });
    // Offset each edge by its perpendicular normal. A radial expansion of a
    // wide, thin triangle barely moves its horizontal edges and leaves seams.
    // Intersecting adjacent offset edges gives a true 0.8px overlap; only the
    // clipping mask expands, while affine sampling and route geometry stay put.
    const padded = vertices.map((point, index) => {
      const before = normals[(index + 2) % 3], after = normals[index];
      const miter = .8 / Math.max(1e-9, 1 + before.x * after.x + before.y * after.y);
      return { x: point.x + (before.x + after.x) * miter, y: point.y + (before.y + after.y) * miter };
    });
    ctx.save(); ctx.beginPath(); ctx.moveTo(padded[0].x, padded[0].y); ctx.lineTo(padded[1].x, padded[1].y); ctx.lineTo(padded[2].x, padded[2].y); ctx.closePath(); ctx.clip();
    ctx.transform(a, b, c, d, first.x - c * sourceY, first.y - d * sourceY);
    ctx.drawImage(surface, 0, 0); draws++;
    // At the existing UV repeat boundary the expanded clip extends beyond the
    // decoded tile. Paint only that neighbouring repeat with the same affine
    // matrix, so its edge coverage matches interior strips without a new bank.
    if (sourceY === 0) { ctx.drawImage(surface, 0, -surface.height); draws++; }
    if (Math.abs(sourceY + sourceHeight - surface.height) < 1e-7) { ctx.drawImage(surface, 0, surface.height); draws++; }
    ctx.restore();
  }
  for (let index = 0; index + 1 < points.length; index++) {
    const low = points[index], high = points[index + 1];
    const leftLow = physical(low.x - low.radius, low.y), rightLow = physical(low.x + low.radius, low.y);
    const leftHigh = physical(high.x - high.radius, high.y), rightHigh = physical(high.x + high.radius, high.y);
    const sourceY = ((-high.y / 110 * surface.height) % surface.height + surface.height) % surface.height;
    const sourceHeight = Math.max(1, Math.abs(high.y - low.y) / 110 * surface.height);
    let used = 0, start = sourceY;
    while (used < sourceHeight) {
      const part = Math.min(sourceHeight - used, surface.height - start), t0 = used / sourceHeight, t1 = (used + part) / sourceHeight;
      const tl = between(leftHigh, leftLow, t0), tr = between(rightHigh, rightLow, t0);
      const bl = between(leftHigh, leftLow, t1), br = between(rightHigh, rightLow, t1);
      triangle(start, part, tl, tr, br, false); triangle(start, part, tl, br, bl, true);
      used += part; start = 0;
    }
  }
  ctx.restore();
  return draws;
}
