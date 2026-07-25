import {
  ASSESSMENT_RELEASE_MANAGED_SKILL_IDS,
  ASSESSMENT_RELEASE_STANDARD_VERSION,
  getAssessmentReleaseOwner
} from "./releaseStandard.js";
import { assessmentMediaWaivers } from "./assessments/assessmentMediaReleaseManifest.js";

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function waiverSummary(skillId) {
  const waivers = assessmentMediaWaivers.filter(entry => entry.skillId === skillId);
  return Object.freeze({
    entryCount: waivers.length,
    excludedQuestionCount: waivers.reduce(
      (total, entry) => total + entry.questionIds.length,
      0
    ),
    owners: Object.freeze(unique(waivers.map(entry => entry.owner))),
    reviewBy: Object.freeze(unique(waivers.map(entry => entry.reviewBy)).sort()),
    reasons: Object.freeze(unique(waivers.map(entry => entry.reason)))
  });
}

function validateExposure(status, exposure = {}) {
  const count = Number(exposure.count);
  if (!Number.isInteger(count) || count < 0) {
    throw new TypeError(`${status.skillId}: child exposure count is missing or invalid.`);
  }
  if (!/^[0-9a-f]{64}$/.test(String(exposure.fingerprint || ""))) {
    throw new TypeError(`${status.skillId}: child exposure fingerprint is missing or invalid.`);
  }
  if (!status.releaseReady && count !== 0) {
    throw new TypeError(`${status.skillId}: a blocked skill exposes ${count} questions.`);
  }
  return {
    count,
    fingerprint: exposure.fingerprint,
    level1: Math.max(0, Number(exposure.level1) || 0),
    level2: Math.max(0, Number(exposure.level2) || 0)
  };
}

export function buildCurriculumReleaseBoard({
  statuses = [],
  exposureBySkillId = {}
} = {}) {
  const statusesBySkillId = new Map(statuses.map(status => [status.skillId, status]));
  if (statusesBySkillId.size !== ASSESSMENT_RELEASE_MANAGED_SKILL_IDS.length) {
    throw new TypeError(
      `Curriculum board received ${statusesBySkillId.size}/`
      + `${ASSESSMENT_RELEASE_MANAGED_SKILL_IDS.length} canonical skill decisions.`
    );
  }

  const rows = ASSESSMENT_RELEASE_MANAGED_SKILL_IDS.map(skillId => {
    const status = statusesBySkillId.get(skillId);
    if (!status || status.standardVersion !== ASSESSMENT_RELEASE_STANDARD_VERSION) {
      throw new TypeError(`${skillId}: release decision is missing or stale.`);
    }
    const exposure = validateExposure(status, exposureBySkillId[skillId]);
    const reasons = status.releaseReady
      ? []
      : unique(status.reasons?.length
        ? status.reasons
        : ["The canonical release rubric did not pass."]);
    return Object.freeze({
      skillId,
      skillName: status.skillName,
      standardVersion: status.standardVersion,
      gateStatus: status.releaseReady ? "READY" : "BLOCKED",
      releaseReady: status.releaseReady === true,
      reasons: Object.freeze(reasons),
      owner: getAssessmentReleaseOwner(skillId),
      authoredQuestions: Number(status.authoredQuestions || 0),
      approvedQuestions: Number(status.approvedQuestions || 0),
      releaseEligibleQuestions: Number(status.releaseEligibleQuestions || 0),
      unapprovedAudioQuestions: Number(status.unapprovedAudioQuestions || 0),
      missingRequiredImages: Number(status.missingRequiredImages || 0),
      missingRequiredAudio: Number(status.missingRequiredAudio || 0),
      wiringDefects: Number(status.wiringDefects || 0),
      studentExposure: Object.freeze(exposure),
      waiver: waiverSummary(skillId),
      dimensions: Object.freeze({ ...(status.dimensions || {}) })
    });
  });

  return Object.freeze({
    schemaVersion: 1,
    standardVersion: ASSESSMENT_RELEASE_STANDARD_VERSION,
    generatedFrom: Object.freeze([
      "canonical release rubric",
      "strict per-skill audit",
      "live student bank loader",
      "review-dated media exclusion register"
    ]),
    readySkills: rows.filter(row => row.releaseReady).length,
    blockedSkills: rows.filter(row => !row.releaseReady).length,
    rows: Object.freeze(rows)
  });
}
