export const MEDIA_QA_STATUSES = ["unreviewed", "approved", "rejected", "needs_kimi", "blocked"];

const STORAGE_KEY = "lpMediaQaOverrides";
const BAD_IMAGE_WORDS = ["rainbow", "sparkle", "sparkly", "glow", "aura", "multicolor", "psychedelic"];
const BLOCKING_STATUSES = new Set(["rejected", "blocked", "needs_kimi"]);

export const mediaQaSeedManifest = [];

export function normalizeMediaPath(filePath = "") {
  return String(filePath || "").trim();
}

export function getMediaQaId(mediaType, filePath) {
  return `${mediaType}:${normalizeMediaPath(filePath)}`;
}

export function readMediaQaOverrides() {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function writeMediaQaOverrides(overrides = {}) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

export function getQuestionMediaPaths(question = {}) {
  const imagePaths = [
    question.imagePath,
    question.imageUrl,
    question.image,
    ...(question.imageCards || []).flatMap(card => [card.image, card.imageUrl, card.imagePath]),
    ...(question.promptImageCards || []).flatMap(card => [card.image, card.imageUrl, card.imagePath]),
    ...(question.answerOptions || []).flatMap(option => [option?.image, option?.imageUrl, option?.imagePath]),
    ...Object.values(question.choiceImages || {}).flatMap(asset => [asset?.image, asset?.imageUrl, asset?.imagePath])
  ].filter(Boolean);

  const audioPaths = [
    question.audioPath,
    question.audioUrl,
    question.audio,
    ...(question.imageCards || []).flatMap(card => [card.audio, card.audioUrl, card.audioPath]),
    ...(question.answerOptions || []).flatMap(option => [option?.audio, option?.audioUrl, option?.audioPath])
  ].filter(Boolean);

  return {
    image: [...new Set(imagePaths.map(normalizeMediaPath))],
    audio: [...new Set(audioPaths.map(normalizeMediaPath))]
  };
}

function inferTargetWord(question = {}, filePath = "") {
  const fromQuestion = question.targetWord || question.anchorWord || question.audioText || question.answer || question.correctAnswer || question.itemKey;
  if (fromQuestion) return String(fromQuestion);
  const fileName = filePath.split("/").pop() || "";
  return fileName.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
}

function getHeuristicFlags(mediaType, filePath = "") {
  if (mediaType !== "image") return [];
  const lower = filePath.toLowerCase();
  return BAD_IMAGE_WORDS.filter(flag => lower.includes(flag));
}

export function buildMediaQaRecords(questions = [], overrides = readMediaQaOverrides()) {
  const records = new Map();

  for (const question of questions) {
    const paths = getQuestionMediaPaths(question);
    for (const mediaType of ["image", "audio"]) {
      for (const filePath of paths[mediaType]) {
        const id = getMediaQaId(mediaType, filePath);
        const existing = records.get(id) || {
          id,
          mediaType,
          targetWord: inferTargetWord(question, filePath),
          skillId: question.skillId || question.skill || "",
          skillName: question.skillName || question.skill || "",
          level: question.level || question.difficultyLevel || "",
          filePath,
          linkedQuestionIds: [],
          status: "unreviewed",
          rejectionReason: "",
          reviewerNotes: "",
          reviewedAt: "",
          reviewedBy: "",
          heuristicFlags: getHeuristicFlags(mediaType, filePath),
          replacementPath: ""
        };

        existing.linkedQuestionIds.push(question.id);
        if (!existing.skillName && question.skill) existing.skillName = question.skill;
        if (!existing.targetWord) existing.targetWord = inferTargetWord(question, filePath);
        records.set(id, existing);
      }
    }
  }

  for (const seed of mediaQaSeedManifest) {
    records.set(seed.id, { ...records.get(seed.id), ...seed });
  }

  return [...records.values()].map(record => ({
    ...record,
    linkedQuestionIds: [...new Set(record.linkedQuestionIds || [])],
    ...(overrides[record.id] || {})
  })).sort((a, b) =>
    a.mediaType.localeCompare(b.mediaType) ||
    String(a.skillName).localeCompare(String(b.skillName)) ||
    String(a.targetWord).localeCompare(String(b.targetWord))
  );
}

export function isMediaQaRuntimeAllowed(filePath, mediaType = "image", options = {}) {
  const id = getMediaQaId(mediaType, filePath);
  const seed = mediaQaSeedManifest.find(record => record.id === id);
  const override = readMediaQaOverrides()[id];
  const status = override?.status || seed?.status || "unreviewed";
  if (status === "needs_kimi" && options.reviewMode) return true;
  return !BLOCKING_STATUSES.has(status);
}

export function isQuestionBlockedByMediaQa(question = {}, options = {}) {
  const paths = getQuestionMediaPaths(question);
  return paths.image.some(filePath => !isMediaQaRuntimeAllowed(filePath, "image", options));
}

export function updateMediaQaRecords(recordIds, patch) {
  const overrides = readMediaQaOverrides();
  const now = new Date().toISOString();
  for (const id of recordIds) {
    overrides[id] = {
      ...(overrides[id] || {}),
      ...patch,
      reviewedAt: now
    };
  }
  writeMediaQaOverrides(overrides);
  return overrides;
}
