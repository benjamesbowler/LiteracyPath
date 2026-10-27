import { placeBurrowPart, walkingHeight } from '../../../../utils/burrowBuildersRules.js';

// Garden growth replaces block objects, but doesn't change the construction.
// Avoid serializing the full build on every movement/render frame.
export function burrowStructureChanged(previous, next) {
  if (previous === next) return false;
  if (!previous || previous.length !== next.length) return true;
  return next.some((block, index) => {
    const old = previous[index];
    return block !== old && ['x', 'y', 'z', 'type', 'rotation'].some(key => block[key] !== old[key]);
  });
}

// This is a dry run of the real edit, never a second placement rule. The result
// is discarded: previewing cannot spend materials, add undo entries or evidence.
export function burrowPlacementPreview(world, { free = false, reading = false } = {}) {
  const x = world.selection.x, z = world.selection.z;
  if (reading) return { kind: 'plan', valid: null, x, z, y: Math.max(0, walkingHeight(world, x, z) ?? 0), rotation: world.rotation };
  const result = placeBurrowPart(world, { free });
  const gate = result.gateOpened !== undefined && result.world.blocks.find(block => block.x === x && block.z === z && block.type === 'gate');
  const block = result.block || gate;
  return { kind: result.changed ? gate ? 'gate' : 'place' : 'blocked', valid: result.changed, x, z,
    y: block?.y ?? Math.max(0, walkingHeight(world, x, z) ?? 0), rotation: block?.rotation ?? world.rotation,
    reason: result.reason || '', label: gate ? result.gateOpened ? 'Open gate' : 'Close gate' : result.changed ? 'Ready to place' : result.reason };
}

export const burrowThumbnailPath = (theme, part) => `/game-assets/physical-arcade/burrow-builders/thumbnails/${theme}-${part}-v1.png`;
