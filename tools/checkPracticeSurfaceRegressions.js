import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const checks = [
  {
    file: "src/components/StudentHomePage.jsx",
    needles: [
      "data-child-surface=\"student-home\"",
      "kg-home-doors",
      "title: STUDENT_HOME_ACTIVITY_TITLES[door.activityId]",
      "activityId: \"phonics-learning\"",
      "activityId: \"reading-library\""
    ]
  },
  {
    file: "src/copy/studentNavigationCopy.js",
    needles: [
      '"phonics-learning": "Letters"',
      '"reading-library": "Books"'
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
      'className="story-quest-position" role="status"',
      "Scene ${currentSceneNumber}"
    ]
  },
  {
    file: "src/components/learn/phonics/PhonicsLearnTab.jsx",
    needles: [
      'aria-label="Choose Learn area" data-child-choices=""',
      'aria-label="Letters"',
      '<span>Words</span>',
      "completedWordFamiliesCount",
      "progress={practiceStatuses}",
      "rounds={letterPractice}"
    ]
  },
  {
    file: "src/components/learn/games/GameArcadeHub.jsx",
    needles: [
      "lg-simple-arcade",
      'aria-label="All available games" data-child-choices=""',
      'games: allGames.filter(game => (game.surfaces || []).includes("arcade"))',
      'games: allGames.filter(game => !(game.surfaces || []).includes("arcade"))',
      "group.games.map(gameTile)",
      "My progress",
      "record.highScore",
      "Game settings"
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
