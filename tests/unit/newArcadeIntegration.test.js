import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { GAME_LIST } from "../../src/data/learnGamesData.js";
import { LEARN_GAMES } from "../../src/components/learn/games/games/index.js";
import { confirmedArcadeTaughtCycle, readPlayerCheckpoint } from "../../src/components/learn/games/arcadeLearningContext.js";
import { validateArcadeRendererRegistry, validateGameVerticalSliceBrief } from "../../src/components/learn/games/shared/premiumGameStandard.js";
import { ARCADE_VERTICAL_SLICE_BRIEFS } from "../../src/components/learn/games/shared/arcadeVerticalSliceBriefs.js";
import { ARCADE_PREMIUM_PROFILES } from "../../src/components/learn/games/shared/arcadePremiumProfiles.js";
import { arcadeGuideForGame } from "../../src/components/learn/games/shared/arcadeGuideExamples.js";
import { arcadeRecommendation, arcadeRecommendationAudioPath } from "../../src/components/learn/games/arcadeRecommendation.js";
import { getGameMusicTrack } from "../../src/utils/audio/gameMusic.js";
import { ARCADE_JOURNEYS, arcadeJourneyChapter, finishArcadeChapter } from "../../src/utils/arcadeJourneys.js";
import { applyCheckpoint, readCheckpoint } from "../../src/utils/gameCheckpoints.js";
import { filterToEntitlement, sampleGameIds } from "../../src/policy/freeTierContent.js";
import { computeHydratedValue, sanitizeCloudProgressPayload } from "../../src/utils/progressMerge.js";
import { LANTERN_ASSETS } from "../../src/data/lanternLagoonAssets.js";
import { localLearnerDataKeysForStudent, localProgressStorageKeysForArea } from "../../src/utils/progressKeys.js";
import { phonicsSessionKey } from "../../src/components/learn/games/games/phonicsSession.js";
import { clearLocalProgressForStudent, clearProgressSyncSession, configureProgressSync } from "../../src/utils/progressSync.js";
import { saveLearnGameResult } from "../../src/utils/learnGamesProgress.js";
import { readProgressQueueRecords } from "../../src/utils/progressQueue.js";
import { DRUM_TRAIL_CONTENT_VERSION } from "../../src/data/drumTrailContent.js";
import { LANTERN_LAGOON_VERSION } from "../../src/data/lanternLagoonContent.js";

const NEW_IDS = ["drum-trail", "lantern-lagoon"];

test("actual completion save and queue retain bounded authored context without uploading mutable history", t => {
  const values = new Map();
  const storage = { get length() { return values.size; }, key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const previousWindow = globalThis.window;
  const window = new EventTarget();
  Object.assign(window, { localStorage: storage, setTimeout: () => 1, clearTimeout() {} });
  globalThis.window = window;
  t.after(() => { clearProgressSyncSession(); globalThis.window = previousWindow; });
  const scope = "new-game-completion-context";
  configureProgressSync({ mode: "student", studentId: scope, token: "unit-context", client: { call: async () => ({ data: { ok: true } }) } });
  const first = { correct: false, independent: false, supportUsed: ["mission-help"] };
  const retry = { correct: true, independent: false, supportUsed: ["model"] };
  storage.setItem(`literacy-guide-learn-games:${scope}`, JSON.stringify({ games: {
    "drum-trail": { practiceSession: { easy: { supportReasons: ["model"], seed: 77 } } }
  } }));
  for (const [id, version] of [["drum-trail", DRUM_TRAIL_CONTENT_VERSION], ["lantern-lagoon", LANTERN_LAGOON_VERSION]]) {
    const evidence = { version, contentVersion: version, sessionSeed: 77, journeyIndex: 2, taughtCycle: 15, mode: "reading",
      firstResponses: [first], assistedRetries: [retry], supportEvents: [{ kind: "mutable-event-never-upload" }], privateExtra: "not-in-context" };
    const saved = saveLearnGameResult(scope, id, 3, 80, 8, evidence, "easy", 2);
    const completion = saved.games[id].practiceRecord.completions[0];
    assert.equal(completion.contentVersion, version);
    assert.deepEqual(completion.steps, [first]); assert.deepEqual(completion.assistedRetries, [retry]);
    assert.deepEqual(completion.practiceContext, { sessionSeed: 77, journeyIndex: 2, formalAssessment: false, masteryClaim: false,
      ...(id === "drum-trail" ? { construct: "oral-whole-word-syllable-count" } : { mode: "reading", taughtCycle: 15 }) });
    assert.equal(completion.independent, false); assert.equal(completion.practiceOnly, true);
    const record = readProgressQueueRecords(storage).find(row => row.entry.payload.games[id]?.practiceRecord);
    assert.ok(record);
    assert.deepEqual(record.entry.payload.games[id].practiceRecord.completions[0], completion);
    assert.equal(record.entry.payload.games["drum-trail"].practiceSession, undefined);
    assert.ok(!JSON.stringify(record.entry.payload).includes("mutable-event-never-upload"));
    assert.ok(!JSON.stringify(completion).includes("not-in-context"));
    const hydrated = computeHydratedValue("learn_games", "__all__", { games: {} }, record.entry.payload);
    assert.deepEqual(hydrated.games[id].practiceRecord.completions[0], completion);
  }
  const legacy = saveLearnGameResult(scope, "rhyme-pop", 3, 80, 8, { firstResponses: [first], assistedRetries: [retry] }, "easy", 2);
  const oldCompletion = legacy.games["rhyme-pop"].practiceRecord.completions[0];
  assert.equal(oldCompletion.contentVersion, "learn-game-practice-v1"); assert.equal(oldCompletion.practiceContext, undefined);
  const invalid = saveLearnGameResult(scope, "lantern-lagoon", 3, 80, 8, { version: LANTERN_LAGOON_VERSION, sessionSeed: 77,
    journeyIndex: 2, mode: "reading", taughtCycle: "15", firstResponses: [first] }, "easy", 2);
  assert.equal(invalid.games["lantern-lagoon"].practiceRecord.completions.at(-1).practiceContext, undefined, "unvalidated code cannot be claimed as a confirmed reading context");
});

test("a valid held first prompt resumes with its seed without changing legacy checkpoint semantics", () => {
  for (const id of NEW_IDS) {
    const games = applyCheckpoint({}, id, "easy", 0, 8, 913, 2);
    assert.deepEqual(readPlayerCheckpoint(games, id, "easy"), { level: 0, totalLevels: 8, sessionSeed: 913, chapter: 2 });
    assert.equal(readCheckpoint(games, id, "easy"), null, "old reducer continues to treat zero as a fresh ladder");
    assert.equal(readPlayerCheckpoint(games, id, "hard"), null);
    assert.equal(readPlayerCheckpoint(games, NEW_IDS.find(other => other !== id), "easy"), null);
    for (const patch of [{ level: -1 }, { level: .5 }, { level: 8 }, { totalLevels: 0 }, { totalLevels: "8" }, { sessionSeed: undefined }, { sessionSeed: "913" }, { chapter: 12 }]) {
      const invalid = { [id]: { checkpoints: { easy: { ...games[id].checkpoints.easy, ...patch } } } };
      assert.equal(readPlayerCheckpoint(invalid, id, "easy"), null, JSON.stringify(patch));
    }
  }
  const old = applyCheckpoint({}, "rocket-run", "easy", 0, 8, 913, 2);
  assert.equal(readPlayerCheckpoint(old, "rocket-run", "easy"), null);
  const player = readFileSync("src/components/learn/games/GamePlayer.jsx", "utf8");
  assert.match(player, /setResumedCheckpoint\(Boolean\(resumePoint\)\)/);
  assert.match(player, /resumedCheckpoint=\{resumedCheckpoint\}/);
});

test("the true 24-game catalogue includes two distinct authored engines and no duplicate ID", () => {
  assert.equal(GAME_LIST.length, 24);
  assert.equal(new Set(GAME_LIST.map(game => game.id)).size, 24);
  assert.deepEqual(Object.keys(LEARN_GAMES).sort(), GAME_LIST.map(game => game.id).sort());
  const index = readFileSync("src/components/learn/games/games/index.js", "utf8");
  for (const [id, file] of [["drum-trail", "DrumTrailGame.jsx"], ["lantern-lagoon", "LanternLagoonGame.jsx"]]) {
    const game = GAME_LIST.find(game => game.id === id);
    assert.ok(!game.hidden && game.surfaces.includes("arcade"));
    assert.equal(game.renderer, "retained-illustration");
    assert.ok(index.includes(`import("./${file}")`), id);
    assert.ok(existsSync(`src/components/learn/games/games/${file}`), id);
    assert.ok(existsSync(game.assetManifest), `${id}: unique engine asset authority is present`);
  }
});

test("both catalogue icons decode as real retained media and music has real quiet local fallbacks", async () => {
  for (const id of NEW_IDS) {
    const game = GAME_LIST.find(game => game.id === id);
    const file = `public${game.icon}`;
    const image = sharp(file);
    const metadata = await image.metadata();
    assert.equal(metadata.format, "webp");
    assert.ok(metadata.width >= 128 && metadata.height >= 128, `${id} has a real reviewable icon`);
    const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.ok(data.some((value, index) => index % info.channels === info.channels - 1 && value > 0), `${id} icon contains visible pixels`);
    const music = getGameMusicTrack(id);
    assert.ok(music.volume > 0 && music.volume <= .22);
    assert.ok(music.sources.length >= 2);
    for (const source of music.sources) assert.ok(existsSync(`public${source}`), source);
  }
  assert.notEqual(GAME_LIST.find(game => game.id === NEW_IDS[0]).icon, GAME_LIST.find(game => game.id === NEW_IDS[1]).icon);
});

test("both retained-world manifests cover actual decoded files with their recorded hashes", async () => {
  const drum = JSON.parse(readFileSync("public/images/arcade/drum-trail/manifest.json", "utf8"));
  assert.equal(drum.game, "drum-trail");
  assert.equal(drum.renderer, "retained-illustration");
  const media = [...drum.assets, ...Object.values(LANTERN_ASSETS)];
  assert.ok(drum.assets.some(asset => asset.path === GAME_LIST.find(game => game.id === "drum-trail").icon));
  assert.ok(Object.values(LANTERN_ASSETS).some(asset => asset.path === GAME_LIST.find(game => game.id === "lantern-lagoon").icon));
  for (const asset of media) {
    const bytes = readFileSync(`public${asset.path}`);
    assert.equal(bytes.length, asset.bytes, asset.path);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256, asset.path);
    const image = sharp(bytes);
    const metadata = await image.metadata();
    assert.equal(metadata.format, "webp", asset.path);
    assert.ok(metadata.width > 16 && metadata.height > 16, asset.path);
    if (asset.width) assert.equal(metadata.width, asset.width, asset.path);
    if (asset.height) assert.equal(metadata.height, asset.height, asset.path);
    if (asset.alpha) assert.equal(metadata.hasAlpha, true, asset.path);
    await image.raw().toBuffer();
  }
});

test("unknown renderers and a missing retained-art manifest fail the exhaustive source contract", () => {
  const row = { id: "example", surfaces: ["arcade"], renderer: "retained-illustration", assetManifest: "manifest.json" };
  assert.deepEqual(validateArcadeRendererRegistry([row], []), []);
  assert.ok(validateArcadeRendererRegistry([{ ...row, renderer: "unknown" }], []).some(issue => /recognized/.test(issue)));
  assert.ok(validateArcadeRendererRegistry([{ ...row, assetManifest: "" }], []).some(issue => /manifest/.test(issue)));
  assert.ok(validateArcadeRendererRegistry([{ ...row, renderer: "blender" }], []).some(issue => /exactly match/.test(issue)));
  assert.ok(validateArcadeRendererRegistry([row, row], []).some(issue => /duplicate/.test(issue)));
});

test("reading context needs an exact confirmed cycle anchor, not difficulty or a recommendation", () => {
  for (const placement of [null, {}, { anchorCycle: 0 }, { anchorCycle: -1 }, { anchorCycle: 9.5 }, { anchorCycle: "15" }, { anchorCycle: 999 }, { currentCycleId: "cycle-15", difficulty: "hard" }]) {
    assert.equal(confirmedArcadeTaughtCycle(placement), null);
  }
  assert.equal(confirmedArcadeTaughtCycle({ anchorCycle: 15 }), 15);
  const phonics = readFileSync("src/components/learn/phonics/PhonicsLearnTab.jsx", "utf8");
  const hub = readFileSync("src/components/learn/games/GameArcadeHub.jsx", "utf8");
  const player = readFileSync("src/components/learn/games/GamePlayer.jsx", "utf8");
  assert.match(phonics, /<GameArcadeHub[\s\S]*?confirmedPlacement=\{confirmedPlacement\}/);
  assert.match(hub, /taughtCycle=\{confirmedArcadeTaughtCycle\(confirmedPlacement\)\}/);
  assert.match(player, /<GameComponent[\s\S]*?taughtCycle=\{taughtCycle\}/);
  assert.match(player, /engineRef\.current\?\.markSupported\?\.\("mission-help"\)/);
});

test("new games retain sample and exact-assignment boundaries without overriding entitlements", () => {
  assert.deepEqual(filterToEntitlement(GAME_LIST, [], { hasFullContent: true }), GAME_LIST);
  for (const id of NEW_IDS) {
    assert.deepEqual(filterToEntitlement(GAME_LIST, new Set([id]), { hasFullContent: false }).map(game => game.id), [id]);
    assert.equal(arcadeRecommendation({ games: GAME_LIST, assignedGameId: id, recommendedSkill: "initial_sounds" }).game.id, id);
  }
  const sampled = sampleGameIds(GAME_LIST);
  assert.equal(sampled.size, 5, "the existing cross-section policy retains three Arcade and two practice games");
  for (const id of sampled) assert.ok(GAME_LIST.some(game => game.id === id));
  const hub = readFileSync("src/components/learn/games/GameArcadeHub.jsx", "utf8");
  assert.match(hub, /filterSample\("games", GAME_LIST\)/);
  assert.match(hub, /game\.id === normalizedLockedGameId/);
  assert.match(hub, /exactGameLock && !lockedGame/);
});

test("curriculum recommendations describe only the games' actual constructs and leave unavailable voice cues silent", () => {
  for (const [skill, id] of [["spoken_syllable_counting", "drum-trail"], ["syllables", "drum-trail"], ["sentence_comprehension", "lantern-lagoon"]]) {
    const result = arcadeRecommendation({ games: GAME_LIST, recommendedSkill: skill });
    assert.equal(result.game.id, id);
    assert.equal(result.basis, "skill");
    assert.equal(arcadeRecommendationAudioPath(result.reason), "", "new recommendation prose must not pretend to have a recording");
    assert.equal(result.game.recommendationReasonAudio, "text-only");
  }
  assert.notEqual(arcadeRecommendation({ games: GAME_LIST, recommendedSkill: "phoneme_blending" }).game.id, "drum-trail");
  assert.ok(arcadeRecommendationAudioPath("Your teacher chose this game."));
});

test("all new profiles and briefs declare accurate support, privacy and twelve resumable outings", () => {
  for (const id of NEW_IDS) {
    const game = GAME_LIST.find(game => game.id === id);
    assert.deepEqual(validateGameVerticalSliceBrief(ARCADE_VERTICAL_SLICE_BRIEFS[id]), []);
    const brief = ARCADE_VERTICAL_SLICE_BRIEFS[id];
    assert.equal(brief.version, ARCADE_PREMIUM_PROFILES[id].version);
    assert.equal(brief.privacy.newIdentifier, false);
    assert.equal(brief.privacy.newExternalService, false);
    assert.equal(brief.learning.movementCreatesEvidence, false);
    assert.equal(brief.validation.physicalDevice.status, "unknown");
    assert.ok(arcadeGuideForGame(game).frameMilliseconds >= 1600);
    assert.equal(ARCADE_JOURNEYS[id].chapterCount, 12);
    for (const difficulty of ["easy", "medium", "hard"]) {
      for (let chapter = 0; chapter < 12; chapter++) {
        const saved = applyCheckpoint({}, id, difficulty, 1, 8, 987, chapter);
        assert.deepEqual(readCheckpoint(saved, id, difficulty), { level: 1, totalLevels: 8, sessionSeed: 987, chapter });
        assert.equal(readCheckpoint(saved, NEW_IDS.find(other => other !== id), difficulty), null);
        assert.equal(arcadeJourneyChapter(id, chapter).index, chapter);
        const result = finishArcadeChapter({}, id, difficulty, chapter);
        assert.deepEqual(finishArcadeChapter(result, id, difficulty, chapter), result, "replay stamps no duplicate outing");
        assert.equal(finishArcadeChapter(result, id, difficulty, 12), result);
      }
    }
  }
});

test("cloud hydration keeps answer support with its local run and never resurrects a cleared practice session", () => {
  for (const id of NEW_IDS) {
    const localSession = { easy: { seed: 71, cursor: 2, supportReasons: ["mission-help"], evidence: { firstResponses: [{ round: "local", independent: false }] } } };
    const cloudSession = { easy: { seed: 987, cursor: 8, supportReasons: ["model"], evidence: { firstResponses: [{ round: "cloud", independent: true }] } } };
    const cloud = { games: { [id]: { stars: 3, practiceSession: cloudSession, checkpoints: { easy: { level: 8, sessionSeed: 987 } } } } };
    const local = { games: { [id]: { stars: 1, practiceSession: localSession, checkpoints: { easy: { level: 2, sessionSeed: 71 } } } } };
    const merged = computeHydratedValue("learn_games", "__all__", local, cloud).games[id];
    assert.deepEqual(merged.practiceSession, localSession, "evidence from another seed cannot union into this prompt");
    assert.equal(merged.checkpoints.easy.sessionSeed, 71);
    assert.equal(merged.stars, 3, "earned achievements still merge forward");
    const finished = computeHydratedValue("learn_games", "__all__", { games: { [id]: { stars: 3 } } }, cloud).games[id];
    assert.equal(finished.practiceSession, undefined);
    assert.equal(finished.checkpoints, undefined);
    const newDevice = computeHydratedValue("learn_games", "__all__", { games: {} }, cloud).games[id];
    assert.equal(newDevice.practiceSession, undefined, "old cloud support snapshots never become this device's local evidence");
    assert.equal(newDevice.checkpoints.easy.sessionSeed, 987, "the established cloud checkpoint still restores the outing, with conservative support");
  }
});

test("the actual queue strips mutable support snapshots and retains immutable completed practice evidence", () => {
  const source = readFileSync("src/utils/learnGamesProgress.js", "utf8")
    .replace(/^import[\s\S]*?from\s+["'][^"']+["'];\s*/gm, "")
    .replace(/\bexport\s+(?=function|const|let)/gu, "");
  const queued = [];
  const createQueue = new Function("queueProgressSave", "sanitizeCloudProgressPayload", `${source}; return queueLearnGamesProgress;`);
  const queue = createQueue((...args) => queued.push(args), sanitizeCloudProgressPayload);
  const snapshot = { seed: 71, supportReasons: ["mission-help"] };
  const practiceRecord = { v: 3, completions: [{ id: "existing-completion", steps: [{ correct: true, independent: false }] }] };
  const value = { games: { "drum-trail": { practiceSession: { easy: snapshot }, practiceRecord, stars: 2 } } };
  queue("learner-a", value);
  assert.deepEqual(queued[0], ["learn_games", "__all__", { v: 1, games: { "drum-trail": { practiceRecord, stars: 2 } } }, { scopeKey: "learner-a" }]);
  assert.deepEqual(value.games["drum-trail"].practiceSession.easy, snapshot, "queue sanitisation does not mutate local resume state");
});

test("local game support snapshots are included in exact learner removal and game reset keys", () => {
  for (const scope of ["child-a", "child-a:extra", "child-b"]) {
    const allKeys = localLearnerDataKeysForStudent(scope);
    const gameKeys = localProgressStorageKeysForArea("learn_games", scope);
    assert.ok(gameKeys.includes(`literacy-guide-learn-games:${scope}`), "Drum's local-only practiceSession shares the registered base key");
    for (const difficulty of ["easy", "medium", "hard"]) {
      const key = phonicsSessionKey(scope, "lantern-lagoon", difficulty);
      assert.ok(allKeys.includes(key));
      assert.ok(gameKeys.includes(key));
      assert.ok(!allKeys.includes(phonicsSessionKey(scope === "child-a" ? "child-a:extra" : "child-a", "lantern-lagoon", difficulty)), "exact identity prevents an overlapping learner prefix from being removed");
    }
  }
});

test("actual privacy cleanup removes only this learner's mutable snapshots and respects preserved game practice", () => {
  const records = new Map();
  const storage = {
    get length() { return records.size; },
    key: index => [...records.keys()][index] ?? null,
    getItem: key => records.get(key) ?? null,
    setItem: (key, value) => records.set(key, value),
    removeItem: key => records.delete(key)
  };
  const gameKeys = localProgressStorageKeysForArea("learn_games", "child-a");
  const otherKeys = localProgressStorageKeysForArea("learn_games", "child-a:extra");
  for (const key of [...gameKeys, ...otherKeys]) storage.setItem(key, "exact retained support bytes");
  const kept = clearLocalProgressForStudent("child-a", { preserveAreas: ["learn_games"], storage });
  assert.equal(kept.residualCount, 0);
  for (const key of [...gameKeys, ...otherKeys]) assert.equal(storage.getItem(key), "exact retained support bytes");
  const cleared = clearLocalProgressForStudent("child-a", { storage });
  assert.equal(cleared.residualCount, 0);
  for (const key of gameKeys) assert.equal(storage.getItem(key), null);
  for (const key of otherKeys) assert.equal(storage.getItem(key), "exact retained support bytes");
});
