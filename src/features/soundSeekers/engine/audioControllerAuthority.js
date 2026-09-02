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
const CORRECTION_TEXT = "Try again";
const CORRECTION_PATH = getLedaInstructionAudioPath(CORRECTION_TEXT);
const sceneById = new Map(CONNECTED_TEXT_RECORDS.map(record => [record.id, record]));
const meaningByWordId = new Map(MEANING_SUPPORT_RECORDS.map(record => [record.wordId, record]));
const stopById = new Map(QUEST_STOPS.map(stop => [stop.id, stop]));
const chapterById = new Map(QUEST_CHAPTERS.map(chapter => [chapter.id, chapter]));
const completedReceiptMetadata = new WeakMap();
const activeOwnerByCueId = new Map();
const completedReceiptByCueId = new Map();
const cueIdsByController = new WeakMap();
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
  if (raw.cueId !== "correction:try-again" || !CORRECTION_PATH
    || raw.audioKey !== CORRECTION_PATH || raw.visibleText !== CORRECTION_TEXT
    || raw.requiresAudio !== true) return null;
  return CORRECTION_PATH;
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

export function validateCompletedAudioDeliveryReceipt(delivery, expectedRequest) {
  const metadata = completedReceiptMetadata.get(delivery);
  if (!metadata || metadata.productionOwned !== true
    || completedReceiptByCueId.get(metadata.request.cueId) !== delivery
    || delivery.status !== "completed" || !Object.isFrozen(delivery)
    || !plainDataRecord(expectedRequest, REQUEST_KEYS)) return false;
  return REQUEST_KEYS.every(key => metadata.request[key] === expectedRequest[key]);
}

export function createSoundSeekersAudioController({
  cuePlayer = PRODUCTION_CUE_PLAYER,
  clock = () => Date.now(),
  enabled = true,
  scopeKey = "default"
} = {}) {
  if (!cuePlayer || typeof cuePlayer.playCueAudio !== "function"
    || typeof cuePlayer.stopCueAudio !== "function"
    || typeof clock !== "function" || typeof enabled !== "boolean"
    || typeof scopeKey !== "string" || !scopeKey.trim()) {
    throw new Error("Sound Seekers audio controller requires canonical playback dependencies");
  }
  const productionOwned = cuePlayer.playCueAudio === playCueAudio
    && cuePlayer.stopCueAudio === stopCueAudio;
  const controllerIdentity = Object.freeze({ scopeKey });
  const listeners = new Set();
  let active = null;
  let snapshot = deepFreeze({ request: null, delivery: null });
  let disposed = false;

  function publish(next) {
    snapshot = deepFreeze(next);
    for (const listener of listeners) listener(snapshot);
  }

  function invalidateOwnedReceipts() {
    for (const cueId of cueIdsByController.get(controllerIdentity) || []) {
      const owner = activeOwnerByCueId.get(cueId);
      if (owner?.controllerIdentity === controllerIdentity) activeOwnerByCueId.delete(cueId);
      const receipt = completedReceiptByCueId.get(cueId);
      if (completedReceiptMetadata.get(receipt)?.controllerIdentity === controllerIdentity) {
        completedReceiptByCueId.delete(cueId);
      }
    }
    cueIdsByController.delete(controllerIdentity);
  }

  function interruptActive({ stop = true } = {}) {
    const owned = active;
    if (!owned) return;
    active = null;
    const owner = activeOwnerByCueId.get(owned.request.cueId);
    if (owner?.controllerIdentity === controllerIdentity && owner.request === owned.request) {
      activeOwnerByCueId.delete(owned.request.cueId);
    }
    if (stop) cuePlayer.stopCueAudio();
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

  function begin(rawRequest) {
    if (disposed) throw new Error("audio controller is disposed");
    const canonical = canonicalRequest(rawRequest);
    interruptActive();
    completedReceiptByCueId.delete(canonical.request.cueId);
    activeOwnerByCueId.set(canonical.request.cueId, {
      controllerIdentity,
      request: canonical.request
    });
    const cueIds = cueIdsByController.get(controllerIdentity) || new Set();
    cueIds.add(canonical.request.cueId);
    cueIdsByController.set(controllerIdentity, cueIds);
    let delivery = createAudioDelivery(canonical.request.cueId);
    publish({ request: canonical.request, delivery });
    if (!enabled) {
      activeOwnerByCueId.delete(canonical.request.cueId);
      return snapshot;
    }
    const owned = { request: canonical.request, delivery };
    active = owned;
    cuePlayer.playCueAudio(canonical.playbackPath, {
      cueId: canonical.request.cueId,
      onDelivery(event) {
        if (active !== owned) return;
        const nextDelivery = reduceAudioDelivery(owned.delivery, event);
        if (nextDelivery === owned.delivery) return;
        owned.delivery = nextDelivery;
        delivery = nextDelivery;
        if (delivery.status === "completed") {
          const owner = activeOwnerByCueId.get(canonical.request.cueId);
          if (productionOwned && owner?.controllerIdentity === controllerIdentity
            && owner.request === canonical.request) {
            completedReceiptMetadata.set(delivery, {
              controllerIdentity,
              request: canonical.request,
              productionOwned: true
            });
            completedReceiptByCueId.set(canonical.request.cueId, delivery);
          }
          activeOwnerByCueId.delete(canonical.request.cueId);
        }
        publish({ request: canonical.request, delivery });
        if (TERMINAL_STATUSES.has(delivery.status)) active = null;
      }
    });
    return snapshot;
  }

  return Object.freeze({
    getSnapshot() { return snapshot; },
    subscribe(listener) {
      if (typeof listener !== "function" || disposed) {
        throw new Error("audio subscription is invalid");
      }
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    request(request) { return begin(request); },
    replay() {
      if (!snapshot.request) throw new Error("audio replay needs a prior request");
      return begin(snapshot.request);
    },
    cancel() {
      if (disposed) return snapshot;
      interruptActive();
      invalidateOwnedReceipts();
      return snapshot;
    },
    dispose() {
      if (disposed) return;
      interruptActive();
      invalidateOwnedReceipts();
      listeners.clear();
      disposed = true;
    }
  });
}
