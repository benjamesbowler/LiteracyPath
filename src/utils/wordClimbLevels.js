import {
  buildRocketRunRound,
  rocketRunLadder
} from "./rocketRunRounds.js";

const CHOICE_COUNT = 3;

export function wordClimbSummitFor(difficulty) {
  return difficulty === "hard" ? 10 : difficulty === "medium" ? 8 : 6;
}

function shuffleWith(items, random = Math.random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

// One target and two sound-distinct distractors are rebuilt for every climb.
// Correctness is data only; renderers must give all three choices equal weight.
export function wordClimbChoicesForStep(round, step, random = Math.random) {
  const correctPool = [...new Set(round?.correct || [])];
  const distractorPool = [...new Set(round?.distractors || [])]
    .filter(word => !correctPool.includes(word));

  if (!correctPool.length || distractorPool.length < CHOICE_COUNT - 1) {
    throw new Error("Word Climb needs one target word and two distinct distractors");
  }

  const safeStep = Math.max(0, Number(step) || 0);
  const choices = [
    { word: correctPool[safeStep % correctPool.length], correct: true },
    { word: distractorPool[(safeStep * 2) % distractorPool.length], correct: false },
    { word: distractorPool[(safeStep * 2 + 1) % distractorPool.length], correct: false }
  ];

  return shuffleWith(choices, random);
}

export function createWordClimbSession(difficulty, random = Math.random) {
  const summit = wordClimbSummitFor(difficulty);
  const ladder = rocketRunLadder(difficulty);
  const target = ladder[Math.floor(random() * ladder.length)] || "s";
  return {
    difficulty,
    summit,
    target,
    round: buildRocketRunRound(target, { count: summit, difficulty })
  };
}
