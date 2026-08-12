import { APPROVED_FOUNDATION_SKILL_IDS, mathsSkillById } from "../curriculum/mathsSkillTree.js";

export const MATHS_CONTENT_VERSION = "maths-foundation-number-v1";
export const MATHS_LESSON_STAGES = Object.freeze([
  "retrieve", "notice", "model", "make", "explain", "apply", "check"
]);

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
