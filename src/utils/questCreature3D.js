import { normalizeCreature } from "../data/creatureParts.js";

export const QUEST_CREATURE_JOINTS = Object.freeze([
  "root",
  "body",
  "head",
  "arm-left",
  "arm-right",
  "leg-left",
  "leg-right",
  "tail",
  "crest",
  "gear-head",
  "gear-back",
  "gear-neck",
  "gear-held"
]);

const APPEARANCE_SLOTS = Object.freeze([
  "body",
  "dye",
  "pattern",
  "eyes",
  "mouth",
  "crest",
  "tail",
  "feet"
]);

const GEAR_SLOTS = Object.freeze(["head", "back", "neck", "held"]);

export function questCreatureRigSpec(creature) {
  const normalized = normalizeCreature(creature);
  const appearance = Object.fromEntries(APPEARANCE_SLOTS.map(slot => [slot, normalized[slot]]));
  const equipment = Object.fromEntries(GEAR_SLOTS.map(slot => [slot, normalized.equipped[slot] || null]));
  const visibleParts = [
    ...APPEARANCE_SLOTS.map(slot => appearance[slot]).filter(Boolean),
    ...GEAR_SLOTS.map(slot => equipment[slot]).filter(Boolean)
  ];
  return {
    appearance,
    equipment,
    visibleParts,
    joints: [...QUEST_CREATURE_JOINTS],
    signature: [
      ...APPEARANCE_SLOTS.map(slot => `${slot}:${appearance[slot]}`),
      ...GEAR_SLOTS.map(slot => `${slot}:${equipment[slot] || "none"}`)
    ].join("|")
  };
}
