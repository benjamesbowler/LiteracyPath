import path from "node:path";

import {
  getQuestionAudioPaths,
  getQuestionImagePaths,
  publicPathExists,
  repoRoot,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";
import {
  getQuestionMediaPaths,
  isMediaQaRuntimeAllowed
} from "../src/data/mediaQaManifest.js";

const secondBlockSkills = [
  ["digraphs", "Digraphs"],
  ["long_vowels_silent_e", "Long Vowels / Silent E"],
  ["vowel_teams", "Vowel Teams"],
  ["r_controlled", "R-Controlled Vowels"],
  ["nouns", "Nouns"],
  ["verbs", "Verbs"],
  ["adjectives", "Adjectives"],
  ["prepositions", "Prepositions"],
  ["plurals", "Plurals"],
  ["antonyms_synonyms", "Antonyms / Synonyms"]
];

const fakeOrBlockedTargets = new Set([
  "ballshell",
  "bookdesk",
  "bellshell",
  "dishfish",
  "kingring",
  "yen",
  "zip"
]);

const markdownPath = path.join(repoRoot, "docs/validation/second_block_skill_media_depth_audit.md");
const jsonPath = path.join(repoRoot, "docs/validation/second_block_skill_media_depth_audit.json");

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getLevel(question = {}) {
  const level = Number(question.level || question.assessmentLevel || question.difficulty || 1);
  return Number.isFinite(level) && level >= 2 ? 2 : 1;
}

function format(question = {}) {
  return String(question.formatType || question.templateType || question.questionType || "").toUpperCase();
}

function target(question = {}) {
  return normalize(question.targetWord || question.word || question.audioText || question.correctAnswer || question.answer || "");
}

function isImageChoiceQuestion(question = {}) {
  const text = format(question);
  return /IMAGE|PICTURE|VISUAL/.test(text) || Array.isArray(question.imageCards) && question.imageCards.length > 0;
}

function isAudioPromptQuestion(question = {}) {
  const text = `${question.prompt || ""} ${question.question || ""} ${question.spokenPrompt || ""} ${format(question)}`.toLowerCase();
  return /listen|audio|hear|sound/.test(text);
}

function missingImages(question = {}) {
  const paths = getQuestionImagePaths(question).filter(value => String(value || "").startsWith("/") || String(value || "").startsWith("data:image/"));
  if (!paths.length && isImageChoiceQuestion(question)) return ["(missing image path)"];
  return paths.filter(imagePath => !publicPathExists(imagePath));
}

function missingAudio(question = {}) {
  const paths = [...new Set(getQuestionAudioPaths(question).filter(value => String(value || "").startsWith("/")))];
  if (!isAudioPromptQuestion(question)) return [];
  return paths.filter(audioPath => !publicPathExists(audioPath));
}

function blockedMedia(question = {}) {
  const paths = getQuestionMediaPaths(question);
  return [
    ...paths.image.filter(imagePath => String(imagePath).startsWith("/") && !isMediaQaRuntimeAllowed(imagePath, "image")),
    ...paths.audio.filter(audioPath => String(audioPath).startsWith("/") && !isMediaQaRuntimeAllowed(audioPath, "audio"))
  ];
}

function duplicateTopUpTargets(questions = []) {
  const seen = new Set();
  const duplicates = new Set();
  questions
    .filter(question => question._source === "secondBlockSkillTopUpQuestions")
    .forEach(question => {
      const key = `${getLevel(question)}:${target(question)}:${format(question)}`;
      if (seen.has(key)) duplicates.add(key);
      seen.add(key);
    });
  return [...duplicates];
}

const rows = secondBlockSkills.map(([skillId, label]) => {
  const questions = selectableRuntimeQuestionsForSkill(skillId);
  const level1 = questions.filter(question => getLevel(question) === 1).length;
  const level2 = questions.filter(question => getLevel(question) === 2).length;
  const topUpQuestions = questions.filter(question => question._source === "secondBlockSkillTopUpQuestions");
  const imageGapRows = questions.flatMap(question => missingImages(question).map(mediaPath => ({ id: question.id, mediaPath })));
  const audioGapRows = questions.flatMap(question => missingAudio(question).map(mediaPath => ({ id: question.id, mediaPath })));
  const blockedRows = questions.flatMap(question => blockedMedia(question).map(mediaPath => ({ id: question.id, mediaPath })));
  const duplicateTargets = duplicateTopUpTargets(questions);
  const fakeTargets = topUpQuestions.filter(question => fakeOrBlockedTargets.has(target(question)));
  const sourceSupports100 = true;
  const status = questions.length >= 100 && imageGapRows.length === 0 && audioGapRows.length === 0 && blockedRows.length === 0 && fakeTargets.length === 0
    && duplicateTargets.length === 0
    ? "pass"
    : "fail";

  return {
    skillId,
    label,
    selectableCount: questions.length,
    level1Count: level1,
    level2Count: level2,
    secondBlockTopUpCount: topUpQuestions.length,
    imageGapCount: imageGapRows.length,
    audioGapCount: audioGapRows.length,
    blockedMediaCount: blockedRows.length,
    duplicateTargetCount: duplicateTargets.length,
    duplicateTargets: duplicateTargets.slice(0, 20),
    fakeNonWordRejectedCount: fakeOrBlockedTargets.size,
    fakeNonWordLiveCount: fakeTargets.length,
    sourceSupports100,
    status,
    imageGapRows: imageGapRows.slice(0, 20),
    audioGapRows: audioGapRows.slice(0, 20),
    blockedRows: blockedRows.slice(0, 20)
  };
});

const failures = rows.filter(row => row.status !== "pass");
const markdown = [
  "# Second Block Skill Media Depth Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "Scope: Digraphs, Long Vowels / Silent E, Vowel Teams, R-Controlled Vowels, Nouns, Verbs, Adjectives, Prepositions, Plurals, Antonyms / Synonyms.",
  "",
  "Pass criteria: at least 100 selectable runtime questions where the K3 source pool supports it, zero image gaps, zero audio gaps for audio-prompt questions, no QA-blocked media, no duplicate target/template pairs in the top-up bank, and no live fake/non-word targets.",
  "",
  "| Skill | Selectable | L1 | L2 | Second-block top-up | Image gaps | Audio gaps | Blocked media | Duplicate top-up targets | Fake/non-word live | Status |",
  "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
  ...rows.map(row => `| ${row.label} | ${row.selectableCount} | ${row.level1Count} | ${row.level2Count} | ${row.secondBlockTopUpCount} | ${row.imageGapCount} | ${row.audioGapCount} | ${row.blockedMediaCount} | ${row.duplicateTargetCount} | ${row.fakeNonWordLiveCount} | ${row.status} |`),
  "",
  "## Notes",
  "",
  "- Digraphs and R-Controlled Vowels already exceeded the 100-question target before this top-up, so the generated second-block bank did not add extra rows for them.",
  "- Duplicate target count is scoped to the new second-block top-up bank by level, target, and template type; any duplicate target/template pair fails this audit.",
  "- Fake/non-word rejected count is the generator denylist size used to prevent known bad targets such as ballshell/bookdesk from entering runtime.",
  "",
  "## Failures",
  "",
  failures.length ? failures.map(row => `- ${row.label}: ${row.status}`).join("\n") : "- none",
  ""
];

writeFile(markdownPath, markdown.join("\n"));
writeFile(jsonPath, JSON.stringify({ generated: new Date().toISOString(), rows }, null, 2));

rows.forEach(row => {
  console.log(`${row.label}: ${row.selectableCount} selectable (L1 ${row.level1Count}, L2 ${row.level2Count}); image gaps ${row.imageGapCount}; audio gaps ${row.audioGapCount}; blocked ${row.blockedMediaCount}; status ${row.status}`);
});
console.log("Wrote docs/validation/second_block_skill_media_depth_audit.md");
console.log("Wrote docs/validation/second_block_skill_media_depth_audit.json");

if (failures.length) {
  console.error(`Second-block skill depth failed: ${failures.length}`);
  process.exit(1);
}
