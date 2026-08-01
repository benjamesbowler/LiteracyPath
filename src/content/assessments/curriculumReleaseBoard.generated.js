// Current Skills assessment release board. It is derived directly from the v3
// publication status used by the runtime; there is no parallel release rubric.
import { skillTree } from "../../skillTree.js";
import {
  assessmentRebuildStatusBySkillId,
  assessmentRebuildStatusVersion
} from "./v3/assessmentRebuildStatus.generated.js";

const RUNTIME_ID_BY_ASSESSMENT_ID = Object.freeze({
  long_vowels_silent_e: "long_vowels",
  r_controlled_vowels: "r_controlled",
  prepositions_of_place: "prepositions",
  prefixes_suffixes: "prefix_suffix",
  homophones_homonyms: "homophones",
  theme_higher_comprehension: "theme"
});

const rows = Object.values(assessmentRebuildStatusBySkillId).map(status => {
  const runtimeId = RUNTIME_ID_BY_ASSESSMENT_ID[status.skillId] || status.skillId;
  const skillName = skillTree.find(skill => skill.id === runtimeId)?.label || status.skillId;
  const level1 = Number(status.counts?.level1 || 0);
  const level2 = Number(status.counts?.level2 || 0);
  const releaseReady = status.cutover === true
    && Object.values(status.gates || {}).every(value => value === "pass");
  return Object.freeze({
    skillId: status.skillId,
    skillName,
    standardVersion: status.standardVersion,
    gateStatus: releaseReady ? "READY" : "BLOCKED",
    releaseReady,
    reasons: releaseReady ? [] : ["One or more current v3 automated gates did not pass."],
    owner: "Automated v3 assessment gate",
    authoredQuestions: Number(status.counts?.total || 0),
    approvedQuestions: releaseReady ? level1 + level2 : 0,
    releaseEligibleQuestions: releaseReady ? level1 + level2 : 0,
    runtimeSelectableQuestions: releaseReady ? level1 + level2 : 0,
    unapprovedAudioQuestions: 0,
    missingRequiredImages: 0,
    missingRequiredAudio: 0,
    wiringDefects: status.gates?.G6_one_report === "pass" ? 0 : 1,
    studentExposure: Object.freeze({ count: releaseReady ? level1 + level2 : 0, level1, level2 }),
    waiver: null,
    dimensions: Object.freeze({ ...(status.gates || {}) })
  });
});

export const curriculumReleaseBoard = Object.freeze({
  schemaVersion: 3,
  standardVersion: assessmentRebuildStatusVersion,
  generatedFrom: Object.freeze(["assessment rebuild v3 gate"]),
  readySkills: rows.filter(row => row.releaseReady).length,
  blockedSkills: rows.filter(row => !row.releaseReady).length,
  rows: Object.freeze(rows)
});
