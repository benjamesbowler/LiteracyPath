import { buildMetricDefinitionRows } from "./metricDefinitions.js";
import { buildLearningEvidenceProfile, learningEvidenceResponseKind } from "./learningEvidenceInsights.js";
import { evaluateEvidenceSufficiency } from "../policy/reportingBible.js";
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

function literacyPracticeRows(report, options = {}) {
  if (!report?.totals?.presentations && !report?.totals?.invalidRecords && !report?.legacyEvidenceUnknown) return [];
  const skills = new Map(asArray(report.skills).map(skill => [skill.skillId, skill]));
  const context = {
    "Learning area": "Literacy practice", "Content version": report.contentVersion,
    "Practice only": true, "Formal assessment": false, "Mastery claim": false,
    "Evidence window start (UTC)": report.evidenceWindow?.from || "",
    "Evidence window end (UTC)": report.evidenceWindow?.to || "",
    "Claim boundary": report.note
  };
  const classifications = {
    independent_first_probe: "First independent response", supported: "Help used", supported_transfer: "Transfer after teaching",
    repeat: "Repeated question", known_familiar: "Previously practiced question", skipped: "Skipped", no_response: "No response",
    media_failed: "Media unavailable", audio_not_delivered: "Required audio not completed", invalid: "Unscored response",
    incomplete: "Incomplete evidence", unknown_recency: "Date needs review", conflict: "Conflicting evidence — excluded"
  };
  const domainFor = skill => ({ "Domain code": skill?.domainId || "other", "Domain name": skill?.domainLabel || "Other literacy practice" });
  return [
    {
      ...context, "Section": "Practice details", "Row type": "Literacy practice coverage",
      "Skills with recent independent samples": report.totals.skillsWithRecentSamples,
      "Skills available": report.totals.totalSkills, "Skills not yet sampled": report.totals.notYetSampled,
      "Recent independent first responses": report.totals.recentIndependentCount,
      "Historical independent first responses": report.totals.historicalIndependentCount,
      "Help used": report.totals.supported, "Supported transfers": report.totals.supportedTransfers,
      "Repeated presentations": report.totals.repeats, "Known familiar presentations": report.totals.knownFamiliar,
      "Conflicting presentations": report.totals.conflicts, "Invalid records excluded": report.totals.invalidRecords,
      "Legacy item evidence missing": report.legacyEvidenceUnknown,
      "Result": "Descriptive coverage; no overall score is calculated"
    },
    ...asArray(report.strengths).map(strength => ({
      ...context, ...domainFor(skills.get(strength.skillId)), "Section": "Practice details", "Row type": "Literacy observed success",
      "Skill code": strength.skillId, "Skill name": strength.label, "Observed success": strength.description,
      "Recent independent correct": strength.count, "Items scored": skills.get(strength.skillId)?.recentIndependentCount ?? 0,
      "Result": "Observed answers; not a proficiency judgment"
    })),
    ...asArray(report.nextSteps).map(step => ({
      ...context, ...domainFor(skills.get(step.skillId)), "Section": "Teach next", "Row type": "Literacy practice next step",
      "Skill code": step.skillId, "Skill name": step.label, "Next step code": step.type,
      "Reason": step.reason, "Next teaching move": step.suggestion,
      "Coverage": skills.get(step.skillId)?.coverageLabel || "Not yet sampled"
    })),
    ...asArray(report.skills).flatMap(skill => (skill.levels.length ? skill.levels : [{ level: null, recentIndependentCount: 0 }]).map(level => {
      const sufficiency = level.evidenceSufficiency || evaluateEvidenceSufficiency(level.recentIndependentCount);
      return {
        ...context, ...domainFor(skill), "Section": "Practice details", "Row type": "Literacy skill sample",
        "Skill code": skill.skillId, "Skill name": skill.label,
        "Status code": skill.statusId, "Status label": skill.statusLabel,
        "Coverage code": skill.coverage, "Coverage": skill.coverageLabel,
        "Practice level": level.level ?? "Not sampled", "Items scored": level.recentIndependentCount,
        "Recent independent correct": level.recentIndependentCount ? level.recentCorrect : "",
        "Recent independent to revisit": level.recentIndependentCount ? level.recentIncorrect : "",
        "Historical independent first responses": level.historicalIndependentCount ?? 0,
        "Help used": level.supported ?? 0, "Supported transfers": level.supportedTransfers ?? 0,
        "Repeated presentations": level.repeats ?? 0, "Known familiar presentations": level.knownFamiliar ?? 0,
        "Skipped": level.skipped ?? 0, "No response": level.noResponse ?? 0,
        "Media unavailable": level.mediaFailed ?? 0, "Required audio incomplete": level.audioNotDelivered ?? 0,
        "Evidence sufficiency code": sufficiency.id, "Evidence sufficiency": sufficiency.label,
        "Result": skill.evidenceNote,
        ...evidenceTimeFields(skill.lastPracticedAt, options, { basis: "Latest saved practice for this skill" })
      };
    })),
    ...asArray(report.responses).map(response => ({
      ...context, ...domainFor(skills.get(response.skillId)), "Section": "Practice details", "Row type": "Literacy practice response",
      ...(options.includeIdentifiers ? { "Session ID": response.sessionId, "Response ID": response.responseId, "Response step": response.stepIndex } : {}),
      "Skill code": response.skillId || "unidentified", "Skill name": skills.get(response.skillId)?.label || response.skillName || "Unidentified skill",
      "Question ID": response.questionId || "Not recorded", "Question format": response.formatType || "Not recorded",
      "Practice level": response.level ?? "Not recorded", "Presentation role": response.presentationRole || "Not recorded",
      "Prompt": response.itemSnapshot?.prompt || "", "Stimulus": response.itemSnapshot?.passage || response.itemSnapshot?.targetWord || "",
      "Spoken prompt": response.itemSnapshot?.spokenPrompt || "", "Printed sentence": response.itemSnapshot?.sentence || "",
      "Choices": JSON.stringify(response.itemSnapshot?.choices || []), "Stimulus image": response.itemSnapshot?.imagePath || "",
      "Selected answer": response.selected ?? "", "Expected answer": response.expected ?? response.itemSnapshot?.expected ?? "",
      "Answer match": response.answerMatch ?? "",
      "First response correct": response.countedIndependent ? response.isCorrect : "Not scored",
      "Items scored": response.countedIndependent ? 1 : 0,
      "Evidence use code": response.classification, "Evidence use": classifications[response.classification] || "Unscored response",
      "Response status": response.responseStatus || "Not recorded", "Response validity": response.validity || "Not recorded",
      "Support used": response.supportUsed ?? "Not recorded", "Known prior practice": response.knownFamiliar,
      "Familiarity": response.familiarityStatus, "Recency": response.recency, "Conflicting evidence": response.conflicted,
      "Response time ms": response.responseTimeMs ?? "", "Timing boundary": response.responseTimeBoundary || "Not recorded",
      "Required images ready": response.mediaReady ?? "Not recorded", "Audio essential": response.audioRequired ?? "Not recorded",
      "Audio delivery": response.audioDelivery || "Not recorded", "Instruction delivery": response.instructionDelivery || "Not recorded",
      "Target delivery": response.targetDelivery || "Not recorded",
      ...evidenceTimeFields(response.occurredAt, options, { basis: "Saved literacy practice response" })
    })),
    {
      ...context, "Section": "Practice details", "Row type": "Literacy practice data dictionary",
      "Field": "Items scored",
      "Definition": "Response rows: one only for a unique eligible independent first probe, including historical first probes; zero for support, transfer, repeats, known familiarity, missing media or conflicting evidence. Skill sample rows: recent eligible first probes at the stated practice level. Empty correct counts mean no independent sample. Recency separates historical responses. These practice denominators never establish formal proficiency."
    },
    {
      ...context, "Section": "Practice details", "Row type": "Literacy practice data dictionary",
      "Field": "Coverage and evidence sufficiency",
      "Definition": "Untried skills are not yet sampled, never weaknesses. Evidence sufficiency describes recent item counts within each level and does not grant a proficiency judgment. Supported transfers show practice after teaching. Adaptive levels are not combined into an accuracy or growth score."
    }
  ];
}

function otherLearningRows(workspace = {}, options = {}) {
  const report = workspace.otherLearning || {};
  return [
    ...literacyPracticeRows(report.literacyPractice, options),
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
    ...asArray(report.skillsPractice?.learningEpisodes).flatMap(episode => [
      ...episode.guidedActions.map(action => ({
        "Section": "Practice details", "Row type": "Skills modeled action", "Learning area": "Skills practice",
        "Episode ID": episode.id, "Response ID": action.id, "Question ID": action.question.id,
        "Presentation role": "guided", "Support used": true, "Evidence use": "supported_practice", "Items scored": 0,
        "Selected answer": JSON.stringify(action.selected), "Expected answer": JSON.stringify(action.expected),
        "Claim boundary": "Modeled learning action; original first answer unchanged; no independent or mastery claim",
        ...evidenceTimeFields(action.occurredAt, options, { basis: "Saved modeled action" })
      })),
      ...episode.responses.filter(response => response.presentationRole === "transfer").map(response => ({
        "Section": "Practice details", "Row type": "Skills fresh transfer", "Learning area": "Skills practice",
        "Episode ID": episode.id, "Response ID": response.id, "Question ID": response.question.id,
        "Skill code": response.question.skillId, "Presentation role": "transfer", "Evidence use": response.evidenceUse,
        "Answer match": response.observedCorrect ?? "", "First response correct": "Not an original first response", "Items scored": 0,
        "Selected answer": JSON.stringify(response.selected), "Expected answer": JSON.stringify(response.expected),
        "Prompt": response.question.prompt || response.question.question, "Stimulus": response.question.targetWord || response.question.passage || "",
        "Response validity": response.validity, "Response status": response.responseStatus,
        "Claim boundary": "Immediate transfer after teaching; excluded from independent accuracy, formal Skills and mastery",
        ...evidenceTimeFields(response.occurredAt, options, { basis: "Saved immediate transfer response" })
      }))
    ]),
    ...asArray(report.adventureMap?.learningEpisodes).flatMap(episode => [
      ...episode.responses.map(response => ({
        "Section": "Practice details", "Row type": response.presentationRole === "transfer" ? "Adventure Map fresh transfer" : "Adventure Map first response", "Learning area": "Adventure Map",
        "Episode ID": episode.id, "Response ID": response.id, "Presentation role": response.presentationRole,
        "Question ID": response.question.roundKey || response.question.id, "Selected answer": JSON.stringify(response.selected), "Expected answer": JSON.stringify(response.expected),
        "Answer match": response.observedCorrect ?? "", "Evidence use": response.evidenceUse, "Response validity": response.validity, "Response status": response.responseStatus,
        "Items scored": 0, "Claim boundary": "Descriptive saved practice; immediate transfer excluded from original independent score and mastery",
        ...evidenceTimeFields(response.occurredAt, options, { basis: "Saved practice response" })
      })),
      ...episode.guidedActions.map(action => ({
        "Section": "Practice details", "Row type": "Adventure Map modeled action", "Learning area": "Adventure Map",
        "Episode ID": episode.id, "Response ID": action.id, "Presentation role": "guided", "Question ID": action.question.roundKey || action.question.id,
        "Selected answer": JSON.stringify(action.selected), "Expected answer": JSON.stringify(action.expected), "Evidence use": "supported_practice", "Items scored": 0,
        "Claim boundary": "Worked learning action; excluded from independent accuracy and mastery",
        ...evidenceTimeFields(action.occurredAt, options, { basis: "Saved modeled action" })
      }))
    ]),
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
    evidenceSource: options.evidenceSource || (viewId === "other-learning"
      ? [...asArray(workspace.otherLearning?.evidence), ...asArray(workspace.otherLearning?.literacyPractice?.responses).map(response => ({ ...response, observedAt: response.occurredAt }))]
      : workspace.skillsCheck?.attempts || []),
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
