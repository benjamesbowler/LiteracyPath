import { buildMetricDefinitionRows } from "./metricDefinitions.js";
import { buildLearningEvidenceProfile, learningEvidenceResponseKind } from "./learningEvidenceInsights.js";
import {
  buildExportProvenanceRows,
  resolveExportTimeZone
} from "./exportProvenance.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

const TEACHER_HIDDEN_REPORT_FIELDS = new Set([
  "App version(s)",
  "Assessment version(s)",
  "Content version(s)",
  "Scoring version(s)"
]);

const WORKSPACE_VIEW_LABELS = Object.freeze({
  "whole-child": "Student overview",
  "skills-check": "Skills assessment",
  "other-learning": "Other learning"
});

function exportDisplayText(value = "") {
  const source = String(value || "");
  const known = WORKSPACE_VIEW_LABELS[source.trim()];
  if (known) return known;
  const preserveLeadingCase = (match, replacement) => (
    /^[A-Z]/.test(match)
      ? `${replacement.charAt(0).toUpperCase()}${replacement.slice(1)}`
      : replacement
  );
  return source
    .replace(/\bBOY\b/g, "Beginning of year")
    .replace(/\bMOY\b/g, "Middle of year")
    .replace(/\bEOY\b/g, "End of year")
    .replace(/\bchecks?\b/gi, match => preserveLeadingCase(
      match,
      match.toLowerCase().endsWith("s") ? "assessments" : "assessment"
    ))
    .replace(/\bchildren\b/gi, match => preserveLeadingCase(match, "students"))
    .replace(/\bchild\b/gi, match => preserveLeadingCase(match, "student"))
    .replace(/\bevidence\b/gi, "results")
    .replace(/\blearners?\b/gi, match => preserveLeadingCase(
      match,
      match.toLowerCase().endsWith("s") ? "students" : "student"
    ))
    .replace(/\bstudents?\b/gi, match => preserveLeadingCase(
      match,
      match.toLowerCase().endsWith("s") ? "students" : "student"
    ))
    .replace(/\bincorrect\b/gi, "needs another look");
}

function exportDisplayFilters(filters, viewId) {
  const source = filters && typeof filters === "object" && !Array.isArray(filters)
    ? filters
    : { "Report view": viewId };
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [
      exportDisplayText(key),
      Array.isArray(value)
        ? value.map(exportDisplayText)
        : exportDisplayText(value)
    ])
  );
}

function statusLabel(value) {
  const raw = value && typeof value === "object" ? value.label || value.id || "" : value || "";
  const key = String(raw).trim().toLowerCase().replace(/[\s-]+/g, "_");
  const labels = {
    correct: "Correct",
    incorrect: "Needs another look",
    secure: "Secure",
    developing: "Growing",
    needs_teaching: "Needs support",
    needs_practice: "Needs support",
    not_assessed: "Not checked",
    not_recorded: "Not recorded",
    not_started: "Not started yet"
  };
  return labels[key] || String(raw).replace(/[_-]+/g, " ").replace(/^\w/, letter => letter.toUpperCase());
}

function attemptQuestions(attempt = {}) {
  const raw = attempt.raw && typeof attempt.raw === "object" ? attempt.raw : attempt;
  if (Array.isArray(raw.questionRecords)) return raw.questionRecords;
  if (Array.isArray(raw.items)) return raw.items;
  return [];
}

function isoTimestamp(value = "") {
  if (!value) return "";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : "";
}

function localTimestamp(value = "", timeZone = "UTC") {
  const utc = isoTimestamp(value);
  if (!utc) return "";
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      timeZoneName: "shortOffset"
    }).formatToParts(new Date(utc));
    const valueFor = type => parts.find(part => part.type === type)?.value || "";
    return `${valueFor("year")}-${valueFor("month")}-${valueFor("day")} ${valueFor("hour")}:${valueFor("minute")}:${valueFor("second")} ${valueFor("timeZoneName")} (${timeZone})`;
  } catch {
    return `${utc.replace("T", " ").replace(".000Z", " UTC")} (UTC)`;
  }
}

function evidenceTimeFields(value = "", options = {}, {
  basis = "Latest result",
  snapshotAt = ""
} = {}) {
  const timeZone = resolveExportTimeZone(options.timeZone);
  const evidenceUtc = isoTimestamp(value);
  const snapshotUtc = evidenceUtc ? "" : isoTimestamp(snapshotAt);
  return {
    "Results date basis": evidenceUtc
      ? basis
      : snapshotUtc
        ? "Current summary; answer date unavailable"
        : "No dated results",
    "Latest result (UTC)": evidenceUtc,
    "Teacher-local result time": localTimestamp(evidenceUtc, timeZone),
    "Snapshot taken (UTC)": snapshotUtc,
    "Teacher-local snapshot time": localTimestamp(snapshotUtc, timeZone),
    "Time zone": timeZone
  };
}

function evidenceWindowLabel(basis = {}) {
  const start = isoTimestamp(basis.windowStart);
  const end = isoTimestamp(basis.windowEnd);
  if (!start) return "No dated results";
  return start === end ? start : `${start} to ${end}`;
}

function wholeChildRows(workspace = {}, options = {}) {
  const report = workspace.wholeChild || {};
  const summaryRows = [
    ...asArray(report.concepts).map(item => {
      const basis = item.evidenceBasis || {};
      return {
        "Section": "Summary",
        "Row type": "Knowledge summary",
        "Literacy area": item.domainLabel,
        "Knowledge or skill": item.label,
        "Status": statusLabel(item.status),
        "Coverage": item.coverageLabel || (item.evidenceCount ? "Seen in saved results" : "Not seen in saved results"),
        "Interpretation": item.explanation,
        "Reconciliation note": item.reconciliationNote || "",
        "Result sources": asArray(item.evidence).map(row => row.sourceLabel).filter(Boolean),
        "Attempts": basis.attemptCount ?? 0,
        "Observations": basis.observations ?? 0,
        "Correct": basis.correct ?? "",
        "Answers counted": basis.total ?? 0,
        "Accuracy": basis.accuracy == null ? "" : `${basis.accuracy}%`,
        "Results period": evidenceWindowLabel(basis),
        ...evidenceTimeFields(item.latestAt, options)
      };
    }),
    ...asArray(report.descriptiveAssessments).map(assessment => ({
      "Section": "Summary",
      "Row type": "Descriptive assessment summary",
      "Literacy area": "EL assessments",
      "Knowledge or skill": assessment.title || assessment.label,
      "Status": "Descriptive results (not a pass rating)",
      "Interpretation": assessment.interpretation || assessment.resultLabel || "Results recorded",
      "Result sources": "EL assessments",
      "Attempts": assessment.attemptCount ?? "",
      "Results period": evidenceWindowLabel({
        windowStart: assessment.latestAt,
        windowEnd: assessment.latestAt
      }),
      ...evidenceTimeFields(assessment.latestAt, options)
    }))
  ];
  const appendixRows = asArray(report.evidence).map(evidence => {
    const observations = evidence.details?.observations ?? evidence.details?.independentSeen ?? evidence.details?.attempts ?? 1;
    return {
      "Section": "Result details",
      "Row type": "Saved result",
      "Literacy area": evidence.concept?.domainLabel || evidence.concept?.domain || "",
      "Knowledge or skill": evidence.concept?.label || "",
      "Status": statusLabel(evidence.status || evidence.statusCandidate || evidence.outcome),
      "Interpretation": evidence.details?.detail || evidence.details?.prompt || evidence.outcomeLabel || "",
      "Result sources": evidence.sourceLabel || evidence.sourceArea || "",
      "Attempts": evidence.details?.attempts ?? 1,
      "Observations": observations,
      "Correct": evidence.details?.correct ?? "",
      "Answers counted": observations,
      "Accuracy": evidence.details?.accuracy == null ? "" : `${evidence.details.accuracy}%`,
      "Results period": evidenceWindowLabel({
        windowStart: evidence.observedAt,
        windowEnd: evidence.observedAt
      }),
      ...evidenceTimeFields(evidence.observedAt, options, {
        basis: evidence.provenance?.timestampBasis === "per_sound_last_evidence"
          ? "Latest result for each sound"
          : "Observed result"
      })
    };
  });
  return [...summaryRows, ...appendixRows];
}

function skillsCheckRows(workspace = {}, options = {}) {
  const report = workspace.skillsCheck || {};
  const teachingRows = asArray(report.skills).flatMap(skill => {
    const profile = skill.learningEvidenceProfile || buildLearningEvidenceProfile(attemptQuestions(skill.latestAttempt || {}), { skillId: skill.skillId });
    return profile.targets.map(target => ({
      "Section": "Teach next",
      "Row type": "Recorded target and teaching move",
      "Skill": skill.skillName,
      "Skill code": skill.skillId,
      "Target": target.label,
      "Saved example words": target.exampleWords.join("; "),
      "Construct": target.constructLabel,
      "Question formats": target.formatLabels.join("; ") || "Not recorded",
      "Independent correct": target.correct,
      "Independent responses": target.scored,
      "Supported responses": target.supported,
      "Unavailable media": target.mediaFailed,
      "Unscored responses": target.unscored,
      "Recorded contrasts": target.confusions.map(row => `Selected ${row.selected}; expected ${row.expected} (${row.count})`).join("; "),
      "Recorded responses": target.recordedResponses.map(row => `${row.selected} (${row.kind}; ${row.count})`).join("; "),
      "Next teaching move": target.nextAction,
      "Claim boundary": profile.claimBoundary,
      ...evidenceTimeFields(skill.latestAt, options, { basis: "Latest saved assessment" })
    }));
  });
  const skillRows = asArray(report.skills).map(skill => ({
    "Section": "Summary",
    "Row type": "Skill summary",
    "Skill": skill.skillName,
    "Status": statusLabel(skill.currentStatus || skill.status),
    "Attempts": skill.attemptCount,
    "Correct": skill.latestCorrectCount ?? skill.correctCount ?? "",
    "Questions": skill.latestTotalQuestions ?? skill.totalQuestions ?? "",
    "Accuracy": skill.accuracy == null ? "" : `${skill.accuracy}%`,
    ...evidenceTimeFields(skill.latestAt, options)
  }));
  const itemRows = asArray(report.items).map(item => ({
    "Section": "Result details",
    "Row type": "Item summary",
    ...(options.includeIdentifiers ? {
      "Evidence ID": item.evidenceId || "",
      "Source attempt IDs": asArray(item.provenance?.sourceRecordIds)
    } : {}),
    "Skill": item.concept?.label || "",
    "Status": statusLabel(item.status),
    "Attempts": item.details?.observations ?? "",
    "Correct": item.details?.correct ?? "",
    "Questions": item.details?.observations ?? "",
    "Accuracy": item.details?.accuracy == null ? "" : `${item.details.accuracy}%`,
    ...evidenceTimeFields(item.observedAt, options)
  }));
  const attemptRows = asArray(report.attempts).map(attempt => {
    const raw = attempt.raw && typeof attempt.raw === "object" ? attempt.raw : attempt;
    return {
      "Section": "Result details",
      "Row type": "Assessment attempt",
      ...(options.includeIdentifiers ? {
        "Student ID": raw.studentId || workspace.student?.id || "",
        "Attempt ID": attempt.attemptId || raw.attemptId || "",
        "Assessment ID": raw.assessmentType || raw.assessmentId || "",
        "Skill ID": raw.skillId || "",
        "Assessment version": attempt.formVersion || raw.formVersion || "",
        "Content version": attempt.contentVersion || raw.contentVersion || "",
        "Scoring version": attempt.scoringVersion || raw.scoringVersion || raw.scoringRuleVersion || ""
      } : {}),
      "Skill": raw.skillName || raw.skillId || "",
      "Status": statusLabel(attempt.status || attempt.scoreStatus),
      "Attempts": 1,
      "Correct": attempt.correctCount ?? "",
      "Questions": attempt.totalQuestions ?? "",
      "Accuracy": attempt.accuracy == null ? "" : `${attempt.accuracy}%`,
      ...evidenceTimeFields(attempt.completedAt, options, { basis: "Assessment completed" })
    };
  });
  const questionRows = asArray(report.attempts).flatMap(attempt => {
    const raw = attempt.raw && typeof attempt.raw === "object" ? attempt.raw : attempt;
    return attemptQuestions(attempt).map((question, index) => {
      const kind = learningEvidenceResponseKind(question, "assessment", raw.administrationStatus || attempt.administrationStatus || "");
      return {
        "Section": "Result details",
        "Row type": "Question result",
        ...(options.includeIdentifiers ? {
          "Student ID": raw.studentId || workspace.student?.id || "",
          "Attempt ID": attempt.attemptId || raw.attemptId || "",
          "Question ID": question.questionId || question.id || "",
          "Item key": question.itemKey || question.itemId || ""
        } : {}),
        "Skill": raw.skillName || raw.skillId || "",
        "Status": kind === "mediaFailed" ? "media_failed" : kind,
        "Recorded response status": question.responseStatus || "",
        "Correct": kind === "correct" ? 1 : kind === "incorrect" ? 0 : "",
        ...evidenceTimeFields(question.timestamp || attempt.completedAt, options, {
          basis: question.timestamp ? "Question answered" : "Assessment completed"
        }),
        "Question": index + 1,
        "Prompt": question.prompt || question.question || "",
        "Selected answer": question.selectedAnswer || question.responseText || "",
        "Correct answer": question.correctAnswer || ""
      };
    });
  });
  return [...skillRows, ...teachingRows, ...itemRows, ...attemptRows, ...questionRows];
}

function otherLearningRows(workspace = {}, options = {}) {
  const report = workspace.otherLearning || {};
  return [
    ...asArray(report.skillsPractice?.responses).map(response => ({
      "Section": "Practice details", "Row type": "Skills practice response", "Learning area": "Skills practice",
      "Skill code": response.skillId, "Skill name": response.skillName, "Question ID": response.questionId,
      "Session ID": response.sessionId, "Response ID": response.responseId, "Question format": response.formatType,
      "Prompt": response.itemSnapshot?.prompt || "", "Stimulus": response.itemSnapshot?.passage || response.itemSnapshot?.targetWord || "",
      "Spoken prompt": response.itemSnapshot?.spokenPrompt || "", "Printed sentence": response.itemSnapshot?.sentence || "",
      "Choices": JSON.stringify(response.itemSnapshot?.choices || []), "Stimulus image": response.itemSnapshot?.imagePath || "",
      "Pictured choices": JSON.stringify(response.itemSnapshot?.imageCards || []),
      "Selected answer": response.selected ?? "", "Expected answer": response.expected ?? "",
      "First response correct": response.firstResponseCorrect === null ? "Not scored" : response.firstResponseCorrect,
      "Answer match": response.answerMatch ?? "", "Response validity": response.validity,
      "Support used": response.supportUsed, "Response status": response.responseStatus,
      "Response time ms": response.responseTimeMs ?? "", "Items scored": response.isCorrect === null ? 0 : 1,
      "Timing boundary": response.responseTimeBoundary, "Required images ready": response.mediaReady,
      "Audio essential": response.audioRequired, "Instruction delivery": response.instructionDelivery, "Target delivery": response.targetDelivery,
      "Claim boundary": report.skillsPractice.note,
      ...evidenceTimeFields(response.occurredAt, options, { basis: "Saved self-chosen practice response" })
    })),
    ...asArray(report.adventureMap?.cycles).flatMap(cycle => [{
      "Section": "Practice details", "Row type": "Adventure Map latest run", "Learning area": "Adventure Map",
      "Activity": cycle.title, "Cycle code": cycle.cycleId, "Practice count": cycle.plays,
      "Snapshot status": cycle.snapshotStatus, "Question coverage": cycle.profile.summary,
      "Independent responses": cycle.profile.totals.presented ? cycle.profile.totals.scored : "",
      "Independent correct": cycle.profile.totals.presented ? cycle.profile.totals.correct : "",
      "Claim boundary": cycle.profile.claimBoundary,
      ...evidenceTimeFields(cycle.lastPlayedAt, options, { basis: "Latest saved practice run" })
    }, ...cycle.profile.targets.map(target => ({
      "Section": "Teach next", "Row type": "Adventure Map practice target", "Learning area": "Adventure Map",
      "Activity": cycle.title, "Cycle code": cycle.cycleId, "Target": target.label,
      "Saved example words": target.exampleWords.join("; "),
      "Construct": target.constructLabel, "Question formats": target.formatLabels.join("; ") || "Not recorded",
      "Independent responses": target.scored, "Independent correct": target.correct,
      "Supported responses": target.supported, "Unavailable media": target.mediaFailed, "Unscored responses": target.unscored,
      "Recorded contrasts": target.confusions.map(row => `Selected ${row.selected}; expected ${row.expected} (${row.count})`).join("; "),
      "Recorded responses": target.recordedResponses.map(row => `${row.selected} (${row.kind}; ${row.count})`).join("; "),
      "Next teaching move": target.nextAction, "Claim boundary": cycle.profile.claimBoundary,
      ...evidenceTimeFields(cycle.lastPlayedAt, options, { basis: "Latest saved practice run" })
    }))]),
    ...asArray(report.soundSeekers?.sounds)
      .filter(sound => Number(sound.seen || 0) > 0)
      .map(sound => ({
        "Section": "Practice details",
        "Row type": "Practice result",
        "Learning area": "Sound Seekers",
        "Activity": sound.label,
        "Result": sound.sourceResult || "Practised",
        "Practice count": sound.seen || "",
        ...evidenceTimeFields(sound.lastActiveAt, options, {
          basis: "Latest practice for each sound",
          snapshotAt: workspace.generatedAt
        })
      })),
    ...asArray(report.arcade?.games).map(game => ({
      "Section": "Practice details",
      "Row type": "Practice result",
      "Learning area": "Arcade",
      "Activity": game.title || game.gameId,
      "Result": game.skillPractised ? `Practised: ${game.skillPractised}` : "Game practice",
      "Practice count": game.plays || "",
      ...evidenceTimeFields(game.lastPlayedAt, options, {
        basis: "Last played",
        snapshotAt: workspace.generatedAt
      })
    })),
    ...asArray(report.storyQuests?.stories).map(story => ({
      "Section": "Practice details",
      "Row type": "Practice result",
      "Learning area": "Story Quests",
      "Activity": story.title || story.questId,
      "Result": story.completed ? "Completed" : "In progress",
      "Words encountered": story.wordsEncountered || [],
      ...evidenceTimeFields(story.lastActivityAt || story.completedAt, options, {
        basis: story.lastActivityAt ? "Last activity" : "Completed",
        snapshotAt: workspace.generatedAt
      })
    }))
  ];
}

export function buildStudentWorkspaceCsvRows(viewId, workspace = {}, options = {}) {
  const viewLabel = WORKSPACE_VIEW_LABELS[viewId] || "Student results";
  const reportRows = viewId === "whole-child"
    ? wholeChildRows(workspace, options)
    : viewId === "skills-check"
      ? skillsCheckRows(workspace, options)
      : viewId === "other-learning"
        ? otherLearningRows(workspace, options)
        : [];
  if (!reportRows.length) return [];
  const definitionRows = buildMetricDefinitionRows().map(row => ({
    "Section": "Metric definitions",
    "Row type": "Metric definition",
    ...row
  }));
  const provenanceRows = buildExportProvenanceRows({
    reportTitle: exportDisplayText(options.reportTitle || `${viewLabel} report`),
    schoolName: options.schoolName,
    className: options.className,
    learnerName: options.learnerName || workspace.student?.name,
    learnerId: options.learnerId || workspace.student?.id,
    learnerCount: 1,
    generatedAt: options.generatedAt || workspace.generatedAt,
    timeZone: options.timeZone,
    filters: exportDisplayFilters(options.filters, viewId),
    evidenceSource: options.evidenceSource || workspace.skillsCheck?.attempts || [],
    versionSummary: options.versionSummary,
    appVersion: options.appVersion,
    definitions: "Figure explanation rows are included in this CSV file."
  }).filter(row => options.includeIdentifiers || !TEACHER_HIDDEN_REPORT_FIELDS.has(row.field)).map(row => ({
    "Section": "About this report",
    "Row type": "Report detail",
    "Field": row.field,
    "Value": row.value
  }));
  const identityRows = options.includeIdentifiers ? [
    { field: "Student ID", value: options.learnerId || workspace.student?.id || "" },
    { field: "Class ID", value: workspace.student?.classId || workspace.student?.class_id || "" }
  ].filter(row => row.value).map(row => ({
    "Section": "About this report", "Row type": "Report detail", "Field": row.field, "Value": row.value
  })) : [];
  return [...provenanceRows, ...identityRows, ...reportRows, ...definitionRows];
}
