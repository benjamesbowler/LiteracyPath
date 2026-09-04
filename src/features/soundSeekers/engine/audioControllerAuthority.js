import { getChildWordAsset } from "../../../data/childAssets.js";
import { getLedaInstructionAudioPath } from "../../../data/ledaProductionAudio.js";
import { getPreferredPhonemeAudioPath } from "../../../data/phonemeAudioBank.js";
import { QUEST_CHAPTERS } from "../../../data/questChapters.js";
import { QUEST_STOPS } from "../../../data/questSequence.js";
import { playCueAudio, stopCueAudio } from "../../../utils/audio/cuePlayer.js";
import { questChapterMaterialSfxEntry } from "../../../utils/questActionAudio.js";
import { graphemeLabel } from "../../../utils/questLabels.js";
import { CONNECTED_TEXT_RECORDS } from "../content/connectedTextRecords.js";
import { getInstructionContract } from "../content/instructionContracts.js";
import { MEANING_SUPPORT_RECORDS } from "../content/meaningSupportRecords.js";
import {
  MORPHOLOGY_TEACH_EXAMPLES,
  SOUND_SEEKERS_TEACH_TARGETS
} from "../content/teachTargetMetadata.js";
import { createAudioDelivery, reduceAudioDelivery } from "./audioDelivery.js";

const REQUEST_KEYS = Object.freeze([
  "cueId", "audioKey", "visibleText", "spokenText", "kind", "requiresAudio"
]);
const BINDING_KEYS = Object.freeze(["scopeKey", "missionId", "phaseId", "attemptId"]);
const TERMINAL_STATUSES = new Set(["completed", "interrupted", "failed"]);
const INSTRUCTION_BY_TEACH_KIND = Object.freeze({
  blend: "consonant-blend-teach",
  alt: "alternative-value-teach",
  morph: "morphology-teach",
  digraph: "letter-team-teach",
  double: "letter-team-teach",
  split: "letter-team-teach",
  team: "letter-team-teach",
  "r-controlled": "letter-team-teach",
  suffix: "letter-team-teach"
});
const CORRECTION_RUNG_TEXT = Object.freeze({
  retry: "Try again",
  narrow: "Listen carefully",
  teach: "Watch me first"
});
const sceneById = new Map(CONNECTED_TEXT_RECORDS.map(record => [record.id, record]));
const meaningByWordId = new Map(MEANING_SUPPORT_RECORDS.map(record => [record.wordId, record]));
const stopById = new Map(QUEST_STOPS.map(stop => [stop.id, stop]));
const chapterById = new Map(QUEST_CHAPTERS.map(chapter => [chapter.id, chapter]));
const completedReceiptMetadata = new WeakMap();
const completedReceiptByAuthorityKey = new Map();
const receiptsByController = new WeakMap();
const controllerRecordByIdentity = new WeakMap();
const currentControllerByScope = new Map();
const PRODUCTION_CUE_PLAYER = Object.freeze({ playCueAudio, stopCueAudio });

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function plainDataRecord(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype) return false;
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.length !== keys.length
    || ownKeys.some(key => typeof key !== "string" || !keys.includes(key))) return false;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  return keys.every(key => Object.hasOwn(descriptors[key], "value")
    && descriptors[key].enumerable === true);
}

function canonicalBinding(raw, scopeKey) {
  if (!plainDataRecord(raw, BINDING_KEYS)
    || BINDING_KEYS.some(key => typeof raw[key] !== "string" || !raw[key].trim())
    || raw.scopeKey !== scopeKey) {
    throw new Error("audio authority binding must exactly match scope, mission, phase, and attempt");
  }
  return Object.freeze(Object.fromEntries(BINDING_KEYS.map(key => [key, raw[key]])));
}

function sameBinding(left, right) {
  if (left === right) return true;
  if (!left || !right) return false;
  return BINDING_KEYS.every(key => left[key] === right[key]);
}

function authorityKey(scopeKey, binding, cueId) {
  return JSON.stringify(binding
    ? BINDING_KEYS.map(key => binding[key]).concat(cueId)
    : [scopeKey, "presentation", cueId]);
}

function capturedCuePlayer(raw) {
  try {
    if (!raw || typeof raw !== "object" || Object.getPrototypeOf(raw) !== Object.prototype
      || Reflect.ownKeys(raw).length !== 2) {
      throw new Error("invalid player");
    }
    const descriptors = Object.getOwnPropertyDescriptors(raw);
    if (!Object.hasOwn(descriptors.playCueAudio, "value")
      || !Object.hasOwn(descriptors.stopCueAudio, "value")
      || typeof descriptors.playCueAudio.value !== "function"
      || typeof descriptors.stopCueAudio.value !== "function") {
      throw new Error("invalid player");
    }
    return Object.freeze({
      play: descriptors.playCueAudio.value,
      stop: descriptors.stopCueAudio.value,
      productionOwned: raw === PRODUCTION_CUE_PLAYER
    });
  } catch {
    throw new Error("Sound Seekers audio controller requires canonical playback dependencies");
  }
}

function instructionPath(instructionId) {
  return `/audio/quest-v2/instructions/${instructionId}.mp3`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function teachAudioKeys(entry) {
  const instructionId = INSTRUCTION_BY_TEACH_KIND[entry.kind] || "single-sound-teach";
  const contract = getInstructionContract(instructionId);
  const metadata = SOUND_SEEKERS_TEACH_TARGETS[entry.id] || null;
  if (!contract || (!metadata && entry.kind !== "morph")) return null;
  const targetAudio = entry.kind === "morph" || entry.kind === "blend"
    ? null
    : getPreferredPhonemeAudioPath(metadata.cueKey || entry.id, { anchor: metadata.word });
  const targetAudioSequence = entry.kind === "blend"
    ? metadata.units.map(unit => getPreferredPhonemeAudioPath(unit.soundKey, {
      anchor: metadata.word
    }))
    : [];
  const targetAudioAlternates = (metadata?.alternates || []).map(alternate => (
    getPreferredPhonemeAudioPath(alternate.cueKey, { anchor: alternate.word })
  ));
  if (entry.kind !== "morph"
    && (!unique([targetAudio, ...targetAudioSequence]).length
      || [...targetAudioSequence, ...targetAudioAlternates].some(path => !path))) return null;
  if (entry.kind === "morph" && !MORPHOLOGY_TEACH_EXAMPLES[entry.id]) return null;
  return {
    contract,
    audioKeys: unique([
      contract.childAudio,
      targetAudio,
      ...targetAudioSequence,
      ...targetAudioAlternates
    ])
  };
}

function resolveTeachRequest(raw) {
  const match = /^teach:(s(?:[1-9]|[1-3][0-9]|40)):(0|[1-9][0-9]*):([^:]+):(0|[1-9][0-9]*)$/u
    .exec(raw.cueId);
  const stop = match ? stopById.get(match[1]) : null;
  const teachIndex = Number(match?.[2]);
  const ordinal = Number(match?.[4]);
  const entry = stop?.teach?.[teachIndex];
  const plan = entry && entry.id === match[3] ? teachAudioKeys(entry) : null;
  const audioKey = plan?.audioKeys[ordinal];
  if (!plan || audioKey !== raw.audioKey
    || raw.visibleText !== plan.contract.childText
    || raw.requiresAudio !== true) return null;
  return audioKey.startsWith("quest/instructions/")
    ? instructionPath(plan.contract.instructionId)
    : audioKey;
}

function resolveInstructionRequest(raw) {
  const match = /^instruction:([a-z]+(?:-[a-z]+)+)$/u.exec(raw.cueId);
  const contract = match ? getInstructionContract(match[1]) : null;
  if (!contract || raw.audioKey !== contract.childAudio
    || raw.visibleText !== contract.childText || raw.requiresAudio !== true) return null;
  return instructionPath(contract.instructionId);
}

function resolveSceneRequest(raw) {
  const match = /^(scene-s(?:[1-9]|[1-3][0-9]|40)):(text|prompt)$/u.exec(raw.cueId);
  const scene = match ? sceneById.get(match[1]) : null;
  const field = match?.[2];
  const expectedKey = field === "text" ? scene?.textAudioKey : scene?.prompt?.audioKey;
  const expectedText = field === "text" ? scene?.text : scene?.prompt?.text;
  if (!scene || raw.kind !== `scene_${field}` || raw.audioKey !== expectedKey
    || raw.visibleText !== expectedText || raw.requiresAudio !== true) return null;
  return `/audio/quest-v2/scenes/${scene.id}-${field}.mp3`;
}

function resolveMeaningRequest(raw) {
  const match = /^meaning:([a-z]+(?:-[a-z]+)*)$/u.exec(raw.cueId);
  const support = match ? meaningByWordId.get(match[1]) : null;
  const text = support
    ? `${support.childDefinition} ${support.ellSupport.oralBridge} ${support.actionPrompt}`
    : null;
  if (!support || raw.audioKey !== support.audioKey || raw.visibleText !== text
    || raw.requiresAudio !== true) return null;
  return `/audio/quest-v2/meaning/${support.wordId}.mp3`;
}

function resolveWordRequest(raw) {
  const match = /^word:([a-z]+(?:-[a-z]+)*)$/u.exec(raw.cueId);
  const wordId = match?.[1] || "";
  const asset = wordId ? getChildWordAsset(wordId) : null;
  if (!asset?.audio || raw.audioKey !== asset.audio
    || raw.visibleText.toLocaleLowerCase("en-US") !== wordId
    || raw.requiresAudio !== true) return null;
  return asset.audio;
}

function resolveTargetRequest(raw) {
  const match = /^target:([^:]+):([a-z]+(?:-[a-z]+)*)$/u.exec(raw.cueId);
  const targetId = match?.[1] || "";
  const anchor = match?.[2] || "";
  const path = targetId && anchor
    ? getPreferredPhonemeAudioPath(targetId, { anchor }) : "";
  if (!path || raw.audioKey !== path || raw.visibleText !== graphemeLabel(targetId)
    || raw.requiresAudio !== true) return null;
  return path;
}

function resolveCorrectionRequest(raw) {
  const match = /^correction:(retry|narrow|teach)$/u.exec(raw.cueId);
  const text = match ? CORRECTION_RUNG_TEXT[match[1]] : null;
  const path = text ? getLedaInstructionAudioPath(text) : null;
  if (!text || !path || raw.audioKey !== path || raw.visibleText !== text
    || raw.requiresAudio !== true) return null;
  return path;
}

function resolveMaterialRequest(raw) {
  const match = /^material:([a-z]+(?:-[a-z]+)+)$/u.exec(raw.cueId);
  const chapter = match ? chapterById.get(match[1]) : null;
  const material = chapter ? questChapterMaterialSfxEntry(chapter.id) : null;
  const text = chapter ? `The ${chapter.title} repair settles into place.` : null;
  if (!material || raw.audioKey !== material.src || raw.visibleText !== text
    || raw.requiresAudio !== false) return null;
  return material.src;
}

function resolvePlaybackPath(raw) {
  if (raw.kind === "teach") return resolveTeachRequest(raw);
  if (raw.kind === "instruction") return resolveInstructionRequest(raw);
  if (raw.kind === "scene_text" || raw.kind === "scene_prompt") return resolveSceneRequest(raw);
  if (raw.kind === "meaning_support") return resolveMeaningRequest(raw);
  if (raw.kind === "whole_word") return resolveWordRequest(raw);
  if (raw.kind === "target") return resolveTargetRequest(raw);
  if (raw.kind === "correction") return resolveCorrectionRequest(raw);
  if (raw.kind === "material_effect") return resolveMaterialRequest(raw);
  return null;
}

function canonicalRequest(raw) {
  if (!plainDataRecord(raw, REQUEST_KEYS)
    || typeof raw.cueId !== "string" || !raw.cueId.trim()
    || typeof raw.audioKey !== "string"
    || typeof raw.visibleText !== "string" || !raw.visibleText.trim()
    || raw.spokenText !== raw.visibleText
    || typeof raw.kind !== "string"
    || typeof raw.requiresAudio !== "boolean") {
    throw new Error("audio request must use the exact canonical shape");
  }
  const playbackPath = resolvePlaybackPath(raw);
  if (!playbackPath) throw new Error("audio request source and transcript are not canonical");
  return Object.freeze({
    request: deepFreeze(Object.fromEntries(REQUEST_KEYS.map(key => [key, raw[key]]))),
    playbackPath
  });
}

export function createSoundSeekersCorrectionAudioRequest(mode) {
  const text = CORRECTION_RUNG_TEXT[mode];
  const audioKey = text ? getLedaInstructionAudioPath(text) : null;
  if (!text || !audioKey) throw new Error("correction mode has no canonical recorded request");
  return deepFreeze({
    cueId: `correction:${mode}`,
    audioKey,
    visibleText: text,
    spokenText: text,
    kind: "correction",
    requiresAudio: true
  });
}

function receiptMatches(delivery, expectedRequest, expectedBinding = undefined) {
  const metadata = completedReceiptMetadata.get(delivery);
  if (!metadata || metadata.productionOwned !== true || metadata.valid !== true
    || completedReceiptByAuthorityKey.get(metadata.authorityKey) !== delivery
    || delivery.status !== "completed" || !Object.isFrozen(delivery)
    || !plainDataRecord(expectedRequest, REQUEST_KEYS)) return false;
  if (metadata.binding) {
    if (currentControllerByScope.get(metadata.binding.scopeKey) !== metadata.controllerIdentity) {
      return false;
    }
    if (!plainDataRecord(expectedBinding, BINDING_KEYS)
      || !sameBinding(metadata.binding, expectedBinding)) return false;
  } else if (expectedBinding !== undefined) return false;
  return REQUEST_KEYS.every(key => metadata.request[key] === expectedRequest[key]);
}

export function validateCompletedAudioDeliveryReceipt(delivery, expectedRequest, expectedBinding) {
  return receiptMatches(delivery, expectedRequest, expectedBinding);
}

export function consumeCompletedAudioDeliveryReceipt(delivery, expectedRequest, expectedBinding) {
  if (!receiptMatches(delivery, expectedRequest, expectedBinding)) return false;
  const metadata = completedReceiptMetadata.get(delivery);
  metadata.valid = false;
  metadata.consumed = true;
  if (completedReceiptByAuthorityKey.get(metadata.authorityKey) === delivery) {
    completedReceiptByAuthorityKey.delete(metadata.authorityKey);
  }
  return true;
}

export function createSoundSeekersAudioController({
  cuePlayer = PRODUCTION_CUE_PLAYER,
  clock = () => Date.now(),
  enabled = true,
  scopeKey = "default"
} = {}) {
  if (typeof clock !== "function" || typeof enabled !== "boolean"
    || typeof scopeKey !== "string" || !scopeKey.trim()) {
    throw new Error("Sound Seekers audio controller requires canonical playback dependencies");
  }
  const capturedPlayer = capturedCuePlayer(cuePlayer);
  const controllerIdentity = Object.freeze({ scopeKey });
  const listeners = new Set();
  let active = null;
  let currentBinding = null;
  let snapshot = deepFreeze({ request: null, delivery: null });
  let disposed = false;
  let operationRevision = 0;

  function publish(next) {
    snapshot = deepFreeze(next);
    for (const listener of listeners) listener(snapshot);
  }

  function invalidateOwnedReceipts() {
    for (const receipt of receiptsByController.get(controllerIdentity) || []) {
      const metadata = completedReceiptMetadata.get(receipt);
      if (!metadata) continue;
      metadata.valid = false;
      if (completedReceiptByAuthorityKey.get(metadata.authorityKey) === receipt) {
        completedReceiptByAuthorityKey.delete(metadata.authorityKey);
      }
    }
    receiptsByController.delete(controllerIdentity);
  }

  function interruptActive({ stop = true } = {}) {
    const owned = active;
    if (!owned) return;
    active = null;
    if (stop) capturedPlayer.stop();
    if (["loading", "started"].includes(owned.delivery.status)
      && Number.isInteger(owned.delivery.session)) {
      owned.delivery = reduceAudioDelivery(owned.delivery, {
        id: owned.request.cueId,
        session: owned.delivery.session,
        type: "interrupted",
        at: clock()
      });
      publish({ request: owned.request, delivery: owned.delivery });
    }
  }

  function begin(rawRequest, rawBinding = undefined) {
    if (disposed) throw new Error("audio controller is disposed");
    const canonical = canonicalRequest(rawRequest);
    const binding = rawBinding === undefined ? null : canonicalBinding(rawBinding, scopeKey);
    const operation = ++operationRevision;
    interruptActive();
    if (operation !== operationRevision) return snapshot;
    if (!sameBinding(currentBinding, binding)) {
      invalidateOwnedReceipts();
      currentBinding = binding;
    }
    if (binding) {
      const priorIdentity = currentControllerByScope.get(scopeKey);
      if (priorIdentity && priorIdentity !== controllerIdentity) {
        controllerRecordByIdentity.get(priorIdentity)?.invalidateOwnedReceipts();
      }
      currentControllerByScope.set(scopeKey, controllerIdentity);
    }
    const key = authorityKey(scopeKey, binding, canonical.request.cueId);
    const priorReceipt = completedReceiptByAuthorityKey.get(key);
    const priorMetadata = completedReceiptMetadata.get(priorReceipt);
    if (priorMetadata) priorMetadata.valid = false;
    completedReceiptByAuthorityKey.delete(key);
    let delivery = createAudioDelivery(canonical.request.cueId);
    publish({ request: canonical.request, delivery });
    if (operation !== operationRevision
      || (binding && currentControllerByScope.get(scopeKey) !== controllerIdentity)) return snapshot;
    if (!enabled) {
      return snapshot;
    }
    const owned = { request: canonical.request, delivery };
    active = owned;
    capturedPlayer.play(canonical.playbackPath, {
      cueId: canonical.request.cueId,
      onDelivery(event) {
        if (active !== owned
          || (binding && currentControllerByScope.get(scopeKey) !== controllerIdentity)) return;
        const nextDelivery = reduceAudioDelivery(owned.delivery, event);
        if (nextDelivery === owned.delivery) return;
        owned.delivery = nextDelivery;
        delivery = nextDelivery;
        if (delivery.status === "completed") {
          if (capturedPlayer.productionOwned) {
            const metadata = {
              controllerIdentity,
              request: canonical.request,
              binding,
              authorityKey: key,
              productionOwned: true,
              valid: true,
              consumed: false
            };
            completedReceiptMetadata.set(delivery, metadata);
            completedReceiptByAuthorityKey.set(key, delivery);
            const receipts = receiptsByController.get(controllerIdentity) || new Set();
            receipts.add(delivery);
            receiptsByController.set(controllerIdentity, receipts);
          }
        }
        publish({ request: canonical.request, delivery });
        if (TERMINAL_STATUSES.has(delivery.status) && active === owned) active = null;
      }
    });
    return snapshot;
  }

  const controller = Object.freeze({
    getSnapshot() { return snapshot; },
    subscribe(listener) {
      if (typeof listener !== "function" || disposed) {
        throw new Error("audio subscription is invalid");
      }
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    request(request, binding) { return begin(request, binding); },
    replay() {
      if (!snapshot.request) throw new Error("audio replay needs a prior request");
      return begin(snapshot.request, currentBinding || undefined);
    },
    cancel() {
      if (disposed) return snapshot;
      const operation = ++operationRevision;
      invalidateOwnedReceipts();
      currentBinding = null;
      interruptActive();
      if (operation !== operationRevision) return snapshot;
      return snapshot;
    },
    invalidate(binding = undefined) {
      if (disposed) return snapshot;
      if (binding !== undefined && !sameBinding(currentBinding, canonicalBinding(binding, scopeKey))) {
        return snapshot;
      }
      const operation = ++operationRevision;
      invalidateOwnedReceipts();
      currentBinding = null;
      interruptActive();
      if (operation !== operationRevision) return snapshot;
      return snapshot;
    },
    dispose() {
      if (disposed) return;
      operationRevision += 1;
      disposed = true;
      invalidateOwnedReceipts();
      if (currentControllerByScope.get(scopeKey) === controllerIdentity) {
        currentControllerByScope.delete(scopeKey);
      }
      currentBinding = null;
      listeners.clear();
      interruptActive();
    }
  });

  controllerRecordByIdentity.set(controllerIdentity, { invalidateOwnedReceipts });
  return controller;
}
