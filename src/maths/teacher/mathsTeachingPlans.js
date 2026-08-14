const authoredClaim = (value, falseValues, correctText, incorrectText, proofPrompt) => {
  const answer = !falseValues.includes(value);
  return Object.freeze({ statement: answer ? correctText : incorrectText, answer, proofPrompt });
};

export const MATHS_PRESENTATION_PROFILES = Object.freeze({
  "F-N-SEQ-20": Object.freeze({ minimum: 1, maximum: 20, defaultQuantity: 8, model: "number_line", modes: ["build", "notice", "truefalse"], trueFalse: value => authoredClaim(value, [2, 5, 8, 11, 14, 17, 20], `${value} comes just after ${value - 1}.`, `${value} comes just after ${Math.max(0, value - 2)}.`, "Point to both neighbouring numbers on the path.") }),
  "F-N-COUNT-10": Object.freeze({ minimum: 1, maximum: 10, defaultQuantity: 6, model: "ten_frame", modes: ["build", "same", "notice", "truefalse"], trueFalse: value => authoredClaim(value, [1, 4, 6, 9], `The model has ${value} counters.`, `The model has ${value === 10 ? 9 : value + 1} counters.`, "Move or mark each counter once, then name the total.") }),
  "F-N-COUNT-20": Object.freeze({ minimum: 10, maximum: 20, defaultQuantity: 14, model: "double_ten_frame", modes: ["build", "same", "notice", "truefalse"], trueFalse: value => authoredClaim(value, [11, 13, 16, 18], `Ten and ${value - 10} make ${value}.`, `Ten and ${value - 10} make ${value === 20 ? 19 : value + 1}.`, "Show the complete ten and count on through the extras.") }),
  "F-N-SUBITISE-5": Object.freeze({ minimum: 1, maximum: 5, defaultQuantity: 4, model: "five_frame", modes: ["flash", "same", "notice", "truefalse"], trueFalse: value => authoredClaim(value, [2, 5], `${Math.max(0, value - 1)} and 1 make ${value}.`, `${Math.max(0, value - 1)} and 1 make ${value === 5 ? 4 : value + 1}.`, "Name the smaller parts you see, then recombine them.") }),
  "F-N-MATCH": Object.freeze({ minimum: 1, maximum: 10, defaultQuantity: 7, model: "numeral_match", modes: ["build", "same", "notice", "truefalse"], trueFalse: value => authoredClaim(value, [3, 4, 8], `The numeral ${value} matches this quantity.`, `The numeral ${value === 10 ? 9 : value + 1} matches this quantity.`, "Say the numeral, then touch-count the collection once.") }),
  "F-N-COMPARE": Object.freeze({ minimum: 1, maximum: 10, defaultQuantity: 6, model: "compare", modes: ["compare", "notice", "truefalse"], trueFalse: value => authoredClaim(value, [1, 5, 6, 10], `${value} is more than ${Math.max(0, value - 1)}.`, `${value} is fewer than ${Math.max(0, value - 1)}.`, "Pair one object from each collection and inspect what remains.") }),
  "F-N-PART-5": Object.freeze({ minimum: 1, maximum: 4, defaultQuantity: 2, fixedWhole: 5, quantityLabel: "First part", model: "part_whole", modes: ["build", "same", "notice", "truefalse"], trueFalse: value => authoredClaim(value, [2, 3], `${value} and ${5 - value} make the whole 5.`, `${value} and ${Math.max(0, 4 - value)} make the whole 5.`, "Recombine both parts and check that the whole stays five.") }),
  "F-N-PART-10": Object.freeze({ minimum: 1, maximum: 9, defaultQuantity: 6, fixedWhole: 10, quantityLabel: "First part", model: "two_colour_frame", modes: ["build", "same", "notice", "truefalse"], trueFalse: value => authoredClaim(value, [1, 4, 6, 9], `${value} and ${10 - value} make the whole 10.`, `${value} and ${Math.max(0, 9 - value)} make the whole 10.`, "Recombine both parts and check that every space in ten is filled.") })
});

export const MATHS_PRESENTATION_MODE_LABELS = Object.freeze({
  flash: "Flash quantity",
  build: "Build the number",
  same: "Same total, different model",
  notice: "Notice and wonder",
  truefalse: "True or false",
  compare: "Compare two groups"
});

const SKILL_RESPONSES = Object.freeze({
  "F-N-SEQ-20": Object.freeze({ response: "Learner names the number before and after, with one word for each position.", repair: "Rebuild a short movable numeral track and hide only one card." }),
  "F-N-COUNT-10": Object.freeze({ response: "Learner moves each object once and uses the final number to name the whole set.", repair: "Create counted and uncounted zones, then move one object for each number word." }),
  "F-N-COUNT-20": Object.freeze({ response: "Learner organises ten first, then counts on for the extras.", repair: "Fill one complete ten-frame before touching the extra counters." }),
  "F-N-SUBITISE-5": Object.freeze({ response: "Learner names the quantity and describes the smaller parts they saw.", repair: "Hold the quantity still and ask, ‘Which smaller parts can you see?’" }),
  "F-N-MATCH": Object.freeze({ response: "Learner connects the spoken number, numeral and collection.", repair: "Say the number, build it, then choose between two numeral cards." }),
  "F-N-COMPARE": Object.freeze({ response: "Learner matches objects one-to-one before using more, fewer or same.", repair: "Align the collections from the same starting point and pair each object." }),
  "F-N-PART-5": Object.freeze({ response: "Learner names both parts and confirms that the whole remains five.", repair: "Rebuild the whole, cover one part and uncover it to check." }),
  "F-N-PART-10": Object.freeze({ response: "Learner sees ten as five-and-some-more or two complementary parts.", repair: "Return to a two-colour ten-frame and name each part before the whole." })
});

const SKILL_CHECKS = Object.freeze({
  "F-N-SEQ-20": "Hide a different numeral. Ask for the number before, the missing number and the number after.",
  "F-N-COUNT-10": "Rearrange the same objects. Ask the learner to count them once and name how many altogether.",
  "F-N-COUNT-20": "Show ten and some more in a new arrangement. Ask the learner to count on from ten.",
  "F-N-SUBITISE-5": "Flash a different arrangement for two seconds. Ask how many and which smaller parts they saw.",
  "F-N-MATCH": "Give a new numeral. Ask the learner to say it, build it and check that the collection matches.",
  "F-N-COMPARE": "Change the spacing without changing either quantity. Ask more, fewer or same and how they checked.",
  "F-N-PART-5": "Move one counter from one part to the other. Ask for both parts and confirm the whole is still five.",
  "F-N-PART-10": "Cover one colour in a new ten-frame split. Ask for the hidden part and the whole."
});

const DURATION_PHASES = Object.freeze({
  8: Object.freeze(["retrieve", "model", "independent"]),
  12: Object.freeze(["retrieve", "model", "guided", "independent"]),
  20: Object.freeze(["retrieve", "model", "guided", "independent", "transfer"])
});

export function buildMathsSmallGroupPlan({ skillId, duration, recipes }) {
  const phases = DURATION_PHASES[duration] || DURATION_PHASES[12];
  const minutes = duration === 8 ? [2, 2, 4] : duration === 20 ? [3, 4, 5, 5, 3] : [2, 3, 4, 3];
  const profile = SKILL_RESPONSES[skillId];
  return Object.freeze(phases.map((phase, index) => {
    const recipe = recipes.find(item => item.phase === phase) || recipes[Math.min(index, recipes.length - 1)];
    return Object.freeze({
      ...recipe,
      minutes: minutes[index],
      likelyResponse: profile.response,
      repair: profile.repair,
      teacherCheck: index === phases.length - 1 ? SKILL_CHECKS[skillId] : "Ask the learner to point while explaining what changed and what stayed the same."
    });
  }));
}
