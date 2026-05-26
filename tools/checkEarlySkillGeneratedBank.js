import path from "node:path";

import { initialSoundWordBank } from "../src/content/initialSounds/initialSoundWordBank.js";
import { hasImportedInitialSoundImage } from "../src/content/initialSounds/initialSoundMediaManifest.js";
import { generatedEarlySkillQuestions } from "../src/data/generated/earlySkillQuestions.generated.js";
import {
  coverageExpectations,
  cvcShortVowelExpectedItemKeys,
  finalSoundExpectedItemKeys,
  finalSoundLevelTwoExpectedItemKeys,
  rhymingExpectedItemKeys
} from "../src/data/coverageExpectations.js";
import {
  normalizeWord,
  repoRoot,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";

const skillChecks = [
  {
    id: "initial_sounds",
    label: "Initial Sounds",
    minimumRuntime: 100,
    expectedTargets: coverageExpectations.initial_sounds.itemKeys,
    getRuntimeItems: () => initialSoundWordBank.filter(item => item.active !== false && hasImportedInitialSoundImage(item)),
    getTarget: item => item.letter
  },
  {
    id: "final_sounds",
    label: "Final Sounds",
    minimumRuntime: 200,
    expectedTargets: [...finalSoundExpectedItemKeys, ...finalSoundLevelTwoExpectedItemKeys],
    getRuntimeItems: () => selectableRuntimeQuestionsForSkill("final_sounds"),
    getTarget: item => item.coverageTarget || item.targetFinalSound || item.itemKey
  },
  {
    id: "cvc_short_vowels",
    label: "CVC Short Vowels",
    minimumRuntime: 250,
    expectedTargets: cvcShortVowelExpectedItemKeys,
    getRuntimeItems: () => selectableRuntimeQuestionsForSkill("cvc_short_vowels"),
    getTarget: item => item.coverageTarget || item.itemKey || item.phonicsPattern
  },
  {
    id: "rhyming",
    label: "Rhyming Words",
    minimumRuntime: 200,
    expectedTargets: rhymingExpectedItemKeys,
    getRuntimeItems: () => selectableRuntimeQuestionsForSkill("rhyming"),
    getTarget: item => item.coverageTarget || item.rhymeGroup || item.rime || item.itemKey
  },
  {
    id: "short_vowel_discrimination",
    label: "Short Vowel Discrimination",
    minimumRuntime: 150,
    expectedTargets: cvcShortVowelExpectedItemKeys,
    getRuntimeItems: () => generatedEarlySkillQuestions.filter(item => item.skillId === "short_vowel_discrimination" && item.active !== false),
    getTarget: item => item.coverageTarget || item.itemKey || item.phonicsPattern
  }
];

function unique(values) {
  return [...new Set(values.filter(Boolean).map(value => String(value).toLowerCase()))];
}

function countBy(items, getter) {
  return items.reduce((counts, item) => {
    const key = getter(item) || "(missing)";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

const generatedBySkill = countBy(generatedEarlySkillQuestions, item => item.skillId);
const failures = [];
const sections = [];

for (const skill of skillChecks) {
  const runtimeItems = skill.getRuntimeItems();
  const targets = unique(runtimeItems.map(skill.getTarget));
  const missingTargets = skill.expectedTargets.filter(target => !targets.includes(target));
  const byTemplate = countBy(runtimeItems, item => item.templateType || item.formatType || item.questionType);
  const byTarget = countBy(runtimeItems, skill.getTarget);
  const duplicateIds = unique(
    runtimeItems
      .map(item => item.id)
      .filter((id, index, list) => id && list.indexOf(id) !== index)
  );
  const duplicateSignatures = unique(
    runtimeItems
      .map(item => `${normalizeWord(item.targetWord || item.answer || item.correctAnswer)}|${item.templateType || item.formatType}|${item.correctAnswer || item.answer}`)
      .filter((signature, index, list) => signature && list.indexOf(signature) !== index)
  );

  if (runtimeItems.length < skill.minimumRuntime) {
    failures.push(`${skill.label} has ${runtimeItems.length} runtime/generated items; expected at least ${skill.minimumRuntime}.`);
  }
  if (missingTargets.length) {
    failures.push(`${skill.label} is missing required coverage targets: ${missingTargets.join(", ")}.`);
  }
  if (duplicateIds.length) {
    failures.push(`${skill.label} has duplicate IDs: ${duplicateIds.join(", ")}.`);
  }

  sections.push(`## ${skill.label}

- Skill ID: ${skill.id}
- Runtime/generated items checked: ${runtimeItems.length}
- Minimum expected: ${skill.minimumRuntime}
- Required targets: ${skill.expectedTargets.join(", ")}
- Covered targets: ${targets.join(", ") || "none"}
- Missing targets: ${missingTargets.join(", ") || "none"}
- Duplicate IDs: ${duplicateIds.join(", ") || "none"}
- Duplicate target/template/answer signatures: ${duplicateSignatures.slice(0, 20).join(", ") || "none"}

### Templates

| Template | Count |
| --- | ---: |
${Object.entries(byTemplate).sort(([a], [b]) => a.localeCompare(b)).map(([key, count]) => `| ${key} | ${count} |`).join("\n")}

### Coverage Targets

| Target | Count |
| --- | ---: |
${Object.entries(byTarget).sort(([a], [b]) => a.localeCompare(b)).map(([key, count]) => `| ${key} | ${count} |`).join("\n")}
`);
}

const report = `# Early Skill Generated Bank Check

Generated: ${new Date().toISOString()}

## Generated File Counts

| Skill | Generated Questions |
| --- | ---: |
${Object.entries(generatedBySkill).sort(([a], [b]) => a.localeCompare(b)).map(([skillId, count]) => `| ${skillId} | ${count} |`).join("\n")}

## Failures

${failures.length ? failures.map(item => `- ${item}`).join("\n") : "- none"}

${sections.join("\n")}
`;

writeFile(path.join(repoRoot, "docs/validation/early_skill_generated_bank_check.md"), report);

console.log(`Generated early skill questions: ${generatedEarlySkillQuestions.length}`);
for (const skill of skillChecks) {
  console.log(`${skill.label}: ${skill.getRuntimeItems().length}`);
}
console.log("Wrote docs/validation/early_skill_generated_bank_check.md");

if (failures.length) {
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Early skill generated bank check passed.");
