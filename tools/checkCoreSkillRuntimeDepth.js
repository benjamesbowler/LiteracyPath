import path from "node:path";

import { initialSoundWordBank } from "../src/content/initialSounds/initialSoundWordBank.js";
import { hasImportedInitialSoundImage } from "../src/content/initialSounds/initialSoundMediaManifest.js";
import {
  repoRoot,
  sampleRound,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";

const coreSkills = [
  {
    id: "initial_sounds",
    label: "Initial Sounds",
    minimum: 100,
    getItems: () => initialSoundWordBank.filter(item => item.active !== false && hasImportedInitialSoundImage(item))
  },
  {
    id: "final_sounds",
    label: "Ending Sounds",
    minimum: 30,
    getItems: () => selectableRuntimeQuestionsForSkill("final_sounds")
  },
  {
    id: "cvc_short_vowels",
    label: "CVC Short Vowels",
    minimum: 30,
    getItems: () => selectableRuntimeQuestionsForSkill("cvc_short_vowels")
  },
  {
    id: "rhyming",
    label: "Rhyming Words",
    minimum: 30,
    getItems: () => selectableRuntimeQuestionsForSkill("rhyming")
  }
];

const failures = [];
const rows = coreSkills.map(skill => {
  const items = skill.getItems();
  const sample = sampleRound(items, 15);
  if (items.length < skill.minimum) {
    failures.push(`${skill.label} has ${items.length} runtime-selectable items; expected at least ${skill.minimum}.`);
  }
  if (items.length >= 15 && sample.length < 15) {
    failures.push(`${skill.label} has enough content but sample round returned ${sample.length}/15.`);
  }
  return {
    ...skill,
    count: items.length,
    sample
  };
});

const report = [
  "# Core Skill Runtime Depth Check",
  "",
  "Date: 2026-05-25",
  "",
  "| Skill | Runtime-Selectable Items | Minimum | Sample Round Size | Status |",
  "| --- | ---: | ---: | ---: | --- |",
  ...rows.map(row =>
    `| ${row.label} | ${row.count} | ${row.minimum} | ${row.sample.length} | ${row.count >= row.minimum && row.sample.length >= Math.min(15, row.count) ? "pass" : "fail"} |`
  ),
  "",
  "## Sample Rounds",
  "",
  ...rows.flatMap(row => [
    `### ${row.label}`,
    "",
    row.sample.map((item, index) =>
      `${index + 1}. ${item.targetWord || item.answer || item.correctAnswer || item.id || "(untitled)"}`
    ).join("\n") || "No sample available.",
    ""
  ]),
  "## Failures",
  "",
  failures.length ? failures.map(item => `- ${item}`).join("\n") : "- none",
  ""
];

writeFile(path.join(repoRoot, "docs/validation/core_skill_runtime_depth_check.md"), report.join("\n"));

for (const row of rows) {
  console.log(`${row.label}: ${row.count} runtime-selectable; sample ${row.sample.length}/15`);
}
console.log("Wrote docs/validation/core_skill_runtime_depth_check.md");

if (failures.length) {
  console.error(`Core skill runtime depth failed: ${failures.length}`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Core skill runtime depth check passed.");
