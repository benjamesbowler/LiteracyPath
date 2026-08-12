import { APPROVED_FOUNDATION_SKILL_IDS, mathsSkillById } from "../curriculum/mathsSkillTree.js";
import { MATHS_CONTENT_VERSION } from "../learn/mathsActivityRecipes.js";

export const MATHS_ASSESSMENT_BLUEPRINTS = Object.freeze([
  "count_collection", "quick_quantity", "make_quantity", "compare_quantities", "part_whole"
]);

const SKILL_BLUEPRINT = Object.freeze({
  "F-N-SEQ-20": "make_quantity",
  "F-N-COUNT-10": "count_collection",
  "F-N-COUNT-20": "count_collection",
  "F-N-SUBITISE-5": "quick_quantity",
  "F-N-MATCH": "make_quantity",
  "F-N-COMPARE": "compare_quantities",
  "F-N-PART-5": "part_whole",
  "F-N-PART-10": "part_whole"
});

const REPRESENTATIONS = Object.freeze({
  count_collection: ["objects", "structured_frame"],
  quick_quantity: ["five_frame", "scattered_dots"],
  make_quantity: ["frame", "counter_tray"],
  compare_quantities: ["matched_rows", "structured_frames"],
  part_whole: ["part_whole", "two_colour_frame"]
});

const MISCONCEPTIONS = Object.freeze({
  count_collection: ["one_to_one", "cardinality", "unstable_order"],
  quick_quantity: ["counts_all", "canonical_pattern_only"],
  make_quantity: ["numeral_only_recognition", "cardinality"],
  compare_quantities: ["spatial_extent_bias", "more_means_bigger_objects"],
  part_whole: ["whole_part_confusion", "single_partition_only"]
});

function maximumForSkill(skillId) {
  if (["F-N-COUNT-20", "F-N-COMPARE", "F-N-SEQ-20"].includes(skillId)) return 20;
  if (skillId === "F-N-PART-5" || skillId === "F-N-SUBITISE-5") return 5;
  return 10;
}
function quantitiesFor(skillId, index) {
  const maximum = maximumForSkill(skillId);
  const target = 1 + (index * 7) % maximum;
  const other = Math.max(0, Math.min(maximum, target + ([1, -1, 2, -2][index % 4])));
  const partA = index % (target + 1);
  return { target, other: other === target ? Math.max(0, target - 1) : other, partA, partB: target - partA, maximum };
}

function promptFor(blueprint, values) {
  if (blueprint === "count_collection") return `Count the collection. How many are there altogether?`;
  if (blueprint === "quick_quantity") return `Look briefly. How many did you see?`;
  if (blueprint === "make_quantity") return `Show ${values.target}.`;
  if (blueprint === "compare_quantities") return `Which group has more, or are they the same?`;
  return `The whole is ${values.target}. One part is ${values.partA}. Make the missing part.`;
}

function expectedFor(blueprint, values) {
  if (blueprint === "compare_quantities") return values.target > values.other ? "a" : values.target < values.other ? "b" : "same";
  if (blueprint === "part_whole") return values.partB;
  return values.target;
}

function makeModel(skillId, modelIndex) {
  const blueprintId = SKILL_BLUEPRINT[skillId];
  const values = quantitiesFor(skillId, modelIndex);
  const representationFamilies = REPRESENTATIONS[blueprintId];
  const surfaceVariants = Array.from({ length: 4 }, (_, variantIndex) => Object.freeze({
    id: `v${variantIndex + 1}`,
    objectFamily: ["meadow_stones", "buttons", "leaves", "shells"][variantIndex],
    arrangement: ["row", "arc", "cluster", "frame"][variantIndex],
    promptText: promptFor(blueprintId, values)
  }));
  return Object.freeze({
    id: `${skillId.toLowerCase()}-${blueprintId}-${String(modelIndex + 1).padStart(2, "0")}`,
    skillId,
    skillLabel: mathsSkillById[skillId].childLabel,
    blueprintId,
    values: Object.freeze(values),
    expected: expectedFor(blueprintId, values),
    representationFamilies,
    surfaceVariants: Object.freeze(surfaceVariants),
    misconceptionRules: MISCONCEPTIONS[blueprintId],
    contentVersion: MATHS_CONTENT_VERSION
  });
}

export const mathsAssessmentBank = Object.freeze(
  APPROVED_FOUNDATION_SKILL_IDS.flatMap(skillId => Array.from({ length: 20 }, (_, index) => makeModel(skillId, index)))
);

export function assessmentModelsForSkill(skillId) {
  return mathsAssessmentBank.filter(model => model.skillId === skillId);
}

export function materializeAssessmentItem(model, variantIndex = 0) {
  const variant = model.surfaceVariants[Math.abs(variantIndex) % model.surfaceVariants.length];
  const representation = model.representationFamilies[Math.abs(variantIndex) % model.representationFamilies.length];
  const renderSpec = Object.freeze({
    blueprintId: model.blueprintId,
    representation,
    objectFamily: variant.objectFamily,
    arrangement: variant.arrangement,
    target: model.values.target,
    other: model.values.other,
    partA: model.values.partA,
    partB: model.values.partB,
    maximum: model.values.maximum
  });
  return Object.freeze({
    ...model,
    itemKey: `${model.id}:${variant.id}`,
    modelIndex: Number(model.id.slice(model.id.lastIndexOf("-") + 1)),
    promptText: variant.promptText,
    representation,
    renderSpec,
    surface: variant
  });
}

export function classifyMathsResponse(item, response) {
  const normalized = typeof item.expected === "number" ? Number(response) : String(response);
  const correct = normalized === item.expected;
  if (correct) return Object.freeze({ correct: true, classification: "correct", observedSignals: [], misconceptionCodes: [] });
  const difference = typeof item.expected === "number" && Number.isFinite(normalized)
    ? normalized - item.expected
    : null;
  let classification = "other_incorrect_response";
  if (response === "" || response === null || response === undefined) classification = "not_checked";
  else if (difference === 1 || difference === -1) classification = "off_by_one_response";
  else if (item.blueprintId === "compare_quantities") classification = "comparison_choice_mismatch";
  else if (item.blueprintId === "part_whole") classification = "missing_part_mismatch";
  const observedSignals = classification === "not_checked" ? [] : [classification];
  return Object.freeze({ correct: false, classification, observedSignals, misconceptionCodes: [] });
}

function shuffledWithExpectedAt(options, expected, slot) {
  const rest = options.filter(option => option !== expected);
  const result = [...rest];
  result.splice(Math.max(0, Math.min(result.length, slot)), 0, expected);
  return Object.freeze(result);
}

export function assessmentOptionsForItem(item) {
  const slot = Number.isInteger(item.answerSlot) ? item.answerSlot : 1;
  if (item.blueprintId === "compare_quantities") {
    return shuffledWithExpectedAt(["a", "same", "b"], item.expected, slot);
  }
  const expected = Number(item.expected);
  const maximum = Number(item.values?.maximum || 20);
  const candidates = [expected - 1, expected + 1, expected - 2, expected + 2, 0, maximum]
    .filter(value => Number.isInteger(value) && value >= 0 && value <= maximum && value !== expected);
  const unique = [...new Set(candidates)].slice(0, 2);
  while (unique.length < 2) {
    const fallback = (expected + unique.length + 3) % (maximum + 1);
    if (fallback !== expected && !unique.includes(fallback)) unique.push(fallback);
  }
  return shuffledWithExpectedAt([expected, ...unique], expected, slot);
}

export function buildMathsAssessmentRound({ skillId, seed = "foundation", length = 6 } = {}) {
  const models = assessmentModelsForSkill(skillId);
  if (!models.length) return [];
  let state = [...String(seed)].reduce((value, character) => ((value * 33) ^ character.charCodeAt(0)) >>> 0, 5381);
  const available = [...models];
  const round = [];
  const slotOffset = state % 3;
  while (available.length && round.length < Math.min(length, models.length)) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const index = state % available.length;
    const [model] = available.splice(index, 1);
    round.push(Object.freeze({
      ...materializeAssessmentItem(model, state % 4),
      answerSlot: (slotOffset + round.length) % 3
    }));
  }
  return Object.freeze(round);
}
