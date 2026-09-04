import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createMissionPlan } from "../../src/features/soundSeekers/engine/createMissionPlan.js";
import {
  createMissionState,
  reduceMission
} from "../../src/features/soundSeekers/engine/missionReducer.js";
import {
  createSoundSeekersState,
  normalizeSoundSeekersState
} from "../../src/features/soundSeekers/engine/stateV2.js";
import { SoundSeekersStage } from "../../src/features/soundSeekers/runtime/SoundSeekersStage.jsx";
import { createSceneViewModel } from "../../src/features/soundSeekers/runtime/sceneViewModel.js";
import { createCharacterAppearance } from "../../src/features/soundSeekers/visual/characterCustomization.js";

const TRACKED_INPUT_EVENTS = new Set([
  "click", "keydown", "lostpointercapture", "pointercancel", "pointerdown", "pointerup",
  "soundseekers:switch"
]);
const nativeAddEventListener = EventTarget.prototype.addEventListener;
const nativeRemoveEventListener = EventTarget.prototype.removeEventListener;
const activeInputListeners = [];
const lifecycle = {
  strictSetups: 0,
  strictCleanups: 0,
  canvasesAdded: 0,
  canvasesRemoved: 0
};

function captureValue(options) {
  return typeof options === "boolean" ? options : options?.capture === true;
}

function trackedTarget(target) {
  return target instanceof Element && (
    target.matches("[data-sound-seekers-stage], [data-ss-phaser-host]")
      || Boolean(target.closest("[data-sound-seekers-stage]"))
  );
}

EventTarget.prototype.addEventListener = function addTrackedListener(type, listener, options) {
  if (TRACKED_INPUT_EVENTS.has(type) && trackedTarget(this)) {
    activeInputListeners.push({
      target: this,
      type,
      listener,
      capture: captureValue(options)
    });
  }
  return nativeAddEventListener.call(this, type, listener, options);
};

EventTarget.prototype.removeEventListener = function removeTrackedListener(type, listener, options) {
  const capture = captureValue(options);
  const index = activeInputListeners.findIndex(record => (
    record.target === this
      && record.type === type
      && record.listener === listener
      && record.capture === capture
  ));
  if (index >= 0) activeInputListeners.splice(index, 1);
  return nativeRemoveEventListener.call(this, type, listener, options);
};

window.__soundSeekersStageErrors = [];
window.addEventListener("error", event => {
  window.__soundSeekersStageErrors.push(event.error?.message || event.message);
});
window.addEventListener("unhandledrejection", event => {
  window.__soundSeekersStageErrors.push(event.reason?.message || String(event.reason));
});
window.__soundSeekersStageInputs = [];
window.__soundSeekersStageAudio = [];
window.__soundSeekersStageChoices = [];
window.__soundSeekersReducerMoves = [];

const appearance = createCharacterAppearance({
  schemaVersion: 1,
  bodyShapeId: "body-shape-sprout",
  paletteTokenId: "player-palette-river",
  accessories: {
    back: "gear-back-field-pack",
    head: "gear-head-leaf-cap",
    neck: "gear-neck-scout-scarf",
    held: "gear-held-listening-shell"
  }
});

let reducerClock = 0;
let latestReducerRun = null;
let latestStageModel = null;

function reducerContext(mission) {
  const at = new Date(Date.UTC(2026, 8, 3) + reducerClock++ * 1000).toISOString();
  return {
    gameState: mission.gameState,
    at,
    sessionDay: "2026-09-03",
    audio: { status: "completed" }
  };
}

function replayState(stopId) {
  const initial = createSoundSeekersState();
  return normalizeSoundSeekersState({
    ...initial,
    trail: {
      ...initial.trail,
      journeyStep: Number(stopId.slice(1)),
      completedStopIds: [stopId]
    }
  });
}

function powerInputsForToken(mission, token) {
  const challenge = mission.activity.powerChallenge || mission.challenge;
  if (challenge.powerId === "echo_search") {
    const candidate = challenge.presentation.candidates.find(item => item.token === token);
    return [
      { type: "probe", candidateId: candidate.id },
      { type: "confirm_candidate", candidateId: candidate.id }
    ];
  }
  if (challenge.powerId === "contrast_sort") {
    const bin = challenge.presentation.bins.find(item => item.token === token);
    return [{
      type: challenge.expectedAction,
      itemId: challenge.presentation.items[0].id,
      binId: bin.id
    }];
  }
  if (challenge.powerId === "word_forge") {
    const tile = challenge.presentation.rack.find(item => item.token === token);
    return [{ type: "place_tile", tileId: tile.id }];
  }
  if (challenge.powerId === "blend_bridge") {
    const choice = challenge.presentation.choices.find(item => item.token === token);
    return [
      ...challenge.presentation.segments.map(segment => ({
        type: "activate_segment",
        segmentId: segment.id
      })),
      { type: "sweep_blend" },
      { type: challenge.expectedAction, choiceId: choice.id, token: choice.token }
    ];
  }
  if (challenge.powerId === "memory_delivery") {
    const recipient = challenge.presentation.recipients.find(item => item.token === token);
    return [
      { type: "receive_cue" },
      { type: "move", dx: 1, dy: 0 },
      { type: "arrive" },
      { type: challenge.expectedAction, recipientId: recipient.id }
    ];
  }
  if (challenge.powerId === "story_power") {
    const choice = challenge.presentation.choices.find(item => item.token === token);
    return [
      { type: "read_text" },
      { type: challenge.expectedAction, choiceId: choice.id, token: choice.token }
    ];
  }
  throw new Error(`Unsupported fixture power: ${challenge.powerId}`);
}

function driveInputs(mission, inputs) {
  for (const input of inputs) {
    mission = reduceMission(mission, input, reducerContext(mission)).state;
  }
  return mission;
}

function finishCurrentPhase(mission) {
  const phase = mission.plan.phases[mission.phaseIndex];
  if (["arrival", "wonder", "payoff"].includes(phase.kind)) {
    return reduceMission(mission, {
      type: `complete_${phase.kind}`
    }, reducerContext(mission)).state;
  }
  if (phase.kind === "teach") {
    const sequence = mission.activity.sequence;
    return reduceMission(mission, {
      type: "complete-teach",
      teachIndex: sequence.teachIndex,
      targetId: sequence.teachTargetId,
      audioDeliveries: []
    }, reducerContext(mission)).state;
  }
  if (["challenge", "content_opportunity", "content_placement"].includes(phase.kind)) {
    if (phase.category === "morphology") {
      const committed = reduceMission(mission, {
        type: "place_tile",
        tileId: "morphology-ending-tile"
      }, reducerContext(mission));
      return reduceMission(committed.state, {
        type: "complete_morphology_payoff"
      }, reducerContext(committed.state)).state;
    }
    const challenge = mission.activity.powerChallenge || mission.challenge;
    return driveInputs(mission, powerInputsForToken(mission, challenge.expectedToken));
  }
  throw new Error(`Fixture cannot advance phase ${phase.id}`);
}

function reducerRunAtTransfer(stopId) {
  const plan = createMissionPlan({
    stopId,
    state: replayState(stopId),
    seed: Number(stopId.slice(1)),
    replayOrdinal: 1
  });
  const transfer = plan.phases.find(phase => phase.kind === "story_transfer");
  let mission = createMissionState(plan);
  for (let guard = 0; guard < 300 && mission.phaseId !== transfer.id; guard += 1) {
    const previous = mission;
    mission = finishCurrentPhase(mission);
    if (mission === previous) throw new Error(`Fixture phase ${previous.phaseId} did not advance`);
  }
  if (mission.phaseId !== transfer.id) throw new Error(`Fixture did not reach ${transfer.id}`);
  return Object.freeze({ stopId, mission, transition: null });
}

const initialModel = Object.freeze({
  avatar: Object.freeze({
    characterId: "player",
    pose: "idle",
    appearance
  }),
  traversal: Object.freeze({
    routeId: "strict-mode-stage-route",
    position: Object.freeze({ x: 0.12, y: 0.58 }),
    target: Object.freeze({ x: 0.12, y: 0.58 }),
    bounds: Object.freeze({ minX: 0, maxX: 1, minY: 0, maxY: 1 }),
    interactions: Object.freeze([
      Object.freeze({ id: "listen-card", x: 0.82, y: 0.3, radius: 0.08 })
    ])
  }),
  activity: Object.freeze({
    id: "strict-mode-listen",
    kind: "sound_choice",
    instruction: Object.freeze({
      visibleText: "Listen, then choose the sound card.",
      spokenText: "Listen, then choose the sound card.",
      audioRequest: null
    }),
    correction: null,
    feedback: "Move close to unlock the sound card.",
    controls: Object.freeze([
      Object.freeze({
        id: "listen-card",
        label: "Choose sound card",
        input: Object.freeze({
          type: "confirm_candidate",
          targetId: "card-one",
          sourceId: "strict-mode-stage"
        }),
        audioRequest: Object.freeze({
          cueId: "stage-cue-one",
          audioKey: "stage-audio-one",
          kind: "instruction"
        }),
        disabled: true
      })
    ])
  }),
  hud: null
});

function StageHarness() {
  const [model, setModel] = useState(initialModel);
  const [reducerRun, setReducerRun] = useState(null);
  const stageModel = reducerRun ? createSceneViewModel({
    missionState: reducerRun.mission,
    missionTransition: reducerRun.transition,
    appearance,
    reducedMotion: true
  }) : model;
  latestReducerRun = reducerRun;
  latestStageModel = stageModel;
  const handleInput = input => {
    window.__soundSeekersStageInputs.push(input);
    if (stageModel.sceneChoiceControls?.some(control => control.input === input)) {
      window.__soundSeekersStageChoices.push(input);
    }
    if (reducerRun) {
      const reduced = reduceMission(reducerRun.mission, input, reducerContext(reducerRun.mission));
      window.__soundSeekersReducerMoves.push(Object.freeze({
        type: input.type,
        beforeRevision: reducerRun.mission.missionRevision,
        afterRevision: reduced.state.missionRevision,
        changed: reduced.state !== reducerRun.mission,
        projected: stageModel.sceneChoiceControls?.some(control => control.input === input)
          || stageModel.sceneActivity?.controls.some(control => control.input === input)
          || false,
        inputFrozen: Object.isFrozen(input),
        inputKeys: Object.freeze(Object.keys(input).sort()),
        transitionOutcome: reduced.transition?.outcome ?? null
      }));
      setReducerRun(Object.freeze({
        ...reducerRun,
        mission: reduced.state,
        transition: reduced.transition
      }));
      return;
    }
    if (input.type === "arrive" && input.targetId === "listen-card") {
      setModel(previous => previous.childScene ? previous : Object.freeze({
        ...previous,
        activity: Object.freeze({
          ...previous.activity,
          feedback: "The sound card is ready.",
          controls: Object.freeze(previous.activity.controls.map(control => Object.freeze({
            ...control,
            disabled: control.id === "listen-card" ? false : control.disabled
          })))
        })
      }));
      return;
    }
    if (input.type !== "traverse") return;
    const delta = {
      down: { x: 0, y: 0.18 },
      left: { x: -0.24, y: 0 },
      right: { x: 0.24, y: 0 },
      up: { x: 0, y: -0.18 }
    }[input.value];
    if (!delta) return;
    setModel(previous => {
      const target = previous.traversal.target;
      const clamp = value => Math.min(1, Math.max(0, value));
      return Object.freeze({
        ...previous,
        traversal: Object.freeze({
          ...previous.traversal,
          target: Object.freeze({
            x: clamp(target.x + delta.x),
            y: clamp(target.y + delta.y)
          })
        })
      });
    });
  };
  useEffect(() => {
    lifecycle.strictSetups += 1;
    window.__moveSoundSeekersAvatar = (x, y) => {
      setModel(previous => Object.freeze({
        ...previous,
        traversal: Object.freeze({
          ...previous.traversal,
          target: Object.freeze({ x, y })
        })
      }));
    };
    window.__resetSoundSeekersRoute = () => {
      setModel(previous => Object.freeze({
        ...previous,
        traversal: Object.freeze({
          ...previous.traversal,
          routeId: `${previous.traversal.routeId}:reset`,
          position: previous.traversal.target
        })
      }));
    };
    window.__showSoundSeekersReducerScene = stopId => {
      setReducerRun(reducerRunAtTransfer(stopId));
    };
    return () => {
      lifecycle.strictCleanups += 1;
    };
  }, []);

  return (
    <SoundSeekersStage
      model={stageModel}
      assists={{ simplifiedScene: false, reducedMotion: false }}
      audioController={{
        request(request) {
          window.__soundSeekersStageAudio.push(request);
        }
      }}
      onInput={handleInput}
    />
  );
}

const rootElement = document.getElementById("root");
const canvasObserver = new MutationObserver(records => {
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (!(node instanceof Element)) continue;
      lifecycle.canvasesAdded += Number(node.matches("canvas"));
      lifecycle.canvasesAdded += node.querySelectorAll("canvas").length;
    }
    for (const node of record.removedNodes) {
      if (!(node instanceof Element)) continue;
      lifecycle.canvasesRemoved += Number(node.matches("canvas"));
      lifecycle.canvasesRemoved += node.querySelectorAll("canvas").length;
    }
  }
});
canvasObserver.observe(rootElement, { childList: true, subtree: true });

const root = createRoot(rootElement);
root.render(<StrictMode><StageHarness /></StrictMode>);

window.__resetSoundSeekersStageEffects = () => {
  window.__soundSeekersStageInputs.length = 0;
  window.__soundSeekersStageAudio.length = 0;
  window.__soundSeekersStageChoices.length = 0;
  window.__soundSeekersReducerMoves.length = 0;
};
window.__unmountSoundSeekersStage = () => root.unmount();
window.__soundSeekersStageSnapshot = () => {
  const stage = document.querySelector("[data-sound-seekers-stage]");
  const host = document.querySelector("[data-ss-phaser-host]");
  const avatar = document.querySelector("[data-ss-live-avatar]");
  const avatarBounds = avatar?.getBoundingClientRect();
  const worldBounds = document.querySelector("[data-ss-react-world-owner]")?.getBoundingClientRect();
  return {
    stageCount: document.querySelectorAll("[data-sound-seekers-stage]").length,
    hostCount: document.querySelectorAll("[data-ss-phaser-host]").length,
    canvasCount: host?.querySelectorAll("canvas").length || 0,
    playerCount: stage?.querySelectorAll('[data-character-id="player"]').length || 0,
    liveAvatarCount: stage?.querySelectorAll("[data-ss-live-avatar]").length || 0,
    avatarLeftStyle: avatar?.style.left || null,
    avatarTopStyle: avatar?.style.top || null,
    avatarX: avatarBounds?.x ?? null,
    avatarY: avatarBounds?.y ?? null,
    avatarWidth: avatarBounds?.width ?? null,
    avatarHeight: avatarBounds?.height ?? null,
    worldWidth: worldBounds?.width ?? null,
    worldHeight: worldBounds?.height ?? null,
    runtimeStatus: stage?.dataset.runtimeStatus || null,
    nearestInteractionId: stage?.querySelector("[data-ss-react-world-owner]")
      ?.dataset.nearestInteractionId || null,
    connectedOptionCount: stage?.querySelectorAll("[data-option-token]").length || 0,
    enabledConnectedOptionCount: stage?.querySelectorAll("[data-option-token]:enabled").length || 0,
    modelControlCount: stage?.querySelectorAll("[data-ss-model-control]").length || 0,
    modelInputTypes: [...(stage?.querySelectorAll("[data-ss-model-input-type]") || [])]
      .map(control => control.dataset.ssModelInputType),
    reducerStopId: latestReducerRun?.stopId ?? null,
    missionPhaseId: latestReducerRun?.mission.phaseId ?? null,
    missionRevision: latestReducerRun?.mission.missionRevision ?? null,
    activityStatus: latestReducerRun?.mission.activity?.status ?? null,
    activityPowerId: latestReducerRun?.mission.activity?.powerId ?? null,
    presentationPhase: latestReducerRun?.mission.activity?.presentation?.phase ?? null,
    transitionOutcome: latestReducerRun?.transition?.outcome ?? null,
    sceneOptionsEnabled: latestStageModel?.sceneOptionsEnabled ?? null,
    sceneChoiceControlCount: latestStageModel?.sceneChoiceControls?.length ?? 0,
    sceneActivityControlCount: latestStageModel?.sceneActivity?.controls?.length ?? 0,
    activeInputListeners: activeInputListeners.length,
    inputs: [...window.__soundSeekersStageInputs],
    audio: [...window.__soundSeekersStageAudio],
    choices: [...window.__soundSeekersStageChoices],
    reducerMoves: [...window.__soundSeekersReducerMoves],
    errors: [...window.__soundSeekersStageErrors],
    ...lifecycle
  };
};
