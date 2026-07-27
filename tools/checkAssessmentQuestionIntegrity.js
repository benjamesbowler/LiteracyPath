import path from "node:path";

import {
  getQuestionAudioPaths,
  getQuestionImagePaths,
  loadCoreQuestionPool,
  normalizeWord,
  publicPathExists,
  repoRoot,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";
import { guidedReadingSeriesBooks } from "../src/data/guidedReadingSeriesBooks.js";
import { getApprovedAudioPath } from "../src/data/audioPreferenceManifest.js";
import { getAssessmentMediaWiring } from "../src/content/assessments/assessmentMediaReleaseManifest.js";
import {
  getListenAndFindAssetDiagnostics,
  isListenAndFindWordQuestion
} from "../src/data/listenAndFindAssets.js";
import { getEarlySkillRuntimeEligibilityIssues } from "../src/utils/earlySkills/isRuntimeEligibleEarlySkillQuestion.js";
import {
  getHfwSpellingQuestionIssues,
  isHfwSpellingQuestionCandidate
} from "../src/data/isHfwSpellingQuestion.js";

const reportPath = path.join(repoRoot, "docs", "validation", "assessment_question_integrity_audit.md");
const guidedReadingReplacementPath = path.join(repoRoot, "docs", "assets", "guided_reading_page_replacement_queue.md");
const HFW_SKILL_IDS = ["hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"];

function optionValue(option) {
  if (option && typeof option === "object") {
    return option.value || option.word || option.label || option.text || option.answer || "";
  }
  return option || "";
}

function optionValues(question = {}) {
  return [
    ...(Array.isArray(question.choices) ? question.choices : []),
    ...(Array.isArray(question.answerOptions) ? question.answerOptions : []),
    ...(Array.isArray(question.options) ? question.options : []),
    ...(Array.isArray(question.imageCards) ? question.imageCards : [])
  ].map(optionValue).map(normalizeWord).filter(Boolean);
}

function correctAnswers(question = {}) {
  if (Array.isArray(question.correctAnswers) && question.correctAnswers.length) {
    return question.correctAnswers.map(normalizeWord).filter(Boolean);
  }
  return [question.correctAnswer || question.answer].map(normalizeWord).filter(Boolean);
}

function targetWord(question = {}) {
  return normalizeWord(question.targetWord || question.audioText || question.answer || question.correctAnswer);
}

function imageStem(imagePath = "") {
  return normalizeWord(path.basename(String(imagePath || "")).replace(/\.[^.]+$/, ""));
}

function optionArrayImageMixIssues(question = {}) {
  const fields = ["answerOptions", "options", "imageCards"];
  return fields.flatMap(field => {
    const options = question[field];
    if (!Array.isArray(options) || !options.length) return [];
    const imageCount = options.filter(option =>
      option && typeof option === "object" && (option.image || option.imagePath || option.imageUrl)
    ).length;
    if (imageCount > 0 && imageCount !== options.length) {
      return [`${field} mixes image-backed and text-only cards`];
    }
    return [];
  });
}

function audioIssues(question = {}) {
  const word = targetWord(question);
  const releaseApprovedPaths = new Set(
    getAssessmentMediaWiring(question.id)
      .filter(entry => entry.mediaType === "audio")
      .map(entry => entry.filePath)
  );
  return [...new Set(getQuestionAudioPaths(question))].flatMap(audioPath => {
    if (!String(audioPath).startsWith("/")) return [];
    if (!publicPathExists(audioPath)) return [`missing audio file: ${audioPath}`];
    if (releaseApprovedPaths.has(audioPath)) return [];
    if (!getApprovedAudioPath(word || question.audioKey || question.audioText, audioPath)) {
      return [`audio is not approved for active runtime: ${audioPath}`];
    }
    return [];
  });
}

function imageIssues(question = {}) {
  const word = targetWord(question);
  const directImages = [question.imagePath, question.imageUrl, question.image].filter(Boolean);
  const issues = [];

  for (const imagePath of getQuestionImagePaths(question)) {
    if (String(imagePath).startsWith("/") && !publicPathExists(imagePath)) {
      issues.push(`missing image file: ${imagePath}`);
    }
  }

  for (const imagePath of directImages) {
    const stem = imageStem(imagePath);
    if (word && stem && !stem.includes(word) && !word.includes(stem)) {
      issues.push(`target image "${imagePath}" does not appear to match target word "${word}"`);
    }
  }

  return issues;
}

function questionIssues(question = {}) {
  const issues = [];
  const options = [...new Set(optionValues(question))];
  const answers = correctAnswers(question);

  if (!answers.length) issues.push("missing correctAnswer/answer");
  if (options.length > 0) {
    for (const answer of answers) {
      if (answer && !options.includes(answer)) {
        issues.push(`correct answer "${answer}" is missing from answer options`);
      }
    }
  }

  if (isListenAndFindWordQuestion(question)) {
    const diagnostics = getListenAndFindAssetDiagnostics(question);
    if (!diagnostics) {
      issues.push("listen-and-find diagnostics unavailable");
    } else {
      if (!diagnostics.answerInChoices) issues.push("listen-and-find correct answer missing from choices");
      if (!diagnostics.targetMatchesAnswer) issues.push("listen-and-find targetWord differs from correctAnswer");
      if (!diagnostics.usesSingleWordAudioText) issues.push("listen-and-find audioText differs from correctAnswer");
      if (diagnostics.missingAudio) issues.push("listen-and-find target word has no approved audio");
      if (diagnostics.missingImages.length) issues.push(`listen-and-find choice images missing: ${diagnostics.missingImages.join(", ")}`);
    }
  }

  return [...new Set(issues)];
}

function selectableIssues(question = {}) {
  return [
    ...questionIssues(question),
    ...optionArrayImageMixIssues(question),
    ...audioIssues(question),
    ...imageIssues(question)
  ];
}

function guidedReadingPagesNeedingReplacement() {
  return guidedReadingSeriesBooks.flatMap(book =>
    (book.pages || [])
      .filter(page => page.active === false || (page.qaStatus && page.qaStatus !== "approved"))
      .map(page => ({
        book,
        page,
        reason: page.regenerationReason || page.qaNotes || "Page image is not production-approved."
      }))
  );
}

const activeQuestions = loadCoreQuestionPool().filter(question => question.active !== false);
const questionFailures = activeQuestions
  .map(question => ({ question, issues: questionIssues(question) }))
  .filter(row => row.issues.length);

const cvcSelectable = selectableRuntimeQuestionsForSkill("cvc_short_vowels");
const shortVowelSelectable = selectableRuntimeQuestionsForSkill("short_vowel_discrimination");
const cvcRuntimeFailures = cvcSelectable
  .map(question => ({
    question,
    issues: [
      ...getEarlySkillRuntimeEligibilityIssues(question, {
        skillId: "cvc_short_vowels",
        level: question.level || question.difficulty || 1,
        pathExists: publicPathExists
      }),
      ...selectableIssues(question)
    ]
  }))
  .filter(row => row.issues.length);
const shortVowelRuntimeFailures = shortVowelSelectable
  .map(question => ({
    question,
    issues: [
      ...getEarlySkillRuntimeEligibilityIssues(question, {
        skillId: "short_vowel_discrimination",
        level: question.level || question.difficulty || 1,
        pathExists: publicPathExists
      }),
      ...selectableIssues(question)
    ]
  }))
  .filter(row => row.issues.length);
const hfwSpellingCandidates = HFW_SKILL_IDS.flatMap(skillId =>
  selectableRuntimeQuestionsForSkill(skillId)
    .filter(isHfwSpellingQuestionCandidate)
    .map(question => ({ skillId, question }))
);
const hfwSpellingFailures = hfwSpellingCandidates
  .map(row => ({
    ...row,
    issues: getHfwSpellingQuestionIssues(row.question)
  }))
  .filter(row => row.issues.length);
const blockedAudioCandidates = activeQuestions
  .map(question => ({ question, issues: audioIssues(question) }))
  .filter(row => row.issues.length);

const guidedRows = guidedReadingPagesNeedingReplacement();

const questionRows = questionFailures.length
  ? questionFailures.slice(0, 200).map(row =>
      `| ${row.question.id || "(missing)"} | ${row.question._source || ""} | ${row.question.skillId || row.question.skill || ""} | ${targetWord(row.question)} | ${row.issues.join("; ").replace(/\|/g, "\\|")} |`
    )
  : ["| none | none | none | none | No active runtime question integrity failures found. |"];

const guidedRowsMarkdown = guidedRows.length
  ? guidedRows.map(row =>
      `| ${row.book.id} | ${row.book.title.replace(/\|/g, "\\|")} | ${row.page.pageNumber} | ${row.page.image} | ${row.page.qaStatus || ""} | ${row.reason.replace(/\|/g, "\\|")} |`
    )
  : ["| none | none | none | none | none | No guided reading pages currently need replacement. |"];

const hfwSpellingRowsMarkdown = hfwSpellingFailures.length
  ? hfwSpellingFailures.map(row =>
      `| ${row.skillId} | ${row.question.id || row.question.questionId || "(missing)"} | ${targetWord(row.question)} | ${row.issues.join("; ").replace(/\|/g, "\\|")} |`
    )
  : ["| none | none | none | All HFW spelling rows are ready for the letter-build panel. |"];

const report = [
  "# Assessment Question Integrity Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Summary",
  "",
  `- Active runtime question candidates checked: ${activeQuestions.length}`,
  `- Active question integrity failures: ${questionFailures.length}`,
  `- CVC selectable runtime questions checked: ${cvcSelectable.length}`,
  `- CVC selectable runtime failures: ${cvcRuntimeFailures.length}`,
  `- Short Vowel Discrimination selectable runtime questions checked: ${shortVowelSelectable.length}`,
  `- Short Vowel Discrimination selectable runtime failures: ${shortVowelRuntimeFailures.length}`,
  `- HFW spelling panel rows checked: ${hfwSpellingCandidates.length}`,
  `- HFW spelling panel readiness failures: ${hfwSpellingFailures.length}`,
  `- Active candidates blocked by unapproved audio: ${blockedAudioCandidates.length}`,
  `- Guided Reading pages marked for replacement / QA failed: ${guidedRows.length}`,
  "",
  "## Active Question Failures",
  "",
  "| Question ID | Source | Skill | Target | Issues |",
  "|---|---|---|---|---|",
  ...questionRows,
  "",
  "## HFW Spelling Panel Readiness",
  "",
  "| Skill | Question ID | Target | Issues |",
  "|---|---|---|---|",
  ...hfwSpellingRowsMarkdown,
  "",
  "## Guided Reading Pages Needing Replacement",
  "",
  "| Book ID | Title | Page | Image | QA Status | Reason |",
  "|---|---|---:|---|---|---|",
  ...guidedRowsMarkdown,
  ""
];

writeFile(reportPath, `${report.join("\n")}\n`);

const replacementDoc = [
  "# Guided Reading Page Replacement Queue",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "These page images are preserved in place for traceability but are not production-approved.",
  "",
  "| Priority | Book ID | Title | Page | Current path | Required replacement path | Reason | Generation notes |",
  "|---|---|---|---:|---|---|---|---|",
  ...guidedRows.map(row =>
    `| P1 | ${row.book.id} | ${row.book.title.replace(/\|/g, "\\|")} | ${row.page.pageNumber} | ${row.page.image} | ${row.page.image} | ${row.reason.replace(/\|/g, "\\|")} | Match Meadow Pals Level A style; no embedded text, source marks, logos, or captions. Keep Shy and Cuddly fully visible with no cropped ears/details. |`
  )
];

writeFile(guidedReadingReplacementPath, `${replacementDoc.join("\n")}\n`);

if (
  questionFailures.length
  || cvcRuntimeFailures.length
  || shortVowelRuntimeFailures.length
  || hfwSpellingFailures.length
  || guidedRows.length
) {
  console.error(`Assessment question integrity failures: ${questionFailures.length}`);
  questionFailures.slice(0, 30).forEach(row => {
    console.error(`- ${row.question.id || "(missing)"}: ${row.issues.join("; ")}`);
  });
  if (cvcRuntimeFailures.length) {
    console.error(`CVC selectable runtime failures: ${cvcRuntimeFailures.length}`);
    cvcRuntimeFailures.slice(0, 30).forEach(row => {
      console.error(`- ${row.question.id || "(missing)"}: ${row.issues.join("; ")}`);
    });
  }
  if (shortVowelRuntimeFailures.length) {
    console.error(`Short Vowel Discrimination selectable runtime failures: ${shortVowelRuntimeFailures.length}`);
    shortVowelRuntimeFailures.slice(0, 30).forEach(row => {
      console.error(`- ${row.question.id || "(missing)"}: ${row.issues.join("; ")}`);
    });
  }
  if (hfwSpellingFailures.length) {
    console.error(`HFW spelling panel readiness failures: ${hfwSpellingFailures.length}`);
  }
  if (guidedRows.length) {
    console.error(`Guided Reading pages needing replacement: ${guidedRows.length}`);
  }
  process.exit(1);
}

console.log("Assessment question integrity passed.");
console.log(`Guided Reading pages needing replacement: ${guidedRows.length}`);
console.log(`Wrote ${path.relative(repoRoot, reportPath)}`);
console.log(`Wrote ${path.relative(repoRoot, guidedReadingReplacementPath)}`);
