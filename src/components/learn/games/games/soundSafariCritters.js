import { soundSafariLayout } from '../../../../utils/soundSafariLayout.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// One authority for the current seeded moving choice wave. It does not know
// which input the child will choose and cannot award a sound or word.
export function createSoundSafariCritters(round, { difficulty, unitSlot, waveSeed, width, height }) {
  const rank = { easy: 0, medium: 1, hard: 2 }[difficulty] ?? 0;
  const speed = 1 + rank * .24 + round.stage * .045;
  const styles = rank === 0 ? ['drift', 'orbit'] : rank === 1 ? ['drift', 'orbit', 'zigzag'] : ['drift', 'orbit', 'zigzag', 'peek'];
  const labels = round.choicesBySlot[unitSlot];
  if (!labels) return [];
  const layout = soundSafariLayout(width, height, labels.length).positions;
  if (!layout.length) return [];
  const critters = labels.map((label, index) => {
    const position = layout[(index + waveSeed) % layout.length], { x, y } = position;
    const depth = clamp((y - 76) / Math.max(1, height - 164), 0, 1);
    const speedScale = speed * (.88 + (index % 4) * .12);
    return { label, x, y, homeX: x, homeY: y, depth, r: position.radius,
      plateWidth: position.plateWidth, travelX: position.travelX, travelY: position.travelY,
      vx: (index % 2 ? -1 : 1) * (7 + depth * 6 + round.stage * .75 + index) * speedScale,
      vy: (index % 3 - 1) * (3 + depth * 2.5) * speedScale,
      phase: round.stage * 1.4 + round.wordSlot * .9 + unitSlot * .6 + index * 1.7,
      wobble: 9 + depth * 7 + index, wobbleY: 5 + depth * 5 + (index % 3) * 2,
      wobbleSpeed: (.78 + index * .08 + depth * .08) * speedScale,
      orbitX: width * (.018 + (index % 3) * .012) * speedScale,
      orbitY: height * (.012 + (index % 2) * .01) * speedScale,
      moveStyle: styles[(index + round.stage + unitSlot + waveSeed) % styles.length], speedScale,
      color: index + round.stage + unitSlot, type: (index + round.stage) % 3,
      spriteFrame: (index + round.stage + unitSlot) % 4, scareT: 0, spawnT: 0, caught: false };
  });
  repositionSoundSafariCritters(critters, { width, height, previousWidth: width, previousHeight: height,
    waveSeed, needed: round.units[unitSlot] });
  return critters;
}

export function repositionSoundSafariCritters(critters, { width, height, previousWidth, previousHeight, waveSeed, needed }) {
  if (!critters.length || previousWidth < 10 || previousHeight < 10) return;
  const positions = soundSafariLayout(width, height, critters.length).positions;
  const visible = critters.map((_, index) => index).slice(0, positions.length);
  const neededIndex = critters.findIndex(critter => critter.label === needed);
  if (neededIndex >= 0 && !visible.includes(neededIndex)) visible[waveSeed % visible.length] = neededIndex;
  critters.forEach((critter, index) => {
    const slot = visible.indexOf(index);
    critter.hidden = slot < 0;
    // Screen hit bounds are recomputed by the renderer. They are not part of
    // the persisted moving animal and cannot survive a viewport change.
    delete critter.labelBox;
    if (critter.hidden) return;
    const position = positions[(slot + waveSeed) % positions.length];
    // Keep the real moving offset when the viewport changes. A resize cannot
    // teleport every visible animal to a new spawn or resurrect a caught one.
    const dx = (critter.x - critter.homeX) * width / previousWidth;
    const dy = (critter.y - critter.homeY) * height / previousHeight;
    Object.assign(critter, { x: position.x + clamp(dx, -position.travelX, position.travelX),
      y: position.y + clamp(dy, -position.travelY, position.travelY),
      homeX: position.x, homeY: position.y, r: position.radius, plateWidth: position.plateWidth,
      travelX: position.travelX, travelY: position.travelY,
      orbitX: critter.orbitX * width / previousWidth, orbitY: critter.orbitY * height / previousHeight });
  });
}
