import path from "node:path";

import { getApprovedAudioPath } from "../src/data/audioPreferenceManifest.js";
import {
  getHfwBandDuplicates,
  getHfwBandWords,
  HFW_WORD_BANDS,
  normalizeHfwSkillId
} from "../src/data/highFrequencyWordBands.js";
import { getHfwRuntimeEligibilityIssues } from "../src/data/hfwRuntimeEligibility.js";
import {
  normalizeWord,
  repoRoot,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";

const skillChecks = [
  { id: "initial_sounds", label: "Initial Sounds", itemTypes: new Set(["initial_sound"]), forbidden: /\b(short vowel|cvc|rhym|ending|final)\b/i },
  { id: "final_sounds", label: "Final Sounds", itemTypes: new Set(["final_sound"]), forbidden: /\b(short vowel|cvc|rhym|beginning|initial|first sound)\b/i },
  { id: "rhyming", label: "Rhyming", itemTypes: new Set(["rhyming_family"]), requiredFormat: "RHYMING_PICTURE", forbidden: /\b(short vowel|cvc|beginning|initial|ending|final)\b/i },
  { id: "cvc_short_vowels", label: "CVC and Short Vowels", itemTypes: new Set(["cvc_word", "short_vowel"]), forbidden: /\b(rhym|beginning sound|initial sound|ending sound|final sound)\b/i },
  { id: "short_vowel_discrimination", label: "Short Vowel Discrimination", itemTypes: new Set(["short_vowel"]), forbidden: /\b(rhym|beginning sound|initial sound|ending sound|final sound)\b/i }
];

const hfwSkillIds = ["hfw_1_25", "hfw_26_50", "hfw_51_100"];
const hfwForbiddenPrompt = /\b(short [aeiou]|short vowel|cvc|rhym|rime|beginning sound|initial sound|first sound|ending sound|final sound|blend|digraph|matches the picture|which word has the short)\b/i;

function format(question = {}) {
  return String(question.formatType || question.templateType || question.questionType || "UNKNOWN").toUpperCase();
}

function promptText(question = {}) {
  return [question.prompt, question.question, question.spokenPrompt, question.passage, question.sentence, question.context]
    .filter(Boolean)
    .join(" ");
}

function questionWord(question = {}) {
  return normalizeWord(question.itemKey || question.targetWord || question.audioText || question.answer || question.correctAnswer);
}

function optionWords(question = {}) {
  return [
    ...(Array.isArray(question.answerOptions) ? question.answerOptions : []),
    ...(Array.isArray(question.options) ? question.options : []),
    ...(Array.isArray(question.choices) ? question.choices : [])
  ]
    .map(option => {
      if (option && typeof option === "object") return option.value || option.word || option.label || option.text || option.answer || "";
      return option;
    })
    .map(normalizeWord)
    .filter(Boolean);
}

function answerOptionAudioState(question = {}) {
  const rawOptions = [
    ...(Array.isArray(question.answerOptions) ? question.answerOptions : []),
    ...(Array.isArray(question.options) ? question.options : []),
    ...(Array.isArray(question.choices) ? question.choices : [])
  ];
  const words = optionWords(question);
  if (!rawOptions.length || !words.length) return { mixed: false, words, withAudio: [] };
  const explicitlyAudioBacked = rawOptions
    .map(option => {
      if (option && typeof option === "object") {
        const word = normalizeWord(option.value || option.word || option.label || option.text || option.answer || "");
        const audio = option.audio || option.audioUrl || option.audioPath || "";
        return audio && getApprovedAudioPath(word, audio) ? word : "";
      }
      return "";
    })
    .filter(Boolean);
  const withAudio = explicitlyAudioBacked.length
    ? explicitlyAudioBacked
    : words.filter(word => Boolean(getApprovedAudioPath(word)));
  const rendererWouldShowAllOrNone = !explicitlyAudioBacked.length;
  return {
    mixed: !rendererWouldShowAllOrNone && withAudio.length > 0 && withAudio.length < words.length,
    words,
    withAudio
  };
}

function table(headers, rows) {
  return [
    `| ${headers.join(" |")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(value => String(value ?? "").replace(/\n/g, "<br>")).join(" | ")} |`)
  ].join("\n");
}

const failures = [];
const hfwRows = [];
const hfwRejectedRows = [];
const mixedAudioRows = [];
const skillRows = [];

for (const skillId of hfwSkillIds) {
  const questions = selectableRuntimeQuestionsForSkill(skillId);
  const bandId = normalizeHfwSkillId(skillId);
  const bandWords = getHfwBandWords(bandId);
  const rejected = [];

  for (const question of questions) {
    const issues = getHfwRuntimeEligibilityIssues(question, skillId);
    const audio = answerOptionAudioState(question);
    if (issues.length) rejected.push({ question, issues });
    if (hfwForbiddenPrompt.test(promptText(question))) {
      rejected.push({ question, issues: ["phonics/picture prompt leaked into HFW runtime"] });
    }
    if (audio.mixed) {
      mixedAudioRows.push([
        skillId,
        question.id,
        audio.words.join(", "),
        audio.withAudio.join(", ")
      ]);
    }
  }

  if (rejected.length) {
    failures.push(...rejected.map(item => `${skillId} ${item.question.id}: ${item.issues.join("; ")}`));
  }

  hfwRows.push([
    skillId,
    bandWords.length,
    questions.length,
    [...new Set(questions.map(questionWord).filter(Boolean))].sort().join(", "),
    rejected.length
  ]);
  hfwRejectedRows.push(...rejected.map(item => [
    skillId,
    item.question.id,
    format(item.question),
    questionWord(item.question),
    promptText(item.question),
    item.issues.join("; ")
  ]));
}

for (const check of skillChecks) {
  const questions = selectableRuntimeQuestionsForSkill(check.id);
  const issues = [];
  for (const question of questions) {
    const itemType = String(question.itemType || "").toLowerCase();
    if (itemType && !check.itemTypes.has(itemType)) issues.push(`${question.id}: itemType ${itemType}`);
    if (check.requiredFormat && format(question) !== check.requiredFormat) issues.push(`${question.id}: format ${format(question)}`);
    if (check.forbidden?.test(promptText(question))) issues.push(`${question.id}: forbidden prompt "${promptText(question)}"`);
    const audio = answerOptionAudioState(question);
    if (audio.mixed) {
      mixedAudioRows.push([
        check.id,
        question.id,
        audio.words.join(", "),
        audio.withAudio.join(", ")
      ]);
    }
  }
  failures.push(...issues.map(issue => `${check.id} ${issue}`));
  skillRows.push([check.id, check.label, questions.length, issues.length]);
}

const duplicateRows = getHfwBandDuplicates().map(item => [item.word, item.bands.join(", ")]);

const markdown = `# Assessment Skill Routing Audit

Generated: ${new Date().toISOString()}

## Summary

- Fatal routing failures: ${failures.length}
- HFW skills checked: ${hfwSkillIds.join(", ")}
- HFW band structure in this app: 1-25, 26-50, combined 51-100
- Mixed answer-card audio availability rows hidden by uniform renderer: ${mixedAudioRows.length}

## HFW Runtime Bands

${table(["Skill ID", "Allowed band words", "Runtime questions", "Runtime targets", "Rejected runtime questions"], hfwRows)}

## HFW Cross-Band / Cross-Skill Rejections

${hfwRejectedRows.length ? table(["Skill", "Question ID", "Format", "Target", "Prompt", "Reason"], hfwRejectedRows) : "_None._"}

## Existing Duplicate HFW Words Across Bands

${duplicateRows.length ? table(["Word", "Bands"], duplicateRows) : "_None._"}

## Early Skill Routing Checks

${table(["Skill ID", "Skill", "Runtime questions", "Routing issues"], skillRows)}

## Mixed Answer-Card Audio Availability

${mixedAudioRows.length ? `${table(["Skill", "Question ID", "Answer words", "Words with approved audio"], mixedAudioRows)}\n\nThe student renderer shows answer-card speakers only when every answer option has approved audio, so these rows do not display mixed speaker buttons.` : "_None._"}
`;

writeFile(path.join(repoRoot, "docs/validation/assessment_skill_routing_audit.md"), markdown);

console.log("Assessment Skill Routing Audit");
console.log(`HFW skills checked: ${hfwSkillIds.join(", ")}`);
console.table(hfwRows.map(([skillId, bandCount, runtimeCount, targets, rejected]) => ({
  skillId,
  bandCount,
  runtimeCount,
  rejected,
  targets: targets.split(", ").length
})));
console.log(`Mixed answer-card audio availability rows hidden by uniform renderer: ${mixedAudioRows.length}`);
console.log(`Fatal routing failures: ${failures.length}`);
console.log("Wrote docs/validation/assessment_skill_routing_audit.md");

if (failures.length) {
  console.error(failures.slice(0, 40).map(item => `- ${item}`).join("\n"));
  process.exit(1);
}
