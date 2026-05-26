import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildInitialSoundsProgressFromAnswerHistory,
  getInitialSoundRoundPlan
} from "../src/content/initialSounds/initialSoundSelector.js";
import {
  INITIAL_SOUND_LETTERS,
  initialSoundWordBank
} from "../src/content/initialSounds/initialSoundWordBank.js";
import {
  getInitialSoundMediaEligibility,
  isInitialSoundRuntimeEligible
} from "../src/content/initialSounds/initialSoundMediaEligibility.js";
import {
  hasImportedInitialSoundAudio,
  hasImportedInitialSoundImage
} from "../src/content/initialSounds/initialSoundMediaManifest.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const failures = [];

function existsPublic(publicPath = "") {
  return Boolean(publicPath && fs.existsSync(path.join(rootDir, "public", publicPath.replace(/^\//, ""))));
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

const uItems = initialSoundWordBank
  .filter(item => item.letter === "u")
  .map(item => ({
    id: item.id,
    level: item.level,
    targetWord: item.targetWord,
    imageUrl: item.imageUrl,
    audioUrl: item.audioUrl,
    active: item.active !== false,
    qaStatus: item.qaStatus,
    imageExists: existsPublic(item.imageUrl),
    audioExists: existsPublic(item.audioUrl),
    importedImage: hasImportedInitialSoundImage(item),
    importedAudio: hasImportedInitialSoundAudio(item),
    runtimeEligible: isInitialSoundRuntimeEligible(item),
    reasons: getInitialSoundMediaEligibility(item).reasons
  }));

const requiredWords = ["up", "umbrella"];
for (const word of requiredWords) {
  const item = uItems.find(row => row.targetWord === word);
  if (!item) failures.push(`Missing Initial Sounds u word-bank item: ${word}.`);
  else if (!item.runtimeEligible) failures.push(`${word} exists but is not runtime-selectable: ${item.reasons.join("; ")}`);
}

const allButUHistory = INITIAL_SOUND_LETTERS
  .filter(letter => letter !== "u")
  .map(letter => ({
    skillId: "initial_sounds",
    stage: "Initial Sounds",
    skill: "Initial Sounds",
    itemKey: letter,
    itemLevel: 1,
    targetWord: `review-${letter}`,
    diagnosticTarget: `review-${letter}`,
    isCorrect: true
  }));

const progress = buildInitialSoundsProgressFromAnswerHistory(allButUHistory);
const uPriorityPlan = getInitialSoundRoundPlan({
  studentProgress: { initialSoundsProgress: progress },
  level: 1,
  seed: 260526
});

if (!uPriorityPlan.meta.selectedLetters.includes("u")) {
  failures.push("When u is the only uncovered Level 1 letter, the selector did not prioritize u.");
}

const selectedRuntimePaths = [1, 2].flatMap(level =>
  getInitialSoundRoundPlan({ level, seed: 260526 + level }).items.map(item => ({
    level,
    letter: item.letter,
    targetWord: item.targetWord,
    imageUrl: item.imageUrl,
    qaStatus: item.qaStatus,
    runtimeEligible: isInitialSoundRuntimeEligible(item),
    reasons: getInitialSoundMediaEligibility(item).reasons
  }))
);

const badSelected = selectedRuntimePaths.filter(row =>
  !row.runtimeEligible ||
  /rainbow|spark|glow|aura|psychedelic|zinnia|zannia|zoo-gate|zesty-lemon|zeppelin/i.test(`${row.imageUrl} ${row.targetWord} ${row.qaStatus}`)
);

if (badSelected.length) {
  failures.push(`${badSelected.length} Initial Sounds selected path(s) are blocked or suspicious.`);
}

const blockedInitialSoundRows = initialSoundWordBank
  .filter(item => !isInitialSoundRuntimeEligible(item))
  .map(item => ({
    id: item.id,
    level: item.level,
    letter: item.letter,
    targetWord: item.targetWord,
    imageUrl: item.imageUrl,
    audioUrl: item.audioUrl,
    qaStatus: item.qaStatus,
    reasons: getInitialSoundMediaEligibility(item).reasons
  }));

const table = rows => rows.length
  ? [
      "| Level | Letter | Word | Image | Audio | QA | Runtime | Reason |",
      "|---:|---|---|---|---|---|---|---|",
      ...rows.map(row =>
        `| ${row.level} | ${row.letter || "u"} | ${row.targetWord} | ${row.imageUrl} | ${row.audioUrl || ""} | ${row.qaStatus || ""} | ${row.runtimeEligible ? "yes" : "no"} | ${(row.reasons || []).join("; ").replace(/\|/g, "/") || ""} |`
      )
    ].join("\n")
  : "_None._";

write(
  path.join(rootDir, "docs", "validation", "initial_sounds_media_regression_audit.md"),
  `# Initial Sounds Media Regression Audit

Date: 2026-05-26

## Summary

- Failures: ${failures.length}
- \`up\` runtime-selectable: ${uItems.find(item => item.targetWord === "up")?.runtimeEligible ? "yes" : "no"}
- \`umbrella\` runtime-selectable: ${uItems.find(item => item.targetWord === "umbrella")?.runtimeEligible ? "yes" : "no"}
- Selector picks \`u\` when it is the only missing Level 1 letter: ${uPriorityPlan.meta.selectedLetters.includes("u") ? "yes" : "no"}

## U Coverage

${table(uItems)}

## Sample Runtime-Selected Initial Sounds Paths

${table(selectedRuntimePaths)}

## Remaining Blocked Initial Sounds Media

${table(blockedInitialSoundRows)}

## Failures

${failures.length ? failures.map(failure => `- ${failure}`).join("\n") : "- none"}
`
);

console.log(`Initial Sounds u coverage: ${uItems.filter(item => item.runtimeEligible).length}/${uItems.length} u items runtime-selectable.`);
console.log(`up selectable: ${uItems.find(item => item.targetWord === "up")?.runtimeEligible ? "yes" : "no"}`);
console.log(`umbrella selectable: ${uItems.find(item => item.targetWord === "umbrella")?.runtimeEligible ? "yes" : "no"}`);
console.log(`u selected when only missing: ${uPriorityPlan.meta.selectedLetters.includes("u") ? "yes" : "no"}`);

if (failures.length) {
  console.error(`Initial Sounds media regression check failed: ${failures.length}`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Initial Sounds media regression check passed.");
