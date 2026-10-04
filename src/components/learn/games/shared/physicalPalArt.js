import { PHYSICAL_PAL_ART } from './physicalPalArtData.js';

const worlds = { meadow: 'bouncy', dino: 'chompy', moonwood: 'pip' };
const images = new Map(), decoded = new Map(), delivery = new Map();
const characterForWorld = world => worlds[world] || 'bouncy';

function loadAtlas(name, kind) {
  if (typeof Image === 'undefined') return Promise.resolve(null);
  const atlas = kind === 'locomotion' ? PHYSICAL_PAL_ART[name] : PHYSICAL_PAL_ART[name].actionAtlases[kind];
  if (!atlas) return Promise.resolve(null);
  const key = `${name}:${kind}`;
  if (!images.has(key)) images.set(key, new Promise(resolve => {
    delivery.set(key, 'pending');
    const picture = new Image();
    let settled = false;
    const settle = image => {
      if (settled) return; settled = true; clearTimeout(timer);
      picture.onload = picture.onerror = null;
      delivery.set(key, image ? 'delivered' : 'unavailable');
      if (image) decoded.set(key, image); else images.delete(key);
      resolve(image);
    };
    const timer = setTimeout(() => settle(null), 10000);
    picture.onload = () => settle(picture.naturalWidth ? picture : null);
    picture.onerror = () => settle(null);
    picture.src = atlas.runtime;
  }));
  return images.get(key);
}

// The browser's decoded image is shared; every mounted actor owns its texture,
// material and UV transform so one actor's pose cannot change another's.
export async function preloadPhysicalPalArt(world = 'meadow', { actions = [] } = {}) {
  const name = characterForWorld(world);
  const [image] = await Promise.all(['locomotion', ...new Set(actions)].map(kind => loadAtlas(name, kind)));
  return image;
}

export function physicalPalArtDelivery(world = 'meadow') {
  const name = characterForWorld(world);
  return Object.fromEntries(['locomotion', 'tools', 'tennis'].map(kind => [kind, delivery.get(`${name}:${kind}`) || 'not-requested']));
}

export function addAuthoredPalArt(THREE, root, { world = 'meadow', actions = ['tools', 'tennis'] } = {}) {
  if (typeof Image === 'undefined') return root;
  const data = PHYSICAL_PAL_ART[characterForWorld(world)];
  const fallback = [...root.children];
  const material = new THREE.SpriteMaterial({ color: '#ffffff', transparent: true, alphaTest: .12, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.name = `${data.character}-authored-animated-art`;
  sprite.visible = false; root.add(sprite);
  const leftHand = new THREE.Group(), rightHand = new THREE.Group();
  leftHand.position.set(-.52, 1.03, .08); rightHand.position.set(.52, 1.03, .08);
  root.add(leftHand, rightHand);
  root.userData.artHands = { left: leftHand, right: rightHand };
  const art = { data, sprite, material, delivery: 'loading', frame: null, direction: 'front', action: 'idle', maps: new Map(), actionDelivery: {} };
  root.userData.authoredPal = art;
  let disposed = false;
  material.addEventListener('dispose', () => {
    disposed = true; art.delivery = 'disposed';
    // disposeObject already releases the active map; release inactive poses here.
    for (const texture of art.maps.values()) if (texture !== material.map) texture.dispose();
    art.maps.clear();
  });
  for (const kind of ['locomotion', ...new Set(actions)]) {
    art.actionDelivery[kind] = 'loading';
    loadAtlas(data.character, kind).then(image => {
      if (disposed) return;
      art.actionDelivery[kind] = image ? 'delivered' : 'unavailable';
      if (!image) { if (kind === 'locomotion') art.delivery = 'unavailable'; return; }
      const texture = new THREE.Texture(image); texture.colorSpace = THREE.SRGBColorSpace;
      texture.generateMipmaps = false; texture.minFilter = texture.magFilter = THREE.LinearFilter; texture.needsUpdate = true;
      art.maps.set(kind, texture);
      if (kind !== 'locomotion') return;
      material.map = texture; material.needsUpdate = true;
      for (const child of fallback) child.visible = false;
      art.delivery = 'delivered'; sprite.visible = true;
      animateAuthoredPalArt(root, 0, false);
    });
  }
  return root;
}

// Action phase comes from the real racket/hammer controller, not an invented clock.
export function physicalPalFrame(world = 'meadow', time = 0, moving = false, options = {}) {
  const data = PHYSICAL_PAL_ART[characterForWorld(world)];
  const direction = options.direction || 'front';
  const action = options.action || (moving ? 'walk' : 'idle');
  const phase = Math.max(0, Math.min(.999, Number(options.phase) || 0));
  let kind = 'locomotion', index = (moving ? 1 + Math.floor(time * 8) % 2 : 0) * 4 + ({ front: 0, back: 1, left: 2, right: 3 }[direction] ?? 0);
  let mirror = false;
  if (['ready', 'forehand', 'lob'].includes(action)) {
    kind = 'tennis'; index = (direction === 'back' ? 0 : 4) + (action === 'ready' ? 0 : action === 'lob' ? 3 : Math.floor(phase * 3));
  } else if (['celebrate', 'jump', 'smash', 'climb', 'carry'].includes(action)) {
    kind = 'tools';
    index = action === 'celebrate' ? 0 : action === 'jump' ? 1 : action === 'smash' ? 2 + (phase >= .5 ? 1 : 0) : action === 'climb' ? 4 + Math.floor(time * 6) % 2 : direction === 'left' ? 7 : 6;
    mirror = direction === 'left' && ['jump', 'smash'].includes(action);
    if (action === 'carry' && ['front', 'back'].includes(direction)) kind = 'locomotion';
    if (kind === 'locomotion') index = (moving ? 1 + Math.floor(time * 8) % 2 : 0) * 4 + (direction === 'back' ? 1 : 0);
  }
  const atlas = kind === 'locomotion' ? data : data.actionAtlases[kind];
  const frame = atlas.frames[index];
  mirror = mirror || frame.mirror;
  let rightHand = [direction === 'back' ? -.4 : .48, 1.12, .08], leftHand = [-rightHand[0], 1.12, .08];
  if (frame.rightHand) rightHand = frame.rightHand;
  if (kind === 'tools') rightHand = [[.64, 1.92, .08], [.64, 1.13, .08], [-.34, 1.80, .08], [.77, 1.22, .08], [.5, 1.90, .08], [.52, 1.26, .08], [.56, 1.12, .08], [-.56, 1.12, .08]][index];
  if (mirror) rightHand = [-rightHand[0], rightHand[1], rightHand[2]];
  return { kind, index, atlas, frame, mirror, direction, action, rightHand, leftHand };
}

export function animateAuthoredPalArt(root, time = 0, moving = false, options = {}) {
  const art = root?.userData?.authoredPal;
  if (!art || art.delivery !== 'delivered') return false;
  const selection = physicalPalFrame(Object.keys(worlds).find(world => worlds[world] === art.data.character), time, moving, {
    ...options, direction: options.direction || root.userData.artDirection || art.direction,
    action: options.action || root.userData.artAction || (moving ? 'walk' : 'idle')
  });
  let { kind, index, atlas: data, frame, mirror } = selection;
  if (!art.maps.has(kind)) {
    const fallback = physicalPalFrame(Object.keys(worlds).find(world => worlds[world] === art.data.character), time, moving, { direction: selection.direction });
    ({ kind, index, atlas: data, frame, mirror } = fallback);
  }
  const frameKey = `${kind}:${index}:${mirror}`;
  if (art.frame !== frameKey) {
    const { sprite, material } = art;
    const [x, y, right, bottom] = frame.cell;
    const width = right - x, height = bottom - y;
    const pixelsPerUnit = data.pixelsPerUnit;
    sprite.scale.set(width / pixelsPerUnit, height / pixelsPerUnit, 1);
    const anchor = frame.anchor;
    sprite.center.set(mirror ? 1 - anchor[0] / width : anchor[0] / width, (height - anchor[1]) / height);
    if (material.map !== art.maps.get(kind)) { material.map = art.maps.get(kind); material.needsUpdate = true; }
    const map = material.map;
    map.repeat.set((mirror ? -1 : 1) * (width - 1) / data.width, (height - 1) / data.height);
    map.offset.set((mirror ? right - .5 : x + .5) / data.width, (data.height - bottom + .5) / data.height);
    art.frame = frameKey;
  }
  if (options.updateHands !== false) {
    root.userData.artHands.right.position.set(...selection.rightHand);
    root.userData.artHands.left.position.set(...selection.leftHand);
  }
  art.direction = selection.direction; art.action = selection.action; art.atlas = kind;
  return true;
}

export function drawPhysicalPalArt(ctx, { world = 'meadow', time = 0, moving = false, direction = 'front', action, phase, x, y, height = 110 } = {}) {
  let selection = physicalPalFrame(world, time, moving, { direction, action, phase });
  let image = decoded.get(`${characterForWorld(world)}:${selection.kind}`);
  if (!image) { selection = physicalPalFrame(world, time, moving, { direction }); image = decoded.get(`${characterForWorld(world)}:locomotion`); }
  if (!image) return false;
  const { frame, atlas, mirror } = selection, [left, top, right, bottom] = frame.cell;
  const width = right - left, cellHeight = bottom - top, scale = height / (2.2 * atlas.pixelsPerUnit);
  ctx.save(); ctx.translate(x, y); if (mirror) ctx.scale(-1, 1);
  ctx.drawImage(image, left, top, width, cellHeight, -frame.anchor[0] * scale, -frame.anchor[1] * scale, width * scale, cellHeight * scale);
  ctx.restore(); return true;
}
