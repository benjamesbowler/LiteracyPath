// SOUND SEEKERS IS A PIXEL GAME.
//
// This list used to be six renderers offered to the child in a dropdown —
// Automatic, Pixel, Rich 3D, Balanced 3D, Low-power 3D, Accessible 2D. Three
// of them dropped a five-year-old into a game that looked nothing like the one
// they were playing, and no child can make that choice meaningfully.
//
// The pixel world is now THE game. The 3D and DOM renderers survive only as
// automatic fallbacks for devices that genuinely cannot run Phaser — chosen by
// the device, never offered as a question. Keeping the ids here (rather than
// deleting them) means an old saved setting, or a cloud row written by a
// previous build, still resolves to something real instead of falling over.
import { normalizeAudioPreferences } from "./audio/audioPreferences.js";

export const QUEST_DISPLAY_MODES = Object.freeze([
  { id: "auto", label: "Automatic" },
  { id: "pixel", label: "Pixel adventure" }
]);

// Legacy ids that may still be sitting in a saved profile or a cloud row.
// They are accepted on read and mapped to the pixel world, never surfaced.
const RETIRED_DISPLAY_MODES = Object.freeze(["rich", "balanced", "low", "2d"]);

export const QUEST_QUALITY_TIERS = Object.freeze({
  pixel: Object.freeze({
    id: "pixel",
    pixelRatio: 1,
    shadows: false,
    shadowSize: 0,
    treeRows: 0,
    decorationStep: 12,
    ambientScale: 0.7,
    particleScale: 0.7,
    motionScale: 1,
    water: true,
    postEffects: false
  }),
  rich: Object.freeze({
    id: "rich",
    pixelRatio: 1.75,
    shadows: true,
    shadowSize: 2048,
    treeRows: 3,
    decorationStep: 8,
    ambientScale: 1,
    particleScale: 1,
    motionScale: 1,
    water: true,
    postEffects: true
  }),
  balanced: Object.freeze({
    id: "balanced",
    pixelRatio: 1.35,
    shadows: true,
    shadowSize: 1024,
    treeRows: 2,
    decorationStep: 11,
    ambientScale: 0.72,
    particleScale: 0.62,
    motionScale: 0.7,
    water: true,
    postEffects: true
  }),
  low: Object.freeze({
    id: "low",
    pixelRatio: 1,
    shadows: false,
    shadowSize: 256,
    treeRows: 1,
    decorationStep: 16,
    ambientScale: 0.38,
    particleScale: 0.24,
    motionScale: 0.35,
    water: false,
    postEffects: false
  }),
  "2d": Object.freeze({
    id: "2d",
    pixelRatio: 1,
    shadows: false,
    shadowSize: 0,
    treeRows: 0,
    decorationStep: 24,
    ambientScale: 0,
    particleScale: 0,
    motionScale: 0,
    water: false,
    postEffects: false
  })
});

const STILL_TIER = Object.freeze({ ...QUEST_QUALITY_TIERS.low, motionScale: 0 });
const STILL_PIXEL_TIER = Object.freeze({ ...QUEST_QUALITY_TIERS.pixel, motionScale: 0 });

const QUEST_TIER_FALLBACK = Object.freeze({
  pixel: "2d",
  rich: "balanced",
  balanced: "low",
  low: "2d",
  "2d": null
});

const QUEST_FRAME_POLICY = Object.freeze({
  pixel: Object.freeze({ averageLimit: 30, longFrameLimit: 0.3, minimumFrames: 180 }),
  rich: Object.freeze({ averageLimit: 23, longFrameLimit: 0.22, minimumFrames: 150 }),
  balanced: Object.freeze({ averageLimit: 30, longFrameLimit: 0.3, minimumFrames: 150 }),
  low: Object.freeze({ averageLimit: 42, longFrameLimit: 0.42, minimumFrames: 180 })
});

const FRAME_REPORT_WINDOW = 600;
const FRAME_WARMUP = 45;
const SEVERE_FRAME_MS = 90;
const SEVERE_FRAME_STREAK = 8;

export function normalizeQuestSettings(raw = {}) {
  const requested = String(raw?.displayMode || "auto");
  // A child who was parked on "Rich 3D" by the old settings panel comes back
  // to the pixel game, not to a renderer they can no longer choose or leave.
  const displayMode = RETIRED_DISPLAY_MODES.includes(requested)
    ? "auto"
    : QUEST_DISPLAY_MODES.some(mode => mode.id === requested) ? requested : "auto";
  return {
    displayMode,
    reducedMotion: Boolean(raw?.reducedMotion),
    highContrast: Boolean(raw?.highContrast),
    ...normalizeAudioPreferences(raw)
  };
}

export function resolveQuestQuality({
  displayMode = "auto",
  deviceMemory = 8,
  hardwareConcurrency = 8,
  width = 1280,
  saveData = false,
  reducedMotion = false,
  webglAvailable = true
} = {}) {
  // The authored pixel world is the flagship experience. Automatic mode keeps
  // that art direction consistent across ordinary home and school devices. A
  // data-saving connection or a genuinely minimal one-core/1 GB device enters
  // the complete 2D trail before paying for Phaser and chapter art. An explicit
  // Pixel adventure choice remains an override.
  if (displayMode === "pixel") return reducedMotion ? STILL_PIXEL_TIER : QUEST_QUALITY_TIERS.pixel;
  const memory = Number(deviceMemory) || 4;
  const cores = Number(hardwareConcurrency) || 4;
  if (displayMode === "auto") {
    if (saveData || memory <= 1 || cores <= 1) return QUEST_QUALITY_TIERS["2d"];
    return reducedMotion ? STILL_PIXEL_TIER : QUEST_QUALITY_TIERS.pixel;
  }
  if (!webglAvailable || displayMode === "2d") return QUEST_QUALITY_TIERS["2d"];
  if (reducedMotion) {
    // The OS asked for less motion; lowering the TIER was never the same as
    // honouring that. This variant keeps the low tier's cheap rendering and
    // freezes the decorative clock entirely (QuestHub's ambient loop reads
    // motionScale). Gameplay reveals and the camera still work.
    return STILL_TIER;
  }
  if (QUEST_QUALITY_TIERS[displayMode]) return QUEST_QUALITY_TIERS[displayMode];
  if (saveData || memory <= 2 || cores <= 2) return QUEST_QUALITY_TIERS.low;
  if (memory <= 4 || cores <= 4 || Number(width) < 760) return QUEST_QUALITY_TIERS.balanced;
  return QUEST_QUALITY_TIERS.rich;
}

// One real WebGL probe per page load. resolveQuestQuality has always taken a
// webglAvailable flag with a fallback to the 2D trail — but nothing ever
// PROBED, so a device with broken WebGL picked a 3D tier and crashed into
// the renderer instead of walking the complete 2D trail.
let webglProbeResult = null;
function probeWebglAvailable(browser) {
  if (webglProbeResult !== null) return webglProbeResult;
  try {
    const canvas = browser?.document?.createElement?.("canvas");
    if (!canvas) return true; // non-DOM environment (tests): assume capable
    webglProbeResult = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    webglProbeResult = false;
  }
  return webglProbeResult;
}

export function detectQuestQuality(settings = {}, browser = globalThis) {
  const normalized = normalizeQuestSettings(settings);
  const navigatorValue = browser?.navigator || {};
  const reducedMotion = normalized.reducedMotion
    || Boolean(browser?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  return resolveQuestQuality({
    displayMode: normalized.displayMode,
    deviceMemory: navigatorValue.deviceMemory,
    hardwareConcurrency: navigatorValue.hardwareConcurrency,
    width: browser?.innerWidth,
    saveData: Boolean(navigatorValue.connection?.saveData),
    reducedMotion,
    webglAvailable: probeWebglAvailable(browser)
  });
}

export function createQuestFrameBudgetState(tierId = "rich") {
  return {
    tierId: QUEST_QUALITY_TIERS[tierId] ? tierId : "rich",
    warmupFrames: 0,
    decisionFrames: 0,
    decisionFrameMs: 0,
    decisionLongFrames: 0,
    reportFrames: 0,
    reportFrameMs: 0,
    reportLongFrames: 0,
    severeFrameStreak: 0
  };
}

function frameSignal(state, type, extra = {}) {
  return {
    type,
    tierId: state.tierId,
    sampledFrames: state.reportFrames,
    frameMsTotal: Math.round(state.reportFrameMs * 100) / 100,
    longFrames: state.reportLongFrames,
    averageFrameMs: state.reportFrames
      ? Math.round((state.reportFrameMs / state.reportFrames) * 100) / 100
      : 0,
    ...extra
  };
}

// Samples real rendered-frame intervals rather than relying on hardware labels.
// The warmup ignores scene compilation, and a whole sustained window must miss
// budget before quality changes. One hitch can never throw a child into 2D.
export function sampleQuestFrameBudget(previous, frameMs) {
  // This runs once per rendered frame. The budget is dedicated mutable runtime
  // state, so preserve its identity and return null on ordinary frames instead
  // of allocating and collecting a result wrapper 60 times a second. Signal
  // windows return the existing envelope; a quality change also carries a fresh,
  // reset budget for the newly selected tier below.
  const state = previous || createQuestFrameBudgetState();
  const duration = Number(frameMs);
  if (!Number.isFinite(duration) || duration < 4 || duration > 2000 || state.tierId === "2d") {
    return null;
  }
  const observedDuration = Math.min(250, duration);
  const longFrame = observedDuration >= 34 ? 1 : 0;
  state.severeFrameStreak = observedDuration >= SEVERE_FRAME_MS ? state.severeFrameStreak + 1 : 0;
  if (state.warmupFrames < FRAME_WARMUP) {
    state.warmupFrames += 1;
    if (state.severeFrameStreak < SEVERE_FRAME_STREAK) return null;
  }

  state.decisionFrames += 1;
  state.decisionFrameMs += observedDuration;
  state.decisionLongFrames += longFrame;
  state.reportFrames += 1;
  state.reportFrameMs += observedDuration;
  state.reportLongFrames += longFrame;

  if (state.severeFrameStreak >= SEVERE_FRAME_STREAK) {
    const toTier = QUEST_TIER_FALLBACK[state.tierId];
    const signal = frameSignal(state, "quality-change", {
      fromTier: state.tierId,
      toTier,
      reason: "sustained-severe-frames"
    });
    return { state: createQuestFrameBudgetState(toTier), signal };
  }

  const policy = QUEST_FRAME_POLICY[state.tierId];
  if (policy && state.decisionFrames >= policy.minimumFrames) {
    const average = state.decisionFrameMs / state.decisionFrames;
    const longRatio = state.decisionLongFrames / state.decisionFrames;
    if (average > policy.averageLimit && longRatio > policy.longFrameLimit) {
      const toTier = QUEST_TIER_FALLBACK[state.tierId];
      const signal = frameSignal(state, "quality-change", {
        fromTier: state.tierId,
        toTier
      });
      return { state: createQuestFrameBudgetState(toTier), signal };
    }
    state.decisionFrames = 0;
    state.decisionFrameMs = 0;
    state.decisionLongFrames = 0;
  }

  if (state.reportFrames >= FRAME_REPORT_WINDOW) {
    const signal = frameSignal(state, "frame-window");
    state.reportFrames = 0;
    state.reportFrameMs = 0;
    state.reportLongFrames = 0;
    return { state, signal };
  }
  return null;
}
