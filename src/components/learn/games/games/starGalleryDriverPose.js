import { registeredPalCanvasPose, registeredPalFrameGeometry } from '../shared/registeredPalArt.js';

const drivers = { meadow: 'bouncy-driver', dino: 'chompy-driver', moonwood: 'pip-driver' };

// Selection follows physical steering, cutter action and recovery state. The
// printed repair and whether a choice is correct never select a driver pose.
export function groveDriverAction({ recoveryRemaining = 0, cutterRemaining = 0, steer = 0 } = {}) {
  if (recoveryRemaining > 0) return 'recover';
  if (cutterRemaining > .16) return 'lever-anticipation';
  if (cutterRemaining > 0) return 'lever-contact';
  if (steer < -.12) return 'steer-left';
  if (steer > .12) return 'steer-right';
  return 'ready';
}

export function groveDriverFrame(atlases, world, action) {
  const key = drivers[world] || drivers.meadow, atlas = atlases[key];
  const index = atlas?.frames.findIndex(frame => frame.action === action) ?? -1;
  return index < 0 ? null : { key, atlas, index, frame: atlas.frames[index] };
}

// The source anchor is the visible seat/belt contact, not fabricated soles.
// This same registration feeds both Three billboard geometry and Canvas.
export function groveDriverCanvasPose(atlases, world, action, placement) {
  const selected = groveDriverFrame(atlases, world, action);
  return selected ? { ...selected, pose: registeredPalCanvasPose(selected.atlas, selected.frame, placement) } : null;
}

export function groveDriverWorldPose(atlases, world, action, { seat, scale = 1, right = { x: 1, y: 0, z: 0 }, up = { x: 0, y: 1, z: 0 } }) {
  const selected = groveDriverFrame(atlases, world, action);
  if (!selected || !seat || !Number.isFinite(scale) || scale <= 0) return null;
  const geometry = registeredPalFrameGeometry(selected.atlas, selected.frame);
  return { ...selected, geometry, seat: { ...seat }, sockets: Object.fromEntries(Object.entries(geometry.sockets).map(([name, point]) =>
    [name, Object.fromEntries(['x', 'y', 'z'].map(axis => [axis, seat[axis] + (point[0] * right[axis] + point[1] * up[axis]) * scale]))])) };
}

export function groveVisibleControlContacts(pose, action) {
  const seat = pose?.sockets?.seat, left = pose?.sockets?.leftHand, right = pose?.sockets?.rightHand;
  if (!seat || !left || !right) return null;
  if (action.startsWith('lever-')) return { wheelContacts: [{ ...left }], leverGrip: { ...right }, seat: { ...seat } };
  return { wheelContacts: [{ ...left }, { ...right }], leverGrip: null, seat: { ...seat } };
}
