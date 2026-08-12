import { pathToFileURL } from "node:url";

import { skillBlueprints } from "../src/content/blueprints/skillBlueprints.js";
import { loadAssessmentSkillBank } from "../src/data/loadAssessmentSkillBank.js";
import { buildSkillsCheckReportModel } from "../src/data/studentReportingWorkspaceModel.js";
import {
  RUNTIME_SKILL_ID_BY_ASSESSMENT_ID,
  listV3PublishedSkillIds
} from "../src/data/v3/v3Registry.js";
import { skillTree } from "../src/skillTree.js";
import {
  APPROVED_FOUNDATION_SKILL_IDS,
  mathsSkillById
} from "../src/maths/curriculum/mathsSkillTree.js";
import { mathsActivityRecipesBySkill } from "../src/maths/learn/mathsActivityRecipes.js";
import { assessmentModelsForSkill } from "../src/maths/assessment/mathsAssessmentBank.js";
import {
  MATHS_EVIDENCE_EVENT_TYPES,
  MATHS_EVIDENCE_SCHEMA_VERSION
} from "../src/maths/data/mathsEvidenceStore.js";
import { mathsSkillReport } from "../src/maths/reporting/mathsReporting.js";

const NODE_TYPES = Object.freeze({
  GOAL: "curriculum_goal",
  EXPERIENCE: "learning_experience",
  EVIDENCE: "evidence_event",
  REPORT: "teacher_report"
});

function addNode(nodes, node) {
  if (!nodes.has(node.id)) nodes.set(node.id, Object.freeze(node));
}

function addEdge(edges, from, to, relation) {
  edges.push(Object.freeze({
    id: `${from}::${relation}::${to}`,
    from,
    to,
    relation
  }));
}

function addIssue(issues, subject, goalId, code, detail) {
  issues.push(Object.freeze({ subject, goalId, code, detail }));
}

function literacyAttempt({ question, runtimeSkillId, assessmentSkillId, observedAt }) {
  const questionId = String(question.id || question.questionId || `${assessmentSkillId}-first-item`);
  return {
    attemptId: `capability-audit-${assessmentSkillId}`,
    studentId: "capability-audit-student",
    studentName: "Capability audit",
    classId: "capability-audit-class",
    assessmentType: "skill_checkpoint",
    skillId: runtimeSkillId,
    skillName: skillTree.find(skill => skill.id === runtimeSkillId)?.label || runtimeSkillId,
    startedAt: observedAt,
    completedAt: observedAt,
    updatedAt: observedAt,
    administrationStatus: "completed",
    totalQuestions: 1,
    correctCount: 1,
    questionRecords: [{
      ...question,
      questionId,
      correctAnswer: question.correctAnswer ?? question.answer,
      selectedAnswer: question.correctAnswer ?? question.answer,
      responseStatus: "correct",
      isCorrect: true,
      timestamp: observedAt
    }]
  };
}

async function addLiteracyCapabilities({ nodes, edges, issues, now }) {
  const runtimeSkills = new Set(skillTree.map(skill => skill.id));
  const publishedSkillIds = listV3PublishedSkillIds();

  for (const assessmentSkillId of publishedSkillIds) {
    const runtimeSkillId = RUNTIME_SKILL_ID_BY_ASSESSMENT_ID[assessmentSkillId]
      || assessmentSkillId;
    const goalId = `literacy:goal:${runtimeSkillId}`;
    const experienceId = `literacy:assessment:${assessmentSkillId}`;
    const evidenceId = `literacy:evidence:${assessmentSkillId}`;
    const reportId = `literacy:report:${runtimeSkillId}`;
    const blueprint = skillBlueprints[assessmentSkillId];
    const questions = await loadAssessmentSkillBank(assessmentSkillId);

    addNode(nodes, {
      id: goalId,
      type: NODE_TYPES.GOAL,
      subject: "literacy",
      key: runtimeSkillId,
      label: skillTree.find(skill => skill.id === runtimeSkillId)?.label || runtimeSkillId
    });
    addNode(nodes, {
      id: experienceId,
      type: NODE_TYPES.EXPERIENCE,
      subject: "literacy",
      key: assessmentSkillId,
      label: `${assessmentSkillId} assessment`,
      itemCount: questions.length
    });

    if (!runtimeSkills.has(runtimeSkillId)) {
      addIssue(issues, "literacy", runtimeSkillId, "missing_runtime_goal", `${assessmentSkillId} does not map to the runtime skill tree.`);
    }
    if (!blueprint) {
      addIssue(issues, "literacy", runtimeSkillId, "missing_blueprint", `${assessmentSkillId} has no current assessment blueprint.`);
    }
    if (!questions.length) {
      addIssue(issues, "literacy", runtimeSkillId, "empty_experience", `${assessmentSkillId} has no runtime-selectable questions.`);
    }

    const firstQuestion = questions[0];
    if (firstQuestion) {
      const model = buildSkillsCheckReportModel({
        student: { id: "capability-audit-student", name: "Capability audit" },
        assessmentHistory: [literacyAttempt({
          question: firstQuestion,
          runtimeSkillId,
          assessmentSkillId,
          observedAt: now.toISOString()
        })],
        now
      });
      const reportEvidence = model.knowledgeEvidence.find(row => row?.concept?.conceptId);
      if (!reportEvidence) {
        addIssue(issues, "literacy", runtimeSkillId, "unreportable_experience", `${assessmentSkillId} can run but its saved response did not reach Skills Check evidence.`);
      } else {
        addNode(nodes, {
          id: evidenceId,
          type: NODE_TYPES.EVIDENCE,
          subject: "literacy",
          key: reportEvidence.concept.conceptId,
          label: reportEvidence.concept.label
        });
        addNode(nodes, {
          id: reportId,
          type: NODE_TYPES.REPORT,
          subject: "literacy",
          key: runtimeSkillId,
          label: "Skills Check and Whole Child report"
        });
        addEdge(edges, experienceId, evidenceId, "records");
        addEdge(edges, evidenceId, reportId, "appears_in");
      }
    }
    addEdge(edges, goalId, experienceId, "checked_by");
  }
}

function addMathsCapabilities({ nodes, edges, issues, now }) {
  const supportsSkillsCheck = MATHS_EVIDENCE_EVENT_TYPES.includes("skills_check_response");
  const supportsLessonObservation = MATHS_EVIDENCE_EVENT_TYPES.includes("lesson_exit_observation");

  for (const skillId of APPROVED_FOUNDATION_SKILL_IDS) {
    const skill = mathsSkillById[skillId];
    const recipes = mathsActivityRecipesBySkill[skillId] || [];
    const models = assessmentModelsForSkill(skillId);
    const report = mathsSkillReport([], skillId, { now });
    const goalId = `maths:goal:${skillId}`;
    const lessonId = `maths:lesson:${skillId}`;
    const assessmentId = `maths:assessment:${skillId}`;
    const evidenceId = `maths:evidence:${skillId}`;
    const reportId = `maths:report:${skillId}`;

    addNode(nodes, {
      id: goalId,
      type: NODE_TYPES.GOAL,
      subject: "maths",
      key: skillId,
      label: skill?.childLabel || skillId
    });
    addNode(nodes, {
      id: lessonId,
      type: NODE_TYPES.EXPERIENCE,
      subject: "maths",
      key: skillId,
      label: `${skill?.childLabel || skillId} lesson`,
      itemCount: recipes.length
    });
    addNode(nodes, {
      id: assessmentId,
      type: NODE_TYPES.EXPERIENCE,
      subject: "maths",
      key: skillId,
      label: `${skill?.childLabel || skillId} skills check`,
      itemCount: models.length
    });

    if (!skill) addIssue(issues, "maths", skillId, "missing_runtime_goal", `${skillId} is approved but has no curriculum definition.`);
    if (!recipes.length) addIssue(issues, "maths", skillId, "missing_lesson", `${skillId} has no released lesson recipe.`);
    if (!models.length) addIssue(issues, "maths", skillId, "missing_assessment", `${skillId} has no released assessment model.`);
    if (!supportsSkillsCheck || !supportsLessonObservation || MATHS_EVIDENCE_SCHEMA_VERSION !== 1) {
      addIssue(issues, "maths", skillId, "missing_evidence_contract", `${skillId} cannot reach both lesson and skills-check evidence under the current schema.`);
    }
    if (report?.skillId !== skillId || report?.status !== "Not checked") {
      addIssue(issues, "maths", skillId, "missing_report_row", `${skillId} does not produce a neutral teacher report row.`);
    }

    if (supportsSkillsCheck && supportsLessonObservation && MATHS_EVIDENCE_SCHEMA_VERSION === 1) {
      addNode(nodes, {
        id: evidenceId,
        type: NODE_TYPES.EVIDENCE,
        subject: "maths",
        key: skillId,
        label: "Maths evidence schema v1"
      });
      addEdge(edges, lessonId, evidenceId, "records");
      addEdge(edges, assessmentId, evidenceId, "records");
    }
    if (report?.skillId === skillId) {
      addNode(nodes, {
        id: reportId,
        type: NODE_TYPES.REPORT,
        subject: "maths",
        key: skillId,
        label: `${skill?.childLabel || skillId} teacher report`
      });
      addEdge(edges, evidenceId, reportId, "appears_in");
    }
    addEdge(edges, goalId, lessonId, "taught_by");
    addEdge(edges, goalId, assessmentId, "checked_by");
  }
}

function reachableReportPath(goalId, nodes, edges) {
  const outgoing = new Map();
  edges.forEach(edge => {
    const rows = outgoing.get(edge.from) || [];
    rows.push(edge.to);
    outgoing.set(edge.from, rows);
  });
  const queue = [[goalId]];
  const visited = new Set([goalId]);
  while (queue.length) {
    const path = queue.shift();
    const current = path.at(-1);
    if (current !== goalId && nodes.get(current)?.type === NODE_TYPES.REPORT) return path;
    for (const next of outgoing.get(current) || []) {
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push([...path, next]);
    }
  }
  return [];
}

export async function buildLearningCapabilityGraph({ now = new Date() } = {}) {
  const nodes = new Map();
  const edges = [];
  const issues = [];
  await addLiteracyCapabilities({ nodes, edges, issues, now });
  addMathsCapabilities({ nodes, edges, issues, now });

  const duplicateEdgeIds = edges
    .map(edge => edge.id)
    .filter((id, index, rows) => rows.indexOf(id) !== index);
  duplicateEdgeIds.forEach(id => addIssue(issues, "all", id, "duplicate_edge", id));
  edges.forEach(edge => {
    if (!nodes.has(edge.from) || !nodes.has(edge.to)) {
      addIssue(issues, nodes.get(edge.from)?.subject || "all", edge.from, "dangling_edge", edge.id);
    }
  });

  const paths = {};
  for (const node of nodes.values()) {
    if (node.type !== NODE_TYPES.GOAL) continue;
    const path = reachableReportPath(node.id, nodes, edges);
    paths[node.id] = Object.freeze(path);
    if (!path.length) {
      addIssue(issues, node.subject, node.key, "unreachable_report", `${node.label} has no complete goal-to-report path.`);
    }
  }

  return Object.freeze({
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    nodes: Object.freeze([...nodes.values()]),
    edges: Object.freeze(edges),
    paths: Object.freeze(paths),
    issues: Object.freeze(issues),
    summary: Object.freeze({
      goals: [...nodes.values()].filter(node => node.type === NODE_TYPES.GOAL).length,
      experiences: [...nodes.values()].filter(node => node.type === NODE_TYPES.EXPERIENCE).length,
      evidenceContracts: [...nodes.values()].filter(node => node.type === NODE_TYPES.EVIDENCE).length,
      reportDestinations: [...nodes.values()].filter(node => node.type === NODE_TYPES.REPORT).length,
      completePaths: Object.values(paths).filter(path => path.length).length,
      issues: issues.length
    })
  });
}

export function formatLearningCapabilityGraphSummary(graph) {
  return [
    `Learning capability graph: ${graph.summary.completePaths}/${graph.summary.goals} goal-to-report paths complete.`,
    `${graph.summary.experiences} released learning/check experiences; ${graph.summary.evidenceContracts} evidence contracts; ${graph.summary.reportDestinations} report destinations.`,
    graph.issues.length
      ? graph.issues.map(issue => `- ${issue.subject}/${issue.goalId}: ${issue.code} — ${issue.detail}`).join("\n")
      : "No reachability issues found."
  ].join("\n");
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  const graph = await buildLearningCapabilityGraph();
  console.log(formatLearningCapabilityGraphSummary(graph));
  if (graph.issues.length) process.exitCode = 1;
}
