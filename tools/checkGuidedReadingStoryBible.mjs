#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getRuntimeGuidedReadingBooks } from "../src/utils/guidedReading/runtimeBooks.js";
import { getGuidedReadingPageAudioPath } from "../src/utils/guidedReading/readAloudPolicy.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

const helpRequested = process.argv.includes("--help") || process.argv.includes("-h");
if (helpRequested) {
  console.log("Usage: node tools/checkGuidedReadingStoryBible.mjs [--level A|B|C] [--skip-audio]");
  process.exit(0);
}

const skipAudio = process.argv.includes("--skip-audio");

const levelFlagIndex = process.argv.indexOf("--level");
const requestedLevel = levelFlagIndex === -1
  ? null
  : String(process.argv[levelFlagIndex + 1] || "").toUpperCase();
if (levelFlagIndex !== -1 && !new Set(["A", "B", "C"]).has(requestedLevel)) {
  throw new Error(`--level must be A, B or C; received ${process.argv[levelFlagIndex + 1] || "missing"}`);
}

const LEVEL_RULES = Object.freeze({
  A: Object.freeze({ maximumWords: 6, maximumLines: 1, minimumScenes: 5, maximumScenes: 10 }),
  B: Object.freeze({ maximumWords: 14, maximumLines: 2, minimumScenes: 6, maximumScenes: 12 }),
  C: Object.freeze({ maximumWords: 22, maximumLines: 3, minimumScenes: 8, maximumScenes: 14 })
});

const BAND_PROFILE_RULES = Object.freeze({
  extended: Object.freeze({
    minimumWords: 22,
    maximumWords: 38,
    maximumLines: 5,
    minimumSentences: 2,
    maximumSentences: 4,
    maximumSentenceWords: 18,
    minimumScenes: 8,
    maximumScenes: 14,
    profileLabel: "extended read-together"
  })
});

const COMPACT_STABLE_RULE = Object.freeze({
  minimumWords: 6,
  maximumWords: 12,
  minimumScenes: 8,
  maximumScenes: 8,
  profileLabel: "compact standard"
});

const CANON_PREFIX_BY_SERIES = Object.freeze({
  "bob-and-nan": "HUMAN-",
  "james-and-anna": "HUMAN-",
  "aiden-and-betty": "HUMAN-",
  "meadow-pals": "MEADOW-",
  "dino-pals": "DINO-",
  "moonwood-tales": "MOON-"
});

const LEVEL_A_FORBIDDEN_SYNTAX = /\b(?:but|so|because|while|when|if|will|might|could|would|should)\b/i;

function words(text = "") {
  return String(text).match(/[A-Za-z0-9]+(?:[’'-][A-Za-z0-9]+)*/g) || [];
}

function syllables(word = "") {
  return (String(word).toLowerCase().replace(/e$/, "").match(/[aeiouy]+/g) || [""]).length || 1;
}

function lines(text = "") {
  return String(text).split(/\n+/).map(line => line.trim()).filter(Boolean);
}

function sentences(text = "") {
  return (String(text).match(/[^.!?]+[.!?]+(?:["”']+)?|[^.!?]+$/g) || [])
    .map(sentence => sentence.trim())
    .filter(Boolean);
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

const books = getRuntimeGuidedReadingBooks()
  .filter((book) => !requestedLevel || book.level === requestedLevel);
let pageCount = 0;
let exactAudioCount = 0;
let reviewedBookCount = 0;
let scheduledMediaBookCount = 0;
let scheduledMediaPageCount = 0;

for (const book of books) {
  const label = `${book.id} (${book.title})`;
  const review = book.storyBibleReview;
  if (book.mediaStatus === "scheduled") {
    scheduledMediaBookCount += 1;
    scheduledMediaPageCount += book.pages?.length || 0;
  }
  const levelRule = book.readingPageProfile === "compact-stable"
    ? COMPACT_STABLE_RULE
    : BAND_PROFILE_RULES[book.readingBandProfile] || LEVEL_RULES[book.level];
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

  const vocabulary = new Set();

  for (const [index, page] of book.pages.entries()) {
    pageCount += 1;
    const pageLabel = `${book.id}/page-${String(page.pageNumber || index + 1).padStart(3, "0")}`;
    const text = Array.isArray(page.text) ? page.text.join(" ") : String(page.text || "").trim();
    const wordCount = words(text).length;
    const lineCount = lines(page.text).length;
    const pageSentences = sentences(text);
    for (const word of words(text)) {
      if (/[A-Za-z]/.test(word)) vocabulary.add(word.toLowerCase().replace(/[’]/g, "'"));
    }

    if (!text) failures.push(`${pageLabel}: missing visible reading text`);
    if (levelRule.minimumWords && wordCount < levelRule.minimumWords) {
      failures.push(
        `${pageLabel}: ${wordCount} words is below ${levelRule.profileLabel} minimum ${levelRule.minimumWords}`
      );
    }
    if (wordCount > levelRule.maximumWords) {
      failures.push(
        `${pageLabel}: ${wordCount} words exceeds ${levelRule.profileLabel || `Level ${book.level}`} maximum ${levelRule.maximumWords}`
      );
    }
    if (lineCount > levelRule.maximumLines) {
      failures.push(`${pageLabel}: ${lineCount} lines exceeds Level ${book.level} maximum ${levelRule.maximumLines}`);
    }
    if (levelRule.minimumSentences && pageSentences.length < levelRule.minimumSentences) {
      failures.push(
        `${pageLabel}: ${pageSentences.length} sentence(s) is below ${levelRule.profileLabel} minimum ${levelRule.minimumSentences}`
      );
    }
    if (levelRule.maximumSentences && pageSentences.length > levelRule.maximumSentences) {
      failures.push(
        `${pageLabel}: ${pageSentences.length} sentences exceeds ${levelRule.profileLabel} maximum ${levelRule.maximumSentences}`
      );
    }
    if (levelRule.maximumSentenceWords) {
      for (const [sentenceIndex, sentence] of pageSentences.entries()) {
        const sentenceWordCount = words(sentence).length;
        if (sentenceWordCount > levelRule.maximumSentenceWords) {
          failures.push(
            `${pageLabel}: sentence ${sentenceIndex + 1} has ${sentenceWordCount} words; `
            + `${levelRule.profileLabel} allows at most ${levelRule.maximumSentenceWords}`
          );
        }
      }
    }
    if (book.level === "A" && /["“”,:;—–]/.test(text)) {
      failures.push(`${pageLabel}: Level A text contains dialogue or complex internal punctuation`);
    }
    if (book.level === "A" && LEVEL_A_FORBIDDEN_SYNTAX.test(text)) {
      failures.push(`${pageLabel}: Level A text contains subordinate or modal syntax`);
    }
    if (page.pageAudioText && String(page.pageAudioText).trim() !== text) {
      failures.push(`${pageLabel}: pageAudioText differs from visible text`);
    }
    if (book.mediaStatus !== "scheduled" && !nonEmptyFile(page.image || page.imageUrl || page.pageImage)) {
      failures.push(`${pageLabel}: page image is missing or empty`);
    }

    if (!skipAudio && book.mediaStatus !== "scheduled") {
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

  if (book.level === "A") {
    const multisyllabicCount = [...vocabulary].filter(word => syllables(word) > 1).length;
    const multisyllabicPercentage = Math.round(
      (100 * multisyllabicCount) / Math.max(vocabulary.size, 1)
    );
    if (multisyllabicPercentage > 30) {
      failures.push(
        `${label}: ${multisyllabicPercentage}% of word types are multisyllabic; Level A allows at most 30%`
      );
    }
  }
}

console.log(`Guided Reading Story Bible audit${requestedLevel ? ` - Level ${requestedLevel}` : ""}`);
console.log(
  `Books: ${books.length}; reviewed: ${reviewedBookCount}; pages: ${pageCount}; `
  + (skipAudio ? "audio checks: skipped." : `exact Leda pages: ${exactAudioCount}; `)
  + `scheduled media pages: ${scheduledMediaPageCount} across ${scheduledMediaBookCount} books.`
);
console.log(`Failures: ${failures.length}. Visual alignment is enforced by the separate hash-locked page audit.`);

if (failures.length) {
  console.error("\nGuided Reading Story Bible gate FAILED:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `All Guided Reading books pass Story Bible manuscript and level rules. `
  + `${scheduledMediaPageCount} scheduled pages remain outside image-file and exact-audio verification.`
);
