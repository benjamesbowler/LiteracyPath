import { localStudentPreferenceStorageKey } from "./progressKeys.js";
import { isProgressWriteBlocked } from "./progressSync.js";

// Shared by routing and descriptive reports. Familiarity is an observation,
// never a score; absence from this device's history does not prove freshness.
const text = value => typeof value === "string" ? value.trim() : "";
const normalized = value => text(value).toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, " ");
export const hasLiteracySupport = response => response?.supportUsed === true
  || (Array.isArray(response?.supportUsed) && response.supportUsed.length > 0)
  || response?.evidenceType === "supported" || response?.responseStatus === "supported";
export const isKnownLiteracyFamiliar = response => response?.knownFamiliar === true
  || response?.priorPracticeExposure === true || response?.knownPracticeFamiliarity === true
  || response?.priorItemExposure === true || response?.priorPassageExposure === true || response?.priorFamilyExposure === true
  || response?.repeated === true || ["known_familiar", "familiar", "previously_practiced"].includes(response?.familiarity);

export function isEligibleLiteracyResponse(response) {
  return isValidUnsupportedLiteracyResponse(response) && !isKnownLiteracyFamiliar(response);
}

export function isValidUnsupportedLiteracyResponse(response) {
  if (!response || typeof response.isCorrect !== "boolean" || hasLiteracySupport(response)) return false;
  if (response.conflicted || response.validity === "invalid" || response.mediaReady === false) return false;
  if (response.responseStatus && response.responseStatus !== "answered") return false;
  if (response.presentationRole && response.presentationRole !== "first_probe") return false;
  if (response.audioRequired === true && typeof response.audioDelivery === "string" && response.audioDelivery !== "delivered") return false;
  if (response.audioRequired === true && !(response.targetDelivered === true || response.audioDelivery === "delivered" || response.targetDelivery === "completed")) return false;
  return response.evidenceType === "independent" || response.evidenceUse === "independent_practice_response";
}

export function canonicalLiteracyIdentity(value = {}) {
  const snapshot = value.itemSnapshot || value.questionSnapshot || value;
  return {
    itemId: text(value.exposureItemId || snapshot.canonicalItemId || snapshot.sourceItemId || value.questionId || snapshot.id),
    passageKey: normalized(value.exposurePassageKey || snapshot.canonicalPassageId || snapshot.passage || snapshot.stimulusKey),
    familyId: text(value.exposureFamilyId || snapshot.exposureFamilyId || snapshot.itemFamilyId)
  };
}

export function buildLiteracyExposureIndex({ practiceRecord, mockRuns = [], responses = [], exposures = [] } = {}) {
  const index = { items: new Set(), passages: new Set(), families: new Set() };
  const recorded = [...exposures, ...responses, ...mockRuns.flatMap(run => [...(run?.responses || []), ...(run?.mediaFailures || [])]),
    ...(practiceRecord?.completions || []).flatMap(event => event.steps || [])];
  for (const value of recorded) {
    const identity = canonicalLiteracyIdentity(value);
    if (identity.itemId) index.items.add(identity.itemId);
    if (identity.passageKey) index.passages.add(identity.passageKey);
    if (identity.familyId) index.families.add(identity.familyId);
  }
  return index;
}

export function getLiteracyExposure(item, index) {
  const identity = canonicalLiteracyIdentity(item);
  const priorItemExposure = Boolean(identity.itemId && index?.items?.has(identity.itemId));
  const priorPassageExposure = Boolean(identity.passageKey && index?.passages?.has(identity.passageKey));
  const priorFamilyExposure = Boolean(identity.familyId && index?.families?.has(identity.familyId));
  const familiarityReasons = [priorItemExposure && "item", priorPassageExposure && "passage", priorFamilyExposure && "family"].filter(Boolean);
  return { knownFamiliar: familiarityReasons.length ? true : null, familiarityReasons,
    priorItemExposure, priorPassageExposure, priorFamilyExposure,
    exposureItemId: identity.itemId, exposurePassageKey: identity.passageKey, exposureFamilyId: identity.familyId };
}

const localKey = studentId => localStudentPreferenceStorageKey("literacy_exposure", studentId);
export function readLiteracyExposures(studentId, storage = globalThis.localStorage) {
  if (!studentId) return [];
  try { const value = JSON.parse(storage?.getItem(localKey(studentId)) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; }
}
export function recordLiteracyExposures(studentId, values, storage = globalThis.localStorage) {
  if (!studentId || isProgressWriteBlocked(studentId, "literacy_exposure")) return;
  const identities = new Map(readLiteracyExposures(studentId, storage).map(value => [JSON.stringify(canonicalLiteracyIdentity(value)), value]));
  for (const value of values || []) {
    const id = canonicalLiteracyIdentity(value);
    if (!id.itemId && !id.passageKey && !id.familyId) continue;
    identities.set(JSON.stringify(id), { exposureItemId: id.itemId, exposurePassageKey: id.passageKey, exposureFamilyId: id.familyId });
  }
  try { storage?.setItem(localKey(studentId), JSON.stringify([...identities.values()])); } catch { /* Remote snapshots still preserve confirmed exposure; local history may be incomplete. */ }
}

export function literacyEvidenceConditions(response = {}) {
  const snapshot = response.itemSnapshot || response.questionSnapshot || response;
  const access = snapshot.passageAccess || response.passageAccess;
  const mode = snapshot.modality || snapshot.literacyModality || snapshot.evidenceModality;
  const audio = mode === "listening" || mode === "audio" || access === "audio_only";
  const textAndAudio = access === "text_and_audio" || snapshot.passageAudioUsed === true
    || (Boolean(snapshot.passage) && snapshot.displayPassageDuringResponse === true && audio);
  return {
    construct: snapshot.constructClaim || response.constructClaim || response.skillId || "Construct not recorded",
    modality: textAndAudio ? "Text and audio comprehension" : audio ? "Listening comprehension" : snapshot.passage ? "Printed-text comprehension" : mode || "Access mode not recorded",
    support: hasLiteracySupport(response) ? "Help recorded" : "No help recorded",
    administration: response.administration || snapshot.administration || "Administration not recorded"
  };
}
