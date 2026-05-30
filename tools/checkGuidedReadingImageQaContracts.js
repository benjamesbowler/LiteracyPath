#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";
import { elSkillsBlockCycles } from "../src/data/elSkillsBlockCycles.js";

const failures = [];
const bookIds = new Set(guidedReadingBooks.map(book => book.id));

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function exists(path) {
  return existsSync(new URL(`../${path}`, import.meta.url));
}

function includes(source, needle, message) {
  if (!source.includes(needle)) failures.push(message);
}

const learnSource = read("src/components/LearnAreaPage.jsx");
const dataSource = read("src/data/elSkillsBlockCycles.js");
const adminSource = read("src/components/AdminDashboardPage.jsx");

elSkillsBlockCycles.forEach(cycle => {
  if (!cycle.guidedReadingRecommendations) {
    failures.push(`${cycle.id} is missing guidedReadingRecommendations.`);
    return;
  }
  ["fiction", "nonfiction"].forEach(kind => {
    const recommendation = cycle.guidedReadingRecommendations[kind];
    if (!recommendation) return;
    if (!recommendation.bookId) failures.push(`${cycle.id} ${kind} recommendation is missing bookId.`);
    if (recommendation.bookId && !bookIds.has(recommendation.bookId)) {
      failures.push(`${cycle.id} ${kind} recommendation uses unknown bookId: ${recommendation.bookId}.`);
    }
    if (!recommendation.reason) failures.push(`${cycle.id} ${kind} recommendation is missing reason.`);
    if (!Array.isArray(recommendation.skillConnections)) {
      failures.push(`${cycle.id} ${kind} recommendation is missing skillConnections array.`);
    }
    if (!Array.isArray(recommendation.hfwConnections)) {
      failures.push(`${cycle.id} ${kind} recommendation is missing hfwConnections array.`);
    }
    if (!Array.isArray(recommendation.patternConnections)) {
      failures.push(`${cycle.id} ${kind} recommendation is missing patternConnections array.`);
    }
  });
});

[
  "GUIDED_READING_FICTION_SEQUENCE",
  "GUIDED_READING_NONFICTION_SEQUENCE",
  "guidedReadingRecommendations",
  "fiction",
  "nonfiction",
  "No strong match yet. Needs future guided-reading book."
].forEach(needle => includes(dataSource, needle, `Cycle data is missing Guided Reading recommendation contract: ${needle}.`));

[
  "Guided Reading This Week",
  "Read This Week",
  "learn-guided-reading-week",
  "learn-guided-book-card",
  "Fiction Book",
  "Non-Fiction Book",
  "Open Book",
  "onOpenGuidedReadingBook"
].forEach(needle => includes(learnSource, needle, `LearnAreaPage is missing Guided Reading recommendation UI: ${needle}.`));

[
  "tools/auditGuidedReadingImageTextArtifacts.js",
  "docs/guided-reading/guided_reading_image_text_artifact_audit.md",
  "docs/guided-reading/guided_reading_image_text_artifact_audit.json",
  "docs/guided-reading/image_text_artifact_contact_sheet.md",
  "docs/guided-reading/contact-sheets/image_text_artifact_contact_sheet.md",
  "docs/guided-reading/manual_image_text_artifact_review.md",
  "docs/guided-reading/manual_image_text_artifact_review_status.json",
  "docs/assets/kimi_guided_reading_image_replacement_request.md",
  "docs/guided-reading/guided_reading_word_audio_inventory.md",
  "docs/assets/kimi_guided_reading_missing_word_audio_request.md",
  "src/content/guidedReading/imageTextArtifactSummary.generated.json",
  "src/content/guidedReading/wordAudioCoverageSummary.generated.json"
].forEach(path => {
  if (!exists(path)) failures.push(`${path} is missing. Run the Guided Reading image artifact audit.`);
});

[
  "Guided Reading Media QA",
  "guidedMediaQa",
  "guidedReadingImageTextQa",
  "guidedReadingWordAudioCoverage",
  "!isTeacherMode && activeSection === \"guidedMediaQa\"",
  "uniqueWordsMissingAudio",
  "needsManualReviewCount",
  "needsReplacementCount"
].forEach(needle => includes(adminSource, needle, `Admin Dashboard is missing admin-only Guided Reading media QA visibility: ${needle}.`));

if (exists("docs/guided-reading/guided_reading_image_text_artifact_audit.json")) {
  const audit = JSON.parse(read("docs/guided-reading/guided_reading_image_text_artifact_audit.json"));
  const blockedBookIds = new Set((audit.items || [])
    .filter(item => ["NEEDS_REPLACEMENT", "BROKEN_REFERENCE"].includes(item.status))
    .map(item => item.bookId));
  const recommendedBlocked = [];
  elSkillsBlockCycles.forEach(cycle => {
    ["fiction", "nonfiction"].forEach(kind => {
      const recommendation = cycle.guidedReadingRecommendations?.[kind];
      if (recommendation?.bookId && blockedBookIds.has(recommendation.bookId) && !recommendation.allowRecommendationDespiteImageQa) {
        recommendedBlocked.push(`${cycle.id}:${kind}:${recommendation.bookId}`);
      }
    });
  });
  if (recommendedBlocked.length) {
    failures.push(`Recommendations include books with blocking image QA issues: ${recommendedBlocked.join(", ")}.`);
  }
}

if (/img\s+[^>]*src=["']https?:\/\//.test(learnSource)) {
  failures.push("Learn Guided Reading recommendation cards should not hotlink external images.");
}

if (failures.length) {
  console.error("Guided Reading image QA contract failures:");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Guided Reading image QA contracts passed.");
console.log(`Cycle recommendations checked: ${elSkillsBlockCycles.length}`);
