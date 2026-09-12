import { SOUND_SEEKERS_CAMPAIGN_PALETTE as P } from '../../visual/visualTokens.js';
import HERO_ANIMATIONS from '../content/heroAnimations.json' with { type: 'json' };
import HERO_ACTIONS from '../content/heroActions.json' with { type: 'json' };
import { getImage } from './sprites.js';
import { keyCampaignHeroPixels, sampleCampaignHeroPose } from './heroMotion.js';
export { HERO_ANIMATIONS, HERO_ACTIONS };
export { createCampaignHeroAnimator } from './heroMotion.js';

const renderedActions = new WeakMap();
export function getCampaignHeroAssets(id) { return [HERO_ANIMATIONS[id]?.src, HERO_ACTIONS[id]?.src].filter(Boolean); }

function actionTexture(image, frame) {
  const key = `${frame.x}:${frame.y}`, frames = renderedActions.get(image) || new Map();
  if (frames.has(key)) return frames.get(key);
  const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(frame.width, frame.height) : typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (!canvas) return null;
  canvas.width = frame.width; canvas.height = frame.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  try {
    ctx.drawImage(image, frame.x, frame.y, frame.width, frame.height, 0, 0, frame.width, frame.height);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    keyCampaignHeroPixels(pixels.data);
    ctx.putImageData(pixels, 0, 0);
    // Authored crop exclusions remove only adjacent-row edge fragments.
    for (const r of frame.cropExclusions || []) ctx.clearRect(r.x, r.y, r.width, r.height);
    frames.set(key, canvas); renderedActions.set(image, frames);
    return canvas;
  } catch { return null; }
}

/** Ground-registered, drawn poses. Physics owns movement and jump height; this
 * renderer never simulates a jump by translating or stretching a static image. */
export function drawCampaignHero(ctx, id, { x, y, height = 112, facing = 1, time = 0, state = 'idle', reducedMotion = false, animation, shadow = true } = {}) {
  const walk = HERO_ANIMATIONS[id];
  if (!walk) return false;
  const pose = animation || sampleCampaignHeroPose(id, { state, clock: time, elapsed: time, gait: time * walk.fps / walk.frames.length, reducedMotion });
  let atlas = pose?.sheet === 'action' ? HERO_ACTIONS[id] : walk;
  let image = getImage(atlas?.src);
  let frameIndex = pose?.frame || 0;
  let actionFrame = image && pose?.sheet === 'action';
  if (actionFrame) image = actionTexture(image, atlas.frames[frameIndex]);
  // A failed action sheet retains the canonical walking atlas and responsive gait.
  if (!image) { actionFrame = false; atlas = walk; image = getImage(walk.src); frameIndex = state === 'walk' || state === 'run' ? Math.floor(time * walk.fps) % walk.frames.length : 0; }
  if (!image) return false;
  const frame = atlas.frames[frameIndex % atlas.frames.length], scale = height / atlas.referenceHeight;
  ctx.save();
  if (shadow) { ctx.fillStyle = P['hero-shadow']; ctx.beginPath(); ctx.ellipse(x, y + 2, height * .3, height * .05, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.translate(x, y); ctx.scale(facing < 0 ? -1 : 1, 1);
  ctx.drawImage(image, actionFrame ? 0 : frame.x, actionFrame ? 0 : frame.y, frame.width, frame.height, -frame.anchorX * scale, -frame.anchorY * scale, frame.width * scale, frame.height * scale);
  ctx.restore(); return true;
}
