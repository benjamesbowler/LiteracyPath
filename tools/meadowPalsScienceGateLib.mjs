import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  MEADOW_PALS_SCIENCE_BOOKS,
  MISSING_SANDWICH_BOOK_ID,
  MISSING_SANDWICH_MANUSCRIPT_SHA256
} from "../src/data/meadowPalsScienceBooks.js";
import {
  canonicalScienceText,
  getMeadowPalsSciencePageNarration,
  getMeadowPalsScienceTitleNarration,
  validateScienceNarration
} from "../src/data/meadowPalsScienceNarration.js";
import { MEADOW_PALS_SCIENCE_NARRATION, MEADOW_PALS_SCIENCE_WORD_AUDIO } from "../src/data/generated/meadowPalsScienceNarration.generated.js";
import { getGuidedReadingWordProductionAudioPath } from "../src/utils/guidedReading/readAloudPolicy.js";

const digest = value => createHash("sha256").update(value).digest("hex");

export function validateScienceReadAloudManuscript(book = {}) {
  const errors = [];
  if (book.id !== MISSING_SANDWICH_BOOK_ID) errors.push("unregistered shared-read-aloud book");
  if (book.level !== "READ_ALOUD" || book.readingBandProfile !== "read-aloud"
    || book.readingMode !== "supported-read-together") errors.push("shared-reading placement changed");
  if (book.pages?.length !== 12) errors.push("the approved story requires twelve pages");
  if (digest(JSON.stringify((book.pages || []).map(page => page.text))) !== MISSING_SANDWICH_MANUSCRIPT_SHA256) {
    errors.push("approved manuscript changed");
  }
  if (book.independentReadingLevel !== null || !book.interestAge) errors.push("interest age and decoding claim must stay separate");
  return errors;
}

export function auditScienceReadAloudNarration(books, repositoryRoot) {
  const pages = [];
  const failures = [];
  for (const book of books.filter(item => item.readingBandProfile === "read-aloud")) {
    for (const reason of validateScienceReadAloudManuscript(book)) failures.push({ bookId: book.id, reason });
    const title = getMeadowPalsScienceTitleNarration(book);
    const titleFile = title?.audioPath && path.join(repositoryRoot, "public", title.audioPath);
    if (!title || !existsSync(titleFile) || digest(readFileSync(titleFile)) !== title.audioSha256) {
      failures.push({ bookId: book.id, reason: "missing_or_changed_title_narration" });
    }
    const words = new Set((book.pages || []).flatMap(page => page.words || [])
      .map(word => canonicalScienceText(word.text || word).toLowerCase()));
    for (const word of words) {
      const audioPath = getGuidedReadingWordProductionAudioPath({ text: word });
      if (!audioPath) {
        failures.push({ bookId: book.id, word, reason: "missing_word_narration" });
        continue;
      }
      if (!audioPath.startsWith("/audio/production/en-US/meadow_science/")) continue;
      const record = MEADOW_PALS_SCIENCE_WORD_AUDIO[word];
      const file = path.join(repositoryRoot, "public", audioPath);
      if (!record || !existsSync(file) || digest(readFileSync(file)) !== record.audioSha256) {
        failures.push({ bookId: book.id, word, reason: "missing_or_changed_word_narration" });
      }
    }
    for (const page of book.pages || []) {
      const record = MEADOW_PALS_SCIENCE_NARRATION[`${book.id}::${page.pageNumber}`];
      const validRecord = getMeadowPalsSciencePageNarration(page);
      const file = record?.audioPath && path.join(repositoryRoot, "public", record.audioPath);
      const bytes = file && existsSync(file) ? readFileSync(file) : null;
      const audioSha256 = bytes?.length ? digest(bytes) : "";
      const rowErrors = validateScienceNarration(page, record || {});
      if (!bytes?.length) rowErrors.push("missing_audio_file");
      else if (audioSha256 !== record.audioSha256) rowErrors.push("audio_hash_mismatch");
      const row = {
        key: `${book.id}::${page.pageNumber}`,
        bookId: book.id,
        pageNumber: page.pageNumber,
        displayedText: page.text,
        audioPath: validRecord?.audioPath || "",
        audioSha256,
        audioExists: Boolean(bytes?.length),
        origin: "character_dialogue_manifest",
        transcriptMatches: !rowErrors.includes("spoken_words_mismatch") && !rowErrors.includes("displayed_text_mismatch"),
        pageAudioTextMatches: page.pageAudioText === page.text,
        exactLedaAudioResolves: false,
        exactNarrationResolves: rowErrors.length === 0,
        narrationNeedsRebuild: page.narrationNeedsRebuild === true
      };
      pages.push(row);
      for (const reason of [...new Set(rowErrors)]) failures.push({ bookId: book.id, pageNumber: page.pageNumber, reason });
    }
  }
  return { pages, failures, activeBookCount: new Set(pages.map(page => page.bookId)).size };
}

export function loadScienceVisualReview(repositoryRoot) {
  const file = path.join(repositoryRoot, "public/guided-reading/science/missing-sandwich/manifest.json");
  if (!existsSync(file)) return { pages: [], failures: ["Meadow Pals science visual review manifest is missing"] };
  const review = JSON.parse(readFileSync(file, "utf8"));
  const failures = [];
  if (review.bookId !== MISSING_SANDWICH_BOOK_ID || review.status !== "complete") failures.push("Meadow Pals science visual review is incomplete");
  if (!review.reviewMethod || !review.reviewedAt) failures.push("Meadow Pals science visual review lacks inspection evidence");
  if (review.pages?.length !== 12) failures.push("Meadow Pals science visual review requires twelve exact page records");
  if (new Set((review.pages || []).map(page => page.imageSha256)).size !== 12) failures.push("Meadow Pals science needs twelve distinct page images");
  const book = MEADOW_PALS_SCIENCE_BOOKS[0];
  const cover = review.cover || {};
  const coverPath = path.join(repositoryRoot, "public", book.coverImage);
  if (cover.imagePath !== book.coverImage || cover.status !== "approved" || !cover.reviewNotes) {
    failures.push("Meadow Pals science cover review is missing");
  }
  if (!existsSync(coverPath) || digest(readFileSync(coverPath)) !== cover.imageSha256) {
    failures.push("Meadow Pals science cover differs from its visual review");
  }
  for (const record of review.pages || []) {
    if (record.bookId !== book.id || !record.reviewNotes || (record.issues || []).length) failures.push(`Meadow Pals science page ${record.pageNumber} has incomplete visual evidence`);
  }
  return { ...review, pages: review.pages || [], failures };
}
