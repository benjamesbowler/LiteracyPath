#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { fingerprintBookReadingText } from "../src/utils/guidedReading/textMetrics.js";
import { normalizeLedaAudioText } from "../src/data/normalizeLedaAudioText.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEVELS = ["A", "B", "C", "D", "E"];
export const WORLD_DISCOVERY_TOPICS = Object.freeze([
  "identity", "relationships", "community", "fantasy", "geography",
  "space", "animals", "life cycles", "classification", "caring for our world"
]);
const TOPIC_ALIASES = new Map([
  ["my identity", "identity"], ["life-cycles", "life cycles"],
  ["classifications", "classification"], ["classifying", "classification"],
  ["caring-for-our-world", "caring for our world"]
]);
const LIMITS = { A: { words: 6, lines: 1, min: 5, max: 10 }, B: { words: 14, lines: 2, min: 6, max: 12 }, C: { words: 22, lines: 3, min: 8, max: 14 } };
const text = value => typeof value === "string" && Boolean(value.trim());
const words = value => String(value || "").match(/[A-Za-z0-9]+(?:[’'-][A-Za-z0-9]+)*/g) || [];
const canonicalText = value => String(value || "").normalize("NFKC").replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim().toLowerCase();
const normalizedTopic = value => TOPIC_ALIASES.get(canonicalText(value)) || canonicalText(value);
const sha256 = value => createHash("sha256").update(value).digest("hex");

function checkSource(source, label, failures) {
  if (!source || !text(source.title) || !text(source.url) || !text(source.evidence || source.claim)) {
    failures.push(`${label}: factual source needs title, URL and supported evidence/claim`);
    return;
  }
  try {
    const url = new URL(source.url);
    if (!/^https?:$/.test(url.protocol)) failures.push(`${label}: factual source must use HTTP(S)`);
  } catch {
    failures.push(`${label}: invalid factual source URL`);
  }
}

// Source-only checks deliberately do not import runtime books or require art.
// They establish structure and language limits, not editorial quality or truth.
function validateDraftSet(books, { requireComplete = true, firstNumber = 1, lastNumber = 10 } = {}) {
  const failures = [];
  const warnings = [];
  if (!Array.isArray(books)) return { failures: ["Expected an array of manuscripts"], warnings };
  const perLevel = lastNumber - firstNumber + 1;
  if (requireComplete && books.length !== perLevel * LEVELS.length) failures.push(`Expected ${perLevel * LEVELS.length} books; found ${books.length}`);
  const ids = new Set();
  const titles = new Set();
  const manuscripts = new Map();
  const repeatedPages = new Map();
  for (const book of books) {
    const label = book?.id || "(missing id)";
    if (!book || typeof book !== "object") { failures.push(`${label}: invalid manuscript`); continue; }
    if (ids.has(book.id)) failures.push(`${label}: duplicate book ID`);
    ids.add(book.id);
    const titleKey = canonicalText(book.title);
    if (titles.has(titleKey)) failures.push(`${label}: duplicate title`);
    titles.add(titleKey);
    if (!LEVELS.includes(book.appLevel)) failures.push(`${label}: public appLevel must be A–E`);
    if (!Number.isInteger(book.number) || book.number < firstNumber || book.number > lastNumber) failures.push(`${label}: number must be ${firstNumber}–${lastNumber}`);
    const expectedId = `world-discovery-${String(book.appLevel || "").toLowerCase()}-${String(book.number).padStart(2, "0")}`;
    if (book.id !== expectedId) failures.push(`${label}: ID must be ${expectedId}`);
    const internal = book.appLevel === "A" ? "A" : book.appLevel === "B" ? "B" : "C";
    if (book.level !== internal) failures.push(`${label}: internal level must be ${internal}`);
    const strand = (book.number - 1) % WORLD_DISCOVERY_TOPICS.length;
    if (normalizedTopic(book.topic) !== WORLD_DISCOVERY_TOPICS[strand]) failures.push(`${label}: topic does not match strand ${strand + 1}`);
    if (!["fiction", "nonfiction"].includes(book.type)) failures.push(`${label}: type must be fiction or nonfiction`);
    if (strand === 3 && book.type !== "fiction") failures.push(`${label}: fantasy must be fiction`);
    if (book.readingBandProfile !== "standard" || book.readingMode !== "predictable-levelled" || book.interestAge !== "4–8") failures.push(`${label}: reading profile/mode/interest age differs from the collection Bible`);
    for (const field of ["title", "setting", "coverBrief", "levelRationale"]) if (!text(book[field])) failures.push(`${label}: missing ${field}`);
    if (!Array.isArray(book.props) || !book.props.every(text)) failures.push(`${label}: props must be an array of descriptions`);
    if (!Array.isArray(book.languagePrep) || !book.languagePrep.length || book.languagePrep.some(row => !text(row.word) || !text(row.meaning))) failures.push(`${label}: languagePrep needs word/meaning pairs`);
    const review = book.storyBibleReview;
    if (review?.kind !== book.type) failures.push(`${label}: storyBibleReview kind differs from type`);
    if (!Array.isArray(review?.canonIds) || review.canonIds.some(id => !["WD-KIT", "WD-ZOE"].includes(id))) failures.push(`${label}: canonIds must name the locked World Discovery cast only`);
    for (const field of book.type === "fiction" ? ["storySpine", "failedAttempt", "resolution"] : ["topicQuestion", "progression", "synthesis"]) {
      if (!text(review?.[field])) failures.push(`${label}: missing storyBibleReview.${field}`);
    }
    if (book.type === "fiction" && !review?.canonIds?.length) failures.push(`${label}: fiction requires a named protagonist`);
    if (book.type === "nonfiction" && (!Array.isArray(review?.scienceSources) || !review.scienceSources.length)) failures.push(`${label}: nonfiction requires factual evidence`);
    if (review?.scienceSources && !Array.isArray(review.scienceSources)) failures.push(`${label}: scienceSources must be an array`);
    for (const source of Array.isArray(review?.scienceSources) ? review.scienceSources : []) checkSource(source, label, failures);
    const limit = LIMITS[book.level];
    if (!Array.isArray(book.pages) || !book.pages.length) { failures.push(`${label}: pages missing`); continue; }
    if (limit && (book.pages.length < limit.min || book.pages.length > limit.max)) failures.push(`${label}: page count outside governing ${book.level} band`);
    const expectedCount = ["A", "B", "C"].includes(book.appLevel) ? 8 : 10;
    if (book.pages.length !== expectedCount && !text(book.pageCountRationale)) failures.push(`${label}: nonstandard page count requires an editorial pageCountRationale`);
    const manuscriptKey = book.pages.map(page => canonicalText(page?.text)).join("\n");
    if (manuscripts.has(manuscriptKey)) failures.push(`${label}: duplicates the manuscript of ${manuscripts.get(manuscriptKey)}`);
    manuscripts.set(manuscriptKey, label);
    const briefs = new Set();
    for (const [index, page] of book.pages.entries()) {
      const pageLabel = `${label}:${index + 1}`;
      if (!page || typeof page !== "object") { failures.push(`${pageLabel}: invalid page`); continue; }
      if (page.pageNumber !== index + 1) failures.push(`${pageLabel}: pageNumber must follow manuscript order`);
      for (const field of ["text", "imageBrief", "imageAlt", "pageDescription", "state"]) if (!text(page[field])) failures.push(`${pageLabel}: missing ${field}`);
      if (typeof page.embeddedImageText !== "string") failures.push(`${pageLabel}: embeddedImageText must be explicit`);
      if (page.imageLayout !== undefined && !["scene", "integrated-diagram", "comparison-diagram"].includes(page.imageLayout)) failures.push(`${pageLabel}: imageLayout must be scene, integrated-diagram or comparison-diagram`);
      const count = words(page.text).length;
      if (!count || (limit && count > limit.words)) failures.push(`${pageLabel}: ${count} words exceeds ${book.level} limit ${limit?.words || "unknown"}`);
      if (limit && String(page.text).split(/\n+/).filter(row => row.trim()).length > limit.lines) failures.push(`${pageLabel}: too many printed lines`);
      if (book.level === "A" && (/["“”,:;—–]/.test(page.text) || /\b(?:but|so|because|while|when|if|will|might|could|would|should)\b/i.test(page.text))) failures.push(`${pageLabel}: Level A contains prohibited syntax or punctuation`);
      if (page.pageAudioText && page.pageAudioText !== page.text) failures.push(`${pageLabel}: pageAudioText differs from print`);
      const brief = canonicalText(page.imageBrief);
      if (briefs.has(brief)) failures.push(`${pageLabel}: duplicate scene brief within book`);
      briefs.add(brief);
      if (brief === canonicalText(page.text)) failures.push(`${pageLabel}: image brief merely repeats prose`);
      const pageKey = canonicalText(page.text);
      if (!repeatedPages.has(pageKey)) repeatedPages.set(pageKey, []);
      repeatedPages.get(pageKey).push(pageLabel);
    }
    if (book.level === "A") {
      const vocabulary = new Set(book.pages.flatMap(page => words(page?.text).map(word => word.toLowerCase())));
      const multisyllabic = [...vocabulary].filter(word => (word.replace(/e$/, "").match(/[aeiouy]+/g) || [""]).length > 1).length;
      if (Math.round(100 * multisyllabic / Math.max(vocabulary.size, 1)) > 30) failures.push(`${label}: exceeds Level A multisyllabic-word allowance`);
    }
    const discussion = book.discussion;
    if (JSON.stringify(Object.keys(discussion || {}).sort()) !== JSON.stringify(["oral", "visual"])) failures.push(`${label}: discussion must contain only oral and visual`);
    for (const [move, fields] of [["oral", ["prompt", "listenFor"]], ["visual", ["prompt", "lookFor"]]]) {
      for (const field of fields) if (!text(discussion?.[move]?.[field])) failures.push(`${label}: missing discussion.${move}.${field}`);
    }
    if (!book.pages.some(page => page?.pageNumber === discussion?.visual?.page)) failures.push(`${label}: visual discussion page does not exist`);
  }
  if (requireComplete) for (const level of LEVELS) {
    const levelBooks = books.filter(book => book.appLevel === level);
    if (levelBooks.length !== perLevel) failures.push(`App level ${level}: expected ${perLevel} books; found ${levelBooks.length}`);
    if (new Set(levelBooks.map(book => normalizedTopic(book.topic))).size !== 10) failures.push(`App level ${level}: every strand must appear exactly once`);
    for (let number = firstNumber; number <= lastNumber; number += 1) {
      const id = `world-discovery-${level.toLowerCase()}-${String(number).padStart(2, "0")}`;
      if (!ids.has(id)) failures.push(`Missing required manuscript ${id}`);
    }
  }
  // Short patterned lines may legitimately recur. Report rather than ban them.
  for (const [line, locations] of repeatedPages) if (locations.length > 1) warnings.push(`Repeated page text (${locations.join(", ")}): ${line}`);
  return { failures, warnings };
}

export function validateWorldDiscoveryDrafts(books, { requireComplete = true } = {}) {
  return validateDraftSet(books, { requireComplete });
}

// Explicit isolated production batches do not change the published fifty-book
// contract. A complete ten-strand cycle is declared, never inferred from rows.
export function validateWorldDiscoveryDraftBatch(books, { firstNumber, lastNumber, requireComplete = true } = {}) {
  if (!Number.isInteger(firstNumber) || !Number.isInteger(lastNumber)
    || firstNumber < 11 || firstNumber % 10 !== 1 || lastNumber !== firstNumber + 9 || lastNumber > 99) {
    return { failures: ["Draft batch requires an explicit ten-book range per level, starting at 11 or a later ten-strand cycle"], warnings: [] };
  }
  return validateDraftSet(books, { firstNumber, lastNumber, requireComplete });
}

export function validateWorldDiscoveryCohortDrafts(entries) {
  const books = entries.flatMap(entry => entry.books);
  const lastNumber = Math.max(10, ...entries.map(entry => entry.cohort.lastNumber));
  const result = validateDraftSet(books, { requireComplete: false, firstNumber: 1, lastNumber });
  for (const { cohort, books: cohortBooks } of entries) {
    const checked = cohort.index ? validateWorldDiscoveryDraftBatch(cohortBooks, cohort) : validateWorldDiscoveryDrafts(cohortBooks);
    result.failures.push(...checked.failures);
    if (cohortBooks.length !== cohort.expectedBooks || cohortBooks.reduce((total, book) => total + book.pages.length, 0) !== cohort.expectedPages) result.failures.push(`${cohort.id}: manuscript totals differ from declared expectations`);
  }
  return result;
}

export function validateWorldDiscoveryReviews(books, reviews) {
  const failures = [];
  const ids = new Set(books.map(book => book.id));
  for (const id of Object.keys(reviews || {})) if (!ids.has(id)) failures.push(`${id}: review names no current manuscript`);
  for (const book of books) {
    const review = reviews?.[book.id];
    if (!review) { failures.push(`${book.id}: independent full-manuscript review missing`); continue; }
    if (review.reviewedTextFingerprint !== fingerprintBookReadingText(book)) failures.push(`${book.id}: reviewed title/pages fingerprint is stale`);
    if (review.appReadingLevel !== book.appLevel) failures.push(`${book.id}: reviewed public level differs from manuscript`);
    if (!text(review.rationale) || !/^\d{4}-\d{2}-\d{2}$/.test(review.reviewedAt || "") || review.reviewMethod !== "codex-full-manuscript-editorial-review") failures.push(`${book.id}: incomplete authored review evidence`);
  }
  return failures;
}

export function validateWorldDiscoveryNarrationReview(report, expectedAudio, expectedPageAudio, expectedCount = 626) {
  const failures = [];
  const paths = new Set();
  if (report?.status !== "automated-review-complete" || report.results?.length !== expectedCount) failures.push("narration screening evidence is incomplete");
  for (const row of report?.results || []) {
    if (paths.has(row.audioPath)) failures.push(`duplicate narration screening record: ${row.audioPath}`);
    paths.add(row.audioPath);
    const expected = expectedAudio.get(row.audioPath);
    if (!expected || expected.kind !== row.kind || row.voiceName !== "en-US-Chirp3-HD-Leda"
      || !expected.texts.has(normalizeLedaAudioText(row.text))
      || normalizeLedaAudioText(row.lookupText) !== normalizeLedaAudioText(row.text)) {
      failures.push(`narration screening text/role/voice does not match runtime: ${row.audioPath}`);
    }
  }
  for (const audioPath of expectedPageAudio) if (!paths.has(audioPath)) failures.push(`current title/page lacks narration screening: ${audioPath}`);
  return failures;
}

export async function validateRelease(books, reviews, narrationReports) {
  const failures = validateWorldDiscoveryReviews(books, reviews);
  const { getRuntimeGuidedReadingBooks } = await import("../src/utils/guidedReading/runtimeBooks.js");
  const { getGuidedReadingPageAudioPath, getGuidedReadingWordProductionAudioPath } = await import("../src/utils/guidedReading/readAloudPolicy.js");
  const { appVisualAssetReview } = await import("../src/content/appVisualAssetReviews.generated.js");
  const { GUIDED_READING_COVER_RENDITIONS } = await import("../src/data/generated/guidedReadingCoverRenditions.generated.js");
  const runtime = new Map(getRuntimeGuidedReadingBooks().map(book => [book.id, book]));
  const runtimeIds = [...runtime.values()].filter(book => book.seriesId === "world-discovery").map(book => book.id).sort();
  if (JSON.stringify(runtimeIds) !== JSON.stringify(books.map(book => book.id).sort())) failures.push("World Discovery runtime membership differs from the declared registered cohorts");
  const imageReviews = new Map(appVisualAssetReview.assets.map(row => [row.path, row]));
  const visualAudit = JSON.parse(fs.readFileSync(path.join(root, "docs/guided-reading/guided_reading_story_bible_visual_alignment_audit_2026-08-01.json"), "utf8"));
  const pageReviews = new Map(visualAudit.pages.map(row => [`${row.bookId}:${row.pageNumber}`, row]));
  function publicAsset(publicPath, label) {
    if (!publicPath || !publicPath.startsWith("/")) { failures.push(`${label}: missing public media path`); return null; }
    const diskPath = path.resolve(root, "public", publicPath.split("?")[0].slice(1));
    if (!diskPath.startsWith(path.join(root, "public") + path.sep)) { failures.push(`${label}: media path escapes public`); return null; }
    try {
      const bytes = fs.readFileSync(diskPath);
      if (!bytes.length) throw new Error("empty");
      return sha256(bytes);
    } catch { failures.push(`${label}: absent or empty media ${publicPath}`); return null; }
  }
  const checkedImages = new Set();
  const imageDigests = new Map();
  const checkedAudio = new Set();
  const expectedAudio = new Map();
  const expectedPageAudio = new Set();
  function expectNarration(audioPath, kind, spokenText) {
    const row = expectedAudio.get(audioPath) || { kind, texts: new Set() };
    row.texts.add(normalizeLedaAudioText(spokenText));
    expectedAudio.set(audioPath, row);
    if (kind === "page_or_title") expectedPageAudio.add(audioPath);
  }
  for (const source of books) {
    const scorecard = reviews[source.id]?.editorialScorecard;
    const scores = Object.values(scorecard?.categories || {}).map(row => row.score);
    if (scorecard?.scope !== "complete-book" || scores.length !== 12
      || scores.some(score => !Number.isInteger(score) || score < 3 || score > 4)
      || scorecard.releaseTotal !== scores.reduce((sum, score) => sum + score, 0)
      || scorecard.releaseTotal < 38 || scorecard.openMediaDefects?.length !== 0) {
      failures.push(`${source.id}: complete editorial/media scorecard is missing or unresolved`);
    }
    const book = runtime.get(source.id);
    if (!book || book.pages.length !== source.pages.length) { failures.push(`${source.id}: complete book is absent from runtime`); continue; }
    if (book.appReadingLevel !== source.appLevel || book.appReadingLevelStatus !== "current") failures.push(`${source.id}: public level is unavailable or stale`);
    if (fingerprintBookReadingText(book) !== fingerprintBookReadingText(source)) failures.push(`${source.id}: runtime manuscript differs from source`);
    for (const imagePath of [book.coverImage, ...book.pages.map(page => page.image)]) {
      if (checkedImages.has(imagePath)) { failures.push(`${source.id}: cover/page art path is reused`); continue; }
      checkedImages.add(imagePath);
      const digest = publicAsset(imagePath, source.id);
      if (digest && imageDigests.has(digest)) failures.push(`${source.id}: image bytes duplicate ${imageDigests.get(digest)}`);
      if (digest) imageDigests.set(digest, imagePath);
      const review = imageReviews.get(imagePath);
      if (!review || review.status !== "approved" || review.sha256 !== digest) failures.push(`${source.id}: image lacks current existing app visual review: ${imagePath}`);
      const slot = path.basename(imagePath, ".webp");
      const receiptPath = path.join(root, "source-art/world-discovery/receipts", `${source.id.replace("world-discovery-", "")}-${slot}.json`);
      try {
        const receipt = JSON.parse(fs.readFileSync(receiptPath, "utf8"));
        if (receipt.outputSha256 !== digest || receipt.visualReview?.sha256 !== digest
          || receipt.visualReview?.method !== "codex-direct-image-inspection" || !text(receipt.visualReview?.note)) {
          failures.push(`${source.id}:${slot}: direct visual inspection receipt is stale or incomplete`);
        }
      } catch { failures.push(`${source.id}:${slot}: direct visual inspection receipt missing`); }
    }
    const card = GUIDED_READING_COVER_RENDITIONS[book.coverImage];
    const cardDigest = publicAsset(card?.src, `${book.id}:card-cover`);
    if (!card || card.sourceSha256 !== publicAsset(book.coverImage, book.id)
      || card.deliverySha256 !== cardDigest || imageReviews.get(card?.src)?.sha256 !== cardDigest) {
      failures.push(`${book.id}: current reviewed card cover is missing`);
    }
    const speechPages = [...book.pages, { text: book.title, narrationNeedsRebuild: true }];
    for (const page of speechPages) {
      const audioPath = getGuidedReadingPageAudioPath(page);
      expectNarration(audioPath, "page_or_title", page.text);
      if (!checkedAudio.has(audioPath)) { publicAsset(audioPath, `${book.id}:${page.pageNumber || "title"}`); checkedAudio.add(audioPath); }
      for (const word of words(page.text)) {
        const wordPath = getGuidedReadingWordProductionAudioPath(word, { bookId: book.id, page });
        expectNarration(wordPath, "word", word);
        if (!checkedAudio.has(wordPath)) { publicAsset(wordPath, `${book.id}:word:${word}`); checkedAudio.add(wordPath); }
      }
      if (!page.pageNumber) continue;
      if (page.narrationNeedsRebuild) failures.push(`${book.id}:${page.pageNumber}: exact narration clearance remains open`);
      const review = pageReviews.get(`${book.id}:${page.pageNumber}`);
      if (!review || review.status !== "approved" || review.displayedText !== page.text || review.textSha256 !== sha256(page.text) || review.imagePath !== page.image || review.imageSha256 !== publicAsset(page.image, book.id)) failures.push(`${book.id}:${page.pageNumber}: canonical page visual alignment review missing or stale`);
    }
  }
  try {
    const reports = narrationReports || [{ narration: JSON.parse(fs.readFileSync(path.join(root, "source-art/world-discovery/narration-review.json"), "utf8")), registration: { counts: { screenedClips: 626 } } }];
    const narration = { status: "automated-review-complete", results: reports.flatMap(entry => entry.narration.results) };
    const expectedCount = reports.reduce((total, entry) => total + entry.registration.counts.screenedClips, 0);
    failures.push(...validateWorldDiscoveryNarrationReview(narration, expectedAudio, expectedPageAudio, expectedCount).map(message => `World Discovery: ${message}`));
    for (const row of narration.results || []) {
      if (!checkedAudio.has(row.audioPath) || row.audioSha256 !== publicAsset(row.audioPath, row.text)
        || !text(row.reviewNote) || !row.recognizerOutputs?.length || !(row.peakDbfs < 0)) {
        failures.push(`World Discovery: narration screening record is stale or incomplete: ${row.audioPath}`);
      }
    }
  } catch { failures.push("World Discovery: narration screening evidence missing"); }
  return { failures, images: checkedImages.size, audioFiles: checkedAudio.size };
}
