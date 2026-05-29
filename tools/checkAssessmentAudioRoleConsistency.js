import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { masteryCoreQuestions } from "../src/data/masteryCoreQuestions.js";
import { masteryExtraQuestions } from "../src/data/masteryExtraQuestions.js";
import { initialSoundCoverageQuestions } from "../src/data/initialSoundCoverageQuestions.js";
import { finalSoundCoverageQuestions } from "../src/data/finalSoundCoverageQuestions.js";
import { rhymingCoverageQuestions } from "../src/data/rhymingCoverageQuestions.js";
import { cvcShortVowelExpansionQuestions } from "../src/data/cvcShortVowelExpansionQuestions.js";
import { contentExpansionPass3Questions } from "../src/data/contentExpansionPass3Questions.js";
import { targetedContentRecoveryQuestions } from "../src/data/targetedContentRecoveryQuestions.js";
import { kimiDataset7RuntimeQuestions } from "../src/data/kimiDataset7RuntimeQuestions.js";
import { ixlStyleSeedQuestions } from "../src/data/ixlStyleSeedQuestions.js";
import { safeContentExpansionQuestions } from "../src/data/safeContentExpansionQuestions.js";
import { hfwAssessmentQuestions } from "../src/data/generated/hfwAssessmentQuestions.generated.js";
import { templateQuestions } from "../src/data/templateQuestions.js";
import { templateExpansion } from "../src/data/templateExpansion.js";
import { templateExpansion2 } from "../src/data/templateExpansion2.js";
import { templateExpansion3 } from "../src/data/templateExpansion3.js";
import { templateExpansion4 } from "../src/data/templateExpansion4.js";
import { templateExpansion5 } from "../src/data/templateExpansion5.js";
import { templateExpansion6 } from "../src/data/templateExpansion6.js";
import { templateExpansion7 } from "../src/data/templateExpansion7.js";
import { questionBankExpansion8 } from "../src/data/questionBankExpansion8.js";
import { generatedEarlySkillQuestions } from "../src/data/generated/earlySkillQuestions.generated.js";
import { skillLevelGapQuestions } from "../src/data/generated/skillLevelGapQuestions.generated.js";
import { hfwLevel2Questions } from "../src/data/generated/hfwLevel2Questions.generated.js";
import { generatedQuestions } from "../src/data/generatedQuestions.js";
import { fixSentenceQuestions } from "../src/data/fixSentenceQuestions.js";
import { templateComprehensionAdvanced } from "../src/data/templateComprehensionAdvanced.js";
import {
  getTargetWordAudioPath,
  inferShortVowelFromWord,
  isGenericInstructionAudioPath,
  isListenChooseVowelQuestion,
  normalizeAssessmentAudioRoles,
  normalizeVowelAnswer,
  SHORT_VOWEL_LISTEN_PROMPT
} from "../src/utils/assessmentAudioRoles.js";
import { getApprovedAudioPath } from "../src/data/audioPreferenceManifest.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(repoRoot, "public");
const reportPath = path.join(repoRoot, "docs", "validation", "assessment_audio_role_consistency_audit.md");
const replacementRequestPath = path.join(repoRoot, "docs", "assets", "replacement_assessment_audio_request.md");

const banks = [
  ["masteryCoreQuestions", masteryCoreQuestions],
  ["masteryExtraQuestions", masteryExtraQuestions],
  ["initialSoundCoverageQuestions", initialSoundCoverageQuestions],
  ["finalSoundCoverageQuestions", finalSoundCoverageQuestions],
  ["rhymingCoverageQuestions", rhymingCoverageQuestions],
  ["cvcShortVowelExpansionQuestions", cvcShortVowelExpansionQuestions],
  ["contentExpansionPass3Questions", contentExpansionPass3Questions],
  ["targetedContentRecoveryQuestions", targetedContentRecoveryQuestions],
  ["kimiDataset7RuntimeQuestions", kimiDataset7RuntimeQuestions],
  ["ixlStyleSeedQuestions", ixlStyleSeedQuestions],
  ["safeContentExpansionQuestions", safeContentExpansionQuestions],
  ["hfwAssessmentQuestions", hfwAssessmentQuestions],
  ["templateQuestions", templateQuestions],
  ["templateExpansion", templateExpansion],
  ["templateExpansion2", templateExpansion2],
  ["templateExpansion3", templateExpansion3],
  ["templateExpansion4", templateExpansion4],
  ["templateExpansion5", templateExpansion5],
  ["templateExpansion6", templateExpansion6],
  ["templateExpansion7", templateExpansion7],
  ["questionBankExpansion8", questionBankExpansion8],
  ["generatedEarlySkillQuestions", generatedEarlySkillQuestions],
  ["skillLevelGapQuestions", skillLevelGapQuestions],
  ["hfwLevel2Questions", hfwLevel2Questions],
  ["generatedQuestions", generatedQuestions],
  ["fixSentenceQuestions", fixSentenceQuestions],
  ["templateComprehensionAdvanced", templateComprehensionAdvanced]
];

function normalizeTemplateOption(option) {
  if (typeof option === "string") return { label: option, value: option };
  return {
    ...option,
    label: option?.label || option?.word || option?.value || "",
    value: option?.value || option?.word || option?.label || ""
  };
}

function normalizeRawQuestion(rawQuestion, sourceName, index) {
  const skillId = rawQuestion.skillId ?? rawQuestion.skill_id ?? rawQuestion.skill ?? null;
  const answerOptions = Array.isArray(rawQuestion.answerOptions)
    ? rawQuestion.answerOptions.map(normalizeTemplateOption)
    : Array.isArray(rawQuestion.options)
      ? rawQuestion.options.map(normalizeTemplateOption)
      : Array.isArray(rawQuestion.choices)
        ? rawQuestion.choices.map(normalizeTemplateOption)
        : [];
  const correctAnswer =
    (Array.isArray(rawQuestion.correctAnswers) && rawQuestion.correctAnswers.length > 0
      ? rawQuestion.correctAnswers[0]
      : rawQuestion.correctAnswer) ??
    rawQuestion.answer ??
    rawQuestion.finalSound ??
    rawQuestion.letter ??
    "";
  const prompt = typeof rawQuestion.prompt === "string"
    ? rawQuestion.prompt
    : typeof rawQuestion.question === "string"
      ? rawQuestion.question
      : "";

  return {
    ...rawQuestion,
    id: rawQuestion.id ?? `${skillId || "unknown-skill"}-${sourceName}-${index}`,
    skillId,
    skill: rawQuestion.skill || rawQuestion.skillName || skillId || "",
    skillName: rawQuestion.skillName || rawQuestion.skill || skillId || "",
    prompt,
    question: typeof rawQuestion.question === "string" ? rawQuestion.question : prompt,
    targetWord: rawQuestion.targetWord ?? rawQuestion.word ?? "",
    audioText: rawQuestion.audioText ?? rawQuestion.targetWord ?? rawQuestion.word ?? "",
    imageUrl: rawQuestion.imageUrl ?? rawQuestion.image ?? rawQuestion.media?.imageUrl ?? "",
    imagePath: rawQuestion.imagePath ?? rawQuestion.imageUrl ?? rawQuestion.image ?? rawQuestion.media?.imageUrl ?? "",
    audioUrl: rawQuestion.audioUrl ?? rawQuestion.audio ?? rawQuestion.media?.audioUrl ?? "",
    audioPath: rawQuestion.audioPath ?? rawQuestion.audioUrl ?? rawQuestion.audio ?? rawQuestion.media?.audioUrl ?? "",
    correctAnswer,
    answer: rawQuestion.answer ?? correctAnswer,
    choices: answerOptions.map(option => option.value).filter(Boolean),
    answerOptions,
    _sourceBank: sourceName
  };
}

function publicFileExists(publicPath = "") {
  return Boolean(publicPath) && fs.existsSync(path.join(publicRoot, publicPath.replace(/^\//, "")));
}

function isTargetAudioQuestion(question = {}) {
  const skillId = String(question.skillId || question.skill || "").toLowerCase();
  const format = String(question.formatType || question.templateType || "").toUpperCase();
  if (isListenChooseVowelQuestion(question)) return true;
  if (skillId.startsWith("hfw_") && ["HFW_AUDIO_FIND_WORD", "LISTEN_FIND_WORD"].includes(format)) return true;
  if (["initial_sounds", "final_sounds", "rhyming", "cvc_short_vowels", "short_vowel_discrimination", "blends", "digraphs", "long_vowels_silent_e", "vowel_teams", "r_controlled_vowels"].includes(skillId)) {
    return Boolean(question.targetWord || question.audioText) && /LISTEN|SOUND|VOWEL|BLEND|RHYME|ENDING|FIRST|FINAL/.test(format);
  }
  return false;
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(cell => String(cell ?? "").replace(/\n/g, "<br>").replace(/\|/g, "\\|")).join(" | ")} |`)
  ].join("\n");
}

const rows = [];
const failures = [];
const missingAudio = new Map();
let activeCount = 0;
let shortVowelListenCount = 0;
let fixedGenericTargetAudioCount = 0;

for (const [sourceName, bank] of banks) {
  bank.forEach((rawQuestion, index) => {
    if (!rawQuestion || rawQuestion.active === false) return;
    activeCount += 1;
    const normalizedBeforeRoleFix = normalizeRawQuestion(rawQuestion, sourceName, index);
    const question = normalizeAssessmentAudioRoles(normalizedBeforeRoleFix);
    const rawAudioPath = normalizedBeforeRoleFix.audioPath || normalizedBeforeRoleFix.audioUrl || "";
    const audioPath = question.audioPath || question.audioUrl || "";
    const targetWord = question.targetWord || question.audioText || "";

    if (isGenericInstructionAudioPath(rawAudioPath) && targetWord && audioPath && audioPath !== rawAudioPath) {
      fixedGenericTargetAudioCount += 1;
    }

    if (isListenChooseVowelQuestion(question)) {
      shortVowelListenCount += 1;
      const expectedVowel = inferShortVowelFromWord(targetWord);
      const answer = normalizeVowelAnswer(question.correctAnswer || question.answer, targetWord);
      const choices = (question.choices || []).map(choice => String(choice).toLowerCase());
      const hasImage = Boolean(question.imagePath || question.imageUrl || question.image || question.targetImage || question.targetImagePath);
      const issues = [];
      if (question.prompt !== SHORT_VOWEL_LISTEN_PROMPT || question.question !== SHORT_VOWEL_LISTEN_PROMPT) issues.push("visible prompt is not the generic short-vowel listening prompt");
      if (!targetWord) issues.push("missing targetWord/audioText");
      if (!audioPath) issues.push("missing target-word audio");
      if (audioPath && isGenericInstructionAudioPath(audioPath)) issues.push("target-word audio is generic instruction audio");
      if (audioPath && !publicFileExists(audioPath)) {
        issues.push("target-word audio path does not exist");
        missingAudio.set(targetWord, {
          word: targetWord,
          skill: question.skillName || question.skillId,
          level: question.level || "",
          phase: question.phase || "",
          questionId: question.id,
          targetPath: audioPath,
          reason: "Declared target-word audio path does not exist."
        });
      }
      if (hasImage) issues.push("short vowel listen template should not show an image");
      if (choices.join("|") !== "a|e|i|o|u") issues.push("answer choices are not vowel choices a/e/i/o/u");
      if (!choices.includes(answer)) issues.push("correct vowel answer is missing from choices");
      if (expectedVowel && answer !== expectedVowel) issues.push(`correct answer ${answer} does not match inferred vowel ${expectedVowel}`);
      rows.push([question.id, sourceName, targetWord, answer, audioPath || "missing", issues.length ? issues.join("; ") : "ok"]);
      issues
        .filter(issue => issue !== "target-word audio path does not exist")
        .forEach(issue => failures.push(`${question.id}: ${issue}`));
      if (!audioPath) {
        missingAudio.set(targetWord, {
          word: targetWord,
          skill: question.skillName || question.skillId,
          level: question.level || "",
          phase: question.phase || "",
          questionId: question.id,
          targetPath: `/audio/child-mode/clean-human/words/${targetWord}.mp3`,
          reason: "Missing target-word audio for short vowel discrimination."
        });
      }
    } else if (isTargetAudioQuestion(question)) {
      const issues = [];
      if (audioPath && isGenericInstructionAudioPath(audioPath)) issues.push("target audio is generic instruction/prompt audio");
      if (!audioPath && targetWord) {
        const targetPath = getTargetWordAudioPath(targetWord, rawAudioPath);
        if (!targetPath) {
          missingAudio.set(targetWord, {
            word: targetWord,
            skill: question.skillName || question.skillId,
            level: question.level || "",
            phase: question.phase || "",
            questionId: question.id,
            targetPath: `/audio/child-mode/clean-human/words/${targetWord}.mp3`,
            reason: "Missing target-word audio for active listen/sound assessment item."
          });
        }
      }
      if (audioPath && !publicFileExists(audioPath)) {
        missingAudio.set(targetWord, {
          word: targetWord,
          skill: question.skillName || question.skillId,
          level: question.level || "",
          phase: question.phase || "",
          questionId: question.id,
          targetPath: audioPath,
          reason: "Declared target-word audio path does not exist."
        });
      }
      issues.forEach(issue => failures.push(`${question.id}: ${issue}`));
    }
  });
}

const bunRows = rows.filter(row => row[2] === "bun");
if (!bunRows.length) failures.push("No active short vowel bun listen item was found.");
if (bunRows.some(row => String(row[4]).includes("listen-and-find"))) failures.push("Bun short vowel item still uses listen-and-find audio.");
if (bunRows.some(row => row[5] !== "ok")) failures.push("Bun short vowel item has role consistency issues.");

const missingItems = Array.from(missingAudio.values()).filter(item => item.word);
const lines = [
  "# Assessment Audio Role Consistency Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Summary",
  "",
  `- Active questions scanned: ${activeCount}`,
  `- Short vowel listen/discrimination items checked: ${shortVowelListenCount}`,
  `- Generic instruction-audio target mappings corrected by runtime normalization: ${fixedGenericTargetAudioCount}`,
  `- Missing target-word audio requests: ${missingItems.length}`,
  `- Blocking failures: ${failures.length}`,
  "",
  "## Short Vowel Listen Items",
  "",
  markdownTable(["Question ID", "Source", "Target word", "Answer", "Audio path", "Status"], rows.slice(0, 200)),
  rows.length > 200 ? `\n\n_Showing first 200 of ${rows.length} short vowel listen rows._` : "",
  "",
  "## Missing Target Audio",
  "",
  missingItems.length
    ? markdownTable(["Word", "Skill", "Question", "Target path", "Reason"], missingItems.map(item => [item.word, item.skill, item.questionId, item.targetPath, item.reason]))
    : "No missing target-word audio was found for checked active target-audio items.",
  "",
  "## Failures",
  "",
  failures.length ? failures.map(failure => `- ${failure}`).join("\n") : "No blocking audio-role consistency failures found."
];
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${lines.join("\n")}\n`);

if (missingItems.length) {
  const existing = fs.existsSync(replacementRequestPath) ? fs.readFileSync(replacementRequestPath, "utf8") : "";
  const addendumHeader = "\n\n## Assessment Audio Role Consistency Missing Target-Word Audio\n";
  const addendum = [
    addendumHeader,
    "",
    "Generated by `node tools/checkAssessmentAudioRoleConsistency.js`.",
    "",
    markdownTable(
      ["Word", "Skill", "Question", "Required destination", "Instruction"],
      missingItems.map(item => [
        item.word,
        item.skill,
        item.questionId,
        item.targetPath,
        `Record MP3 saying exactly: \"${item.word}\". Neutral soft American female voice. No extra words, no spelling, no music, no effects.`
      ])
    )
  ].join("\n");
  if (!existing.includes("Assessment Audio Role Consistency Missing Target-Word Audio")) {
    fs.writeFileSync(replacementRequestPath, `${existing.trimEnd()}${addendum}\n`);
  }
}

if (failures.length) {
  console.error(`Assessment audio role consistency failed with ${failures.length} issue(s).`);
  console.error(failures.slice(0, 20).join("\n"));
  process.exit(1);
}

console.log("Assessment audio role consistency passed.");
console.log(`Active questions scanned: ${activeCount}`);
console.log(`Short vowel listen items checked: ${shortVowelListenCount}`);
console.log(`Generic target-audio mappings corrected by normalization: ${fixedGenericTargetAudioCount}`);
console.log(`Missing target-word audio requests: ${missingItems.length}`);
console.log(`Wrote ${path.relative(repoRoot, reportPath)}`);
