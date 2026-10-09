import { arcadePixelRatio } from '../shared/arcadeRenderBudget.js';
import { createRegisteredPalArtBank } from '../shared/registeredPalArt.js';
import { RHYME_POP_ART } from './rhymePopArtData.js';
import { rhymeLauncherGeometry } from '../../../../utils/rhymePopMotion.js';

const worlds = { easy: 'meadow', medium: 'dino', hard: 'moonwood' };
const characters = { meadow: 'bouncy', dino: 'chompy', moonwood: 'pip' };
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));

export function rhymeLauncherBarrelTransform(parts, geometry) {
  const pivot = parts.barrelPivot, mouth = parts.barrelMuzzle;
  const scale = geometry.barrelLength / Math.hypot(mouth[0]-pivot[0], mouth[1]-pivot[1]);
  const angle = geometry.angle-Math.atan2(mouth[1]-pivot[1], mouth[0]-pivot[0]);
  const dx = (mouth[0]-pivot[0])*scale, dy = (mouth[1]-pivot[1])*scale;
  return { scale, angle, pivot, mouth: { x: geometry.pivot.x+dx*Math.cos(angle)-dy*Math.sin(angle),
    y: geometry.pivot.y+dx*Math.sin(angle)+dy*Math.cos(angle) } };
}

export function rhymePopStageLayout(width, height, count = 7) {
  const portrait = width < 520, short = height <= 420 || portrait && height <= 520;
  const radius = clamp(width * .029, portrait && !short ? 32 : 30, 44);
  const rows = portrait ? 2 : 1;
  const firstCount = rows === 2 ? Math.ceil(count / 2) : count;
  const fieldTop = portrait ? short ? 177 : 219 : short ? 150 : Math.max(194, height * .29);
  const rowGap = short ? 64 : Math.max(72, height * .16);
  const slots = Array.from({ length: count }, (_, index) => {
    const row = index < firstCount ? 0 : 1, rowCount = row === 0 ? firstCount : count - firstCount;
    const column = row ? index - firstCount : index;
    return { x: (column + .5) * width / rowCount, y: fieldTop + row * rowGap, r: radius };
  });
  return { width, height, slots, radius, portrait, short,
    heroHeight: portrait ? short ? clamp((height-286)*.95, 52, 128) : clamp(height * .22, 86, 128) : clamp(height * .28, 86, 225),
    floor: height - (portrait && short ? 2 : short ? 8 : 18),
    // One slowly circulating stadium gives every unchanged rear choice a
    // clear front route, with no answering shortcut or smaller choice bank.
    circulation: portrait ? { top: fieldTop, bend: Math.max(radius+7, rowGap/2), left: radius, right: width-radius } : null,
    cue: portrait ? { x: 8, y: 78, width: width - 16 } : { x: width * .5 - Math.min(360, width * .42) / 2, y: 8, width: Math.min(360, width * .42) } };
}

export function rhymeLauncherActionFrame(elapsed, actionAt, aimX, width, errorAt, celebrationAt) {
  if (celebrationAt != null) return elapsed - celebrationAt < .35 ? 14 : 15;
  const age = elapsed - actionAt;
  if (age >= 0 && age < .045) return 4;
  if (age >= .045 && age < .085) return 5;
  if (age >= .085 && age < .15) return 6;
  if (age >= .15 && age < .22) return 7;
  if (age >= .22 && age < .29) return 8;
  if (age >= .29 && age < .4) return 9;
  if (elapsed - errorAt < .7) return 12;
  return aimX < width * .4 ? 1 : aimX > width * .6 ? 3 : 2;
}

// Full source anatomy stays in the unoccupied strip between the two thumb
// control groups. Fit the actually selected body, including raised finale
// limbs, rather than a nominal idle rectangle or a cropped Canvas frame.
export function rhymeOperatorPlacement(art, actionId, frame, layout, geometry) {
  const placement = { x: layout.portrait ? layout.width*(layout.short ? .50 : .54)
    : geometry.pivot.x-Math.min(layout.width*.27, layout.height*.23), y: layout.floor, height: layout.heroHeight };
  if (!layout.portrait) return placement;
  const bounds = RHYME_POP_ART[actionId].frames[frame].bounds, region = { left: 136, right: layout.width-84 };
  let pose = art.pose(actionId, frame, placement);
  const bodyWidth = (bounds[2]-bounds[0])*pose.pixelScale;
  if (bodyWidth > region.right-region.left) {
    placement.height *= (region.right-region.left)/bodyWidth; pose = art.pose(actionId, frame, placement);
  }
  const left = placement.x+pose.destination.x+bounds[0]*pose.pixelScale;
  const right = placement.x+pose.destination.x+bounds[2]*pose.pixelScale;
  if (left < region.left) placement.x += region.left-left;
  else if (right > region.right) placement.x -= right-region.right;
  return placement;
}

export function createRhymePopWorld(canvas, { difficulty, onDelivery = () => {} }) {
  const world = worlds[difficulty] || 'meadow', character = characters[world];
  const actionId = `${character}-launcher-actions-v1`;
  const art = createRegisteredPalArtBank({ [actionId]: RHYME_POP_ART[actionId] });
  const ctx = canvas.getContext('2d', { alpha: false }), images = new Map(), statuses = new Map(), cancellations = new Set();
  const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  let disposed = false, scene = {}, width = 1, height = 1, ratio = 1;
  const report = () => { if (!disposed) onDelivery({ assets: Object.fromEntries(statuses), actions: art.delivery() }); };
  function load(id) {
    const asset = RHYME_POP_ART[id]; if (!asset || statuses.has(id)) return;
    statuses.set(id, 'pending'); const image = new Image(); let settled = false;
    const finish = delivered => {
      if (settled) return; settled = true; clearTimeout(timer); cancellations.delete(cancel); image.onload = image.onerror = null;
      if (disposed) return; statuses.set(id, delivered ? 'delivered' : 'unavailable');
      if (delivered) images.set(id, image);
      else if (!id.includes('-fallback-')) load(id.replace('-v1', '-fallback-v1'));
      report();
    };
    const timer = setTimeout(() => finish(false), 10000), cancel = () => finish(false); cancellations.add(cancel);
    image.onload = async () => {
      if (image.naturalWidth !== asset.width || image.naturalHeight !== asset.height) { finish(false); return; }
      try { await image.decode(); finish(true); } catch { finish(false); }
    };
    image.onerror = () => finish(false); image.src = asset.runtime;
  }
  load(`${world}-festival-v1`); load(`${world}-launcher-kit-v1`); load(`${character}-launcher-fallback-v1`);
  void art.preload([actionId]).then(report);
  function selected(name) {
    if (images.has(name)) return { image: images.get(name), asset: RHYME_POP_ART[name], primary: true };
    const fallback = name.replace('-v1', '-fallback-v1');
    return images.has(fallback) ? { image: images.get(fallback), asset: RHYME_POP_ART[fallback], primary: false } : null;
  }
  function part(kit, name, destination, index = null) {
    if (!kit) return false;
    const rect = index === null ? kit.asset.parts[name] : kit.asset.parts[name][index];
    ctx.drawImage(kit.image, rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1], destination.x, destination.y, destination.width, destination.height);
    return true;
  }
  function draw(state, at) {
    const layout = rhymePopStageLayout(width, height, state.balloons.length || state.level.visibleBalloons);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const venue = selected(`${world}-festival-v1`), kit = selected(`${world}-launcher-kit-v1`);
    ctx.fillStyle = world === 'moonwood' ? '#172b4d' : '#dbeafe'; ctx.fillRect(0, 0, width, height);
    if (venue) {
      const scale = Math.max(width / venue.asset.width, height / venue.asset.height);
      ctx.drawImage(venue.image, (width - venue.asset.width * scale) / 2, (height - venue.asset.height * scale) / 2, venue.asset.width * scale, venue.asset.height * scale);
    }
    // Decorative layers are independent of labels and correctness.
    if (kit) for (const side of [0, 1]) part(kit, 'rail', { x: side ? width - Math.min(180, width * .22) : 0, y: height - 54,
      width: Math.min(180, width * .22), height: 58 });
    for (const balloon of state.balloons) {
      const r = balloon.r, index = (balloon.id + state.stage * 3) % 5;
      const rect = kit?.asset.parts.balloons[index], face = kit?.asset.parts.faces[index];
      if (kit) {
        const scale = r * 2.12 / (rect[2] - rect[0]);
        ctx.drawImage(kit.image, rect[0], rect[1], rect[2]-rect[0], rect[3]-rect[1], balloon.x - (face[0]-rect[0])*scale,
          balloon.y - (face[1]-rect[1])*scale, (rect[2]-rect[0])*scale, (rect[3]-rect[1])*scale);
      } else {
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(balloon.x, balloon.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = '#2461db'; ctx.stroke();
      }
      const maximum = r * 1.8; let fontSize = clamp(r * .6, 16, 24);
      ctx.font = `900 ${fontSize}px Nunito,system-ui,sans-serif`;
      while (ctx.measureText(balloon.word).width > maximum && fontSize > 16) { fontSize--; ctx.font = `900 ${fontSize}px Nunito,system-ui,sans-serif`; }
      ctx.fillStyle = '#172b4d'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(balloon.word, balloon.x, balloon.y);
      if (state.keyboardBubbleId === balloon.id || state.lastWrongId === balloon.id && state.elapsed - state.errorAt < .6) {
        ctx.strokeStyle = '#2461db'; ctx.lineWidth = 3; ctx.setLineDash(state.keyboardBubbleId === balloon.id ? [5, 3] : []);
        ctx.beginPath(); ctx.arc(balloon.x, balloon.y, r + 5, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    const geometry = rhymeLauncherGeometry(width, height, state.aim);
    const frame = rhymeLauncherActionFrame(state.elapsed, state.actionAt, state.aim.x, width, state.errorAt, state.celebrationAt);
    const placement = rhymeOperatorPlacement(art, actionId, frame, layout, geometry);
    const pose = art.pose(actionId, frame, placement), pressPose = art.pose(actionId, 6, placement);
    const socket = pressPose.sockets[RHYME_POP_ART[actionId].anatomy];
    const leverBase = { x: socket.x + 4, y: layout.floor - 6 }, restGrip = { x: socket.x - 3, y: socket.y - 10 };
    const leverGrip = frame === 6 ? socket : restGrip;
    if (kit) {
      const p = kit.asset.parts, rect = p.lever, pivot = p.leverPivot, grip = p.leverGrip;
      const scale = Math.hypot(leverGrip.x-leverBase.x, leverGrip.y-leverBase.y) / Math.hypot(grip[0]-pivot[0], grip[1]-pivot[1]);
      ctx.save(); ctx.translate(leverBase.x, leverBase.y);
      ctx.rotate(Math.atan2(leverGrip.y-leverBase.y, leverGrip.x-leverBase.x)-Math.atan2(grip[1]-pivot[1], grip[0]-pivot[0]));
      ctx.drawImage(kit.image, rect[0], rect[1], rect[2]-rect[0], rect[3]-rect[1], (rect[0]-pivot[0])*scale, (rect[1]-pivot[1])*scale,
        (rect[2]-rect[0])*scale, (rect[3]-rect[1])*scale); ctx.restore();
      const baseWidth = clamp(geometry.barrelLength * .9, 52, 130);
      part(kit, 'pedestal', { x: geometry.pivot.x-baseWidth/2, y: geometry.pivot.y-2, width: baseWidth, height: geometry.supportFloor-geometry.pivot.y+2 });
      const transform = rhymeLauncherBarrelTransform(p, geometry), sourcePivot = transform.pivot, barrel = p.barrel, barrelScale = transform.scale;
      ctx.save(); ctx.translate(geometry.pivot.x, geometry.pivot.y);
      ctx.rotate(transform.angle);
      ctx.drawImage(kit.image, barrel[0], barrel[1], barrel[2]-barrel[0], barrel[3]-barrel[1], (barrel[0]-sourcePivot[0])*barrelScale,
        (barrel[1]-sourcePivot[1])*barrelScale, (barrel[2]-barrel[0])*barrelScale, (barrel[3]-barrel[1])*barrelScale); ctx.restore();
    } else {
      ctx.save(); ctx.translate(geometry.pivot.x, geometry.pivot.y); ctx.rotate(geometry.angle);
      ctx.fillStyle = '#2461db'; ctx.fillRect(-12, -geometry.barrelHeight/2, geometry.barrelLength+12, geometry.barrelHeight); ctx.restore();
    }
    const actorDelivered = art.draw(ctx, actionId, frame, placement);
    const fallbackActor = images.get(`${character}-launcher-fallback-v1`);
    if (!actorDelivered && fallbackActor) {
      const scale = layout.heroHeight/fallbackActor.height;
      ctx.drawImage(fallbackActor, placement.x-fallbackActor.width*scale/2, placement.y-layout.heroHeight, fallbackActor.width*scale, layout.heroHeight);
    }
    for (const shot of state.shots) {
      if (!reducedMotion?.matches) {
        ctx.strokeStyle = '#ffffffa8'; ctx.lineWidth = 3; ctx.beginPath();
        shot.trail.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)); ctx.stroke();
      }
      if (!part(kit, 'orb', { x: shot.x-shot.r, y: shot.y-shot.r, width: shot.r*2, height: shot.r*2 })) {
        ctx.fillStyle = '#ffcf3d'; ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.r, 0, Math.PI*2); ctx.fill();
      }
    }
    for (const burst of state.bursts) {
      const life = 1 - (state.elapsed-burst.at)/.5; if (life <= 0) continue;
      ctx.save(); ctx.globalAlpha = reducedMotion?.matches ? 1 : life;
      part(kit, 'ribbon', { x: burst.x-24, y: burst.y-20-(reducedMotion?.matches ? 0 : (1-life)*24), width: 48, height: 42 }); ctx.restore();
    }
    scene = { world, character, frameAt: at, delivered: Boolean(venue?.primary && kit?.primary && actorDelivered),
      playableFallback: Boolean(venue && kit && (actorDelivered || fallbackActor)), actor: { frame, placement, sockets: pose.sockets,
        bounds: { x: placement.x+pose.destination.x, y: placement.y+pose.destination.y, width: pose.destination.width, height: pose.destination.height }, delivered: actorDelivered },
      geometry, lever: { base: leverBase, grip: leverGrip }, contact: { active: frame === 6, rendered: actorDelivered && Boolean(kit),
        anatomicalSocket: pose.sockets[RHYME_POP_ART[actionId].anatomy] || null, separation: frame === 6 ? Math.hypot(socket.x-leverGrip.x, socket.y-leverGrip.y) : null },
      layout, assets: Object.fromEntries(statuses), actionDelivery: art.delivery() };
  }
  return {
    resize(w, h) { width = Math.max(1, w); height = Math.max(1, h); ratio = arcadePixelRatio(1.5, width, height);
      canvas.width = Math.round(width*ratio); canvas.height = Math.round(height*ratio); canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; },
    draw, inspect: () => structuredClone(scene),
    dispose() { disposed = true; art.dispose(); for (const cancel of [...cancellations]) cancel(); images.clear(); statuses.clear(); }
  };
}
