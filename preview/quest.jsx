// SOUND SEEKERS — THE PREVIEW HARNESS. Dev only; never bundled into the app.
//
// WHY THIS EXISTS, stated plainly so nobody deletes it:
//
// Sound Seekers lives behind a student login. That made it un-look-at-able
// without a real account, which meant every layout number in the quest — the
// ground line, the prop offsets, the panel sizes — got written by someone who
// had never seen the thing render. That is not a style of working. That is
// guessing, and it produced a game the owner called terrible, twice, correctly.
//
// This page mounts the REAL QuestRoot, with the REAL components and the REAL
// stylesheets, against a synthetic save file — no login, no Supabase, no App.jsx.
// Combined with tools/shootQuest.mjs it turns "I think it looks right" into a
// folder of PNGs somebody can actually open.
//
// The save file is built by the SAME pure functions the game uses (baseQuestState
// -> recordQuestAttempt -> recordStopResult), so what you see is a state the game
// could really have produced. A hand-written fake save would let the harness show
// a screen the game can never reach, which is worse than no harness at all.
//
//   /preview/quest.html?view=map
//   /preview/quest.html?view=world&stop=s01
//   /preview/quest.html?view=world&stop=s12&done=11
//   /preview/quest.html?view=world&stop=s5&done=4&checkpoint=gate&display=2d
//   /preview/quest.html?view=ceremony&stop=s5&done=5
//   /preview/quest.html?view=creator
//   /preview/quest.html?view=post&done=20

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// The same global layers main.jsx loads, in the same order. Order matters: the
// child-facing layers deliberately win the cascade. Load a different set here and
// the harness would be showing you colours the app never uses.
import "../src/index.css";
import "../src/styles/student-vibrant.css";
import "../src/styles/comic-theme.css";
import "../src/styles/hollow.css";

import QuestRoot from "../src/components/quest/QuestRoot.jsx";
import { localProgressStorageKey } from "../src/utils/progressKeys.js";
import {
  baseQuestState,
  normalizeQuestState,
  recordPurchaseAndEquip,
  recordQuestAttempt,
  recordStopResult,
  saveQuestCheckpoint
} from "../src/utils/questProgress.js";
import { QUEST_STOPS, targetsAtStop } from "../src/data/questSequence.js";
import { buildTrailSection, routePointAt } from "../src/utils/questHub.js";
import { buildPhysicalTask } from "../src/utils/questPhysicalMechanics.js";
import { correctionKey, CORRECTION_MODES } from "../src/utils/questCorrection.js";
import { targetsForStop } from "../src/utils/questReviewScheduler.js";
import { beginQuestSession } from "../src/utils/questTelemetry.js";
import { configureProgressSync } from "../src/utils/progressSync.js";
import { registerOfflineShell } from "../src/utils/offlineShell.js";
import { createQuestDeviceRecorder } from "../src/utils/questDeviceAcceptance.js";
import {
  createPixelBeastieSheet,
  PIXEL_BEASTIE_ACTION_POSES,
  PIXEL_BEASTIE_DIRECTIONS,
  PIXEL_BEASTIE_FRAME,
  PIXEL_BEASTIE_FRAMES_PER_DIRECTION
} from "../src/components/quest/world/questPixelAvatar.js";
import { defaultCreature, getPiece } from "../src/data/creatureParts.js";

const params = new URLSearchParams(window.location.search);
const view = params.get("view") || "den";
const stopId = params.get("stop") || "s1";
const done = Number(params.get("done") || 0);
const requestedSparkBalance = Number(params.get("sparks"));
const checkpointMode = params.get("checkpoint");
const activeIndex = params.has("active") ? Number(params.get("active")) : null;
const requestedBeatIndex = params.has("beat") ? Number(params.get("beat")) : 0;
const requestedStageIndex = params.has("stage") ? Number(params.get("stage")) : 0;
const correctionMode = params.get("correction");
const creatureMode = params.get("creature");
const displayMode = params.get("display");
const previewLegacyRenderer = params.get("renderer") === "legacy3d";
const reducedMotion = params.get("motion") === "reduce";
const highContrast = params.get("contrast") === "high";
const quietSoundscape = params.get("quiet") === "1";
const soundEnabled = params.get("sound") === "1";
const disableAdaptiveQuality = params.get("adapt") === "0";
const resumeExisting = params.get("resume") === "1";
const syncEnabled = params.get("sync") === "1";
const soakMode = params.get("soak");
const SCOPE = "preview";

if (import.meta.env.PROD) void registerOfflineShell();

if (syncEnabled) {
  configureProgressSync({ studentId: SCOPE, mode: "student", token: "preview-browser-token" });
}

function renderBeastieAtlas(rootElement) {
  const creature = {
    ...defaultCreature(),
    equipped: {
      head: "leaf-cap",
      back: "moth-wings",
      neck: "vine-scarf",
      held: "stone-staff"
    }
  };
  const sheet = createPixelBeastieSheet(creature);
  sheet.id = "beastie-action-atlas";
  sheet.setAttribute("aria-label", "Custom Beastie movement and action atlas");
  sheet.dataset.frameSize = String(PIXEL_BEASTIE_FRAME);
  sheet.dataset.framesPerDirection = String(PIXEL_BEASTIE_FRAMES_PER_DIRECTION);
  sheet.dataset.directions = JSON.stringify(PIXEL_BEASTIE_DIRECTIONS);
  sheet.dataset.actions = JSON.stringify(PIXEL_BEASTIE_ACTION_POSES);
  sheet.style.cssText = "display:block;width:1024px;height:256px;image-rendering:pixelated;max-width:100%;";

  const proof = document.createElement("main");
  proof.className = "beastie-atlas-proof";
  proof.style.cssText = "box-sizing:border-box;display:grid;gap:16px;justify-items:center;min-height:100vh;padding:34px 24px;background:#171622;color:#fffdf2;font-family:Inter,sans-serif;overflow:auto;";
  const heading = document.createElement("h1");
  heading.textContent = "Custom Beastie action atlas";
  heading.style.cssText = "align-self:end;margin:0;font:700 22px/1.2 Lexend,sans-serif;letter-spacing:0;";
  const legend = document.createElement("p");
  legend.textContent = `Walk x4 · ${PIXEL_BEASTIE_ACTION_POSES.join(" · ")}`;
  legend.style.cssText = "align-self:start;margin:0;max-width:1024px;color:#d9d3eb;font:600 13px/1.5 Inter,sans-serif;text-align:center;";
  proof.append(heading, sheet, legend);
  rootElement.replaceChildren(proof);
  window.__questReady = true;
}

// FAIL LOUDLY ON A BAD STOP ID.
//
// This cost an hour. The ids are `s1`…`s40`, not `s01`, and asking for a stop
// that doesn't exist makes QuestHub return null — so the screen renders
// COMPLETELY BLANK, with no error, no warning, nothing in the console. Which
// looks exactly like a broken 3D renderer, and sends you off "fixing" a world
// that was never broken.
//
// A tool whose failure mode is silence is worse than no tool. If the id is
// wrong, say so, in the page, in words.
const KNOWN = QUEST_STOPS.map(s => s.id);
if (view === "world" && !KNOWN.includes(stopId)) {
  document.getElementById("root").innerHTML = `
    <div style="font:16px/1.6 system-ui;color:#fff;padding:40px;max-width:760px">
      <h1 style="color:#ff6b6b">Unknown stop: "${stopId}"</h1>
      <p>Nothing rendered because <code>getStop("${stopId}")</code> is undefined, so
         <code>QuestHub</code> returns null. That is why the screen is blank — the world is fine.</p>
      <p><strong>Valid ids are not zero-padded:</strong></p>
      <p style="font-family:ui-monospace,monospace;color:#9ae6b4">${KNOWN.join("  ")}</p>
    </div>`;
  throw new Error(`preview/quest.jsx: unknown stop "${stopId}". Ids are s1…s40, not zero-padded.`);
}

// Build a save the game could really have produced: walk `done` stops, answering
// most things right, so mastery, stones, sparks and gear are all internally
// consistent with each other.
function seedState() {
  let state = { ...baseQuestState(), hatched: true };
  if (["auto", "pixel", "rich", "balanced", "low", "2d"].includes(displayMode)) {
    state = { ...state, settings: { ...state.settings, displayMode } };
  }
  if (reducedMotion || highContrast || quietSoundscape) {
    state = {
      ...state,
      settings: { ...state.settings, reducedMotion, highContrast, quietSoundscape }
    };
  }
  let n = 0;
  for (const stop of QUEST_STOPS) {
    if (n >= done) break;
    for (const target of targetsAtStop(stop.id)) {
      for (let i = 0; i < 4; i += 1) {
        state = recordQuestAttempt(state, {
          target,
          correct: i % 5 !== 4,
          shell: i % 2 ? "flower-patch" : "hungry-beast",
          stopIndex: stop.index,
          at: `2026-0${1 + (i % 9)}-1${i % 9}T10:00:00Z`
        });
      }
    }
    state = recordStopResult(state, stop.id, 3, 12);
    n += 1;
  }
  if (requestedSparkBalance === 8) {
    // A real reachable economy state for the locked-item release fixture:
    // 1 star + 8 trail drops = 28 Sparks; buying a 20-Spark piece leaves 8.
    state = recordStopResult({ ...baseQuestState(), hatched: true }, "s1", 1, 8);
    state = recordPurchaseAndEquip(state, getPiece("pebble"), "2026-07-24T08:00:00.000Z");
  }
  if (creatureMode === "showcase") {
    state = {
      ...state,
      creature: {
        body: "moth",
        dye: "plum",
        pattern: "pattern-spots",
        eyes: "eyes-three",
        mouth: "mouth-beak",
        crest: "crest-antenna",
        tail: "tail-fan",
        feet: "feet-webbed",
        equipped: { head: "leaf-cap", back: "moth-wings", neck: "vine-scarf", held: "stone-staff" }
      }
    };
  }
  return normalizeQuestState(state);
}

function withPreviewCheckpoint(state) {
  if (view !== "world" || (!checkpointMode && activeIndex === null)) return state;
  const stop = QUEST_STOPS.find(candidate => candidate.id === stopId);
  const targets = targetsForStop(targetsAtStop(stopId), state.mastery, stop?.index || 1);
  const seed = (stop?.index || 1) * 1000 + (state.trail.stopsDone.length || 0);
  const section = buildTrailSection(stopId, { mastery: state.mastery, targets, seed });
  if (!section) return state;

  const requestedEncounter = Number.isInteger(activeIndex)
    ? section.encounters[Math.max(0, Math.min(section.encounters.length - 1, activeIndex))]
    : null;
  const beatIndex = requestedEncounter
    ? Math.max(0, Math.min(requestedEncounter.beats.length - 1, requestedBeatIndex || 0))
    : 0;
  const requestedTask = requestedEncounter
    ? buildPhysicalTask(section, requestedEncounter, requestedEncounter.beats[beatIndex], beatIndex)
    : null;
  const fieldStage = requestedTask
    ? Math.max(0, Math.min(requestedTask.stages.length - 1, requestedStageIndex || 0))
    : 0;
  const turnProgress = 0.4;
  const solved = checkpointMode === "gate"
    ? section.encounters.map(encounter => encounter.id)
    : checkpointMode === "turn"
      ? section.encounters.filter(encounter => encounter.progress < turnProgress).map(encounter => encounter.id)
      : section.encounters.slice(0, requestedEncounter?.order || 0).map(encounter => encounter.id);
  const position = checkpointMode === "gate"
    ? routePointAt(section.route, section.gate.progress - 0.018)
    : checkpointMode === "turn"
      ? routePointAt(section.route, turnProgress)
      : routePointAt(section.route, (requestedEncounter?.progress || section.guide.progress) - 0.01);
  const allowedCorrectionModes = new Set(Object.values(CORRECTION_MODES));
  const previewCorrection = requestedEncounter && allowedCorrectionModes.has(correctionMode)
    ? {
      [correctionKey(requestedEncounter, beatIndex, fieldStage)]: {
        mode: correctionMode,
        misses: correctionMode === CORRECTION_MODES.RETRY
          ? 1
          : correctionMode === CORRECTION_MODES.NARROW
            ? 2
            : correctionMode === CORRECTION_MODES.DISCOVER ? 0 : 3,
        lastWrongId: `${requestedEncounter.id}-b0-s0-f`
      }
    }
    : {};

  return saveQuestCheckpoint(state, {
    stopId,
    phase: checkpointMode === "gate" ? "gate" : "trail",
    position,
    guideDone: true,
    meetIndex: 0,
    activeId: requestedEncounter?.id || null,
    beatIndex,
    fieldStage,
    corrections: previewCorrection,
    reviewQueue: correctionMode === CORRECTION_MODES.GUIDED ? [0] : [],
    reviewedBeats: [],
    remediationBeat: null,
    solved,
    drops: [],
    tally: { correct: solved.length, total: solved.length, mistakes: 0 }
  });
}

const checkpointed = withPreviewCheckpoint(seedState());
const seeded = view === "world"
  ? beginQuestSession(checkpointed, {
    id: "preview-browser-session",
    at: "2026-07-18T08:00:00.000Z",
    qualityTier: displayMode || "auto",
    stopId
  })
  : checkpointed;
const previewStorageKey = localProgressStorageKey("phonics_quest", SCOPE);
if (!resumeExisting || !window.localStorage.getItem(previewStorageKey)) {
  window.localStorage.setItem(previewStorageKey, JSON.stringify(seeded));
}

// The shot script waits on this instead of a fixed sleep — a timing guess is how
// you end up screenshotting a half-painted frame and "fixing" a bug that is
// really just a slow font.
window.__questReady = false;
requestAnimationFrame(() => requestAnimationFrame(() => { window.__questReady = true; }));

// Sound off: a headless browser has no audio device, and an autoplay rejection
// would show up as a console error and mask a real one. Keep root ownership on
// the live mount element: it survives a module refresh, but a full page reload
// gets a new element and therefore cannot inherit a root bound to the old DOM.
const rootElement = document.getElementById("root");
if (view === "beastie-atlas") {
  renderBeastieAtlas(rootElement);
} else {
  const root = rootElement.__questReactRoot || createRoot(rootElement);
  rootElement.__questReactRoot = root;
  root.render(
    <StrictMode>
      <QuestRoot
        progressScopeKey={SCOPE}
        isSoundEnabled={soundEnabled}
        initialView={view}
        initialStop={stopId}
        disableAdaptiveQuality={disableAdaptiveQuality}
        previewForce2d={displayMode === "2d"}
        previewForceLegacy3d={previewLegacyRenderer}
        onExit={() => { window.__questExited = true; }}
      />
    </StrictMode>
  );
}

function waitForQuestSurface(timeoutMs = 25_000) {
  const startedAt = performance.now();
  return new Promise((resolve, reject) => {
    const inspect = () => {
      if (document.querySelector(".qp-root[data-ready='true'], .q2d-root, .qh-root[data-ready='true']")) {
        resolve();
        return;
      }
      if (performance.now() - startedAt >= timeoutMs) {
        reject(new Error("The quest soak recorder could not find a ready game surface"));
        return;
      }
      requestAnimationFrame(inspect);
    };
    inspect();
  });
}

function downloadQuestEvidence(evidence) {
  const blob = new Blob([`${JSON.stringify(evidence, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sound-seekers-${evidence.profileId}-${evidence.startedAt.slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function installQuestDeviceRecorder() {
  await waitForQuestSurface();
  const readState = () => {
    try { return JSON.parse(localStorage.getItem(previewStorageKey) || "null") || {}; } catch { return {}; }
  };
  const recorder = createQuestDeviceRecorder({
    profileId: params.get("profile") || "local-smoke",
    runMode: soakMode === "release" ? "release" : "smoke",
    physicalDevice: params.get("physical") === "1",
    operator: params.get("operator") || "",
    device: {
      model: params.get("model") || "",
      os: params.get("os") || "",
      browser: params.get("browser") || "",
      assistiveTechnology: params.get("at") || ""
    },
    readState
  });
  window.__questDeviceRecorder = recorder;
  window.__questDeviceFinish = async () => {
    const evidence = await recorder.stop();
    localStorage.setItem("lp-quest-device-evidence-latest", JSON.stringify(evidence));
    return evidence;
  };

  const panel = document.createElement("aside");
  panel.setAttribute("aria-label", "Device acceptance recorder");
  panel.style.cssText = "position:fixed;right:10px;bottom:10px;z-index:10000;display:flex;align-items:center;gap:8px;padding:8px;background:#10211f;color:#fff;border:2px solid #fff;font:700 12px/1.2 system-ui;";
  const status = document.createElement("span");
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "End and save test";
  button.style.cssText = "min-height:44px;padding:8px 12px;border:0;background:#f4c95d;color:#17211f;font:700 12px/1 system-ui;cursor:pointer;";
  const updateStatus = () => {
    const seconds = Math.round(recorder.snapshot().durationMs / 1000);
    status.textContent = `Device test ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  };
  updateStatus();
  const statusTimer = window.setInterval(updateStatus, 1000);
  button.addEventListener("click", async () => {
    button.disabled = true;
    window.clearInterval(statusTimer);
    const evidence = await window.__questDeviceFinish();
    status.textContent = evidence.evaluation.status === "pass" ? "Test passed" : "Test needs review";
    downloadQuestEvidence(evidence);
  });
  panel.append(status, button);
  document.body.append(panel);
  return recorder;
}

if (soakMode) {
  window.__questDeviceRecorderReady = installQuestDeviceRecorder().catch(error => {
    window.__questDeviceRecorderError = String(error?.message || error);
    throw error;
  });
}
