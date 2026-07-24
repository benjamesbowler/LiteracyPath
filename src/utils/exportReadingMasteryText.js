import { buildMetricDefinitionsText } from "./metricDefinitions.js";
import {
  buildPresetExportProvenanceRows,
  exportProvenanceTextBlock
} from "./exportProvenance.js";

function formatExportValue(value) {
  if (Array.isArray(value)) return value.map(formatExportValue).filter(Boolean).join(" | ");
  if (value && typeof value === "object") {
    if (value.word) return formatExportValue(value.word);
    if (value.label) return formatExportValue(value.label);
    if (value.text) return formatExportValue(value.text);
    return JSON.stringify(value);
  }
  return String(value ?? "");
}

function buildQuestionExportText(item = {}) {
  return [formatExportValue(item.passage), formatExportValue(item.question || item.prompt)]
    .filter(Boolean)
    .join(" ");
}

function summarizeTargets(records = []) {
  const targetStats = {};
  records.forEach(record => {
    const target = record.diagnosticTarget || "general";
    if (!targetStats[target]) targetStats[target] = { correct: 0, total: 0 };
    targetStats[target].total += 1;
    if (record.isCorrect) targetStats[target].correct += 1;
  });

  const summary = { secure: [], developing: [], needsPractice: [] };
  Object.entries(targetStats).forEach(([target, stats]) => {
    const accuracy = stats.correct / stats.total;
    const label = `${target} (${stats.correct}/${stats.total})`;
    if (stats.total >= 2 && accuracy >= 0.9) summary.secure.push(label);
    else if (accuracy >= 0.6) summary.developing.push(label);
    else summary.needsPractice.push(label);
  });
  return summary;
}

function summarizeSkill(stage, answerHistory, mastery, currentStage) {
  const records = answerHistory.filter(item => item.stage === stage.label);
  const data = mastery[stage.id];
  if (records.length === 0 && !data) return `${stage.label}: Not yet reached or tested.`;
  if (records.length === 0) {
    return `${stage.label}: Started, but no individual question data has been recorded yet.`;
  }

  const correct = records.filter(record => record.isCorrect).length;
  const summary = summarizeTargets(records);
  let note = `${stage.label}: ${correct}/${records.length} correct. `;
  if (data?.mastered) note += "Status: checkpoint passed. ";
  else if (stage.id === currentStage.id) note += "Status: current working skill. ";
  else note += "Status: attempted, checkpoint not yet passed. ";
  note += `\nSecure: ${summary.secure.length ? summary.secure.join(", ") : "No secure subskills recorded yet."}`;
  note += `\nDeveloping: ${summary.developing.length ? summary.developing.join(", ") : "No developing subskills recorded yet."}`;
  note += `\nNeeds practice: ${summary.needsPractice.length ? summary.needsPractice.join(", ") : "No specific needs recorded yet."}`;
  return note;
}

export function buildReadingMasteryTextReport({
  accuracy = 0,
  answerHistory = [],
  className = "",
  correctAnswered = 0,
  currentSkillIndex = 0,
  currentStage = {},
  generatedAt = new Date(),
  guidedReadingRecords = {},
  guidedReadingSummaries = [],
  mastery = {},
  passScore = 0,
  roundCorrect = 0,
  roundLength = 0,
  skillTree = [],
  studentId = "",
  studentName = "",
  totalAnswered = 0
} = {}) {
  const learnerName = studentName || "Unnamed student";
  const generatedDate = generatedAt instanceof Date ? generatedAt : new Date(generatedAt);
  const provenanceText = exportProvenanceTextBlock(buildPresetExportProvenanceRows("reading-text", {
    className,
    learnerName,
    learnerId: studentId,
    generatedAt: generatedDate,
    evidenceSource: [answerHistory, guidedReadingRecords]
  }));

  return `
Reading Mastery Report

Student: ${learnerName}
Date: ${generatedDate.toISOString().slice(0, 10)}

${provenanceText}

Overall Summary
Questions answered: ${totalAnswered}
Correct answers: ${correctAnswered}
Accuracy: ${accuracy}%

Current Position
Current skill: ${currentSkillIndex + 1}. ${currentStage.label}
Current round score: ${roundCorrect}/${roundLength}
Checkpoint rule: ${passScore}/${roundLength} correct to unlock the next skill.

Guided Reading

${guidedReadingSummaries.length
    ? guidedReadingSummaries.map(item =>
      `${item.title} (${item.type}, Level ${item.level}): ${item.correct}/${item.attempted} words read correctly (${item.accuracy}%). Support words: ${item.supportWords.length ? item.supportWords.join(", ") : "none"}. Notes: ${[item.wholeBookNote, ...item.pageNotes.map(note => `Page ${note.page}: ${note.note}`)].filter(Boolean).join(" | ") || "none"}`
    ).join("\n")
    : "No guided reading records saved yet."}

Teacher Notes by Skill

${skillTree.map(stage => summarizeSkill(stage, answerHistory, mastery, currentStage)).join("\n\n")}

Question Evidence

${answerHistory.map((item, index) => `${index + 1}. Skill: ${item.stage}
Question: ${buildQuestionExportText(item)}
Student answered: ${formatExportValue(item.chosen)}
Correct answer: ${formatExportValue(item.correct)}
Result: ${item.isCorrect ? "Correct" : "Incorrect"}`).join("\n\n")}

Metric Definitions

${buildMetricDefinitionsText()}
`.trim();
}

export function exportReadingMasteryText(options = {}) {
  const generatedAt = options.generatedAt instanceof Date ? options.generatedAt : new Date(options.generatedAt);
  const reportText = buildReadingMasteryTextReport({ ...options, generatedAt });
  const safeName = (options.studentName || "Unnamed student")
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
  const blob = new Blob([reportText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeName}_reading_mastery_report_${generatedAt.toISOString().slice(0, 10)}.txt`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return reportText;
}
