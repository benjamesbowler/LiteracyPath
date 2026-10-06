import { elSkillsBlockCycles } from "../../../data/elSkillsBlockCycles.js";
import { readCheckpoint, validWordBridgeContentVersion } from "../../../utils/gameCheckpoints.js";
import { validArcadeChapter } from "../../../utils/arcadeJourneys.js";

const UPGRADED_SUPPORT_GAMES = new Set(["sound-beat", "letter-leap", "sound-racer", "grammar-grind", "soundkeys", "rhyme-pop", "reel-read", "word-climb", "sentence-express", "word-bridge", "rocket-run", "sound-safari", "star-gallery"]);
const SUPPORT_AWARE_GAMES = new Set(["drum-trail", "lantern-lagoon", "tower-tumble", "rally-pals", "burrow-builders", ...UPGRADED_SUPPORT_GAMES]);
const SEEDED_PRACTICE_GAMES = new Set(["cvc-word-builder", "sight-word-memory", "blend-and-build", "word-rescue", "sound-sort-factory", "letter-garden", "pop-the-word", "word-hopscotch", "reading-race"]);

/** A held first question has meaningful support history, even at index zero. */
export function readPlayerCheckpoint(games, gameId, difficulty) {
  const checkpoint = games?.[gameId]?.checkpoints?.[difficulty];
  if (gameId === "word-bridge" && checkpoint?.contentVersion !== undefined
    && !validWordBridgeContentVersion(checkpoint.contentVersion)) return null;
  if (!SUPPORT_AWARE_GAMES.has(gameId) && (!SEEDED_PRACTICE_GAMES.has(gameId) || checkpoint?.sessionSeed === undefined)) {
    return readCheckpoint(games, gameId, difficulty);
  }
  // Rocket owns ten target rounds. A corrupt seed must not silently select a
  // different courier bank, and a held zero is meaningful supported practice.
  if (gameId === "rocket-run" && checkpoint && (checkpoint.totalLevels !== 10
    || (checkpoint.sessionSeed !== undefined && checkpoint.sessionSeed > 0xffffffff))) return null;
  if (["sound-safari", "star-gallery"].includes(gameId) && checkpoint && (checkpoint.totalLevels !== 10
    || (checkpoint.sessionSeed !== undefined && checkpoint.sessionSeed > 0xffffffff))) return null;
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
    || (gameId === "word-bridge" && checkpoint.sessionSeed > 0xffffffff)
    || (checkpoint.chapter !== undefined && !validArcadeChapter(checkpoint.chapter))) return null;
  return { level: checkpoint.level, totalLevels: checkpoint.totalLevels, sessionSeed: checkpoint.sessionSeed,
    ...(gameId === "word-bridge" && validWordBridgeContentVersion(checkpoint.contentVersion)
      ? { contentVersion: checkpoint.contentVersion } : {}),
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
