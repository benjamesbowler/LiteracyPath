#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { EL_LEARN_SECTION_IDS, elSkillsBlockCycles } from "../src/data/elSkillsBlockCycles.js";

const failures = [];

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function requireFile(path) {
  if (!existsSync(new URL(`../${path}`, import.meta.url))) {
    failures.push(`${path} is missing.`);
    return "";
  }
  return read(path);
}

function includes(source, needle, message) {
  if (!source.includes(needle)) failures.push(message);
}

const dataSource = requireFile("src/data/elSkillsBlockCycles.js");
const learnSource = requireFile("src/components/LearnAreaPage.jsx");
const appSource = requireFile("src/App.jsx");
const appPagesSource = requireFile("src/components/AppPages.jsx");
const cssSource = requireFile("src/App.css");

includes(appSource, 'appView === "learn"', "App.jsx does not render the learn app view.");
includes(appSource, "LearnAreaPage", "App.jsx does not import/render LearnAreaPage.");
includes(appSource, 'setAppView("learn")', "App.jsx does not set appView to learn.");
includes(appPagesSource, "goToLearn", "AppPages.jsx TopNavigation is missing goToLearn.");
if (!/>\s*Learn\s*</.test(appPagesSource)) {
  failures.push("Teacher navigation is missing visible Learn text.");
}

const cycleNumbers = new Set(elSkillsBlockCycles.map(cycle => cycle.cycleNumber).filter(Boolean));
for (let cycleNumber = 1; cycleNumber <= 27; cycleNumber += 1) {
  if (!cycleNumbers.has(cycleNumber)) {
    failures.push(`Cycle ${cycleNumber} is missing from elSkillsBlockCycles.`);
  }
}

[
  "boy-assessment",
  "moy-assessment",
  "eoy-assessment",
  "celebrate-learning",
  "review-cycles-1-4",
  "review-cycles-8-10",
  "review-cycles-11-12"
].forEach(id => {
  if (!elSkillsBlockCycles.some(cycle => cycle.id === id)) {
    failures.push(`${id} entry is missing from elSkillsBlockCycles.`);
  }
});

elSkillsBlockCycles.forEach(cycle => {
  if (!Array.isArray(cycle.highFrequencyWords)) {
    failures.push(`${cycle.id} is missing a highFrequencyWords array.`);
  }
  if (!Array.isArray(cycle.phonemicAwareness) || cycle.phonemicAwareness.length === 0) {
    failures.push(`${cycle.id} is missing phonemicAwareness focus.`);
  }
  if (!cycle.sections) {
    failures.push(`${cycle.id} is missing sections.`);
    return;
  }
  EL_LEARN_SECTION_IDS.forEach(sectionId => {
    if (!cycle.sections[sectionId]) {
      failures.push(`${cycle.id} is missing section ${sectionId}.`);
    }
  });
});

const cycle1 = elSkillsBlockCycles.find(cycle => cycle.cycleNumber === 1);
const cycle15 = elSkillsBlockCycles.find(cycle => cycle.cycleNumber === 15);
const cycle23 = elSkillsBlockCycles.find(cycle => cycle.cycleNumber === 23);

if (!cycle1?.searchText.includes("aa") || !cycle1?.searchText.includes("mm")) {
  failures.push("Cycle 1 should include Aa and Mm.");
}
if (!cycle1?.highFrequencyWords.includes("am") || !cycle1?.highFrequencyWords.includes("I")) {
  failures.push("Cycle 1 should include HFW am and I.");
}
if (!cycle1?.searchText.includes("compound") || !cycle1?.searchText.includes("rhyming")) {
  failures.push("Cycle 1 should include compound word deletion and rhyming recognition.");
}
["sh", "ch", "th"].forEach(pattern => {
  if (!cycle15?.searchText.includes(pattern)) failures.push(`Cycle 15 should include ${pattern}.`);
});
["good", "look"].forEach(word => {
  if (!cycle15?.highFrequencyWords.includes(word)) failures.push(`Cycle 15 should include HFW ${word}.`);
});
["ng", "ang", "ing", "ong", "ung"].forEach(pattern => {
  if (!cycle23?.searchText.includes(pattern)) failures.push(`Cycle 23 should include ${pattern}.`);
});

[
  "EL Skills Block Learn",
  "learn-mobile-cycle-select",
  "learn-mobile-section-select",
  "learn-cycle-grid",
  "learn-cycle-groups",
  "Search cycles",
  "WorksheetGenerator",
  "worksheet-generator",
  "window.print",
  "Open Full Screen Lesson",
  "Start Learning",
  "Exit Learn Mode",
  "Previous Section",
  "Next Section",
  "learn-fullscreen-mode",
  "learn-section-cards",
  "learn-section-card",
  "learn-letter-tile",
  "learn-hfw-card",
  "learn-video-resource"
].forEach(needle => {
  includes(learnSource, needle, `LearnAreaPage is missing ${needle}.`);
});

[
  ".learn-area-page",
  ".learn-layout",
  ".learn-mobile-section-select",
  ".learn-section-cards",
  ".learn-fullscreen-mode",
  ".learn-letter-tile",
  ".learn-hfw-card",
  ".worksheet-preview",
  "@media (max-width: 760px)"
].forEach(needle => {
  includes(cssSource, needle, `App.css is missing Learn mobile/layout contract: ${needle}.`);
});

if (/img\s+[^>]*src=["']https?:\/\//.test(learnSource)) {
  failures.push("Learn area should not hotlink external images.");
}

if (/calendar|weekOf|dateRange|startDate|endDate/.test(dataSource)) {
  failures.push("Learn cycle data should not expose dates as the main navigation structure.");
}

[
  "saveAssessmentAttempt",
  "setAssessmentMode",
  "PASS_SCORE",
  "supabase"
].forEach(needle => {
  if (learnSource.includes(needle) || dataSource.includes(needle)) {
    failures.push(`Learn area should not change assessment/scoring/auth behavior (${needle}).`);
  }
});

if (failures.length) {
  console.error("Learn area contract failures:");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Learn area contracts passed.");
console.log(`Cycles represented: ${cycleNumbers.size}`);
console.log(`Total entries: ${elSkillsBlockCycles.length}`);
