import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { readWorldDiscoverySource } from "./worldDiscoverySourceLib.mjs";
import { validateWorldDiscoveryNarrationReview } from "./worldDiscoveryValidationLib.mjs";
import { getGuidedReadingPageAudioPath, getGuidedReadingWordProductionAudioPath } from "../src/utils/guidedReading/readAloudPolicy.js";
import { normalizeLedaAudioText } from "../src/data/normalizeLedaAudioText.js";
import { fingerprintBookReadingText } from "../src/utils/guidedReading/textMetrics.js";
import { stableWorldDiscoveryJson, worldDiscoveryCohortIds, worldDiscoveryInputFingerprint } from "../src/data/worldDiscoveryCohortContract.js";
import { GUIDED_READING_CONTEXTUAL_WORD_AUDIO } from "../src/data/guidedReadingContextualWordAudio.js";
import { validateContextualWordAudioEntries } from "./guidedReadingContextualWordAudioLib.mjs";
import { readWorldDiscoveryMaintenanceAudio } from "./worldDiscoveryMaintenanceLib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha256 = value => createHash("sha256").update(value).digest("hex");
const words = value => String(value || "").match(/[A-Za-z0-9]+(?:[’'-][A-Za-z0-9]+)*/g) || [];
const hasText = value => typeof value === "string" && Boolean(value.trim());
const requireThat = (condition, message) => { if (!condition) throw Error(message); };
function diskPath(relative) {
  const resolved = path.resolve(root, relative);
  requireThat(resolved.startsWith(root + path.sep), `Evidence path escapes repository: ${relative}`);
  return resolved;
}
function publicFile(publicPath) {
  requireThat(typeof publicPath === "string" && publicPath.startsWith("/"), `Missing production media: ${publicPath}`);
  return `public${publicPath.split("?")[0]}`;
}
function digestFile(relative) {
  const bytes = fs.readFileSync(diskPath(relative));
  requireThat(bytes.length > 0, `Empty evidence: ${relative}`);
  return sha256(bytes);
}

export function readWorldDiscoveryCohort(cohort) {
  const source = readWorldDiscoverySource({ sourceDir: cohort.sourceDir, topicProfile: cohort.topicProfile, requireReviews: true,
    ...(cohort.index ? { firstNumber: cohort.firstNumber, lastNumber: cohort.lastNumber } : {}) });
  requireThat(stableWorldDiscoveryJson(source.books.map(book => book.id)) === stableWorldDiscoveryJson(worldDiscoveryCohortIds(cohort)), `${cohort.id}: source IDs/order differ from declaration`);
  requireThat(source.books.length === cohort.expectedBooks
    && source.books.reduce((count, book) => count + book.pages.length, 0) === cohort.expectedPages, `${cohort.id}: source counts differ from declaration`);
  return source;
}

export function collectWorldDiscoveryCohortAudio(books) {
  const audio = new Map();
  function record(audioPath, kind, text) {
    const audioSha256 = digestFile(publicFile(audioPath));
    const entry = audio.get(audioPath) || { audioPath, audioSha256, kind, texts: new Set() };
    requireThat(entry.kind === kind, `Audio roles collide: ${audioPath}`);
    entry.texts.add(normalizeLedaAudioText(text));
    audio.set(audioPath, entry);
  }
  for (const book of books) for (const page of [...book.pages, { pageNumber: "title", text: book.title }]) {
    record(getGuidedReadingPageAudioPath({ ...page, narrationNeedsRebuild: true }), "page_or_title", page.text);
    for (const word of words(page.text)) record(getGuidedReadingWordProductionAudioPath(word, { bookId: book.id, page }), "word", word);
  }
  return audio;
}

export function buildWorldDiscoveryAudioPlan(cohort, source, priorAudio = new Map()) {
  const approvedAudio = new Map([...readWorldDiscoveryMaintenanceAudio(cohort).audio, ...priorAudio]);
  const required = [], reused = [];
  for (const row of collectWorldDiscoveryCohortAudio(source.books).values()) {
    const prior = approvedAudio.get(row.audioPath);
    const reusable = prior?.audioSha256 === row.audioSha256 && prior.kind === row.kind
      && [...row.texts].every(text => prior.texts.has(text));
    (reusable ? reused : required).push({ ...row, texts: [...row.texts].sort() });
  }
  for (const rows of [required, reused]) rows.sort((a, b) => a.audioPath.localeCompare(b.audioPath));
  return { schemaVersion: 1, cohortId: cohort.id, inputFingerprint: worldDiscoveryInputFingerprint(source.books, source.reviews), required, reused };
}

export function validateWorldDiscoveryAudioPlan(plan, expected) {
  return stableWorldDiscoveryJson(plan) === stableWorldDiscoveryJson(expected)
    ? [] : ["Narration inventory must exactly partition current clip/text/role/hash bindings into required screening and unchanged previously registered reuse"];
}

export function validateWorldDiscoveryEvidenceReceipt(recorded, current) {
  return stableWorldDiscoveryJson(recorded) === stableWorldDiscoveryJson(current)
    ? [] : ["Registration evidence changed; source, review or actual media bytes are stale"];
}

// Pre-registration checks use complete cohort-local evidence. Canonical global
// index/alignment/clearance generators run after registration and remain release
// gates. No metadata here is a claim of human listening or classroom observation.
export async function auditWorldDiscoveryCohort(cohort, priorAudio = new Map()) {
  const source = readWorldDiscoveryCohort(cohort);
  const files = new Map();
  function fileHash(relative) {
    if (!files.has(relative)) files.set(relative, digestFile(relative));
    return files.get(relative);
  }
  function readJson(relative) { fileHash(relative); return JSON.parse(fs.readFileSync(diskPath(relative), "utf8")); }
  for (const row of readWorldDiscoveryMaintenanceAudio(cohort).evidence) fileHash(row.path);
  const ids = new Set(source.books.map(book => book.id));
  const contextual = GUIDED_READING_CONTEXTUAL_WORD_AUDIO.filter(row => ids.has(row.bookId));
  const contextualErrors = validateContextualWordAudioEntries(source.books, { entries: contextual, root });
  requireThat(!contextualErrors.length, contextualErrors.join("\n"));
  // Bind only this cohort's rows so later additions cannot invalidate a frozen
  // prior cohort. The original fifty have no contextual overrides.
  if (contextual.length) files.set(`src/content/guidedReadingContextualWordAudio.json#${cohort.id}`, sha256(stableWorldDiscoveryJson(contextual)));
  for (const name of [...[..."abcde"].map(level => `level-${level}.json`), "reviews.json"]) fileHash(`${cohort.sourceDir}/${name}`);
  fileHash("source-art/world-discovery/cast-v1.png");
  const cards = readJson(cohort.cardReview);
  requireThat(cards.method === "codex-direct-card-rendition-inspection" && hasText(cards.evidence), `${cohort.id}: direct card review is missing`);
  requireThat(cards.assets?.length === cohort.expectedBooks, `${cohort.id}: card review count differs from declaration`);
  const cardSources = new Set(), imageDigests = new Set();
  let illustrations = 0, references = 1;
  for (const book of source.books) {
    const scorecard = source.reviews[book.id]?.editorialScorecard;
    const scores = Object.values(scorecard?.categories || {}).map(row => row.score);
    requireThat(scorecard?.scope === "complete-book" && scorecard.reviewedTextFingerprint === fingerprintBookReadingText(book)
      && scores.length === 12 && scores.every(score => Number.isInteger(score) && score >= 3 && score <= 4)
      && scorecard.releaseTotal === scores.reduce((sum, score) => sum + score, 0) && scorecard.releaseTotal >= 38
      && scorecard.openManuscriptDefects?.length === 0 && scorecard.openMediaDefects?.length === 0, `${book.id}: complete editorial/media review is missing or unresolved`);
    const slug = book.id.replace("world-discovery-", "");
    const sourceFingerprint = sha256(JSON.stringify([book]));
    const slots = ["reference", "cover", ...book.pages.map(page => `page-${String(page.pageNumber).padStart(2, "0")}`)];
    for (const slot of slots) {
      const relative = slot === "reference" ? `source-art/world-discovery/${slug}-reference.webp` : `public/guided-reading/world-discovery/${slug}/${slot}.webp`;
      const digest = fileHash(relative);
      const receipt = readJson(`source-art/world-discovery/receipts/${slug}-${slot}.json`);
      requireThat(receipt.bookId === book.id && receipt.slot === slot && receipt.outputSha256 === digest
        && receipt.visualReview?.sha256 === digest && receipt.visualReview?.method === "codex-direct-image-inspection"
        && hasText(receipt.visualReview?.note), `${book.id}:${slot}: direct inspection evidence is missing or stale`);
      if (receipt.reviewedManuscriptSource) {
        // Keep the original generation input intact. A later authorized text or
        // illustration repair must bind its new complete-book review separately.
        const reviewed = receipt.reviewedManuscriptSource;
        requireThat(reviewed.bookId === book.id && reviewed.sha256 === sourceFingerprint
          && reviewed.path === `${cohort.sourceDir}/level-${book.appLevel.toLowerCase()}.json`,
        `${book.id}:${slot}: reviewed manuscript/state is stale`);
        const complete = readJson(reviewed.evidence).books?.filter(row => row.bookId === book.id);
        requireThat(complete?.length === 1 && complete[0].sourceBookSha256 === sourceFingerprint
          && complete[0].textFingerprint === fingerprintBookReadingText(book)
          && complete[0].fullTextPrepAndDiscussionReviewed === true
          && complete[0].allReferencesCoversAndPagesReviewed === true
          && complete[0].openFindings?.length === 0
          && complete[0].assets?.filter(row => row.slot === slot && row.path === relative && row.sha256 === digest).length === 1,
        `${book.id}:${slot}: complete-book inspection does not bind current text and image`);
      } else {
        requireThat(!cohort.maintenanceBaseline, `${book.id}:${slot}: maintenance requires a current complete-book review`);
        if (cohort.index) requireThat(receipt.manuscriptSource?.sha256 === sourceFingerprint, `${book.id}:${slot}: receipt belongs to different manuscript/state`);
      }
      const metadata = await sharp(diskPath(relative)).metadata();
      requireThat(metadata.width >= 1000 && metadata.height >= 650, `${book.id}:${slot}: image resolution is too small`);
      if (slot === "reference") references += 1;
      else {
        requireThat(!imageDigests.has(digest), `${book.id}:${slot}: cover/page image bytes are reused`);
        imageDigests.add(digest); illustrations += 1;
      }
    }
    const cover = `/guided-reading/world-discovery/${slug}/cover.webp`;
    const card = cards.assets.find(row => row.canonicalSource === cover);
    requireThat(card && !cardSources.has(cover) && card.sha256 === fileHash(publicFile(card.path)), `${book.id}: exact card review is missing or stale`);
    if (cohort.index) requireThat(card.sourceSha256 === fileHash(publicFile(cover)), `${book.id}: card review must bind current canonical source bytes`);
    cardSources.add(cover);
    const metadata = await sharp(diskPath(publicFile(card.path))).metadata();
    requireThat(metadata.width > 0 && metadata.height > 0 && Math.max(metadata.width, metadata.height) <= 512, `${book.id}: card delivery dimensions are invalid`);
  }
  const audio = collectWorldDiscoveryCohortAudio(source.books);
  for (const row of audio.values()) fileHash(publicFile(row.audioPath));
  const narration = readJson(cohort.narrationReview);
  const expectedAudio = new Map([...audio].map(([key, row]) => [key, { kind: row.kind, texts: row.texts }]));
  let required = [...audio.values()].filter(row => row.kind === "page_or_title").map(row => row.audioPath);
  let expectedCount = 626; // Immutable first-release screening report, not all consumed vocabulary.
  if (cohort.narrationInventory) {
    const plan = readJson(cohort.narrationInventory), expectedPlan = buildWorldDiscoveryAudioPlan(cohort, source, priorAudio);
    const errors = validateWorldDiscoveryAudioPlan(plan, expectedPlan);
    requireThat(!errors.length, `${cohort.id}: ${errors.join("; ")}`);
    required = plan.required.map(row => row.audioPath);
    expectedCount = required.length;
    requireThat(stableWorldDiscoveryJson((narration.results || []).map(row => row.audioPath).sort()) === stableWorldDiscoveryJson([...required].sort()), `${cohort.id}: narration screening must cover the exact declared inventory`);
  }
  const audioErrors = validateWorldDiscoveryNarrationReview(narration, expectedAudio, new Set(required), expectedCount);
  requireThat(!audioErrors.length, `${cohort.id}: ${audioErrors.join("; ")}`);
  for (const row of narration.results) requireThat(row.audioSha256 === audio.get(row.audioPath)?.audioSha256
    && hasText(row.reviewNote) && row.recognizerOutputs?.length > 0 && Number.isFinite(row.peakDbfs) && row.peakDbfs < 0, `${cohort.id}: narration signal/recognition evidence is stale or incomplete: ${row.audioPath}`);
  const input = stableWorldDiscoveryJson({ books: source.books, reviews: source.reviews });
  return { ...source, audio, narration, imageDigests,
    registration: {
      schemaVersion: 1, cohortId: cohort.id, status: "release-ready",
      method: "validated-source-direct-image-and-automated-narration-evidence",
      inputFingerprint: worldDiscoveryInputFingerprint(source.books, source.reviews), inputSha256: sha256(input),
      evidenceSha256: sha256(stableWorldDiscoveryJson([...files].sort(([a], [b]) => a.localeCompare(b)))),
      counts: { books: source.books.length, pages: cohort.expectedPages, illustrations, cards: cardSources.size, references, audioFiles: audio.size, screenedClips: expectedCount }
    }
  };
}

export function addWorldDiscoveryApprovedAudio(target, audio) {
  for (const [key, row] of audio) {
    const prior = target.get(key);
    if (prior) requireThat(prior.audioSha256 === row.audioSha256 && prior.kind === row.kind, `Registered audio changed between cohorts: ${key}`);
    target.set(key, { ...row, texts: new Set([...(prior?.texts || []), ...row.texts]) });
  }
}
