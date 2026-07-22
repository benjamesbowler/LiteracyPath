import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const checks = [
  {
    file: "src/components/StudentHomePage.jsx",
    needles: [
      "Phonics Learning",
      "Reading Library",
      "hs-chips"
    ]
  },
  {
    file: "src/components/LearnAreaPage.jsx",
    needles: [
      "story-quest-library-stats",
      "story-quest-continue-strip",
      "words found"
    ]
  },
  {
    file: "src/components/StoryQuestPlayer.jsx",
    needles: [
      "Back to Quests",
      "Full Screen",
      "story-quest-progress-top"
    ]
  },
  {
    file: "src/components/learn/phonics/PhonicsLearnTab.jsx",
    needles: [
      "phonics-practice-overview",
      "phonics-practice-stats",
      "Letters, Sounds, Words"
    ]
  },
  {
    file: "src/components/learn/games/GameArcadeHub.jsx",
    needles: [
      "lg-arcade-tab",
      "Arcade Area",
      "Phonics Practice",
      "High Scores"
    ]
  },
  {
    file: "src/components/guided-reading/GuidedReadingPage.jsx",
    needles: [
      "student-guided-reading-page",
      "guided-reading-mode-pill",
      "Back to Library"
    ]
  }
];

const failures = [];

for (const check of checks) {
  const source = readFileSync(resolve(ROOT, check.file), "utf8");
  for (const needle of check.needles) {
    if (!source.includes(needle)) {
      failures.push(`${check.file} is missing "${needle}"`);
    }
  }
}

if (failures.length) {
  console.error("Practice surface regression check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Practice surface regression check passed.");
