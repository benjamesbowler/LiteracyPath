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
//   /preview/quest.html?view=den
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
  recordQuestAttempt,
  recordStopResult,
  saveQuestCheckpoint
} from "../src/utils/questProgress.js";
import { QUEST_STOPS, targetsAtStop } from "../src/data/questSequence.js";
import { buildTrailSection, routePointAt } from "../src/utils/questHub.js";
import { buildPhysicalTask } from "../src/utils/questPhysicalMechanics.js";
import { correctionKey, CORRECTION_MODES } from "../src/utils/questCorrection.js";
import { targetsForStop } from "../src/utils/questReviewScheduler.js";

const params = new URLSearchParams(window.location.search);
const view = params.get("view") || "den";
const stopId = params.get("stop") || "s1";
const done = Number(params.get("done") || 0);
const checkpointMode = params.get("checkpoint");
const activeIndex = params.has("active") ? Number(params.get("active")) : null;
const requestedBeatIndex = params.has("beat") ? Number(params.get("beat")) : 0;
const requestedStageIndex = params.has("stage") ? Number(params.get("stage")) : 0;
const correctionMode = params.get("correction");
const creatureMode = params.get("creature");
const displayMode = params.get("display");
const soundEnabled = params.get("sound") === "1";
const SCOPE = "preview";

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
  if (["auto", "rich", "balanced", "low", "2d"].includes(displayMode)) {
    state = { ...state, settings: { ...state.settings, displayMode } };
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
    phase: "trail",
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

const seeded = withPreviewCheckpoint(seedState());
window.localStorage.setItem(localProgressStorageKey("phonics_quest", SCOPE), JSON.stringify(seeded));

// The shot script waits on this instead of a fixed sleep — a timing guess is how
// you end up screenshotting a half-painted frame and "fixing" a bug that is
// really just a slow font.
window.__questReady = false;
requestAnimationFrame(() => requestAnimationFrame(() => { window.__questReady = true; }));

// Sound off: a headless browser has no audio device, and an autoplay rejection
// would show up as a console error and mask a real one.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QuestRoot
      progressScopeKey={SCOPE}
      isSoundEnabled={soundEnabled}
      initialView={view}
      initialStop={stopId}
      onExit={() => { window.__questExited = true; }}
    />
  </StrictMode>
);
