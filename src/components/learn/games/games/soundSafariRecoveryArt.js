import { PHYSICAL_PAL_ART } from '../shared/physicalPalArtData.js';
import { registeredPalCanvasPose } from '../shared/registeredPalArt.js';
import { physicalPalFallbackPose } from '../shared/physicalPalFallback.js';

const CAST = Object.freeze({ meadow: 'bouncy', dino: 'chompy', moonwood: 'pip' });
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Recovery contacts come from the current shared atlas's measured visible
// palm and opaque sole. A hidden far hand is never invented.
export const SAFARI_RECOVERY_CONTACTS = Object.freeze(Object.fromEntries(
  Object.entries(PHYSICAL_PAL_ART).map(([hero, source]) => [hero, Object.freeze(
    [6, 7].map(index => {
      const frame = source.actionAtlases.tools.frames[index];
      return Object.freeze({ nearHand: Object.freeze([...frame.rightHandPixel]),
        feet: Object.freeze([frame.cell[0] + frame.anchor[0], frame.cell[1] + frame.anchor[1]]) });
    })
  )])
));

export function safariRecoveryAtlas(world) {
  const hero = CAST[world] || CAST.meadow, source = PHYSICAL_PAL_ART[hero].actionAtlases.tools;
  return { ...source, nominalHeight: 2.2, frames: [6, 7].map((index, side) => {
    const frame = { ...source.frames[index] }; delete frame.rightHandPixel; delete frame.leftHandPixel;
    return { ...frame, id: `${hero}-safari-retained-${side ? 'left' : 'right'}`,
    action: 'retained-static-tool-grip', sockets: Object.fromEntries(
      Object.entries(SAFARI_RECOVERY_CONTACTS[hero][side]).map(([name, point]) => [name, [...point]]))
  }; }) };
}

// Original crop, aspect, palm and sole coordinates share one fit in normal and
// retained-art paths. The figure stays below chrome and above the sound rack.
export function fitSafariOperatorFrame(atlas, frame, width, height) {
  const placement = { x: Math.max(42, width * .1), y: height - 70, height: clamp(height * .24, 72, 140) };
  let pose = registeredPalCanvasPose(atlas, frame, placement);
  const availableHeight = Math.max(16, height - 88 - 70);
  if (pose.destination.height > availableHeight) {
    placement.height *= availableHeight / pose.destination.height;
    pose = registeredPalCanvasPose(atlas, frame, placement);
  }
  placement.x = clamp(placement.x, 8 - pose.destination.x, width - 8 - pose.destination.x - pose.destination.width);
  placement.y = clamp(placement.y, 88 - pose.destination.y, height - 70 - pose.destination.y - pose.destination.height);
  return { placement, pose: registeredPalCanvasPose(atlas, frame, placement) };
}

export function safariRetainedOperatorFrame(world, width, height, centre) {
  const atlas = safariRecoveryAtlas(world);
  const index = centre.x < Math.max(42, width * .1) ? 1 : 0, frame = atlas.frames[index];
  return { atlas, frame, index, ...fitSafariOperatorFrame(atlas, frame, width, height),
    character: CAST[world] || CAST.meadow, representation: 'retained-static-canonical-tool-grip' };
}

export function safariProceduralOperator(world, width, height, time, action = 'idle') {
  const bodyHeight = Math.min(clamp(height * .24, 72, 140), Math.max(16, height - 158));
  const options = { world, x: Math.max(42, width * .1, bodyHeight * .55 + 8), y: height - 70,
    height: bodyHeight, time, moving: false, direction: 'right', action: action === 'celebrate' ? 'celebrate' : 'idle' };
  const fallback = physicalPalFallbackPose(options), wrist = fallback.handSockets.rightHand;
  return { options, fallback, pose: { sockets: { nearHand: { ...wrist } } },
    bodyBounds: { x: options.x - bodyHeight * .55, y: options.y - bodyHeight, width: bodyHeight * 1.1, height: bodyHeight } };
}

export function safariRecoveryRepresentation(operatorDelivery, recoveryDelivery) {
  return operatorDelivery === 'pending' || operatorDelivery === 'not-requested'
    || recoveryDelivery === 'pending' || recoveryDelivery === 'not-requested'
    ? 'procedural-art-loading' : 'procedural-art-unavailable';
}
