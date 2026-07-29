// Skills Assessment Rebuild v3 — runtime registry.
//
// Maps rebuilt skills to their generated v3 banks and answers ONE question for
// the rest of the app: "is this skill published under the v3 standard?" A skill
// is v3-published only when the gate (tools/assessmentRebuild/gate.mjs) wrote a
// status entry with every hard gate green at the current standard version.
// Anything else falls back to the legacy publication path untouched.

import {
  assessmentRebuildStatusBySkillId,
  assessmentRebuildStatusVersion
} from "../../content/assessments/v3/assessmentRebuildStatus.generated.js";
import {
  ASSESSMENT_REBUILD_STANDARD_VERSION,
  V3_QUESTION_SOURCE,
  skillBlueprints
} from "../../content/blueprints/skillBlueprints.js";

export { V3_QUESTION_SOURCE };

// assessment skill id → runtime/skillTree id (kept tiny and local: the same
// mapping loadAssessmentSkillBank has used since the split was introduced).
export const RUNTIME_SKILL_ID_BY_ASSESSMENT_ID = Object.freeze({
  long_vowels_silent_e: "long_vowels",
  r_controlled_vowels: "r_controlled",
  prepositions_of_place: "prepositions",
  prefixes_suffixes: "prefix_suffix",
  homophones_homonyms: "homophones",
  theme_higher_comprehension: "theme"
});

const V3_BANK_IMPORTS = {
  long_vowels_silent_e: () => import("./banks/long_vowels_silent_e.v3.generated.js"),
  digraphs: () => import("./banks/digraphs.v3.generated.js"),
  main_idea: () => import("./banks/main_idea.v3.generated.js"),
  inference: () => import("./banks/inference.v3.generated.js"),
  cause_effect: () => import("./banks/cause_effect.v3.generated.js"),
  context_clues: () => import("./banks/context_clues.v3.generated.js"),
  theme_higher_comprehension: () => import("./banks/theme_higher_comprehension.v3.generated.js"),
  sequencing: () => import("./banks/sequencing.v3.generated.js")
};

const HARD_GATES = ["G1_structure", "G2_originality", "G3_answer_integrity", "G4_mastery_logic", "G5_no_repeats"];

export function getV3PublicationStatus(assessmentSkillId = "") {
  if (assessmentRebuildStatusVersion !== ASSESSMENT_REBUILD_STANDARD_VERSION) return null;
  const status = assessmentRebuildStatusBySkillId[assessmentSkillId];
  if (!status?.cutover) return null;
  if (!V3_BANK_IMPORTS[assessmentSkillId]) return null;
  const gatesGreen = HARD_GATES.every(gate => status.gates?.[gate] === "pass");
  return gatesGreen ? status : null;
}

export function isV3PublishedSkill(assessmentSkillId = "") {
  return Boolean(getV3PublicationStatus(assessmentSkillId));
}

export function listV3PublishedSkillIds() {
  return Object.keys(assessmentRebuildStatusBySkillId).filter(isV3PublishedSkill);
}

export async function importV3Bank(assessmentSkillId = "") {
  const loader = V3_BANK_IMPORTS[assessmentSkillId];
  if (!loader) return [];
  const module = await loader();
  return module.questions || [];
}

// Runtime eligibility for v3 items. Returns null when the question is NOT a v3
// item (caller falls through to its legacy rules); otherwise returns the issue
// list (empty = eligible). Keeps the legacy replacement-bank locks intact for
// legacy items while letting gate-proven v3 banks through.
export function getV3RuntimeEligibilityIssues(question = {}, assessmentSkillId = "") {
  if (question?.source !== V3_QUESTION_SOURCE) return null;
  if (!isV3PublishedSkill(assessmentSkillId)) return ["v3 bank is not published for this skill"];
  const blueprint = skillBlueprints[assessmentSkillId];
  const issues = [];
  const level = Number(question.level || question.difficulty || 1) >= 2 ? 2 : 1;
  const format = String(question.formatType || question.templateType || "").toUpperCase();
  if (!(blueprint.formatsByLevel?.[level] || []).includes(format)) {
    issues.push(`format ${format || "(missing)"} is not in the v3 blueprint for level ${level}`);
  }
  const units = new Set([
    ...(blueprint.unitsByLevel?.[1] || []),
    ...(blueprint.unitsByLevel?.[2] || []),
    ...(blueprint.nonGatingUnits || [])
  ]);
  if (!units.has(String(question.itemKey || ""))) {
    issues.push(`itemKey ${question.itemKey || "(missing)"} is not a v3 blueprint unit`);
  }
  const choices = Array.isArray(question.choices) ? question.choices : [];
  if (choices.length && !choices.includes(question.answer)) {
    issues.push("answer is missing from choices");
  }
  if (question.retentionOnly) issues.push("retention-reserve items are not selectable in regular sittings");
  return [...new Set(issues)];
}

export function getV3BlueprintForRuntimeSkillId(runtimeSkillId = "") {
  const assessmentSkillId = Object.entries(RUNTIME_SKILL_ID_BY_ASSESSMENT_ID)
    .find(([, runtime]) => runtime === runtimeSkillId)?.[0] || runtimeSkillId;
  if (!isV3PublishedSkill(assessmentSkillId)) return null;
  return skillBlueprints[assessmentSkillId] || null;
}
