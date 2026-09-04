import { getBiomeKit } from "../content/biomeKits.js";
import { SOUND_SEEKERS_CHAPTERS } from "../content/chapters/index.js";
import { CONTENT_DECK_PLACEMENTS } from "../content/contentDeckBindings.js";
import {
  SOUND_SEEKERS_EXPEDITIONS,
  SOUND_SEEKERS_INTERACTION_CONTEXTS,
  getExpedition
} from "../content/expeditions.js";
import { getInstructionContract } from "../content/instructionContracts.js";
import { getMeaningSupport } from "../content/meaningSupport.js";
import { resolveSceneVisualSemantic } from "../content/sceneVisualSemantics.js";
import {
  MOTOR_ASSIST_KEYS,
  normalizeMotorAssists
} from "../engine/motorAssists.js";
import {
  projectCurrentMissionSceneModel,
  validateCurrentMissionTransition
} from "../engine/missionReducer.js";
import { issueSceneVisualAccess } from "../engine/sceneVisualAccess.js";
import {
  deriveWorldState,
  resolveWorldScenePresentation
} from "../engine/worldState.js";
import { createBackgroundImageState } from "../visual/backgroundImageState.js";
import { SOUND_SEEKERS_PLAYER_VISUAL } from "../visual/characterCatalog.js";
import { createCharacterAppearance } from "../visual/characterCustomization.js";
import { resolveMeaningVisual } from "../visual/sceneVisualCatalog.js";
import { questChapterMaterialSfxEntry } from "../../../utils/questActionAudio.js";
import { createSoundSeekersCorrectionAudioRequest } from "./soundSeekersAudioController.js";

const INPUT_KEYS = Object.freeze([
  "missionState", "missionTransition", "appearance", "assists", "cropProfile", "reducedMotion"
]);
const MEANING_INPUT_KEYS = Object.freeze(["powerId", "wordId", "missionTransition"]);
const CROP_PROFILES = new Set(["landscape", "tablet", "portrait"]);
const OUTCOMES = new Set(["advance", "continue", "retry", "model_required"]);
const ACCESS_PHASES = new Set(["action", "resolved", "meaning_support"]);
const MEANING_POWERS = new Set(["word_forge", "blend_bridge"]);
const POWER_EFFECTS = Object.freeze({
  echo_search: "phoneme-ripple",
  contrast_sort: "grapheme-reveal",
  word_forge: "word-assembly",
  blend_bridge: "blend-path",
  memory_delivery: "remembered-cue",
  story_power: "text-action"
});
const PASSIVE_COPY = Object.freeze({
  arrival: Object.freeze({ instruction: "Enter the trail and look for the mission landmark.", label: "Enter the trail" }),
  wonder: Object.freeze({ instruction: "Look closely at what your sound work changed.", label: "See the change" }),
  payoff: Object.freeze({ instruction: "Collect this mission memory before you travel on.", label: "Collect the memory" })
});
const DECORATIONS_MAX_PRIORITY = 1;
const INTERACTIVE_PRIORITY = 4;
const TARGET_PRIORITY = 5;
const BOUNDS = Object.freeze({ minX: 0, maxX: 1, minY: 0, maxY: 1 });
const sceneModels = new WeakSet();
const sceneModelMetadata = new WeakMap();
const meaningPayoffModels = new WeakSet();

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function plainRecord(value) {
  return Boolean(value)
    && typeof value === "object"
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function assertKeys(value, allowed, required, label) {
  if (!plainRecord(value)) throw new TypeError(`${label} must be a plain record`);
  const keys = Reflect.ownKeys(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (keys.some(key => typeof key !== "string" || !allowed.includes(key))
    || required.some(key => !Object.hasOwn(value, key))
    || keys.some(key => !Object.hasOwn(descriptors[key], "value")
      || descriptors[key].enumerable !== true)) {
    throw new TypeError(`${label} contains unknown or missing authority`);
  }
}

function nonempty(value) {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}

function clamp(value) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

const chapterById = new Map(SOUND_SEEKERS_CHAPTERS.map(chapter => [chapter.id, chapter]));
const actionEntries = [];
for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
  for (const action of [
    ...expedition.phases.filter(phase => phase.powerId),
    ...expedition.heartWordOpportunities,
    ...CONTENT_DECK_PLACEMENTS.filter(placement => placement.stopId === expedition.stopId)
  ]) {
    actionEntries.push(Object.freeze({ action, expedition }));
  }
}
const actionEntryById = new Map(actionEntries.map(entry => [entry.action.id ?? entry.action.placementId, entry]));
if (actionEntryById.size !== actionEntries.length) {
  throw new Error("Sound Seekers scene actions must have unique authored identities");
}

const DEFAULT_PLAYER_APPEARANCE = createCharacterAppearance({
  schemaVersion: 1,
  bodyShapeId: SOUND_SEEKERS_PLAYER_VISUAL.bodyShapeId,
  paletteTokenId: SOUND_SEEKERS_PLAYER_VISUAL.paletteTokenId,
  accessories: { back: null, head: null, neck: null, held: null }
});

function authoredActionId(action) {
  return action?.id ?? action?.placementId ?? null;
}

function assertPlanActionJoin(phase, entry, expedition) {
  const action = entry?.action;
  if (!phase || !action || entry.expedition !== expedition) {
    throw new TypeError("mission phase does not join an authored Sound Seekers action");
  }
  const checks = ["powerId", "instructionId", "expectedAction", "recordsDomain"];
  if (checks.some(key => phase[key] !== action[key])) {
    throw new TypeError("mission phase action identity drifted from the authored catalog");
  }
  if (action.wordId !== undefined && phase.wordId !== action.wordId) {
    throw new TypeError("mission phase word identity drifted from the authored catalog");
  }
  return action;
}

function actionForPhase(missionState, expedition) {
  const phase = missionState.plan.phases[missionState.phaseIndex];
  if (!phase?.powerId) return null;
  const actionId = phase.kind === "power_onboarding" ? phase.ownerActionId : phase.id;
  return assertPlanActionJoin(
    phase.kind === "power_onboarding"
      ? missionState.plan.phases.find(candidate => candidate.id === actionId)
      : phase,
    actionEntryById.get(actionId),
    expedition
  );
}

function sourceActionForTransition(missionState, transition, expedition) {
  if (transition === null) return null;
  if (!validateCurrentMissionTransition(transition, {
    missionId: missionState.plan.id,
    revision: missionState.missionRevision
  })) {
    throw new TypeError("scene model transition is not the exact current applied mission transition");
  }
  const planPhase = missionState.plan.phases.find(phase => phase.id === transition.phaseId);
  const entry = actionEntryById.get(transition.phaseId);
  const action = assertPlanActionJoin(planPhase, entry, expedition);
  if (!OUTCOMES.has(transition.outcome)) {
    throw new TypeError("scene model transition outcome is not canonical");
  }
  return action;
}

function normalizedProfiles(input) {
  const supplied = input.assists ?? {};
  const allowed = [...MOTOR_ASSIST_KEYS, "reducedMotion"];
  assertKeys(supplied, allowed, [], "scene assists");
  for (const key of Reflect.ownKeys(supplied)) {
    if (typeof key !== "string" || !allowed.includes(key) || typeof supplied[key] !== "boolean") {
      throw new TypeError(`unknown or invalid scene assist: ${String(key)}`);
    }
  }
  if (input.reducedMotion !== undefined && typeof input.reducedMotion !== "boolean") {
    throw new TypeError("reducedMotion must be boolean");
  }
  if (Object.hasOwn(supplied, "reducedMotion")
    && input.reducedMotion !== undefined
    && supplied.reducedMotion !== input.reducedMotion) {
    throw new TypeError("reducedMotion cannot have conflicting authorities");
  }
  const motor = normalizeMotorAssists(Object.fromEntries(MOTOR_ASSIST_KEYS
    .filter(key => Object.hasOwn(supplied, key))
    .map(key => [key, supplied[key]])));
  const reducedMotion = input.reducedMotion ?? supplied.reducedMotion === true;
  const cropProfile = input.cropProfile ?? "landscape";
  if (!CROP_PROFILES.has(cropProfile)) throw new TypeError("scene crop profile is invalid");
  return Object.freeze({
    motor,
    cropProfile,
    densityProfile: motor.simplifiedScene ? "simplified" : "full",
    motionProfile: reducedMotion ? "reduced" : "full",
    reducedMotion
  });
}

function canonicalAppearance(value) {
  return createCharacterAppearance(value ?? DEFAULT_PLAYER_APPEARANCE);
}

function audioRequestForInstruction(instructionId) {
  const contract = getInstructionContract(instructionId);
  if (!contract) throw new TypeError(`unknown Sound Seekers instruction: ${String(instructionId)}`);
  return deepFreeze({
    cueId: `instruction:${contract.instructionId}`,
    audioKey: contract.childAudio,
    visibleText: contract.childText,
    spokenText: contract.childText,
    kind: "instruction",
    requiresAudio: true
  });
}

function control(id, label, input, audioRequest = undefined, disabled = false) {
  const value = { id, label, input, disabled };
  if (audioRequest) value.audioRequest = audioRequest;
  return value;
}

function correctionTranscript(projectedCorrection) {
  if (!projectedCorrection) return null;
  const mode = projectedCorrection.modelOnce === true || projectedCorrection.supportLevel >= 3
    ? "teach"
    : projectedCorrection.supportLevel === 2 || projectedCorrection.reduceIrrelevantLoad === true
      ? "narrow"
      : "retry";
  const audioRequest = createSoundSeekersCorrectionAudioRequest(mode);
  return deepFreeze({
    mode,
    visibleText: audioRequest.visibleText,
    spokenText: audioRequest.spokenText,
    audioRequest
  });
}

function replayInstructionControl(action) {
  const request = audioRequestForInstruction(action.instructionId);
  const actionId = authoredActionId(action);
  return control(
    `replay-instruction:${actionId}`,
    "Hear directions",
    { type: "replay_instruction", value: action.instructionId },
    request
  );
}

function modelStepControls(action) {
  const actionId = authoredActionId(action);
  return [
    replayInstructionControl(action),
    control(
      `complete-model:${actionId}`,
      "I watched. Let me try",
      { type: "complete_correction_model" }
    )
  ];
}

function echoControls(projected) {
  return (projected.candidates || []).map(candidate => control(
    `candidate:${candidate.id}:${candidate.revealed ? "confirm" : "probe"}`,
    candidate.revealed ? `Choose ${candidate.label}` : `Check ${candidate.label}`,
    { type: candidate.revealed ? "confirm_candidate" : "probe", candidateId: candidate.id }
  ));
}

function contrastControls(projected, action) {
  const controls = [];
  for (const item of projected.items || []) {
    for (const bin of projected.bins || []) {
      controls.push(control(
        `sort:${item.id}:${bin.id}`,
        `${item.label} to ${bin.label}`,
        { type: action.expectedAction, itemId: item.id, binId: bin.id }
      ));
    }
  }
  return controls;
}

function forgeControls(projected, action) {
  const occupied = new Set((projected.slots || []).map(slot => slot.tileId).filter(Boolean));
  const nextSlot = (projected.slots || []).find(slot => !slot.tileId);
  if (nextSlot) {
    return (projected.rack || []).filter(tile => !occupied.has(tile.id)).map(tile => control(
      `forge:${tile.id}:${nextSlot.id}`,
      `Place ${tile.label}`,
      { type: "place_tile", tileId: tile.id }
    ));
  }
  if (action.category === "morphology" || action.placementId === "s38-morphology") {
    return [control(
      `complete-payoff:${action.id ?? action.placementId}`,
      "See the new word",
      { type: "complete_morphology_payoff" }
    )];
  }
  return [];
}

function blendControls(projected, action, activity) {
  const nextSegment = (projected.segments || []).find(segment => !segment.active);
  if (nextSegment) {
    return [control(
      `segment:${nextSegment.id}`,
      `Touch ${nextSegment.label}`,
      { type: "activate_segment", segmentId: nextSegment.id }
    )];
  }
  if (projected.sweepComplete !== true) {
    return [control(
      `blend:${action.id}`,
      "Slide and blend",
      { type: "sweep_blend" }
    )];
  }
  return (projected.choices || []).map(choice => {
    const token = activity?.choiceTokens?.[choice.id];
    if (!nonempty(token)) throw new TypeError("blend choice has no canonical child token");
    return control(
      `meaning-choice:${choice.id}`,
      choice.label,
      { type: action.expectedAction, choiceId: choice.id, token }
    );
  });
}

function memoryControls(projected, action) {
  if (projected.cueReceived !== true) {
    return [control(
      `receive:${action.id}`,
      "Hold the clue",
      { type: "receive_cue" }
    )];
  }
  if (projected.arrived !== true && projected.routeProgress < 1) {
    return [control(
      `move:${action.id}`,
      "Carry the clue forward",
      { type: "move", dx: 1, dy: 0 }
    )];
  }
  if (projected.arrived !== true) {
    return [control(
      `arrive:${action.id}`,
      "I reached the choices",
      { type: "arrive" }
    )];
  }
  return (projected.recipients || []).map(recipient => control(
    `deliver:${recipient.id}`,
    recipient.label,
    { type: action.expectedAction, recipientId: recipient.id }
  ));
}

function controlsForPower(projected, action, activity) {
  if (projected.status === "model_pending") return modelStepControls(action);
  const taskControls = action.powerId === "echo_search" ? echoControls(projected)
    : action.powerId === "contrast_sort" ? contrastControls(projected, action)
      : action.powerId === "word_forge" ? forgeControls(projected, action)
        : action.powerId === "blend_bridge" ? blendControls(projected, action, activity)
          : action.powerId === "memory_delivery" ? memoryControls(projected, action)
            : [];
  return [replayInstructionControl(action), ...taskControls];
}

function exactTokenEntry(entries, tokensById, token, label) {
  const matches = (entries || []).filter(entry => tokensById?.[entry.id] === token);
  if (matches.length !== 1) {
    throw new TypeError(`${label} does not join one canonical visible token`);
  }
  return matches[0];
}

function sceneChoiceProjection({ missionState, projected, action, expedition }) {
  const disabled = { enabled: false, controls: [] };
  const childScene = projected.childScene;
  const activity = missionState.activity;
  if (!childScene) return disabled;
  if (activity.status === "narrative_choice_pending") {
    if (expedition.transfer.boss !== true || action?.powerId !== "blend_bridge"
      || missionState.challenge !== null || childScene.choice.kind !== "narrative_bridge") {
      throw new TypeError("narrative scene choices do not match the canonical boss transfer");
    }
    return {
      enabled: true,
      controls: childScene.choice.options.map(option => ({
        token: option.token,
        input: {
          type: "choose_narrative_route",
          choiceId: option.visualSemanticId
        }
      }))
    };
  }
  if (activity.status !== "active") return disabled;
  if (action?.powerId === "story_power" && activity.textRead === true) {
    return {
      enabled: true,
      controls: childScene.choice.options.map(option => {
        const choice = exactTokenEntry(
          activity.choices,
          activity.choiceTokens,
          option.token,
          "Story Power choice"
        );
        return {
          token: option.token,
          input: {
            type: action.expectedAction,
            choiceId: choice.id,
            token: option.token
          }
        };
      })
    };
  }
  if (action?.powerId === "memory_delivery" && activity.arrived === true) {
    return {
      enabled: true,
      controls: childScene.choice.options.map(option => {
        const recipient = exactTokenEntry(
          activity.recipients,
          activity.recipientTokens,
          option.token,
          "Memory Delivery recipient"
        );
        return {
          token: option.token,
          input: {
            type: action.expectedAction,
            recipientId: recipient.id
          }
        };
      })
    };
  }
  return disabled;
}

function connectedPresentationActivity(projected, phase, sceneVisualProps) {
  const presentationPhase = projected.presentation?.phase;
  if (!["action", "resolved", "meaning_support"].includes(presentationPhase)) return null;
  const transition = sceneVisualProps?.sceneAccess;
  if (!transition) {
    throw new TypeError("connected presentation action requires its exact current transition");
  }
  if (transition.phase !== presentationPhase || transition.sceneId !== projected.childScene.id) {
    throw new TypeError("connected presentation action drifted from its child scene");
  }
  let instruction;
  let controls;
  if (presentationPhase === "action") {
    instruction = "Make the story action happen, then look for the change.";
    controls = [control(
      `story-action:${phase.id}`,
      "Show what happens",
      { type: "action_completed" }
    )];
  } else if (presentationPhase === "resolved") {
    const post = resolveSceneVisualSemantic(transition.postDecisionSemanticId);
    if (post?.kind !== "post_decision" || post.sceneId !== projected.childScene.id
      || !Array.isArray(post.meaningSemanticIds) || post.meaningSemanticIds.length < 1) {
      throw new TypeError("resolved connected scene has no canonical meaning choices");
    }
    instruction = "Choose a story word to explore its meaning.";
    controls = post.meaningSemanticIds.map(meaningSemanticId => {
      const meaning = resolveSceneVisualSemantic(meaningSemanticId);
      if (meaning?.kind !== "meaning" || !nonempty(meaning.wordId)) {
        throw new TypeError("resolved connected scene meaning is not canonical");
      }
      return control(
        `story-meaning:${meaningSemanticId}`,
        `Explore ${meaning.wordId}`,
        { type: "meaning_requested", meaningSemanticId }
      );
    });
  } else {
    instruction = "Carry this story meaning back to the sound trail.";
    controls = [control(
      `complete-story:${phase.id}`,
      "Continue the trail",
      { type: "complete_story_transfer" }
    )];
  }
  return deepFreeze({
    id: phase.id,
    kind: `connected_text_${presentationPhase}`,
    instruction: { visibleText: instruction, spokenText: instruction },
    correction: null,
    feedback: "",
    controls
  });
}

function exactSceneTaskControls(missionState, projected, action) {
  const activity = missionState.activity;
  if (activity.status === "model_pending") {
    return [control(
      `complete-model:${authoredActionId(action)}`,
      "I watched. Let me try",
      { type: "complete_correction_model" }
    )];
  }
  if (activity.status !== "active") return [];
  if (action.powerId === "story_power") {
    return activity.textRead === true ? [] : [control(
      `read-story:${authoredActionId(action)}`,
      "Read the story clue",
      { type: "read_text" }
    )];
  }
  if (action.powerId === "memory_delivery") {
    if (activity.cueReceived !== true) {
      return [control(
        `receive-story-cue:${authoredActionId(action)}`,
        "Hold the story clue",
        { type: "receive_cue" }
      )];
    }
    if (activity.routeProgress < 1) {
      return [control(
        `carry-story-cue:${authoredActionId(action)}`,
        "Carry the clue forward",
        { type: "move", dx: 1, dy: 0 }
      )];
    }
    if (activity.arrived !== true) {
      return [control(
        `arrive-with-story-cue:${authoredActionId(action)}`,
        "Reach the story choices",
        { type: "arrive" }
      )];
    }
    return [];
  }
  if (action.powerId === "blend_bridge") {
    const nextSegment = (projected.activity?.segments || []).find(segment => !segment.active);
    if (nextSegment) {
      return [control(
        `story-segment:${nextSegment.id}`,
        `Touch ${nextSegment.label}`,
        { type: "activate_segment", segmentId: nextSegment.id }
      )];
    }
    if (activity.sweepComplete !== true) {
      return [control(
        `story-blend:${authoredActionId(action)}`,
        "Slide and blend",
        { type: "sweep_blend" }
      )];
    }
    return (projected.activity?.choices || []).map(choice => {
      const token = activity.choiceTokens?.[choice.id];
      if (!nonempty(token)) throw new TypeError("boss blend choice has no canonical token");
      return control(
        `story-meaning-choice:${choice.id}`,
        choice.label,
        { type: action.expectedAction, choiceId: choice.id, token }
      );
    });
  }
  throw new TypeError("connected scene uses an unsupported authored power");
}

function sceneActivityModel({ missionState, projected, phase, action, sceneVisualProps }) {
  if (!projected.childScene) return null;
  const presentationActivity = connectedPresentationActivity(projected, phase, sceneVisualProps);
  if (presentationActivity) return presentationActivity;
  if (missionState.activity.status === "narrative_choice_pending") return null;
  const controls = exactSceneTaskControls(missionState, projected, action);
  if (!controls.length) return null;
  const request = audioRequestForInstruction(action.instructionId);
  return deepFreeze({
    id: phase.id,
    kind: action.powerId,
    instruction: {
      visibleText: request.visibleText,
      spokenText: request.spokenText,
      audioRequest: request
    },
    correction: correctionTranscript(projected.activity?.correction),
    feedback: "",
    controls
  });
}

function passiveActivity(phase) {
  const copy = PASSIVE_COPY[phase.kind];
  if (!copy) return null;
  return deepFreeze({
    id: phase.id,
    kind: phase.kind,
    instruction: { visibleText: copy.instruction, spokenText: copy.instruction },
    correction: null,
    feedback: "",
    controls: [control(
      `continue:${phase.id}`,
      copy.label,
      { type: `complete_${phase.kind}` }
    )]
  });
}

function teachActivity(missionState) {
  const sequence = missionState.activity?.sequence;
  const item = sequence?.currentItem || null;
  if (!sequence) return null;
  if (!item) {
    const text = "Teaching is complete. Continue to the sound trail.";
    return deepFreeze({
      id: missionState.phaseId,
      kind: "teach",
      instruction: { visibleText: text, spokenText: text },
      correction: null,
      feedback: "",
      teachItem: null,
      controls: [control(
        `complete-teach:${missionState.phaseId}`,
        "Continue to the trail",
        {
          type: "complete-teach",
          teachIndex: sequence.teachIndex,
          targetId: null,
          audioDeliveries: []
        }
      )]
    });
  }
  const request = audioRequestForInstruction(item.instructionId);
  return deepFreeze({
    id: missionState.phaseId,
    kind: "teach",
    instruction: {
      visibleText: item.childText,
      spokenText: item.childText,
      audioRequest: request
    },
    correction: null,
    feedback: item.workedExample,
    teachItem: item,
    controls: [control(
      `hear-teach:${item.targetId}`,
      "Hear this teaching step",
      { type: "replay_instruction", value: item.instructionId },
      request
    )]
  });
}

function activityModel({ missionState, projected, phase, action }) {
  if (projected.childScene) return null;
  if (phase.kind === "teach") return teachActivity(missionState);
  const passive = passiveActivity(phase);
  if (passive) return passive;
  if (!action) return null;
  const request = audioRequestForInstruction(action.instructionId);
  const correction = correctionTranscript(projected.activity?.correction);
  return deepFreeze({
    id: phase.id,
    kind: action.powerId,
    instruction: {
      visibleText: request.visibleText,
      spokenText: request.spokenText,
      audioRequest: request
    },
    correction,
    feedback: projected.activity?.status === "awaiting_mission_commit" ? "Learning action complete." : "",
    controls: controlsForPower(projected.activity || {}, action, missionState.activity)
  });
}

function taskPosition(route) {
  const zone = route?.taskCamera?.quietZone;
  if (!zone || ![zone.x, zone.y, zone.width, zone.height].every(Number.isFinite)) {
    throw new TypeError("canonical route has no task quiet zone");
  }
  return deepFreeze({
    x: clamp(zone.x + zone.width / 2),
    y: clamp(zone.y + zone.height / 2)
  });
}

function traversalModel(route, activity, motor) {
  const position = taskPosition(route);
  const controls = activity?.controls || [];
  const zone = route.taskCamera.quietZone;
  const interactions = controls.map((item, index) => {
    const denominator = Math.max(1, controls.length - 1);
    return {
      id: item.id,
      x: clamp(zone.x + zone.width * (controls.length === 1 ? 0.5 : index / denominator)),
      y: position.y,
      radius: motor.largerTargets ? 0.16 : 0.11
    };
  });
  return deepFreeze({
    routeId: route.id,
    position,
    target: position,
    bounds: BOUNDS,
    interactions
  });
}

function sceneVisualModel(projected, expedition, profiles) {
  if (!projected.childScene) return null;
  const transition = projected.transition;
  let sceneAccess = null;
  const presentation = projected.presentation;
  if (!presentation || presentation.sceneId !== projected.childScene.id) {
    throw new TypeError("connected scene presentation does not own this child scene");
  }
  if (ACCESS_PHASES.has(presentation.phase)) {
    if (transition === null) {
      throw new TypeError("connected scene transition is not the exact active Task 3 capability");
    }
    sceneAccess = issueSceneVisualAccess(transition, {
      sceneId: presentation.sceneId,
      attemptId: presentation.attemptId,
      reducerRevision: presentation.reducerRevision
    });
  }
  const activeAttemptId = sceneAccess?.attemptId ?? presentation.attemptId ?? null;
  const reducerRevision = sceneAccess?.reducerRevision ?? presentation.reducerRevision ?? null;
  const bossResolved = expedition.transfer.boss === true
    && ["resolved", "meaning_support"].includes(sceneAccess?.phase);
  return deepFreeze({
    sceneAccess,
    activeAttemptId,
    reducerRevision,
    cropProfile: profiles.cropProfile,
    densityProfile: profiles.densityProfile,
    motionProfile: profiles.motionProfile,
    compositionMode: bossResolved ? "boss-resolved" : "ordinary"
  });
}

function hudModel(missionState, expedition, chapter) {
  const total = missionState.plan.phases.length;
  const current = Math.min(total, missionState.completedPhaseIds.length);
  return deepFreeze({
    title: expedition.title,
    locationLabel: chapter.title,
    progress: {
      current,
      total,
      label: `${current} of ${total} trail steps complete`
    },
    controls: []
  });
}

function interactableModels(activity, childScene, sceneOptionsEnabled, sceneActivity, contactTargetId) {
  const ids = childScene
    ? [
      ...(sceneOptionsEnabled
        ? (childScene.choice?.options || []).map(option => option.visualSemanticId)
        : []),
      ...(sceneActivity?.controls || []).map(item => item.id)
    ]
    : (activity?.controls || []).map(item => item.id);
  if (nonempty(contactTargetId)) ids.push(contactTargetId);
  return deepFreeze([...new Set(ids)].map(id => ({
    id,
    role: id === contactTargetId ? "contact_target" : "learning_control",
    contrastPriority: id === contactTargetId ? TARGET_PRIORITY : INTERACTIVE_PRIORITY
  })));
}

function committedConstruct(action) {
  if (!action) return null;
  const context = action.contextId ? SOUND_SEEKERS_INTERACTION_CONTEXTS[action.contextId] : null;
  return action.recordsDomain
    || context?.activityFocus
    || action.activityFocus
    || action.category
    || action.powerId;
}

export function createSceneViewModel(input = {}) {
  assertKeys(input, INPUT_KEYS, ["missionState"], "scene model input");
  const missionTransition = input.missionTransition ?? null;
  const profiles = normalizedProfiles(input);
  const projected = projectCurrentMissionSceneModel(
    input.missionState,
    profiles.motor,
    missionTransition
  );
  const expedition = getExpedition(projected.stopId);
  const chapter = expedition ? chapterById.get(expedition.chapterId) : null;
  const kit = chapter ? getBiomeKit(chapter.id) : null;
  if (!expedition || !chapter || !kit || input.missionState.plan.chapterId !== chapter.id) {
    throw new TypeError("scene model cannot join mission, expedition, chapter, and biome identities");
  }
  const sourceAction = sourceActionForTransition(input.missionState, missionTransition, expedition);
  const phase = input.missionState.plan.phases[input.missionState.phaseIndex];
  const currentAction = actionForPhase(input.missionState, expedition);
  const worldState = deriveWorldState(input.missionState.gameState, kit);
  const worldPresentation = resolveWorldScenePresentation({
    worldState,
    stopId: expedition.stopId
  });
  const activity = activityModel({
    missionState: input.missionState,
    projected,
    phase,
    action: currentAction
  });
  const sceneVisualProps = sceneVisualModel(projected, expedition, profiles);
  const childScene = projected.childScene;
  const sceneChoices = sceneChoiceProjection({
    missionState: input.missionState,
    projected,
    action: currentAction,
    expedition
  });
  const sceneActivity = sceneActivityModel({
    missionState: input.missionState,
    projected,
    phase,
    action: currentAction,
    sceneVisualProps
  });
  const appearance = canonicalAppearance(input.appearance);
  const biomeProps = childScene ? null : deepFreeze({
    kit,
    scenePresentation: worldPresentation,
    cropProfile: profiles.cropProfile,
    densityProfile: profiles.densityProfile,
    motionProfile: profiles.motionProfile,
    compositionMode: phase.kind === "wonder" ? "wonder" : "ordinary",
    backgroundImageState: createBackgroundImageState(kit.background.src)
  });
  const avatar = childScene ? null : deepFreeze({
    characterId: "player",
    pose: "idle",
    appearance
  });
  const traversal = childScene ? null : traversalModel(worldPresentation.route, activity, profiles.motor);
  const contactTargetId = sourceAction ? projected.contactTargetId : null;
  const interactables = interactableModels(
    activity,
    childScene,
    sceneChoices.enabled,
    sceneActivity,
    contactTargetId
  );
  const sourceConstruct = committedConstruct(sourceAction || currentAction);
  const effectId = (sourceAction || currentAction)?.powerId
    ? POWER_EFFECTS[(sourceAction || currentAction).powerId]
    : null;
  const model = deepFreeze({
    kind: "sound_seekers_scene_view_model",
    missionId: projected.missionId,
    stopId: projected.stopId,
    chapterId: chapter.id,
    phaseId: projected.phaseId,
    revision: projected.revision,
    childScene,
    presentation: projected.presentation,
    transition: projected.transition,
    sceneVisualProps,
    sceneOptionsEnabled: sceneChoices.enabled,
    sceneChoiceControls: sceneChoices.controls,
    sceneActivity,
    biomeProps,
    avatar,
    traversal,
    activity,
    hud: hudModel(input.missionState, expedition, chapter),
    layers: kit.layers,
    interactables,
    decorationsMaxPriority: DECORATIONS_MAX_PRIORITY,
    salience: {
      decorationsMaxPriority: DECORATIONS_MAX_PRIORITY,
      interactiveMinPriority: INTERACTIVE_PRIORITY,
      activeTargetPriority: TARGET_PRIORITY
    },
    contactTargetId,
    committedConstruct: sourceConstruct,
    literacyEffectId: effectId
  });
  sceneModels.add(model);
  sceneModelMetadata.set(model, Object.freeze({
    missionState: input.missionState,
    missionTransition,
    sourceAction,
    currentAction,
    expedition,
    chapter,
    kit,
    worldPresentation,
    presentationTransitionProjection: sceneVisualProps?.sceneAccess
      ? sceneVisualProps.sceneAccess
      : null,
    reducedMotion: profiles.reducedMotion
  }));
  return model;
}

function canonicalMeaningAction(transition, powerId, wordId) {
  if (!validateCurrentMissionTransition(transition)) {
    throw new TypeError("meaning payoff requires the exact current applied mission transition");
  }
  const entry = actionEntryById.get(transition.phaseId);
  const action = entry?.action;
  if (!entry || !SOUND_SEEKERS_EXPEDITIONS.includes(entry.expedition)
    || !entry.expedition.phases.includes(action)
    || !MEANING_POWERS.has(action.powerId)
    || action.powerId !== powerId
    || action.wordId !== wordId
    || transition.outcome !== "advance") {
    throw new TypeError("meaning payoff transition does not match its authored action, power, and word");
  }
  return action;
}

export function createMeaningPayoffModel(input = {}) {
  assertKeys(input, MEANING_INPUT_KEYS, MEANING_INPUT_KEYS, "meaning payoff input");
  if (!MEANING_POWERS.has(input.powerId) || !nonempty(input.wordId)) {
    throw new TypeError("meaning payoff power and word are invalid");
  }
  canonicalMeaningAction(input.missionTransition, input.powerId, input.wordId);
  const support = getMeaningSupport(input.wordId);
  const visual = support ? resolveMeaningVisual(support.visualSemanticId) : null;
  if (!support || !visual || support.wordId !== input.wordId || visual.wordId !== input.wordId
    || support.audioKey !== `quest/meaning/${input.wordId}`) {
    throw new TypeError("meaning payoff support and visual do not join the authored word");
  }
  const transcript = `${support.childDefinition} ${support.ellSupport.oralBridge} ${support.actionPrompt}`;
  const model = deepFreeze({
    kind: "sound_seekers_meaning_payoff_model",
    powerId: input.powerId,
    wordId: input.wordId,
    support,
    visual,
    audioRequest: {
      cueId: `meaning:${input.wordId}`,
      audioKey: `quest/meaning/${input.wordId}`,
      visibleText: transcript,
      spokenText: transcript,
      kind: "meaning_support",
      requiresAudio: true
    },
    evidenceAdded: 0,
    immediateBeforeNextMissionAction: true
  });
  meaningPayoffModels.add(model);
  return model;
}

function repairStateId(metadata) {
  const bindings = metadata.worldPresentation.landmark.postDecisionBindings;
  const projection = metadata.presentationTransitionProjection;
  if (projection?.postDecisionSemanticId) {
    const matches = bindings.filter(binding => (
      binding.postDecisionSemanticId === projection.postDecisionSemanticId
      && binding.storyOutcomeId === projection.storyOutcomeId
    ));
    if (matches.length !== 1) {
      throw new TypeError("game-feel repair cannot join the connected-text branch");
    }
    return matches[0].resolvedStateId;
  }
  if (bindings.length === 1) return bindings[0].resolvedStateId;
  const context = metadata.sourceAction?.contextId
    ? SOUND_SEEKERS_INTERACTION_CONTEXTS[metadata.sourceAction.contextId]
    : null;
  if (!nonempty(context?.consequenceId)) {
    throw new TypeError("game-feel repair has no exact authored state");
  }
  return context.consequenceId;
}

function materialRequest(metadata) {
  const entry = questChapterMaterialSfxEntry(metadata.chapter.id);
  if (!entry || !nonempty(entry.key) || !nonempty(entry.src)) {
    throw new TypeError("game-feel repair has no canonical material sound");
  }
  const text = `The ${metadata.chapter.title} repair settles into place.`;
  return Object.freeze({
    entry,
    request: deepFreeze({
      cueId: `material:${metadata.chapter.id}`,
      audioKey: entry.src,
      visibleText: text,
      spokenText: text,
      kind: "material_effect",
      requiresAudio: false
    })
  });
}

function authoredTargetIds(action) {
  const context = action?.contextId ? SOUND_SEEKERS_INTERACTION_CONTEXTS[action.contextId] : null;
  return deepFreeze([
    ...(context?.objectIds || []),
    ...(context?.recipientId ? [context.recipientId] : [])
  ]);
}

function successfulSteps(model, metadata, outcome) {
  const targetId = model.contactTargetId;
  const sourceAction = metadata.sourceAction;
  const common = [
    {
      kind: "anticipation",
      pose: "anticipate",
      targetId,
      continuousMotion: metadata.reducedMotion !== true
    },
    {
      kind: "contact",
      pose: "contact",
      targetId,
      authoredTargetIds: authoredTargetIds(sourceAction),
      contactOutline: true
    },
    {
      kind: "literacy_effect",
      construct: model.committedConstruct,
      effectId: model.literacyEffectId,
      targetId,
      particles: metadata.reducedMotion !== true,
      finalStateRetained: true
    },
    {
      kind: "resident_reaction",
      pose: "react",
      targetId,
      eyelineTargetId: targetId
    }
  ];
  if (outcome === "continue") {
    return deepFreeze([
      ...common,
      { kind: "settled", pose: "recover", finalPose: "idle", targetId }
    ]);
  }
  const material = materialRequest(metadata);
  return deepFreeze([
    ...common,
    {
      kind: "repair",
      pose: "repair",
      targetId,
      repairId: metadata.expedition.payoff.repairId,
      resolvedStateId: repairStateId(metadata),
      materialSoundId: material.entry.key,
      materialAudioKey: material.entry.src,
      audioRequest: material.request
    },
    { kind: "settled", pose: "recover", finalPose: "idle", targetId }
  ]);
}

function correctionSteps(model, metadata, outcome) {
  return deepFreeze([{
    kind: outcome === "model_required" ? "model_reaction" : "correction_reaction",
    pose: outcome === "model_required" ? "explain" : "recover",
    targetId: model.contactTargetId,
    repairAllowed: false,
    wonderAllowed: false,
    continuousMotion: metadata.reducedMotion !== true
  }]);
}

export function createGameFeelSequence(model, commitResult) {
  const metadata = model && typeof model === "object" ? sceneModelMetadata.get(model) : null;
  if (!metadata || !sceneModels.has(model) || metadata.missionTransition !== commitResult
    || !metadata.sourceAction) {
    throw new TypeError("game-feel sequence requires the exact branded model and bound transition");
  }
  if (!validateCurrentMissionTransition(commitResult, {
    missionId: model.missionId,
    phaseId: authoredActionId(metadata.sourceAction),
    revision: model.revision
  }) || !OUTCOMES.has(commitResult.outcome)) {
    throw new TypeError("game-feel sequence transition is forged, stale, or cross-action");
  }
  if (!nonempty(model.contactTargetId)
    || !nonempty(model.committedConstruct)
    || POWER_EFFECTS[metadata.sourceAction.powerId] !== model.literacyEffectId) {
    throw new TypeError("game-feel sequence model lost its authored literacy contact");
  }
  const outcome = commitResult.outcome;
  const resolvedStateId = outcome === "advance" ? repairStateId(metadata) : null;
  const steps = ["advance", "continue"].includes(outcome)
    ? successfulSteps(model, metadata, outcome)
    : correctionSteps(model, metadata, outcome);
  const semanticFinalState = deepFreeze({
    missionId: model.missionId,
    phaseId: commitResult.phaseId,
    outcome,
    targetId: model.contactTargetId,
    construct: ["advance", "continue"].includes(outcome) ? model.committedConstruct : null,
    literacyEffectId: ["advance", "continue"].includes(outcome) ? model.literacyEffectId : null,
    eyelineTargetId: ["advance", "continue"].includes(outcome) ? model.contactTargetId : null,
    resolvedStateId,
    finalPose: ["advance", "continue"].includes(outcome)
      ? "idle"
      : outcome === "model_required" ? "explain" : "recover"
  });
  return deepFreeze({
    kind: "sound_seekers_game_feel_sequence",
    missionId: model.missionId,
    phaseId: commitResult.phaseId,
    outcome,
    steps,
    semanticFinalState,
    continuousMotion: metadata.reducedMotion !== true,
    particles: metadata.reducedMotion !== true && ["advance", "continue"].includes(outcome),
    squashAndStretch: metadata.reducedMotion !== true && ["advance", "continue"].includes(outcome),
    contactOutline: ["advance", "continue"].includes(outcome)
  });
}
