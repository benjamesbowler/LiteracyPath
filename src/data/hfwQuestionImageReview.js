import { hfwQuestionImageReviewRows } from "./generated/hfwQuestionImageReview.generated.js";

export const HFW_QUESTION_IMAGE_REVIEW_STORAGE_KEY = "lpHfwQuestionImageReviewOverrides";

export const HFW_QUESTION_IMAGE_QA_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "needs_replacement",
  "no_image_required"
];

export const HFW_QUESTION_IMAGE_REJECTION_REASONS = [
  "image_does_not_match_sentence",
  "photorealistic",
  "embedded_text_or_watermark",
  "wrong_style",
  "wrong_target",
  "ai_slop_anatomy",
  "too_cluttered",
  "unclear",
  "other"
];

export function normalizeHfwQuestionImagePath(value = "") {
  return String(value || "").trim();
}

export function getHfwQuestionId(questionOrId = {}) {
  if (typeof questionOrId === "string") return questionOrId;
  return String(questionOrId.approvedQuestionId || questionOrId.questionId || questionOrId.id || "");
}

export function getHfwQuestionImagePath(question = {}) {
  return normalizeHfwQuestionImagePath(
    question.imagePath ||
    question.imageUrl ||
    question.image ||
    question.primaryImage ||
    question.questionImage ||
    question.targetImagePath ||
    question.targetImageUrl ||
    question.targetImage ||
    ""
  );
}

export function getHfwQuestionImagePairKey(questionOrId = {}, imagePath = "") {
  return `${getHfwQuestionId(questionOrId)}::${normalizeHfwQuestionImagePath(imagePath)}`;
}

export function stripHfwQuestionImageFields(question = {}) {
  const out = { ...question };
  delete out.image;
  delete out.imageUrl;
  delete out.imagePath;
  delete out.primaryImage;
  delete out.questionImage;
  delete out.targetImage;
  delete out.targetImageUrl;
  delete out.targetImagePath;
  return out;
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function readHfwQuestionImageReviewOverrides() {
  if (!canUseLocalStorage()) return {};
  try {
    return JSON.parse(window.localStorage.getItem(HFW_QUESTION_IMAGE_REVIEW_STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

export function writeHfwQuestionImageReviewOverrides(overrides = {}) {
  if (!canUseLocalStorage()) return overrides;
  window.localStorage.setItem(HFW_QUESTION_IMAGE_REVIEW_STORAGE_KEY, JSON.stringify(overrides));
  return overrides;
}

function normalizeStatus(status = "") {
  return HFW_QUESTION_IMAGE_QA_STATUSES.includes(status) ? status : "pending";
}

export function mergeHfwQuestionImageReviewRows(overrides = readHfwQuestionImageReviewOverrides()) {
  return hfwQuestionImageReviewRows.map(row => {
    const key = getHfwQuestionImagePairKey(row.questionId, row.currentImagePath);
    const override = overrides[key] || overrides[row.questionId] || null;
    return override ? { ...row, ...override, qaStatus: normalizeStatus(override.qaStatus || row.qaStatus) } : row;
  });
}

export function updateHfwQuestionImageReviewOverride(row = {}, patch = {}) {
  const key = getHfwQuestionImagePairKey(row.questionId, row.currentImagePath);
  const overrides = readHfwQuestionImageReviewOverrides();
  const next = {
    ...overrides,
    [key]: {
      questionId: row.questionId,
      currentImagePath: row.currentImagePath || "",
      ...overrides[key],
      ...patch,
      qaStatus: normalizeStatus(patch.qaStatus || overrides[key]?.qaStatus || row.qaStatus)
    }
  };
  return writeHfwQuestionImageReviewOverrides(next);
}

export function findHfwQuestionImageReview(questionOrId = {}, imagePath = "", rows = mergeHfwQuestionImageReviewRows()) {
  const questionId = getHfwQuestionId(questionOrId);
  const normalizedPath = normalizeHfwQuestionImagePath(imagePath);
  return rows.find(row =>
    String(row.questionId || "") === questionId &&
    normalizeHfwQuestionImagePath(row.currentImagePath) === normalizedPath
  ) || null;
}

export function isHfwQuestionImagePairApproved(questionOrId = {}, imagePath = "") {
  const normalizedPath = normalizeHfwQuestionImagePath(imagePath);
  if (!normalizedPath) return false;
  const row = findHfwQuestionImageReview(questionOrId, normalizedPath);
  return Boolean(row && row.qaStatus === "approved");
}
