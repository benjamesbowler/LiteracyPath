import { collectAssessmentEvidenceImages } from "../policy/assessmentMediaEvidence.js";
import { mergePracticeProgressRecords } from "./practiceCompletionRecords.js";

export const SKILLS_PRACTICE_ID = "skills-trail";
export const SKILLS_PRACTICE_VERSION = "skills-trail-v1";
export const SKILLS_PRACTICE_TURNS = 6;

function hash(text) {
  let value = 2166136261;
  for (const char of String(text)) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0;
}

export function shufflePracticeChoices(items, seed) {
  return [...(items || [])].sort((a, b) => hash(`${seed}:${JSON.stringify(a)}`) - hash(`${seed}:${JSON.stringify(b)}`));
}

// Repeated exploration is allowed. Prefer fresh items before revisiting a bank;
// retention-only material remains exclusive to formal retention checks.
export function selectSkillsPracticeQuestions(bank, { level = 1, seed, previousIds = [], failedIds = [], count = SKILLS_PRACTICE_TURNS } = {}) {
  const seen = new Set(previousIds);
  const failed = new Set(failedIds);
  const eligible = (bank || []).filter(item => !item.retentionOnly && Number(item.level || item.difficulty || 1) === level && !failed.has(item.id));
  return shufflePracticeChoices(eligible, seed).sort((a, b) => Number(seen.has(a.id)) - Number(seen.has(b.id)) || Number(collectAssessmentEvidenceImages(b).length > 0) - Number(collectAssessmentEvidenceImages(a).length > 0)).slice(0, count);
}

export function skillsPracticeRecord(gameProgress = {}) {
  return mergePracticeProgressRecords(undefined, gameProgress?.practiceRecord);
}

export function createSkillsPracticeEvent({ question, sessionId, responseId, selected = null, isCorrect = null, supportUsed = false, responseStatus = "answered", responseTimeMs = null, mediaReady = responseStatus !== "media_failed", audioRequired = false, instructionDelivery = "unknown", targetDelivery = "unknown", targetDelivered = targetDelivery === "completed", occurredAt = new Date().toISOString() }) {
  const audioDelivered = !audioRequired || targetDelivered;
  const validResponse = responseStatus === "answered" && mediaReady && audioDelivered;
  const scored = validResponse && !supportUsed && typeof isCorrect === "boolean";
  const event = {
    id: responseId,
    contentVersion: SKILLS_PRACTICE_VERSION,
    completedAt: occurredAt,
    gameId: SKILLS_PRACTICE_ID,
    practiceOnly: true,
    formalAssessment: false,
    masteryClaim: false,
    independent: false,
    sessionId,
    steps: [{
      questionId: question.id,
      skillId: question.skillId,
      skillName: question.skillName || question.skill || question.skillId,
      formatType: question.formatType || question.templateType || question.questionType,
      target: question.unit || question.itemKey || question.targetWord || question.skillId,
      level: Number(question.level || question.difficulty || 1),
      phase: question.phase || question.assessmentPhase || 1,
      selected,
      expected: question.answer ?? question.correctAnswer,
      answerMatch: typeof isCorrect === "boolean" ? isCorrect : null,
      firstResponseCorrect: validResponse && typeof isCorrect === "boolean" ? isCorrect : null,
      isCorrect: scored ? isCorrect : null,
      supportUsed,
      evidenceType: !validResponse ? "unscored" : supportUsed ? "supported" : "independent",
      validity: validResponse ? "valid" : "invalid",
      responseStatus,
      responseTimeMs: Number.isFinite(responseTimeMs) ? Math.max(0, Math.round(responseTimeMs)) : null,
      responseTimeBoundary: "required_audio_completed",
      mediaReady,
      audioRequired,
      audioDelivery: !audioRequired ? "not_required" : audioDelivered ? "delivered" : targetDelivery,
      instructionDelivery,
      targetDelivery,
      targetDelivered,
      occurredAt,
      // The historical result can be read after a future bank revision.
      itemSnapshot: {
        source: question.source,
        assessmentSkillId: question.assessmentSkillId,
        prompt: question.prompt || question.question,
        spokenPrompt: question.spokenPrompt || "",
        sentence: question.sentence || question.sentenceText || "",
        passage: question.passage || question.story || "",
        targetWord: question.targetWord || question.audioText || "",
        imagePath: question.imagePath || question.targetImage || question.imageUrl || "",
        imageCards: question.imageCards || [],
        choices: question.answerOptions || question.choices || [],
        expected: question.answer ?? question.correctAnswer,
        formatType: question.formatType || question.templateType || question.questionType,
        contentVersion: question.contentVersion || question.version || "v3"
      }
    }]
  };
  return JSON.parse(JSON.stringify(event));
}

export function buildSkillsPracticeReport(gameProgress = {}) {
  const record = skillsPracticeRecord(gameProgress);
  const conflicts = new Set(record.completionConflictIds || []);
  const events = record.completions.filter(event => event.contentVersion === SKILLS_PRACTICE_VERSION && !conflicts.has(event.id));
  const responses = events.flatMap(event => event.steps.map(step => ({ ...step, responseId: event.id, sessionId: event.sessionId })));
  const skills = new Map();
  for (const response of responses) {
    const key = response.skillId;
    const row = skills.get(key) || { skillId: key, label: response.skillName, responses: [], independentCorrect: 0, independentIncorrect: 0, supported: 0, skipped: 0, noResponse: 0, mediaFailed: 0, audioNotDelivered: 0 };
    row.responses.push(response);
    if (response.responseStatus === "answered" && response.supportUsed) row.supported++;
    if (response.responseStatus === "media_failed") row.mediaFailed++;
    else if (response.responseStatus === "no_response") row.noResponse++;
    else if (response.responseStatus !== "answered") row.skipped++;
    else if (response.validity === "invalid") row.audioNotDelivered++;
    else if (!response.supportUsed && response.isCorrect === true) row.independentCorrect++;
    else if (response.isCorrect === false) row.independentIncorrect++;
    skills.set(key, row);
  }
  const rows = [...skills.values()];
  return {
    skills: rows,
    responses,
    sessions: new Set(events.map(event => event.sessionId)).size,
    answered: responses.filter(response => response.responseStatus === "answered").length,
    independentCorrect: rows.reduce((sum, row) => sum + row.independentCorrect, 0),
    independentIncorrect: rows.reduce((sum, row) => sum + row.independentIncorrect, 0),
    supported: rows.reduce((sum, row) => sum + row.supported, 0),
    unscored: rows.reduce((sum, row) => sum + row.skipped + row.noResponse + row.mediaFailed + row.audioNotDelivered, 0),
    conflicts: conflicts.size,
    note: "Self-chosen Skills practice. First responses, help and actual media delivery are reported separately. An early answer before an essential target recording finishes is unscored. This does not change formal Skills results, mastery or placement."
  };
}
