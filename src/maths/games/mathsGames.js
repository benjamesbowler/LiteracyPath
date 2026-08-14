const hashSeed = seed => [...String(seed)].reduce((value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0, 17);

function balancedOptions({ seed, roundId, target, distractors, minimum = 0, maximum = 20 }) {
  const options = [...new Set([target, ...distractors])]
    .filter(option => Number.isFinite(option) && option >= minimum && option <= maximum)
    .slice(0, 3);
  for (let distance = 1; options.length < 3 && distance <= maximum - minimum; distance += 1) {
    for (const candidate of [Number(target) - distance, Number(target) + distance]) {
      if (candidate >= minimum && candidate <= maximum && !options.includes(candidate)) options.push(candidate);
      if (options.length === 3) break;
    }
  }
  const expectedSlot = hashSeed(`${seed}:${roundId}:slot`) % options.length;
  const rest = options.filter(option => option !== target)
    .sort((left, right) => hashSeed(`${seed}:${roundId}:${left}`) - hashSeed(`${seed}:${roundId}:${right}`));
  rest.splice(expectedSlot, 0, target);
  return rest;
}

function sequenceRound(seed, index) {
  const base = (hashSeed(`${seed}:${index}`) % 16) + 1;
  const id = `sequence-${base}-${index}`;
  const target = base + 1;
  const sequence = index % 2
    ? [Math.max(0, base - 1), base, null, base + 2]
    : [base, null, base + 2, base + 3];
  return { id, mechanic: "trail_step", skillId: "F-N-SEQ-20", prompt: `Repair the path. Which number belongs in the gap?`, target, options: balancedOptions({ seed, roundId: id, target, distractors: [base - 1, base + 2], maximum: 20 }), model: { start: base, end: target, sequence } };
}
function frameRound(seed, index) {
  const target = 5 + (hashSeed(`${seed}:frame:${index}`) % 6);
  const shown = Math.max(0, target - (1 + index % 4));
  const id = `frame-${target}-${shown}-${index}`;
  const missing = target - shown;
  return { id, mechanic: "forge_frame", skillId: target <= 5 ? "F-N-PART-5" : "F-N-PART-10", prompt: `Forge a frame for ${target}. Add the missing counters.`, target: missing, options: balancedOptions({ seed, roundId: id, target: missing, distractors: [Math.max(0, missing - 1), Math.min(10, missing + 1)], maximum: 10 }), model: { shown, target, capacity: 10 } };
}

function countRound(seed, index) {
  const target = index % 2
    ? 11 + (hashSeed(`${seed}:count:${index}`) % 10)
    : 1 + (hashSeed(`${seed}:count:${index}`) % 10);
  const id = `count-${target}-${index}`;
  const rows = target > 10 ? [10, target - 10] : target > 5 ? [5, target - 5] : [target];
  return { id, mechanic: "carry_once", skillId: target > 10 ? "F-N-COUNT-20" : "F-N-COUNT-10", prompt: "Move every parcel once. Then choose how many are in the whole collection.", target, options: balancedOptions({ seed, roundId: id, target, distractors: [target - 1, target + 1], minimum: 1, maximum: target > 10 ? 20 : 10 }), model: { total: target, rows } };
}

function matchRound(seed, index) {
  if (index % 2) {
    const left = 2 + (hashSeed(`${seed}:compare-left:${index}`) % 9);
    const difference = [-2, 2, 0, 2, -2, 0, -2, 2][Math.floor(index / 2) % 8];
    const right = Math.max(0, Math.min(10, left + difference));
    const target = left > right ? "a" : left < right ? "b" : "same";
    const id = `compare-${left}-${right}-${index}`;
    const answerSlot = hashSeed(`${seed}:${id}:slot`) % 3;
    const options = ["a", "same", "b"].filter(option => option !== target);
    options.splice(answerSlot, 0, target);
    return { id, mechanic: "compare_frames", skillId: "F-N-COMPARE", prompt: "Which bank has more planks, or are they the same?", target, options, model: { left, right, capacity: 10 } };
  }
  const target = 1 + (hashSeed(`${seed}:match:${index}`) % 10);
  const id = `match-${target}-${index}`;
  return { id, mechanic: "match_frame", skillId: "F-N-MATCH", prompt: `Build ${target} bridge planks to match the numeral.`, target, options: balancedOptions({ seed, roundId: id, target, distractors: [Math.max(0, target - 2), Math.min(10, target + 2)], minimum: 1, maximum: 10 }), model: { target, capacity: 10 } };
}

export const mathsGames = Object.freeze([
  Object.freeze({ id: "number-trail", title: "Number Trail", strapline: "Find the next stepping stone", skillIds: ["F-N-SEQ-20"], rounds: 8, createRound: sequenceRound }),
  Object.freeze({ id: "frame-foundry", title: "Frame Foundry", strapline: "Complete the frame", skillIds: ["F-N-PART-5", "F-N-PART-10"], rounds: 8, createRound: frameRound }),
  Object.freeze({ id: "count-and-carry", title: "Count & Carry", strapline: "Count each parcel once", skillIds: ["F-N-COUNT-10", "F-N-COUNT-20"], rounds: 8, createRound: countRound }),
  Object.freeze({ id: "quantity-match", title: "Bridge Builder", strapline: "Pair and compare across the stream", skillIds: ["F-N-MATCH", "F-N-COMPARE"], rounds: 8, createRound: matchRound })
]);

export function createMathsGameSession(gameId, seed = "foundation", skillId = "") {
  const game = mathsGames.find(item => item.id === gameId);
  if (!game) throw new TypeError(`Unknown Maths game: ${gameId}`);
  if (skillId && !game.skillIds.includes(skillId)) throw new TypeError(`${game.title} is not released for ${skillId}.`);
  const items = [];
  for (let index = 0; items.length < game.rounds && index < 500; index += 1) {
    const round = game.createRound(seed, index);
    if (!skillId || round.skillId === skillId) items.push(Object.freeze(round));
  }
  if (items.length !== game.rounds) throw new Error(`${game.title} could not build eight rounds for ${skillId}.`);
  return Object.freeze({ ...game, seed, assignedSkillId: skillId || null, items: Object.freeze(items) });
}

export function evaluateMathsGameRound(round, response) {
  const correct = typeof round.target === "number"
    ? Number(response) === round.target
    : String(response) === round.target;
  const feedbackByMechanic = {
    trail_step: correct
      ? "The path counts forward by one. That stone fits the gap."
      : "Not yet. Count from the stone before the gap, then check the stone after it.",
    forge_frame: correct
      ? `Yes. ${round.model.shown} already there and ${round.target} added make ${round.model.target}.`
      : `Not yet. Compare the whole you built with the target order of ${round.model.target}.`,
    carry_once: correct
      ? "Every parcel moved once, and the numeral matches the collection."
      : "Not yet. Touch-count the parcels in the cart once more, then match that total.",
    match_frame: correct
      ? `The bridge has ${round.target} planks, so it matches the numeral.`
      : "Not yet. Match one plank to each count in the numeral beacon.",
    compare_frames: correct
      ? "The pairs prove the comparison. The unpaired planks show which bank has more."
      : "Not yet. Look at what remains after every possible pair is joined."
  };
  return Object.freeze({
    correct,
    feedbackText: feedbackByMechanic[round.mechanic]
      || (correct ? "That matches the maths." : "The model does not match yet. Look at the structure and repair it."),
    classification: correct ? "correct" : `${round.mechanic}_mismatch`,
    observedSignals: correct ? [] : [`${round.mechanic}_mismatch`],
    misconceptionCodes: []
  });
}
