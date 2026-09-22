// Runtime delivery map. Source, dimensions, animation and hashes are recorded
// in public/game-assets/arcade-blender/manifest.json and checked against this map.
export const BLENDER_WORLD_ASSETS = Object.freeze({
  'letter-leap': 'treetop-burrow',
  'word-climb': 'cloud-lookout',
  'word-bridge': 'bridge-workshop',
  'sound-beat': 'percussion-pavilion',
  'rhyme-pop': 'festival-pavilion',
  'sound-safari': 'canopy-field-station',
  'reel-read': 'harbour-waterwheel',
  'star-gallery': 'orchard-greenhouse',
  'sentence-express': 'station-clock',
  'grammar-grind': 'skate-pavilion',
  soundkeys: 'resonance-pavilion'
});

export const BLENDER_SPRITE = Object.freeze({ size: 384, columns: 4, frames: 24, fps: 6 });
export function blenderWorldUrl(gameId, extension = 'glb') {
  const id = BLENDER_WORLD_ASSETS[gameId];
  if (!id) throw new Error(`Unknown Blender world: ${gameId}`);
  return `/game-assets/arcade-blender/${id}.${extension}`;
}

// Sprite sheets are actual Blender animation frames, with a shared canvas and
// true alpha. Existing playfield drawing remains the complete failure path.
// This scope owns no timer; only the game's active render loop advances it.
export function createBlenderWorldSprite(gameId, host, { ImageClass = globalThis.Image } = {}) {
  const image = new ImageClass();
  const motion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  let disposed = false, ready = false, last = null, elapsed = 0;
  host.dataset.blenderWorld = gameId;
  host.dataset.blenderWorldState = 'loading';
  image.onload = () => {
    if (disposed) return;
    ready = image.naturalWidth === BLENDER_SPRITE.size * BLENDER_SPRITE.columns && image.naturalHeight === BLENDER_SPRITE.size * BLENDER_SPRITE.frames / BLENDER_SPRITE.columns;
    host.dataset.blenderWorldState = ready ? 'ready' : 'fallback';
  };
  image.onerror = () => { if (!disposed) host.dataset.blenderWorldState = 'fallback'; };
  image.src = blenderWorldUrl(gameId, 'webp');
  return {
    draw(ctx, x, y, width, height, time, { reducedMotion = false, paused = false, opacity = 1, phase } = {}) {
      if (disposed) return;
      if (last !== null && !paused && !reducedMotion && !motion?.matches) elapsed += Math.min(.05, Math.max(0, time - last));
      last = time;
      if (!ready) return;
      const frame = reducedMotion || motion?.matches ? 0 : Math.floor((Number.isFinite(phase) ? phase : elapsed) * BLENDER_SPRITE.fps) % BLENDER_SPRITE.frames;
      const size = BLENDER_SPRITE.size;
      ctx.save(); ctx.globalAlpha *= opacity;
      ctx.drawImage(image, frame % BLENDER_SPRITE.columns * size, Math.floor(frame / BLENDER_SPRITE.columns) * size, size, size, x, y, width, height);
      ctx.restore();
      host.dataset.blenderWorldFrame = String(frame);
    },
    dispose() { disposed = true; image.onload = null; image.onerror = null; image.src = ''; }
  };
}
