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
  const target = (hashSeed(`${seed}:${index}`) % 20) + 1;
  const id = `sequence-${target}-${index}`;
  const sequence = target === 1
    ? [0, null, 2, 3]
    : target === 20
      ? [17, 18, 19, null]
      : index % 2
        ? [Math.max(0, target - 2), target - 1, null, target + 1]
        : [target - 1, null, target + 1, Math.min(20, target + 2)];
  return { id, mechanic: "trail_step", skillId: "F-N-SEQ-20", prompt: "Repair the path. Which number belongs in the gap?", target, options: balancedOptions({ seed, roundId: id, target, distractors: [target - 1, target + 1], maximum: 20 }), model: { start: sequence.find(value => value !== null), end: [...sequence].reverse().find(value => value !== null), sequence } };
}
function frameRound(seed, index) {
  const whole = index % 2 === 0 ? 5 : 10;
  const shown = 1 + (hashSeed(`${seed}:frame:${index}`) % (whole - 1));
  const id = `frame-${whole}-${shown}-${index}`;
  const missing = whole - shown;
  return { id, mechanic: "forge_frame", skillId: whole === 5 ? "F-N-PART-5" : "F-N-PART-10", prompt: `The whole must stay ${whole}. Add only the missing part.`, target: missing, options: balancedOptions({ seed, roundId: id, target: missing, distractors: [Math.max(0, missing - 1), Math.min(whole, missing + 1)], maximum: whole }), model: { shown, target: whole, capacity: whole } };
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

function glimpseRound(seed, index) {
  const target = 1 + (hashSeed(`${seed}:glimpse:${index}`) % 5);
  const id = `glimpse-${target}-${index}`;
  const patterns = ["dice", "arc", "split", "frame"];
  return { id, mechanic: "glimpse_pattern", skillId: "F-N-SUBITISE-5", prompt: "Look for smaller parts. How many glowbugs are in the garden?", target, options: balancedOptions({ seed, roundId: id, target, distractors: [target - 1, target + 1], minimum: 1, maximum: 5 }), model: { total: target, capacity: 5, pattern: patterns[hashSeed(`${seed}:${id}:pattern`) % patterns.length], parts: target <= 2 ? [target, 0] : [2, target - 2] } };
}

export const mathsGames = Object.freeze([
  Object.freeze({ id: "number-trail", title: "Number Trail", strapline: "Walk the missing stepping stone into place", skillIds: ["F-N-SEQ-20"], rounds: 8, instructionText: "Read the number path. Step directly onto the stone that belongs in the gap.", successText: "The path now counts forward by one. The missing stone is in the right place.", repairText: "Start at the stone before the gap. Say the next number, then check the stone after it.", createRound: sequenceRound }),
  Object.freeze({ id: "glimpse-garden", title: "Glimpse Garden", strapline: "See small quantities as useful parts", skillIds: ["F-N-SUBITISE-5"], rounds: 8, instructionText: "Open the garden gate. Look for smaller parts, then choose how many glowbugs you saw.", successText: "The smaller parts recombine to make the whole quantity.", repairText: "Show the garden again. Look for two and some more, or use the counting view.", createRound: glimpseRound }),
  Object.freeze({ id: "frame-foundry", title: "Frame Foundry", strapline: "Forge a missing part while the whole stays fixed", skillIds: ["F-N-PART-5", "F-N-PART-10"], rounds: 8, instructionText: "Keep the whole fixed. Fill only the empty spaces needed for the missing part, then test the build.", successText: "The shown part and the part you added fill the fixed whole exactly.", repairText: "Check the fixed whole, then count only the spaces that are still empty.", createRound: frameRound }),
  Object.freeze({ id: "count-and-carry", title: "Count & Carry", strapline: "Organise and move every parcel exactly once", skillIds: ["F-N-COUNT-10", "F-N-COUNT-20"], rounds: 8, instructionText: "Choose a counting plan. Move each parcel once, then match the total to a numeral.", successText: "Every parcel moved once, and the last number names the whole collection.", repairText: "Keep counted and uncounted parcels apart. Move one parcel for each number word.", createRound: countRound }),
  Object.freeze({ id: "quantity-match", title: "Bridge Builder", strapline: "Build, pair and compare across the stream", skillIds: ["F-N-MATCH", "F-N-COMPARE"], rounds: 8, instructionText: "Build the numeral or join one plank from each bank. Use the completed model to decide.", successText: "The bridge model proves the numeral match or comparison.", repairText: "Pair one from each side and look at what remains, or rebuild the exact numeral.", createRound: matchRound })
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
      : "Not yet. Look at what remains after every possible pair is joined.",
    glimpse_pattern: correct
      ? `The smaller parts recombine to make ${round.target}. You saw the whole without needing a speed score.`
      : "Not yet. Show the pattern again and look for smaller parts, or use the untimed counting view."
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
