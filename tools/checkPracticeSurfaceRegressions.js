import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const checks = [
  {
    file: "src/components/StudentHomePage.jsx",
    needles: [
      "data-child-surface=\"student-home\"",
      "kg-home-doors",
      "title: \"Letters\"",
      "title: \"Books\""
    ]
  },
  {
    file: "src/components/LearnAreaPage.jsx",
    needles: [
      "story-quest-continue-strip",
      "learn-story-level-selector",
      "data-child-surface=\"story-quests\""
    ]
  },
  {
    file: "src/components/StoryQuestPlayer.jsx",
    needles: [
      "Back to Story Quests",
      "Full screen",
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
      "readerCopy.backToLibrary",
      "readerCopy.fullScreen"
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
