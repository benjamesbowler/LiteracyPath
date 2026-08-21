import { mediaQaReviewRows } from "./generated/mediaQaReview.generated.js";
import { isBetaMediaPairingTestVisible } from "../policy/betaReleasePolicy.js";

export const MEDIA_QA_REVIEW_STORAGE_KEY = "lpUnifiedMediaQaReviewDecisions";
export const MEDIA_QA_REVIEW_STATUSES = ["accepted", "quarantined"];

function normalize(value = "") {
  return String(value || "").trim();
}

function normalizeStatus(status = "") {
  if (status === "quarantined") return "quarantined";
  // Old generated rows and device-local decisions used pending/approved.
  // Both are accepted under the current pass-by-exception policy.
  return "accepted";
}

export function getMediaQaReviewId(input = {}) {
  return [
    input.area || "",
    input.skillId || "",
    input.questionId || "",
    input.bookId || "",
    input.pageId || "",
    input.imagePath || ""
  ].map(normalize).join("::");
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function readMediaQaReviewOverrides() {
  if (!canUseLocalStorage()) return {};
  try {
    return JSON.parse(window.localStorage.getItem(MEDIA_QA_REVIEW_STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

export function writeMediaQaReviewOverrides(overrides = {}) {
  if (!canUseLocalStorage()) return overrides;
  window.localStorage.setItem(MEDIA_QA_REVIEW_STORAGE_KEY, JSON.stringify(overrides));
  return overrides;
}

function generatedDecisionMap() {
  return new Map((mediaQaReviewRows || []).map(row => [row.reviewId || getMediaQaReviewId(row), row]));
}

export function getMediaQaReviewDecisions(overrides = readMediaQaReviewOverrides()) {
  const generated = generatedDecisionMap();
  const merged = new Map(generated);
  Object.entries(overrides || {}).forEach(([reviewId, override]) => {
    merged.set(reviewId, {
      ...(generated.get(reviewId) || {}),
      ...override,
      reviewId,
      status: normalizeStatus(override?.status)
    });
  });
  return merged;
}

export function getMediaQaStatus(input = {}, overrides = readMediaQaReviewOverrides()) {
  const reviewId = input.reviewId || getMediaQaReviewId(input);
  const row = getMediaQaReviewDecisions(overrides).get(reviewId);
  return normalizeStatus(row?.status || "accepted");
}

export function isMediaPairingAccepted(input = {}) {
  return getMediaQaStatus(input) === "accepted";
}

export function isMediaPairingApproved(input = {}) {
  return isMediaPairingAccepted(input);
}

export function isMediaPairingRuntimeAllowed(input = {}, overrides = readMediaQaReviewOverrides()) {
  return isBetaMediaPairingTestVisible(getMediaQaStatus(input, overrides));
}

export function isMediaPairingQuarantined(input = {}) {
  return getMediaQaStatus(input) === "quarantined";
}

export function applyMediaQaDecision(input = {}, status = "accepted", notes = "") {
  const reviewId = input.reviewId || getMediaQaReviewId(input);
  const overrides = readMediaQaReviewOverrides();
  const next = {
    ...overrides,
    [reviewId]: {
      ...input,
      reviewId,
      status: normalizeStatus(status),
      reviewedAt: new Date().toISOString(),
      notes: normalize(notes)
    }
  };
  return writeMediaQaReviewOverrides(next);
}

export function mergeMediaQaReviewItems(items = [], overrides = readMediaQaReviewOverrides()) {
  const decisions = getMediaQaReviewDecisions(overrides);
  return items.map(item => {
    const reviewId = item.reviewId || getMediaQaReviewId(item);
    const decision = decisions.get(reviewId);
    return decision
      ? { ...item, ...decision, reviewId, status: normalizeStatus(decision.status) }
      : { ...item, reviewId, status: normalizeStatus(item.status || "accepted") };
  });
}
