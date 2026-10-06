import { finishArcadeChapter, validArcadeChapter } from "./arcadeJourneys.js";
import { queueProgressSave } from "./progressSync.js";
import { applyCheckpoint, removeCheckpoint, readCheckpoint, validWordBridgeContentVersion } from "./gameCheckpoints.js";
import { normalizeAudioPreferences } from "./audio/audioPreferences.js";
import { hasSentenceDepartureEvidence, mergePracticeProgressRecords } from "./practiceCompletionRecords.js";
import { sanitizeCloudProgressPayload } from "./progressMerge.js";
import { DRUM_TRAIL_CONTENT_VERSION, LANTERN_LAGOON_VERSION, TOWER_TUMBLE_CONTENT_VERSION, RALLY_PALS_CONTENT_VERSION, BURROW_BUILDERS_CONTENT_VERSION, SOUND_BEAT_CONTENT_VERSION, LETTER_LEAP_CONTENT_VERSION, SOUND_RACER_CONTENT_VERSION, SPELL_SKATE_CONTENT_VERSION, SOUNDKEYS_CONTENT_VERSION, RHYME_POP_CONTENT_VERSION, REEL_READ_CONTENT_VERSION, WORD_CLIMB_CONTENT_VERSION, SENTENCE_EXPRESS_CONTENT_VERSION, WORD_BRIDGE_CONTENT_VERSION, ROCKET_RUN_CONTENT_VERSION, SOUND_SAFARI_CONTENT_VERSION, SENTENCE_GROVE_CONTENT_VERSION } from "../data/arcadeContentVersions.js";
import { elSkillsBlockCycles } from "../data/elSkillsBlockCycles.js";

// The engine has already reconstructed responses against its seeded bank.
// This boundary retains those immutable rows and verifies their delivered-cue
// shape, actual resumed origin and word denominator; it never uploads a local
// mutable audio ledger or converts flight events into literacy responses.
function validRocketCompletion(evidence) {
  const integer = (value, min, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(value) && value >= min && value <= max;
  if (!integer(evidence.sessionSeed, 0, 0xffffffff) || !integer(evidence.originRound, 0, 9)
    || (evidence.version !== undefined && evidence.version !== evidence.contentVersion)
    || evidence.formalAssessment !== false || evidence.masteryClaim !== false || evidence.motorCreatesEvidence !== false
    || !integer(evidence.totalRequired, 1) || evidence.wordsCompleted !== evidence.totalRequired
    || !Array.isArray(evidence.firstResponses) || !Array.isArray(evidence.assistedRetries)
    || !Array.isArray(evidence.completions) || evidence.completions.length !== 10 - evidence.originRound) return false;
  const rows = [...evidence.firstResponses, ...evidence.assistedRetries];
  const firstIds = new Set(evidence.firstResponses.map(row => row?.responseId));
  if (firstIds.size !== evidence.firstResponses.length || !rows.length) return false;
  const receiptMatches = (receipt, row, kind) => receipt && receipt.kind === kind && receipt.round === row.round
    && typeof receipt.src === "string" && receipt.src.startsWith("/")
    && Number.isFinite(receipt.at) && receipt.at >= 0 && receipt.at <= row.at
    && (kind === "target-phoneme" ? receipt.target === row.targetGrapheme
      : receipt.word === row.word && receipt.trialId === row.trialId && integer(receipt.flightId, 1));
  if (rows.some(row => !row || !integer(row.round, evidence.originRound, 9) || !integer(row.unit, 0)
    || row.responseId !== `rocket-run:${row.round}:${row.unit}` || !firstIds.has(row.responseId)
    || typeof row.trialId !== "string" || !row.trialId || typeof row.word !== "string" || !row.word
    || row.selected !== row.word || typeof row.correct !== "boolean" || !Number.isFinite(row.at) || row.at < 0
    || row.practiceOnly !== true || row.formalAssessment !== false || row.masteryClaim !== false || row.motorCreatesEvidence !== false
    || row.construct !== "heard-onset-print-word-selection" || row.wordVisible !== true || row.targetGraphemeVisible !== true
    || !Array.isArray(row.supportReasons) || row.supportReasons.length > 24
          || row.supportReasons.some(reason => typeof reason !== "string" || reason.length > 80)
    || !["delivered", "pending"].includes(row.deliveryAtResponse)
    || (row.deliveryAtResponse === "delivered" ? !receiptMatches(row.deliveryReceipt, row, "target-phoneme") : row.deliveryReceipt !== null)
    || !["none", "started", "delivered"].includes(row.wordAudioModel)
    || (row.wordAudioModel === "delivered" ? !receiptMatches(row.wordAudioReceipt, row, "approach-word") : row.wordAudioReceipt !== null)
    || (row.wordAudioStart !== null && !receiptMatches(row.wordAudioStart, row, "approach-word"))
    || (row.wordAudioModel === "none" && row.wordAudioStart !== null)
    || (row.wordAudioModel !== "none" && !row.supportReasons.includes("spoken-word-model"))
    || (row.wordAudioModel === "started" && row.wordAudioStart === null))) return false;
  let total = 0;
  for (const [index, completion] of evidence.completions.entries()) {
    const round = evidence.originRound + index;
    if (!completion || completion.round !== round || !integer(completion.needed, 1)
      || !Array.isArray(completion.caughtIds) || completion.caughtIds.length !== completion.needed
      || new Set(completion.caughtIds).size !== completion.needed
      || !Array.isArray(completion.words) || completion.words.length !== completion.needed
      || completion.practiceOnly !== true || completion.formalAssessment !== false
      || completion.masteryClaim !== false || completion.motorCreatesEvidence !== false) return false;
    const accepted = rows.filter(row => row.round === round && row.correct).sort((a, b) => a.unit - b.unit);
    if (rows.some(row => row.round === round && (row.unit >= completion.needed
      || row.targetGrapheme !== completion.targetGrapheme || row.at > completion.at))
      || accepted.length !== completion.needed || accepted.some((row, unit) => row.unit !== unit
      || row.trialId !== completion.caughtIds[unit] || row.word !== completion.words[unit])) return false;
    total += completion.needed;
  }
  return total === evidence.totalRequired;
}

function authoredCompletionContext(gameId, evidence, chapter, difficulty) {
  const physicalVersion = { "tower-tumble": TOWER_TUMBLE_CONTENT_VERSION, "rally-pals": RALLY_PALS_CONTENT_VERSION, "burrow-builders": BURROW_BUILDERS_CONTENT_VERSION }[gameId];
  const upgraded = {
    "sound-beat": { version: SOUND_BEAT_CONTENT_VERSION, construct: "recorded-unit-rhythmic-segmentation" },
    "letter-leap": { version: LETTER_LEAP_CONTENT_VERSION, construct: "heard-word-grapheme-encoding" },
    "sound-racer": { version: SOUND_RACER_CONTENT_VERSION, construct: "grapheme-phoneme-onset-recognition" },
    "grammar-grind": { version: SPELL_SKATE_CONTENT_VERSION, construct: "picture-audio-ordered-grapheme-encoding" },
    "soundkeys": { version: SOUNDKEYS_CONTENT_VERSION, construct: "heard-word-ordered-grapheme-encoding" },
    "rhyme-pop": { version: RHYME_POP_CONTENT_VERSION, construct: "cued-word-rhyme-recognition" },
    "reel-read": { version: REEL_READ_CONTENT_VERSION, construct: "cued-word-parts-and-meaning" },
    "sound-safari": { version: SOUND_SAFARI_CONTENT_VERSION, construct: "heard-word-ordered-phoneme-grapheme-selection" },
    "star-gallery": { version: SENTENCE_GROVE_CONTENT_VERSION, construct: "mixed-printed-language-repair" },
    "rocket-run": { version: ROCKET_RUN_CONTENT_VERSION, construct: "heard-onset-print-word-selection" },
    "word-bridge": { version: WORD_BRIDGE_CONTENT_VERSION, construct: "model-supported-grapheme-matching-ordered-reconstruction" },
    "word-climb": { version: WORD_CLIMB_CONTENT_VERSION, construct: "printed-word-initial-phoneme-identification" },
    "sentence-express": { version: SENTENCE_EXPRESS_CONTENT_VERSION, construct: "model-supported-printed-sentence-reconstruction-and-repair" }
  }[gameId];
  const actualVersion = evidence?.contentVersion || evidence?.version;
  const version = gameId === "word-bridge" && validWordBridgeContentVersion(actualVersion) ? actualVersion
    : gameId === "drum-trail" ? DRUM_TRAIL_CONTENT_VERSION
    : gameId === "lantern-lagoon" ? LANTERN_LAGOON_VERSION
      : upgraded?.version || physicalVersion || null;
  if (!version || (evidence?.contentVersion || evidence?.version) !== version
    || !Number.isSafeInteger(evidence.sessionSeed) || evidence.sessionSeed < 0
    || !validArcadeChapter(chapter) || evidence.journeyIndex !== chapter) return null;
  const context = { sessionSeed: evidence.sessionSeed, journeyIndex: chapter, formalAssessment: false, masteryClaim: false };
  if (upgraded) {
    if (evidence.construct !== upgraded.construct || evidence.practiceOnly !== true) return null;
    if (gameId === "soundkeys" && (!Number.isInteger(evidence.originRound) || evidence.originRound < 0 || evidence.originRound > 23)) return null;
    if (gameId === "reel-read" && (!Number.isInteger(evidence.originStage) || evidence.originStage < 0 || evidence.originStage > 9)) return null;
    if (gameId === "rocket-run" && !validRocketCompletion(evidence)) return null;
    if (gameId === "rhyme-pop") {
      const stages = { easy: 24, medium: 30, hard: 30 }[difficulty];
      if (!stages || !Number.isInteger(evidence.originStage) || evidence.originStage < 0 || evidence.originStage >= stages) return null;
    }
    let worldContext = {};
    if (gameId === "sound-safari" || gameId === "star-gallery") {
      if (!Array.isArray(evidence.firstResponses) || !Array.isArray(evidence.assistedRetries)) return null;
      const rows = [...(evidence.firstResponses || []), ...(evidence.assistedRetries || [])];
      const countName = gameId === "sound-safari" ? "nativeV2CaptureCount" : "nativeV2RepairCount";
      if (evidence.sessionSeed > 0xffffffff || !Number.isSafeInteger(evidence.originStage)
        || evidence.originStage < 0 || evidence.originStage > 9 || typeof evidence.legacyResume !== "boolean"
        || (!evidence.legacyResume && evidence.originStage !== 0)
        || !Array.isArray(evidence.firstResponses) || !Array.isArray(evidence.assistedRetries)
        || !Number.isSafeInteger(evidence[countName]) || evidence[countName] < 1 || evidence[countName] !== rows.length
        || (gameId === "star-gallery" && evidence.originRepairSlot !== evidence.originStage * 4)
        || new Set(evidence.firstResponses.map(row => row?.responseId)).size !== evidence.firstResponses.length
        || evidence.assistedRetries.some(row => !evidence.firstResponses.some(first => first.responseId === row.responseId)
          || !row.supportReasons?.includes("repeat-after-response"))
        || rows.some(row => typeof row?.roundId !== "string"
          || !row.roundId.startsWith(`${version}:${difficulty}:${evidence.sessionSeed}:${chapter}:`)
          || typeof row.responseId !== "string" || !row.responseId.startsWith(`${row.roundId}:`)
          || (gameId === "sound-safari" && (row.roundId !== `${version}:${difficulty}:${evidence.sessionSeed}:${chapter}:${row.stage}:${row.wordSlot}`
            || !Number.isSafeInteger(row.wordSlot) || row.wordSlot < 0 || row.wordSlot > 2
            || !Number.isSafeInteger(row.slot) || row.slot < 0 || row.responseId !== `${row.roundId}:${row.slot}`))
          || (gameId === "star-gallery" && (row.roundId !== `${version}:${difficulty}:${evidence.sessionSeed}:${chapter}:${row.stage}:${row.itemSlot}:${row.repairId}`
            || !Number.isSafeInteger(row.itemSlot) || row.itemSlot < 0 || row.itemSlot > 3
            || typeof row.repairId !== "string" || !row.repairId || row.responseId !== `${row.roundId}:repair`))
          || row.construct !== upgraded.construct || row.practiceOnly !== true
          || !Number.isSafeInteger(row.stage) || row.stage < evidence.originStage || row.stage > 9
          || !Number.isFinite(row.responseAt) || row.responseAt < 0
          || !["pending", "delivered", "unavailable"].includes(row.deliveryAtResponse)
          || typeof row.modelUsed !== "boolean" || typeof row.correct !== "boolean"
          || !Array.isArray(row.supportReasons)
          || (row.deliveryAtResponse === "delivered" && (!row.deliveryReceipt
            || typeof row.deliveryReceipt.source !== "string" || !row.deliveryReceipt.source.startsWith("/")
            || !Number.isFinite(row.deliveryReceipt.endedAt) || row.deliveryReceipt.endedAt < 0
            || row.deliveryReceipt.endedAt > row.responseAt))
          || (gameId === "sound-safari" && (typeof row.independentOrderedSoundPractice !== "boolean"
            || typeof row.soundEnabled !== "boolean" || row.wordVisible !== false
            || !["word", "meaning-context"].includes(row.pictureKind)
            || !["pending", "delivered", "unavailable"].includes(row.pictureDelivery)
            || (row.pictureDelivery === "delivered" && (!row.pictureReceipt
              || typeof row.pictureReceipt.source !== "string" || !row.pictureReceipt.source.startsWith("/")
              || !Number.isFinite(row.pictureReceipt.decodedAt) || row.pictureReceipt.decodedAt < 0
              || row.pictureReceipt.decodedAt > row.responseAt))
            || (row.independentOrderedSoundPractice && (!row.correct || row.modelUsed
              || row.deliveryAtResponse !== "delivered" || row.pictureDelivery !== "delivered"
              || row.pictureKind !== "word" || !row.soundEnabled || row.supportReasons.length))))
          || (gameId === "star-gallery" && (typeof row.independentPrintedRepairPractice !== "boolean"
            || typeof row.subtype !== "string" || !row.subtype
            || typeof row.printedBrokenStimulus !== "string" || !row.printedBrokenStimulus
            || row.optionalAudioRequired !== false || typeof row.spokenStimulusDelivered !== "boolean"
            || (row.independentPrintedRepairPractice && (!row.correct || row.modelUsed
              || row.spokenStimulusDelivered || row.supportReasons.length)))))) return null;
      worldContext = { originStage: evidence.originStage, legacyResume: evidence.legacyResume, [countName]: evidence[countName],
        ...(gameId === "star-gallery" ? { originRepairSlot: evidence.originRepairSlot,
          taskKinds: [...new Set(rows.map(row => row.subtype))] } : {}) };
    }
    let bridgeContext = {};
    if (gameId === "word-bridge") {
      const rowCount = (evidence.firstResponses?.length || 0) + (evidence.assistedRetries?.length || 0);
      if ((evidence.version !== undefined && evidence.contentVersion !== undefined && evidence.version !== evidence.contentVersion)
        || evidence.sessionSeed > 0xffffffff || !Number.isSafeInteger(evidence.originStage)
        || evidence.originStage < 0 || evidence.originStage > 9
        || evidence.legacyResume !== (evidence.originStage > 0)
        || !Array.isArray(evidence.firstResponses) || !Array.isArray(evidence.assistedRetries)
        || !Number.isSafeInteger(evidence.nativeV2PlacementCount) || evidence.nativeV2PlacementCount < 1
        || evidence.nativeV2PlacementCount !== rowCount
        || [...evidence.firstResponses, ...evidence.assistedRetries].some(row =>
          typeof row?.roundId !== "string" || !row.roundId.startsWith(`${version}:`)
          || typeof row.responseId !== "string" || !row.responseId.startsWith(`${row.roundId}:`))) return null;
      bridgeContext = { originStage: evidence.originStage, legacyResume: evidence.legacyResume,
        nativeV2PlacementCount: evidence.nativeV2PlacementCount, modelUsed: true, independentEncodingPractice: false };
    }
    let climbContext = {};
    if (gameId === "word-climb") {
      const summit = { easy: 6, medium: 8, hard: 10 }[difficulty];
      const baseStage = { easy: 0, medium: 1, hard: 2 }[difficulty];
      const rowCount = (evidence.firstResponses?.length || 0) + (evidence.assistedRetries?.length || 0);
      if (!summit || !Number.isInteger(evidence.originStep) || evidence.originStep < 0 || evidence.originStep >= summit
        || !Number.isSafeInteger(evidence.stageIndex) || evidence.stageIndex < 0
        || typeof evidence.legacyResume !== "boolean"
        || (!evidence.legacyResume && evidence.stageIndex !== baseStage + chapter * 3)
        || !Number.isSafeInteger(evidence.nativeV2LandingCount) || evidence.nativeV2LandingCount < 1
        || evidence.nativeV2LandingCount !== rowCount) return null;
      climbContext = { originStep: evidence.originStep, stageIndex: evidence.stageIndex,
        legacyResume: evidence.legacyResume, nativeV2LandingCount: evidence.nativeV2LandingCount };
    }
    let sentenceContext = {};
    if (gameId === "sentence-express") {
      const { originStage, originTrainIndex, originTrainSlot, legacyResume, legacyMainComplete, originQueue,
        legacyRunTotals, nativeV2ChoiceCount, nativeV2DepartureCount } = evidence;
      const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
      if (!integer(originStage, 0, 9) || !integer(originTrainIndex, 0, 2)
        || originTrainSlot !== originStage * 3 + originTrainIndex
        || typeof legacyResume !== "boolean" || typeof legacyMainComplete !== "boolean"
        || (!legacyResume && (originTrainSlot !== 0 || legacyMainComplete))
        || !Array.isArray(originQueue) || originQueue.length > 3
        || originQueue.some(id => typeof id !== "string" || !id) || new Set(originQueue).size !== originQueue.length
        || (!legacyResume && originQueue.length)
        || !legacyRunTotals || !integer(legacyRunTotals.baseStart, 0, originStage)
        || !integer(legacyRunTotals.levelsDone, 0, 10) || legacyRunTotals.baseStart + legacyRunTotals.levelsDone !== originStage
        || !integer(legacyRunTotals.starSum, 0, legacyRunTotals.levelsDone * 3)
        || !integer(legacyRunTotals.score, legacyRunTotals.starSum * 10, 100000)
        || (legacyRunTotals.score - legacyRunTotals.starSum * 10) % 5
        || !integer(legacyRunTotals.words, legacyRunTotals.levelsDone ? legacyRunTotals.levelsDone : 0, 1000)
        || (!legacyRunTotals.levelsDone && (legacyRunTotals.words || legacyRunTotals.score || legacyRunTotals.starSum))
        || (!legacyResume && legacyRunTotals.levelsDone > 0)
        || !Array.isArray(evidence.firstResponses) || !Array.isArray(evidence.assistedRetries)
        || !integer(nativeV2ChoiceCount, 0, 100000)
        || nativeV2ChoiceCount !== evidence.firstResponses.length + evidence.assistedRetries.length
        || !Array.isArray(evidence.departures) || !integer(nativeV2DepartureCount, 1, 30)
        || nativeV2DepartureCount !== evidence.departures.length) return null;
      sentenceContext = { originStage, originTrainIndex, originTrainSlot, legacyResume, legacyMainComplete,
        originQueue: [...originQueue], legacyRunTotals: { baseStart: legacyRunTotals.baseStart,
          levelsDone: legacyRunTotals.levelsDone, starSum: legacyRunTotals.starSum,
          score: legacyRunTotals.score, words: legacyRunTotals.words },
        nativeV2ChoiceCount, nativeV2DepartureCount, modelUsed: true, independentSentencePractice: false };
      if (!hasSentenceDepartureEvidence({ gameId, contentVersion: version, practiceOnly: true, independent: false,
        steps: evidence.firstResponses, assistedRetries: evidence.assistedRetries, sends: evidence.sends,
        departures: evidence.departures, practiceContext: { ...context, construct: upgraded.construct, ...sentenceContext } })) return null;
    }
    return { contentVersion: version, practiceContext: { ...context,
      construct: upgraded.construct, motorCreatesEvidence: false,
      ...(gameId === "soundkeys" ? { originRound: evidence.originRound } : {}),
      ...(gameId === "reel-read" ? { originStage: evidence.originStage } : {}),
      ...(gameId === "rocket-run" ? { originRound: evidence.originRound,
        wordsCompleted: evidence.wordsCompleted, totalRequired: evidence.totalRequired } : {}),
      ...(gameId === "rhyme-pop" ? { originStage: evidence.originStage } : {}), ...climbContext, ...sentenceContext, ...bridgeContext, ...worldContext } };
  }
  if (physicalVersion) return { contentVersion: version, practiceContext: { ...context,
    construct: { "tower-tumble": "heard-word-grapheme-encoding", "rally-pals": "phoneme-grapheme-and-spoken-rime-shot-intent", "burrow-builders": "picture-audio-encoding-and-spatial-reading" }[gameId],
    motorCreatesEvidence: false } };
  if (gameId === "drum-trail") return { contentVersion: version, practiceContext: { ...context, construct: "oral-whole-word-syllable-count" } };
  if (!["reading", "listening", "together"].includes(evidence.mode)) return null;
  const taughtCycle = Number.isInteger(evidence.taughtCycle) && elSkillsBlockCycles.some(cycle => cycle.cycleNumber === evidence.taughtCycle)
    ? evidence.taughtCycle : null;
  if (evidence.mode === "reading" && taughtCycle === null) return null;
  return { contentVersion: version, practiceContext: { ...context, mode: evidence.mode, taughtCycle } };
}

const STORAGE_PREFIX = "literacy-guide-learn-games";
const DEFAULT_SCOPE = "default";

let activeProgressScope = DEFAULT_SCOPE;

function storageKey(progressScopeKey = DEFAULT_SCOPE) {
  return `${STORAGE_PREFIX}:${progressScopeKey || DEFAULT_SCOPE}`;
}

function baseState() {
  return {
    difficulty: "easy",
    ...normalizeAudioPreferences(),
    games: {}
  };
}

export function loadLearnGamesProgress(progressScopeKey = DEFAULT_SCOPE) {
  if (typeof window === "undefined") return baseState();

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey(progressScopeKey)) || "null");
    const source = parsed && typeof parsed === "object" ? parsed : {};
    return {
      ...baseState(),
      ...source,
      ...normalizeAudioPreferences(source),
      games: parsed?.games && typeof parsed.games === "object" ? parsed.games : {}
    };
  } catch {
    return baseState();
  }
}

export function saveLearnGamesProgress(progressScopeKey = DEFAULT_SCOPE, progress = baseState()) {
  if (typeof window === "undefined") return;
  const next = {
    ...baseState(),
    ...progress,
    ...normalizeAudioPreferences(progress),
    games: progress.games || {}
  };
  window.localStorage.setItem(storageKey(progressScopeKey), JSON.stringify(next));
  // Local storage is the durable commit. Expose that outcome if subsequent
  // queue bookkeeping throws, so recovery can enqueue without saving twice.
  try {
    queueLearnGamesProgress(progressScopeKey, next);
  } catch (cause) {
    const error = new Error("Game saved locally; progress sync needs retry", { cause });
    error.savedProgress = next;
    throw error;
  }
}

export function queueLearnGamesProgress(progressScopeKey, progress) {
  // A false admission already retains the entry in progressSync's volatile
  // recovery and emits its shared notice. Do not make a second queue for it.
  return queueProgressSave("learn_games", "__all__", sanitizeCloudProgressPayload("learn_games", { v: 1, ...progress }), { scopeKey: progressScopeKey });
}

export function saveLearnGamesSettings(progressScopeKey = DEFAULT_SCOPE, settings = {}) {
  const current = loadLearnGamesProgress(progressScopeKey);
  const next = { ...current, ...settings, games: current.games };
  saveLearnGamesProgress(progressScopeKey, next);
  return next;
}

export function getLearnGameProgress(progress, gameId) {
  return progress?.games?.[gameId] || {
    stars: 0,
    highScore: 0,
    wordsCompleted: 0,
    plays: 0
  };
}

export function getLearnGameBestSplit(progressScopeKey = DEFAULT_SCOPE, gameId, difficulty, levelIndex) {
  const progress = loadLearnGamesProgress(progressScopeKey);
  const splits = progress?.games?.[gameId]?.bestSplits?.[String(difficulty || "")];
  const value = splits?.[String(levelIndex)];
  return value && typeof value === "object" ? value : null;
}

export function saveLearnGameBestSplit(
  progressScopeKey = DEFAULT_SCOPE,
  gameId,
  difficulty,
  levelIndex,
  split = {}
) {
  const current = loadLearnGamesProgress(progressScopeKey);
  const previous = getLearnGameProgress(current, gameId);
  const difficultyKey = String(difficulty || "");
  const levelKey = String(levelIndex);
  const existing = previous.bestSplits?.[difficultyKey]?.[levelKey] || {};
  const next = {
    ...current,
    games: {
      ...current.games,
      [gameId]: {
        ...previous,
        bestSplits: {
          ...(previous.bestSplits || {}),
          [difficultyKey]: {
            ...(previous.bestSplits?.[difficultyKey] || {}),
            [levelKey]: { ...existing, ...split }
          }
        }
      }
    }
  };
  saveLearnGamesProgress(progressScopeKey, next);
  return next;
}

export function saveLearnGameResult(progressScopeKey = DEFAULT_SCOPE, gameId, stars = 0, score = 0, wordsCompleted = 0, evidence = null, difficulty, chapter) {
  const current = loadLearnGamesProgress(progressScopeKey);
  const previous = getLearnGameProgress(current, gameId);
  let nextGame = {
    ...previous,
    stars: Math.max(previous.stars || 0, stars || 0),
    highScore: Math.max(previous.highScore || 0, score || 0),
    wordsCompleted: Math.max(previous.wordsCompleted || 0, wordsCompleted || 0),
    plays: (previous.plays || 0) + 1,
    lastPlayedAt: new Date().toISOString()
  };
  const authoredContext = gameId === "rocket-run" && evidence?.wordsCompleted !== wordsCompleted
    ? null : authoredCompletionContext(gameId, evidence, chapter, difficulty);
  const completion = {
    contentVersion: "learn-game-practice-v1", ...authoredContext,
    gameId, practiceOnly: true, independent: false,
    steps: evidence?.firstResponses || [], assistedRetries: evidence?.assistedRetries || [],
    ...(gameId === "rocket-run" && authoredContext ? { roundCompletions: evidence.completions } : {}),
    ...(gameId === "sentence-express" && authoredContext ? { sends: evidence.sends, departures: evidence.departures } : {})
  };
  if (evidence?.firstResponses?.length || hasSentenceDepartureEvidence(completion)) {
    nextGame.practiceRecord = mergePracticeProgressRecords(previous.practiceRecord, {
      v: 3,
      status: "completed",
      completions: [{
        id: globalThis.crypto.randomUUID(),
        ...completion,
        completedAt: nextGame.lastPlayedAt,
      }]
    });
  }
  nextGame = finishArcadeChapter(nextGame, gameId, difficulty, chapter);
  const games = { ...current.games, [gameId]: nextGame };
  // Omitted difficulty preserves the legacy utility contract. Player saves
  // retire only the finished ladder in the SAME write as its result/evidence.
  const next = { ...current, games: difficulty === undefined ? games : removeCheckpoint(games, gameId, difficulty) };
  saveLearnGamesProgress(progressScopeKey, next);
  return next;
}

// --- Resume checkpoints: remember which ladder level a child reached, per game
// AND difficulty, so a long 5-round / 10-stage session can be picked back up. ---
export function loadGameCheckpoint(progressScopeKey = DEFAULT_SCOPE, gameId, difficulty) {
  return readCheckpoint(loadLearnGamesProgress(progressScopeKey).games, gameId, difficulty);
}

export function saveGameCheckpoint(progressScopeKey = DEFAULT_SCOPE, gameId, difficulty, level = 0, totalLevels = 0, sessionSeed, chapter, metadata) {
  const current = loadLearnGamesProgress(progressScopeKey);
  if (gameId === "rocket-run" && (!Number.isSafeInteger(level) || level < 0 || level > 9 || totalLevels !== 10
    || !Number.isSafeInteger(sessionSeed) || sessionSeed < 0 || sessionSeed > 0xffffffff
    || (chapter !== undefined && !validArcadeChapter(chapter)))) return current;
  const next = { ...current, games: applyCheckpoint(current.games, gameId, difficulty, level, totalLevels, sessionSeed, chapter, metadata) };
  saveLearnGamesProgress(progressScopeKey, next);
  return next;
}

export function clearGameCheckpoint(progressScopeKey = DEFAULT_SCOPE, gameId, difficulty) {
  const current = loadLearnGamesProgress(progressScopeKey);
  const games = removeCheckpoint(current.games, gameId, difficulty);
  if (games === current.games) return current;
  const next = { ...current, games };
  saveLearnGamesProgress(progressScopeKey, next);
  return next;
}

export function setActiveLearnGamesProgressScope(progressScopeKey = DEFAULT_SCOPE) {
  activeProgressScope = progressScopeKey || DEFAULT_SCOPE;
}

export function clearActiveLearnGamesProgressScope() {
  activeProgressScope = DEFAULT_SCOPE;
}

export function saveProgress(gameId, stars = 0, score = 0, wordsCompleted = 0) {
  return saveLearnGameResult(activeProgressScope, gameId, stars, score, wordsCompleted);
}

export function loadProgress(gameId) {
  return getLearnGameProgress(loadLearnGamesProgress(activeProgressScope), gameId);
}
