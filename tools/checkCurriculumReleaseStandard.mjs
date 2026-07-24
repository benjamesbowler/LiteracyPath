import fs from "node:fs";
import path from "node:path";

import {
  ASSESSMENT_RELEASE_MANAGED_SKILL_IDS,
  ASSESSMENT_RELEASE_STANDARD_VERSION,
  assessmentReleaseStandard
} from "../src/content/releaseStandard.js";
import {
  assessmentReleaseStatus,
  assessmentReleaseStatusVersion
} from "../src/content/assessments/assessmentReleaseStatus.generated.js";
import { managedAssessmentSkillDepthConfig } from "../src/data/skillLevelDepthConfig.js";
import {
  getAssessmentSkillPublicationStatus,
  loadAssessmentSkillBank,
  loadAssessmentSkillBankCandidates
} from "../src/data/loadAssessmentSkillBank.js";
import {
  buildAssessmentReleaseStatus,
  renderAssessmentReleaseStatus
} from "./assessmentReleaseStatus.mjs";
import { auditStrictProductionReadiness } from "./auditAllSkillsStrictProductionReadiness.js";
import { repoRoot } from "./phonicsRuntimeUtils.js";

const generatedPath = path.join(
  repoRoot,
  "src",
  "content",
  "assessments",
  "assessmentReleaseStatus.generated.js"
);
const failures = [];

function fail(message) {
  failures.push(message);
}

function sameValues(left = [], right = []) {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
}

if (assessmentReleaseStandard.version !== ASSESSMENT_RELEASE_STANDARD_VERSION) {
  fail("Canonical release standard version exports disagree.");
}
if (assessmentReleaseStatusVersion !== ASSESSMENT_RELEASE_STANDARD_VERSION) {
  fail("Generated publication status uses a stale release-standard version.");
}
if (!sameValues(
  ASSESSMENT_RELEASE_MANAGED_SKILL_IDS,
  managedAssessmentSkillDepthConfig.map(skill => skill.skillId)
)) {
  fail("Release-standard skills and strict-audit managed skills differ.");
}

const expectedStatuses = buildAssessmentReleaseStatus();
const expectedGeneratedSource = renderAssessmentReleaseStatus(expectedStatuses);
if (fs.readFileSync(generatedPath, "utf8") !== expectedGeneratedSource) {
  fail("Generated assessment publication status is stale; run npm run generate:assessment-release-status.");
}

const strictReport = auditStrictProductionReadiness();
if (strictReport.strictStandard.version !== ASSESSMENT_RELEASE_STANDARD_VERSION) {
  fail("Strict audit did not report the canonical release-standard version.");
}
if (strictReport.perSkill.length !== ASSESSMENT_RELEASE_MANAGED_SKILL_IDS.length) {
  fail(`Strict audit covered ${strictReport.perSkill.length}/${ASSESSMENT_RELEASE_MANAGED_SKILL_IDS.length} release-managed skills.`);
}

for (const strictSkill of strictReport.perSkill) {
  const generated = assessmentReleaseStatus.find(status => status.skillId === strictSkill.skillId);
  const publication = getAssessmentSkillPublicationStatus(strictSkill.skillId);
  if (!generated) {
    fail(`${strictSkill.skillId}: missing generated publication decision.`);
    continue;
  }
  if (generated.releaseReady !== strictSkill.releaseStandardDecision.releaseReady) {
    fail(`${strictSkill.skillId}: generated and strict-audit release decisions disagree.`);
  }
  if (publication.releaseReady !== generated.releaseReady) {
    fail(`${strictSkill.skillId}: loader publication decision disagrees with generated status.`);
  }

  const candidates = await loadAssessmentSkillBankCandidates(strictSkill.skillId);
  const published = await loadAssessmentSkillBank(strictSkill.skillId);
  if (generated.releaseReady && published.length !== candidates.length) {
    fail(`${strictSkill.skillId}: a ready skill published ${published.length}/${candidates.length} candidate questions.`);
  }
  if (!generated.releaseReady && published.length !== 0) {
    fail(`${strictSkill.skillId}: a failing skill still published ${published.length} questions.`);
  }
}

const canonicalDefinitionPath = "src/content/releaseStandard.js";
const sourceGuards = [
  {
    file: "tools/auditAllSkillsStrictProductionReadiness.js",
    required: [
      /from "\.\.\/src\/content\/releaseStandard\.js"/u,
      /evaluateAssessmentSkillReleaseSummary/u
    ],
    forbidden: [
      /const minimumPerLevel\s*=\s*\d/u,
      /const minimumUniqueTargetsPerLevel\s*=\s*\d/u,
      /const maxTargetDominance\s*=\s*0\./u
    ]
  },
  {
    file: "src/data/skillLevelDepthConfig.js",
    required: [/from "\.\.\/content\/releaseStandard\.js"/u],
    forbidden: [
      /minimumPerLevel:\s*\d/u,
      /phaseSize:\s*\d/u
    ]
  },
  {
    file: "src/data/loadAssessmentSkillBank.js",
    required: [
      /assessmentReleaseStatusBySkillId/u,
      /if \(!publicationStatus\.releaseReady\) return \[\]/u
    ],
    forbidden: []
  }
];

for (const guard of sourceGuards) {
  const source = fs.readFileSync(path.join(repoRoot, guard.file), "utf8");
  for (const pattern of guard.required) {
    if (!pattern.test(source)) fail(`${guard.file}: missing canonical-standard integration ${pattern}.`);
  }
  for (const pattern of guard.forbidden) {
    if (pattern.test(source)) fail(`${guard.file}: duplicates a policy owned by ${canonicalDefinitionPath}.`);
  }
}

const readyCount = assessmentReleaseStatus.filter(status => status.releaseReady).length;
console.log(`Canonical release standard: ${ASSESSMENT_RELEASE_STANDARD_VERSION}`);
console.log(`Release-managed skills: ${assessmentReleaseStatus.length}`);
console.log(`Published skills: ${readyCount}`);
console.log(`Blocked skills: ${assessmentReleaseStatus.length - readyCount}`);
console.log(`Strict/loader/generator mismatches: ${failures.length}`);
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
}
