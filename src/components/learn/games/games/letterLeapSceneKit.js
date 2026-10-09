import { createRegisteredPalArtBank, registeredPalCanvasPose, drawRegisteredPalFrame } from '../shared/registeredPalArt.js';
import { drawPhysicalPalArt, preloadPhysicalPalArt, physicalPalArtDelivery } from '../shared/physicalPalArt.js';
import { LETTER_LEAP_ATLASES, LETTER_LEAP_FOE_ATLASES, LETTER_LEAP_SCENE_ART } from './letterLeapArt.generated.js';

export const LETTER_LEAP_CAST = Object.freeze({ meadow: 'bouncy', dino: 'chompy', moonwood: 'pip' });
const NAMES = Object.freeze({ bouncy: 'Bouncy', chompy: 'Chompy', pip: 'Pip' });

export function letterLeapPose(player, { inputAxis = 0 } = {}) {
  if (player?.onGround && Math.abs(player.vx || 0) < 0.4 && player.feedbackTime > 0) {
    if (player.feedback === 'hurt') return player.feedbackTime > 0.8 ? 'bump' : 'recover';
    if (['correct','summit'].includes(player.feedback)) return player.feedback;
  }
  if (!player?.onGround) {
    if (player?.vy < -10) return 'takeoff';
    return player?.vy < 0 ? 'rise' : 'fall';
  }
  if (player.squash > 0.08) return 'land';
  if (inputAxis && player.vx * inputAxis < -0.2) return 'brake';
  if (Math.abs(player.vx) > 0.15) return Math.floor((player.anim || 0) / 0.85) % 2 ? 'run-passing' : 'run-extended-a';
  return 'idle';
}

export function letterLeapRegisteredPose(world, player, placement, options = {}) {
  const hero = LETTER_LEAP_CAST[world] || 'bouncy';
  const action = letterLeapPose(player, options);
  const id = Object.keys(LETTER_LEAP_ATLASES).find(key => key.startsWith(hero + '-')
    && LETTER_LEAP_ATLASES[key].frames.some(frame => frame.action === action));
  const atlas = LETTER_LEAP_ATLASES[id];
  const index = atlas?.frames.findIndex(frame => frame.action === action) ?? -1;
  return { action, id, index, registration: atlas ? registeredPalCanvasPose(atlas, atlas.frames[index], placement) : null };
}

export function letterLeapFoePose(foe, { reducedMotion = false } = {}) {
  if (foe.impacted) return 'impact';
  if (reducedMotion) return 'idle';
  if (foe.type === 'hopper') return foe.y < foe.baseY - 8 ? 'travel-b' : foe.t % 1.6 < 1.45 ? 'idle' : 'travel-a';
  if (foe.type === 'spike' && foe.t % 2.4 > 2.15) return 'impact';
  return Math.floor(foe.t * (foe.type === 'flyer' ? 7 : 5)) % 2 ? 'travel-a' : 'travel-b';
}

export function createLetterLeapSceneKit(world) {
  const hero = LETTER_LEAP_CAST[world] || 'bouncy';
  const characterIds = Object.keys(LETTER_LEAP_ATLASES).filter(id => id.startsWith(hero + '-'));
  const bank = createRegisteredPalArtBank(Object.fromEntries(characterIds.map(id => [id, LETTER_LEAP_ATLASES[id]])));
  const images = new Map(), statuses = new Map(), pending = new Set();
  let disposed = false, revision = 0, horizon = null, horizonKey = '';
  bank.preload(characterIds).then(() => { revision++; });
  preloadPhysicalPalArt(world, { actions: ['tools'] }).then(() => { revision++; });
  function load(id) {
    const asset = LETTER_LEAP_SCENE_ART[id];
    if (!asset || images.has(id) || statuses.has(id)) return;
    statuses.set(id, 'pending');
    const image = new Image();
    let settled = false;
    const timer = setTimeout(() => finish(null), 10000);
    const finish = picture => {
      if (settled) return;
      settled = true; clearTimeout(timer); image.onload = image.onerror = null; pending.delete(cancel);
      if (disposed) return;
      statuses.set(id, picture ? 'delivered' : 'unavailable');
      if (picture) images.set(id, picture);
      revision++;
    };
    const cancel = () => finish(null);
    pending.add(cancel);
    image.onload = async () => {
      try {
        if (image.naturalWidth !== asset.width || image.naturalHeight !== asset.height) { finish(null); return; }
        if (image.decode) await image.decode();
        finish(image);
      } catch { finish(null); }
    };
    image.onerror = () => finish(null);
    image.src = asset.runtime;
  }
  load('terrain'); load('action-props'); load(world + '-horizon'); load(world + '-foes');
  const getPose = (player, options) => {
    const pose = letterLeapRegisteredPose(world, player, { height: 76 }, options);
    return { action: pose.action, id: pose.id, index: pose.index };
  };
  const terrain = LETTER_LEAP_SCENE_ART.terrain.frames.find(frame => frame.world === world);
  function drawLedge(ctx, x, y, width, { bodyHeight = 38, deep = false, viewLeft = x, viewRight = x + width } = {}) {
    const image = images.get('terrain');
    if (!image || !terrain || width <= 0) return false;
    const [sx, sy, sw, sh] = terrain.rect;
    const footDepth = sy + sh - terrain.walkLine;
    const scale = bodyHeight / footDepth;
    const capWidth = Math.min(width * 0.24, terrain.cap * scale * 0.65);
    const top = y - (terrain.walkLine - sy) * scale;
    const height = sh * scale;
    if (x + capWidth > viewLeft) ctx.drawImage(image, sx, sy, terrain.cap, sh, x, top, capWidth, height);
    const middleWidth = Math.max(0.01, width - capWidth * 2);
    const sourceMiddle = sw - terrain.cap * 2;
    const repeatWidth = Math.min(sourceMiddle, 720) * scale;
    const firstOffset = Math.max(0, Math.floor((viewLeft - x - capWidth) / repeatWidth) * repeatWidth);
    for (let offset = firstOffset; offset < Math.min(middleWidth, viewRight - x - capWidth); offset += repeatWidth) {
      const targetWidth = Math.min(repeatWidth, middleWidth - offset);
      ctx.drawImage(image, sx + terrain.cap, sy, Math.min(sourceMiddle, targetWidth / scale), sh,
        x + capWidth + offset, top, targetWidth, height);
    }
    if (x + width - capWidth < viewRight) ctx.drawImage(image, sx + sw - terrain.cap, sy, terrain.cap, sh, x + width - capWidth, top, capWidth, height);
    if (deep && deep > bodyHeight) {
      const tileHeight = Math.max(1, sy + sh - terrain.walkLine - 60);
      const tileWidth = Math.min(260, sw - terrain.cap * 2);
      const size = Math.min(136, width);
      for (let row = bodyHeight - 2; row < deep; row += tileHeight * scale) {
        const targetHeight = Math.min(tileHeight * scale, deep - row);
        const firstTile = Math.max(0, Math.floor((viewLeft - x) / size) * size);
        for (let offset = firstTile; offset < Math.min(width, viewRight - x); offset += size) {
          const targetWidth = Math.min(size, width - offset);
          ctx.drawImage(image, sx + terrain.cap, terrain.walkLine + 58, tileWidth * targetWidth / size,
            tileHeight * targetHeight / (tileHeight * scale), x + offset, y + row, targetWidth, targetHeight);
        }
      }
    }
    return true;
  }
  function drawProp(ctx, id, { x, y, width, height, foot = false } = {}) {
    const image = images.get('action-props');
    const frame = LETTER_LEAP_SCENE_ART['action-props'].frames.find(item => item.id === id);
    if (!image || !frame) return false;
    const [sx, sy, sw, sh] = frame.rect;
    if (frame.solidBase) {
      const [bx, by, bw, bh] = frame.solidBase;
      const scaleX = width / bw, scaleY = height / bh;
      ctx.drawImage(image, sx, sy, sw, sh, x - (bx - sx) * scaleX, y - (by - sy) * scaleY, sw * scaleX, sh * scaleY);
    } else ctx.drawImage(image, sx, sy, sw, sh, x, foot ? y - height : y, width, height);
    return true;
  }
  return {
    heroName: NAMES[hero],
    drawFoe(ctx, foe, options = {}) {
      const image = images.get(world + '-foes');
      const atlas = LETTER_LEAP_FOE_ATLASES[world + '-' + foe.type];
      if (!image || !atlas) return false;
      const action = letterLeapFoePose(foe, options);
      const frame = atlas.frames.find(item => item.action === action);
      return drawRegisteredPalFrame(ctx, image, atlas, frame, {
        x: foe.x, y: foe.y + 22, height: foe.type === 'flyer' ? 40 : 46, mirror: foe.dir < 0
      });
    },
    drawHero(ctx, player, { height, inputAxis = 0, time = 0 } = {}) {
      const pose = getPose(player, { inputAxis });
      const placement = { x: player.x, y: player.y + player.h / 2, height, mirror: player.face < 0 };
      if (pose.id && bank.draw(ctx, pose.id, pose.index, placement)) return { ...pose, registration: bank.pose(pose.id, pose.index, placement), delivered: true };
      const delivered = drawPhysicalPalArt(ctx, {
        world, x: placement.x, y: placement.y, height, direction: player.face < 0 ? 'left' : 'right',
        time, moving: player.onGround && Math.abs(player.vx) > 0.15, action: player.onGround ? 'locomotion' : 'jump'
      });
      return { ...pose, delivered, fallback: true };
    },
    heroPose(player, placement, options) {
      const pose = getPose(player, options);
      return pose.id ? { ...pose, registration: bank.pose(pose.id, pose.index, placement) } : pose;
    },
    drawLedge, drawProp,
    revision: () => revision,
    hasHorizon: () => images.has(world + '-horizon'),
    drawHorizon(ctx, { width, height, camera }) {
      const image = images.get(world + '-horizon');
      if (!image) return false;
      const imageWidth = image.width / image.height * height;
      const density = Math.max(1, Math.abs(ctx.getTransform?.().a || 1));
      const key = `${height}:${density}`;
      if (key !== horizonKey) {
        horizonKey = key;
        horizon ||= document.createElement('canvas');
        horizon.width = Math.ceil(imageWidth * density); horizon.height = Math.ceil(height * density);
        horizon.getContext('2d').drawImage(image, 0, 0, horizon.width, horizon.height);
      }
      const shift = camera * 0.12;
      for (let i = Math.floor(shift / imageWidth); i * imageWidth - shift < width; i++) {
        const x = i * imageWidth - shift;
        ctx.save();
        if (((i % 2) + 2) % 2) { ctx.translate(x + imageWidth, 0); ctx.scale(-1, 1); ctx.drawImage(horizon, 0, 0, imageWidth, height); }
        else ctx.drawImage(horizon, x, 0, imageWidth, height);
        ctx.restore();
      }
      return true;
    },
    delivery: () => ({ hero: bank.delivery(), continuity: physicalPalArtDelivery(world), scenery: Object.fromEntries(statuses) }),
    dispose() { if (disposed) return; disposed = true; for (const cancel of [...pending]) cancel(); bank.dispose(); images.clear(); statuses.clear(); if (horizon) horizon.width = horizon.height = 1; horizon = null; }
  };
}
