import { CLOSED_SET_FORMATS, optionSetSignature, promptAnswerSignature } from "../policy/assessmentRepeatPolicy.js";
import { getSkillBlueprint, RETENTION_RULE } from "../content/blueprints/skillBlueprints.js";
import { assessmentAttemptsToSkillLedger, computeSkillStatus } from "../policy/skillStatusPolicy.js";

const STEPS = [{ level: 1, phase: 1 }, { level: 1, phase: 2 }, { level: 2, phase: 1 }, { level: 2, phase: 2 }];
export function sittingQuestionSignatures(question) {
  const scene = (question.skillId || question.assessmentSkillId) === "prepositions_of_place"
    ? question.imagePath || question.imageUrl || question.image || "" : "";
  return {
    id: String(question.id || question.questionId || ""),
    prompt: promptAnswerSignature(question),
    options: CLOSED_SET_FORMATS.has(question.formatType || question.templateType) ? "" : optionSetSignature(question),
    evidence: scene ? `${scene}||${String(question.answer || "").toLowerCase().trim()}` : ""
  };
}

export function repeatsSittingQuestion(question, signatures = []) {
  const signature = sittingQuestionSignatures(question);
  return signatures.some(other => other.id === signature.id || other.prompt === signature.prompt
    || (signature.options && other.options === signature.options)
    || (signature.evidence && other.evidence === signature.evidence));
}

export function learnerAssessmentStatus(attempts, skillId, studentId, options) {
  return computeSkillStatus(assessmentAttemptsToSkillLedger(attempts, skillId, { studentId }), skillId, options);
}

export function nextAssessmentStep(status) {
  return STEPS.find(step => !status?.[`level${step.level}`]?.phases?.[step.phase]?.currentPassed) || null;
}

// Compose the entire sitting before showing a question. The last administered
// sitting is protected; older content rotates back only after fresh stock.
export function composeAssessmentSitting({ bank, skillId, studentId, attempts = [], previousSittings = [], assignedStep = null, mode = "mastery", now = Date.now(), random = Math.random }) {
  const blueprint = getSkillBlueprint(skillId);
  if (!blueprint) return { error: "This skill has no assessment blueprint." };
  const ownAttempts = attempts.filter(row => String(row.studentId || row.student_id || "") === String(studentId));
  const status = learnerAssessmentStatus(ownAttempts, skillId, studentId, { now });
  const step = assignedStep || nextAssessmentStep(status);
  const retention = mode === "retention" || !step;
  if (retention && !status?.retention?.eligible) {
    const date = status?.retention?.unlockAt;
    return { error: date ? `The retention check opens on ${new Date(date).toLocaleDateString()}.` : "Pass both levels before taking the retention check.", status };
  }
  const target = retention ? { level: 2, phase: 2 } : step;
  const sittingSize = retention ? RETENTION_RULE.items : blueprint.sitting;
  const pool = bank.filter(question =>
    (question.assessmentSkillId || question.skillId) === skillId
    && Boolean(question.retentionOnly) === retention
    && (retention || (Number(question.level) === target.level && Number(question.phase) === target.phase))
    && !question.nonGating
  );
  const byId = new Map(pool.map(question => [question.id, question]));
  const relevant = ownAttempts.filter(row =>
    (row.skillId || row.assessmentSkillId) === skillId
    && (/retention/i.test(row.assessmentType || row.mode || "") === retention)
    && (retention || (Number(row.skillLevel) === target.level && Number(row.skillPhase) === target.phase))
  ).sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  const previousPlan = previousSittings.filter(plan => plan.studentId === studentId && plan.skillId === skillId
    && (plan.mode === "retention") === retention
    && (retention || (plan.level === target.level && plan.phase === target.phase)))
    .sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt)).at(-1);
  const previousAttempt = relevant.at(-1);
  const previous = previousPlan && (!previousAttempt || new Date(previousPlan.startedAt) >= new Date(previousAttempt.completedAt))
    ? previousPlan.questionIds.map(questionId => ({ questionId }))
    : previousAttempt?.questionRecords || [];
  const protectedSignatures = previous.map(row => sittingQuestionSignatures(byId.get(row.questionId) || row));
  const seenIds = new Set(relevant.flatMap(row => (row.questionRecords || []).map(question => question.questionId)));
  const ranked = pool.map(question => ({ question, order: random() }))
    .sort((a, b) => Number(seenIds.has(a.question.id)) - Number(seenIds.has(b.question.id)) || a.order - b.order);
  const selected = [];
  const signatures = [];
  const remaining = [...ranked];
  const unitCounts = new Map();
  while (remaining.length && selected.length < sittingSize) {
    remaining.sort((a, b) => (unitCounts.get(a.question.itemKey) || 0) - (unitCounts.get(b.question.itemKey) || 0));
    const { question } = remaining.shift();
    const signature = sittingQuestionSignatures(question);
    if (repeatsSittingQuestion(question, [...protectedSignatures, ...signatures])) continue;
    selected.push(question);
    signatures.push(signature);
    unitCounts.set(question.itemKey, (unitCounts.get(question.itemKey) || 0) + 1);
  }
  if (selected.length < sittingSize) return { error: "There are not enough fresh, available questions for a complete check. No answers have been scored.", status };
  return {
    studentId, skillId, mode: retention ? "retention" : "mastery", ...target,
    sittingSize, questionIds: selected.map(question => question.id), protectedSignatures,
    startedAt: new Date(now).toISOString(), status
  };
}
