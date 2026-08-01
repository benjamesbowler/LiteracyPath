#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getRuntimeGuidedReadingBooks } from "../src/utils/guidedReading/runtimeBooks.js";
import { getGuidedReadingPageAudioPath } from "../src/utils/guidedReading/readAloudPolicy.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

const LEVEL_RULES = Object.freeze({
  A: Object.freeze({ maximumWords: 6, maximumLines: 1, minimumScenes: 5, maximumScenes: 10 }),
  B: Object.freeze({ maximumWords: 14, maximumLines: 2, minimumScenes: 6, maximumScenes: 12 }),
  C: Object.freeze({ maximumWords: 22, maximumLines: 3, minimumScenes: 8, maximumScenes: 14 })
});

const CANON_PREFIX_BY_SERIES = Object.freeze({
  "bob-and-nan": "HUMAN-",
  "james-and-anna": "HUMAN-",
  "aiden-and-betty": "HUMAN-",
  "meadow-pals": "MEADOW-",
  "dino-pals": "DINO-",
  "moonwood-tales": "MOON-"
});

function words(text = "") {
  return String(text).match(/[A-Za-z0-9]+(?:[’'-][A-Za-z0-9]+)*/g) || [];
}

function lines(text = "") {
  return String(text).split(/\n+/).map(line => line.trim()).filter(Boolean);
}

function publicFile(publicPath = "") {
  return path.join(repositoryRoot, "public", String(publicPath).split("?")[0].replace(/^\/+/, ""));
}

function nonEmptyFile(publicPath = "") {
  if (!publicPath) return false;
  try {
    return fs.statSync(publicFile(publicPath)).size > 0;
  } catch {
    return false;
  }
}

function requireText(value, label) {
  if (typeof value !== "string" || !value.trim()) failures.push(`${label} is missing`);
}

const books = getRuntimeGuidedReadingBooks();
let pageCount = 0;
let exactAudioCount = 0;
let reviewedBookCount = 0;

for (const book of books) {
  const label = `${book.id} (${book.title})`;
  const review = book.storyBibleReview;
  const levelRule = LEVEL_RULES[book.level];
  if (!levelRule) {
    failures.push(`${label}: unsupported Story Bible level ${book.level || "missing"}`);
    continue;
  }

  if (!review) {
    failures.push(`${label}: no Story Bible review/manuscript record`);
  } else {
    reviewedBookCount += 1;
    if (review.kind === "fiction") {
      requireText(review.storySpine, `${label}: fiction story spine`);
      requireText(review.failedAttempt, `${label}: genuine failed attempt`);
      requireText(review.resolution, `${label}: earned resolution`);
      if (!Array.isArray(review.canonIds) || !review.canonIds.length) {
        failures.push(`${label}: fiction review has no explicit canon character IDs`);
      } else {
        const requiredPrefix = CANON_PREFIX_BY_SERIES[book.seriesId];
        if (requiredPrefix) {
          for (const canonId of review.canonIds) {
            if (!String(canonId).startsWith(requiredPrefix)) {
              failures.push(`${label}: canon ID ${canonId} does not belong to ${book.seriesId}`);
            }
          }
        }
      }
    } else if (review.kind === "nonfiction") {
      requireText(review.topicQuestion, `${label}: nonfiction topic question`);
      requireText(review.progression, `${label}: nonfiction concept progression`);
      requireText(review.synthesis, `${label}: nonfiction synthesis`);
    } else {
      failures.push(`${label}: review kind must be fiction or nonfiction`);
    }
  }

  if (!Array.isArray(book.pages)
    || book.pages.length < levelRule.minimumScenes
    || book.pages.length > levelRule.maximumScenes) {
    failures.push(
      `${label}: ${book.pages?.length || 0} scenes is outside Level ${book.level} range `
      + `${levelRule.minimumScenes}-${levelRule.maximumScenes}`
    );
    continue;
  }

  for (const [index, page] of book.pages.entries()) {
    pageCount += 1;
    const pageLabel = `${book.id}/page-${String(page.pageNumber || index + 1).padStart(3, "0")}`;
    const text = Array.isArray(page.text) ? page.text.join(" ") : String(page.text || "").trim();
    const wordCount = words(text).length;
    const lineCount = lines(page.text).length;

    if (!text) failures.push(`${pageLabel}: missing visible reading text`);
    if (wordCount > levelRule.maximumWords) {
      failures.push(`${pageLabel}: ${wordCount} words exceeds Level ${book.level} maximum ${levelRule.maximumWords}`);
    }
    if (lineCount > levelRule.maximumLines) {
      failures.push(`${pageLabel}: ${lineCount} lines exceeds Level ${book.level} maximum ${levelRule.maximumLines}`);
    }
    if (book.level === "A" && /["“”,:;—]/.test(text)) {
      failures.push(`${pageLabel}: Level A text contains dialogue or complex internal punctuation`);
    }
    if (page.pageAudioText && String(page.pageAudioText).trim() !== text) {
      failures.push(`${pageLabel}: pageAudioText differs from visible text`);
    }
    if (!nonEmptyFile(page.image || page.imageUrl || page.pageImage)) {
      failures.push(`${pageLabel}: page image is missing or empty`);
    }

    const audioPath = getGuidedReadingPageAudioPath(page);
    if (!nonEmptyFile(audioPath)) {
      failures.push(`${pageLabel}: exact-text Leda narration is missing`);
    } else {
      exactAudioCount += 1;
    }
    if (page.narrationNeedsRebuild) {
      failures.push(`${pageLabel}: narrationNeedsRebuild remains open`);
    }
  }
}

console.log(`Guided Reading Story Bible audit`);
console.log(`Books: ${books.length}; reviewed: ${reviewedBookCount}; pages: ${pageCount}; exact Leda pages: ${exactAudioCount}.`);
console.log(`Failures: ${failures.length}. Visual alignment is enforced by the separate hash-locked page audit.`);

if (failures.length) {
  console.error("\nGuided Reading Story Bible gate FAILED:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("All Guided Reading books pass the Story Bible manuscript, level, image and exact-audio gate.");
