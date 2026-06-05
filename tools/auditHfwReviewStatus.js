import fs from "node:fs";
import path from "node:path";

import { hfwAssessmentQuestions } from "../src/data/generated/hfwAssessmentQuestions.generated.js";
import { hfwQuestionReviewBlocklist } from "../src/data/generated/hfwQuestionReviewBlocklist.generated.js";
import { HFW_WORD_BANDS } from "../src/data/highFrequencyWordBands.js";
import {
  buildRuntimeQuestionsForSkill,
  sampleRound,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const HFW_SKILLS = ["hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"];
const reviewWorkbookPath = path.join(repoRoot, "docs", "review", "hfw_question_review.xlsx");
const outputJsonPath = path.join(repoRoot, "docs", "validation", "hfw_question_review_audit.json");
const outputMdPath = path.join(repoRoot, "docs", "validation", "hfw_question_review_audit.md");

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = keyFn(row) || "(blank)";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function table(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(value => String(value ?? "").replace(/\|/g, "\\|")).join(" | ")} |`)
  ].join("\n");
}

function phaseDepth(skillId) {
  const selectable = selectableRuntimeQuestionsForSkill(skillId);
  const rows = [];
  for (const level of [1, 2]) {
    for (const phase of [1, 2]) {
      const phaseRows = selectable.filter(question => Number(question.level) === level && Number(question.phase) === phase);
      rows.push({
        skillId,
        level,
        phase,
        selectable: phaseRows.length,
        sampleRound: sampleRound(phaseRows, 15).length,
        enoughForRound: sampleRound(phaseRows, 15).length === 15
      });
    }
  }
  return rows;
}

const reviewedTotal = hfwAssessmentQuestions.filter(question => HFW_SKILLS.includes(question.skillId)).length;
const rejectedRows = hfwQuestionReviewBlocklist;
const remainingByBand = Object.fromEntries(HFW_SKILLS.map(skillId => [skillId, selectableRuntimeQuestionsForSkill(skillId).length]));
const runtimeByBand = Object.fromEntries(HFW_SKILLS.map(skillId => [skillId, buildRuntimeQuestionsForSkill(skillId).length]));
const phaseRows = HFW_SKILLS.flatMap(phaseDepth);
const report = {
  reviewWorkbook: fs.existsSync(reviewWorkbookPath) ? "present" : "missing",
  totalHfwQuestionsReviewed: reviewedTotal,
  acceptedCount: reviewedTotal - rejectedRows.length,
  rejectedCount: rejectedRows.length,
  rejectedByBand: countBy(rejectedRows, row => row.skillId),
  rejectedByTargetWord: countBy(rejectedRows, row => row.targetWord),
  rejectedByReason: countBy(rejectedRows, row => row.reason),
  remainingSelectableByBand: remainingByBand,
  runtimePoolByBand: runtimeByBand,
  bandWords: Object.fromEntries(HFW_SKILLS.map(skillId => [skillId, HFW_WORD_BANDS[skillId]?.length || 0])),
  phaseDepth: phaseRows,
  enoughFor15QuestionRounds: phaseRows.every(row => row.enoughForRound),
  examples: rejectedRows.slice(0, 25)
};

writeFile(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`);
writeFile(outputMdPath, [
  "# HFW Question Review Audit",
  "",
  `- Review workbook: ${report.reviewWorkbook}`,
  `- Total HFW questions reviewed/exported: ${report.totalHfwQuestionsReviewed}`,
  `- Accepted count: ${report.acceptedCount}`,
  `- Rejected count: ${report.rejectedCount}`,
  `- Enough for 15-question rounds: ${report.enoughFor15QuestionRounds ? "yes" : "no"}`,
  "",
  "## Remaining Selectable By Band",
  "",
  table(["Skill", "Selectable", "Runtime Pool", "Band Words"], HFW_SKILLS.map(skillId => [
    skillId,
    remainingByBand[skillId],
    runtimeByBand[skillId],
    report.bandWords[skillId]
  ])),
  "",
  "## Phase Depth",
  "",
  table(["Skill", "Level", "Phase", "Selectable", "Sample Round", "Enough"], phaseRows.map(row => [
    row.skillId,
    row.level,
    row.phase,
    row.selectable,
    row.sampleRound,
    row.enoughForRound ? "yes" : "no"
  ])),
  "",
  "## Rejected Examples",
  "",
  rejectedRows.length
    ? table(["Question ID", "Skill", "Target", "Reason", "Sentence"], rejectedRows.slice(0, 25).map(row => [
      row.questionId,
      row.skillId,
      row.targetWord,
      row.reason,
      row.sentenceWithBlank
    ]))
    : "None.",
  ""
].join("\n"));

console.log(JSON.stringify({
  totalHfwQuestionsReviewed: report.totalHfwQuestionsReviewed,
  rejectedCount: report.rejectedCount,
  remainingSelectableByBand: report.remainingSelectableByBand,
  enoughFor15QuestionRounds: report.enoughFor15QuestionRounds
}, null, 2));
