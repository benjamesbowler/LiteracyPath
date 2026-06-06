import { mediaQaReviewRows } from "./generated/mediaQaReview.generated.js";

export const MEDIA_QA_REVIEW_STORAGE_KEY = "lpUnifiedMediaQaReviewDecisions";
export const MEDIA_QA_REVIEW_STATUSES = ["pending", "approved", "quarantined"];

function normalize(value = "") {
  return String(value || "").trim();
}

function normalizeStatus(status = "") {
  return MEDIA_QA_REVIEW_STATUSES.includes(status) ? status : "pending";
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
  return normalizeStatus(row?.status || "pending");
}

export function isMediaPairingApproved(input = {}) {
  return getMediaQaStatus(input) === "approved";
}

export function isMediaPairingQuarantined(input = {}) {
  return getMediaQaStatus(input) === "quarantined";
}

export function applyMediaQaDecision(input = {}, status = "pending", notes = "") {
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
      : { ...item, reviewId, status: normalizeStatus(item.status || "pending") };
  });
}
