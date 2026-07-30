import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { baseQuestState } from "../../src/utils/questProgress.js";
import {
  createQuestFrameBudgetState,
  normalizeQuestSettings,
  resolveQuestQuality,
  sampleQuestFrameBudget
} from "../../src/utils/questPerformance.js";
import { chapterShortcutReviewPlan, freeRoamReviewPlan } from "../../src/utils/questReviewMode.js";
import { buildTrailSection } from "../../src/utils/questHub.js";
import { clampQuestWorldResume } from "../../src/utils/questWorldResume.js";
import {
  addQuestActiveTime,
  beginQuestSession,
  endQuestSession,
  questTelemetryTotals,
  recordQuestInteractionEvent,
  recordQuestRuntimeEvent,
  recordQuestTelemetryAnswer,
  recordQuestTelemetryStop
} from "../../src/utils/questTelemetry.js";
import { buildQuestMasteryReport, questEvidenceGuidance } from "../../src/utils/questReport.js";
import {
  canonicalQuestDeviceEvidence,
  evaluateQuestDeviceEvidence,
  QUEST_DEVICE_RELEASE_PROFILES,
  sealQuestDeviceEvidence
} from "../../src/utils/questDeviceAcceptance.js";
import {
  canonicalQuestHumanObservation,
  evaluateQuestHumanAcceptance,
  sealQuestHumanObservation,
  validateQuestHumanObservation,
  verifyQuestHumanObservation
} from "../../src/utils/questHumanAcceptance.js";
import {
  PIXEL_BEASTIE_DIRECTIONS,
  PIXEL_BEASTIE_FRAME,
  PIXEL_BEASTIE_FRAMES_PER_DIRECTION,
  PIXEL_BEASTIE_ACTION_POSES
} from "../../src/components/quest/world/questPixelAvatar.js";
import {
  QUEST_PIXEL_CHAPTER_CASTS,
  QUEST_PIXEL_NAMED_CASTS,
  QUEST_PIXEL_RESIDENT_IDLE_PATHS,
  QUEST_PIXEL_RESIDENT_ITEM_PATHS,
  QUEST_PIXEL_RESIDENT_JUMP_PATHS,
  QUEST_PIXEL_RESIDENT_PATHS,
  questPixelCeremonyCast,
  questPixelChapterCast,
  questPixelNamedChapterCast,
  questPixelMemoryResidentKey,
  questPixelResidentFrameSize,
  questPixelResidentKey,
  questPixelResidentIdlePath,
  questPixelResidentItemPath,
  questPixelResidentJumpPath,
  questPixelResidentPath
} from "../../src/data/questPixelCast.js";
import { QUEST_CHAPTERS } from "../../src/data/questChapters.js";
import {
  AUTHORED_PIXEL_MAPS,
  authoredPixelRouteCenters,
  FOSSIL_AUTHORED_MAPS,
  FORGE_AUTHORED_MAPS,
  GLASS_AUTHORED_MAPS,
  LANTERN_AUTHORED_MAPS,
  RIVER_AUTHORED_MAPS,
  samplePixelMapRoute,
  SEEDWAKE_AUTHORED_MAPS,
  STAR_AUTHORED_MAPS,
  STORM_AUTHORED_MAPS,
  STOP_PIXEL_MAPS
} from "../../src/data/questPixelMaps.js";

function pngDimensions(filePath) {
  const png = fs.readFileSync(filePath);
  assert.equal(png.toString("ascii", 1, 4), "PNG", `${filePath} is not a PNG`);
  return Object.freeze({
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20)
  });
}

test("performance tiers respect explicit accessibility and low-device signals", () => {
  assert.deepEqual(normalizeQuestSettings({ quietSoundscape: true }), {
    displayMode: "auto",
    reducedMotion: false,
    highContrast: false,
    quietSoundscape: true,
    soundEnabled: true
  });
  // The quest's own mute: sticky, and only an explicit false turns it off.
  assert.equal(normalizeQuestSettings({ soundEnabled: false }).soundEnabled, false);
  assert.equal(normalizeQuestSettings({}).soundEnabled, true);
  assert.equal(resolveQuestQuality({ displayMode: "pixel", webglAvailable: false }).id, "pixel");
  assert.equal(resolveQuestQuality({ displayMode: "2d" }).id, "2d");
  assert.equal(resolveQuestQuality({ displayMode: "rich", deviceMemory: 1 }).id, "rich");
  assert.equal(resolveQuestQuality({ displayMode: "rich", reducedMotion: true }).motionScale, 0);
  assert.equal(resolveQuestQuality({ displayMode: "auto", reducedMotion: true }).id, "pixel");
  assert.equal(resolveQuestQuality({ displayMode: "auto", reducedMotion: true }).motionScale, 0);
  assert.equal(resolveQuestQuality({ displayMode: "pixel", reducedMotion: true }).motionScale, 0);
  assert.equal(resolveQuestQuality({ deviceMemory: 1, hardwareConcurrency: 8 }).id, "2d");
  assert.equal(resolveQuestQuality({ deviceMemory: 8, hardwareConcurrency: 1 }).id, "2d");
  assert.equal(resolveQuestQuality({ saveData: true }).id, "2d");
  assert.equal(resolveQuestQuality({ displayMode: "pixel", saveData: true }).id, "pixel");
  assert.equal(resolveQuestQuality({ deviceMemory: 2, hardwareConcurrency: 2 }).id, "pixel");
  assert.equal(resolveQuestQuality({ deviceMemory: 8, hardwareConcurrency: 8, width: 1280 }).id, "pixel");
  assert.equal(resolveQuestQuality({ webglAvailable: false }).id, "pixel");
  assert.equal(resolveQuestQuality({ displayMode: "low", deviceMemory: 8 }).id, "low");
  const root = fs.readFileSync("src/components/quest/QuestRoot.jsx", "utf8");
  assert.match(root, /lazyWithRetry\([\s\S]*?import\("\.\/world\/QuestHub\.jsx"\)/, "the opt-in 3D renderer still inflates the flagship's initial download");
  assert.doesNotMatch(root, /import QuestHub from/, "the opt-in 3D renderer is still eagerly imported");
});

test("ordinary frame-budget sampling returns no allocation wrapper", () => {
  const budget = createQuestFrameBudgetState("pixel");
  for (let index = 0; index < 120; index += 1) {
    assert.equal(sampleQuestFrameBudget(budget, 16.7), null);
  }
  assert.equal(budget.tierId, "pixel");
  assert.equal(budget.reportFrames, 75);
});

test("runtime quality only falls after sustained missed frame budgets", () => {
  let budget = createQuestFrameBudgetState("rich");
  const originalBudget = budget;
  let signal = null;
  for (let index = 0; index < 250; index += 1) {
    const emitted = sampleQuestFrameBudget(budget, 16.7);
    assert.equal(emitted, null, "ordinary frame sampling must not allocate a result wrapper");
  }
  assert.equal(budget, originalBudget, "healthy sampling must not allocate replacement budget objects");
  assert.equal(signal, null, "healthy rendering must stay rich");

  budget = createQuestFrameBudgetState("rich");
  for (let index = 0; index < 220 && !signal; index += 1) {
    const priorBudget = budget;
    const emitted = sampleQuestFrameBudget(budget, 40);
    if (!emitted) {
      assert.equal(budget, priorBudget, "pre-signal sampling must retain budget identity");
      continue;
    }
    assert.notEqual(emitted.state, priorBudget, "a quality change must reset into a fresh tier budget");
    budget = emitted.state;
    signal = emitted.signal;
  }
  assert.equal(signal?.type, "quality-change");
  assert.equal(signal?.fromTier, "rich");
  assert.equal(signal?.toTier, "balanced");
  assert.ok(signal.sampledFrames >= 150);
});

test("an emergency severe-frame streak bypasses the normal warmup", () => {
  let budget = createQuestFrameBudgetState("low");
  let signal = null;
  for (let index = 0; index < 8; index += 1) {
    const emitted = sampleQuestFrameBudget(budget, 140);
    if (!emitted) continue;
    budget = emitted.state;
    signal = emitted.signal;
  }
  assert.equal(signal?.fromTier, "low");
  assert.equal(signal?.toTier, "2d");
  assert.equal(signal?.reason, "sustained-severe-frames");
});

test("the pixel renderer reports sustained frame failure and falls back to accessible 2D", () => {
  let budget = createQuestFrameBudgetState("pixel");
  let signal = null;
  for (let index = 0; index < 8; index += 1) {
    const emitted = sampleQuestFrameBudget(budget, 140);
    if (!emitted) continue;
    budget = emitted.state;
    signal = emitted.signal;
  }
  assert.equal(signal?.fromTier, "pixel");
  assert.equal(signal?.toTier, "2d");
  assert.equal(signal?.reason, "sustained-severe-frames");
});

test("runtime diagnostics survive session completion and report fallback evidence", () => {
  let state = beginQuestSession(baseQuestState(), {
    id: "runtime-session",
    at: "2026-07-14T08:00:00.000Z",
    qualityTier: "rich"
  });
  state = recordQuestRuntimeEvent(state, {
    type: "scene-ready",
    tierId: "rich",
    loadMs: 1800,
    assetRequests: 24,
    assetBytes: 800000,
    at: "2026-07-14T08:00:30.000Z"
  });
  state = recordQuestRuntimeEvent(state, {
    type: "scene-ready",
    tierId: "rich",
    loadMs: 3200,
    assetRequests: 31,
    assetBytes: 1200000,
    at: "2026-07-14T08:00:45.000Z"
  });
  state = recordQuestRuntimeEvent(state, {
    type: "quality-change",
    fromTier: "rich",
    toTier: "balanced",
    sampledFrames: 180,
    frameMsTotal: 7200,
    longFrames: 165,
    at: "2026-07-14T08:01:00.000Z"
  });
  state = recordQuestRuntimeEvent(state, {
    type: "context-lost",
    fromTier: "balanced",
    toTier: "2d",
    at: "2026-07-14T08:02:00.000Z"
  });
  state = endQuestSession(state, { at: "2026-07-14T08:03:00.000Z" });
  const totals = questTelemetryTotals(state.telemetry);
  assert.equal(totals.sampledFrames, 180);
  assert.equal(totals.averageFrameMs, 40);
  assert.equal(totals.qualityTransitions, 1);
  assert.equal(totals.contextLosses, 1);
  assert.equal(totals.fallbackSessions, 1);
  assert.equal(totals.sceneStarts, 2);
  assert.equal(totals.averageSceneLoadMs, 2500);
  assert.equal(totals.slowSceneStarts, 1);
  assert.equal(totals.slowSceneStartRate, 0.5);
  assert.equal(totals.averageSceneAssetRequests, 27.5);
  assert.equal(totals.averageSceneAssetBytes, 1000000);
  assert.equal(totals.peakSceneAssetRequests, 31);
  assert.equal(totals.peakSceneAssetBytes, 1200000);
  const report = buildQuestMasteryReport(state);
  assert.equal(report.runtime.averageSceneLoadMs, 2500);
  assert.equal(report.runtime.slowSceneStartRate, 50);
  assert.equal(report.runtime.averageSceneAssetRequests, 28);
  assert.equal(report.runtime.averageSceneAssetBytes, 1000000);
  assert.equal(report.runtime.peakSceneAssetRequests, 31);
  assert.equal(report.runtime.peakSceneAssetBytes, 1200000);
});

test("connection interruptions and recovered saves remain honest in the adult report", () => {
  let state = beginQuestSession(baseQuestState(), {
    id: "offline-session",
    at: "2026-07-18T08:00:00.000Z",
    qualityTier: "pixel"
  });
  state = recordQuestRuntimeEvent(state, {
    type: "network-offline",
    at: "2026-07-18T08:01:00.000Z"
  });
  const duplicateOffline = recordQuestRuntimeEvent(state, { type: "network-offline" });
  assert.equal(duplicateOffline, state, "one offline period must not be counted repeatedly");
  const duplicateDeferral = recordQuestRuntimeEvent(state, { type: "sync-deferred" });
  assert.equal(duplicateDeferral, state, "one pending save must not inflate deferral evidence");
  state = recordQuestRuntimeEvent(state, { type: "network-online" });
  state = recordQuestRuntimeEvent(state, {
    type: "sync-recovered",
    at: "2026-07-18T08:02:00.000Z"
  });
  const duplicateRecovery = recordQuestRuntimeEvent(state, { type: "sync-recovered" });
  assert.equal(duplicateRecovery, state, "one recovered queue must not be counted repeatedly");
  state = endQuestSession(state, { at: "2026-07-18T08:03:00.000Z" });

  const totals = questTelemetryTotals(state.telemetry);
  assert.equal(totals.networkInterruptions, 1);
  assert.equal(totals.syncDeferrals, 1);
  assert.equal(totals.syncRecoveries, 1);
  assert.equal(totals.syncPending, false);
  assert.equal(totals.lastSyncRecoveredAt, "2026-07-18T08:02:00.000Z");

  const report = buildQuestMasteryReport(state);
  assert.equal(report.runtime.networkInterruptions, 1);
  assert.equal(report.runtime.syncDeferrals, 1);
  assert.equal(report.runtime.syncRecoveries, 1);
  assert.equal(report.runtime.syncPending, false);
});

test("offline shell readiness, cold starts, and chapter caches remain honest in the adult report", () => {
  let state = beginQuestSession(baseQuestState(), {
    id: "offline-shell-session",
    at: "2026-07-18T08:00:00.000Z",
    qualityTier: "pixel"
  });
  state = recordQuestRuntimeEvent(state, {
    id: "shell-ready:build-a:1",
    type: "offline-shell-ready",
    at: "2026-07-18T08:00:05.000Z"
  });
  const duplicateReady = recordQuestRuntimeEvent(state, {
    id: "shell-ready:build-a:1",
    type: "offline-shell-ready",
    at: "2026-07-18T08:00:05.000Z"
  });
  assert.equal(duplicateReady, state, "one worker message must not inflate offline evidence");
  state = recordQuestRuntimeEvent(state, {
    id: "quest-warm-complete:build-a:2",
    type: "offline-warm-complete",
    at: "2026-07-18T08:00:10.000Z",
    requested: 42,
    completed: 42,
    failed: 0
  });
  state = recordQuestRuntimeEvent(state, {
    id: "offline-start:build-a:3",
    type: "offline-cold-start",
    at: "2026-07-18T08:05:00.000Z",
    buildId: "build-a"
  });
  state = recordQuestRuntimeEvent(state, {
    id: "update-ready:build-b:4",
    type: "offline-update-ready",
    at: "2026-07-18T08:05:30.000Z",
    buildId: "build-b"
  });
  state = recordQuestRuntimeEvent(state, {
    id: "update-applied:build-b:5",
    type: "offline-update-applied",
    at: "2026-07-18T08:06:00.000Z",
    buildId: "build-b"
  });
  const replayedHistory = recordQuestRuntimeEvent(state, {
    id: "shell-ready:build-a:1",
    type: "offline-shell-ready",
    at: "2026-07-18T08:00:05.000Z"
  });
  assert.equal(replayedHistory, state, "replaying stored worker history must not inflate offline evidence");
  state = endQuestSession(state, { at: "2026-07-18T08:06:00.000Z" });

  const totals = questTelemetryTotals(state.telemetry);
  assert.equal(totals.offlineShellReady, true);
  assert.equal(totals.offlineWarmups, 1);
  assert.equal(totals.offlineWarmupFailures, 0);
  assert.equal(totals.offlineColdStarts, 1);
  assert.equal(totals.offlineUpdates, 1);
  assert.equal(totals.offlineUpdatesApplied, 1);
  assert.equal(totals.lastOfflineUpdateAt, "2026-07-18T08:06:00.000Z");
  assert.equal(totals.lastOfflineBuildId, "build-b");
  assert.equal(totals.lastOfflineWarmAt, "2026-07-18T08:00:10.000Z");

  const report = buildQuestMasteryReport(state);
  assert.equal(report.runtime.offlineShellReady, true);
  assert.equal(report.runtime.offlineWarmups, 1);
  assert.equal(report.runtime.offlineWarmupFailures, 0);
  assert.equal(report.runtime.offlineColdStarts, 1);
  assert.equal(report.runtime.offlineUpdates, 1);
  assert.equal(report.runtime.offlineUpdatesApplied, 1);
  assert.equal(report.runtime.lastOfflineBuildId, "build-b");
});

test("device acceptance evidence separates local smoke from physical release proof", async () => {
  const samples = Array.from({ length: 5 }, (_, index) => ({
    at: `2026-07-18T08:00:${String(index * 5).padStart(2, "0")}.000Z`,
    surface: "pixel",
    online: true,
    visibility: "visible",
    domNodes: 720,
    canvases: 1,
    heapUsedBytes: 40_000_000 + index * 200_000
  }));
  const smoke = {
    schemaVersion: 1,
    profileId: "local-smoke",
    runMode: "smoke",
    physicalDevice: false,
    durationMs: 21_000,
    samples,
    initialProgress: { stopsDone: 0, routeCursor: 1 },
    finalProgress: {
      stopsDone: 0,
      routeCursor: 1,
      checkpoint: { stopId: "s1", phase: "trail", activeId: "s1-0", beatIndex: 0, fieldStage: 1 }
    },
    telemetry: {
      healthSamples: 2,
      sampledFrames: 1_200,
      averageFrameMs: 17,
      longFrameRate: 0.01,
      contextLosses: 0,
      fallbackSessions: 0,
      offlineShellErrors: 0,
      offlineWarmupFailures: 0
    },
    input: { events: 4, p95Ms: 24 },
    errors: []
  };
  assert.equal(evaluateQuestDeviceEvidence(smoke).status, "pass");
  const stationarySmoke = {
    ...smoke,
    finalProgress: { ...smoke.initialProgress }
  };
  assert.ok(evaluateQuestDeviceEvidence(stationarySmoke).failures.includes("progress"), "zero progress cannot pass even a smoke gate");

  const releaseWithoutDevice = {
    ...smoke,
    profileId: "ipad",
    runMode: "release",
    durationMs: 1_200_000,
    samples: Array.from({ length: 100 }, () => samples[0]),
    telemetry: {
      ...smoke.telemetry,
      healthSamples: 100,
      sampledFrames: 30_000,
      networkInterruptions: 1,
      syncRecoveries: 1,
      syncPending: false
    },
    input: { events: 12, p95Ms: 25 }
  };
  const releaseResult = evaluateQuestDeviceEvidence(releaseWithoutDevice);
  assert.equal(releaseResult.status, "fail");
  assert.ok(releaseResult.failures.includes("physical"));
  assert.ok(releaseResult.failures.includes("operator"));
  assert.ok(releaseResult.failures.includes("progress"), "release evidence must complete at least one stop");
  assert.deepEqual(QUEST_DEVICE_RELEASE_PROFILES, ["ipad", "chromebook", "android-tablet", "voiceover", "nvda", "switch"]);

  const physicalRelease = {
    ...releaseWithoutDevice,
    physicalDevice: true,
    operator: "OBS-1",
    device: { model: "iPad 10", os: "iPadOS", browser: "Safari" }
  };
  const zeroProgress = evaluateQuestDeviceEvidence(physicalRelease);
  assert.deepEqual(zeroProgress.failures, ["progress"], "standing still is not release proof");

  const noMemoryEvidence = {
    ...physicalRelease,
    finalProgress: { stopsDone: 1, routeCursor: 2 },
    samples: physicalRelease.samples.map(sample => ({ ...sample, heapUsedBytes: 0 }))
  };
  const noMemoryResult = evaluateQuestDeviceEvidence(noMemoryEvidence);
  assert.ok(noMemoryResult.failures.includes("heap"), "Safari cannot silently pass when both memory signals are absent");

  const safariProxyEvidence = {
    ...noMemoryEvidence,
    samples: noMemoryEvidence.samples.map(sample => ({
      ...sample,
      runtime: {
        peakDisplayObjects: 148,
        peakTextures: 49,
        peakTweens: 12,
        peakActiveChoices: 3
      }
    }))
  };
  assert.equal(evaluateQuestDeviceEvidence(safariProxyEvidence).status, "pass", "bounded runtime resources are valid Safari leak evidence");
  const leakingSafariProxy = {
    ...safariProxyEvidence,
    samples: safariProxyEvidence.samples.map((sample, index) => ({
      ...sample,
      runtime: {
        ...sample.runtime,
        peakDisplayObjects: index === safariProxyEvidence.samples.length - 1 ? 901 : sample.runtime.peakDisplayObjects
      }
    }))
  };
  assert.ok(evaluateQuestDeviceEvidence(leakingSafariProxy).failures.includes("heap"), "an over-limit Safari proxy must fail the leak gate");
  const slowlyLeakingSafariProxy = {
    ...safariProxyEvidence,
    samples: safariProxyEvidence.samples.map((sample, index) => ({
      ...sample,
      runtime: {
        peakDisplayObjects: 140 + index * 3,
        peakTextures: 45 + Math.floor(index / 3),
        peakTweens: 12,
        peakActiveChoices: 3
      }
    }))
  };
  assert.ok(
    evaluateQuestDeviceEvidence(slowlyLeakingSafariProxy).failures.includes("heap"),
    "sustained Safari resource growth cannot pass merely because it remains below an absolute ceiling"
  );
  const sparseSafariProxy = {
    ...safariProxyEvidence,
    samples: safariProxyEvidence.samples.map((sample, index) => ({
      ...sample,
      runtime: index < 2 ? sample.runtime : {}
    }))
  };
  const sparseSafariResult = evaluateQuestDeviceEvidence(sparseSafariProxy);
  assert.ok(
    sparseSafariResult.failures.includes("heap"),
    "two early Safari resource samples cannot certify a full release window"
  );
  assert.match(
    sparseSafariResult.checks.find(check => check.id === "heap")?.detail || "",
    /Safari proxy coverage 2\/100 samples, 0\/50 late/,
    "the sparse-proxy failure must name the missing full-window and late-window coverage"
  );

  const sealed = await sealQuestDeviceEvidence(smoke);
  assert.match(sealed.evidenceHash, /^[a-f0-9]{64}$/);
  assert.equal(canonicalQuestDeviceEvidence(sealed), canonicalQuestDeviceEvidence(smoke));
});

test("human acceptance aggregates cohorts without storing direct identifiers", async () => {
  const observation = (profileId, index, measures, participant = {}) => ({
    schemaVersion: 1,
    profileId,
    sessionId: `SESSION-${index + 1}`,
    observedAt: `2026-07-18T${String(9 + (index % 8)).padStart(2, "0")}:00:00.000Z`,
    observerId: "OBS-1",
    settingId: `ROOM-${(index % 3) + 1}`,
    consentConfirmed: true,
    participant: {
      anonymousId: `${profileId === "teacher-report" ? "ADULT" : profileId === "classroom-audio" ? "AUDIO" : "CHILD"}-${index + 1}`,
      ...participant
    },
    measures
  });
  const records = [
    ...Array.from({ length: 8 }, (_, index) => observation("child-first-use", index, {
      tasksShown: 8,
      tasksIndependent: 7,
      adultPrompts: 1,
      blocked: false,
      severeFrustrationIncidents: 0,
      enjoymentRating: 4
    }, { ageYears: 6 })),
    ...Array.from({ length: 6 }, (_, index) => observation("child-repeat-play", index, {
      tasksShown: 10,
      tasksIndependent: 9,
      adultPrompts: 0,
      blocked: false,
      severeFrustrationIncidents: 0,
      enjoymentRating: 4,
      voluntaryReplay: true,
      boredomIncidents: 0
    }, { ageYears: 6 })),
    ...Array.from({ length: 8 }, (_, index) => observation("reward-choice", index, {
      independentStoreChoice: true,
      cumulativeGearRecognized: true,
      relicPurposeExplained: true,
      sparksAvailable: 100,
      sparksSpent: 40
    }, { ageYears: 6 })),
    ...Array.from({ length: 5 }, (_, index) => observation("teacher-report", index, {
      questionsAsked: 5,
      questionsCorrect: 5,
      nextActionAccurate: true,
      usefulnessRating: 5
    }, { role: "teacher" })),
    ...Array.from({ length: 3 }, (_, index) => observation("classroom-audio", index, {
      roomProfile: `ROOM-${index + 10}`,
      deviceModel: `Tablet-${index}`,
      promptsPlayed: 20,
      promptsUnderstood: 20,
      maskingIncidents: 0,
      discomfortIncidents: 0
    }))
  ];

  assert.ok(records.every(record => validateQuestHumanObservation(record).status === "valid"));
  assert.equal(evaluateQuestHumanAcceptance(records).status, "pass");

  const unsafe = { ...records[0], participant: { ...records[0].participant, name: "Do not store this" } };
  const unsafeResult = validateQuestHumanObservation(unsafe);
  assert.equal(unsafeResult.status, "invalid");
  assert.ok(unsafeResult.failures.includes("privacy"));

  for (const [field, record] of [
    ["participant name", { ...records[0], participant: { ...records[0].participant, anonymousId: "EMMA-SMITH" } }],
    ["session name", { ...records[0], sessionId: "MrsJohnson3" }],
    ["room name", { ...records[0], settingId: "ROOM-KAYLA" }],
    ["email value", { ...records[0], notes: "observer@example.com" }],
    ["phone value", { ...records[0], notes: "+44 7700 900123" }],
    ["labelled name value", { ...records[0], notes: "child: Emma Smith" }]
  ]) {
    const result = validateQuestHumanObservation(record);
    assert.equal(result.status, "invalid", `${field} was accepted`);
    assert.ok(result.failures.includes("privacy"), `${field} did not trip the privacy gate`);
  }

  const omittedZero = {
    ...records[0],
    measures: Object.fromEntries(Object.entries(records[0].measures).filter(([key]) => key !== "adultPrompts"))
  };
  const omittedZeroResult = validateQuestHumanObservation(omittedZero);
  assert.equal(omittedZeroResult.status, "invalid");
  assert.ok(omittedZeroResult.failures.includes("prompts"));

  const duplicatedCohort = Array.from({ length: 8 }, () => records[0]);
  const duplicateResult = evaluateQuestHumanAcceptance(duplicatedCohort);
  assert.equal(duplicateResult.duplicateRecords, 7);
  assert.equal(duplicateResult.categoryStatus["child-first-use"], "incomplete");

  const repeatedParticipant = records.slice(0, 8).map(record => ({
    ...record,
    participant: { ...record.participant, anonymousId: "CHILD-999" }
  }));
  const repeatedParticipantResult = evaluateQuestHumanAcceptance(repeatedParticipant);
  assert.equal(repeatedParticipantResult.categoryStatus["child-first-use"], "incomplete");
  assert.equal(repeatedParticipantResult.categories["child-first-use"].find(check => check.id === "distinct-participants").pass, false);

  const sealed = await sealQuestHumanObservation(records[0]);
  assert.match(sealed.evidenceHash, /^[a-f0-9]{64}$/);
  assert.equal(canonicalQuestHumanObservation(sealed), canonicalQuestHumanObservation(records[0]));
  assert.equal((await verifyQuestHumanObservation(sealed)).status, "valid");
  assert.equal((await verifyQuestHumanObservation({ ...sealed, settingId: "ROOM-TAMPERED" })).status, "invalid");

  const consoleSource = fs.readFileSync("src/components/quest/QuestFieldStudyConsole.jsx", "utf8");
  assert.match(consoleSource, /record\.profileId[\s\S]*?record\.sessionId[\s\S]*?record\.participant\?\.anonymousId/, "paired-session records still collide in the console");
  const sealTool = fs.readFileSync("tools/sealQuestHumanObservation.mjs", "utf8");
  assert.match(sealTool, /draft\.profileId[\s\S]*?draft\.sessionId[\s\S]*?draft\.participant\?\.anonymousId/, "paired-session records still collide in the terminal sealer");
});

test("progress sync durably queues before network work and recovers on the online event", () => {
  const sync = fs.readFileSync("src/utils/progressSync.js", "utf8");
  const queue = fs.readFileSync("src/utils/progressQueue.js", "utf8");
  const saveBlock = sync.match(/export function queueProgressSave[\s\S]*?\n}\n\nexport async function flushQueuedProgressWrites/)?.[0] || "";
  assert.match(saveBlock, /const queued = enqueueWrite\(entry\)/, "a save can vanish before the debounce timer runs");
  assert.match(sync, /inFlightFlushes/, "writes for one progress key are not serialised");
  assert.match(queue, /PROGRESS_QUEUE_ENTRY_PREFIX = "lp-progress-sync-entry-v2:"/, "cross-tab writes still share one replaceable array");
  assert.match(queue, /storage\.setItem\(storageKey[\s\S]*for \(const record of previous\)/, "a replacement can delete its predecessor before becoming durable");
  assert.match(sync, /removeProgressQueueRecords\(window\.localStorage, records\)/, "a response does not remove only its exact uploaded revisions");
  assert.match(queue, /existing\.payload,[\s\S]*incoming\.payload/, "same-key writes from two tabs are not forward-merged");
  assert.match(queue, /LEGACY_PROGRESS_QUEUE_KEY/, "pending v1 rows have no migration path");
  assert.match(sync, /window\.addEventListener\("online", handleProgressOnline\)/, "reconnect does not flush without another child action");
  assert.match(sync, /emitProgressSyncState\("recovered"/, "the adult report cannot know a deferred save recovered");
});

test("runtime health samples retain session high-water marks for soak review", () => {
  let state = beginQuestSession(baseQuestState(), {
    id: "runtime-health",
    at: "2026-07-17T09:00:00.000Z",
    qualityTier: "pixel"
  });
  state = recordQuestRuntimeEvent(state, {
    type: "runtime-health",
    tierId: "pixel",
    displayObjects: 148,
    tweens: 12,
    textures: 47,
    activeChoices: 3
  });
  state = recordQuestRuntimeEvent(state, {
    type: "runtime-health",
    tierId: "pixel",
    displayObjects: 132,
    tweens: 7,
    textures: 49,
    activeChoices: 2
  });
  state = endQuestSession(state, { at: "2026-07-17T09:03:00.000Z" });

  const totals = questTelemetryTotals(state.telemetry);
  assert.equal(totals.healthSamples, 2);
  assert.equal(totals.peakDisplayObjects, 148);
  assert.equal(totals.peakTweens, 12);
  assert.equal(totals.peakTextures, 49);
  assert.equal(totals.peakActiveChoices, 3);

  const report = buildQuestMasteryReport(state);
  assert.equal(report.runtime.healthSamples, 2);
  assert.equal(report.runtime.peakDisplayObjects, 148);
  assert.equal(report.runtime.peakTweens, 12);
  assert.equal(report.runtime.peakTextures, 49);
  assert.equal(report.runtime.peakActiveChoices, 3);
});

test("free roam is built from the child's weakest attempted sounds", () => {
  const state = baseQuestState();
  state.mastery = {
    s: { seen: 8, correct: 7, state: "practising" },
    a: { seen: 6, correct: 2, state: "learning" },
    t: { seen: 10, correct: 6, state: "at-risk" }
  };
  const plan = freeRoamReviewPlan(state, 2);
  assert.deepEqual(plan.targets, ["a", "t"]);
  assert.equal(plan.weakest[0].target, "a");
  assert.ok(plan.stopId.startsWith("s"));
});

test("earned chapter shortcuts revisit only sounds from the restored chapter", () => {
  const state = baseQuestState();
  state.trail.stopsDone = ["s1", "s2", "s3", "s4", "s5"];
  state.mastery = {
    s: { seen: 8, correct: 7, state: "practising" },
    a: { seen: 6, correct: 2, state: "learning" },
    ee: { seen: 10, correct: 1, state: "at-risk" }
  };
  assert.equal(chapterShortcutReviewPlan(baseQuestState(), "seedwake-meadow"), null);
  assert.equal(chapterShortcutReviewPlan(state, "missing-chapter"), null);
  const plan = chapterShortcutReviewPlan(state, "seedwake-meadow", 2);
  assert.equal(plan.title, QUEST_CHAPTERS[0].shortcut.label);
  assert.equal(plan.source, "chapter-shortcut");
  assert.equal(plan.chapterId, "seedwake-meadow");
  assert.equal(plan.targets.includes("ee"), false, "a later chapter sound leaked into the meadow shortcut");
  assert.ok(["s1", "s2", "s3", "s4", "s5"].includes(plan.stopId));
});

test("quest sessions bank active time, responses, stops, and review mode", () => {
  let state = beginQuestSession(baseQuestState(), {
    id: "session-1",
    at: "2026-07-14T08:00:00.000Z",
    mode: "review",
    source: "chapter-shortcut",
    qualityTier: "balanced",
    stopId: "s3"
  });
  state = addQuestActiveTime(state, 125000, "2026-07-14T08:01:00.000Z");
  state = recordQuestTelemetryAnswer(state, true);
  state = recordQuestTelemetryAnswer(state, false);
  state = recordQuestTelemetryStop(state, "s3");
  state = endQuestSession(state, { at: "2026-07-14T08:02:00.000Z", reason: "review_complete" });
  const totals = questTelemetryTotals(state.telemetry);
  assert.equal(totals.activeMs, 60000, "a single heartbeat is capped to one minute");
  assert.equal(totals.answers, 2);
  assert.equal(totals.correct, 1);
  assert.equal(totals.stopsCompleted, 1);
  assert.equal(totals.reviewSessions, 1);
  assert.equal(totals.shortcutSessions, 1);
  assert.equal(buildQuestMasteryReport(state).shortcutSessions, 1);
});

test("interaction evidence separates sound misses from movement and timing retries", () => {
  let state = beginQuestSession(baseQuestState(), {
    id: "interaction-session",
    at: "2026-07-14T08:00:00.000Z",
    stopId: "s4",
    qualityTier: "2d"
  });
  state = recordQuestInteractionEvent(state, { type: "prompt-shown" });
  state = recordQuestInteractionEvent(state, { type: "response", correct: true, latencyMs: 2500 });
  state = recordQuestInteractionEvent(state, { type: "motor-retry", latencyMs: 700 });
  state = recordQuestInteractionEvent(state, { type: "response", correct: false, latencyMs: 9500 });
  state = recordQuestInteractionEvent(state, { type: "teach-back" });
  state = recordQuestInteractionEvent(state, { type: "drop", count: 2 });
  state = recordQuestInteractionEvent(state, { type: "pacing-adapted", count: 2 });
  state = recordQuestInteractionEvent(state, { type: "optional-route", count: 2 });
  state = recordQuestInteractionEvent(state, { type: "optional-discovery" });
  state = recordQuestInteractionEvent(state, { type: "memory-greeting" });
  state = recordQuestInteractionEvent(state, { type: "accessible-timing-support" });
  state = endQuestSession(state, { at: "2026-07-14T08:03:00.000Z" });

  const totals = questTelemetryTotals(state.telemetry);
  assert.equal(totals.prompts, 1);
  assert.equal(totals.responses, 2);
  assert.equal(totals.averageResponseMs, 6000);
  assert.equal(totals.slowResponses, 1);
  assert.equal(totals.motorRetries, 1);
  assert.equal(totals.correctionMisses, 1);
  assert.equal(totals.teachBacks, 1);
  assert.equal(totals.drops, 2);
  assert.equal(totals.pacingAdaptations, 1);
  assert.equal(totals.deferredBeats, 2);
  assert.equal(totals.optionalRouteVisits, 2);
  assert.equal(totals.optionalDiscoveries, 1);
  assert.equal(totals.restoredFriendsMet, 1);
  assert.equal(totals.accessibleTimingSupports, 1);
  assert.equal(totals.accessibleSessions, 1);

  const report = buildQuestMasteryReport(state);
  assert.equal(report.interaction.averageResponseMs, 6000);
  assert.equal(report.interaction.slowResponseRate, 50);
  assert.equal(report.interaction.motorRetryRate, 50);
  assert.equal(report.interaction.pacingAdaptations, 1);
  assert.equal(report.interaction.deferredBeats, 2);
  assert.equal(report.interaction.optionalRouteVisits, 2);
  assert.equal(report.interaction.optionalDiscoveries, 1);
  assert.equal(report.interaction.restoredFriendsMet, 1);
  assert.equal(report.interaction.accessibleTimingSupports, 1);
  assert.equal(report.interaction.accessibleSessions, 1);
  assert.match(report.interaction.interpretation, /More play is needed/);
});

test("teacher interpretation only flags control load after enough evidence", () => {
  let state = beginQuestSession(baseQuestState(), { id: "control-load", stopId: "s5" });
  for (let index = 0; index < 5; index += 1) {
    state = recordQuestInteractionEvent(state, { type: "prompt-shown" });
    state = recordQuestInteractionEvent(state, { type: "response", correct: true, latencyMs: 1800 });
  }
  for (let index = 0; index < 3; index += 1) {
    state = recordQuestInteractionEvent(state, { type: "motor-retry" });
  }
  const report = buildQuestMasteryReport(state);
  assert.equal(report.interaction.highControlLoad, true);
  assert.equal(report.interaction.highLearningLoad, false);
  assert.match(report.interaction.interpretation, /Timing or movement retries/);
});

test("teacher guidance states evidence strength and one cautious next action", () => {
  assert.deepEqual(questEvidenceGuidance({ attempts: 8, sessions: 1 }), {
    strength: "Early evidence",
    nextAction: "Keep normal play going. Wait for at least two sessions and ten responses before changing teaching."
  });
  const control = questEvidenceGuidance({ attempts: 32, sessions: 4, highControlLoad: true });
  assert.equal(control.strength, "Stable pattern");
  assert.match(control.nextAction, /accessible 2D session/);
  const reading = questEvidenceGuidance({
    attempts: 18,
    sessions: 3,
    highLearningLoad: true,
    weakest: [{ target: "sh" }, { target: "ch" }]
  });
  assert.equal(reading.strength, "Developing evidence");
  assert.match(reading.nextAction, /Re-teach sh and ch/);
});

test("teacher report combines journey, mastery, and time-on-task evidence", () => {
  const state = baseQuestState();
  state.trail.stopsDone = ["s1", "s2"];
  state.trail.stars = { s1: 3, s2: 2 };
  state.mastery = {
    s: { seen: 10, correct: 9, state: "mastered" },
    a: { seen: 8, correct: 4, state: "learning" }
  };
  state.telemetry.sessions = [{
    id: "session-1",
    mode: "journey",
    activeMs: 180000,
    answers: 18,
    correct: 13,
    stopsCompleted: 2,
    lastActiveAt: "2026-07-14T08:03:00.000Z"
  }];
  const report = buildQuestMasteryReport(state);
  assert.equal(report.stopsCompleted, 2);
  assert.equal(report.stars, 5);
  assert.equal(report.stonesLit, 1);
  assert.equal(report.timeOnTask, "3 min");
  assert.deepEqual(report.currentFocus, ["a", "s"]);

  const dashboard = fs.readFileSync("src/components/FinishedReportPage.jsx", "utf8");
  assert.match(dashboard, /\["Exploration", report\.interaction\?\.optionalRouteVisits/, "teacher reports hide optional exploration");
  assert.match(dashboard, /\["Accessible play", report\.interaction\?\.accessibleSessions/, "teacher reports hide accessible play evidence");
  assert.match(dashboard, /timing barriers removed/, "teacher reports do not explain untimed support in plain language");
});

test("teacher accuracy uses independent attempts while retaining total exposure", () => {
  const state = baseQuestState();
  state.mastery = {
    s: {
      seen: 10,
      independentSeen: 2,
      correct: 2,
      misses: 0,
      state: "learning",
      shells: ["stones"],
      sessions: ["2026-07-20"]
    },
    a: {
      seen: 5,
      independentSeen: 0,
      correct: 0,
      misses: 0,
      state: "learning",
      shells: [],
      sessions: []
    }
  };
  const report = buildQuestMasteryReport(state);
  assert.equal(report.attempts, 15, "the report still shows all exposure");
  assert.equal(report.independentAttempts, 2);
  assert.equal(report.accuracy, 100, "assistance/timeouts cannot depress knowledge accuracy");
  assert.equal(report.heat.find(tile => tile.id === "s").accuracy, 100);
  assert.equal(report.heat.find(tile => tile.id === "a").bucket, "almost", "timeout-only exposure is not a re-teach claim");
  assert.equal(report.heat.find(tile => tile.id === "a").accuracy, null);
  assert.equal(report.weakest.some(row => row.target === "a"), false);
});

test("the 2D renderer is wired to the shared verbs, correction ladder and deferred review", () => {
  const source = fs.readFileSync("src/components/quest/world/QuestTrail2D.jsx", "utf8");
  for (const integration of [
    "applyQuestTaskInput(",
    "restoreSeedwakeVerbState(",
    "recordCorrectionMiss(",
    "correctionPresentation(",
    "completeTeachBack(",
    "nextQueuedReview("
  ]) {
    assert.match(source, new RegExp(integration.replace("(", "\\(")), `${integration} is disconnected from 2D play`);
  }
  assert.match(source, /recordAttempt === false/, "motor timing mistakes still become phonics errors in 2D");
  assert.match(source, /onInteraction/, "2D play does not report interaction support evidence");
  assert.match(source, /type: "prompt-shown"/, "2D play does not record physical prompts");
  assert.match(source, /stageRecordsMastery/, "2D muted guidance can still claim independent mastery");
  assert.match(source, /const \[section\] = useState\(/, "2D play can regenerate the active puzzle after a mastery update");
});

test("world resume checkpoints clamp to rebuilt encounters and never create an actionless trail", () => {
  const section = buildTrailSection("s1", { targets: ["m", "s", "a"], seed: 3 });
  const wordEncounter = section.encounters.find(encounter => encounter.beats.some(beat => beat.word));
  assert.ok(wordEncounter, "fixture needs a multi-stage word encounter");

  const clamped = clampQuestWorldResume(section, {
    activeId: wordEncounter.id,
    beatIndex: 999,
    fieldStage: 999,
    phase: "trail"
  });
  assert.equal(clamped.activeIdValid, true);
  assert.equal(clamped.encounterIndex, section.encounters.indexOf(wordEncounter));
  assert.equal(clamped.beatIndex, wordEncounter.beats.length - 1);
  assert.equal(clamped.fieldStage, 2, "the three-part word task must clamp to its last playable stage");

  assert.deepEqual(clampQuestWorldResume(section, {
    activeId: "removed-by-content-update",
    beatIndex: 9,
    fieldStage: 9,
    phase: "trail"
  }), {
    activeIdValid: false,
    encounterIndex: 0,
    beatIndex: 0,
    fieldStage: 0,
    phase: "trail"
  });
  assert.equal(clampQuestWorldResume({ encounters: [], teach: [] }, { phase: "trail" }).phase, "gate");
  assert.equal(clampQuestWorldResume(section, { phase: "invalid" }).phase, "teach");

  const fallback2d = fs.readFileSync("src/components/quest/world/QuestTrail2D.jsx", "utf8");
  assert.match(fallback2d, /phase === "trail" && !stage/, "a malformed rebuilt task can still leave an empty 2D panel");
  assert.match(fallback2d, /encounterIndex \+ 1/, "the active 2D encounter progress is still zero-based");
});

test("Den destinations pair non-reading symbols with an audible transition cue", () => {
  const den = fs.readFileSync("src/components/quest/DenScreen.jsx", "utf8");
  assert.match(den, /if \(soundEnabled\) playWhoosh\(\)/, "Den navigation has no recorded transition cue");
  for (const kind of ["settings", "map", "review", "creature", "post"]) {
    assert.match(den, new RegExp(`<DenNavIcon kind="${kind}"`), `${kind} destination still depends on text alone`);
  }
  for (const accessibleName of [
    "Open settings",
    "Open the trail map",
    "Change my creature",
    "Open the Trading Post"
  ]) {
    assert.match(den, new RegExp(`aria-label="${accessibleName}"`), `${accessibleName} has no stable accessible name`);
  }
});

test("Den settings provides a modal fallback without native dialog methods", () => {
  const den = fs.readFileSync("src/components/quest/DenScreen.jsx", "utf8");
  const css = fs.readFileSync("src/styles/quest.css", "utf8");
  assert.match(den, /typeof dialog\.showModal === "function"/);
  assert.match(den, /dialog\.setAttribute\("open", ""\)/);
  assert.match(den, /data-fallback-modal=/);
  assert.match(den, /onKeyDown=\{containSettingsFocus\}/);
  assert.match(den, /settingsTriggerRef\.current\?\.focus\(\)/);
  assert.match(css, /\.q-settings-dialog\[data-fallback-modal="true"\]/);
});

test("QuestRoot hands focus to each newly mounted non-world screen", () => {
  const root = fs.readFileSync("src/components/quest/QuestRoot.jsx", "utf8");
  assert.match(root, /previousViewRef/, "view changes have no stable focus-transition guard");
  assert.match(root, /portalRef\.current\?\.querySelector\("\.q-screen h1"\)/, "the new screen heading is not selected");
  assert.match(root, /heading\.focus\(\{ preventScroll: true \}\)/, "focus is not moved after a Den/Map/Post/Creator transition");
});

test("pixel-world audit guards cover stage rebuild, teardown, asset failure, motion and hot-path allocation", () => {
  const component = fs.readFileSync("src/components/quest/world/QuestPixelWorld.jsx", "utf8");
  const runtime = fs.readFileSync("src/components/quest/world/questPixelRuntime.js", "utf8");
  const avatar = fs.readFileSync("src/components/quest/world/questPixelAvatar.js", "utf8");
  const assets = fs.readFileSync("src/components/quest/world/questAssets.js", "utf8");
  const encounters = fs.readFileSync("src/components/quest/world/Encounters.jsx", "utf8");
  const gameConfig = runtime.slice(runtime.indexOf("export function createQuestPixelRuntime"));

  assert.match(runtime, /this\.rebuildChoices\(model\.activeStage, model\.activeEncounterId\)/, "stage transitions can retain stale answer objects");
  assert.match(runtime, /this\.events\.once\(Phaser\.Scenes\.Events\.SHUTDOWN, this\.shutdown, this\)/, "scene cleanup is not wired to Phaser teardown");
  assert.match(runtime, /!this\.sceneShuttingDown && this\.sys\?\.isActive\?\.\(\)/, "a resize timer can rebuild a destroyed scene");
  assert.match(runtime, /this\.load\.on\("loaderror"/, "pixel asset failures are not observed");
  assert.match(runtime, /type: "asset-error"/, "asset failures do not reach runtime telemetry");
  assert.match(runtime, /quest-neutral-placeholder/, "failed resident art has no child-safe fallback");
  assert.doesNotMatch(gameConfig, /^\s*resolution:/m, "Phaser 4 still receives its inert resolution setting");
  assert.match(runtime, /carriedSignature === this\.lastCarriedSignature/, "resize storms can keep rebuilding the carried prop");
  assert.match(component, /clearTimeout\(cueTimerRef\.current\)/, "post-buzz speech can escape pixel-world teardown");
  assert.match(component, /prefers-reduced-motion: reduce/, "the live pixel model ignores OS reduced-motion");
  assert.match(component, /addEventListener\?\.\("change", syncReducedMotion\)/, "the live pixel model freezes the initial OS motion preference");
  assert.match(component, /removeEventListener\?\.\("change", syncReducedMotion\)/, "the live OS motion listener leaks on teardown");
  assert.match(component, /event\.currentTarget\.hidden = true/, "the HUD collectible can show a broken-image glyph");
  assert.match(component, /onRuntimeSignal: signal =>/, "runtime asset errors stop at the Phaser boundary");
  assert.match(avatar, /const layout = layoutCreature\(creature\)[\s\S]*drawVectorBeastieFrame\(ctx, layout,/, "Beastie layout is still recomputed per sprite frame");
  assert.match(assets, /object\.geometry = object\.geometry\.clone\(\)/, "field avatars still dispose cache-shared geometry");
  assert.match(encounters, /beat\?\.cue\?\.kind === "word"/, "letter encounters still ignore word-cue fallbacks");
  assert.match(encounters, /hasWordAudio\(cue\.value\)/, "word-fallback replay can remain disabled");
});

test("QuestHub audit guards keep scoring beat-based and the encounter render path bounded", () => {
  const hub = fs.readFileSync("src/components/quest/world/QuestHub.jsx", "utf8");
  const sightline = hub.slice(hub.indexOf("function updateSightline"), hub.indexOf("function updateTrailCharacters"));
  const characterUpdates = hub.slice(hub.indexOf("function updateTrailCharacters"), hub.indexOf("function seededParticle"));
  const deferredReview = hub.slice(hub.indexOf("const beginDeferredReview"), hub.indexOf("const nextBeat"));

  assert.match(hub, /const beatKey = `\$\{activeRef\.current\?\.id \|\| "field"\}:\$\{beatIndexRef\.current\}`/, "multi-stage word beats can be tallied more than once");
  assert.ok((hub.match(/recordsMastery: fieldStageRecordsMastery/g) || []).length >= 2, "muted or unavailable cues can still bank mastery");
  assert.match(sightline, /intersectObjects\(sightline\.occluders, false\)/, "sightline still recursively raycasts the whole scene");
  assert.doesNotMatch(sightline, /new THREE\.Raycaster/, "sightline allocates a raycaster in its per-frame function");
  assert.ok((hub.match(/fieldChoiceSightlineTarget\(/g) || []).length >= 3, "runtime and proof do not share the printed-grapheme sightline target");
  assert.doesNotMatch(characterUpdates, /buildPhysicalTask\(/, "character animation rebuilds the active physical task every frame");
  assert.match(hub, /const liveTask = cachedPhysicalTask\(\)/, "late-frame rendering bypasses the physical-task cache");
  assert.match(hub, /activeTask: liveTask/, "character animation does not receive the cached physical task");
  assert.match(hub, /const activeFieldTask = useMemo/, "the active physical task is rebuilt on every render");
  assert.match(hub, /const encounterTasks = useMemo/, "all encounter tasks are rebuilt on every render");
  assert.match(hub, /const satchel = useMemo/, "the satchel is rebuilt on every render");
  assert.match(hub, /const dropRefCallbacks = useMemo/, "drop refs still detach and reattach every commit");
  assert.match(hub, /const landmarkRefCallbacks = useMemo/, "landmark refs still detach and reattach every commit");
  assert.match(deferredReview, /setPhonemeFillCount\(0\)/, "deferred word review can inherit filled slots");
  assert.match(hub, /encounters\.length === 0 \|\| isChapterGateOpen/, "an empty generated section can still strand the child");
  assert.match(hub, /if \(isSoundEnabled\) playStarChime\(\)/, "pickup rewards remain text-only");
  assert.match(hub, /if \(isSoundEnabled\) playWhoosh\(\)/, "gate and route transitions remain text-only");
});

test("the slice-camera gate owns an isolated server and observes early exits", () => {
  const cameraGate = fs.readFileSync("tools/checkQuestSliceCamera.mjs", "utf8");
  assert.match(cameraGate, /const PORT = await availableLoopbackPort\(\)/, "camera checks can collide on a fixed shared port");
  assert.match(cameraGate, /server\.stdout\.on\("data", capture\)/, "camera gate can deadlock on an unread server pipe");
  assert.match(cameraGate, /server\.exitCode !== null \|\| server\.signalCode !== null/, "camera gate can attach to another process after its own server exits");
  assert.match(cameraGate, /await waitForServer\(server\)/, "server ownership is not verified before browser capture");
});

test("the pixel renderer keeps educational parity and debounces physical contacts", () => {
  const component = fs.readFileSync("src/components/quest/world/QuestPixelWorld.jsx", "utf8");
  const runtime = fs.readFileSync("src/components/quest/world/questPixelRuntime.js", "utf8");
  for (const integration of [
    "applyQuestTaskInput(",
    "restoreSeedwakeVerbState(",
    "recordCorrectionMiss(",
    "correctionPresentation(",
    "completeTeachBack(",
    "nextQueuedReview("
  ]) {
    assert.match(component, new RegExp(integration.replace("(", "\\(")), `${integration} is disconnected from pixel play`);
  }
  assert.deepEqual(PIXEL_BEASTIE_DIRECTIONS, ["down", "left", "right", "up"]);
  assert.equal(PIXEL_BEASTIE_FRAMES_PER_DIRECTION, 16);
  assert.deepEqual(PIXEL_BEASTIE_ACTION_POSES, ["anticipate", "reach", "cheer", "concern", "carry", "tool", "turn", "steer", "signal", "climb", "discover", "settle"]);
  assert.equal(PIXEL_BEASTIE_FRAME, 64, "the child-created Beastie fell behind the authored resident resolution");
  const avatar = fs.readFileSync("src/components/quest/world/questPixelAvatar.js", "utf8");
  assert.match(avatar, /image\.data\[offset \+ 3\] = 255/, "the customised Beastie still retains soft vector-edge alpha");
  assert.match(avatar, /Math\.round\(shifted \/ 17\) \* 17/, "the customised Beastie bypasses the authored pixel palette ramp");
  assert.match(avatar, /drawVectorPerformanceOverlay/, "the customised Beastie still substitutes whole-sprite deformation for authored verb silhouettes");
  assert.match(runtime, /beastie-action-\$\{profile\.response\}-\$\{this\.lastFacing\}/, "physical verbs still only deform the whole Beastie sprite");
  assert.match(runtime, /playerActionLockedUntil/, "action poses can be overwritten by locomotion in the same frame");
  assert.match(runtime, /questPointerDestination/, "touch movement can keep steering toward an unreachable off-route target");
  assert.match(runtime, /questPointerObstacleVector/, "touch travel does not steer around authored scenery");
  assert.match(runtime, /resolveQuestObstacleContacts/, "the Beastie still walks through solid scenery");
  assert.match(runtime, /setStrokeStyle\(2, 0xfff0a2/, "touch movement gives no visible acknowledgement");
  assert.match(runtime, /facingX < 0 \? "left" : "right"/, "horizontal animation mapping is reversed");
  assert.match(runtime, /questPixelCameraZoom\(/, "pixel scale still enlarges the low-resolution kit without a framing contract");
  assert.match(runtime, /\.setScale\(0\.74\)/, "the custom Beastie no longer shares the authored cast's on-screen silhouette scale");
  assert.match(runtime, /zoomTo\(zoom, 260, "Sine\.easeInOut", true\)/, "task camera changes still snap between scales");
  assert.match(runtime, /cameraTargetZoom/, "answer staging ignores the destination view while the camera is moving");
  assert.match(runtime, /choiceInside\.has\(choice\.id\)/, "standing on a choice can retrigger it every frame");
  assert.match(runtime, /choiceCooldownUntil = time \+ 780/, "choice contact has no recovery window");
  assert.match(runtime, /distance <= choice\.radius \+ 12/, "new stage choices can spawn around an occupied player");
  assert.match(runtime, /const clearDistance = choice\.radius \+ \(shortRelease \? 4 : 15\)/, "ordinary contacts no longer move the player fully clear");
  assert.match(runtime, /const choiceLeft = cameraCentreX - visibleHalfWidth \+ 48/, "authored side clearings can push a choice beyond the camera safe area");
  assert.match(runtime, /const WORLD_THEMES = Object\.freeze/, "all forty stops still share one pixel world kit");
  for (const world of ["meadow", "dino", "moonwood"]) {
    assert.match(runtime, new RegExp(`${world}: Object\\.freeze`), `${world} has no authored pixel kit`);
  }
  for (const authoredShape of ["lantern", "flower", "plank", "parcel", "destination", "orb", "sign"]) {
    assert.match(runtime, new RegExp(`${authoredShape}:`), `${authoredShape} tasks still use the generic token treatment`);
  }
  assert.match(runtime, /CHAPTER_PIXEL_PROFILES = Object\.freeze/, "the three broad worlds are not split into chapter identities");
  for (const chapter of [
    "seedwake-meadow",
    "river-gardens",
    "fossil-canyon",
    "forge-settlement",
    "glass-marsh",
    "storm-coast",
    "lantern-forest",
    "star-reach"
  ]) {
    assert.match(runtime, new RegExp(`"${chapter}": Object\\.freeze`), `${chapter} has no dedicated pixel profile`);
  }
  for (const landmark of ["singing-weir", "rib-camp", "word-forge", "mirror-fen", "thunder-lighthouse", "sleeping-observatory", "reading-star"]) {
    assert.match(runtime, new RegExp(`landmark: "${landmark}"`), `${landmark} is not represented in the live pixel world`);
  }
  const stopMaps = Object.values(STOP_PIXEL_MAPS);
  assert.equal(stopMaps.length, 40, "the forty-stop map brief is incomplete");
  assert.equal(new Set(stopMaps.map(map => map.motif)).size, 40, "stop map motifs are repeated");
  assert.ok(new Set(stopMaps.map(map => map.topology)).size >= 8, "route topology still collapses into one corridor");
  assert.deepEqual(new Set(stopMaps.map(map => map.scene)), new Set(["grove", "terraces", "crossing", "workyard", "arena"]));
  assert.equal(stopMaps.filter(map => map.authorship === "route-authored").length, 40, "generated routes are being misreported as authored maps");
  assert.equal(stopMaps.filter(map => map.authorship === "generated").length, 0, "the generated-map backlog is not empty");
  for (const [stopId, map] of Object.entries(AUTHORED_PIXEL_MAPS)) {
    assert.ok(map.routePoints.length >= 8, `${stopId} has no hand-composed route`);
    assert.deepEqual(map.routePoints[0], [0, 320], `${stopId} does not join the arrival gate`);
    assert.deepEqual(map.routePoints.at(-1), [1, 320], `${stopId} does not join the departure gate`);
    assert.ok(map.landmarkAnchor.progress > 0.4 && map.landmarkAnchor.progress < 0.8, `${stopId} landmark is not staged inside play`);
    assert.ok(Math.abs(map.landmarkAnchor.lateral) >= 140, `${stopId} landmark obstructs the main trail`);
    assert.ok(map.sceneryAnchors.length >= 10, `${stopId} still relies on repeated procedural scenery`);
    assert.ok(map.sceneryAnchors.every(anchor => Math.abs(anchor.lateral) >= 130), `${stopId} authored scenery obstructs its playable route`);
    for (const anchor of map.sceneryAnchors) {
      const anchorX = samplePixelMapRoute(map.routePoints, anchor.progress) + anchor.lateral;
      const routeClearance = Math.min(...authoredPixelRouteCenters(map, anchor.progress).map(routeX => Math.abs(routeX - anchorX)));
      assert.ok(routeClearance >= 90, `${stopId} authored scenery blocks an optional route`);
    }
    const landmarkX = samplePixelMapRoute(map.routePoints, map.landmarkAnchor.progress) + map.landmarkAnchor.lateral;
    const landmarkClearance = Math.min(...authoredPixelRouteCenters(map, map.landmarkAnchor.progress).map(routeX => Math.abs(routeX - landmarkX)));
    assert.ok(landmarkClearance >= 100, `${stopId} landmark blocks an optional route`);
  }
  assert.equal(samplePixelMapRoute(SEEDWAKE_AUTHORED_MAPS.s1.routePoints, 0), 320);
  assert.equal(samplePixelMapRoute(SEEDWAKE_AUTHORED_MAPS.s1.routePoints, 1), 320);
  assert.equal(authoredPixelRouteCenters(STOP_PIXEL_MAPS.s1, 0.5).length, 1);
  assert.equal(authoredPixelRouteCenters(STOP_PIXEL_MAPS.s2, 0.5).length, 2, "Seedwake's authored side trail is disconnected");
  assert.equal(authoredPixelRouteCenters(STOP_PIXEL_MAPS.s7, 0.5).length, 2, "River Gardens' island route is disconnected");
  assert.equal(authoredPixelRouteCenters(STOP_PIXEL_MAPS.s8, 0.45).length, 2, "River Gardens' branch route is disconnected");
  assert.equal(authoredPixelRouteCenters(STOP_PIXEL_MAPS.s12, 0.45).length, 2, "Fossil Canyon's ravine route is disconnected");
  assert.equal(authoredPixelRouteCenters(STOP_PIXEL_MAPS.s14, 0.45).length, 2, "Fossil Canyon's rescue route is disconnected");
  assert.equal(authoredPixelRouteCenters(STOP_PIXEL_MAPS.s16, 0.5).length, 3, "Forge Settlement's gearworks spokes are disconnected");
  assert.equal(authoredPixelRouteCenters(STOP_PIXEL_MAPS.s18, 0.5).length, 2, "Forge Settlement's foundry loop is disconnected");
  assert.equal(authoredPixelRouteCenters(STOP_PIXEL_MAPS.s20, 0.5).length, 2, "Forge Settlement's Word Forge island route is disconnected");
  assert.equal(authoredPixelRouteCenters(STOP_PIXEL_MAPS.s21, 0.5).length, 2, "Glass Marsh's reedlight branch is disconnected");
  assert.equal(authoredPixelRouteCenters(STOP_PIXEL_MAPS.s22, 0.5).length, 2, "Glass Marsh's ripple island is disconnected");
  assert.equal(authoredPixelRouteCenters(STOP_PIXEL_MAPS.s25, 0.5).length, 2, "Glass Marsh's Mirror Fen loop is disconnected");
  assert.equal(authoredPixelRouteCenters(STOP_PIXEL_MAPS.s27, 0.5).length, 2, "Storm Coast's harbour route is disconnected");
  assert.equal(authoredPixelRouteCenters(STOP_PIXEL_MAPS.s29, 0.5).length, 2, "Storm Coast's lens-yard route is disconnected");
  assert.equal(authoredPixelRouteCenters(STOP_PIXEL_MAPS.s30, 0.5).length, 2, "Storm Coast's lighthouse route is disconnected");
  assert.equal(authoredPixelRouteCenters(STOP_PIXEL_MAPS.s31, 0.5).length, 2, "Lantern Forest's mothlight branch is disconnected");
  assert.equal(authoredPixelRouteCenters(STOP_PIXEL_MAPS.s33, 0.5).length, 3, "Lantern Forest's map-hub spokes are disconnected");
  assert.equal(authoredPixelRouteCenters(STOP_PIXEL_MAPS.s34, 0.5).length, 2, "Lantern Forest's hollow loop is disconnected");
  assert.equal(authoredPixelRouteCenters(STOP_PIXEL_MAPS.s37, 0.5).length, 3, "Star Reach's archive spokes are disconnected");
  assert.equal(authoredPixelRouteCenters(STOP_PIXEL_MAPS.s38, 0.5).length, 2, "Star Reach's skybridge loop is disconnected");
  assert.equal(authoredPixelRouteCenters(STOP_PIXEL_MAPS.s39, 0.5).length, 2, "Star Reach's memory-yard branch is disconnected");
  assert.equal(Object.keys(RIVER_AUTHORED_MAPS).length, 5, "River Gardens is not fully route-authored");
  assert.ok(Object.values(RIVER_AUTHORED_MAPS).every(map => map.terrainAnchors.length >= 2), "River crossings still use one repeated global placement");
  assert.ok(new Set(Object.values(RIVER_AUTHORED_MAPS).map(map => map.terrainAnchors.join(":"))).size === 5, "River crossing compositions are still repeated");
  assert.equal(Object.keys(FOSSIL_AUTHORED_MAPS).length, 5, "Fossil Canyon is not fully route-authored");
  assert.ok(Object.values(FOSSIL_AUTHORED_MAPS).every(map => map.terrainAnchors.length >= 2), "Fossil Canyon has no authored shelf crossings");
  assert.equal(new Set(Object.values(FOSSIL_AUTHORED_MAPS).map(map => map.terrainAnchors.join(":"))).size, 5, "Fossil Canyon bridge compositions are repeated");
  assert.equal(Object.keys(FORGE_AUTHORED_MAPS).length, 5, "Forge Settlement is not fully route-authored");
  assert.ok(Object.values(FORGE_AUTHORED_MAPS).every(map => map.terrainAnchors.length >= 2), "Forge Settlement has no authored rail crossings");
  assert.equal(new Set(Object.values(FORGE_AUTHORED_MAPS).map(map => map.terrainAnchors.join(":"))).size, 5, "Forge Settlement rail compositions are repeated");
  assert.equal(Object.keys(GLASS_AUTHORED_MAPS).length, 5, "Glass Marsh is not fully route-authored");
  assert.ok(Object.values(GLASS_AUTHORED_MAPS).every(map => map.terrainAnchors.length >= 2), "Glass Marsh has no authored boardwalk crossings");
  assert.equal(new Set(Object.values(GLASS_AUTHORED_MAPS).map(map => map.terrainAnchors.join(":"))).size, 5, "Glass Marsh boardwalk compositions are repeated");
  assert.equal(Object.keys(STORM_AUTHORED_MAPS).length, 5, "Storm Coast is not fully route-authored");
  assert.ok(Object.values(STORM_AUTHORED_MAPS).every(map => map.terrainAnchors.length >= 2), "Storm Coast has no authored tidal crossings");
  assert.equal(new Set(Object.values(STORM_AUTHORED_MAPS).map(map => map.terrainAnchors.join(":"))).size, 5, "Storm Coast tidal compositions are repeated");
  assert.equal(Object.keys(LANTERN_AUTHORED_MAPS).length, 5, "Lantern Forest is not fully route-authored");
  assert.ok(Object.values(LANTERN_AUTHORED_MAPS).every(map => map.terrainAnchors.length >= 2), "Lantern Forest has no authored root crossings");
  assert.equal(new Set(Object.values(LANTERN_AUTHORED_MAPS).map(map => map.terrainAnchors.join(":"))).size, 5, "Lantern Forest root-crossing compositions are repeated");
  assert.equal(Object.keys(STAR_AUTHORED_MAPS).length, 5, "Star Reach is not fully route-authored");
  assert.ok(Object.values(STAR_AUTHORED_MAPS).every(map => map.terrainAnchors.length >= 2), "Star Reach has no authored constellation crossings");
  assert.equal(new Set(Object.values(STAR_AUTHORED_MAPS).map(map => map.terrainAnchors.join(":"))).size, 5, "Star Reach constellation compositions are repeated");
  assert.match(runtime, /createStopMapComposition\(\)/, "authored map composition is disconnected from scene creation");
  assert.match(runtime, /setData\("authoredStopScenery", true\)/, "authored scenery anchors are disconnected from the live scene");
  assert.match(runtime, /createEncounterEdgeDetails\(\)/, "wider encounter framing exposes empty procedural clearings");
  assert.match(runtime, /function createEncounterClearingCanvas/, "arena encounters still sit on flat vector circles");
  assert.doesNotMatch(runtime, /fillCircle\(point\.x, point\.y \+ 6, 72\)/, "the prototype encounter target circle returned");
  assert.doesNotMatch(runtime, /strokeEllipse\(point\.x, point\.y \+ 10/, "the prototype grove target ellipse returned");
  assert.match(runtime, /seedwake-flower-bloom/, "encounter-edge detail remains static while the rest of the world moves");
  assert.match(runtime, /function authoredChoiceSprite/, "task props never use the authored item sprites");
  assert.match(runtime, /const separateRune/, "sound labels are still painted directly across every physical prop");
  assert.match(runtime, /const embeddedLabel/, "short graphemes do not belong to their lanterns and trail signs");
  assert.match(runtime, /rawLabel\.length <= 3 && \/lantern\|sign\|path\|track\|parcel\|flower\|plank\|bridge\|fish/, "diegetic world labels can regress to floating placards");
  assert.match(runtime, /completionMotion\(/, "completed work remains a static trophy pile instead of changing the world");
  assert.match(runtime, /progressToPixel\(progress/, "completed work ignores its authored route destination");
  assert.match(runtime, /encounterProgress\.every/, "remembered landmarks can still cover an active task clearing");
  assert.match(runtime, /questRestoredMemoryPlacement\(index\)/, "returning residents can drift outside the navigable verge");
  assert.match(runtime, /memoryCameos/, "restored places remain empty of returning residents");
  assert.match(runtime, /updateMemoryCameos\(\)/, "returning residents never recognise the Beastie");
  assert.match(runtime, /playMemoryStory\(cameo\)/, "returning residents do not perform their authored memory");
  assert.match(runtime, /sourceStopId: cameo\.stopId/, "memory evidence cannot identify the restored stop");
  assert.match(runtime, /story\.change/, "memory performances never reveal the lasting world change");
  assert.match(runtime, /this\.clearMemoryStory\(\)/, "memory speech and path lights can leak across teardown");
  assert.match(runtime, /memoryStopId/, "returning residents are not tied to the place the child repaired");
  assert.match(runtime, /type: "optional-route"/, "optional route visits never reach telemetry");
  assert.match(component, /type: "optional-discovery"/, "chapter discoveries never reach telemetry");
  assert.match(runtime, /playDiscoveryMoment\(sprite, discovery\)/, "cache discoveries still exist only as a text notice");
  assert.match(runtime, /`\$\{key\}-celebrate`/, "the discovery resident does not perform the cache memory");
  assert.match(runtime, /DISCOVERY_MOMENT_SHAPES/, "chapter discoveries have no physical in-world object");
  assert.match(runtime, /this\.discoveryMoments = \[\]/, "discovery performances can leak across scene teardown");
  assert.match(runtime, /type: "memory-greeting"/, "returning-friend greetings never reach telemetry");
  assert.match(runtime, /performanceMode/, "residents have no active work performance state");
  assert.match(runtime, /-idle-sheet/, "Seedwake residents ignore their authored idle frames");
  assert.match(runtime, /-work-left/, "residents cannot face left into a task clearing");
  assert.match(runtime, /-work-right/, "residents cannot face right into a task clearing");
  assert.match(runtime, /setResidentPerformance\(/, "resident feedback has no recoverable performance state");
  assert.match(runtime, /-celebrate`/, "residents have no celebration performance");
  assert.match(runtime, /this\.syncCarriedObject\(this\.model\?\.activeStage\);/, "completed carry and steering props can remain attached during free travel");
  assert.match(runtime, /this\.bridge\.onError\?\./, "a Phaser scene creation error can leave the child on an endless loading screen");
  assert.match(component, /onError: reason => onSceneError\?\./, "pixel scene errors do not reach the accessible fallback path");
  assert.match(component, /const \[section\] = useState\(/, "pixel play can regenerate the active puzzle after a wrong answer");
  assert.match(component, /onInteraction/, "pixel play does not report interaction support evidence");
  assert.match(component, /onInteraction: event => interactionRef\.current\?\.\(event\)/, "pixel runtime interactions do not reach the React telemetry bridge");
  assert.match(component, /type: "prompt-shown"/, "pixel play does not record physical prompts");
  assert.match(component, /stageRecordsMastery/, "pixel muted guidance can still claim independent mastery");
  assert.match(component, /data-live-sparks/, "pixel pickups still hide their connection to the app economy");
  assert.match(component, /SEEDWAKE_CACHE_THRESHOLDS/, "pixel finds never reveal the next route-cache unlock");
  assert.match(component, /const cueCompact = phase === "trail" && encounterStarted;/, "the active task announcement does not start in its compact play state");
  assert.doesNotMatch(component, /setCollapsedCueStage/, "the active task announcement still hides the field before its delayed collapse");
  assert.match(component, /clearTimeout\(cueTimerRef\.current\)/, "the corrective cue timer can still update React after teardown");
  assert.match(component, /cueCompact \? "is-compact"/, "the brief task announcement has no compact play state");
  assert.match(component, /type: "scene-ready"/, "pixel scene load time is not reported");
  assert.match(component, /data-scene-asset-requests/, "pixel scene asset cost is not exposed for device audits");
  assert.match(runtime, /const minimalStarReachLoad = chapterId === "star-reach"/, "Star Reach still pays for the complete legacy meadow and Moonwood kit");
  assert.doesNotMatch(runtime, /star-premium-star-road-workshop/, "Star Reach restored memories still request a nonexistent workshop texture");
  assert.match(runtime, /warmQuestSfxEntries\(\[/, "muted pixel play no longer warms every sound effect before opening");
  assert.doesNotMatch(runtime, /this\.load\.audio/, "the pixel scene shipped Phaser's duplicate audio loader again");
  assert.match(runtime, /QUEST_ACTION_SFX/, "physical verbs still share one generic feedback sound");
  assert.match(runtime, /questActionSfxEntry/, "the active physical action does not select its own feedback sound");
  assert.doesNotMatch(runtime, /kind === "wrong" \|\| kind === "wait"/, "timing guidance still sounds and animates like a reading error");
  const fallback2d = fs.readFileSync("src/components/quest/world/QuestTrail2D.jsx", "utf8");
  assert.match(fallback2d, /playQuestActionSfx/, "accessible 2D play has no physical action sound parity");
  assert.match(fallback2d, /completionMarksRef/, "accessible 2D play forgets repaired objects between stages");
  assert.match(fallback2d, /q2d-repairs/, "accessible 2D play does not show the child's persistent repairs");
  assert.match(fallback2d, /visitedMemoryIds/, "accessible restored-world visits do not survive a checkpoint");
  assert.match(fallback2d, /Visit \{nextMemory\.story\.speaker\}/, "accessible play cannot approach a returning resident");
  assert.match(fallback2d, /type: "memory-greeting"/, "accessible restored-world visits do not emit parity evidence");
  assert.match(fallback2d, /questPixelResidentKey/, "accessible play does not preserve each named resident's visual identity");
  assert.doesNotMatch(fallback2d, /residentCastOffset/, "accessible play still changes a resident's identity at each stop");
  assert.match(fallback2d, /q2d-discovery/, "accessible cache discoveries remain an unperformed text paragraph");
  assert.match(fallback2d, /discoveryResidentSprite/, "accessible discoveries cannot show the resident who left them");
  assert.match(fallback2d, /data-live-sparks/, "accessible 2D play hides the value of trail finds");
  assert.match(fallback2d, /onBeat: true/, "accessible 2D play still requires reflex timing");
  assert.match(fallback2d, /type: "accessible-timing-support"/, "untimed accessible stages do not record the motor barrier they removed");
  assert.match(fallback2d, /type: "optional-discovery"/, "accessible play omits chapter discoveries");
  assert.doesNotMatch(fallback2d, /setInterval\(update, 70\)/, "accessible 2D play still runs a timing gate");
  assert.match(fallback2d, /taskFocusRef\.current\?\.focus\(\{ preventScroll: true \}\)/, "new accessible stages can lose keyboard and screen-reader focus");
  assert.match(fallback2d, /questChoiceFocusIndex/, "accessible choices have no predictable arrow-key order");
  assert.match(fallback2d, /aria-describedby="q2d-active-prompt q2d-active-progress"/, "answer controls do not carry their prompt and progress context");
  assert.match(runtime, /type: Phaser\.CANVAS/, "pixel mode still pays for an unnecessary WebGL context");
  assert.match(runtime, /antialias: false/, "pixel art is blurred by canvas antialiasing");
  assert.match(runtime, /smoothPixelArt: false/, "pixel art uses smoothing instead of authored texels");
  assert.match(runtime, /pixelArt: true/, "the pixel renderer no longer declares its sampling contract");
  assert.match(runtime, /roundPixels: true/, "fractional camera positions can shimmer the hero and scenery");
  assert.match(runtime, /const activeProfile = chapterPixelProfile\(this\.model\.section\)/, "pixel scenes do not share one active chapter load profile");
  assert.match(runtime, /const activeResidents = \[\.\.\.new Set\(activeProfile\.residents\)\]/, "pixel scenes still preload residents from every chapter");
  assert.match(runtime, /for \(const key of activeResidents\)/, "active cast loading is not chapter-scoped");
  assert.doesNotMatch(runtime, /this\.load\.spritesheet\("seedwake-mask-frog"/, "the complete Seedwake cast is still loaded unconditionally");
  assert.match(runtime, /readGamepadVector\(\)/, "pixel play has no gamepad input path");
  assert.match(runtime, /Number\(pressed\(15\)\) - Number\(pressed\(14\)\)/, "gamepad left and right are reversed");
  assert.match(runtime, /const inputStrength = Math\.min\(1, Math\.hypot\(x, y\)\)/, "analog stick travel does not control movement speed");
  assert.match(runtime, /profile\.response === "chase"/, "pursuit verbs still behave like static choices");
  assert.match(runtime, /const choiceX = choice\.container\.x/, "moving choices keep a stale collision position");
  assert.match(runtime, /const residentFocus = resident \?/, "active task framing can still lose the Beastie while locking to the resident");
  assert.match(runtime, /questPixelAvoidActorOverlap/, "ordinary answer art can still merge with the Beastie silhouette");
  assert.match(runtime, /PIXEL_LOWERCASE_GLYPHS/, "single-letter tasks still rely on unstable browser font rasterisation");
  assert.match(runtime, /const authoredLabelBadge = embeddedLabel && authoredSprite/, "authored learning objects still carry floating quiz placards");
  assert.match(runtime, /this\.player\.x, 0\.42/, "task framing does not balance the child avatar with the resident");
  assert.match(runtime, /item\.role === "route-destination"/, "route verbs still finish beside the resident");
  assert.match(runtime, /const breadcrumb = this\.add\.sprite/, "route destinations have no authored visual trail");
  assert.match(runtime, /profile\.response === "sort"/, "sorting verbs still behave like static choices");
  assert.match(runtime, /choice\.sortPhase != null/, "sorting tokens do not travel through a live lane");
  assert.match(runtime, /questPixelSortLaneLayout\(/, "sorting tasks do not reserve a player-safe side bay");
  assert.match(runtime, /fillRoundedRect\(-50, -14, 100, 28/, "sorting tasks have no visible world machine");
  assert.match(runtime, /updateToolChoice\(choice, time, distance\)/, "tool verbs still complete on first contact");
  assert.match(runtime, /choice\.item\.toolHoldMs/, "tool work has no authored dwell duration");
  assert.match(runtime, /beastie-action-tool-/, "the Beastie has no tool-use performance");
  assert.match(runtime, /profile\.response === "turn" && stage\.turnStep/, "turning has no visible observatory dial");
  assert.match(runtime, /item\.role === "turn-node"/, "turning does not use circular world positions");
  assert.match(runtime, /Math\.cos\(turnRadians\) \* 48/, "turning nodes do not orbit the dial");
  assert.match(runtime, /!\["turn-node", "steer-gate"\]\.includes\(choice\.item\.role\) && distance <= choice\.radius \+ 12/, "ordered route nodes inherit stale startup latching");
  assert.match(runtime, /item\.role === "turn-node" \? 1\.55 : 1/, "turn-node contact does not match its visible gear");
  assert.match(runtime, /profile\.response === "steer" && stage\.steerStep/, "ferry steering has no visible river channel");
  assert.match(runtime, /item\.role === "steer-gate"/, "ferry steering does not use ordered world gates");
  assert.match(runtime, /Number\(item\.steerLateral\) \|\| 0/, "steering gates do not form a lateral slalom");
  assert.match(runtime, /stage\?\.verbPattern === "steer"/, "the avatar never boards a visible ferry");
  assert.match(runtime, /x = Phaser\.Math\.Clamp\(x \* 0\.82/, "steering input still behaves like ordinary walking");
  assert.match(runtime, /const travelChoice = \["steer", "climb"\]\.includes\(profile\.response\)/, "the camera does not follow ferry and climbing routes");
  assert.match(runtime, /\["turn-node", "steer-gate"\]\.includes\(choice\.item\.role\)/, "steering gates push the ferry back downriver");
  assert.match(runtime, /profile\.response === "signal" && stage\.signalStep/, "signals have no visible world relay beam");
  assert.match(runtime, /item\.role === "signal-pad"/, "signal stages do not use positional relay pads");
  assert.match(runtime, /updateSignalChoice\(choice, time, distance\)/, "signals still complete on first contact");
  assert.match(runtime, /choice\.item\.signalHoldMs/, "signal alignment has no authored dwell duration");
  assert.match(runtime, /beastie-action-signal-/, "the Beastie has no signalling performance");
  assert.match(runtime, /profile\.response === "climb" && stage\.climbStep/, "climbing has no visible cliff face");
  assert.match(runtime, /item\.role === "climb-hold"/, "climbing does not use ordered world holds");
  assert.match(runtime, /updateClimbChoice\(choice, time, distance\)/, "climbing still completes on first contact");
  assert.match(runtime, /choice\.item\.climbHoldMs/, "climbing holds have no authored contact duration");
  assert.match(runtime, /beastie-action-climb-/, "the Beastie has no climbing performance");
  assert.match(runtime, /destroyTweenedObject\(object\)/, "stage disposal leaves repeat tweens alive");
  assert.match(runtime, /for \(const target of targets\) this\.tweens\.killTweensOf\(target\)/, "stage disposal does not clear child-object tweens");
  assert.match(runtime, /!this\.gateGlowTween/, "gate model updates can stack repeat glow tweens");
  assert.match(runtime, /this\.gateGlowTween\.remove\(\)/, "gate glow tween is not removed when motion or gate state changes");
  const richComponent = fs.readFileSync("src/components/quest/world/QuestHub.jsx", "utf8");
  assert.match(richComponent, /type: "scene-ready"/, "rich 3D scene load time is not reported");
});

test("the curated pixel kit retains verifiable CC0 provenance", () => {
  const root = "public/game-assets/quest-pixel";
  assert.ok(fs.existsSync(`${root}/SOURCE.md`));
  assert.ok(fs.existsSync(`${root}/license/CC0-1.0.txt`));
  assert.match(fs.readFileSync(`${root}/SOURCE.md`, "utf8"), /Ninja Adventure - Asset Pack/);
  for (const asset of [
    "seedwake/tiles/field.png",
    "seedwake/tiles/nature.png",
    "seedwake/tiles/village.png",
    "seedwake/characters/mask-frog/walk.png",
    "seedwake/characters/spirit/walk.png",
    "seedwake/characters/shaman-lion/walk.png",
    "seedwake/characters/egg-boy/walk.png",
    "seedwake/characters/ninja-blue/walk.png",
    "seedwake/characters/samurai-blue/walk.png",
    "seedwake/characters/samurai-green/walk.png",
    "seedwake/audio/success.wav",
    "seedwake/audio/pickup.wav",
    "seedwake/items/seed-1.png",
    "dino/tiles/desert.png",
    "dino/characters/cave-lion/walk.png",
    "moonwood/tiles/ruins.png",
    "moonwood/characters/sorcerer/walk.png",
    "moonwood/fx/fog.png"
  ]) {
    assert.ok(fs.statSync(`${root}/${asset}`).size > 0, `${asset} is missing`);
  }
});

test("Seedwake premium scenery retains authored provenance and fixed display canvases", () => {
  const root = "public/game-assets/quest-pixel/seedwake/scenery-premium";
  const expected = {
    "round-tree.png": { width: 128, height: 128 },
    "blossom-tree.png": { width: 128, height: 128 },
    "flower-shrub.png": { width: 96, height: 96 },
    "hollow-tree.png": { width: 160, height: 160 },
    "trail-ruin.png": { width: 112, height: 112 },
    "seed-lantern.png": { width: 80, height: 80 }
  };
  assert.match(fs.readFileSync(`${root}/SOURCE.md`, "utf8"), /project-authored premium Seedwake scenery/i);
  for (const [asset, dimensions] of Object.entries(expected)) {
    assert.deepEqual(pngDimensions(`${root}/${asset}`), dimensions, `${asset} changed canvas size`);
  }
  const runtime = fs.readFileSync("src/components/quest/world/questPixelRuntime.js", "utf8");
  for (const key of ["tree", "blossom-tree", "shrub", "hollow-tree", "ruin", "seed-lantern"]) {
    assert.match(runtime, new RegExp(`seedwake-premium-${key}`), `${key} is not integrated into Seedwake`);
  }
});

test("River Gardens premium scenery retains authored provenance and fixed display canvases", () => {
  const root = "public/game-assets/quest-pixel/river-gardens/scenery-premium";
  const expected = {
    "waterwheel-weir.png": { width: 160, height: 160 },
    "lily-ferry.png": { width: 112, height: 112 },
    "sluice-gate.png": { width: 128, height: 128 },
    "canal-map.png": { width: 128, height: 128 },
    "garden-arch.png": { width: 144, height: 144 },
    "willow-bank.png": { width: 144, height: 144 }
  };
  assert.match(fs.readFileSync(`${root}/SOURCE.md`, "utf8"), /project-authored premium River Gardens scenery/i);
  for (const [asset, dimensions] of Object.entries(expected)) {
    assert.deepEqual(pngDimensions(`${root}/${asset}`), dimensions, `${asset} changed canvas size`);
  }
  const runtime = fs.readFileSync("src/components/quest/world/questPixelRuntime.js", "utf8");
  for (const key of ["waterwheel", "lily-ferry", "sluice-gate", "canal-map", "garden-arch", "willow"]) {
    assert.match(runtime, new RegExp(`river-premium-${key}`), `${key} is not integrated into River Gardens`);
  }
});

test("Fossil Canyon premium scenery retains authored provenance and fixed display canvases", () => {
  const root = "public/game-assets/quest-pixel/fossil-canyon/scenery-premium";
  const expected = {
    "rib-arch.png": { width: 176, height: 176 },
    "dig-camp.png": { width: 160, height: 160 },
    "rope-bridge.png": { width: 176, height: 176 },
    "bone-signal.png": { width: 176, height: 176 },
    "amber-outcrop.png": { width: 144, height: 144 },
    "survey-station.png": { width: 160, height: 160 },
    "dig-basin.png": { width: 256, height: 192 }
  };
  assert.match(fs.readFileSync(`${root}/SOURCE.md`, "utf8"), /project-authored Fossil Canyon scenery kit/i);
  for (const [asset, dimensions] of Object.entries(expected)) {
    assert.deepEqual(pngDimensions(`${root}/${asset}`), dimensions, `${asset} changed canvas size`);
  }
  const runtime = fs.readFileSync("src/components/quest/world/questPixelRuntime.js", "utf8");
  for (const key of ["rib-arch", "dig-camp", "rope-bridge", "bone-signal", "amber-outcrop", "survey-station", "dig-basin"]) {
    assert.match(runtime, new RegExp(`fossil-premium-${key}`), `${key} is not integrated into Fossil Canyon`);
  }
});

test("Fossil Canyon premium interaction props retain authored provenance and replace fallback task art", () => {
  const root = "public/game-assets/quest-pixel/fossil-canyon/interaction-premium";
  const expected = {
    "fossil-rune.png": { width: 80, height: 80 },
    "track-marker.png": { width: 80, height: 80 },
    "fitted-bone.png": { width: 80, height: 80 },
    "rescue-flag.png": { width: 80, height: 80 },
    "fossil-beacon.png": { width: 88, height: 88 },
    "brush-station.png": { width: 96, height: 96 }
  };
  assert.match(fs.readFileSync(`${root}/SOURCE.md`, "utf8"), /project-authored Fossil Canyon interaction kit/i);
  for (const [asset, dimensions] of Object.entries(expected)) {
    assert.deepEqual(pngDimensions(`${root}/${asset}`), dimensions, `${asset} changed canvas size`);
  }
  const runtime = fs.readFileSync("src/components/quest/world/questPixelRuntime.js", "utf8");
  for (const key of ["rune", "track-marker", "fitted-bone", "rescue-flag", "beacon", "brush-station"]) {
    assert.match(runtime, new RegExp(`fossil-premium-${key}`), `${key} is not integrated into Fossil Canyon tasks`);
  }
  assert.match(runtime, /item\.role === "tool-work"/, "brush work does not receive its authored station");
});

test("Forge Settlement premium scenery retains authored provenance and gives every stop its own landmark", () => {
  const root = "public/game-assets/quest-pixel/forge-settlement/scenery-premium";
  const expected = {
    "gearworks-gate.png": { width: 192, height: 192 },
    "ore-hopper.png": { width: 176, height: 176 },
    "plate-foundry.png": { width: 192, height: 192 },
    "night-train.png": { width: 224, height: 176 },
    "word-forge.png": { width: 208, height: 208 },
    "workshop-market.png": { width: 192, height: 176 },
    "steam-pipes.png": { width: 128, height: 128 },
    "tool-rack.png": { width: 144, height: 128 },
    "rail-signal.png": { width: 96, height: 144 },
    "ore-cart.png": { width: 128, height: 112 },
    "sorting-conveyor.png": { width: 224, height: 160 },
    "ember-rivet.png": { width: 64, height: 64 }
  };
  assert.match(fs.readFileSync(`${root}/SOURCE.md`, "utf8"), /project-authored Forge Settlement scenery kit/i);
  for (const [asset, dimensions] of Object.entries(expected)) {
    assert.deepEqual(pngDimensions(`${root}/${asset}`), dimensions, `${asset} changed canvas size`);
  }
  const runtime = fs.readFileSync("src/components/quest/world/questPixelRuntime.js", "utf8");
  for (const key of ["gearworks-gate", "ore-hopper", "plate-foundry", "night-train", "word-forge", "workshop-market", "steam-pipes", "tool-rack", "rail-signal", "ore-cart", "sorting-conveyor", "ember-rivet"]) {
    assert.match(runtime, new RegExp(`forge-premium-${key}`), `${key} is not integrated into Forge Settlement`);
  }
});

test("Forge Settlement premium interaction props replace generic task shapes", () => {
  const root = "public/game-assets/quest-pixel/forge-settlement/interaction-premium";
  const expected = {
    "machine-gear.png": { width: 80, height: 80 },
    "ore-tray.png": { width: 80, height: 80 },
    "forge-rune.png": { width: 80, height: 80 },
    "rail-trolley.png": { width: 96, height: 80 },
    "word-plate.png": { width: 88, height: 88 },
    "gear-socket.png": { width: 96, height: 96 }
  };
  assert.match(fs.readFileSync(`${root}/SOURCE.md`, "utf8"), /project-authored Forge Settlement interaction kit/i);
  for (const [asset, dimensions] of Object.entries(expected)) {
    assert.deepEqual(pngDimensions(`${root}/${asset}`), dimensions, `${asset} changed canvas size`);
  }
  const runtime = fs.readFileSync("src/components/quest/world/questPixelRuntime.js", "utf8");
  for (const key of ["machine-gear", "ore-tray", "rune", "rail-trolley", "word-plate", "gear-socket"]) {
    assert.match(runtime, new RegExp(`forge-premium-${key}`), `${key} is not integrated into Forge Settlement tasks`);
  }
});

test("Glass Marsh premium scenery replaces the inherited meadow and ruin kit", () => {
  const root = "public/game-assets/quest-pixel/glass-marsh/scenery-premium";
  const expected = {
    "reedlight-landing.png": { width: 208, height: 176 },
    "ripple-pool.png": { width: 208, height: 192 },
    "mica-steps.png": { width: 192, height: 208 },
    "glint-causeway.png": { width: 224, height: 176 },
    "mirror-fen-beacon.png": { width: 192, height: 224 },
    "glass-workshop.png": { width: 208, height: 192 },
    "glass-reeds.png": { width: 128, height: 160 },
    "crystal-lilies.png": { width: 144, height: 112 },
    "marsh-lantern.png": { width: 96, height: 160 },
    "mirror-pool.png": { width: 160, height: 128 },
    "glass-boardwalk.png": { width: 208, height: 112 },
    "mirror-gem.png": { width: 64, height: 64 }
  };
  assert.match(fs.readFileSync(`${root}/SOURCE.md`, "utf8"), /project-authored Glass Marsh scenery kit/i);
  for (const [asset, dimensions] of Object.entries(expected)) {
    assert.deepEqual(pngDimensions(`${root}/${asset}`), dimensions, `${asset} changed canvas size`);
  }
  const runtime = fs.readFileSync("src/components/quest/world/questPixelRuntime.js", "utf8");
  for (const key of ["reedlight-landing", "ripple-pool", "mica-steps", "glint-causeway", "mirror-fen-beacon", "workshop", "reeds", "lilies", "lantern", "mirror-pool", "boardwalk", "mirror-gem"]) {
    assert.match(runtime, new RegExp(`glass-premium-${key}`), `${key} is not integrated into Glass Marsh`);
  }
});

test("Glass Marsh premium interaction props make every chapter verb physical", () => {
  const root = "public/game-assets/quest-pixel/glass-marsh/interaction-premium";
  const expected = {
    "tuned-reed.png": { width: 88, height: 112 },
    "lily-step.png": { width: 96, height: 80 },
    "marsh-fish-net.png": { width: 104, height: 88 },
    "mirror-shard.png": { width: 88, height: 96 },
    "fen-beacon.png": { width: 96, height: 112 },
    "mirror-socket.png": { width: 112, height: 88 }
  };
  assert.match(fs.readFileSync(`${root}/SOURCE.md`, "utf8"), /project-authored Glass Marsh interaction kit/i);
  for (const [asset, dimensions] of Object.entries(expected)) {
    assert.deepEqual(pngDimensions(`${root}/${asset}`), dimensions, `${asset} changed canvas size`);
  }
  const runtime = fs.readFileSync("src/components/quest/world/questPixelRuntime.js", "utf8");
  for (const key of ["tuned-reed", "lily-step", "marsh-fish-net", "mirror-shard", "fen-beacon", "mirror-socket"]) {
    assert.match(runtime, new RegExp(`glass-premium-${key}`), `${key} is not integrated into Glass Marsh tasks`);
  }
});

test("Storm Coast premium scenery replaces inherited meadow houses and sea stripes", () => {
  const root = "public/game-assets/quest-pixel/storm-coast/scenery-premium";
  const expected = {
    "galecliff-path.png": { width: 208, height: 240 },
    "shellhaven.png": { width: 224, height: 208 },
    "signal-harbour.png": { width: 224, height: 192 },
    "stormglass-cove.png": { width: 224, height: 224 },
    "thunder-lighthouse.png": { width: 176, height: 240 },
    "storm-shelter.png": { width: 224, height: 176 },
    "black-cliff.png": { width: 136, height: 176 },
    "tide-pool.png": { width: 152, height: 120 },
    "storm-buoy.png": { width: 96, height: 144 },
    "harbour-boardwalk.png": { width: 176, height: 112 },
    "sailcloth-windbreak.png": { width: 152, height: 112 },
    "lens-shard-pickup.png": { width: 64, height: 72 }
  };
  assert.match(fs.readFileSync(`${root}/SOURCE.md`, "utf8"), /project-authored Storm Coast scenery kit/i);
  for (const [asset, dimensions] of Object.entries(expected)) {
    assert.deepEqual(pngDimensions(`${root}/${asset}`), dimensions, `${asset} changed canvas size`);
  }
  const runtime = fs.readFileSync("src/components/quest/world/questPixelRuntime.js", "utf8");
  for (const key of ["galecliff-path", "shellhaven", "signal-harbour", "stormglass-cove", "thunder-lighthouse", "storm-shelter", "black-cliff", "tide-pool", "buoy", "boardwalk", "windbreak", "lens-shard-pickup"]) {
    assert.match(runtime, new RegExp(`storm-premium-${key}`), `${key} is not integrated into Storm Coast`);
  }
});

test("Storm Coast premium interaction props make every chapter verb physical", () => {
  const root = "public/game-assets/quest-pixel/storm-coast/interaction-premium";
  const expected = {
    "cliff-holds.png": { width: 112, height: 128 },
    "harbour-crate.png": { width: 104, height: 104 },
    "shelter-board.png": { width: 120, height: 96 },
    "storm-lens-shard.png": { width: 96, height: 112 },
    "fleet-signal-flag.png": { width: 88, height: 112 },
    "lighthouse-lens-socket.png": { width: 120, height: 96 }
  };
  assert.match(fs.readFileSync(`${root}/SOURCE.md`, "utf8"), /project-authored Storm Coast interaction kit/i);
  for (const [asset, dimensions] of Object.entries(expected)) {
    assert.deepEqual(pngDimensions(`${root}/${asset}`), dimensions, `${asset} changed canvas size`);
  }
  const runtime = fs.readFileSync("src/components/quest/world/questPixelRuntime.js", "utf8");
  for (const key of ["cliff-holds", "harbour-crate", "shelter-board", "lens-shard", "fleet-flag", "lens-socket"]) {
    assert.match(runtime, new RegExp(`storm-premium-${key}`), `${key} is not integrated into Storm Coast tasks`);
  }
});

test("Lantern Forest premium scenery replaces inherited meadow and Moonwood placeholders", () => {
  const root = "public/game-assets/quest-pixel/lantern-forest/scenery-premium";
  const expected = {
    "mothlight-gate.png": { width: 208, height: 240 },
    "echo-roots.png": { width: 240, height: 224 },
    "wispwood-turn.png": { width: 240, height: 192 },
    "orbit-hollow.png": { width: 240, height: 224 },
    "sleeping-observatory.png": { width: 224, height: 240 },
    "lantern-tree-workshop.png": { width: 224, height: 208 },
    "lantern-tree.png": { width: 160, height: 184 },
    "luminous-roots.png": { width: 144, height: 104 },
    "moth-cluster.png": { width: 120, height: 112 },
    "root-footbridge.png": { width: 152, height: 144 },
    "telescope-pedestal.png": { width: 112, height: 128 },
    "living-map-pickup.png": { width: 72, height: 64 }
  };
  assert.match(fs.readFileSync(`${root}/SOURCE.md`, "utf8"), /project-authored.*Lantern Forest/i);
  for (const [asset, dimensions] of Object.entries(expected)) {
    assert.deepEqual(pngDimensions(`${root}/${asset}`), dimensions, `${asset} changed canvas size`);
  }
  const runtime = fs.readFileSync("src/components/quest/world/questPixelRuntime.js", "utf8");
  for (const key of ["mothlight-gate", "echo-roots", "wispwood-turn", "orbit-hollow", "sleeping-observatory", "workshop", "tree", "roots", "moths", "root-bridge", "telescope-pedestal", "living-map-pickup"]) {
    assert.match(runtime, new RegExp(`lantern-premium-${key}`), `${key} is not integrated into Lantern Forest`);
  }
});

test("Lantern Forest premium interaction props make every chapter verb physical", () => {
  const root = "public/game-assets/quest-pixel/lantern-forest/interaction-premium";
  const expected = {
    "moth-roost.png": { width: 112, height: 104 },
    "forest-lantern.png": { width: 96, height: 120 },
    "memory-path-marker.png": { width: 120, height: 112 },
    "telescope-part.png": { width: 120, height: 96 },
    "observatory-orbit-dial.png": { width: 120, height: 120 },
    "observatory-alignment-socket.png": { width: 120, height: 112 }
  };
  assert.match(fs.readFileSync(`${root}/SOURCE.md`, "utf8"), /project-authored.*Lantern Forest/i);
  for (const [asset, dimensions] of Object.entries(expected)) {
    assert.deepEqual(pngDimensions(`${root}/${asset}`), dimensions, `${asset} changed canvas size`);
  }
  const runtime = fs.readFileSync("src/components/quest/world/questPixelRuntime.js", "utf8");
  for (const key of ["moth-roost", "forest-lantern", "memory-marker", "telescope-part", "orbit-dial", "observatory-socket"]) {
    assert.match(runtime, new RegExp(`lantern-premium-${key}`), `${key} is not integrated into Lantern Forest tasks`);
  }
});

test("Star Reach premium scenery replaces inherited Moonwood ruins and duplicate finale stars", () => {
  const root = "public/game-assets/quest-pixel/star-reach/scenery-premium";
  const expected = {
    "comet-stair.png": { width: 232, height: 240 },
    "aster-archive.png": { width: 240, height: 240 },
    "dawn-causeway.png": { width: 240, height: 224 },
    "reading-skybridge.png": { width: 240, height: 224 },
    "first-reading-star.png": { width: 240, height: 240 },
    "star-road-workshop.png": { width: 224, height: 224 },
    "floating-star-garden.png": { width: 168, height: 152 },
    "constellation-rail.png": { width: 160, height: 120 },
    "skybridge-island.png": { width: 168, height: 144 },
    "comet-beacon.png": { width: 112, height: 160 },
    "dawn-crystals.png": { width: 144, height: 112 },
    "reader-page-pickup.png": { width: 72, height: 72 }
  };
  const provenance = fs.readFileSync(`${root}/SOURCE.md`, "utf8");
  assert.match(provenance, /Star Reach premium scenery sources/i);
  assert.match(provenance, /Project-authored with OpenAI image generation/i);
  for (const [asset, dimensions] of Object.entries(expected)) {
    assert.deepEqual(pngDimensions(`${root}/${asset}`), dimensions, `${asset} changed canvas size`);
  }
  const runtime = fs.readFileSync("src/components/quest/world/questPixelRuntime.js", "utf8");
  for (const key of ["comet-stair", "aster-archive", "dawn-causeway", "reading-skybridge", "first-reading-star", "workshop", "floating-garden", "constellation-rail", "skybridge-island", "comet-beacon", "dawn-crystals", "reader-page-pickup"]) {
    assert.match(runtime, new RegExp(`star-premium-${key}`), `${key} is not integrated into Star Reach`);
  }
});

test("Star Reach premium interaction props make every final-chapter verb physical", () => {
  const root = "public/game-assets/quest-pixel/star-reach/interaction-premium";
  const expected = {
    "constellation-route-node.png": { width: 120, height: 120 },
    "sky-courier-capsule.png": { width: 128, height: 104 },
    "star-sorting-prism.png": { width: 120, height: 120 },
    "memory-journey-page.png": { width: 128, height: 112 },
    "reading-sound-sigil.png": { width: 120, height: 120 },
    "first-reading-star-socket.png": { width: 120, height: 120 }
  };
  const provenance = fs.readFileSync(`${root}/SOURCE.md`, "utf8");
  assert.match(provenance, /Star Reach premium interaction sources/i);
  assert.match(provenance, /Project-authored with OpenAI image generation/i);
  for (const [asset, dimensions] of Object.entries(expected)) {
    assert.deepEqual(pngDimensions(`${root}/${asset}`), dimensions, `${asset} changed canvas size`);
  }
  const runtime = fs.readFileSync("src/components/quest/world/questPixelRuntime.js", "utf8");
  for (const key of ["route-node", "sky-capsule", "sorting-prism", "memory-page", "reading-sigil", "reading-star-socket"]) {
    assert.match(runtime, new RegExp(`star-premium-${key}`), `${key} is not integrated into Star Reach tasks`);
  }
});

test("all chapter casts resolve to animated resident sheets in both display modes", () => {
  assert.equal(Object.keys(QUEST_PIXEL_CHAPTER_CASTS).length, 8);
  assert.equal(Object.keys(QUEST_PIXEL_NAMED_CASTS).length, 8);
  assert.ok(Object.keys(QUEST_PIXEL_RESIDENT_PATHS).length >= 20);
  assert.equal(Object.keys(QUEST_PIXEL_RESIDENT_IDLE_PATHS).length, 48);
  assert.equal(Object.keys(QUEST_PIXEL_RESIDENT_ITEM_PATHS).length, 48);
  assert.equal(Object.keys(QUEST_PIXEL_RESIDENT_JUMP_PATHS).length, 48);
  assert.ok(new Set(Object.values(QUEST_PIXEL_CHAPTER_CASTS).flat()).size >= 20);
  assert.equal(QUEST_PIXEL_CHAPTER_CASTS["fossil-canyon"].length, 4);
  assert.equal(QUEST_PIXEL_CHAPTER_CASTS["forge-settlement"].length, 4);
  assert.equal(QUEST_PIXEL_CHAPTER_CASTS["glass-marsh"].length, 4);
  assert.equal(QUEST_PIXEL_CHAPTER_CASTS["storm-coast"].length, 4);
  assert.equal(QUEST_PIXEL_CHAPTER_CASTS["lantern-forest"].length, 4);
  assert.equal(QUEST_PIXEL_CHAPTER_CASTS["star-reach"].length, 4);
  for (const [chapterId, cast] of Object.entries(QUEST_PIXEL_CHAPTER_CASTS)) {
    assert.equal(questPixelChapterCast(chapterId), cast);
    assert.ok(cast.length >= 3, `${chapterId} has too little cast variation`);
    const ceremonyCast = questPixelCeremonyCast(chapterId);
    assert.equal(ceremonyCast.length, Math.min(4, cast.length));
    assert.equal(new Set(ceremonyCast).size, ceremonyCast.length, `${chapterId} repeats a finale resident`);
    const preferred = cast.slice(-3);
    const localFirst = questPixelCeremonyCast(chapterId, "meadow", 4, preferred);
    assert.deepEqual(localFirst.slice(0, preferred.length), preferred, `${chapterId} leaves a local resident outside the finale`);
    for (const resident of cast) {
      const publicPath = questPixelResidentPath(resident);
      assert.ok(publicPath.endsWith("/walk.png"));
      assert.ok(fs.statSync(`public${publicPath}`).size > 0, `${resident} cannot render in accessible 2D`);
      const frameSize = questPixelResidentFrameSize(resident);
      assert.ok([16, 64].includes(frameSize), `${resident} has an unsupported frame size`);
      const idlePath = questPixelResidentIdlePath(resident);
      assert.ok(fs.statSync(`public${idlePath}`).size > 0, `${resident} idle sheet is missing`);
      const itemPath = questPixelResidentItemPath(resident);
      assert.ok(fs.statSync(`public${itemPath}`).size > 0, `${resident} item performance is missing`);
      const jumpPath = questPixelResidentJumpPath(resident);
      assert.ok(fs.statSync(`public${jumpPath}`).size > 0, `${resident} jump performance is missing`);
    }
  }

  for (const resident of ["seedwake-mask-frog", "seedwake-green-pig", "seedwake-shaman-lion", "seedwake-egg-boy"]) {
    assert.equal(questPixelResidentFrameSize(resident), 64, `${resident} did not receive the authored Seedwake upgrade`);
    const residentPath = questPixelResidentPath(resident);
    assert.match(residentPath, /characters-premium/, `${resident} still points to the 16-pixel source sheet`);
    assert.deepEqual(
      pngDimensions(`public${residentPath}`),
      { width: 256, height: 256 },
      `${resident} walk sheet must remain a four-direction, four-frame 64-pixel atlas`
    );
    for (const actionPath of [
      questPixelResidentIdlePath(resident),
      questPixelResidentItemPath(resident),
      questPixelResidentJumpPath(resident)
    ]) {
      assert.deepEqual(
        pngDimensions(`public${actionPath}`),
        { width: 256, height: 64 },
        `${resident} action sheet must remain four 64-pixel frames`
      );
    }
  }
  for (const resident of ["river-nori", "river-fizz", "river-quill", "river-rill"]) {
    assert.equal(questPixelResidentFrameSize(resident), 64, `${resident} did not receive the authored River Gardens upgrade`);
    const residentPath = questPixelResidentPath(resident);
    assert.match(residentPath, /river-gardens\/characters-premium/, `${resident} still points to an inherited 16-pixel sheet`);
    assert.deepEqual(
      pngDimensions(`public${residentPath}`),
      { width: 256, height: 256 },
      `${resident} walk sheet must remain a four-direction, four-frame 64-pixel atlas`
    );
    for (const actionPath of [
      questPixelResidentIdlePath(resident),
      questPixelResidentItemPath(resident),
      questPixelResidentJumpPath(resident)
    ]) {
      assert.deepEqual(
        pngDimensions(`public${actionPath}`),
        { width: 256, height: 64 },
        `${resident} action sheet must remain four 64-pixel frames`
      );
    }
  }
  for (const resident of ["fossil-fen", "fossil-rook", "fossil-amber", "fossil-claw"]) {
    assert.equal(questPixelResidentFrameSize(resident), 64, `${resident} did not receive the authored Fossil Canyon upgrade`);
    const residentPath = questPixelResidentPath(resident);
    assert.match(residentPath, /fossil-canyon\/characters-premium/, `${resident} still points to an inherited 16-pixel sheet`);
    assert.deepEqual(
      pngDimensions(`public${residentPath}`),
      { width: 256, height: 256 },
      `${resident} walk sheet must remain a four-direction, four-frame 64-pixel atlas`
    );
    for (const actionPath of [
      questPixelResidentIdlePath(resident),
      questPixelResidentItemPath(resident),
      questPixelResidentJumpPath(resident)
    ]) {
      assert.deepEqual(
        pngDimensions(`public${actionPath}`),
        { width: 256, height: 64 },
        `${resident} action sheet must remain four 64-pixel frames`
      );
    }
  }
  for (const resident of ["forge-cinder", "forge-bolt", "forge-soot", "forge-bellows"]) {
    assert.equal(questPixelResidentFrameSize(resident), 64, `${resident} did not receive the authored Forge Settlement upgrade`);
    const residentPath = questPixelResidentPath(resident);
    assert.match(residentPath, /forge-settlement\/characters-premium/, `${resident} still points to an inherited 16-pixel sheet`);
    assert.deepEqual(
      pngDimensions(`public${residentPath}`),
      { width: 256, height: 256 },
      `${resident} walk sheet must remain a four-direction, four-frame 64-pixel atlas`
    );
    for (const actionPath of [
      questPixelResidentIdlePath(resident),
      questPixelResidentItemPath(resident),
      questPixelResidentJumpPath(resident)
    ]) {
      assert.deepEqual(
        pngDimensions(`public${actionPath}`),
        { width: 256, height: 64 },
        `${resident} action sheet must remain four 64-pixel frames`
      );
    }
  }
  for (const resident of ["glass-vale", "glass-ripple", "glass-mica", "glass-glint"]) {
    assert.equal(questPixelResidentFrameSize(resident), 64, `${resident} did not receive the authored Glass Marsh upgrade`);
    const residentPath = questPixelResidentPath(resident);
    assert.match(residentPath, /glass-marsh\/characters-premium/, `${resident} still points to an inherited 16-pixel sheet`);
    assert.deepEqual(
      pngDimensions(`public${residentPath}`),
      { width: 256, height: 256 },
      `${resident} walk sheet must remain a four-direction, four-frame 64-pixel atlas`
    );
    for (const actionPath of [
      questPixelResidentIdlePath(resident),
      questPixelResidentItemPath(resident),
      questPixelResidentJumpPath(resident)
    ]) {
      assert.deepEqual(
        pngDimensions(`public${actionPath}`),
        { width: 256, height: 64 },
        `${resident} action sheet must remain four 64-pixel frames`
      );
    }
  }
  for (const resident of ["star-nova", "star-comet", "star-aster", "star-dawn"]) {
    assert.equal(questPixelResidentFrameSize(resident), 64, `${resident} did not receive the authored Star Reach upgrade`);
    const residentPath = questPixelResidentPath(resident);
    assert.match(residentPath, /star-reach\/characters-premium/, `${resident} still points to an inherited 16-pixel sheet`);
    assert.deepEqual(
      pngDimensions(`public${residentPath}`),
      { width: 256, height: 256 },
      `${resident} walk sheet must remain a four-direction, four-frame 64-pixel atlas`
    );
    for (const actionPath of [
      questPixelResidentIdlePath(resident),
      questPixelResidentItemPath(resident),
      questPixelResidentJumpPath(resident)
    ]) {
      assert.deepEqual(
        pngDimensions(`public${actionPath}`),
        { width: 256, height: 64 },
        `${resident} action sheet must remain four 64-pixel frames`
      );
    }
  }
  assert.equal(questPixelMemoryResidentKey("seedwake-meadow", "s1"), questPixelResidentKey("seedwake-meadow", "Moss"));
  assert.equal(questPixelMemoryResidentKey("seedwake-meadow", "s2"), questPixelResidentKey("seedwake-meadow", "Tumble"));
  assert.equal(questPixelMemoryResidentKey("seedwake-meadow", "s3"), questPixelResidentKey("seedwake-meadow", "Bramble"));
  assert.equal(questPixelMemoryResidentKey("seedwake-meadow", "s4"), questPixelResidentKey("seedwake-meadow", "Moss"));

  for (const chapter of QUEST_CHAPTERS) {
    const namedFriends = [chapter.cast.guide, ...chapter.cast.residents];
    const resolvedKeys = namedFriends.map(friend => (
      questPixelResidentKey(chapter.id, friend.name, chapter.worldKit)
    ));
    assert.deepEqual(
      questPixelNamedChapterCast(chapter.id, chapter.worldKit),
      resolvedKeys,
      `${chapter.id} ceremony does not preserve the declared cast order`
    );
    assert.equal(
      new Set(resolvedKeys).size,
      namedFriends.length,
      `${chapter.id} gives two named friends the same visual identity`
    );
    for (const friend of namedFriends) {
      const key = questPixelResidentKey(chapter.id, friend.name, chapter.worldKit);
      assert.equal(
        questPixelResidentKey(chapter.id, friend.name.toUpperCase(), chapter.worldKit),
        key,
        `${friend.name}'s identity is not stable across text presentation`
      );
      assert.ok(QUEST_PIXEL_CHAPTER_CASTS[chapter.id].includes(key), `${friend.name} is outside the chapter asset profile`);
    }
  }
});

test("the Den, map and Trading Post keep their complete phone controls", () => {
  const den = fs.readFileSync("src/components/quest/DenScreen.jsx", "utf8");
  const map = fs.readFileSync("src/components/quest/TrailMap.jsx", "utf8");
  const shop = fs.readFileSync("src/components/quest/TradingPost.jsx", "utf8");
  const css = fs.readFileSync("src/styles/quest.css", "utf8");

  assert.match(den, /aria-label="Open settings"/, "the adult comfort controls are not clearly named");
  assert.match(map, /className="q-chapter-picker"/, "the phone map has no complete chapter picker");
  assert.match(map, /Choose a story chapter/, "the phone chapter picker is not named for assistive technology");
  assert.match(map, /\{ x: 15, y: 70 \}/, "the first stop can clip at 320px");
  assert.match(map, /\{ x: 85, y: 56 \}/, "the last stop can clip at 320px");
  assert.match(map, /const currentPosition = journeyComplete\s*\? null/, "the walker remains on a completed final stop");
  assert.match(map, /const isNext = !journeyComplete && !isDone && stop\.index === nextIndex/, "the final stop remains both done and current");
  assert.match(css, /\.q-post > \* \{ flex: 0 0 auto; \}/, "shop rows can collapse and overlap while scrolling");
  assert.match(css, /\.q-tabs\.q-post-tabs \{[\s\S]*?grid-template-columns: repeat\(4/, "phone shop shelves do not override the generic scrolling tabs");
  assert.match(css, /@media \(max-width: 420px\)[\s\S]*?\.q-tabs\.q-post-tabs \{ grid-template-columns: repeat\(3/, "the smallest phone cannot show every shop shelf label");
  assert.match(css, /\.q2d-gate h1 \{[\s\S]*?54px/, "the accessible gate headline can push Walk through below a 720px viewport");
  assert.equal((shop.match(/role="tab"/g) || []).length, 1, "shop shelf semantics were removed");
  assert.match(shop, /tabIndex=\{tab === t\.id \? 0 : -1\}/, "shop tabs do not use one predictable keyboard focus stop");
  assert.match(shop, /event\.key === "ArrowRight"/, "shop tabs cannot be traversed with standard arrow keys");
  assert.match(shop, /role="tabpanel"/, "the selected shop shelf is not connected to its active tab");
});

test("earned relic abilities and world memory reach pixel and accessible play", () => {
  const pixel = fs.readFileSync("src/components/quest/world/QuestPixelWorld.jsx", "utf8");
  const fallback = fs.readFileSync("src/components/quest/world/QuestTrail2D.jsx", "utf8");
  const runtime = fs.readFileSync("src/components/quest/world/questPixelRuntime.js", "utf8");

  for (const component of [pixel, fallback]) {
    assert.match(component, /questRewardBonuses\(state\)/, "a renderer ignores the child's earned relics");
    assert.match(component, /rewardIds: rewardBonuses\.rewardIds/, "relic cache paths are not built");
    assert.match(component, /rewardCacheCount: rewardBonuses\.branchCacheCount/, "satchel and relic caches are disconnected");
  }
  assert.match(runtime, /createRestoredMoments\(\)/, "completed stops do not persist visibly in pixel play");
  assert.match(runtime, /createRelicEffects\(\)/, "relic abilities have no visible pixel effects");
  assert.match(runtime, /burstCache\(sprite\)/, "secret caches do not respond as physical world objects");
  assert.match(runtime, /if \(!burstKind \|\| this\.model\.reducedMotion\) return/, "cache debris ignores reduced-motion play");
  assert.match(runtime, /updateReactiveFoliage\(time\)/, "walking through the world has no environmental response");
  assert.match(runtime, /quest-weather-rain-splash/, "Storm Coast rain still has no authored ground response");
  assert.match(runtime, /quest-weather-cloud/, "River Gardens mist still has no authored cloud silhouette");
  assert.match(runtime, /quest-weather-snow/, "Star Reach particles still have no authored silhouettes");
  assert.doesNotMatch(runtime, /mote = this\.add\.rectangle\(x, y, 2, 13/, "Storm Coast rain still uses procedural lines");
  assert.doesNotMatch(runtime, /mote = this\.add\.circle\(x, y/, "chapter atmosphere still uses procedural dots");
  assert.match(runtime, /if \(this\.model\.reducedMotion\) return/, "reactive traversal scenery ignores reduced-motion play");
  assert.match(runtime, /rewardBonuses\?\.collectionRadius/, "the Seedwake Lantern does not extend pickup range");
  assert.match(runtime, /rewardBonuses\?\.interactionRadius/, "the Storm Lens does not extend interaction range");
  assert.match(runtime, /questOptionalRouteCenters\(\{ main, topology: map\.topology, progress, stopIndex \}\)/, "branch maps still replace the real trail with disconnected decorative paths");
  assert.match(runtime, /questRouteLaneSelection/, "the visible side route cannot be selected by movement or touch");
  assert.match(runtime, /optionalPixelRoutePoint/, "optional routes have no finds or caches worth exploring");
  assert.match(runtime, /routeCenters\.length > 1 \? 48 : 100/, "touch travel still clamps branching maps to the invisible midpoint");
  assert.match(runtime, /blocksRoute \|\| blocksEncounter/, "authored scenery can still block the visible optional lane");
  assert.match(pixel, /Secret cache \+\$\{SPARKS_PER_DROP\} Sparks/, "pixel pickups still have no stated use");
  assert.match(fallback, /Each find becomes 2 Sparks for your Beastie/, "accessible pickups still have no stated use");
  assert.match(fs.readFileSync("src/styles/quest.css", "utf8"), /q2dDiscoveryResidentFrames/, "the accessible discovery resident never performs");
});

test("book-world play exposes direct four-way movement on touch and keyboard", () => {
  const pixel = fs.readFileSync("src/components/quest/world/QuestPixelWorld.jsx", "utf8");
  const runtime = fs.readFileSync("src/components/quest/world/questPixelRuntime.js", "utf8");
  assert.match(runtime, /meadow-pals-trail-v2\.webp/, "Meadow does not use the illustrated book-world map");
  assert.match(runtime, /dino-pals-trail-v2\.webp/, "Dino Land does not use the illustrated book-world map");
  assert.match(runtime, /moonwood-trail-v2\.webp/, "Moonwood does not use the illustrated book-world map");
  for (const direction of ["left", "right", "up", "down"]) {
    assert.match(runtime, new RegExp(`directionInput\\.${direction}`), `${direction} is missing from held movement`);
  }
  assert.match(runtime, /startMove\(direction\)/, "touch controls cannot begin held movement");
  assert.match(runtime, /stopMove\(direction\)/, "touch controls cannot stop held movement");
  assert.match(pixel, /runtimeRef\.current\?\.startMove\(dir\)/, "the d-pad is not wired to held movement");
  assert.match(pixel, /onLostPointerCapture=\{\(\) => runtimeRef\.current\?\.stopMove\(dir\)\}/,
    "a released touch can leave movement stuck on");
});

test("chapter ceremonies close the destination story with the returning cast", () => {
  const ceremony = fs.readFileSync("src/components/quest/RewardScreen.jsx", "utf8");
  const progress = fs.readFileSync("src/utils/questProgress.js", "utf8");
  const root = fs.readFileSync("src/components/quest/QuestRoot.jsx", "utf8");
  const pixel = fs.readFileSync("src/components/quest/world/QuestPixelWorld.jsx", "utf8");
  const runtime = fs.readFileSync("src/components/quest/world/questPixelRuntime.js", "utf8");

  assert.match(progress, /destination: chapter\.destination/, "the ceremony cannot name the place the child restored");
  assert.match(progress, /finale: chapter\.finale/, "the chapter's physical finale disappears from its ceremony");
  assert.match(progress, /cast: \[chapter\.cast\.guide, \.\.\.chapter\.cast\.residents\]/, "chapter friends disappear from the ending");
  assert.match(ceremony, /Friends celebrating with you/, "the resident cast is not present in the ceremony");
  assert.match(ceremony, /createPixelBeastieSheet/, "the ceremony replaces the in-game Beastie with a different rendering style");
  assert.match(ceremony, /questPixelResidentPath/, "the returning cast is reduced to static placeholder initials");
  assert.match(ceremony, /questPixelResidentJumpPath/, "the returning cast reuses walking frames instead of celebrating");
  assert.match(ceremony, /q-ceremony-cast-stage/, "the returning cast does not appear together in the finale scene");
  assert.match(ceremony, /state\?\.settings\?\.reducedMotion/, "the ceremony ignores the child's in-app motion setting");
  assert.match(ceremony, /places repaired/, "the ceremony does not close the child's chapter-scale work");
  assert.match(ceremony, /chapterReward\.worldEffect/, "the relic reveal does not say how the world changed");
  assert.match(ceremony, /\+\{sparkGain\} Sparks/, "the ceremony does not name the Sparks earned on this trail");
  assert.match(ceremony, /\{sparkBalance\} ready to spend/, "the ceremony does not close the reward loop with the spendable balance");
  assert.match(ceremony, /Choose new gear/, "the chapter reward has no direct path to spending earned Sparks");
  assert.match(root, /onTradingPost=\{visitTradingPostAfterCeremony\}/, "the ceremony's shop action is not wired to the Trading Post");
  assert.match(root, /ceremonyOverlayVisible/, "the reward panel covers the in-world finale immediately");
  assert.match(root, /ceremony=\{view === VIEW\.CEREMONY/, "pixel play is not told to stage the chapter finale");
  assert.match(pixel, /ceremony: Boolean\(ceremony\)/, "the chapter finale never reaches the pixel scene model");
  assert.match(runtime, /questPixelCeremonyFormation/, "the returning cast has no in-world group formation");
  assert.match(runtime, /questPixelNamedChapterCast/, "the finale does not preserve the named returning cast");
  assert.doesNotMatch(runtime, /index % sourceKeys\.length/, "a short chapter cast is padded with duplicate residents");
  assert.match(runtime, /syncCeremony\(Boolean\(model\.ceremony\)\)/, "the in-world finale is not synchronised with the journey state");
  assert.match(runtime, /this\.model\.reducedMotion \? `\$\{key\}-idle` : `\$\{key\}-ceremony`/, "the in-world cast ignores reduced motion");
  assert.match(runtime, /CEREMONY_RELIC_SHAPES/, "chapter relics have no in-world visual identity");
  assert.match(runtime, /setData\("chapterRelic"/, "the finale does not create a physical relic handoff");
  assert.match(runtime, /const handoffPoint = formation\.at\(-1\)/, "the relic does not travel from the returning cast");
  assert.match(runtime, /createArenaPlazaCanvas/, "the chapter finale still sits on a flat procedural target");
  assert.doesNotMatch(runtime, /fillCircle\(center, y, 102\)/, "the arena still uses the oversized concentric-circle floor");
});

test("Sound Seekers preserves its authored mix across scene state and tab visibility", () => {
  const root = fs.readFileSync("src/components/quest/QuestRoot.jsx", "utf8");
  const music = fs.readFileSync("src/utils/audio/gameMusic.js", "utf8");
  const cues = fs.readFileSync("src/utils/audio/cuePlayer.js", "utf8");
  const den = fs.readFileSync("src/components/quest/DenScreen.jsx", "utf8");

  assert.match(root, /mode: musicMode/, "later chapters do not receive travel, encounter, and ceremony music mixes");
  assert.match(root, /const soundscapeEnabled = isSoundEnabled && !state\.settings\?\.quietSoundscape/, "background audio cannot be quieted independently of phonics cues");
  assert.match(root, /quietSoundscape=\{Boolean\(state\.settings\?\.quietSoundscape\)\}/, "the saved soundscape preference does not reach Settings");
  assert.match(den, /Quiet soundscape \(spoken sounds stay on\)/, "Settings do not explain that spoken phonics remains available");
  assert.match(root, /setGameAudioSuspended\(hidden\)/, "hidden tabs keep playing Sound Seekers music");
  assert.match(root, /setCueAudioSuspended\(hidden\)/, "hidden tabs keep consuming the active phonics cue");
  assert.match(root, /document\.addEventListener\("visibilitychange", syncAudioVisibility\)/, "audio visibility recovery is not installed");
  assert.match(music, /GAME_AUDIO_MIXES/, "quest scene states have no shared mix contract");
  assert.match(music, /resumeAfterSuspend/, "music restarts from the beginning after backgrounding");
  assert.match(music, /active\.audio\.pause\(\)/, "the score does not pause when Sound Seekers is hidden");
  assert.match(music, /activeAmbience\.audio\.pause\(\)/, "the environmental soundscape does not pause when hidden");
  assert.match(cues, /cueResumeAfterSuspend/, "the phonics cue restarts after backgrounding");
  assert.match(cues, /currentCue\.pause\(\)/, "the phonics cue does not pause while hidden");
  assert.match(cues, /setQuestActionSfxInstructionActive\(true\)/, "physical feedback can mask the opening of a phonics cue");
  assert.match(cues, /setQuestActionSfxInstructionActive\(false\)/, "the instructional mix never releases after a phonics cue");
});
