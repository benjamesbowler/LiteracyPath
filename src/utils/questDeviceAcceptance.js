import { questTelemetryTotals } from "./questTelemetry.js";

export const QUEST_DEVICE_EVIDENCE_VERSION = 1;
export const QUEST_DEVICE_RELEASE_PROFILES = Object.freeze([
  "ipad",
  "chromebook",
  "android-tablet",
  "voiceover",
  "nvda",
  "switch"
]);

const PROFILE_POLICY = Object.freeze({
  "local-smoke": Object.freeze({ mode: "pixel", minDurationMs: 20_000, minSamples: 4, minHealthSamples: 2, minFrames: 600, maxAverageFrameMs: 45, maxLongFrameRate: 0.5, minInputEvents: 3, maxInputP95Ms: 150, minStopsAdvanced: 1, allowCheckpointProgress: true }),
  ipad: Object.freeze({ mode: "pixel", minDurationMs: 1_200_000, minSamples: 100, minHealthSamples: 100, minFrames: 20_000, maxAverageFrameMs: 33.4, maxLongFrameRate: 0.25, minInputEvents: 10, maxInputP95Ms: 100, minStopsAdvanced: 1 }),
  chromebook: Object.freeze({ mode: "pixel", minDurationMs: 1_200_000, minSamples: 100, minHealthSamples: 100, minFrames: 20_000, maxAverageFrameMs: 33.4, maxLongFrameRate: 0.25, minInputEvents: 10, maxInputP95Ms: 100, minStopsAdvanced: 1 }),
  "android-tablet": Object.freeze({ mode: "pixel", minDurationMs: 1_200_000, minSamples: 100, minHealthSamples: 100, minFrames: 20_000, maxAverageFrameMs: 33.4, maxLongFrameRate: 0.25, minInputEvents: 10, maxInputP95Ms: 100, minStopsAdvanced: 1 }),
  voiceover: Object.freeze({ mode: "2d", minDurationMs: 1_200_000, minSamples: 100, minHealthSamples: 0, minFrames: 0, minInputEvents: 10, maxInputP95Ms: 150, assistiveTechnology: "VoiceOver", minStopsAdvanced: 1 }),
  nvda: Object.freeze({ mode: "2d", minDurationMs: 1_200_000, minSamples: 100, minHealthSamples: 0, minFrames: 0, minInputEvents: 10, maxInputP95Ms: 150, assistiveTechnology: "NVDA", minStopsAdvanced: 1 }),
  switch: Object.freeze({ mode: "2d", minDurationMs: 1_200_000, minSamples: 100, minHealthSamples: 0, minFrames: 0, minInputEvents: 10, maxInputP95Ms: 180, assistiveTechnology: "Switch", minStopsAdvanced: 1 })
});

const SAFARI_RESOURCE_LIMITS = Object.freeze({
  peakDisplayObjects: 900,
  peakTextures: 180,
  peakTweens: 120,
  peakActiveChoices: 12
});

// High-water marks can stay under an absolute ceiling while climbing at every
// sample — the signature of a slow leak. A healthy 20-minute run may grow while
// warming chapters, but its latter half must settle within these allowances.
const SAFARI_LATE_GROWTH_ALLOWANCE = Object.freeze({
  peakDisplayObjects: 120,
  peakTextures: 24,
  peakTweens: 20,
  peakActiveChoices: 3
});

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function percentile(values, ratio) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1))];
}

function progressSnapshot(state = {}) {
  const done = Array.isArray(state?.trail?.stopsDone) ? state.trail.stopsDone : [];
  const checkpoint = state?.checkpoint || null;
  return {
    stopsDone: done.length,
    routeCursor: finite(state?.trail?.routeCursor),
    checkpoint: checkpoint ? {
      stopId: checkpoint.stopId || null,
      phase: checkpoint.phase || null,
      activeId: checkpoint.activeId || null,
      beatIndex: finite(checkpoint.beatIndex),
      fieldStage: finite(checkpoint.fieldStage)
    } : null
  };
}

function currentSurface(browser) {
  const documentValue = browser?.document;
  if (!documentValue) return "unknown";
  if (documentValue.querySelector(".q2d-root")) return "2d";
  if (documentValue.querySelector(".qp-root[data-ready='true']")) return "pixel";
  if (documentValue.querySelector(".qh-root[data-ready='true']")) return "3d";
  return "unknown";
}

export function captureQuestDeviceSample(state, browser = globalThis, at = new Date().toISOString()) {
  const documentValue = browser?.document;
  return {
    at,
    surface: currentSurface(browser),
    online: browser?.navigator?.onLine !== false,
    visibility: documentValue?.visibilityState || "unknown",
    domNodes: documentValue?.getElementsByTagName?.("*")?.length || 0,
    canvases: documentValue?.querySelectorAll?.("canvas")?.length || 0,
    heapUsedBytes: finite(browser?.performance?.memory?.usedJSHeapSize),
    progress: progressSnapshot(state),
    runtime: questTelemetryTotals(state?.telemetry)
  };
}

function evidenceChecks(evidence) {
  const policy = PROFILE_POLICY[evidence.profileId] || PROFILE_POLICY["local-smoke"];
  const telemetry = evidence.telemetry || {};
  const samples = Array.isArray(evidence.samples) ? evidence.samples : [];
  const heap = samples.map(sample => finite(sample.heapUsedBytes)).filter(Boolean);
  const firstHeap = heap[0] || 0;
  const heapGrowth = heap.length > 1 ? heap.at(-1) - firstHeap : 0;
  const heapAllowance = Math.max(64 * 1024 * 1024, firstHeap * 0.5);
  const resourceSampleEntries = samples
    .map((sample, index) => ({ index, runtime: sample?.runtime }))
    .filter(({ runtime }) => runtime && Object.keys(SAFARI_RESOURCE_LIMITS).some(key => finite(runtime[key]) > 0));
  const resourceSamples = resourceSampleEntries.map(({ runtime }) => runtime);
  const resourcePeaks = Object.fromEntries(Object.keys(SAFARI_RESOURCE_LIMITS).map(key => [
    key,
    Math.max(0, ...resourceSamples.map(runtime => finite(runtime[key])))
  ]));
  const resourceGrowth = Object.fromEntries(Object.keys(SAFARI_RESOURCE_LIMITS).map(key => {
    const series = resourceSamples.map(runtime => finite(runtime[key]));
    const late = series.slice(Math.floor(series.length / 2));
    const lateGrowth = late.length > 1 ? late.at(-1) - late[0] : 0;
    const increasingSteps = late.slice(1).filter((value, index) => value > late[index]).length;
    const increaseRate = late.length > 1 ? increasingSteps / (late.length - 1) : 0;
    return [key, {
      lateGrowth,
      increaseRate,
      sustained: late.length >= 10
        && lateGrowth > SAFARI_LATE_GROWTH_ALLOWANCE[key]
        && increaseRate >= 0.25
    }];
  }));
  const sustainedResourceGrowth = Object.entries(resourceGrowth)
    .filter(([, growth]) => growth.sustained)
    .map(([key]) => key);
  // Safari has no performance.memory. Its resource proxy is release evidence
  // only when it spans the same health-sample window the profile requires. Two
  // early samples cannot prove that a 20-minute run settled in its latter half.
  const requiredResourceSamples = Math.max(2, policy.minHealthSamples);
  const lateWindowStart = Math.floor(samples.length / 2);
  const lateResourceSamples = resourceSampleEntries.filter(({ index }) => index >= lateWindowStart).length;
  const requiredLateResourceSamples = Math.max(1, Math.ceil(requiredResourceSamples / 2));
  const resourceProxyAvailable = resourceSamples.length >= requiredResourceSamples
    && lateResourceSamples >= requiredLateResourceSamples;
  const resourceProxyPass = resourceProxyAvailable
    && Object.entries(SAFARI_RESOURCE_LIMITS).every(([key, limit]) => resourcePeaks[key] <= limit)
    && sustainedResourceGrowth.length === 0;
  const heapPass = heap.length > 1
    ? heapGrowth <= heapAllowance
    : resourceProxyPass;
  const surfaces = new Set(samples.map(sample => sample.surface));
  // Suspense loads legitimately sample as "unknown" for a moment — a
  // 20-minute release run must not fail on one mid-load sample. Tolerate
  // transient unknowns up to 10%; a run that is MOSTLY unknown still fails.
  const unknownCount = samples.filter(sample => sample.surface === "unknown").length;
  const unknownTolerable = samples.length > 0 && unknownCount / samples.length <= 0.1;
  const inputP95Ms = finite(evidence.input?.p95Ms);
  const release = evidence.runMode === "release";
  const initialStops = finite(evidence.initialProgress?.stopsDone);
  const finalStops = finite(evidence.finalProgress?.stopsDone);
  const stopDelta = finalStops - initialStops;
  const initialCheckpoint = evidence.initialProgress?.checkpoint;
  const finalCheckpoint = evidence.finalProgress?.checkpoint;
  const phaseRank = phase => ({ teach: 0, trail: 1, gate: 2 }[phase] ?? -1);
  const checkpointAdvanced = Boolean(finalCheckpoint && (
    !initialCheckpoint
    || finalCheckpoint.stopId !== initialCheckpoint.stopId
    || finite(finalCheckpoint.beatIndex) > finite(initialCheckpoint.beatIndex)
    || finite(finalCheckpoint.fieldStage) > finite(initialCheckpoint.fieldStage)
    || phaseRank(finalCheckpoint.phase) > phaseRank(initialCheckpoint.phase)
  ));
  const progressPass = stopDelta >= policy.minStopsAdvanced
    || Boolean(policy.allowCheckpointProgress && checkpointAdvanced);
  const checks = [
    { id: "schema", pass: evidence.schemaVersion === QUEST_DEVICE_EVIDENCE_VERSION, detail: `schema ${evidence.schemaVersion || "missing"}` },
    { id: "profile", pass: Boolean(PROFILE_POLICY[evidence.profileId]), detail: evidence.profileId || "missing profile" },
    { id: "duration", pass: finite(evidence.durationMs) >= policy.minDurationMs, detail: `${Math.round(finite(evidence.durationMs) / 1000)} sec / ${Math.round(policy.minDurationMs / 1000)} sec` },
    { id: "samples", pass: samples.length >= policy.minSamples, detail: `${samples.length} / ${policy.minSamples}` },
    { id: "surface", pass: surfaces.has(policy.mode) && (!surfaces.has("unknown") || unknownTolerable), detail: `${[...surfaces].join(", ") || "none"}${unknownCount ? ` (${unknownCount} transient)` : ""}` },
    { id: "context", pass: finite(telemetry.contextLosses) === 0, detail: `${finite(telemetry.contextLosses)} context losses` },
    { id: "shell", pass: finite(telemetry.offlineShellErrors) === 0 && finite(telemetry.offlineWarmupFailures) === 0, detail: `${finite(telemetry.offlineShellErrors)} shell errors, ${finite(telemetry.offlineWarmupFailures)} warm failures` },
    { id: "dom", pass: samples.every(sample => finite(sample.canvases) <= 1 && finite(sample.domNodes) <= 2500), detail: `${Math.max(0, ...samples.map(sample => finite(sample.domNodes)))} nodes, ${Math.max(0, ...samples.map(sample => finite(sample.canvases)))} canvases` },
    {
      id: "heap",
      pass: policy.mode !== "pixel" || heapPass,
      detail: heap.length > 1
        ? `${Math.round(heapGrowth / 1048576)} MB growth`
        : resourceProxyAvailable
          ? `Safari proxy: ${resourcePeaks.peakDisplayObjects} objects, ${resourcePeaks.peakTextures} textures, ${resourcePeaks.peakTweens} tweens${sustainedResourceGrowth.length ? `; sustained growth in ${sustainedResourceGrowth.join(", ")}` : "; late samples settled"}`
          : `heap API unavailable; Safari proxy coverage ${resourceSamples.length}/${requiredResourceSamples} samples, ${lateResourceSamples}/${requiredLateResourceSamples} late`
    },
    // stopsDone is the monotone truth; the route cursor legitimately WRAPS
    // 40 -> 1 into the review circuit, so comparing it punished the exact
    // journey the game intends.
    {
      id: "progress",
      pass: progressPass,
      detail: `${initialStops} to ${finalStops} stops${checkpointAdvanced ? "; checkpoint advanced" : ""}; needs +${policy.minStopsAdvanced}${policy.allowCheckpointProgress ? " or checkpoint progress" : ""}`
    },
    { id: "errors", pass: !evidence.errors?.length, detail: `${evidence.errors?.length || 0} uncaught errors` },
    { id: "input", pass: finite(evidence.input?.events) >= policy.minInputEvents && inputP95Ms <= policy.maxInputP95Ms, detail: `${finite(evidence.input?.events)} events, ${Math.round(inputP95Ms)} ms p95` }
  ];

  if (policy.mode === "pixel") {
    checks.push(
      { id: "health", pass: finite(telemetry.healthSamples) >= policy.minHealthSamples, detail: `${finite(telemetry.healthSamples)} / ${policy.minHealthSamples}` },
      { id: "frames", pass: finite(telemetry.sampledFrames) >= policy.minFrames, detail: `${finite(telemetry.sampledFrames)} / ${policy.minFrames}` },
      { id: "frame-time", pass: finite(telemetry.averageFrameMs) <= policy.maxAverageFrameMs, detail: `${finite(telemetry.averageFrameMs).toFixed(1)} ms average` },
      { id: "long-frames", pass: finite(telemetry.longFrameRate) <= policy.maxLongFrameRate, detail: `${(finite(telemetry.longFrameRate) * 100).toFixed(1)}%` },
      { id: "fallback", pass: finite(telemetry.fallbackSessions) === 0, detail: `${finite(telemetry.fallbackSessions)} fallbacks` }
    );
  }

  if (release) {
    checks.push(
      { id: "physical", pass: evidence.physicalDevice === true, detail: evidence.physicalDevice ? "physical device" : "emulated device" },
      { id: "operator", pass: Boolean(evidence.operator && evidence.device?.model && evidence.device?.os && evidence.device?.browser), detail: evidence.operator ? `operator ${evidence.operator}` : "missing operator/device identity" },
      { id: "network-cycle", pass: finite(telemetry.networkInterruptions) >= 1 && finite(telemetry.syncRecoveries) >= 1 && !telemetry.syncPending, detail: `${finite(telemetry.networkInterruptions)} interruptions, ${finite(telemetry.syncRecoveries)} recoveries` }
    );
    if (policy.assistiveTechnology) {
      checks.push({
        id: "assistive-technology",
        pass: String(evidence.device?.assistiveTechnology || "").toLowerCase() === policy.assistiveTechnology.toLowerCase(),
        detail: evidence.device?.assistiveTechnology || "missing"
      });
    }
  }
  return checks;
}

export function evaluateQuestDeviceEvidence(evidence = {}) {
  const checks = evidenceChecks(evidence);
  return {
    status: checks.every(check => check.pass) ? "pass" : "fail",
    checks,
    failures: checks.filter(check => !check.pass).map(check => check.id)
  };
}

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).filter(key => key !== "evidenceHash").sort().map(key => [key, canonicalValue(value[key])]));
}

export function canonicalQuestDeviceEvidence(evidence) {
  return JSON.stringify(canonicalValue(evidence));
}

export async function sealQuestDeviceEvidence(evidence, cryptoValue = globalThis.crypto) {
  const bytes = new TextEncoder().encode(canonicalQuestDeviceEvidence(evidence));
  const digest = await cryptoValue.subtle.digest("SHA-256", bytes);
  const evidenceHash = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
  return { ...evidence, evidenceHash };
}

export function createQuestDeviceRecorder({
  profileId = "local-smoke",
  runMode = "smoke",
  physicalDevice = false,
  operator = "",
  device = {},
  readState,
  browser = globalThis,
  sampleIntervalMs = runMode === "release" ? 10_000 : 5_000,
  now = () => new Date()
} = {}) {
  if (typeof readState !== "function") throw new Error("A quest state reader is required");
  const started = now();
  const samples = [];
  const errors = [];
  const inputLatencies = [];
  let stopped = false;

  const sample = () => {
    if (stopped) return;
    samples.push(captureQuestDeviceSample(readState(), browser, now().toISOString()));
  };
  const recordError = event => errors.push({
    at: now().toISOString(),
    message: String(event?.reason?.message || event?.reason || event?.message || "Unknown browser error")
  });
  const recordInput = () => {
    const began = browser.performance.now();
    browser.requestAnimationFrame(() => inputLatencies.push(Math.max(0, browser.performance.now() - began)));
  };
  browser.addEventListener?.("error", recordError);
  browser.addEventListener?.("unhandledrejection", recordError);
  browser.addEventListener?.("pointerdown", recordInput, true);
  browser.addEventListener?.("keydown", recordInput, true);
  sample();
  const timer = browser.setInterval(sample, sampleIntervalMs);

  const build = ended => {
    const state = readState();
    const input = inputLatencies.slice(-500);
    const evidence = {
      schemaVersion: QUEST_DEVICE_EVIDENCE_VERSION,
      profileId,
      runMode,
      physicalDevice: Boolean(physicalDevice),
      operator: String(operator || ""),
      device: {
        model: String(device.model || ""),
        os: String(device.os || ""),
        browser: String(device.browser || browser.navigator?.userAgent || ""),
        assistiveTechnology: String(device.assistiveTechnology || ""),
        viewport: `${browser.innerWidth || 0}x${browser.innerHeight || 0}`,
        touchPoints: finite(browser.navigator?.maxTouchPoints),
        memoryGb: finite(browser.navigator?.deviceMemory),
        cores: finite(browser.navigator?.hardwareConcurrency)
      },
      startedAt: started.toISOString(),
      endedAt: ended.toISOString(),
      durationMs: Math.max(0, ended.getTime() - started.getTime()),
      initialProgress: samples[0]?.progress || progressSnapshot(state),
      finalProgress: progressSnapshot(state),
      samples: [...samples],
      telemetry: questTelemetryTotals(state?.telemetry),
      input: {
        events: input.length,
        averageMs: input.length ? input.reduce((total, value) => total + value, 0) / input.length : 0,
        p95Ms: percentile(input, 0.95),
        maxMs: input.length ? Math.max(...input) : 0
      },
      errors: [...errors]
    };
    return { ...evidence, evaluation: evaluateQuestDeviceEvidence(evidence) };
  };

  return {
    sample,
    snapshot() {
      return build(now());
    },
    async stop() {
      if (!stopped) {
        stopped = true;
        browser.clearInterval(timer);
        browser.removeEventListener?.("error", recordError);
        browser.removeEventListener?.("unhandledrejection", recordError);
        browser.removeEventListener?.("pointerdown", recordInput, true);
        browser.removeEventListener?.("keydown", recordInput, true);
        samples.push(captureQuestDeviceSample(readState(), browser, now().toISOString()));
      }
      return sealQuestDeviceEvidence(build(now()), browser.crypto);
    }
  };
}
