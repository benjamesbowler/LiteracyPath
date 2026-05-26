import { initialSoundWordBank } from "../content/initialSounds/initialSoundWordBank.js";
import { publicMediaInventory } from "./publicMediaInventory.js";

export const MEDIA_QA_STATUSES = ["unreviewed", "approved", "rejected", "needs_kimi", "blocked"];

const STORAGE_KEY = "lpMediaQaOverrides";
const BAD_IMAGE_WORDS = ["rainbow", "sparkle", "sparkly", "glow", "aura", "multicolor", "psychedelic"];
const BLOCKING_STATUSES = new Set(["rejected", "blocked", "needs_kimi"]);

export function normalizeMediaPath(filePath = "") {
  return String(filePath || "").trim();
}

export function getMediaQaId(mediaType, filePath) {
  return `${mediaType}:${normalizeMediaPath(filePath)}`;
}

function buildInitialSoundMediaQaSeedManifest() {
  return initialSoundWordBank.flatMap(item => {
    const base = {
      targetWord: item.targetWord,
      skillId: "initial_sounds",
      skillName: "Initial Sounds",
      level: item.level,
      linkedQuestionIds: [item.id],
      status: item.active === false ? "blocked" : "unreviewed",
      rejectionReason: item.active === false ? item.qaNotes || "Inactive Initial Sounds target." : "",
      reviewerNotes: item.active === false ? item.qaStatus || "" : "",
      reviewedAt: "",
      reviewedBy: "",
      replacementPath: ""
    };

    return [
      {
        ...base,
        id: getMediaQaId("image", item.imageUrl),
        mediaType: "image",
        filePath: item.imageUrl,
        heuristicFlags: getHeuristicFlags("image", item.imageUrl)
      },
      {
        ...base,
        id: getMediaQaId("audio", item.audioUrl),
        mediaType: "audio",
        filePath: item.audioUrl,
        heuristicFlags: []
      }
    ];
  });
}

export const mediaQaSeedManifest = [
  ...publicMediaInventory,
  ...buildInitialSoundMediaQaSeedManifest()
];

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
  if (/\/rainbow\.[a-z0-9]+$/i.test(lower)) return [];
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
          replacementPath: "",
          exists: true,
          source: "runtime_question",
          fileSizeBytes: 0
        };

        existing.linkedQuestionIds.push(question.id);
        if (!existing.skillName && question.skill) existing.skillName = question.skill;
        if (!existing.targetWord) existing.targetWord = inferTargetWord(question, filePath);
        records.set(id, existing);
      }
    }
  }

  for (const seed of mediaQaSeedManifest) {
    const existing = records.get(seed.id);
    records.set(seed.id, {
      ...seed,
      ...(existing || {}),
      targetWord: existing?.targetWord || seed.targetWord,
      skillId: existing?.skillId || seed.skillId,
      skillName: existing?.skillName || seed.skillName,
      level: existing?.level || seed.level,
      linkedQuestionIds: [
        ...new Set([
          ...(seed.linkedQuestionIds || []),
          ...(existing?.linkedQuestionIds || [])
        ])
      ],
      heuristicFlags: [
        ...new Set([
          ...(seed.heuristicFlags || []),
          ...(existing?.heuristicFlags || [])
        ])
      ],
      replacementPath: existing?.replacementPath || seed.replacementPath || "",
      exists: existing?.exists ?? seed.exists ?? true,
      source: existing?.source || seed.source || "seed_manifest",
      fileSizeBytes: existing?.fileSizeBytes || seed.fileSizeBytes || 0
    });
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
  const override = readMediaQaOverrides()[id];
  if (override?.status) {
    if (override.status === "needs_kimi" && options.reviewMode) return true;
    return !BLOCKING_STATUSES.has(override.status);
  }

  const seeds = mediaQaSeedManifest.filter(record => record.id === id);
  const statuses = seeds.map(record => record.status || "unreviewed");
  const blockingStatus = statuses.find(status => BLOCKING_STATUSES.has(status));
  const status = blockingStatus || statuses.find(Boolean) || "unreviewed";
  if (status === "needs_kimi" && options.reviewMode) return true;
  if (status === "unreviewed" && !options.reviewMode) {
    const heuristicFlags = seeds.flatMap(record => record.heuristicFlags || []);
    if (heuristicFlags.length > 0) return false;
  }
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
