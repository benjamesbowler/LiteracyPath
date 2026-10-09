import { SOUND_BEAT_ART } from './soundBeatArtData.js';
import { SOUND_BEAT_POSES, createSoundBeatPerformanceArt, soundBeatMusicalPose } from './soundBeatPerformanceArt.js';

const WORLD_ROW = { meadow: 0, dino: 1, moonwood: 2 };

function ownedImage(asset) {
  const picture = new Image();
  let disposed = false, status = 'pending', ticket = 0, cancel;
  function load() {
    if (disposed) return Promise.resolve(false);
    cancel?.(); status = 'pending'; const current = ++ticket;
    return new Promise(resolve => {
      let settled = false;
      const finish = delivered => {
        if (settled) return; settled = true; clearTimeout(timer);
        if (!disposed && current === ticket) { status = delivered ? 'delivered' : 'unavailable'; picture.onload = picture.onerror = null; }
        resolve(delivered && !disposed);
      };
      const timer = setTimeout(() => finish(false), 10000); cancel = () => finish(false);
      picture.onload = async () => {
        try { if (typeof picture.decode === 'function') await picture.decode(); }
        catch { finish(false); return; }
        finish(!disposed && current === ticket && picture.naturalWidth === asset.width && picture.naturalHeight === asset.height);
      };
      picture.onerror = () => finish(false);
      picture.src = ''; picture.src = asset.runtime;
    });
  }
  void load();
  return { picture, retry: load, ready: () => status === 'delivered', status: () => disposed ? 'disposed' : status,
    dispose: () => { disposed = true; ticket += 1; cancel?.(); picture.onload = picture.onerror = null; picture.src = ''; } };
}

export function createSoundBeatWorld(world) {
  const art = createSoundBeatPerformanceArt(world);
  const kitAsset = SOUND_BEAT_ART['instrument-kit-v1'];
  const kit = kitAsset && ownedImage(kitAsset);
  const venueAsset = SOUND_BEAT_ART[`${world}-concert-venue-v1`];
  const venue = venueAsset && ownedImage(venueAsset);
  const scene = { world, actors: [], contacts: [], arrangement: 0 };

  function drawBackground(ctx, width, height) {
    if (!venue?.ready()) return false;
    const scale = Math.max(width / venueAsset.width, height / venueAsset.height);
    const drawnWidth = venueAsset.width * scale, drawnHeight = venueAsset.height * scale;
    ctx.drawImage(venue.picture, (width - drawnWidth) / 2, (height - drawnHeight) / 2, drawnWidth, drawnHeight);
    return true;
  }

  function prop(ctx, index, x, y, width, pressure = 0) {
    if (!kit?.ready()) return false;
    const frame = kitAsset.frames[index], [left, top, right, bottom] = frame.cell;
    const height = (bottom - top) / (right - left) * width;
    const compression = 1 - Math.min(0.045, pressure * 0.045);
    ctx.drawImage(kit.picture, left, top, right - left, bottom - top, x - width / 2, y - height * compression, width, height * compression);
    return true;
  }

  function drum(ctx, target, width, pressure, row) {
    const frame = kitAsset?.frames[row * 4];
    // Measured membrane centre is17% below the full drum's source top.
    const drumHeight = frame ? (frame.cell[3] - frame.cell[1]) / (frame.cell[2] - frame.cell[0]) * width : width;
    const baseline = target.y + drumHeight * 0.83;
    if (prop(ctx, row * 4, target.x, baseline, width, pressure)) return;
    ctx.fillStyle = '#bd8750'; ctx.strokeStyle = '#614326'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(target.x - width / 2, target.y, width, drumHeight * 0.83, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f3e8c7'; ctx.beginPath(); ctx.ellipse(target.x, target.y, width / 2, width * 0.16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  function mallet(ctx, grip, tip, size, row) {
    const angle = Math.atan2(tip.y - grip.y, tip.x - grip.x), length = Math.hypot(tip.x - grip.x, tip.y - grip.y);
    ctx.save(); ctx.translate(grip.x, grip.y); ctx.rotate(angle - Math.PI / 2);
    ctx.strokeStyle = row === 1 ? '#b88439' : '#8a6039'; ctx.lineWidth = Math.max(3, size * 0.032); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -size * 0.025); ctx.lineTo(0, length); ctx.stroke();
    // The separately authored mallet-head crop retains painted wood/crystal.
    if (kit?.ready()) {
      const [left, top, right, bottom] = kitAsset.frames[row * 4 + 1].cell;
      ctx.drawImage(kit.picture, left, top, right - left, Math.min(bottom - top, (right - left) * 0.95), -size * 0.07, length - size * 0.067, size * 0.14, size * 0.14);
    } else { ctx.fillStyle = row === 2 ? '#849bd5' : '#644531'; ctx.beginPath(); ctx.arc(0, length, size * 0.066, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  function draw(ctx, state, w, h, now, reducedMotion) {
    const row = WORLD_ROW[world] || 0, portrait = w < h;
    const height = Math.min(250, h * 0.35, w * (portrait ? 0.29 : 0.2));
    const footY = h * (portrait ? 0.59 : 0.63);
    scene.actors = []; scene.contacts = []; scene.arrangement = state.stage;
    const spacing = 60 / (state.roundBpm || state.level.bpm);
    const targetTime = state.noteStart + state.beatIndex * spacing;
    for (let actorIndex = 0; actorIndex < 2; actorIndex += 1) {
      const character = art.characters[actorIndex], mirror = actorIndex === 1;
      const x = w * (portrait ? (actorIndex ? 0.82 : 0.18) : (actorIndex ? 0.88 : 0.12));
      const placement = { x, y: footY, height, mirror };
      const pose = soundBeatMusicalPose({ character, actorIndex, lane: state.currentTask.item.lanes[state.beatIndex] ?? 0, targetTime, now,
        input: state.lastPadEvent, missAt: state.lastMissAt, phraseAt: state.phraseActionAt, roundStartAt: state.roundStartAt, spacing,
        section: state.stage, musicEnabled: state.musicEnabled, reducedMotion });
      ctx.fillStyle = 'rgba(24,34,53,.25)'; ctx.beginPath(); ctx.ellipse(x, footY + 3, height * 0.42, Math.max(4, height * 0.07), 0, 0, Math.PI * 2); ctx.fill();
      const delivered = pose && art.has(pose.atlas) && art.draw(ctx, pose.atlas, pose.frame, placement);
      if (!delivered) {
        const fallback = state.performers?.[actorIndex];
        if (fallback?.complete && fallback.naturalWidth) ctx.drawImage(fallback, x - height * fallback.naturalWidth / fallback.naturalHeight / 2, footY - height, height * fallback.naturalWidth / fallback.naturalHeight, height);
        scene.actors.push({ character, delivered: false, action: 'source-fallback' });
        continue;
      }
      const registered = art.pose(pose.atlas, pose.frame, placement);
      const definitions = SOUND_BEAT_POSES[character];
      const tools = [];
      for (const hand of Object.keys(definitions.contact)) {
        const contact = art.pose(pose.atlas, definitions.contact[hand], placement).sockets[hand];
        const outward = contact.x >= x ? 1 : -1;
        const target = definitions.direct ? { ...contact } : { x: contact.x + outward * height * 0.12, y: contact.y + height * 0.196 };
        const grip = registered.sockets[hand];
        const selected = pose.limb === hand;
        const pressure = selected && pose.contact ? 1 - Math.min(1, pose.phase / 0.23) : 0;
        drum(ctx, target, height * 0.34, pressure, row);
        const tip = definitions.direct ? grip : selected && pose.contact ? target : { x: grip.x + outward * height * 0.09, y: grip.y - height * (pose.action === 'anticipation' || pose.action.includes('preparation') ? 0.2 : 0.14) };
        tools.push({ limb: hand, grip, tip, target, contact: selected && pose.contact });
      }
      if (definitions.direct) art.draw(ctx, pose.atlas, pose.frame, placement);
      else for (const tool of tools) mallet(ctx, tool.grip, tool.tip, height, row);
      // Small hoof grip overlay is the original source hand, not a fake limb.
      for (const tool of tools) {
        ctx.save(); ctx.beginPath(); ctx.arc(tool.grip.x, tool.grip.y, height * 0.065, 0, Math.PI * 2); ctx.clip();
        art.draw(ctx, pose.atlas, pose.frame, placement); ctx.restore();
      }
      scene.actors.push({ character, delivered: true, ...pose, sockets: registered.sockets });
      scene.contacts.push(...tools.map(tool => ({ character, ...tool, separation: Math.hypot(tool.tip.x - tool.target.x, tool.tip.y - tool.target.y) })));
      if (state.stage >= 4 && !portrait) prop(ctx, row * 4 + 2, x + (actorIndex ? -1 : 1) * height * 0.63, footY + 10, height * 0.35);
      if (state.stage >= 2) prop(ctx, row * 4 + 3, x + (actorIndex ? 1 : -1) * height * 0.45, footY + height * 0.23, height * 0.28);
    }
  }

  function inspect() {
    const actorArt = art.delivery();
    const snapshot = structuredClone({ ...scene, actorArt, kit: kit?.status() || 'unavailable',
      venue: venue?.status() || 'unavailable', backgroundSrc: venueAsset?.runtime,
      recoveryNeeded: needsRecovery() });
    const freeze = value => {
      if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
      return value;
    };
    return freeze(snapshot);
  }
  function needsRecovery() {
    const delivery = art.delivery();
    return venue?.status() === 'unavailable' || kit?.status() === 'unavailable' || art.characters.some(character => delivery[`${character}-music-performance-v1`] === 'unavailable');
  }
  return { deliveryRevision: () => JSON.stringify([art.delivery(),kit?.status(),venue?.status()]), draw, drawBackground, inspect, needsRecovery, reload: () => Promise.all([art.reload(), kit?.retry(), venue?.retry()]), dispose: () => { art.dispose(); kit?.dispose(); venue?.dispose(); } };
}
