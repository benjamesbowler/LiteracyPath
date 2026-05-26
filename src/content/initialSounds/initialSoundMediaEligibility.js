import { isMediaQaRuntimeAllowed } from "../../data/mediaQaManifest.js";
import { hasImportedInitialSoundImage } from "./initialSoundMediaManifest.js";

const BLOCKED_QA_STATUSES = new Set([
  "rejected",
  "blocked",
  "needs_kimi",
  "needs_image_replacement",
  "draft_needs_assets",
  "bad_image",
  "bad_audio",
  "excluded_unsuitable_word",
  "excluded_phrase_target",
  "excluded_ambiguous_word"
]);

export function getInitialSoundMediaEligibility(item, options = {}) {
  const reasons = [];
  if (!item) reasons.push("missing item");
  if (item?.active === false) reasons.push(item.qaNotes || item.qaStatus || "inactive item");
  if (item?.qaStatus && BLOCKED_QA_STATUSES.has(item.qaStatus)) reasons.push(`blocked qaStatus: ${item.qaStatus}`);
  if (!hasImportedInitialSoundImage(item)) reasons.push("missing imported image");
  if (item?.imageUrl && !isMediaQaRuntimeAllowed(item.imageUrl, "image", options)) {
    reasons.push("image blocked by media QA");
  }
  if (item?.audioUrl && !isMediaQaRuntimeAllowed(item.audioUrl, "audio", options)) {
    reasons.push("audio blocked by media QA");
  }

  return {
    eligible: reasons.length === 0,
    reasons
  };
}

export function isInitialSoundRuntimeEligible(item, options = {}) {
  return getInitialSoundMediaEligibility(item, options).eligible;
}
