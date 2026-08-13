export const MATHS_PRESENTATION_PROFILES = Object.freeze({
  "F-N-SEQ-20": Object.freeze({ minimum: 0, maximum: 20, defaultQuantity: 8, model: "number_line", modes: ["build", "notice", "truefalse"], trueFalse: value => ({ statement: `${value} comes just after ${Math.max(0, value - 1)}.`, answer: value > 0 }) }),
  "F-N-COUNT-10": Object.freeze({ minimum: 1, maximum: 10, defaultQuantity: 6, model: "ten_frame", modes: ["build", "same", "notice"], trueFalse: value => ({ statement: `The model has ${value} counters.`, answer: true }) }),
  "F-N-COUNT-20": Object.freeze({ minimum: 10, maximum: 20, defaultQuantity: 14, model: "double_ten_frame", modes: ["build", "same", "notice"], trueFalse: value => ({ statement: `Ten and ${value - 10} make ${value}.`, answer: true }) }),
  "F-N-SUBITISE-5": Object.freeze({ minimum: 1, maximum: 5, defaultQuantity: 4, model: "five_frame", modes: ["flash", "same", "notice"], trueFalse: value => ({ statement: `${Math.max(0, value - 1)} and 1 make ${value}.`, answer: true }) }),
  "F-N-MATCH": Object.freeze({ minimum: 1, maximum: 10, defaultQuantity: 7, model: "numeral_match", modes: ["build", "same", "notice"], trueFalse: value => ({ statement: `The numeral ${value} matches this quantity.`, answer: true }) }),
  "F-N-COMPARE": Object.freeze({ minimum: 1, maximum: 10, defaultQuantity: 6, model: "compare", modes: ["compare", "notice", "truefalse"], trueFalse: value => ({ statement: `${value} is more than ${Math.max(0, value - 1)}.`, answer: value > 0 }) }),
  "F-N-PART-5": Object.freeze({ minimum: 2, maximum: 5, defaultQuantity: 5, model: "part_whole", modes: ["build", "same", "notice", "truefalse"], trueFalse: value => ({ statement: `${Math.max(0, value - 2)} and 2 make ${value}.`, answer: value >= 2 }) }),
  "F-N-PART-10": Object.freeze({ minimum: 5, maximum: 10, defaultQuantity: 10, model: "two_colour_frame", modes: ["build", "same", "notice", "truefalse"], trueFalse: value => ({ statement: `${Math.max(0, value - 3)} and 3 make ${value}.`, answer: value >= 3 }) })
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
      teacherCheck: index === phases.length - 1 ? "Change the arrangement and ask the learner to show the same idea again." : "Ask the learner to point while explaining what changed and what stayed the same."
    });
  }));
}
