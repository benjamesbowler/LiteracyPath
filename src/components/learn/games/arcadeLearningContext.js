import { elSkillsBlockCycles } from "../../../data/elSkillsBlockCycles.js";
import { readCheckpoint } from "../../../utils/gameCheckpoints.js";
import { validArcadeChapter } from "../../../utils/arcadeJourneys.js";

const UPGRADED_SUPPORT_GAMES = new Set(["sound-beat", "letter-leap", "sound-racer", "grammar-grind", "soundkeys", "rhyme-pop"]);
const SUPPORT_AWARE_GAMES = new Set(["drum-trail", "lantern-lagoon", "tower-tumble", "rally-pals", "burrow-builders", ...UPGRADED_SUPPORT_GAMES]);
const SEEDED_PRACTICE_GAMES = new Set(["cvc-word-builder", "sight-word-memory", "blend-and-build", "word-rescue", "sound-sort-factory", "letter-garden", "pop-the-word", "word-hopscotch", "reading-race"]);

/** A held first question has meaningful support history, even at index zero. */
export function readPlayerCheckpoint(games, gameId, difficulty) {
  const checkpoint = games?.[gameId]?.checkpoints?.[difficulty];
  if (!SUPPORT_AWARE_GAMES.has(gameId) && (!SEEDED_PRACTICE_GAMES.has(gameId) || checkpoint?.sessionSeed === undefined)) {
    return readCheckpoint(games, gameId, difficulty);
  }
  // Older versions of these engines saved a completed stage without a seed or
  // held-response history. Preserve that stage; their new owners start a fresh
  // seeded task there rather than treating it as a v2 held-question resume.
  if (UPGRADED_SUPPORT_GAMES.has(gameId) && checkpoint && checkpoint.sessionSeed === undefined
    && Number.isSafeInteger(checkpoint.level) && checkpoint.level > 0
    && Number.isSafeInteger(checkpoint.totalLevels) && checkpoint.level < checkpoint.totalLevels
    && (checkpoint.chapter === undefined || validArcadeChapter(checkpoint.chapter))) {
    return readCheckpoint(games, gameId, difficulty);
  }
  if (!checkpoint || !Number.isSafeInteger(checkpoint.level) || checkpoint.level < 0
    || !Number.isSafeInteger(checkpoint.totalLevels) || checkpoint.totalLevels < 1 || checkpoint.level >= checkpoint.totalLevels
    || !Number.isSafeInteger(checkpoint.sessionSeed) || checkpoint.sessionSeed < 0
    || (checkpoint.chapter !== undefined && !validArcadeChapter(checkpoint.chapter))) return null;
  return { level: checkpoint.level, totalLevels: checkpoint.totalLevels, sessionSeed: checkpoint.sessionSeed,
    ...(checkpoint.chapter !== undefined ? { chapter: checkpoint.chapter } : {}) };
}

/**
 * Reading compatibility uses the same confirmed EL anchor as Books. A class
 * focus, game difficulty or saved practice score cannot supply this context.
 * AppSurface withholds this placement until this child's evidence is ready.
 */
export function confirmedArcadeTaughtCycle(confirmedPlacement) {
  const anchor = confirmedPlacement?.anchorCycle;
  if (!Number.isInteger(anchor) || anchor < 1) return null;
  return elSkillsBlockCycles.some(cycle => cycle.cycleNumber === anchor) ? anchor : null;
}
