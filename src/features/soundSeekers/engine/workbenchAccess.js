import { getPronunciation } from "../content/pronunciationLexicon.js";
import {
  projectMissionWorkbenchAuthority,
  validateCurrentMissionTransition
} from "./missionResponseCommit.js";

const missionStates = new WeakMap();
const currentMissions = new Map();
const models = new WeakMap();
const accesses = new WeakMap();

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export function registerCurrentWorkbenchMissionState(state) {
  const prior = currentMissions.get(state.plan.id);
  if (prior) missionStates.delete(prior);
  missionStates.set(state, { missionId: state.plan.id, revision: state.missionRevision });
  currentMissions.set(state.plan.id, state);
  return state;
}

export function registerWordWorkbenchModel(model, powerState, challenge) {
  models.set(model, { powerState, challenge });
  return model;
}

function assertCurrentPair(missionState, model) {
  const mission = missionStates.get(missionState);
  const binding = models.get(model);
  if (!mission || currentMissions.get(mission.missionId) !== missionState || !binding
    || missionState.activity !== binding.powerState
    || missionState.challenge !== binding.challenge
    || binding.challenge.powerId !== "word_forge") {
    throw new Error("workbench access requires the exact current mission child view");
  }
  return binding;
}

export function issueWordWorkbenchAccess({
  missionState,
  model,
  pronunciation = null,
  transition = null,
  meaningPayoff = null
} = {}) {
  const mission = missionStates.get(missionState);
  if (!mission || currentMissions.get(mission.missionId) !== missionState) {
    throw new Error("workbench access requires the exact current mission revision");
  }
  const binding = models.get(model);
  if (!binding) throw new Error("workbench access requires an issued child view");
  if (transition === null) assertCurrentPair(missionState, model);
  let cue = null;
  if (pronunciation !== null) {
    const canonical = getPronunciation(pronunciation.id || pronunciation.word);
    if (canonical !== pronunciation || binding.challenge.wordId !== canonical?.id) {
      throw new Error("workbench pronunciation is not bound to the current word challenge");
    }
    cue = canonical;
  }
  let correctionPresentation = null;
  let morphology = null;
  if (transition !== null) {
    const expected = {
      missionId: missionState.plan.id,
      phaseId: transition.phaseId,
      revision: missionState.missionRevision
    };
    if (!validateCurrentMissionTransition(transition, expected)) {
      throw new Error("workbench transition is stale or cross-mission");
    }
    const authority = projectMissionWorkbenchAuthority(transition, expected, binding);
    if (!authority) {
      throw new Error("workbench transition does not own this child view");
    }
    correctionPresentation = authority.correctionPresentation;
    if (authority.outcome === "advance" && authority.morphology) morphology = authority.morphology;
  }
  if (meaningPayoff !== null) throw new Error("workbench meaning payoff awaits authenticated visual access");
  const access = deepFreeze({ kind: "sound_seekers_workbench_access" });
  accesses.set(access, {
    missionId: missionState.plan.id,
    revision: missionState.missionRevision,
    model,
    cue,
    correctionPresentation,
    morphology,
    meaningPayoff: null
  });
  return access;
}

export function projectWordWorkbenchAccess(access, model) {
  const authority = accesses.get(access);
  if (!authority || authority.model !== model) return null;
  const current = currentMissions.get(authority.missionId);
  if (!current || current.missionRevision !== authority.revision) return null;
  return deepFreeze({
    pronunciation: authority.cue,
    correctionPresentation: authority.correctionPresentation,
    morphology: authority.morphology,
    meaningPayoff: authority.meaningPayoff
  });
}
