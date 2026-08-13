import { APPROVED_FOUNDATION_SKILL_IDS, mathsSkillById } from "../curriculum/mathsSkillTree.js";

export const MATHS_CONTENT_VERSION = "maths-foundation-number-v2";
export const MATHS_LESSON_STAGES = Object.freeze([
  "retrieve", "notice", "model", "make", "explain", "apply", "check"
]);

export const MATHS_LESSON_STAGE_COPY = Object.freeze({
  notice: "Look at the model. Choose one thing you notice before changing it.",
  explain: "Point to the model, then choose what your explanation included. Nothing is recorded.",
  check: "Change the model to show the final challenge independently, then finish the practice."
});

export const MATHS_LESSON_STAGE_GOALS = Object.freeze({
  "F-N-SEQ-20": Object.freeze({ make: "Land on 8.", apply: "Land on a number after 10.", check: "Land on 12." }),
  "F-N-COUNT-10": Object.freeze({ make: "Make 7 counters.", apply: "Make 9 counters.", check: "Make 6 counters." }),
  "F-N-COUNT-20": Object.freeze({ make: "Show 14 as ten and four more.", apply: "Show a different teen number.", check: "Show 16 as ten and six more." }),
  "F-N-SUBITISE-5": Object.freeze({ make: "Show 4 in the five-frame.", apply: "Show 4 with both parts.", check: "Show 3 in the five-frame." }),
  "F-N-MATCH": Object.freeze({ make: "Build a frame to match 7.", apply: "Build a frame to match 4.", check: "Build a frame to match 6." }),
  "F-N-COMPARE": Object.freeze({ make: "Make 6 in group A and 4 in group B.", apply: "Make two equal non-empty groups.", check: "Make two different non-empty groups." }),
  "F-N-PART-5": Object.freeze({ make: "Split 5 into 2 and 3.", apply: "Find a different split of 5.", check: "Split 5 into 1 and 4." }),
  "F-N-PART-10": Object.freeze({ make: "Show 10 as 6 and 4.", apply: "Show a different two-part way to make 10.", check: "Show 10 as 7 and 3." })
});

const frameParts = state => [
  state?.cells?.filter(cell => cell === "part_a").length || 0,
  state?.cells?.filter(cell => cell === "part_b").length || 0
];

const counterParts = state => [
  state?.counters?.filter(counter => counter.groupId === "a").length || 0,
  state?.counters?.filter(counter => counter.groupId === "b").length || 0
];

export function mathsLessonStageIsReady(skillId, stage, state, selectedThought = "") {
  if (["retrieve", "notice", "model", "explain"].includes(stage)) return Boolean(selectedThought);
  if (!state || !["make", "apply", "check"].includes(stage)) return false;
  const total = state.id === "counter_tray"
    ? state.counters.length
    : ["five_frame", "ten_frame"].includes(state.id)
      ? state.cells.filter(cell => cell !== "empty").length
      : state.id === "number_line"
        ? state.current
        : state.parts.reduce((sum, value) => sum + value, 0);
  if (skillId === "F-N-SEQ-20") return stage === "make" ? total === 8 : stage === "apply" ? total > 10 : total === 12;
  if (skillId === "F-N-COUNT-10") return total === ({ make: 7, apply: 9, check: 6 }[stage]);
  if (skillId === "F-N-COUNT-20") return stage === "make" ? total === 14 : stage === "apply" ? total >= 11 && total <= 20 && total !== 14 : total === 16;
  if (skillId === "F-N-SUBITISE-5") {
    const parts = frameParts(state);
    return stage === "make" ? total === 4 : stage === "apply" ? total === 4 && parts.every(value => value > 0) : total === 3;
  }
  if (skillId === "F-N-MATCH") return total === ({ make: 7, apply: 4, check: 6 }[stage]);
  if (skillId === "F-N-COMPARE") {
    const [a, b] = counterParts(state);
    return stage === "make" ? a === 6 && b === 4 : stage === "apply" ? a > 0 && a === b : a > 0 && b > 0 && a !== b;
  }
  if (skillId === "F-N-PART-5") {
    const [a, b] = state.parts || [];
    return stage === "make" ? a === 2 && b === 3 : stage === "apply" ? a > 0 && b > 0 && !([2, 3].includes(a) && [2, 3].includes(b)) : a === 1 && b === 4;
  }
  if (skillId === "F-N-PART-10") {
    const [a, b] = frameParts(state);
    return stage === "make" ? a === 6 && b === 4 : stage === "apply" ? total === 10 && a > 0 && b > 0 && !([6, 4].includes(a) && [6, 4].includes(b)) : a === 7 && b === 3;
  }
  return false;
}

export function mathsLessonInstruction(recipe, stage) {
  return MATHS_LESSON_STAGE_COPY[stage] || recipe.instructionText;
}

export function mathsLessonInstructionAudioId(recipe, stage) {
  return MATHS_LESSON_STAGE_COPY[stage] ? `lesson-stage:${recipe.skillId}:${stage}` : recipe.instructionAudioId;
}

const PROFILES = Object.freeze({
  "F-N-SEQ-20": {
    manipulativeId: "number_line", maximum: 20,
    retrieve: "Say the number sequence to 10. Touch each number as you say it.",
    model: "Start at zero and move one step at a time. Each step changes the number by one.",
    guided: "Choose 8. Now find the number just before it and the number just after it.",
    independent: "Hide one number between 0 and 20. Work out which number is missing.",
    transfer: "Put three number cards in order and explain how you know which comes first."
  },
  "F-N-COUNT-10": {
    manipulativeId: "counter_tray", maximum: 10,
    retrieve: "Count five counters. Move each counter once as you say its number.",
    model: "Watch how each counter gets one number word. The last number tells how many altogether.",
    guided: "Make seven counters. Touch each one once, then say how many without counting again.",
    independent: "Make a collection to match the number 9.",
    transfer: "Count a classroom collection. Tell what helped you keep track."
  },
  "F-N-COUNT-20": {
    manipulativeId: "ten_frame", maximum: 20,
    retrieve: "Fill one ten frame and name the whole amount.",
    model: "Build ten first, then count on for the extra counters.",
    guided: "Make fourteen as ten and four more.",
    independent: "Build a teen number and say it as ten and some more.",
    transfer: "Organise a larger collection so someone else can see how many."
  },
  "F-N-SUBITISE-5": {
    manipulativeId: "five_frame", maximum: 5,
    retrieve: "Show three on your fingers without counting each finger.",
    model: "Look briefly at the frame. I see three because I see two and one.",
    guided: "Make four in a five frame. Say the parts you can see.",
    independent: "Make the same amount in a different arrangement.",
    transfer: "Show a small amount quickly and explain how you saw it."
  },
  "F-N-MATCH": {
    manipulativeId: "ten_frame", maximum: 10,
    retrieve: "Choose a number and say its number name.",
    model: "The spoken word six, the numeral 6 and six counters all name the same quantity.",
    guided: "Build a frame to match the numeral 7.",
    independent: "Choose a numeral for the quantity you made.",
    transfer: "Find a number label nearby and make a collection that matches it."
  },
  "F-N-COMPARE": {
    manipulativeId: "counter_tray", maximum: 20,
    retrieve: "Make two small groups. Say how many are in each group.",
    model: "Match one counter from each group. The group with counters left has more.",
    guided: "Make one group of six and one group of four. Match them to compare.",
    independent: "Build two groups that have the same amount.",
    transfer: "Compare two real collections even when one is spread farther apart."
  },
  "F-N-PART-5": {
    manipulativeId: "part_whole", maximum: 5,
    retrieve: "Make five and check the whole.",
    model: "Split five into two parts. Moving a counter changes the parts, not the whole.",
    guided: "Make five with two in one part. Work out the other part.",
    independent: "Find a different way to split five.",
    transfer: "Hide one part of five and explain how you know what is hidden."
  },
  "F-N-PART-10": {
    manipulativeId: "ten_frame", maximum: 10,
    retrieve: "Fill a ten frame and notice the five-and-five structure.",
    model: "Turn three counters orange. Seven purple and three orange still make ten.",
    guided: "Make ten with six and another part.",
    independent: "Show a new way to make ten with two colours.",
    transfer: "Use two groups of safe objects to show a friend one way to make ten."
  }
});

const PHASES = Object.freeze(["retrieve", "model", "guided", "independent", "transfer"]);

export const mathsActivityRecipes = Object.freeze(APPROVED_FOUNDATION_SKILL_IDS.flatMap(skillId => {
  const profile = PROFILES[skillId];
  return PHASES.map((phase, index) => Object.freeze({
    id: `${skillId}-${phase}-${index + 1}`,
    skillId,
    phase,
    title: `${mathsSkillById[skillId].childLabel}: ${phase === "guided" ? "make together" : phase}`,
    manipulativeId: profile.manipulativeId,
    instructionText: profile[phase],
    instructionAudioId: `activity:${skillId}-${phase}-${index + 1}:instruction`,
    initialState: { maximum: profile.maximum },
    targetState: null,
    feedbackRules: [],
    evidenceSource: ["independent", "transfer"].includes(phase) ? "independent_practice" : "guided_practice",
    contentVersion: MATHS_CONTENT_VERSION
  }));
}));

export const mathsActivityRecipesBySkill = Object.freeze(Object.fromEntries(
  APPROVED_FOUNDATION_SKILL_IDS.map(skillId => [
    skillId,
    Object.freeze(mathsActivityRecipes.filter(recipe => recipe.skillId === skillId))
  ])
));
