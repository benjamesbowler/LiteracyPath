import path from "node:path";

import { skillTree } from "../src/skillTree.js";
import {
  getAssessmentSkillGroup,
  loadAssessmentSkillBank,
  loadHfwAssessmentBank
} from "../src/data/loadAssessmentSkillBank.js";
import { HFW_ALLOWED_FORMATS, getHfwRuntimeEligibilityIssues } from "../src/data/hfwRuntimeEligibility.js";
import { getHfwBandWords, normalizeHfwSkillId } from "../src/data/highFrequencyWordBands.js";
import {
  buildRuntimeQuestionsForSkill,
  getQuestionAudioPaths,
  getQuestionTargetWord,
  normalizeWord,
  publicPathExists,
  repoRoot,
  sampleRound,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";

const HFW_SKILL_IDS = ["hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"];
const REPORT_PATH = path.join(repoRoot, "docs/validation/hfw_runtime_smoke_check.md");
const ROUND_LENGTH = 15;
const AUDIO_FIELD_NAMES = ["audioPath", "audioUrl", "audioText", "spokenPrompt"];
const AUDIO_FORMAT_PATTERN = /AUDIO|LISTEN|SPEAKER/i;

const failures = [];
const summaryRows = [];
const detailRows = [];
const sampleRows = [];

function escapeMarkdown(value = "") {
  return String(value ?? "").replace(/\n/g, "<br>").replace(/\|/g, "\\|");
}

function table(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(escapeMarkdown).join(" | ")} |`)
  ].join("\n");
}

function levelOf(question = {}) {
  const level = Number(question.level || question.assessmentLevel || question.depthLevel || 0);
  if (Number.isFinite(level) && level >= 1) return level >= 2 ? 2 : 1;
  const difficulty = Number(question.difficultyLevel || question.difficulty || 0);
  return Number.isFinite(difficulty) && difficulty >= 2 ? 2 : 1;
}

function formatOf(question = {}) {
  return String(question.formatType || question.templateType || question.questionType || "UNKNOWN").toUpperCase();
}

function choicesOf(question = {}) {
  if (Array.isArray(question.answerOptions) && question.answerOptions.length) return question.answerOptions;
  if (Array.isArray(question.choices) && question.choices.length) return question.choices;
  if (Array.isArray(question.options) && question.options.length) return question.options;
  return [];
}

function choiceValue(choice) {
  if (choice && typeof choice === "object") {
    return choice.value || choice.word || choice.label || choice.text || choice.answer || "";
  }
  return choice;
}

function imagePathOf(question = {}) {
  return question.imagePath || question.imageUrl || question.image || "";
}

function sentenceOf(question = {}) {
  return String(question.sentence || question.passage || question.context || "");
}

function answerOf(question = {}) {
  return normalizeWord(question.answer || question.correctAnswer || "");
}

function hasAudioField(question = {}) {
  return AUDIO_FIELD_NAMES.some(field => Boolean(question[field]));
}

function hasAnswerOptionAudio(question = {}) {
  return choicesOf(question).some(choice => {
    if (!choice || typeof choice !== "object") return false;
    return Boolean(choice.audio || choice.audioPath || choice.audioUrl);
  });
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function validateLevel1Question(skillId, question) {
  const id = question.id || question.questionId || "(missing id)";
  const format = formatOf(question);
  const choices = choicesOf(question).map(choiceValue).filter(Boolean);
  const imagePath = imagePathOf(question);
  const sentence = sentenceOf(question);
  const answer = answerOf(question);
  const targetWord = normalizeWord(question.targetWord || question.itemKey || answer);

  assert(format === "HFW_IMAGE_CONTEXT_CLOZE", `${skillId}/${id}: Level 1 expected HFW_IMAGE_CONTEXT_CLOZE, found ${format}`);
  assert(question.disableAudio === true, `${skillId}/${id}: Level 1 disableAudio must be true`);
  assert(Boolean(imagePath), `${skillId}/${id}: Level 1 cloze missing image path`);
  if (imagePath) assert(publicPathExists(imagePath), `${skillId}/${id}: Level 1 image does not exist: ${imagePath}`);
  assert((sentence.match(/___/g) || []).length === 1, `${skillId}/${id}: Level 1 cloze needs exactly one blank`);
  assert(choices.length === 4, `${skillId}/${id}: Level 1 cloze expected 4 choices, found ${choices.length}`);
  assert(new Set(choices.map(normalizeWord)).size === choices.length, `${skillId}/${id}: Level 1 choices must be unique`);
  assert(Boolean(answer), `${skillId}/${id}: Level 1 cloze missing answer`);
  assert(choices.map(normalizeWord).includes(answer), `${skillId}/${id}: Level 1 answer "${answer}" is not in choices`);
  assert(answer === targetWord, `${skillId}/${id}: Level 1 answer "${answer}" does not match target "${targetWord}"`);
}

function validateLevel2Question(skillId, question) {
  const id = question.id || question.questionId || "(missing id)";
  const format = formatOf(question);
  const tiles = Array.isArray(question.letterTiles) && question.letterTiles.length ? question.letterTiles : question.soundTiles;
  const imagePath = imagePathOf(question);
  const targetWord = normalizeWord(question.targetWord || question.itemKey || question.answer || question.correctAnswer);

  assert(format === "HFW_LETTER_BUILD", `${skillId}/${id}: Level 2 expected HFW_LETTER_BUILD, found ${format}`);
  assert(question.disableAudio === true, `${skillId}/${id}: Level 2 disableAudio must be true`);
  assert(Boolean(imagePath), `${skillId}/${id}: Level 2 letter-build missing image path`);
  if (imagePath) assert(publicPathExists(imagePath), `${skillId}/${id}: Level 2 image does not exist: ${imagePath}`);
  assert(Array.isArray(tiles), `${skillId}/${id}: Level 2 letter-build missing tiles`);
  assert((tiles || []).length === 12, `${skillId}/${id}: Level 2 letter-build expected 12 tiles, found ${(tiles || []).length}`);
  assert(Boolean(targetWord), `${skillId}/${id}: Level 2 letter-build missing target word`);

  const available = (tiles || []).map(tile => String(tile || "").toLowerCase()).reduce((counts, letter) => {
    counts[letter] = (counts[letter] || 0) + 1;
    return counts;
  }, {});
  for (const letter of targetWord.split("")) {
    if (!available[letter]) {
      failures.push(`${skillId}/${id}: Level 2 letter-build tiles are missing "${letter}" for "${targetWord}"`);
      break;
    }
    available[letter] -= 1;
  }
}

const activeSkillIds = new Set(skillTree.map(skill => skill.id));
assert(!activeSkillIds.has("hfw_51_100"), "legacy hfw_51_100 must not be active in skillTree");
assert(normalizeHfwSkillId("hfw_51_100") === "", "legacy hfw_51_100 must not normalize to an active band");
assert(buildRuntimeQuestionsForSkill("hfw_51_100").length === 0, "legacy hfw_51_100 must resolve 0 current runtime questions");
assert((await loadHfwAssessmentBank("hfw_51_100")).length === 0, "legacy hfw_51_100 must resolve 0 HFW-safe loader questions");

for (const skillId of HFW_SKILL_IDS) {
  const configuredWords = getHfwBandWords(skillId);
  const loaderQuestions = await loadAssessmentSkillBank(skillId);
  const hfwSafeLoaderQuestions = await loadHfwAssessmentBank(skillId);
  const runtimeQuestions = buildRuntimeQuestionsForSkill(skillId);
  const selectableQuestions = selectableRuntimeQuestionsForSkill(skillId);
  const levelOne = selectableQuestions.filter(question => levelOf(question) === 1);
  const levelTwo = selectableQuestions.filter(question => levelOf(question) === 2);
  const levelOneRound = sampleRound(levelOne, ROUND_LENGTH);
  const levelTwoRound = sampleRound(levelTwo, ROUND_LENGTH);
  const formats = selectableQuestions.reduce((counts, question) => {
    const format = formatOf(question);
    counts[format] = (counts[format] || 0) + 1;
    return counts;
  }, {});
  const targetWords = new Set(selectableQuestions.map(question => getQuestionTargetWord(question)).filter(Boolean));
  const audioFieldRows = selectableQuestions.filter(hasAudioField);
  const audioPathRows = selectableQuestions.filter(question => getQuestionAudioPaths(question).length > 0);
  const answerOptionAudioRows = selectableQuestions.filter(hasAnswerOptionAudio);
  const audioFormatRows = selectableQuestions.filter(question => AUDIO_FORMAT_PATTERN.test(formatOf(question)));
  const invalidSkillRows = selectableQuestions.filter(question => !HFW_SKILL_IDS.includes(question.skillId) && !HFW_SKILL_IDS.includes(question.assessmentSkillId));
  const disabledAudioRows = selectableQuestions.filter(question => question.disableAudio !== true);
  const hfwEligibilityRows = selectableQuestions
    .map(question => ({ question, issues: getHfwRuntimeEligibilityIssues(question, skillId, { pathExists: publicPathExists }) }))
    .filter(row => row.issues.length);

  assert(getAssessmentSkillGroup(skillId) === "hfw", `${skillId}: group must be hfw`);
  assert(loaderQuestions.length > 0, `${skillId}: loader returned 0 questions`);
  assert(runtimeQuestions.length > 0, `${skillId}: current runtime path returned 0 questions`);
  assert(selectableQuestions.length > 0, `${skillId}: selectable runtime path returned 0 questions`);
  assert(hfwSafeLoaderQuestions.length === selectableQuestions.length, `${skillId}: HFW-safe loader count ${hfwSafeLoaderQuestions.length} does not match selectable runtime count ${selectableQuestions.length}`);
  assert(levelOne.length >= ROUND_LENGTH, `${skillId}: Level 1 selectable count ${levelOne.length} is below ${ROUND_LENGTH}`);
  assert(levelTwo.length >= ROUND_LENGTH, `${skillId}: Level 2 selectable count ${levelTwo.length} is below ${ROUND_LENGTH}`);
  assert(levelOneRound.length === ROUND_LENGTH, `${skillId}: Level 1 round sampled ${levelOneRound.length}/${ROUND_LENGTH}`);
  assert(levelTwoRound.length === ROUND_LENGTH, `${skillId}: Level 2 round sampled ${levelTwoRound.length}/${ROUND_LENGTH}`);
  assert(audioFieldRows.length === 0, `${skillId}: ${audioFieldRows.length} active HFW questions have audio fields`);
  assert(audioPathRows.length === 0, `${skillId}: ${audioPathRows.length} active HFW questions expose audio paths`);
  assert(answerOptionAudioRows.length === 0, `${skillId}: ${answerOptionAudioRows.length} active HFW questions have answer option audio`);
  assert(audioFormatRows.length === 0, `${skillId}: ${audioFormatRows.length} active HFW questions use audio/speaker/listen formats`);
  assert(invalidSkillRows.length === 0, `${skillId}: ${invalidSkillRows.length} active HFW questions have invalid skill ids`);
  assert(disabledAudioRows.length === 0, `${skillId}: ${disabledAudioRows.length} active HFW questions do not have disableAudio true`);
  assert(hfwEligibilityRows.length === 0, `${skillId}: ${hfwEligibilityRows.length} selectable questions fail HFW eligibility`);
  assert(Object.keys(formats).every(format => HFW_ALLOWED_FORMATS.has(format)), `${skillId}: selectable formats outside HFW allowlist`);

  for (const question of levelOne) validateLevel1Question(skillId, question);
  for (const question of levelTwo) validateLevel2Question(skillId, question);

  summaryRows.push([
    skillId,
    configuredWords.length,
    loaderQuestions.length,
    runtimeQuestions.length,
    selectableQuestions.length,
    levelOne.length,
    levelTwo.length,
    levelOneRound.length,
    levelTwoRound.length,
    targetWords.size,
    Object.entries(formats).map(([format, count]) => `${format}: ${count}`).join("<br>")
  ]);

  detailRows.push([
    skillId,
    audioFieldRows.length,
    audioPathRows.length,
    answerOptionAudioRows.length,
    audioFormatRows.length,
    disabledAudioRows.length,
    invalidSkillRows.length,
    hfwEligibilityRows.length
  ]);

  sampleRows.push(
    ...levelOneRound.slice(0, 3).map(question => [skillId, "Level 1", question.id || question.questionId, formatOf(question), getQuestionTargetWord(question)]),
    ...levelTwoRound.slice(0, 3).map(question => [skillId, "Level 2", question.id || question.questionId, formatOf(question), getQuestionTargetWord(question)])
  );
}

const markdown = [
  "# HFW Runtime Smoke Check",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Summary",
  "",
  `- Checked HFW skills: ${HFW_SKILL_IDS.join(", ")}`,
  `- Round length target: ${ROUND_LENGTH}`,
  `- Fatal failures: ${failures.length}`,
  "- Runtime code changed: no",
  "- Actual HFW lazy loading enabled: no",
  "- HFW-safe loader helper added for Phase 8 readiness: yes",
  "",
  table([
    "Skill",
    "Band Words",
    "Raw Loader",
    "Runtime Pool",
    "Selectable",
    "Level 1",
    "Level 2",
    "L1 Round",
    "L2 Round",
    "Target Words",
    "Selectable Formats"
  ], summaryRows),
  "",
  "## No-Audio and Shape Constraints",
  "",
  table([
    "Skill",
    "Question Audio Fields",
    "Question Audio Paths",
    "Answer Audio Rows",
    "Audio/Speaker Formats",
    "disableAudio Issues",
    "Skill ID Issues",
    "Eligibility Issues"
  ], detailRows),
  "",
  "## Sample Round Seeds",
  "",
  table(["Skill", "Level", "Question ID", "Format", "Target Word"], sampleRows),
  "",
  "## Legacy HFW Check",
  "",
  `- hfw_51_100 active in skillTree: ${activeSkillIds.has("hfw_51_100") ? "yes" : "no"}`,
  `- hfw_51_100 runtime questions: ${buildRuntimeQuestionsForSkill("hfw_51_100").length}`,
  "",
  "## Failures",
  "",
  failures.length ? failures.map(failure => `- ${failure}`).join("\n") : "- none",
  ""
].join("\n");

writeFile(REPORT_PATH, markdown);

console.log("HFW runtime smoke check");
console.table(summaryRows.map(row => ({
  skillId: row[0],
  rawLoader: row[2],
  runtimePool: row[3],
  selectable: row[4],
  level1: row[5],
  level2: row[6],
  l1Round: row[7],
  l2Round: row[8]
})));
console.log(`Wrote ${path.relative(repoRoot, REPORT_PATH)}`);

if (failures.length) {
  console.error(`HFW runtime smoke check failed: ${failures.length}`);
  failures.slice(0, 60).forEach(failure => console.error(`- ${failure}`));
  if (failures.length > 60) console.error(`...and ${failures.length - 60} more`);
  process.exit(1);
}

console.log("HFW runtime smoke check passed.");
