import path from "node:path";

import {
  buildInitialSoundsProgressFromAnswerHistory,
  getInitialSoundRoundPlan
} from "../src/content/initialSounds/initialSoundSelector.js";
import {
  INITIAL_SOUND_LETTERS,
  initialSoundWordBank
} from "../src/content/initialSounds/initialSoundWordBank.js";
import {
  hasImportedInitialSoundAudio,
  hasImportedInitialSoundImage
} from "../src/content/initialSounds/initialSoundMediaManifest.js";
import {
  buildRuntimeQuestionsForSkill,
  getQuestionAudioPaths,
  getQuestionImagePaths,
  inferPatternForSkill,
  listFiles,
  normalizeWord,
  publicPathExists,
  repoRoot,
  sampleRound,
  selectableRuntimeQuestionsForSkill,
  slugWord,
  writeFile
} from "./phonicsRuntimeUtils.js";

const skills = [
  {
    id: "initial_sounds",
    label: "Initial Sounds",
    inventoryPath: "docs/assets/initial_sounds_word_inventory.md"
  },
  {
    id: "final_sounds",
    label: "Ending Sounds",
    inventoryPath: "docs/assets/ending_sounds_word_inventory.md"
  },
  {
    id: "cvc_short_vowels",
    label: "CVC Short Vowels",
    inventoryPath: "docs/assets/cvc_short_vowel_word_inventory.md"
  },
  {
    id: "rhyming",
    label: "Rhyming Words",
    inventoryPath: "docs/assets/rhyming_word_inventory.md"
  }
];

function fileWord(filePath) {
  return normalizeWord(path.basename(filePath).replace(/\.[^.]+$/, ""));
}

function assetCountsForInitialSounds() {
  return {
    imageFiles: listFiles("public/media/initial-sounds/images", [".png", ".jpg", ".jpeg", ".webp"]).length,
    audioFiles: listFiles("public/media/initial-sounds/audio", [".mp3", ".wav", ".m4a"]).length
  };
}

function assetCountsForQuestionSkill(skillId) {
  const questions = buildRuntimeQuestionsForSkill(skillId);
  const imagePaths = new Set(questions.flatMap(getQuestionImagePaths));
  const audioPaths = new Set(questions.flatMap(getQuestionAudioPaths));
  return {
    imageFiles: [...imagePaths].filter(publicPathExists).length,
    audioFiles: [...audioPaths].filter(publicPathExists).length
  };
}

function initialSoundRows() {
  return initialSoundWordBank.map(item => {
    const image = hasImportedInitialSoundImage(item);
    const audio = hasImportedInitialSoundAudio(item);
    const reasons = [];
    if (item.active === false) reasons.push(item.qaNotes || item.qaStatus || "blocked");
    if (!image) reasons.push("missing image");
    if (!audio) reasons.push("missing audio");
    return {
      word: item.targetWord,
      pattern: item.letter,
      level: item.level,
      imagePath: item.imageUrl,
      audioPath: item.audioUrl,
      status: item.active === false ? item.qaStatus : image ? "image-backed" : "blocked",
      runtimeSelectable: item.active !== false && image,
      filterReason: reasons.join("; ")
    };
  });
}

function questionRowsForSkill(skillId) {
  const questions = buildRuntimeQuestionsForSkill(skillId);
  const byWord = new Map();
  for (const question of questions) {
    const word = question.targetWord || fileWord(getQuestionImagePaths(question)[0] || "");
    const key = `${slugWord(word)}|${question.level || question.difficulty || ""}|${inferPatternForSkill(skillId, question)}`;
    const existing = byWord.get(key);
    const imagePaths = getQuestionImagePaths(question);
    const audioPaths = getQuestionAudioPaths(question);
    const imagePath = imagePaths.find(publicPathExists) || imagePaths[0] || "";
    const audioPath = audioPaths.find(publicPathExists) || audioPaths[0] || "";
    const row = {
      word,
      pattern: inferPatternForSkill(skillId, question),
      level: question.level || question.difficulty || "",
      imagePath,
      audioPath,
      status: question.filterReason ? "filtered" : "runtime",
      runtimeSelectable: !question.filterReason || question.filterReason.startsWith("missing optional audio"),
      filterReason: question.filterReason || "",
      questionCount: (existing?.questionCount || 0) + 1
    };
    byWord.set(key, row);
  }
  return [...byWord.values()].sort((a, b) =>
    String(a.pattern).localeCompare(String(b.pattern)) ||
    String(a.word).localeCompare(String(b.word))
  );
}

function writeInventory(skill, rows) {
  const duplicateWords = rows
    .map(row => normalizeWord(row.word))
    .filter((word, index, list) => word && list.indexOf(word) !== index);
  const content = [
    `# ${skill.label} Word Inventory`,
    "",
    "Date: 2026-05-25",
    "",
    `- Total rows: ${rows.length}`,
    `- Runtime-selectable rows: ${rows.filter(row => row.runtimeSelectable).length}`,
    `- Blocked/filtered rows: ${rows.filter(row => !row.runtimeSelectable).length}`,
    `- Duplicate word entries: ${new Set(duplicateWords).size}`,
    "",
    "| Word | Sound/Pattern | Level | Image Path | Audio Path | Status | Runtime Selectable | Filter Reason |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map(row =>
      `| ${row.word || ""} | ${row.pattern || ""} | ${row.level || ""} | ${row.imagePath || ""} | ${row.audioPath || ""} | ${row.status || ""} | ${row.runtimeSelectable ? "yes" : "no"} | ${String(row.filterReason || "").replace(/\|/g, "/")} |`
    )
  ].join("\n");
  writeFile(path.join(repoRoot, skill.inventoryPath), `${content}\n`);
}

function summarizeSkill(skill) {
  const rows = skill.id === "initial_sounds" ? initialSoundRows() : questionRowsForSkill(skill.id);
  writeInventory(skill, rows);
  const assetCounts = skill.id === "initial_sounds" ? assetCountsForInitialSounds() : assetCountsForQuestionSkill(skill.id);
  const runtimeQuestions = skill.id === "initial_sounds"
    ? initialSoundWordBank.filter(item => item.active !== false && hasImportedInitialSoundImage(item))
    : selectableRuntimeQuestionsForSkill(skill.id);
  const activeQuestions = skill.id === "initial_sounds"
    ? initialSoundWordBank.filter(item => item.active !== false)
    : buildRuntimeQuestionsForSkill(skill.id).filter(item => item.active !== false);
  const imageWords = new Set(
    skill.id === "initial_sounds"
      ? listFiles("public/media/initial-sounds/images", [".png", ".jpg", ".jpeg", ".webp"]).map(fileWord)
      : rows.filter(row => row.imagePath && publicPathExists(row.imagePath)).map(row => normalizeWord(row.word))
  );
  const audioWords = new Set(
    skill.id === "initial_sounds"
      ? listFiles("public/media/initial-sounds/audio", [".mp3", ".wav", ".m4a"]).map(fileWord)
      : rows.filter(row => row.audioPath && publicPathExists(row.audioPath)).map(row => normalizeWord(row.word))
  );
  const matchedPairs = [...imageWords].filter(word => audioWords.has(word)).length;
  const sample = skill.id === "initial_sounds"
    ? getInitialSoundRoundPlan({ seed: 515, level: 1 }).items
    : sampleRound(runtimeQuestions);

  return {
    skill,
    rows,
    assetCounts,
    imageOnly: [...imageWords].filter(word => !audioWords.has(word)).length,
    audioOnly: [...audioWords].filter(word => !imageWords.has(word)).length,
    matchedPairs,
    activeQuestions: activeQuestions.length,
    runtimeQuestions: runtimeQuestions.length,
    blocked: rows.filter(row => !row.runtimeSelectable).length,
    duplicates: new Set(rows.map(row => normalizeWord(row.word)).filter((word, index, list) => word && list.indexOf(word) !== index)).size,
    missingRefs: rows.filter(row =>
      (row.imagePath && !publicPathExists(row.imagePath)) ||
      (row.audioPath && row.audioPath.startsWith("/") && !publicPathExists(row.audioPath))
    ),
    sample
  };
}

const summaries = skills.map(summarizeSkill);

const initialProgress = [];
const round1 = getInitialSoundRoundPlan({ level: 1, seed: 1001 });
round1.items.forEach(item => initialProgress.push({
  skillId: "initial_sounds",
  stage: "Initial Sounds",
  itemKey: item.letter,
  itemLevel: item.level,
  targetWord: item.targetWord,
  isCorrect: true
}));
const round2 = getInitialSoundRoundPlan({
  level: 1,
  seed: 1002,
  studentProgress: { initialSoundsProgress: buildInitialSoundsProgressFromAnswerHistory(initialProgress) }
});

const reportLines = [
  "# Core Phonics Runtime Depth Audit",
  "",
  "Date: 2026-05-25",
  "",
  "## Root Cause Of Initial Sounds Stopping Early",
  "",
  "Initial Sounds was building a 15-question plan first and then filtering QA-blocked images afterward in the app. If previously rejected image statuses remained for the first selected core words, the visible queue could collapse to a small number of questions. The repair moves the image/media QA predicate into the Initial Sounds selector so it chooses replacement words before the round queue is finalized. The selector also treats missing audio as non-blocking for image-backed Initial Sounds items.",
  "",
  "## Skill Summary",
  "",
  "| Skill | Image Files/Refs | Audio Files/Refs | Matched Image+Audio Words | Image-Only Words | Audio-Only Words | Active Items | Runtime-Selectable Items | Blocked/Filtered | Duplicate Words | Missing Media References |",
  "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ...summaries.map(summary =>
    `| ${summary.skill.label} | ${summary.assetCounts.imageFiles} | ${summary.assetCounts.audioFiles} | ${summary.matchedPairs} | ${summary.imageOnly} | ${summary.audioOnly} | ${summary.activeQuestions} | ${summary.runtimeQuestions} | ${summary.blocked} | ${summary.duplicates} | ${summary.missingRefs.length} |`
  ),
  "",
  "## Initial Sounds Progression Samples",
  "",
  `- Level 1 Round 1: ${round1.items.map(item => `${item.letter}:${item.targetWord}`).join(", ")}`,
  `- Level 1 Round 2: ${round2.items.map(item => `${item.letter}:${item.targetWord}`).join(", ")}`,
  "",
  "## Sample 15-Question Rounds",
  "",
  ...summaries.flatMap(summary => [
    `### ${summary.skill.label}`,
    "",
    summary.sample.length
      ? summary.sample.map((item, index) =>
        `${index + 1}. ${item.letter || item.itemKey || inferPatternForSkill(summary.skill.id, item) || "-"} / ${item.targetWord || item.answer || item.correctAnswer || item.id}`
      ).join("\n")
      : "No sample available.",
    ""
  ]),
  "## Remaining Gaps Needing Kimi",
  "",
  ...summaries.flatMap(summary => {
    const gaps = summary.rows.filter(row => !row.runtimeSelectable || row.filterReason);
    if (!gaps.length) return [`- ${summary.skill.label}: no blocking runtime gaps found.`];
    return gaps.slice(0, 40).map(row =>
      `- ${summary.skill.label}: ${row.word || "(unknown)"} (${row.pattern || "pattern unknown"}) - ${row.filterReason || row.status}`
    );
  }),
  ""
];

writeFile(path.join(repoRoot, "docs/assets/core_phonics_runtime_depth_audit.md"), reportLines.join("\n"));

console.log("Core phonics inventory audit complete.");
for (const summary of summaries) {
  console.log(`${summary.skill.label}: ${summary.runtimeQuestions} runtime-selectable, ${summary.blocked} blocked/filtered.`);
}
console.log("Wrote docs/assets/core_phonics_runtime_depth_audit.md");
