import { APPROVED_FOUNDATION_SKILL_IDS, mathsSkillById } from "../curriculum/mathsSkillTree.js";
import { MATHS_CONTENT_VERSION } from "../learn/mathsActivityRecipes.js";

export const MATHS_ASSESSMENT_BLUEPRINTS = Object.freeze([
  "number_sequence",
  "count_collection",
  "quick_quantity",
  "make_quantity",
  "compare_quantities",
  "part_whole"
]);

const BLUEPRINT_BY_SKILL = Object.freeze({
  "F-N-SEQ-20": "number_sequence",
  "F-N-COUNT-10": "count_collection",
  "F-N-COUNT-20": "count_collection",
  "F-N-SUBITISE-5": "quick_quantity",
  "F-N-MATCH": "make_quantity",
  "F-N-COMPARE": "compare_quantities",
  "F-N-PART-5": "part_whole",
  "F-N-PART-10": "part_whole"
});

const BLUEPRINT_META = Object.freeze({
  number_sequence: Object.freeze({
    representations: Object.freeze(["stepping_stones", "number_line"]),
    interactionType: "select_missing_numeral",
    misconceptionRules: Object.freeze(["sequence_word_omission", "before_after_reversal"])
  }),
  count_collection: Object.freeze({
    representations: Object.freeze(["objects", "structured_frame"]),
    interactionType: "touch_count_then_select",
    misconceptionRules: Object.freeze(["one_to_one", "cardinality", "unstable_order"])
  }),
  quick_quantity: Object.freeze({
    representations: Object.freeze(["five_frame", "scattered_dots"]),
    interactionType: "brief_view_then_select",
    misconceptionRules: Object.freeze(["counts_all", "canonical_pattern_only"])
  }),
  make_quantity: Object.freeze({
    representations: Object.freeze(["frame", "counter_tray"]),
    interactionType: "construct_quantity",
    misconceptionRules: Object.freeze(["numeral_only_recognition", "cardinality"])
  }),
  compare_quantities: Object.freeze({
    representations: Object.freeze(["matched_rows", "structured_frames"]),
    interactionType: "compare_relationship",
    misconceptionRules: Object.freeze(["spatial_extent_bias", "more_means_bigger_objects"])
  }),
  part_whole: Object.freeze({
    representations: Object.freeze(["part_whole", "two_colour_frame"]),
    interactionType: "construct_missing_part",
    misconceptionRules: Object.freeze(["whole_part_confusion", "single_partition_only"])
  })
});

const OBJECT_FAMILIES = Object.freeze(["meadow_stones", "buttons", "leaves", "shells"]);
const ARRANGEMENTS = Object.freeze(["row", "arc", "cluster", "frame"]);

const sequence = (missing, sequenceValues, prompt, distractors) => ({
  target: missing,
  sequence: sequenceValues,
  prompt,
  distractors,
  maximum: 20,
  teacherEvidenceNote: "Names the missing numeral while keeping the sequence order stable."
});
const collection = (target, prompt, distractors, arrangement = "cluster") => ({
  target,
  prompt,
  distractors,
  arrangement,
  maximum: target > 10 ? 20 : 10,
  teacherEvidenceNote: "Coordinates one number word with each object and uses the final number as the total."
});
const quick = (target, prompt, distractors, pattern) => ({
  target,
  prompt,
  distractors,
  pattern,
  maximum: 5,
  teacherEvidenceNote: "Recognises the small quantity from its structure without needing a speed score."
});
const make = (target, prompt, distractors) => ({
  target,
  prompt,
  distractors,
  maximum: 10,
  teacherEvidenceNote: "Constructs a collection that matches the spoken and written numeral."
});
const compare = (left, right, prompt = "Pair the objects. Which side has more, or are they the same?") => ({
  target: left,
  other: right,
  prompt,
  distractors: [],
  maximum: 20,
  teacherEvidenceNote: "Compares quantity rather than object size, spacing or row length."
});
const part = (whole, known, prompt) => ({
  target: whole,
  partA: known,
  partB: whole - known,
  prompt,
  distractors: [Math.max(0, whole - known - 1), Math.min(whole, whole - known + 1)],
  maximum: whole,
  teacherEvidenceNote: "Keeps the whole invariant and constructs only the hidden part."
});

// These records are deliberately explicit. Changing a value or prompt is a content
// revision and requires a matching server-manifest migration.
const AUTHORED_ITEMS = Object.freeze({
  "F-N-SEQ-20": Object.freeze([
    sequence(2, [0, 1, null, 3, 4], "The stepping stone between 1 and 3 is missing. Which number belongs there?", [1, 3]),
    sequence(5, [3, 4, null, 6, 7], "Complete the path: 3, 4, blank, 6, 7.", [4, 6]),
    sequence(8, [6, 7, null, 9, 10], "Which number comes just after 7?", [7, 9]),
    sequence(11, [9, 10, null, 12, 13], "Find the missing number between 10 and 12.", [10, 12]),
    sequence(14, [12, 13, null, 15, 16], "The path jumps from 13 to a blank, then 15. What is hidden?", [13, 15]),
    sequence(17, [15, 16, null, 18, 19], "Which numeral completes 15, 16, blank, 18, 19?", [16, 18]),
    sequence(19, [17, 18, null, 20], "One stone is missing before 20. Choose it.", [18, 20]),
    sequence(4, [2, 3, null, 5, 6], "What comes one step after 3?", [3, 5]),
    sequence(7, [5, 6, null, 8, 9], "Which number sits between 6 and 8?", [6, 8]),
    sequence(10, [8, 9, null, 11, 12], "Complete the number line around 10.", [9, 11]),
    sequence(13, [11, 12, null, 14, 15], "Which number is one more than 12?", [12, 14]),
    sequence(16, [14, 15, null, 17, 18], "Find the numeral that is after 15 and before 17.", [15, 17]),
    sequence(18, [16, 17, null, 19, 20], "Complete the trail from 16 to 20.", [17, 19]),
    sequence(1, [0, null, 2, 3], "Which number belongs after 0 and before 2?", [0, 2]),
    sequence(3, [1, 2, null, 4, 5], "A card is hidden between 2 and 4. What is it?", [2, 4]),
    sequence(6, [4, 5, null, 7, 8], "Choose the missing number in 4, 5, blank, 7, 8.", [5, 7]),
    sequence(9, [7, 8, null, 10, 11], "What number comes just before 10?", [8, 10]),
    sequence(12, [10, 11, null, 13, 14], "Fill the blank: 10, 11, blank, 13, 14.", [11, 13]),
    sequence(15, [13, 14, null, 16, 17], "Which number is one more than 14?", [14, 16]),
    sequence(20, [17, 18, 19, null], "The final stepping stone comes after 19. Choose it.", [18, 19])
  ]),
  "F-N-COUNT-10": Object.freeze([
    collection(3, "Move each shell once as you count. How many shells are there altogether?", [2, 4], "row"),
    collection(6, "Count the leaves. What is the total?", [5, 7]),
    collection(9, "Touch-count the stones, then choose how many there are.", [8, 10], "arc"),
    collection(2, "How many buttons are in this small collection?", [1, 3], "row"),
    collection(8, "Count each object once. Which numeral matches the whole collection?", [7, 9]),
    collection(5, "Count the five-frame and choose the total.", [4, 6], "frame"),
    collection(10, "A full ten-frame is shown. How many counters are there?", [9, 8], "frame"),
    collection(4, "Slide each pebble into the counted space. How many altogether?", [3, 5], "row"),
    collection(7, "Count the collection without counting any object twice. What is the total?", [6, 8]),
    collection(1, "There is one object to count. Which numeral shows the total?", [0, 2], "row"),
    collection(6, "The objects are spread out. Count each one once.", [5, 7], "cluster"),
    collection(4, "Count the four spaces that are filled. What is the total?", [3, 5], "frame"),
    collection(8, "Two short rows make one collection. How many objects altogether?", [7, 9], "row"),
    collection(3, "Count the objects in the curved row. How many?", [2, 4], "arc"),
    collection(9, "Organise the collection in your mind, then choose the total.", [8, 10], "cluster"),
    collection(5, "Touch one object for each number word. What was the last number?", [4, 6], "row"),
    collection(7, "Count this new arrangement. How many are in the whole group?", [6, 8], "arc"),
    collection(2, "Count the pair. Which number card matches?", [1, 3], "row"),
    collection(10, "Check the complete collection. Choose its total.", [9, 8], "cluster"),
    collection(1, "How many spaces are filled?", [0, 2], "frame")
  ]),
  "F-N-COUNT-20": Object.freeze([
    collection(11, "Count ten first, then the extra object. How many altogether?", [10, 12], "frame"),
    collection(14, "Make a group of ten, then count on. What is the total?", [13, 15]),
    collection(18, "Count the two rows carefully. How many objects are there?", [17, 19], "row"),
    collection(12, "A full ten and two more are shown. Choose the total.", [10, 13], "frame"),
    collection(16, "Count on from ten to find the whole collection.", [15, 17]),
    collection(20, "Both ten-frames are full. How many counters are there?", [19, 18], "frame"),
    collection(13, "Count the organised collection. What is ten and three more?", [12, 14], "row"),
    collection(17, "Count each object once. Which numeral matches the total?", [16, 18], "cluster"),
    collection(15, "One ten-frame is full and five spaces are filled in the next. How many?", [14, 16], "frame"),
    collection(19, "Count ten, then count on through the remaining objects.", [18, 20], "arc"),
    collection(12, "The objects have moved into two rows. Count the same total again.", [11, 13], "row"),
    collection(17, "Find ten inside the collection, then count the extras.", [16, 18], "cluster"),
    collection(14, "How many spaces are filled across the double ten-frame?", [13, 15], "frame"),
    collection(11, "Count the larger collection and choose its numeral.", [10, 12], "arc"),
    collection(19, "There is one empty space in a double ten-frame. How many are filled?", [18, 20], "frame"),
    collection(16, "Count both groups as one collection. How many altogether?", [15, 17], "row"),
    collection(13, "Ten objects are grouped. Count on for the rest.", [12, 14], "cluster"),
    collection(18, "Two spaces are empty in a double ten-frame. How many are filled?", [17, 20], "frame"),
    collection(15, "Count the objects in the curved path. What is the total?", [14, 16], "arc"),
    collection(20, "Count the complete double ten-frame and choose the total.", [18, 19], "frame")
  ]),
  "F-N-SUBITISE-5": Object.freeze([
    quick(1, "Look at the pattern. How many did you see?", [0, 2], "single"),
    quick(3, "Look briefly. How many dots were there?", [2, 4], "two_and_one"),
    quick(5, "How many filled spaces did you see in the five-frame?", [4, 3], "full_frame"),
    quick(2, "See the pair, then choose the quantity.", [1, 3], "pair"),
    quick(4, "How many did you see without counting each one?", [3, 5], "two_and_two"),
    quick(3, "The pattern is hidden now. Which number matches it?", [2, 4], "three_diagonal"),
    quick(4, "See four as three and one. How many altogether?", [3, 5], "three_and_one"),
    quick(2, "Two dots flashed on the screen. Choose the total.", [1, 3], "diagonal_pair"),
    quick(5, "A full small pattern flashed. How many did you see?", [4, 3], "dice_five"),
    quick(1, "One dot appeared briefly. Which numeral matches?", [0, 2], "single_offset"),
    quick(4, "Look once at the five-frame. How many spaces are filled?", [3, 5], "one_empty"),
    quick(3, "See two and one more. What is the quantity?", [2, 4], "two_and_one_offset"),
    quick(2, "How many counters were in the five-frame?", [1, 3], "frame_pair"),
    quick(5, "The whole five-frame was filled. Choose the quantity.", [4, 3], "frame_full"),
    quick(1, "How many did you see in the corner of the frame?", [0, 2], "frame_single"),
    quick(3, "A three-dot pattern appeared. How many dots?", [2, 4], "triangle_three"),
    quick(5, "See four and one more. How many altogether?", [4, 3], "four_and_one"),
    quick(2, "A pair appeared in a new position. How many?", [1, 3], "pair_offset"),
    quick(4, "The pattern showed two pairs. Choose the total.", [3, 5], "two_pairs"),
    quick(1, "A single counter flashed. What quantity is that?", [0, 2], "single_centre")
  ]),
  "F-N-MATCH": Object.freeze([
    make(1, "Build a collection that matches the numeral 1.", [0, 2]),
    make(4, "Put exactly 4 counters in the frame.", [3, 5]),
    make(7, "Make the quantity named by the numeral 7.", [6, 8]),
    make(10, "Fill the model so it matches 10.", [8, 9]),
    make(3, "Build 3. Stop when the collection matches the card.", [2, 4]),
    make(8, "Show 8 with counters.", [7, 9]),
    make(5, "Make a collection for the number word five.", [4, 6]),
    make(2, "Add counters until the model shows 2.", [1, 3]),
    make(9, "Build the amount that matches 9.", [8, 10]),
    make(6, "Make exactly 6, then check the whole collection.", [5, 7]),
    make(4, "The number card says 4. Build its quantity in a new model.", [3, 5]),
    make(1, "Match this numeral with one counter.", [0, 2]),
    make(6, "Show the quantity six in the frame.", [5, 7]),
    make(9, "Make nine without adding an extra counter.", [8, 10]),
    make(2, "Build the pair that matches the numeral 2.", [1, 3]),
    make(8, "Which constructed collection matches the numeral 8? Build it.", [7, 9]),
    make(5, "Show five as a complete small group.", [4, 6]),
    make(10, "Build ten in the ten-frame.", [8, 9]),
    make(3, "Make the same quantity as the numeral 3.", [2, 4]),
    make(7, "Add or remove counters until the model matches 7.", [6, 8])
  ]),
  "F-N-COMPARE": Object.freeze([
    compare(3, 5), compare(7, 4), compare(4, 4), compare(9, 6), compare(2, 8),
    compare(10, 10, "Pair the two full groups. Which side has more, or are they the same?"),
    compare(6, 7), compare(5, 3), compare(1, 4), compare(8, 8),
    compare(12, 15, "Match one object from each group. Which larger collection has more?"),
    compare(18, 14), compare(16, 16), compare(11, 13), compare(20, 17),
    compare(15, 19), compare(14, 12), compare(17, 20), compare(13, 13), compare(19, 18)
  ]),
  "F-N-PART-5": Object.freeze([
    part(5, 1, "The whole is 5. One part is 1. Build only the hidden part."),
    part(5, 2, "Two are showing in one part of 5. How many are hidden?"),
    part(5, 3, "The whole stays 5. Build the part that goes with 3."),
    part(5, 4, "Four and a hidden part make 5. Build the hidden part."),
    part(5, 0, "One part is empty. Build the other part so the whole is 5."),
    part(5, 2, "Split 5 into 2 and another part. Make the missing part."),
    part(5, 1, "Five is split. One counter is visible. Build what is covered."),
    part(5, 4, "Keep the whole at 5. What part belongs with 4?"),
    part(5, 3, "Three are on one side. Add the hidden part to make 5."),
    part(5, 0, "No counters are in the first part. Build the missing part of 5."),
    part(5, 4, "Use the frame: 4 and what make 5?"),
    part(5, 2, "Use two colours. Two are one colour. Build the rest of 5."),
    part(5, 1, "One space is one part. Fill the other part to make 5."),
    part(5, 3, "A part of 3 is shown. Construct its partner in the whole 5."),
    part(5, 0, "Make the hidden part when zero and a part make 5."),
    part(5, 2, "The covered part and 2 make 5. Build the covered part."),
    part(5, 4, "Find the small missing part when the other part is 4."),
    part(5, 1, "Build the unknown part in 1 and something make 5."),
    part(5, 3, "Complete the five-frame when 3 are already one part."),
    part(5, 0, "The whole is still 5. Show the part paired with zero.")
  ]),
  "F-N-PART-10": Object.freeze([
    part(10, 1, "The whole is 10. One part is 1. Build the hidden part."),
    part(10, 6, "Six and a hidden part make 10. Build the hidden part."),
    part(10, 5, "Half the ten-frame is one part. Build the other part."),
    part(10, 8, "Keep the whole at 10. What part belongs with 8?"),
    part(10, 3, "Three are showing. Add the hidden part to make 10."),
    part(10, 10, "All 10 are in one part. Build the other part."),
    part(10, 4, "Four and what make 10? Construct the missing part."),
    part(10, 7, "Seven counters are one colour. Build the other colour to make 10."),
    part(10, 2, "The whole is 10 and one part is 2. Make what is covered."),
    part(10, 9, "Nine are visible in one part. Build the part that completes 10."),
    part(10, 0, "One part is empty. Build the whole missing part of 10."),
    part(10, 5, "Five and another part fill the ten-frame. Build that part."),
    part(10, 3, "Use the ten-frame to find the partner for 3."),
    part(10, 6, "Complete 10 when 6 counters are already shown."),
    part(10, 1, "Build the unknown part in 1 and something make 10."),
    part(10, 8, "Two spaces are hidden. Build the part paired with 8."),
    part(10, 4, "Show the missing part when 4 is one part of 10."),
    part(10, 7, "Keep 10 as the whole. Construct the part paired with 7."),
    part(10, 2, "Two are one part. Make the other part without changing the whole."),
    part(10, 9, "Find the one-counter part that completes 10.")
  ])
});

function surfacePrompt(blueprintId, row, objectFamily, variantIndex) {
  const representation = BLUEPRINT_META[blueprintId].representations[variantIndex % 2];
  if (blueprintId === "number_sequence") {
    const path = row.sequence.map(value => value === null ? "blank" : value).join(", ");
    return `The ${representation === "stepping_stones" ? "stepping-stone path" : "number line"} shows ${path}. Which number belongs in the blank?`;
  }
  if (blueprintId === "count_collection") {
    if (representation === "structured_frame") return "Count the filled spaces once. How many are filled altogether?";
    const names = { meadow_stones: "meadow stone", buttons: "button", leaves: "leaf", shells: "shell" };
    return `Count each ${names[objectFamily]} once. How many are in the whole collection?`;
  }
  if (blueprintId === "quick_quantity") return representation === "five_frame"
    ? "Look briefly at the five-frame. How many filled spaces did you see?"
    : "Look briefly at the dot pattern. How many dots did you see?";
  if (blueprintId === "make_quantity") return representation === "frame"
    ? `Fill exactly ${row.target} ${row.target === 1 ? "space" : "spaces"} in the frame.`
    : `Put exactly ${row.target} ${row.target === 1 ? "counter" : "counters"} in the tray.`;
  if (blueprintId === "compare_quantities") return representation === "matched_rows"
    ? "Match one object from each row. Which row has more, or are they the same?"
    : "Compare the two frames. Which frame has more, or are they the same?";
  if (representation === "part_whole") return `The whole is ${row.target}. One part is ${row.partA}. Build only the hidden part.`;
  if (row.partA === 0) return `The frame has ${row.target} spaces. No spaces are one colour. Build the other part.`;
  return `The frame has ${row.target} spaces. ${row.partA} ${row.partA === 1 ? "space is" : "spaces are"} one colour. Build the other part.`;
}

function surfaceVariantsFor(row, blueprintId) {
  return Object.freeze(OBJECT_FAMILIES.map((objectFamily, index) => Object.freeze({
    id: `v${index + 1}`,
    objectFamily,
    arrangement: row.arrangement || ARRANGEMENTS[index],
    promptText: surfacePrompt(blueprintId, row, objectFamily, index)
  })));
}

function makeModel(skillId, row, index) {
  const blueprintId = BLUEPRINT_BY_SKILL[skillId];
  const meta = BLUEPRINT_META[blueprintId];
  const target = Number(row.target);
  const other = Number.isFinite(row.other) ? Number(row.other) : Math.max(0, target - 1);
  const partA = Number.isFinite(row.partA) ? Number(row.partA) : 0;
  const partB = Number.isFinite(row.partB) ? Number(row.partB) : target - partA;
  const expected = blueprintId === "compare_quantities"
    ? target > other ? "a" : target < other ? "b" : "same"
    : blueprintId === "part_whole" ? partB : target;
  return Object.freeze({
    id: `${skillId.toLowerCase()}-${blueprintId}-${String(index + 1).padStart(2, "0")}`,
    skillId,
    skillLabel: mathsSkillById[skillId].childLabel,
    blueprintId,
    values: Object.freeze({
      target,
      other,
      partA,
      partB,
      maximum: row.maximum,
      sequence: row.sequence ? Object.freeze([...row.sequence]) : null,
      pattern: row.pattern || null
    }),
    expected,
    distractors: Object.freeze([...row.distractors]),
    interactionType: meta.interactionType,
    representationFamilies: meta.representations,
    surfaceVariants: surfaceVariantsFor(row, blueprintId),
    authoredPrompt: row.prompt,
    misconceptionRules: meta.misconceptionRules,
    teacherEvidenceNote: row.teacherEvidenceNote,
    contentVersion: MATHS_CONTENT_VERSION
  });
}

export const mathsAssessmentBank = Object.freeze(
  APPROVED_FOUNDATION_SKILL_IDS.flatMap(skillId => AUTHORED_ITEMS[skillId].map((row, index) => makeModel(skillId, row, index)))
);

export function assessmentModelsForSkill(skillId) {
  return mathsAssessmentBank.filter(model => model.skillId === skillId);
}

export function materializeAssessmentItem(model, variantIndex = 0) {
  const safeVariantIndex = Math.abs(variantIndex) % model.surfaceVariants.length;
  const variant = model.surfaceVariants[safeVariantIndex];
  const representation = model.representationFamilies[safeVariantIndex % model.representationFamilies.length];
  const renderSpec = Object.freeze({
    blueprintId: model.blueprintId,
    representation,
    objectFamily: variant.objectFamily,
    arrangement: variant.arrangement,
    target: model.values.target,
    other: model.values.other,
    partA: model.values.partA,
    partB: model.values.partB,
    maximum: model.values.maximum,
    sequence: model.values.sequence,
    pattern: model.values.pattern
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
  else if (item.blueprintId === "number_sequence") classification = "sequence_choice_mismatch";
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
  const candidates = [...(item.distractors || []), expected - 1, expected + 1, 0, maximum]
    .filter(value => Number.isInteger(value) && value >= 0 && value <= maximum && value !== expected);
  const unique = [...new Set(candidates)].slice(0, 2);
  while (unique.length < 2) {
    const fallback = (expected + unique.length + 3) % (maximum + 1);
    if (fallback !== expected && !unique.includes(fallback)) unique.push(fallback);
  }
  return shuffledWithExpectedAt([expected, ...unique], expected, slot);
}

function assessmentSignature(item) {
  return [item.blueprintId, item.representation, item.values.target, item.values.other, item.values.partA].join(":");
}

export function buildMathsAssessmentRound({ skillId, seed = "foundation", length = 6 } = {}) {
  const models = assessmentModelsForSkill(skillId);
  if (!models.length) return [];
  let state = [...String(seed)].reduce((value, character) => ((value * 33) ^ character.charCodeAt(0)) >>> 0, 5381);
  const available = [...models];
  const round = [];
  const signatures = new Set();
  const slotOffset = state % 3;
  while (available.length && round.length < Math.min(length, models.length)) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const index = state % available.length;
    const [model] = available.splice(index, 1);
    const item = materializeAssessmentItem(model, state % 4);
    const signature = assessmentSignature(item);
    if (signatures.has(signature)) continue;
    signatures.add(signature);
    round.push(Object.freeze({
      ...item,
      answerSlot: (slotOffset + round.length) % 3
    }));
  }
  return Object.freeze(round);
}
