import { pickupBurrowPart, placeBurrowPart, walkingHeight } from '../../../../utils/burrowBuildersRules.js';

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
export function burrowPlacementPreview(world, { free = false, reading = false, remove = false, selection = world.selection } = {}) {
  const { x, z } = selection;
  const surface = Math.max(0, walkingHeight(world, x, z) ?? 0);
  if (reading) return { kind: 'plan', valid: null, x, z, y: surface, rotation: world.rotation };
  if (remove) {
    const result = pickupBurrowPart({ ...world, selection });
    return { kind: result.changed ? 'remove' : 'blocked', valid: result.changed, x, z,
      y: result.block?.y ?? surface, rotation: world.rotation, reason: result.reason || '', label: result.changed ? 'Ready to pick up' : result.reason };
  }
  const result = placeBurrowPart(world, { free, x, z });
  const gate = result.gateOpened !== undefined && result.world.blocks.find(block => block.x === x && block.z === z && block.type === 'gate');
  const block = result.block || gate;
  return { kind: result.changed ? gate ? 'gate' : 'place' : 'blocked', valid: result.changed, x, z,
    y: block?.y ?? surface, rotation: block?.rotation ?? world.rotation,
    reason: result.reason || '', label: gate ? result.gateOpened ? 'Open gate' : 'Close gate' : result.changed ? 'Ready to place' : result.reason };
}

export function createBurrowPreview() {
  let previous, result;
  return (world, { reading, remove, selection }) => {
    const x = selection.x, z = selection.z;
    if (!previous || previous.world.islandId !== world.islandId || previous.world.blocks !== world.blocks ||
        previous.world.materials !== world.materials || previous.world.gathered !== world.gathered ||
        previous.world.selectedPart !== world.selectedPart || previous.world.rotation !== world.rotation ||
        Math.round(previous.world.player.x) !== Math.round(world.player.x) || Math.round(previous.world.player.z) !== Math.round(world.player.z) ||
        (remove && previous.world.player !== world.player) || previous.x !== x || previous.z !== z ||
        previous.reading !== reading || previous.remove !== remove) {
      result = burrowPlacementPreview(world, { free: true, reading, remove, selection });
      previous = { world, x, z, reading, remove };
    }
    return result;
  };
}

export const burrowThumbnailPath = (theme, part) => `/game-assets/physical-arcade/burrow-builders/thumbnails/${theme}-${part}-v1.png`;
