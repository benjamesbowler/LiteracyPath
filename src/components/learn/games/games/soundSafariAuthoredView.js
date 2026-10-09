import { createRegisteredPalArtBank, registeredPalCanvasPose } from '../shared/registeredPalArt.js';
import { safariAttachedNetGeometry } from './soundSafariToolGeometry.js';
import { drawPhysicalPalFallback } from '../shared/physicalPalFallback.js';
import { fitSafariOperatorFrame, safariRecoveryAtlas, safariRetainedOperatorFrame, safariProceduralOperator,
  safariRecoveryRepresentation } from './soundSafariRecoveryArt.js';

const operators = { meadow: 'bouncy-operator-v1', dino: 'chompy-operator', moonwood: 'pip-operator' };
const species = { meadow: ['ladybird', 'butterfly', 'frog'], dino: ['triceratops', 'pterosaur', 'ankylosaur'], moonwood: ['firefly', 'owlet', 'mouse'] };

// These actions follow actual motor/feedback timers, never the expected sound.
export function safariOperatorAction({ ended = false, wordClearT = 0, judgement = '', judgementT = 0, net = {} } = {}) {
  if (ended || wordClearT > 0) return 'celebrate';
  if (judgementT > 0 && judgement === 'TRY AGAIN') return 'recover';
  if (net.swingT > .12) return 'swing';
  if (judgementT > 0 && judgement === 'CAUGHT') return 'catch';
  if (net.swingT > 0) return 'follow-through';
  return 'anticipate';
}

export function safariOperatorFrame(atlases, world, action, width, height) {
  const key = operators[world] || operators.meadow, atlas = atlases[key];
  const index = atlas?.frames.findIndex(frame => frame.action === action) ?? -1;
  if (index < 0) return null;
  const frame = atlas.frames[index], { placement, pose } = fitSafariOperatorFrame(atlas, frame, width, height);
  return { key, atlas, index, frame, placement, pose, action };
}

export function safariWildlifeFrame(atlases, world, critter, time) {
  const key = `${world}-critters`, atlas = atlases[key];
  const family = species[world] || species.meadow, animal = family[(critter.type ?? 0) % family.length];
  const action = Math.floor(time * 4 + (critter.phase || 0)) % 2 ? 'travel' : 'idle';
  const index = atlas?.frames.findIndex(frame => frame.species === animal && frame.action === action) ?? -1;
  if (index < 0) return null;
  const frame = atlas.frames[index], radius = critter.hitRadius || critter.r;
  if (!(frame.captureRadius > 0) || !(radius > 0)) return null;
  const placement = { x: critter.hitX ?? critter.x, y: critter.hitY ?? critter.y,
    unitScale: radius / frame.captureRadius * atlas.pixelsPerUnit, mirror: critter.vx < 0 };
  return { key, atlas, frame, index, placement, pose: registeredPalCanvasPose(atlas, frame, placement) };
}

function horizonAtlas(runtime, size) {
  const [width, height] = size;
  return { runtime, width, height, pixelsPerUnit: height / 2.2, nominalHeight: 2.2,
    frames: [{ id: 'complete-horizon', cell: [0, 0, width, height], anchor: [width / 2, height / 2], sockets: {} }] };
}

// Decoded assets are retained per engine. Drawing consumes the same live net
// centre/radius and wildlife positions as capture rules; no artwork decides a hit.
export function createSoundSafariAuthoredView({ atlases, horizons, horizonSizes }) {
  const allAtlases = { ...atlases, ...Object.fromEntries(Object.entries(horizons).map(([world, runtime]) =>
    [`${world}-horizon`, horizonAtlas(runtime, horizonSizes[world])])) };
  const bank = createRegisteredPalArtBank(allAtlases);
  const recoveryAtlases = Object.fromEntries(['meadow', 'dino', 'moonwood'].map(world => [world, safariRecoveryAtlas(world)]));
  const recoveryBank = createRegisteredPalArtBank(recoveryAtlases);
  let disposed = false, lastContact = null;
  return {
    deliveryRevision: () => JSON.stringify([bank.delivery(),recoveryBank.delivery()]),
    preload(world) {
      return Promise.all([bank.preload([operators[world] || operators.meadow, `${world}-critters`, 'nets-v2', `${world}-horizon`]),
        recoveryBank.preload([world])]);
    },
    drawBackground(ctx, world, width, height) {
      const key = `${world}-horizon`, atlas = allAtlases[key];
      if (!atlas || disposed) return false;
      const scale = Math.max(width / atlas.width, height / atlas.height);
      return bank.draw(ctx, key, 0, { x: width / 2, y: height / 2, unitScale: scale * atlas.pixelsPerUnit });
    },
    drawCritter(ctx, world, critter, time) {
      if (disposed) return false;
      const selected = safariWildlifeFrame(atlases, world, critter, time);
      return Boolean(selected && bank.draw(ctx, selected.key, selected.index, selected.placement));
    },
    drawOperatorAndNet(ctx, world, state, width, height, radius) {
      if (disposed) return false;
      const action = safariOperatorAction(state), delivery = bank.delivery(), recoveryDelivery = recoveryBank.delivery()[world];
      const selected = safariOperatorFrame(atlases, world, action, width, height);
      const normal = selected && delivery[selected.key] === 'delivered';
      const retained = !normal && recoveryDelivery === 'delivered' ? safariRetainedOperatorFrame(world, width, height, state.net) : null;
      const procedural = !normal && !retained ? safariProceduralOperator(world, width, height, state.time, action) : null;
      const active = normal ? selected : retained || procedural;
      const representation = normal ? 'authored-safari-action' : retained?.representation
        || safariRecoveryRepresentation(delivery[selected?.key], recoveryDelivery);
      const netAtlas = atlases['nets-v2'], netIndex = netAtlas?.frames.findIndex(frame => frame.id === `${world}-net`) ?? -1;
      if (netIndex < 0) return false;
      const geometry = safariAttachedNetGeometry({ operatorPose: active.pose, netAtlas, netFrame: netAtlas.frames[netIndex],
        centre: { x: state.net.x, y: state.net.y }, radius });
      if (!geometry) return false;
      ctx.save(); ctx.lineCap = 'round';
      for (const section of geometry.shaft.sections) {
        ctx.strokeStyle = section.material === 'brass-collar' ? '#d9a84c' : '#8c5839';
        ctx.lineWidth = section.width + 2; ctx.beginPath();
        ctx.moveTo(section.from.x, section.from.y); ctx.lineTo(section.to.x, section.to.y); ctx.stroke();
        ctx.strokeStyle = section.material === 'brass-collar' ? '#ffe6a0' : '#d6a678';
        ctx.lineWidth = section.width * .45; ctx.stroke();
      }
      ctx.translate(geometry.rotationCentre.x, geometry.rotationCentre.y); ctx.rotate(geometry.angle);
      ctx.translate(-geometry.rotationCentre.x, -geometry.rotationCentre.y);
      const netDrawn = bank.draw(ctx, 'nets-v2', netIndex, { x: state.net.x, y: state.net.y, unitScale: geometry.pose.unitScale });
      if (!netDrawn) {
        ctx.strokeStyle = '#fff3d6'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(state.net.x, state.net.y, radius, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      if (normal) bank.draw(ctx, selected.key, selected.index, selected.placement);
      else if (retained) recoveryBank.draw(ctx, world, retained.index, retained.placement);
      else drawPhysicalPalFallback(ctx, procedural.options);
      const bodyBounds = procedural?.bodyBounds || { x: active.placement.x + active.pose.destination.x,
        y: active.placement.y + active.pose.destination.y, width: active.pose.destination.width, height: active.pose.destination.height };
      lastContact = { world, action, representation, character: { meadow: 'bouncy', dino: 'chompy', moonwood: 'pip' }[world], wrist: { ...geometry.measuredWrist }, connector: { ...geometry.connector },
        captureCentre: { ...geometry.captureCentre }, captureRadius: geometry.captureRadius, shaft: structuredClone(geometry.shaft),
        netDelivery: delivery['nets-v2'], operatorDelivery: delivery[selected?.key], recoveryDelivery,
        bodyBounds, soles: procedural?.fallback.soles || [active.pose.sockets.feet].filter(Boolean) };
      return true;
    },
    inspect: () => ({ delivery: bank.delivery(), recoveryDelivery: recoveryBank.delivery(), contact: lastContact ? structuredClone(lastContact) : null, disposed }),
    dispose() { disposed = true; lastContact = null; bank.dispose(); recoveryBank.dispose(); }
  };
}
