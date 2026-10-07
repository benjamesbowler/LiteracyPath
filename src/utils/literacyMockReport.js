import { LITERACY_CORE_SKILLS } from "../policy/literacyPracticePolicy.js";
import { LITERACY_EXTENSION_SKILLS } from "../data/literacyPracticeExtensions.js";
import { evaluateEvidenceSufficiency, REPORTING_BIBLE_POLICY } from "../policy/reportingBible.js";

export const LITERACY_MOCK_REPORT_AREAS = Object.freeze([
  { id: "foundations", label: "Foundational skills", domains: ["sound_awareness", "phonics", "print"] },
  { id: "language_writing", label: "Language and writing", domains: ["language", "writing"] },
  { id: "comprehension", label: "Literature and informational text", domains: ["reading", "listening"] },
  { id: "vocabulary", label: "Vocabulary", domains: ["vocabulary"] }
]);
export const LITERACY_MOCK_REPORT_SKILLS = Object.freeze([...LITERACY_CORE_SKILLS, ...LITERACY_EXTENSION_SKILLS]);
const DAY_MS = 86400000;
const counts = () => ({ independent: 0, correct: 0, incorrect: 0, supported: 0, familiar: 0, unscored: 0 });
const text = value => typeof value === "string" ? value.trim() : "";
export const literacyMockStudentName = student => text(student?.name) || [text(student?.first_name), text(student?.last_name)].filter(Boolean).join(" ") || "Student name unavailable";

export function literacyMockAnswerText(value) {
  if (value === null || value === undefined || value === "") return "Not recorded";
  if (Array.isArray(value)) return value.map(literacyMockAnswerText).join(", ");
  if (typeof value === "object") return literacyMockAnswerText(value.label ?? value.text ?? value.word ?? value.id);
  return String(value);
}

export function literacyMockResponseText(value, snapshot = {}) {
  const choices = new Map((snapshot.choices || []).map(choice => [choice.id, choice.label]));
  const resolve = answer => literacyMockAnswerText(choices.get(answer) ?? answer);
  if (Array.isArray(value)) {
    if (snapshot.format === "match") return value.map((answer, index) => `${literacyMockAnswerText(snapshot.matchTargets?.[index]?.label)} → ${resolve(answer)}`).join("; ");
    return value.map(resolve).join(snapshot.format === "order" ? " → " : ", ");
  }
  return resolve(value);
}

function classification(response, repeated) {
  if (response.responseStatus === "skipped") return "skipped";
  if (response.responseStatus !== "answered" || typeof response.isCorrect !== "boolean"
      || !text(response.questionId) || !response.itemSnapshot || !Number.isFinite(Date.parse(response.serverReceivedAt))) return "incomplete";
  if (response.supportUsed || response.evidenceType === "supported") return "supported";
  if (response.evidenceType !== "independent") return "unscored";
  if (repeated || response.knownFamiliar === true) return "familiar";
  return "independent";
}

function add(row, response) {
  if (response.classification === "independent") {
    row.independent++;
    row[response.isCorrect ? "correct" : "incorrect"]++;
  } else if (["supported", "familiar"].includes(response.classification)) row[response.classification]++;
  else row.unscored++;
}

/** Describes one server-authorized session. Never estimates proficiency or compares pupils. */
export function buildLiteracyMockReport(payload, { students = [], skills = LITERACY_MOCK_REPORT_SKILLS, now = Date.now() } = {}) {
  const nowMs = now instanceof Date ? now.getTime() : typeof now === "number" ? now : Date.parse(now);
  if (!Number.isFinite(nowMs)) throw new TypeError("A valid report time is required.");
  const recentStart = nowMs - REPORTING_BIBLE_POLICY.recency.conclusionWindowDays * DAY_MS;
  const roster = new Map(students.map(student => [String(student.id), student]));
  const session = payload?.session || null;
  const itemCount = Number.isInteger(session?.mock?.item_count) ? session.mock.item_count : null;
  const pupils = (Array.isArray(payload?.members) ? payload.members : []).map(member => {
    const studentId = String(member.student_id);
    const run = member.run;
    const bySkill = new Map(skills.map(skill => [skill.id, { ...skill, ...counts(), responses: [], levels: [] }]));
    const rawResponses = Array.isArray(run?.responses) ? run.responses : [];
    const mediaFailures = [...(Array.isArray(run?.mediaFailures) ? run.mediaFailures : []),
      ...rawResponses.filter(response => response.responseStatus === "media_failed")]
      .map((failure, index) => ({ ...failure, index, responseStatus: "media_failed", classification: "media_failed", isCorrect: null, evidenceType: "unscored" }));
    const seen = new Set();
    const responses = rawResponses.filter(response => response.responseStatus !== "media_failed").map((response, index) => {
      const repeated = seen.has(response.questionId);
      if (response.questionId) seen.add(response.questionId);
      const receivedAt = Date.parse(response.serverReceivedAt);
      const row = { ...response, index, classification: classification(response, repeated),
        recent: Number.isFinite(receivedAt) && receivedAt <= nowMs && receivedAt >= recentStart };
      // Unknown metadata remains visible, but cannot create a skill or group claim.
      if (!bySkill.has(row.skillId) || !Number.isFinite(Number(row.level)) || Number(row.level) < 1) row.classification = "incomplete";
      const skill = bySkill.get(row.skillId);
      if (skill) { skill.responses.push(row); add(skill, row); }
      return row;
    });
    const totals = counts();
    responses.forEach(response => add(totals, response));
    const skillRows = [...bySkill.values()].map(skill => {
      const levels = new Map();
      for (const response of skill.responses) {
        const level = Number(response.level);
        const row = levels.get(level) || { level, ...counts() };
        add(row, response); levels.set(level, row);
      }
      return { ...skill, sampled: skill.independent + skill.supported + skill.familiar > 0, evidenceSufficiency: evaluateEvidenceSufficiency(skill.independent),
        levels: [...levels.values()].sort((a, b) => a.level - b.level),
        recentErrors: skill.responses.filter(response => response.recent && response.classification === "independent" && !response.isCorrect) };
    });
    const areas = LITERACY_MOCK_REPORT_AREAS.map(area => {
      const areaSkills = skillRows.filter(skill => area.domains.includes(skill.domainId));
      const total = counts();
      areaSkills.forEach(skill => Object.keys(total).forEach(key => { total[key] += skill[key]; }));
      return { ...area, ...total, totalSkills: areaSkills.length, sampledSkills: areaSkills.filter(skill => skill.sampled).length };
    });
    const planned = Array.isArray(run?.plan?.itemIds) ? run.plan.itemIds.length : itemCount;
    const unsampledItems = planned === null ? null : Math.max(0, planned - responses.length);
    return { studentId, name: literacyMockStudentName(roster.get(studentId)), member, run, responses, mediaFailures, mediaFailureCount: mediaFailures.length, skills: skillRows, areas, totals,
      planned, answered: responses.filter(response => response.responseStatus === "answered").length,
      processed: responses.length, unsampledItems, unsampledSkills: skillRows.filter(skill => !skill.sampled).length,
      strengths: skillRows.filter(skill => skill.correct > 0), revisit: skillRows.filter(skill => skill.incorrect > 0),
      noIndependentEvidence: totals.independent === 0 };
  }).sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }) || a.studentId.localeCompare(b.studentId));
  const groups = skills.flatMap(skill => {
    const levels = [...new Set(pupils.flatMap(pupil => pupil.skills.find(row => row.id === skill.id)?.recentErrors.map(response => Number(response.level)) || []))].sort((a, b) => a - b);
    return levels.map(level => {
      const members = pupils.flatMap(pupil => {
        const evidence = pupil.skills.find(row => row.id === skill.id);
        const examples = evidence?.recentErrors.filter(response => Number(response.level) === level) || [];
        return examples.length ? [{ studentId: pupil.studentId, name: pupil.name,
          independentCount: evidence.levels.find(row => row.level === level)?.independent || 0, incorrectCount: examples.length, examples }] : [];
      });
      return { id: `${skill.id}:${level}`, skillId: skill.id, level, label: skill.label, domainId: skill.domainId,
        suggestion: `${skill.suggestion || "Model the skill with a new example."} Then check a different example without help.`, members };
    });
  });
  return { session, pupils, groups, areas: LITERACY_MOCK_REPORT_AREAS, totalSkills: skills.length,
    needsSample: pupils.filter(pupil => pupil.noIndependentEvidence),
    partialSamples: pupils.filter(pupil => !pupil.noIndependentEvidence && pupil.unsampledSkills > 0),
    generatedAt: new Date(nowMs).toISOString(),
    note: "These are observations from this mock session, not MAP scores or proficiency judgments. Different questions and difficulty levels cannot be compared as an overall accuracy score. Listening and independent reading remain separate skills." };
}

export function literacyMockControlError(error) {
  const code = typeof error === "string" ? error : error?.code;
  return ({ stale_revision: "This session changed elsewhere. The latest state is loading; check it before trying again.",
    invalid_transition: "That action is no longer available. Refresh the session and check its current state.",
    assessment_finished: "This assessment has already finished. Saved answers remain available below.",
    student_busy: "One or more selected students already have an active session. Close their existing session first.",
    session_not_found: "This session is no longer available to your account.",
    class_not_found: "This class is no longer available to your account." })[code]
    || "The service could not confirm this action. Check your connection and retry; saved answers are preserved.";
}
