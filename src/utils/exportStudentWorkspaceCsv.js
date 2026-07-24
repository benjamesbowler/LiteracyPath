import { buildMetricDefinitionRows } from "./metricDefinitions.js";
import { buildExportProvenanceRows } from "./exportProvenance.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function statusLabel(value) {
  if (value && typeof value === "object") return value.label || value.id || "";
  return value || "";
}

function attemptQuestions(attempt = {}) {
  const raw = attempt.raw && typeof attempt.raw === "object" ? attempt.raw : attempt;
  if (Array.isArray(raw.questionRecords)) return raw.questionRecords;
  if (Array.isArray(raw.items)) return raw.items;
  return [];
}

function wholeChildRows(workspace = {}) {
  const report = workspace.wholeChild || {};
  const summaryRows = [
    ...asArray(report.concepts).map(item => ({
      "Section": "Summary",
      "Row type": "Knowledge summary",
      "Literacy area": item.domainLabel,
      "Knowledge or skill": item.label,
      "Status": statusLabel(item.status),
      "Interpretation": item.explanation,
      "Evidence sources": asArray(item.evidence).map(row => row.sourceLabel).filter(Boolean),
      "Latest evidence": item.latestAt || ""
    })),
    ...asArray(report.descriptiveAssessments).map(assessment => ({
      "Section": "Summary",
      "Row type": "Descriptive assessment summary",
      "Literacy area": "EL Assessments",
      "Knowledge or skill": assessment.title || assessment.label,
      "Status": "Descriptive evidence (not a mastery rating)",
      "Interpretation": assessment.interpretation || assessment.resultLabel || "Evidence recorded",
      "Evidence sources": "EL Assessments",
      "Latest evidence": assessment.latestAt || ""
    }))
  ];
  const appendixRows = asArray(report.evidence).map(evidence => ({
    "Section": "Evidence appendix",
    "Row type": "Evidence record",
    "Literacy area": evidence.concept?.domainLabel || evidence.concept?.domain || "",
    "Knowledge or skill": evidence.concept?.label || "",
    "Status": statusLabel(evidence.status || evidence.statusCandidate || evidence.outcome),
    "Interpretation": evidence.details?.detail || evidence.details?.prompt || evidence.outcomeLabel || "",
    "Evidence sources": evidence.sourceLabel || evidence.sourceArea || "",
    "Latest evidence": evidence.observedAt || "",
    "Evidence ID": evidence.evidenceId || "",
    "Source record ID": evidence.sourceRecordId || ""
  }));
  return [...summaryRows, ...appendixRows];
}

function skillsCheckRows(workspace = {}) {
  const report = workspace.skillsCheck || {};
  const skillRows = asArray(report.skills).map(skill => ({
    "Section": "Summary",
    "Row type": "Skill summary",
    "Skill": skill.skillName,
    "Status": statusLabel(skill.currentStatus || skill.status),
    "Attempts": skill.attemptCount,
    "Correct": skill.latestCorrectCount ?? skill.correctCount ?? "",
    "Questions": skill.latestTotalQuestions ?? skill.totalQuestions ?? "",
    "Accuracy": skill.accuracy == null ? "" : `${skill.accuracy}%`,
    "Latest evidence": skill.latestAt || ""
  }));
  const itemRows = asArray(report.items).map(item => ({
    "Section": "Evidence appendix",
    "Row type": "Item summary",
    "Skill": item.concept?.label || "",
    "Status": statusLabel(item.status),
    "Attempts": item.details?.observations ?? "",
    "Correct": item.details?.correct ?? "",
    "Questions": item.details?.observations ?? "",
    "Accuracy": item.details?.accuracy == null ? "" : `${item.details.accuracy}%`,
    "Latest evidence": item.observedAt || "",
    "Evidence ID": item.evidenceId || "",
    "Source record ID": item.sourceRecordId || ""
  }));
  const attemptRows = asArray(report.attempts).map(attempt => {
    const raw = attempt.raw && typeof attempt.raw === "object" ? attempt.raw : attempt;
    return {
      "Section": "Evidence appendix",
      "Row type": "Assessment attempt",
      "Skill": raw.skillName || raw.skillId || "",
      "Status": statusLabel(attempt.status || attempt.scoreStatus),
      "Attempts": 1,
      "Correct": attempt.correctCount ?? "",
      "Questions": attempt.totalQuestions ?? "",
      "Accuracy": attempt.accuracy == null ? "" : `${attempt.accuracy}%`,
      "Latest evidence": attempt.completedAt || "",
      "Attempt ID": attempt.attemptId || raw.attemptId || "",
      "Administration status": attempt.administrationStatus || raw.administrationStatus || "",
      "Form version": attempt.formVersion || raw.formVersion || "",
      "Content version": attempt.contentVersion || raw.contentVersion || "",
      "Scoring version": attempt.scoringVersion || raw.scoringVersion || raw.scoringRuleVersion || ""
    };
  });
  const questionRows = asArray(report.attempts).flatMap(attempt => {
    const raw = attempt.raw && typeof attempt.raw === "object" ? attempt.raw : attempt;
    return attemptQuestions(attempt).map((question, index) => ({
      "Section": "Evidence appendix",
      "Row type": "Question evidence",
      "Skill": raw.skillName || raw.skillId || "",
      "Status": question.responseStatus || (question.isCorrect === true ? "correct" : question.isCorrect === false ? "incorrect" : ""),
      "Correct": question.isCorrect === true ? 1 : question.isCorrect === false ? 0 : "",
      "Latest evidence": question.timestamp || attempt.completedAt || "",
      "Attempt ID": attempt.attemptId || raw.attemptId || "",
      "Question ID": question.questionId || question.id || `question-${index + 1}`,
      "Item type": question.itemType || "",
      "Item key": question.itemKey || question.targetWord || question.targetPattern || question.targetSound || question.targetLetter || "",
      "Prompt": question.prompt || question.question || "",
      "Selected answer": question.selectedAnswer || question.responseText || "",
      "Correct answer": question.correctAnswer || ""
    }));
  });
  return [...skillRows, ...itemRows, ...attemptRows, ...questionRows];
}

function otherLearningRows(workspace = {}) {
  const report = workspace.otherLearning || {};
  return [
    ...asArray(report.soundSeekers?.sounds)
      .filter(sound => Number(sound.seen || 0) > 0)
      .map(sound => ({
        "Section": "Evidence appendix",
        "Row type": "Practice evidence",
        "Learning area": "Sound Seekers",
        "Activity": sound.label,
        "Evidence": sound.sourceResult || "Practised",
        "Practice count": sound.seen || "",
        "Latest evidence": sound.lastActiveAt || ""
      })),
    ...asArray(report.arcade?.games).map(game => ({
      "Section": "Evidence appendix",
      "Row type": "Practice evidence",
      "Learning area": "Arcade",
      "Activity": game.title || game.gameId,
      "Evidence": game.skillPractised ? `Practised: ${game.skillPractised}` : "Game practice",
      "Practice count": game.plays || "",
      "Latest evidence": game.lastPlayedAt || ""
    })),
    ...asArray(report.storyQuests?.stories).map(story => ({
      "Section": "Evidence appendix",
      "Row type": "Practice evidence",
      "Learning area": "Story Quests",
      "Activity": story.title || story.questId,
      "Evidence": story.completed ? "Completed" : "In progress",
      "Words encountered": story.wordsEncountered || [],
      "Latest evidence": story.lastActivityAt || story.completedAt || ""
    }))
  ];
}

export function buildStudentWorkspaceCsvRows(viewId, workspace = {}, options = {}) {
  const reportRows = viewId === "whole-child"
    ? wholeChildRows(workspace)
    : viewId === "skills-check"
      ? skillsCheckRows(workspace)
      : viewId === "other-learning"
        ? otherLearningRows(workspace)
        : [];
  if (!reportRows.length) return [];
  const definitionRows = buildMetricDefinitionRows().map(row => ({
    "Section": "Metric definitions",
    "Row type": "Metric definition",
    ...row
  }));
  const provenanceRows = buildExportProvenanceRows({
    reportTitle: options.reportTitle || `Student ${viewId} report`,
    schoolName: options.schoolName,
    className: options.className,
    learnerName: options.learnerName || workspace.student?.name,
    learnerId: options.learnerId || workspace.student?.id,
    learnerCount: 1,
    generatedAt: options.generatedAt || workspace.generatedAt,
    timeZone: options.timeZone,
    filters: options.filters || { "Report view": viewId },
    evidenceSource: options.evidenceSource || workspace.skillsCheck?.attempts || [],
    versionSummary: options.versionSummary,
    appVersion: options.appVersion,
    definitions: "Metric definition rows are included in this CSV file."
  }).map(row => ({
    "Section": "Report provenance",
    "Row type": "Provenance",
    "Field": row.field,
    "Value": row.value
  }));
  return [...provenanceRows, ...reportRows, ...definitionRows];
}
