import path from "node:path";

import { initialSoundWordBank } from "../src/content/initialSounds/initialSoundWordBank.js";
import { hasImportedInitialSoundImage } from "../src/content/initialSounds/initialSoundMediaManifest.js";
import {
  normalizeWord,
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
    minimum: 100,
    getItems: () => selectableRuntimeQuestionsForSkill("final_sounds")
  },
  {
    id: "cvc_short_vowels",
    label: "CVC Short Vowels",
    minimum: 100,
    getItems: () => selectableRuntimeQuestionsForSkill("cvc_short_vowels")
  },
  {
    id: "rhyming",
    label: "Rhyming Words",
    minimum: 100,
    getItems: () => selectableRuntimeQuestionsForSkill("rhyming")
  }
];

function getItemWord(item) {
  return normalizeWord(item.targetWord || item.answer || item.correctAnswer || item.id || "");
}

function getItemPattern(item) {
  return item.letter || item.itemKey || item.targetSound || item.phonicsPattern || item.rhymeGroup || item.rime || getItemWord(item);
}

function simulateRepeatedRounds(items, roundCount = 4) {
  const usedIds = new Set();
  const usedWords = new Set();
  const rounds = [];

  for (let roundIndex = 0; roundIndex < roundCount; roundIndex += 1) {
    const unusedWordPool = items.filter(item =>
      !usedIds.has(item.id) &&
      !usedWords.has(getItemWord(item))
    );
    const unusedQuestionPool = items.filter(item => !usedIds.has(item.id));
    const primaryPool = unusedWordPool.length >= 15 ? unusedWordPool : unusedQuestionPool;
    const fallbackPool = primaryPool.length >= 15 ? primaryPool : items;
    const selected = [];
    const roundWords = new Set();
    const roundPatterns = new Set();

    for (const item of fallbackPool) {
      const word = getItemWord(item);
      const pattern = getItemPattern(item);
      if (word && roundWords.has(word)) continue;
      if (pattern && roundPatterns.has(pattern) && selected.length < 12) continue;
      selected.push(item);
      if (word) roundWords.add(word);
      if (pattern) roundPatterns.add(pattern);
      if (selected.length === 15) break;
    }

    if (selected.length < 15) {
      for (const item of fallbackPool) {
        if (selected.includes(item)) continue;
        const word = getItemWord(item);
        if (word && roundWords.has(word)) continue;
        selected.push(item);
        if (word) roundWords.add(word);
        if (selected.length === 15) break;
      }
    }

    if (selected.length < 15) {
      for (const item of fallbackPool) {
        if (selected.includes(item)) continue;
        selected.push(item);
        if (selected.length === 15) break;
      }
    }

    const uniqueAvailableWords = new Set(fallbackPool.map(getItemWord).filter(Boolean)).size;
    selected.forEach(item => {
      if (item.id) usedIds.add(item.id);
      const word = getItemWord(item);
      if (word) usedWords.add(word);
    });
    rounds.push({
      selected,
      uniqueAvailableWords
    });
  }

  return rounds;
}

const failures = [];
const rows = coreSkills.map(skill => {
  const items = skill.getItems();
  const sample = sampleRound(items, 15);
  const repeatedRounds = simulateRepeatedRounds(items, 4);
  if (items.length < skill.minimum) {
    failures.push(`${skill.label} has ${items.length} runtime-selectable items; expected at least ${skill.minimum}.`);
  }
  if (items.length >= 15 && sample.length < 15) {
    failures.push(`${skill.label} has enough content but sample round returned ${sample.length}/15.`);
  }
  repeatedRounds.forEach((roundInfo, index) => {
    const round = roundInfo.selected;
    if (items.length >= 15 && round.length < 15) {
      failures.push(`${skill.label} simulated repeated round ${index + 1} returned ${round.length}/15.`);
    }
    const duplicateWords = round
      .map(getItemWord)
      .filter(Boolean)
      .filter((word, wordIndex, list) => list.indexOf(word) !== wordIndex);
    if (duplicateWords.length && roundInfo.uniqueAvailableWords >= 15) {
      failures.push(`${skill.label} simulated repeated round ${index + 1} repeated target words: ${[...new Set(duplicateWords)].join(", ")}.`);
    }
  });
  return {
    ...skill,
    count: items.length,
    sample,
    repeatedRounds
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
    "",
    "Repeated round simulation:",
    "",
    ...row.repeatedRounds.map((roundInfo, index) =>
      `- Round ${index + 1}: ${roundInfo.selected.map(getItemWord).join(", ")}`
    ),
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
