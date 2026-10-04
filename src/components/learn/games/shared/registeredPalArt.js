// Game-owned action sheets share registration and decoded-image ownership.
// Pose choice and action timing stay with the real game controller.
const decodedAtlases = new Map();

const finitePoint = point => Array.isArray(point) && point.length >= 2 && point.slice(0, 2).every(Number.isFinite);

export function registeredPalFrameGeometry(atlas, frame, { mirror = false } = {}) {
  if (!atlas || !frame || !Number.isFinite(atlas.pixelsPerUnit) || atlas.pixelsPerUnit <= 0) throw new Error('Pal frame needs a measured pixelsPerUnit');
  const [left, top, right, bottom] = frame.cell || [];
  if (![left, top, right, bottom, atlas.width, atlas.height].every(Number.isFinite)
    || left < 0 || top < 0 || right > atlas.width || bottom > atlas.height || right <= left || bottom <= top
    || !finitePoint(frame.anchor)) throw new Error('Invalid registered Pal frame bounds');
  const width = right - left, height = bottom - top;
  if (frame.anchor[0] < 0 || frame.anchor[0] > width || frame.anchor[1] < 0 || frame.anchor[1] > height) throw new Error('Pal foot anchor outside frame');
  const sign = mirror ? -1 : 1;
  const pixels = { ...frame.sockets };
  if (frame.leftHandPixel) pixels.leftHand = frame.leftHandPixel;
  if (frame.rightHandPixel) pixels.rightHand = frame.rightHandPixel;
  const sockets = Object.fromEntries(Object.entries(pixels).map(([name, point]) => {
    if (!finitePoint(point) || point[0] < left || point[0] >= right || point[1] < top || point[1] >= bottom) throw new Error(`Pal ${name} socket outside registered frame`);
    return [name, [sign * (point[0] - left - frame.anchor[0]) / atlas.pixelsPerUnit,
      (top + frame.anchor[1] - point[1]) / atlas.pixelsPerUnit]];
  }));
  return {
    source: { x: left, y: top, width, height },
    scale: [width / atlas.pixelsPerUnit, height / atlas.pixelsPerUnit],
    center: [mirror ? 1 - frame.anchor[0] / width : frame.anchor[0] / width, (height - frame.anchor[1]) / height],
    sockets,
    mirror
  };
}

export function registeredPalCanvasPose(atlas, frame, { x = 0, y = 0, height = 110, unitScale: selectedUnitScale, mirror = false } = {}) {
  if (![x, y, height].every(Number.isFinite) || height <= 0) throw new Error('Invalid Pal Canvas placement');
  const geometry = registeredPalFrameGeometry(atlas, frame, { mirror });
  const nominalHeight = atlas.nominalHeight ?? 2.2;
  if (!Number.isFinite(nominalHeight) || nominalHeight <= 0) throw new Error('Invalid Pal nominal height');
  const unitScale = selectedUnitScale ?? height / nominalHeight;
  if (!Number.isFinite(unitScale) || unitScale <= 0) throw new Error('Invalid Pal unit scale');
  const pixelScale = unitScale / atlas.pixelsPerUnit;
  const destination = {
    x: -(mirror ? geometry.source.width - frame.anchor[0] : frame.anchor[0]) * pixelScale,
    y: -frame.anchor[1] * pixelScale,
    width: geometry.source.width * pixelScale,
    height: geometry.source.height * pixelScale
  };
  const sockets = Object.fromEntries(Object.entries(geometry.sockets).map(([name, point]) => [name, { x: x + point[0] * unitScale, y: y - point[1] * unitScale }]));
  return { ...geometry, origin: { x, y }, destination, sockets, unitScale, pixelScale };
}

export function drawRegisteredPalFrame(ctx, image, atlas, frame, placement) {
  if (!image) return false;
  const pose = registeredPalCanvasPose(atlas, frame, placement);
  const { source, pixelScale, origin } = pose;
  ctx.save();
  ctx.translate(origin.x, origin.y);
  if (pose.mirror) ctx.scale(-1, 1);
  ctx.drawImage(image, source.x, source.y, source.width, source.height,
    -frame.anchor[0] * pixelScale, -frame.anchor[1] * pixelScale, source.width * pixelScale, source.height * pixelScale);
  ctx.restore();
  return true;
}

function acquireAtlas(atlas) {
  const key = `${atlas.runtime}:${atlas.width}x${atlas.height}`;
  let entry = decodedAtlases.get(key);
  if (!entry) {
    entry = { owners: 1, image: null, status: 'pending', cancel: null };
    decodedAtlases.set(key, entry);
    entry.promise = new Promise(resolve => {
      if (typeof Image === 'undefined') { entry.status = 'unavailable'; resolve(null); return; }
      const picture = new Image();
      let settled = false;
      const finish = image => {
        if (settled) return;
        settled = true; clearTimeout(timer); picture.onload = picture.onerror = null;
        entry.image = entry.owners > 0 ? image : null;
        entry.status = image ? 'delivered' : 'unavailable';
        entry.cancel = null; resolve(entry.image);
      };
      const timer = setTimeout(() => finish(null), 10000);
      entry.cancel = () => finish(null);
      picture.onload = async () => {
        if (picture.naturalWidth !== atlas.width || picture.naturalHeight !== atlas.height) { finish(null); return; }
        try {
          if (typeof picture.decode === 'function') await picture.decode();
          finish(picture);
        } catch { finish(null); }
      };
      picture.onerror = () => finish(null);
      picture.src = atlas.runtime;
    });
  } else entry.owners += 1;
  return { key, entry };
}

export function createRegisteredPalArtBank(atlases) {
  const owned = new Map();
  let disposed = false;
  const selected = (id, index) => {
    const atlas = atlases[id], frame = atlas?.frames?.[index];
    if (!frame) throw new Error(`Unknown registered Pal pose: ${id}/${index}`);
    return { atlas, frame };
  };
  return {
    async preload(ids = Object.keys(atlases)) {
      if (disposed) return [];
      for (const id of new Set(ids)) {
        const atlas = atlases[id];
        if (!atlas?.runtime || !atlas.frames?.length) throw new Error('Unknown registered Pal atlas: ' + id);
        if (!owned.has(id)) owned.set(id, acquireAtlas(atlas));
      }
      const images = await Promise.all([...new Set(ids)].map(id => owned.get(id).entry.promise));
      return disposed ? images.map(() => null) : images;
    },
    pose(id, index, placement) {
      const { atlas, frame } = selected(id, index);
      return registeredPalCanvasPose(atlas, frame, placement);
    },
    draw(ctx, id, index, placement) {
      if (disposed) return false;
      const { atlas, frame } = selected(id, index);
      return drawRegisteredPalFrame(ctx, owned.get(id)?.entry.image, atlas, frame, placement);
    },
    delivery() {
      return Object.fromEntries(Object.keys(atlases).map(id => [id, disposed ? 'disposed' : owned.get(id)?.entry.status || 'not-requested']));
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const { key, entry } of owned.values()) {
        entry.owners -= 1;
        if (entry.owners === 0) { entry.cancel?.(); entry.image = null; decodedAtlases.delete(key); }
      }
      owned.clear();
    }
  };
}
