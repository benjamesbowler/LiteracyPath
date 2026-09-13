import assert from "node:assert/strict";
import test from "node:test";
import { GAME_LIST, SENTENCE_FIX } from "../../src/data/learnGamesData.js";
import { gameRandom, newGameSeed, replayShuffle, replayWithinBands } from "../../src/utils/gameReplay.js";
import { applyCheckpoint, readCheckpoint, removeCheckpoint } from "../../src/utils/gameCheckpoints.js";
import { difficultyLadder } from "../../src/utils/curriculumLadder.js";
import { wordBridgeLadder } from "../../src/utils/wordBridgeLevels.js";
import { grammarGrindLadder } from "../../src/utils/grammarGrindLevels.js";
import { soundBeatLadder } from "../../src/utils/soundBeatTracks.js";
import { rhymePopLadder } from "../../src/utils/rhymePopLevels.js";
import { soundSafariLadder } from "../../src/utils/soundSafariRounds.js";
import { starGalleryLadder } from "../../src/utils/starGalleryRounds.js";
import { reelReadLadder } from "../../src/utils/reelReadLevels.js";
import { buildLine } from "../../src/utils/sentenceExpressLevels.js";
import { buildSoundRacerRace } from "../../src/utils/soundRacerRace.js";
import { buildSoundKeySession } from "../../src/features/soundkeys/content.js";
import { buildCvcWorkshopRounds, cvcWorkshopRoundCount, buildBlendMissions } from "../../src/utils/buildingGrowingRounds.js";
import { buildAdventureRoundSet } from "../../src/utils/adventureRounds.js";
import { memoryBoards, sentencePractice, sightWordPool } from "../../src/utils/recognitionPractice.js";
import { buildRocketRunRound, rocketRunLadder } from "../../src/utils/rocketRunRounds.js";
import { createWordClimbSession } from "../../src/utils/wordClimbLevels.js";

function withRandom(seed, build) {
  const original = Math.random;
  Math.random = gameRandom(seed);
  try { return build(); } finally { Math.random = original; }
}

// Every current catalogue game maps to its real content generator. This checks
// learning words/options, not decorative particles or a changing run counter.
const GENERATORS = {
  "cvc-word-builder": (d, seed) => buildCvcWorkshopRounds(d, cvcWorkshopRoundCount(d), gameRandom(seed)),
  "sight-word-memory": (d, seed) => memoryBoards(d, gameRandom(seed)),
  "blend-and-build": d => buildBlendMissions(d),
  "pop-the-word": (d, seed) => replayShuffle(sightWordPool(d), seed).slice(0, 48),
  "word-hopscotch": (d, seed) => sentencePractice(d, 10, gameRandom(seed)),
  "reading-race": (d, seed) => replayShuffle(SENTENCE_FIX[d], seed),
  "word-rescue": d => buildAdventureRoundSet("rescue", d),
  "sound-sort-factory": d => buildAdventureRoundSet("sort", d),
  "letter-garden": d => buildAdventureRoundSet("garden", d),
  "rocket-run": d => buildRocketRunRound(rocketRunLadder(d)[0], { difficulty: d, count: 8 }),
  "letter-leap": (d, seed) => difficultyLadder("letter-leap", d, seed),
  "word-climb": (d, seed) => createWordClimbSession(d, gameRandom(seed)),
  "sound-racer": (d, seed) => buildSoundRacerRace(rocketRunLadder(d)[0], { difficulty: d, seed }),
  "word-bridge": wordBridgeLadder,
  "sound-beat": soundBeatLadder,
  "rhyme-pop": rhymePopLadder,
  "sound-safari": soundSafariLadder,
  "reel-read": reelReadLadder,
  "star-gallery": starGalleryLadder,
  "sentence-express": buildLine,
  "grammar-grind": grammarGrindLadder,
  soundkeys: buildSoundKeySession
};

test("replay audit covers every registered game", () => {
  assert.deepEqual(Object.keys(GENERATORS).sort(), GAME_LIST.map(game => game.id).sort());
});

for (const [id, generate] of Object.entries(GENERATORS)) {
  for (const difficulty of ["easy", "medium", "hard"]) {
    test(`${id} ${difficulty}: fresh runs vary content and a retained seed reproduces it`, () => {
      const generateAt = seed => withRandom(seed, () => generate(difficulty, seed));
      const first = generateAt(271);
      assert.deepEqual(generateAt(271), first, "resume must reproduce the same content");
      const signatures = new Set([271, 941, 1201, 7919].map(seed => JSON.stringify(generateAt(seed))));
      assert.ok(signatures.size > 1, "fresh play must change words, pictures, or answer arrangements");
    });
  }
}

test("CVC outings are longer, unique within a run, and leave new pictured words for replay", () => {
  assert.equal(cvcWorkshopRoundCount("easy"), 24);
  for (const difficulty of ["easy", "medium", "hard"]) {
    const pool = buildCvcWorkshopRounds(difficulty, 100);
    const count = cvcWorkshopRoundCount(difficulty);
    assert.ok(pool.length > count);
    const seen = new Set();
    const orders = new Set();
    for (let seed = 1; seed <= 12; seed++) {
      const rounds = buildCvcWorkshopRounds(difficulty, count, gameRandom(seed));
      assert.equal(rounds.length, count);
      assert.equal(new Set(rounds.map(round => round.word)).size, count);
      rounds.forEach(round => seen.add(round.word));
      orders.add(rounds.map(round => round.word).join(","));
    }
    assert.equal(seen.size, pool.length);
    assert.equal(orders.size, 12);
  }
});

test("run seeds survive checkpoint updates, remain scoped, and retire with completed runs", () => {
  const seed = newGameSeed(0, () => 0.25);
  let games = applyCheckpoint({}, "soundkeys", "easy", 0, 12, seed);
  assert.equal(games.soundkeys.checkpoints.easy.sessionSeed, seed, "partly played first rounds retain their seed");
  games = applyCheckpoint(games, "soundkeys", "easy", 4, 12, seed);
  games = applyCheckpoint(games, "soundkeys", "hard", 2, 10, 89);
  assert.deepEqual(readCheckpoint(games, "soundkeys", "easy"), { level: 4, totalLevels: 12, sessionSeed: seed });
  games = removeCheckpoint(games, "soundkeys", "easy");
  assert.equal(readCheckpoint(games, "soundkeys", "easy"), null);
  assert.equal(readCheckpoint(games, "soundkeys", "hard").sessionSeed, 89);
  assert.notEqual(newGameSeed(seed, () => 0.25), seed);
  assert.notEqual(newGameSeed(0, () => 0), 0);
});

test("variation preserves curriculum bands and never scrambles ordered fishing word parts", () => {
  const values = [{ id: 1, band: "a" }, { id: 2, band: "a" }, { id: 3, band: "b" }, { id: 4, band: "b" }];
  assert.deepEqual(replayWithinBands(values, 81, item => item.band).map(item => item.band), values.map(item => item.band));
  for (const difficulty of ["easy", "medium", "hard"]) {
    const original = reelReadLadder(difficulty);
    const varied = reelReadLadder(difficulty, 501);
    assert.deepEqual(varied.map(level => level.mode), original.map(level => level.mode));
    assert.notDeepEqual(varied.map(level => level.target), original.map(level => level.target));
    original.forEach(level => {
      const replayed = varied.find(item => item.target === level.target && item.mode === level.mode);
      assert.deepEqual(new Set(replayed.correctWords), new Set(level.correctWords));
      if (level.orderMatters) assert.deepEqual(replayed.correctWords, level.correctWords);
    });
  }
});
