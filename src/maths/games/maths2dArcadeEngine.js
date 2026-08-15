import { buildCountCarryLayout, buildGlimpseLayout } from "./mathsArcadeLayouts.js";

export const MATHS_2D_ENGINE_VERSION = "1.0.0";

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, Number(value) || 0));

export function mathsArcadeHash(seed) {
  return [...String(seed)].reduce((value, character) => ((value * 33) ^ character.charCodeAt(0)) >>> 0, 2166136261);
}

export function advanceArcadePosition(position, direction, elapsedMs, { minimum = 5, maximum = 95, speed = 34 } = {}) {
  const normalizedDirection = direction < 0 ? -1 : direction > 0 ? 1 : 0;
  const boundedElapsed = clamp(elapsedMs, 0, 50);
  return clamp(position + ((normalizedDirection * speed * boundedElapsed) / 1000), minimum, maximum);
}

export function createGlimpseGardenWorld(round = {}) {
  const layout = buildGlimpseLayout(round.model);
  const seed = mathsArcadeHash(`${round.id || "glimpse"}:${layout.signature}`);
  const gateOptions = [28, 50, 72];
  const gateX = gateOptions[seed % gateOptions.length];
  const playerX = gateX > 50 ? 12 : 88;
  const landmarks = Object.freeze(Array.from({ length: 7 }, (_, index) => Object.freeze({
    id: `garden-landmark-${index + 1}`,
    kind: index % 3 === 0 ? "mushroom" : index % 2 ? "reed" : "flower",
    x: 7 + (mathsArcadeHash(`${seed}:landmark:${index}`) % 87),
    scale: 0.72 + ((mathsArcadeHash(`${seed}:scale:${index}`) % 34) / 100)
  })));
  return Object.freeze({
    gateX,
    interactionRadius: 7,
    landmarks,
    layout,
    playerX,
    worldSignature: `garden:${MATHS_2D_ENGINE_VERSION}:${round.id || "round"}:${gateX}:${layout.signature}`
  });
}

export function createCountCarryWorld(round = {}, selectedPlan = "move_once") {
  const total = Math.min(20, Math.max(1, Math.trunc(Number(round.model?.total) || 1)));
  const layout = buildCountCarryLayout({ selectedPlan, total, rows: round.model?.rows });
  const seed = mathsArcadeHash(`${round.id || "carry"}:${layout.selectedPlan}:${total}`);
  const parcels = Object.freeze(Array.from({ length: total }, (_, index) => Object.freeze({
    id: `parcel-${index + 1}`,
    index,
    x: 10 + (index * 16) + ((mathsArcadeHash(`${seed}:parcel:${index}`) % 5) - 2),
    y: index % 2 ? 35 : 53
  })));
  let offset = 0;
  const groups = Object.freeze(layout.groups.map((group, groupIndex) => {
    const slots = Object.freeze(group.itemIndexes.map((_, localIndex) => Object.freeze({
      groupIndex,
      id: `delivery-slot-${offset + localIndex + 1}`,
      index: offset + localIndex,
      localIndex
    })));
    offset += group.size;
    return Object.freeze({ id: `delivery-group-${groupIndex + 1}`, label: group.label, size: group.size, slots });
  }));
  return Object.freeze({
    depotX: parcels.at(-1).x + 14,
    groups,
    interactionRadius: 6,
    layout,
    parcels,
    playerX: 4,
    worldMaximum: parcels.at(-1).x + 14,
    worldSignature: `carry:${MATHS_2D_ENGINE_VERSION}:${round.id || "round"}:${layout.layoutMode}:${layout.layoutRows.join("+")}`
  });
}

export function nextWaitingParcel(world, deliveredIndexes = [], carryingIndex = null, cartX = 0) {
  const delivered = new Set(deliveredIndexes);
  return world.parcels
    .filter(parcel => parcel.index !== carryingIndex && !delivered.has(parcel.index))
    .sort((left, right) => {
      const distanceDifference = Math.abs(left.x - cartX) - Math.abs(right.x - cartX);
      return distanceDifference || left.index - right.index;
    })[0] || null;
}

export function deliveredInGroup(deliveredCount, group, groupIndex, groups) {
  const previous = groups.slice(0, groupIndex).reduce((sum, item) => sum + item.size, 0);
  return Math.max(0, Math.min(group.size, deliveredCount - previous));
}

export function canUseArcadeTarget(position, targetPosition, radius) {
  return Math.abs(Number(position) - Number(targetPosition)) <= Number(radius);
}

export function countCarryEvidence(world, { deliveredIndexes = [], optionSlot, options = [], selectedPlan } = {}) {
  const uniqueDelivered = [...new Set(deliveredIndexes)].sort((left, right) => left - right);
  const slotIndexes = uniqueDelivered.map((_, index) => index);
  const expectedIndexes = world.parcels.map(parcel => parcel.index);
  return Object.freeze({
    component: "count_and_carry_arcade_2d",
    engineVersion: MATHS_2D_ENGINE_VERSION,
    layoutMode: world.layout.layoutMode,
    layoutRows: world.layout.layoutRows,
    movedItemIndexes: Object.freeze(uniqueDelivered),
    oneToOneValid: uniqueDelivered.length === expectedIndexes.length && uniqueDelivered.every((index, position) => index === expectedIndexes[position]),
    optionSlot,
    options: Object.freeze([...options]),
    selectedPlan: selectedPlan || world.layout.selectedPlan,
    slotIndexes: Object.freeze(slotIndexes),
    worldSignature: world.worldSignature
  });
}

export function glimpseGardenEvidence(world, { accessMode = "visual_glimpse", optionSlot, revealCount = 1 } = {}) {
  const layout = world.layout;
  return Object.freeze({
    accessMode: accessMode === "untimed_counting" ? "untimed_counting" : "visual_glimpse",
    component: "glimpse_garden_arcade_2d",
    engineVersion: MATHS_2D_ENGINE_VERSION,
    layoutSignature: layout.signature,
    optionSlot,
    parts: layout.parts,
    pattern: layout.pattern,
    renderedPattern: layout.pattern,
    renderedSlots: Object.freeze(layout.slots.map(({ cell, group, occupied, x, y }) => Object.freeze({ cell, group, occupied, x, y }))),
    revealCount: Math.max(1, Math.trunc(Number(revealCount) || 1)),
    worldSignature: world.worldSignature
  });
}
