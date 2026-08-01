import { skillTree } from "./skillTree.js";
import {
  getSkillBlueprint,
  PHASE_PASS_RULE
} from "./content/blueprints/skillBlueprints.js";

// Compatibility adapter for the few UI surfaces that still need a sitting
// length and "x of y" label. The blueprint and PHASE_PASS_RULE are the only
// rule sources; there is no second per-skill threshold table.
export const DEFAULT_PHASE_PASS_RATE = PHASE_PASS_RULE.accuracyMin;

const SKILL_ID_ALIASES = Object.freeze({
  long_vowels: "long_vowels_silent_e",
  r_controlled: "r_controlled_vowels",
  prepositions: "prepositions_of_place",
  prefix_suffix: "prefixes_suffixes",
  homophones: "homophones_homonyms",
  theme: "theme_higher_comprehension"
});

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function assessmentSkillIdFor(value = "") {
  const normalized = normalize(value);
  const treeMatch = skillTree.find(skill => skill.id === normalized || normalize(skill.label) === normalized);
  const runtimeId = treeMatch?.id || normalized;
  return SKILL_ID_ALIASES[runtimeId] || runtimeId;
}

export function getMasteryRule(skillLabelOrId = "") {
  const skillId = assessmentSkillIdFor(skillLabelOrId);
  const blueprint = getSkillBlueprint(skillId);
  const roundLength = Math.max(1, Number(blueprint?.sitting || 10));
  return {
    skillId,
    roundLength,
    passScore: Math.ceil(roundLength * PHASE_PASS_RULE.accuracyMin),
    passRate: PHASE_PASS_RULE.accuracyMin
  };
}

export const masteryRules = Object.freeze(Object.fromEntries(
  skillTree.map(skill => [skill.label, getMasteryRule(skill.id)])
));
