import { arcadePixelRatio } from '../shared/arcadeRenderBudget.js';
import { createRegisteredPalArtBank } from '../shared/registeredPalArt.js';
import { SOUNDKEYS_ART } from './soundKeysArtData.js';

const performers = Object.fromEntries(Object.entries(SOUNDKEYS_ART).filter(([, asset]) => asset.frames));
export const SOUNDKEYS_CAST = [['speedy', 'clucky'], ['chompy', 'sunny', 'dozy'], ['pip', 'wren', 'fern']];
const worlds = ['meadow', 'dino', 'moonwood'];
const kits = ['instrument-kit-v1', 'dino-instrument-kit-v1', 'moonwood-instrument-kit-v1'];

// Registered anatomical contact meets the actual visible key. This calculation
// is shared by the live drawing and read-only native QA; it cannot answer.
export function soundKeysKeyContactPose(bank, character, frame, key, height, mirror = false) {
  const atlas = `${character}-keyboard-actions-v1`;
  const preliminary = bank.pose(atlas, frame, { x: 0, y: 0, height, mirror });
  const limb = Object.keys(preliminary.sockets)[0];
  if (!limb) return null;
  const point = preliminary.sockets[limb];
  const placement = { x: key.x - point.x, y: key.y - point.y, height, mirror };
  const pose = bank.pose(atlas, frame, placement);
  return { atlas, frame, limb, placement, socket: pose.sockets[limb], target: { ...key }, separation: Math.hypot(pose.sockets[limb].x - key.x, pose.sockets[limb].y - key.y) };
}

// Fit the actual selected painted body, including wide bow/wing poses, into
// its own stage region. Feet stay at the region's floor, and the registered
// scale applies equally to the image and every anatomical socket.
export function soundKeysRestingPose(bank, character, frame, region, height, mirror = false) {
  const atlas = `${character}-keyboard-actions-v1`;
  const measured = bank.pose(atlas, frame, { x: 0, y: 0, height, mirror });
  const fit = Math.min(1, region.width / measured.destination.width, region.height / measured.destination.height);
  const selectedHeight = height * fit;
  const pose = bank.pose(atlas, frame, { x: 0, y: 0, height: selectedHeight, mirror });
  const placement = { x: region.x + (region.width - pose.destination.width) / 2 - pose.destination.x,
    y: region.y + region.height - pose.destination.y - pose.destination.height, height: selectedHeight, mirror };
  return { placement, region: { ...region }, bounds: { x: placement.x + pose.destination.x, y: placement.y + pose.destination.y,
    width: pose.destination.width, height: pose.destination.height } };
}

export function createSoundKeysWorld(mount, { getState, getKeys, onDelivery = () => {} }) {
  const canvas = document.createElement('canvas'); canvas.className = 'sk-authored-world'; canvas.setAttribute('aria-hidden', 'true');
  mount.prepend(canvas);
  const ctx = canvas.getContext('2d', { alpha: false });
  let art = createRegisteredPalArtBank(performers), currentBand = -1, assetGeneration = 0;
  let disposed = false, frameId, width = 0, height = 0, ratio = 1, previousAt = null, resized = true;
  const images = new Map(), statuses = new Map(), frames = [], cancellations = new Set();
  let scene = { world: 'meadow', actors: [], contacts: [], delivered: false, frameAt: 0 };
  function reportDelivery() {
    const band = getState().band, world = worlds[band] || 'meadow';
    onDelivery({ assets: Object.fromEntries([`${world}-keyboard-venue-v1`, kits[band]].map(name => [name, statuses.get(name) || 'not-requested'])),
      actions: Object.fromEntries(SOUNDKEYS_CAST[band].map(character => {
        const name = `${character}-keyboard-actions-v1`; return [name, art.delivery()[name] || 'unavailable'];
      })) });
  }
  function load(name) {
    if (statuses.has(name)) return;
    const asset = SOUNDKEYS_ART[name];
    if (!asset) { statuses.set(name, 'unavailable'); return; }
    statuses.set(name, 'pending');
    const image = new Image(), generation = assetGeneration; let settled = false;
    const finish = delivered => {
      if (settled) return; settled = true; clearTimeout(timer); cancellations.delete(cancel);
      image.onload = image.onerror = null;
      if (disposed || generation !== assetGeneration) return;
      statuses.set(name, delivered ? 'delivered' : 'unavailable');
      if (delivered) images.set(name, image);
      else if (!name.includes('-fallback-')) load(name.replace('-v1', '-fallback-v1'));
      reportDelivery();
    };
    const timer = setTimeout(() => finish(false), 10000), cancel = () => finish(false); cancellations.add(cancel);
    image.onload = async () => {
      try {
        await image.decode();
        finish(image.naturalWidth === asset.width && image.naturalHeight === asset.height);
      } catch { finish(false); }
    };
    image.onerror = () => finish(false); image.src = asset.runtime;
  }
  function selectBand(band) {
    if (band === currentBand) return;
    currentBand = band; assetGeneration += 1;
    for (const cancel of cancellations) cancel();
    cancellations.clear(); images.clear(); statuses.clear();
    art.dispose(); art = createRegisteredPalArtBank(performers);
    const selectedArt = art;
    load(`${worlds[band]}-keyboard-venue-v1`); load(kits[band]);
    void selectedArt.preload(SOUNDKEYS_CAST[band].flatMap(character => [`${character}-keyboard-actions-v1`, `${character}-keyboard-fallback-v1`]))
      .then(() => { if (!disposed && selectedArt === art) reportDelivery(); });
  }
  selectBand(getState().band);
  function resize() {
    const bounds = mount.getBoundingClientRect(); width = bounds.width; height = bounds.height;
    ratio = arcadePixelRatio(1.5, width, height);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    resized = true;
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    const host = mount.closest('.lg-game-player');
    const title = host?.querySelector('.lg-game-title-chip')?.getBoundingClientRect();
    const actions = host?.querySelector('.lg-game-player-actions')?.getBoundingClientRect();
    if (height < 460 && width >= 520 && title && actions && actions.left - title.right >= 150) {
      const cueWidth = Math.min(260, actions.left - title.right - 16);
      mount.style.setProperty('--sk-cue-left', `${(title.right + actions.left) / 2 - bounds.left}px`);
      mount.style.setProperty('--sk-cue-top', '8px'); mount.style.setProperty('--sk-cue-width', `${cueWidth}px`);
    } else {
      mount.style.removeProperty('--sk-cue-left'); mount.style.removeProperty('--sk-cue-top'); mount.style.removeProperty('--sk-cue-width');
    }
  }
  const observer = new ResizeObserver(resize); observer.observe(mount); resize();
  function part(name, x, y, w, h) {
    const kit = kits[getState().band] || kits[0];
    const selected = images.has(kit) ? kit : kit.replace('-v1', '-fallback-v1');
    const image = images.get(selected), cell = SOUNDKEYS_ART[selected]?.parts[name];
    if (!image || !cell) return false;
    ctx.drawImage(image, cell[0], cell[1], cell[2] - cell[0], cell[3] - cell[1], x, y, w, h); return true;
  }
  function rounded(x, y, w, h, colour) { ctx.fillStyle = colour; ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill(); }
  function render(at) {
    if (disposed) return;
    frameId = requestAnimationFrame(render);
    const state = getState();
    selectBand(state.band);
    if (previousAt !== null && !state.paused) { frames.push({ at, ms: at - previousAt }); if (frames.length > 3000) frames.shift(); }
    previousAt = at;
    // Resizing clears the backing canvas. Repaint the frozen state once so
    // opening controls and rotating a device cannot erase the paused world.
    if (!width || !height || (state.paused && scene.frameAt && !resized)) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const world = worlds[state.band] || 'meadow';
    const venue = images.get(`${world}-keyboard-venue-v1`) || images.get(`${world}-keyboard-venue-fallback-v1`);
    if (scene.world !== world) reportDelivery();
    ctx.fillStyle = ['#d8e7d5', '#c6d4b4', '#30304e'][state.band] || '#d8e7d5'; ctx.fillRect(0, 0, width, height);
    if (venue) {
      const scale = Math.max(width / venue.width, height / venue.height);
      ctx.drawImage(venue, (width - venue.width * scale) / 2, (height - venue.height * scale) / 2, venue.width * scale, venue.height * scale);
    }
    const keys = getKeys().map((rect, index) => ({ ...rect, index }));
    if (!keys.length) return;
    const rows = [...new Set(keys.map(key => Math.round(key.y)))];
    for (const y of rows) {
      const group = keys.filter(key => Math.round(key.y) === y);
      const left = Math.min(...group.map(key => key.x)), right = Math.max(...group.map(key => key.x + key.width));
      part('woodenFrame', left - 8, y - 14, right - left + 16, 90);
      part('frontFascia', left - 2, y + 43, right - left + 4, 24);
    }
    for (const key of keys) {
      const pressed = state.pressed.includes(state.visibleKeys[key.index]) || (state.lastPress?.index === key.index && state.elapsed - state.lastPress.at < .14);
      const travel = pressed ? 4 : 0;
      part(key.index % 2 ? 'reedResonator' : 'bellResonator', key.x + key.width * .26, key.y + 22, key.width * .48, 40);
      if (!part(key.index % 2 ? 'blueBar' : 'goldBar', key.x, key.y + travel, key.width, 48)) rounded(key.x, key.y + travel, key.width, 48, '#dbeafe');
      if (pressed) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(key.x + key.width / 2, key.y + 8 + travel, key.width * .3, 8, 0, 0, Math.PI * 2); ctx.stroke(); }
    }
    const actors = [], contacts = [];
    const cast = SOUNDKEYS_CAST[state.band];
    const compactPortrait = width < 520 && height < 420;
    const actorHeight = Math.min(260, width < 520 ? (compactPortrait ? 50 : 148) : height < 300 ? 68 : height < 460 ? 112 : height * .32);
    for (const [actorIndex, character] of cast.entries()) {
      const atlas = `${character}-keyboard-actions-v1`;
      const press = state.lastPress;
      const owning = press && Math.min(cast.length - 1, Math.floor(press.index * cast.length / 8)) === actorIndex;
      const stillHeld = owning && state.pressed.includes(press.token);
      const recent = owning && state.elapsed - press.at < .42;
      const key = keys[press?.index];
      const contactFrame = performers[atlas]?.contactFrames?.[press?.index] ?? 4 + press?.index;
      let frame = 0, action = 'ready', contact = null, fitted = null;
      // Both residents stand behind the first physical keyboard row. Using
      // the second row for the right performer hid its face on phones.
      let placement = { x: compactPortrait ? 220 + (width - 236) * (actorIndex + .5) / cast.length : width * (actorIndex + 1) / (cast.length + 1),
        y: compactPortrait ? keys[0].y - 4 : keys[0].y + 24, height: actorHeight, mirror: actorIndex === 0 };
      if (performers[atlas] && key && owning && (stillHeld || recent)) {
        frame = stillHeld || state.elapsed - press.at < .14 ? contactFrame : 3;
        action = stillHeld ? 'sustain' : state.elapsed - press.at < .14 ? 'key-contact' : 'release';
        if (frame === contactFrame) {
          const target = { x: key.x + key.width / 2, y: key.y + 12 };
          contact = soundKeysKeyContactPose(art, character, frame, target, actorHeight, key.x + key.width / 2 < width / 2);
          if (contact) placement = contact.placement;
        }
      } else if (state.celebrating) { frame = state.elapsed - state.completedAt < .5 ? 13 : 14; action = 'phrase-finale'; }
      else if (state.elapsed - state.errorAt < .45) { frame = 15; action = 'retry-recovery'; }
      else if (state.hoverIndex !== null && Math.min(cast.length - 1, Math.floor(state.hoverIndex * cast.length / 8)) === actorIndex) { frame = actorIndex === 0 ? 2 : 1; action = 'anticipation'; }
      const gap = compactPortrait ? 4 : 8, left = compactPortrait ? 220 : width < 700 ? 8 : width * .1;
      const availableWidth = (compactPortrait ? width - 228 : width < 700 ? width - 16 : width * .8) - gap * (cast.length - 1);
      const slotWidth = availableWidth / cast.length;
      const bottom = compactPortrait ? keys[0].y - 4 : keys[0].y + 26;
      const top = compactPortrait ? 74 : width < 520 ? 216 : height < 460 ? 150 : 184;
      const region = { x: left + actorIndex * (slotWidth + gap), y: top, width: slotWidth, height: Math.max(1, bottom - top) };
      if (performers[atlas] && !contact) {
        fitted = soundKeysRestingPose(art, character, frame, region, actorHeight, actorIndex === 0);
        placement = fitted.placement;
      }
      const delivered = Boolean(performers[atlas] && art.draw(ctx, atlas, frame, placement));
      let fallbackDelivered = false;
      if (!delivered) {
        const fallback = `${character}-keyboard-fallback-v1`;
        if (performers[fallback]) {
          // A failed action atlas retains the independently encoded original
          // resident. The bar still responds; no action delivery is invented.
          const fallbackFit = soundKeysRestingPose(art, character, 0, region, actorHeight, actorIndex === 0);
          fallbackDelivered = art.draw(ctx, fallback, 0, fallbackFit.placement);
        }
      }
      actors.push({ character, frame, action, delivered, fallbackDelivered, placement: { ...placement }, ...(fitted ? { stageRegion: fitted.region, bodyBounds: fitted.bounds } : {}) });
      if (contact) contacts.push({ character, limb: contact.limb, socket: { ...contact.socket }, target: { ...contact.target }, separation: contact.separation, index: press.index, rendered: delivered });
    }
    if (width >= 700 && height >= 500) {
      const count = Math.min(3, Math.floor((state.round % 8) / 2));
      for (let index = 0; index < count; index += 1) part(index % 2 ? 'reedRack' : 'bellRack', width * (.08 + index * .08), height * .53, 64, 100);
      part('flowers', width - 130, height * .59, 118, 112);
    }
    scene = { world, actors, contacts, delivered: Boolean(images.get(`${world}-keyboard-venue-v1`) && images.get(kits[state.band]) && actors.every(actor => actor.delivered)),
      playableFallback: Boolean(venue && (images.get(kits[state.band]) || images.get(kits[state.band].replace('-v1', '-fallback-v1'))) && actors.every(actor => actor.delivered || actor.fallbackDelivered)), frameAt: at,
      renderer: 'authored-canvas', input: state.lastPress && { ...state.lastPress }, venue: statuses.get(`${world}-keyboard-venue-v1`), kit: statuses.get(kits[state.band]), actionDelivery: art.delivery(),
      sceneFallback: { venue: statuses.get(`${world}-keyboard-venue-fallback-v1`) || 'not-requested', kit: statuses.get(kits[state.band].replace('-v1', '-fallback-v1')) || 'not-requested' },
      instrumentRows: rows.length, keyGeometry: keys.map(key => ({ ...key })) };
    resized = false;
  }
  frameId = requestAnimationFrame(render);
  return {
    inspect({ includeFrames = false } = {}) {
      const times = frames.map(frame => frame.ms).sort((a, b) => a - b);
      return structuredClone({ ...scene, ...(includeFrames ? { frames } : {}), rasterRatio: ratio,
        frameProfile: { samples: times.length, meanMs: times.reduce((sum, ms) => sum + ms, 0) / (times.length || 1),
          p95Ms: times[Math.max(0, Math.ceil(times.length * .95) - 1)] || 0, maxMs: times.at(-1) || 0 } });
    },
    dispose() { disposed = true; cancelAnimationFrame(frameId); observer.disconnect(); for (const cancel of cancellations) cancel(); cancellations.clear(); art.dispose(); images.clear(); canvas.remove(); }
  };
}
