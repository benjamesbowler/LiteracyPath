const hashSeed = seed => [...String(seed)].reduce((value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0, 17);

function sequenceRound(seed, index) {
  const base = (hashSeed(`${seed}:${index}`) % 16) + 1;
  return { id: `sequence-${base}-${index}`, prompt: `What comes just after ${base}?`, target: base + 1, options: [base - 1, base + 2, base + 1].sort((a, b) => ((hashSeed(`${seed}:${a}`) % 3) - (hashSeed(`${seed}:${b}`) % 3))), model: { start: base } };
}
function frameRound(seed, index) {
  const target = 5 + (hashSeed(`${seed}:frame:${index}`) % 6);
  const shown = Math.max(0, target - (1 + index % 4));
  return { id: `frame-${target}-${shown}-${index}`, prompt: `The target is ${target}. How many more counters are needed?`, target: target - shown, options: [target - shown, Math.max(0, target - shown - 1), Math.min(10, target - shown + 1)].sort((a, b) => a - b), model: { shown, target, capacity: 10 } };
}

function countRound(seed, index) {
  const target = 1 + (hashSeed(`${seed}:count:${index}`) % 10);
  return { id: `count-${target}-${index}`, prompt: "How many stones are in the tray?", target, options: [target, Math.max(0, target - 1), Math.min(10, target + 1)].sort((a, b) => a - b), model: { total: target } };
}

function matchRound(seed, index) {
  const target = 1 + (hashSeed(`${seed}:match:${index}`) % 10);
  return { id: `match-${target}-${index}`, prompt: `Choose the frame that shows ${target}.`, target, options: [target, Math.max(0, target - 2), Math.min(10, target + 2)].sort((a, b) => a - b), model: { target } };
}

export const mathsGames = Object.freeze([
  Object.freeze({ id: "number-trail", title: "Number Trail", strapline: "Find the next stepping stone", skillIds: ["F-N-SEQ-20"], rounds: 8, createRound: sequenceRound }),
  Object.freeze({ id: "frame-foundry", title: "Frame Foundry", strapline: "Complete the frame", skillIds: ["F-N-SUBITISE-5", "F-N-PART-5", "F-N-PART-10"], rounds: 8, createRound: frameRound }),
  Object.freeze({ id: "count-and-carry", title: "Count & Carry", strapline: "Count each parcel once", skillIds: ["F-N-COUNT-10", "F-N-COUNT-20"], rounds: 8, createRound: countRound }),
  Object.freeze({ id: "quantity-match", title: "Quantity Match", strapline: "Match number and amount", skillIds: ["F-N-MATCH", "F-N-COMPARE"], rounds: 8, createRound: matchRound })
]);

export function createMathsGameSession(gameId, seed = "foundation") {
  const game = mathsGames.find(item => item.id === gameId);
  if (!game) throw new TypeError(`Unknown Maths game: ${gameId}`);
  return Object.freeze({ ...game, seed, items: Object.freeze(Array.from({ length: game.rounds }, (_, index) => Object.freeze(game.createRound(seed, index)))) });
}

export function evaluateMathsGameRound(round, response) {
  const correct = Number(response) === Number(round.target);
  return Object.freeze({ correct, feedbackText: correct ? "That matches the maths." : `Look at the structure again. The target is ${round.target}.`, misconceptionCodes: correct ? [] : ["quantity_or_sequence_mismatch"] });
}
