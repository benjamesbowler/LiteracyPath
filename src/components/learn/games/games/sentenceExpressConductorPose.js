import { registeredPalCanvasPose } from '../shared/registeredPalArt.js';

const ids = { meadow: 'bouncy-conductor', dino: 'chompy-conductor', moonwood: 'pip-conductor' };

// Real yard actions select the pose. The sentence model, correct carriage and
// expected repair are never inputs to the renderer's action selection.
export function sentenceExpressConductorAction({ departing = false, recovering = false, coupling = false,
  needsEngine = false, canSend = false } = {}) {
  if (recovering) return 'recover';
  if (departing) return 'wave';
  if (coupling) return 'couple-low';
  if (needsEngine) return 'point';
  if (canSend) return 'send-ready';
  return 'ready';
}

export function sentenceExpressConductorFrame(atlases, world, action) {
  const key = ids[world], atlas = atlases[key], index = atlas?.frames.findIndex(frame => frame.action === action) ?? -1;
  return index < 0 ? null : { key, atlas, index, frame: atlas.frames[index] };
}

// The source palm and real rail/coupler determine the body's scale and origin.
// A target that cannot fit a readable unstretched conductor fails the contact
// pose rather than clamping it and reporting an invented attachment.
export function sentenceExpressCouplingPose(atlases, world, { coupler, railY, minHeight = 72, maxHeight = 164, mirror = false }) {
  const selected = sentenceExpressConductorFrame(atlases, world, 'couple-low');
  if (!selected || !Number.isFinite(coupler?.x) || !Number.isFinite(coupler?.y) || !Number.isFinite(railY) || railY <= coupler.y) return null;
  const base = registeredPalCanvasPose(selected.atlas, selected.frame, { x: 0, y: 0, height: selected.atlas.nominalHeight, mirror });
  const palm = base.sockets.nearHand;
  if (!palm || palm.y >= 0) return null;
  const unitScale = (railY - coupler.y) / -palm.y, height = unitScale * selected.atlas.nominalHeight;
  if (height < minHeight || height > maxHeight) return null;
  const placement = { x: coupler.x - palm.x * unitScale, y: railY, unitScale, mirror };
  const pose = registeredPalCanvasPose(selected.atlas, selected.frame, placement);
  return { ...selected, placement, pose, height, contact: { target: { ...coupler }, palm: { ...pose.sockets.nearHand }, railY },
    representation: 'source-measured-coupling-contact' };
}
