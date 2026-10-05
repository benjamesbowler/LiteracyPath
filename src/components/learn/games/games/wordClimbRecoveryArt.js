import { PHYSICAL_PAL_ART } from '../shared/physicalPalArtData.js';

// These are measured centres of the visible raised palms in the retained
// runtime-sized tools sheets. They are not offsets inferred from a sprite box.
// The common sole anchors and all source crops remain the shared authority.
export const WORD_CLIMB_RECOVERY_PALMS = Object.freeze({
  bouncy: Object.freeze([[359, 520], [769, 521]]),
  chompy: Object.freeze([[364, 538], [782, 537]]),
  pip: Object.freeze([[307, 578], [687, 563]])
});

// This older one-pose image is a Moonwood-only last retained-art recovery.
// Its visible forehand and two boots were measured on the exact 360×512 image.
// A static pose is declared as static; it never stands in for a new climb atlas.
export const WORD_CLIMB_LEGACY_PIP = Object.freeze({
  runtime: '/game-assets/sound-seekers/v3/cast/moonwood/pip-hero.webp',
  width: 360, height: 512, pixelsPerUnit: 474 / 2.2, nominalHeight: 2.2,
  frames: Object.freeze([Object.freeze({ id: 'pip-retained-static-image', action: 'static-legacy-pip',
    cell: [0, 0, 360, 512], anchor: [180, 493],
    sockets: { feet: [180, 493], grip: [249, 304], bootLeft: [96, 481], bootRight: [239, 488] } })])
});

function frame(atlas, index, hero, action, grip) {
  const source = atlas.frames[index];
  return { ...source, id: `${hero}-retained-climb-recovery-${action}`, action,
    sockets: { feet: [source.cell[0] + source.anchor[0], source.cell[1] + source.anchor[1]],
      ...(grip ? { grip: [...grip] } : {}) } };
}

export function wordClimbRecoveryAtlases(hero) {
  const source = PHYSICAL_PAL_ART[hero];
  if (!source) throw new Error(`Unknown Climb recovery character: ${hero}`);
  const tools = source.actionAtlases.tools, palms = WORD_CLIMB_RECOVERY_PALMS[hero];
  return {
    climber: { ...tools, nominalHeight: 2.2, frames: [
      frame(tools, 4, hero, 'climb-a', palms[0]), frame(tools, 5, hero, 'climb-b', palms[1]),
      frame(tools, 4, hero, 'recover-grip', palms[0]),
      frame(tools, 1, hero, 'jump-rise'), frame(tools, 1, hero, 'jump-fall'),
      frame(tools, 0, hero, 'summit-a'), frame(tools, 0, hero, 'summit-b')
    ] },
    movement: { ...source, nominalHeight: 2.2, frames: [
      frame(source, 0, hero, 'rest'), frame(source, 0, hero, 'land')
    ] }
  };
}

export function wordClimbRecoveryFrame(atlases, action) {
  const kind = atlases.movement.frames.some(item => item.action === action) ? 'movement' : 'climber';
  const index = atlases[kind].frames.findIndex(item => item.action === action);
  return index < 0 ? null : { kind, index, frame: atlases[kind].frames[index] };
}
