import {
  APPROVED_FOUNDATION_SKILL_IDS,
  MATHS_RELEASE_STATUSES,
  mathsSkillTree
} from "../src/maths/curriculum/mathsSkillTree.js";
import { mathsCycles } from "../src/maths/curriculum/mathsCycles.js";
import { mathsPrerequisites } from "../src/maths/curriculum/mathsPrerequisites.js";
import {
  MATHS_STANDARD_CODES_BY_SKILL,
  isKnownMathsStandard
} from "../src/maths/curriculum/standardsCrosswalk.js";

const errors = [];
const requiredFields = [
  "id",
  "subject",
  "year",
  "strand",
  "label",
  "childLabel",
  "teacherIntent",
  "prerequisiteIds",
  "representations",
  "vocabulary",
  "assessmentBlueprintIds",
  "misconceptionIds",
  "transferContexts",
  "standards",
  "releaseStatus",
  "nextActions"
];
const validYears = new Set(["F", "1", "2"]);
const validStrands = new Set([
  "number",
  "algebra",
  "measurement",
  "space",
  "statistics",
  "probability"
]);
const validReleaseStatuses = new Set(Object.values(MATHS_RELEASE_STATUSES));

function fail(message) {
  errors.push(message);
}
const ids = mathsSkillTree.map(skill => skill.id);
const idSet = new Set(ids);
if (ids.length !== idSet.size) fail("Maths skill IDs must be unique.");
if (ids.length !== 48) fail(`Expected the complete 48-skill F–2 spine; found ${ids.length}.`);

for (const skill of mathsSkillTree) {
  for (const field of requiredFields) {
    if (skill[field] === undefined || skill[field] === null || skill[field] === "") {
      fail(`${skill.id || "Unknown skill"} is missing ${field}.`);
    }
  }
  if (skill.subject !== "maths") fail(`${skill.id} must use subject=maths.`);
  if (!validYears.has(skill.year)) fail(`${skill.id} has unknown year ${skill.year}.`);
  if (!validStrands.has(skill.strand)) fail(`${skill.id} has unknown strand ${skill.strand}.`);
  if (!validReleaseStatuses.has(skill.releaseStatus)) {
    fail(`${skill.id} has unknown releaseStatus ${skill.releaseStatus}.`);
  }
  if (!Array.isArray(skill.prerequisiteIds)) fail(`${skill.id} prerequisiteIds must be an array.`);
  if (!Array.isArray(skill.standards) || skill.standards.length === 0) {
    fail(`${skill.id} must have at least one curriculum standard.`);
  }
  for (const standardId of skill.standards || []) {
    if (!isKnownMathsStandard(standardId)) fail(`${skill.id} uses unknown standard ${standardId}.`);
  }
  const crosswalkStandards = MATHS_STANDARD_CODES_BY_SKILL[skill.id] || [];
  if (JSON.stringify(skill.standards) !== JSON.stringify(crosswalkStandards)) {
    fail(`${skill.id} standards do not match the standards crosswalk.`);
  }
  const declaredPrerequisites = mathsPrerequisites[skill.id];
  if (!declaredPrerequisites) fail(`${skill.id} is missing from mathsPrerequisites.`);
  if (JSON.stringify(skill.prerequisiteIds) !== JSON.stringify(declaredPrerequisites || [])) {
    fail(`${skill.id} prerequisiteIds do not match mathsPrerequisites.`);
  }
  for (const prerequisiteId of skill.prerequisiteIds || []) {
    if (!idSet.has(prerequisiteId)) fail(`${skill.id} has unknown prerequisite ${prerequisiteId}.`);
    if (prerequisiteId === skill.id) fail(`${skill.id} cannot require itself.`);
  }
  if (skill.releaseStatus === MATHS_RELEASE_STATUSES.APPROVED) {
    if (!Array.isArray(skill.representations) || skill.representations.length < 2) {
      fail(`${skill.id} needs at least two representations before release.`);
    }
    if (!Array.isArray(skill.assessmentBlueprintIds) || skill.assessmentBlueprintIds.length === 0) {
      fail(`${skill.id} needs an assessment blueprint before release.`);
    }
    if (!Array.isArray(skill.nextActions) || skill.nextActions.length < 2) {
      fail(`${skill.id} needs at least two instructional next actions before release.`);
    }
  }
}

for (const registryName of ["mathsPrerequisites", "standardsCrosswalk"]) {
  const registry = registryName === "mathsPrerequisites"
    ? mathsPrerequisites
    : MATHS_STANDARD_CODES_BY_SKILL;
  for (const skillId of Object.keys(registry)) {
    if (!idSet.has(skillId)) fail(`${registryName} contains unknown skill ${skillId}.`);
  }
  for (const skillId of ids) {
    if (!Object.hasOwn(registry, skillId)) fail(`${registryName} is missing ${skillId}.`);
  }
}

const approvedIds = mathsSkillTree
  .filter(skill => skill.releaseStatus === MATHS_RELEASE_STATUSES.APPROVED)
  .map(skill => skill.id)
  .sort();
const expectedApprovedIds = [...APPROVED_FOUNDATION_SKILL_IDS].sort();
if (JSON.stringify(approvedIds) !== JSON.stringify(expectedApprovedIds)) {
  fail(`Approved skills must be exactly ${expectedApprovedIds.join(", ")}.`);
}

const visiting = new Set();
const visited = new Set();
function visit(skillId, path = []) {
  if (visiting.has(skillId)) {
    fail(`Prerequisite cycle found: ${[...path, skillId].join(" -> ")}.`);
    return;
  }
  if (visited.has(skillId)) return;
  visiting.add(skillId);
  for (const prerequisiteId of mathsPrerequisites[skillId] || []) {
    visit(prerequisiteId, [...path, skillId]);
  }
  visiting.delete(skillId);
  visited.add(skillId);
}
for (const skillId of ids) visit(skillId);

if (mathsCycles.length !== 18) fail(`Expected 18 teaching cycles; found ${mathsCycles.length}.`);
const cycleIds = new Set();
const cycleSkillCounts = new Map();
for (const cycle of mathsCycles) {
  if (cycleIds.has(cycle.id)) fail(`Duplicate maths cycle ID ${cycle.id}.`);
  cycleIds.add(cycle.id);
  if (!validYears.has(cycle.year)) fail(`${cycle.id} has unknown year ${cycle.year}.`);
  if (!Number.isInteger(cycle.number) || cycle.number < 1 || cycle.number > 6) {
    fail(`${cycle.id} has invalid cycle number ${cycle.number}.`);
  }
  if (!cycle.label || !Array.isArray(cycle.skillIds) || cycle.skillIds.length === 0) {
    fail(`${cycle.id} needs a label and at least one skill.`);
  }
  for (const skillId of cycle.skillIds || []) {
    if (!idSet.has(skillId)) fail(`${cycle.id} contains unknown skill ${skillId}.`);
    const skill = mathsSkillTree.find(candidate => candidate.id === skillId);
    if (skill && skill.year !== cycle.year) fail(`${skillId} is in the wrong year cycle ${cycle.id}.`);
    cycleSkillCounts.set(skillId, (cycleSkillCounts.get(skillId) || 0) + 1);
  }
}
for (const skillId of ids) {
  const count = cycleSkillCounts.get(skillId) || 0;
  if (count !== 1) fail(`${skillId} must appear in exactly one teaching cycle; found ${count}.`);
}

if (errors.length) {
  console.error(`Maths curriculum gate failed with ${errors.length} error${errors.length === 1 ? "" : "s"}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const approvedCount = approvedIds.length;
  console.log(
    `Maths curriculum gate passed: ${mathsSkillTree.length} skills, `
    + `${mathsCycles.length} cycles, ${approvedCount} approved Foundation skills, `
    + `${mathsSkillTree.length - approvedCount} planned skills.`
  );
}
