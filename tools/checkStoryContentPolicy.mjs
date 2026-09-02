#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { getRuntimeGuidedReadingBooks } from "../src/utils/guidedReading/runtimeBooks.js";
import { getGuidedReadingPageAudioPath } from "../src/utils/guidedReading/readAloudPolicy.js";
import { storyQuests } from "../src/data/storyQuests.js";
import { getStoryQuestLedaAudioPath } from "../src/data/storyQuestLedaAudio.js";
import { buildGuidedReadingAudioInventory } from "./guidedReadingAudioPipelineLib.mjs";
import {
  STORY_CONTENT_APPROVAL_RULE,
  STORY_CONTENT_FORMATS,
  STORY_CONTENT_POLICY_VERSION,
  STORY_CONTENT_REVIEW_STATUSES,
  STORY_CONTENT_SCORE_CATEGORIES
} from "../src/content/storyContentPolicy.js";
import {
  guidedReadingPolicyBaseline,
  storyQuestPolicyReviews
} from "../src/content/storyContentReviews.js";

const releaseMode = process.argv.includes("--release");
const errors = [];
const releaseBlocks = [];
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map(key => [key, stableValue(value[key])])
  );
}

function fingerprint(value) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex");
}

function guidedReadingFingerprint() {
  return fingerprint(
    getRuntimeGuidedReadingBooks().map(book => ({
      id: book.id,
      title: book.title,
      level: book.level,
      category: book.category || null,
      seriesId: book.seriesId || null,
      pages: (book.pages || []).map(page => ({
        pageNumber: page.pageNumber,
        text: page.text || page.content || null,
        image: page.image || null,
        audio: getGuidedReadingPageAudioPath(page) || null
      }))
    }))
  );
}

function storyQuestFingerprint(quest) {
  return fingerprint({
    id: quest.id,
    title: quest.title,
    level: quest.level,
    series: quest.series,
    pages: quest.pages.map(page => ({
      id: page.id,
      text: page.text,
      choicePrompt: page.choicePrompt,
      choices: page.choices,
      imageUrl: page.imageUrl,
      audioUrl: page.audioUrl,
      narrationNeedsRebuild: page.narrationNeedsRebuild
    }))
  });
}

function addError(message) {
  errors.push(message);
}

function requireNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    addError(`${label} must be a non-empty string`);
  }
}

function readablePageText(page = {}) {
  return Array.isArray(page.text) ? page.text.join(" ") : String(page.text || "");
}

function readingWords(value = "") {
  return String(value).match(/[A-Za-z0-9]+(?:[’'-][A-Za-z0-9]+)*/g) || [];
}

function publicFile(publicPath = "") {
  const cleanPath = String(publicPath).split("?")[0].replace(/^\/+/, "");
  return path.join(repositoryRoot, "public", cleanPath);
}

function hasNonEmptyPublicFile(publicPath = "") {
  if (!publicPath) return false;
  try {
    return fs.statSync(publicFile(publicPath)).size > 0;
  } catch {
    return false;
  }
}

function countFiniteRoutes(quest) {
  const pagesById = new Map(quest.pages.map(page => [page.id, page]));
  const memo = new Map();
  function walk(pageId, active) {
    if (pageId === "end") return 1;
    if (memo.has(pageId)) return memo.get(pageId);
    if (active.has(pageId)) return 0;
    const page = pagesById.get(pageId);
    if (!page) return 0;
    active.add(pageId);
    const count = (page.choices || []).reduce((sum, choice) => {
      const isReplay =
        choice.nextPageId === quest.startPageId &&
        String(choice.label).trim().toLowerCase() === "read again";
      return sum + (isReplay ? 0 : walk(choice.nextPageId, active));
    }, 0);
    active.delete(pageId);
    memo.set(pageId, count);
    return count;
  }
  return walk(quest.startPageId, new Set());
}

if (!STORY_CONTENT_FORMATS.includes(guidedReadingPolicyBaseline.format)) {
  addError(`guided-reading baseline uses unknown format "${guidedReadingPolicyBaseline.format}"`);
}

if (guidedReadingPolicyBaseline.policyVersion !== STORY_CONTENT_POLICY_VERSION) {
  addError("guided-reading baseline policyVersion does not match the active story policy");
}

const activeBooks = getRuntimeGuidedReadingBooks();
for (const book of activeBooks) {
  const label = `${book.id} (${book.title})`;
  if (!new Set(["standard", "extended"]).has(book.readingBandProfile)) {
    addError(`${label}: unknown readingBandProfile "${book.readingBandProfile || "missing"}"`);
    continue;
  }
  if (book.readingBandProfile === "extended") {
    for (const page of book.pages || []) {
      const count = readingWords(readablePageText(page)).length;
      if (count < 22 || count > 38) addError(`${label}: extended page ${page.pageNumber} has ${count} words; expected 22-38`);
    }
  }
  if (book.readingBandProfile === "standard" && book.readingPageProfile === "compact-stable") {
    if (book.pages?.length !== 8) addError(`${label}: compact standard books require exactly 8 pages`);
    for (const page of book.pages || []) {
      const count = readingWords(readablePageText(page)).length;
      if (count < 6 || count > 12) addError(`${label}: compact standard page ${page.pageNumber} has ${count} words; expected 6-12`);
    }
  }
}
if (activeBooks.length !== guidedReadingPolicyBaseline.itemCount) {
  addError(
    `guided-reading catalogue changed from ${guidedReadingPolicyBaseline.itemCount} to ${activeBooks.length} books; ` +
    "add or update item review records before accepting the change"
  );
}

const currentGuidedFingerprint = guidedReadingFingerprint();
if (currentGuidedFingerprint !== guidedReadingPolicyBaseline.sourceFingerprint) {
  addError(
    "guided-reading catalogue fingerprint changed; narrative text, media, level or membership changed without a policy-baseline update "
    + `(expected ${guidedReadingPolicyBaseline.sourceFingerprint}; current ${currentGuidedFingerprint})`
  );
}

const guidedAudioInventory = buildGuidedReadingAudioInventory(activeBooks, repositoryRoot);
const unflaggedGuidedPagesWithoutExactAudio = guidedAudioInventory.pages.filter(
  page => !page.narrationNeedsRebuild && !page.exactLedaAudioResolves
);
if (unflaggedGuidedPagesWithoutExactAudio.length) {
  addError(
    `${unflaggedGuidedPagesWithoutExactAudio.length} guided-reading pages can expose stale or missing narration because exact-current-text audio is unavailable but narrationNeedsRebuild is not set`
  );
}

if (guidedReadingPolicyBaseline.status !== "approved") {
  releaseBlocks.push(
    `guided-reading catalogue: manuscript and illustration review is complete for ${activeBooks.length} books; exact-current-text Leda audio resolves, but human listening validation remains open`
  );
}

const reviewById = new Map();
for (const review of storyQuestPolicyReviews) {
  if (reviewById.has(review.id)) {
    addError(`duplicate Story Quest policy review for ${review.id}`);
    continue;
  }
  reviewById.set(review.id, review);
}

const currentQuestIds = new Set(storyQuests.map(quest => quest.id));
const registeredQuestIds = new Set(storyQuestPolicyReviews.map(review => review.id));

for (const quest of storyQuests) {
  if (!registeredQuestIds.has(quest.id)) {
    addError(`${quest.id} is active but has no Story Content Policy review record`);
  }
}

for (const review of storyQuestPolicyReviews) {
  if (!currentQuestIds.has(review.id)) {
    addError(`${review.id} has a review record but is not an active Story Quest`);
  }
}

const expectedScoreIds = STORY_CONTENT_SCORE_CATEGORIES.map(category => category.id);
for (const quest of storyQuests) {
  const review = reviewById.get(quest.id);
  if (!review) continue;

  if (!STORY_CONTENT_REVIEW_STATUSES.includes(review.status)) {
    addError(`${quest.id}: unknown status "${review.status}"`);
  }
  requireNonEmptyString(review.reviewer, `${quest.id}.reviewer`);
  requireNonEmptyString(review.reviewedAt, `${quest.id}.reviewedAt`);
  requireNonEmptyString(review.summary, `${quest.id}.summary`);
  requireNonEmptyString(review.targetGoal, `${quest.id}.targetGoal`);

  if (!Array.isArray(review.rewriteActions) || review.rewriteActions.length < 1) {
    addError(`${quest.id}.rewriteActions must contain at least one concrete action`);
  }
  if (!Array.isArray(review.illustrationActions) || review.illustrationActions.length < 1) {
    addError(`${quest.id}.illustrationActions must contain at least one concrete action`);
  }
  if (!Array.isArray(review.mandatoryViolations)) {
    addError(`${quest.id}.mandatoryViolations must be an array`);
  }

  const scoreIds = Object.keys(review.scores || {}).sort();
  if (scoreIds.join("|") !== [...expectedScoreIds].sort().join("|")) {
    addError(`${quest.id}: score categories do not exactly match the active policy`);
  }

  for (const categoryId of expectedScoreIds) {
    const score = review.scores?.[categoryId];
    if (!Number.isInteger(score) || score < 0 || score > 4) {
      addError(`${quest.id}: ${categoryId} score must be an integer from 0 to 4`);
    }
  }

  const currentFingerprint = storyQuestFingerprint(quest);
  if (currentFingerprint !== review.sourceFingerprint) {
    addError(
      `${quest.id}: source fingerprint changed to ${currentFingerprint}; ` +
      "update the manuscript review and evidence before accepting the change"
    );
  }

  const total = expectedScoreIds.reduce(
    (sum, categoryId) => sum + Number(review.scores?.[categoryId] || 0),
    0
  );
  const lowest = Math.min(...expectedScoreIds.map(categoryId => review.scores?.[categoryId] ?? -1));
  const hasViolations = (review.mandatoryViolations || []).length > 0;
  const numericallyEligible =
    total >= STORY_CONTENT_APPROVAL_RULE.minimumTotalScore &&
    lowest >= STORY_CONTENT_APPROVAL_RULE.minimumScorePerCategory;

  if (review.status === "approved") {
    if (!numericallyEligible) {
      addError(
        `${quest.id}: claims approved with total ${total} and lowest score ${lowest}; ` +
        `minimums are ${STORY_CONTENT_APPROVAL_RULE.minimumTotalScore} and ` +
        STORY_CONTENT_APPROVAL_RULE.minimumScorePerCategory
      );
    }
    if (hasViolations) {
      addError(`${quest.id}: claims approved while mandatory violations remain open`);
    }

    const completeRoutes = countFiniteRoutes(quest);
    if (review.routeEvidence?.completeRoutes !== completeRoutes || completeRoutes < 1) {
      addError(
        `${quest.id}: approved route evidence must record all ${completeRoutes} finite graph routes`
      );
    }
    if (review.pageEvidence?.pages !== quest.pages.length) {
      addError(`${quest.id}: approved page evidence must cover all ${quest.pages.length} pages`);
    }

    for (const page of quest.pages) {
      if (!hasNonEmptyPublicFile(page.imageUrl)) {
        addError(`${quest.id}/${page.id}: approved page image is missing or empty`);
      }
      if (page.narrationNeedsRebuild) {
        addError(`${quest.id}/${page.id}: approved page still requires narration rebuild`);
      }
      const narrationPath = getStoryQuestLedaAudioPath(readablePageText(page));
      if (!hasNonEmptyPublicFile(narrationPath)) {
        addError(`${quest.id}/${page.id}: approved exact-text Leda narration is missing or empty`);
      }
    }
  } else {
    releaseBlocks.push(`${quest.id}: ${review.status}`);
  }
}

console.log(`Story Content Policy ${STORY_CONTENT_POLICY_VERSION}`);
console.log(`Registered active content: ${activeBooks.length} guided-reading books; ${storyQuests.length} Story Quests.`);
console.log(
  `Story Quest verdicts: ${storyQuestPolicyReviews.filter(review => review.status === "approved").length} approved; ` +
  `${storyQuestPolicyReviews.filter(review => review.status !== "approved").length} not approved.`
);

if (errors.length > 0) {
  console.error(`\nStory Content Policy contract FAILED (${errors.length} problems):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Policy registration, evidence shape and source fingerprints passed.");

if (releaseMode && releaseBlocks.length > 0) {
  console.error(`\nStory Content release approval FAILED (${releaseBlocks.length} blocks):`);
  for (const block of releaseBlocks) console.error(`- ${block}`);
  process.exit(1);
}

if (releaseMode) {
  console.log("All registered narrative content is approved for release.");
} else if (releaseBlocks.length > 0) {
  console.log(
    `Release approval remains blocked for ${releaseBlocks.length} registered content groups or items. ` +
    "Run with --release to enforce the publication verdict."
  );
}
