import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { MEADOW_PALS_SCIENCE_BOOKS, MISSING_SANDWICH_MANUSCRIPT_SHA256 } from "../../src/data/meadowPalsScienceBooks.js";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";
import { applyGuidedReadingLevelOverride } from "../../src/utils/guidedReading/bookLevelOverrides.js";
import { getGuidedReadingCompletionMilestone, getGuidedReadingProgressionBooks } from "../../src/utils/guidedReading/completionPolicy.js";
import { getGuidedReadingMeasure } from "../../src/policy/guidedReadingMeasure.js";
import { guidedReadingLevelLabel } from "../../src/policy/guidedReadingCatalogPolicy.js";
import { bookCollectionId, bookCollectionsForLevel, buildBookShelves } from "../../src/policy/childLibraryPolicy.js";
import { classifyBookReadingPurpose } from "../../src/policy/literacyExperiencePolicy.js";
import { expectedScienceSpeakerWords, getMeadowPalsSciencePageNarration, getMeadowPalsScienceWordAudioPath, MEADOW_PALS_SCIENCE_VOICES, MEADOW_PALS_SCIENCE_VOICE_ENGINES, validateScienceNarration } from "../../src/data/meadowPalsScienceNarration.js";
import { validateScienceReadAloudManuscript } from "../../tools/meadowPalsScienceGateLib.mjs";
import { recommendBooksForStudent } from "../../src/utils/guidedReading/recommendBooksForStudent.js";
import { splitGuidedReadingParagraphs, splitGuidedReadingSentences } from "../../src/utils/guidedReading/readAloudPolicy.js";
import { getGuidedReadingWordProductionAudioPath } from "../../src/utils/guidedReading/readAloudPolicy.js";
import { AUDIO_GUIDED_READING_PATHS } from "../../src/data/generated/audioGuidedReadingPaths.generated.js";

const source = MEADOW_PALS_SCIENCE_BOOKS[0];

test("the reader's shipped audio inventory admits every science word recording", () => {
  for (const page of source.pages) {
    for (const word of page.words) {
      const audioPath = getGuidedReadingWordProductionAudioPath(word);
      assert.ok(audioPath && AUDIO_GUIDED_READING_PATHS.has(audioPath), `${word.text}: ${audioPath}`);
    }
  }
});

test("the approved science manuscript has twelve unchanged pages in the Meadow Pals library", () => {
  const book = getRuntimeGuidedReadingBooks().find(item => item.id === source.id);
  assert.ok(book);
  assert.equal(book.pages.length, 12);
  assert.deepEqual(book.pages.map(page => page.text), source.pages.map(page => page.text));
  assert.equal(createHash("sha256").update(JSON.stringify(book.pages.map(page => page.text))).digest("hex"), MISSING_SANDWICH_MANUSCRIPT_SHA256);
  assert.deepEqual(validateScienceReadAloudManuscript(book), []);
  assert.equal(bookCollectionId(book), "meadow-pals");
  assert.ok(bookCollectionsForLevel([book], "READ_ALOUD").some(collection => collection.id === "meadow-pals"));
  assert.equal(new Set(book.pages.map(page => page.image)).size, 12);
  assert.notEqual(book.coverImage, book.pages[0].image);
});

test("shared science reading never claims independent placement or advances a graded level", () => {
  assert.equal(guidedReadingLevelLabel(source.level), "Read Together");
  assert.equal(applyGuidedReadingLevelOverride(source, { [source.id]: "A" }).level, "READ_ALOUD");
  assert.equal(classifyBookReadingPurpose(source, { anchorCycle: 27 }).label, "Read Together");
  assert.deepEqual(getGuidedReadingProgressionBooks({ book: source, books: [source] }), []);
  assert.equal(getGuidedReadingCompletionMilestone({ book: source, levelBooks: [source, { ...source, id: "other" }], records: { other: { completed: true } } }), null);
  const shelves = buildBookShelves({ books: [source], level: source.level });
  assert.equal(shelves[0].title, "Read Together");
  assert.match(shelves[0].note, /grown-up/);
  const measure = getGuidedReadingMeasure(source.level, source.readingBandProfile);
  assert.equal(measure.templateId, "shared-read-aloud");
  assert.ok(measure.maxLineMeasureCh >= 32);
});

test("a recent shared read-aloud does not replace the child's latest graded-reading placement", () => {
  const library = getRuntimeGuidedReadingBooks();
  const previousBook = library.find(book => book.level === "B");
  const recommendations = recommendBooksForStudent({
    books: library,
    readingHistory: {
      [previousBook.id]: { lastReadAt: "2026-09-12T12:00:00Z", completedPages: 2 },
      [source.id]: { lastReadAt: "2026-09-13T12:00:00Z", completedPages: 12 }
    }
  });
  assert.equal(recommendations[0].readingLevel, "B");
  assert.equal(recommendations[0].readingLevelSource, "saved-reading");
});

function narrationFixture(page) {
  return {
    bookId: page.bookId,
    pageNumber: page.pageNumber,
    displayedText: page.text,
    audioPath: page.pageAudioPath,
    audioSha256: "a".repeat(64),
    durationSeconds: 16,
    segments: expectedScienceSpeakerWords(page).map(({ word, speaker }) => ({
      text: word,
      speaker,
      voice: MEADOW_PALS_SCIENCE_VOICES[speaker],
      engine: MEADOW_PALS_SCIENCE_VOICE_ENGINES[speaker]
    }))
  };
}

test("exact narration resolves only when every word keeps its approved character voice", () => {
  for (const page of source.pages) {
    const record = narrationFixture(page);
    assert.deepEqual(validateScienceNarration(page, record), []);
    const manifest = { [`${source.id}::${page.pageNumber}`]: record };
    assert.equal(getMeadowPalsSciencePageNarration(page, manifest), record);
    assert.equal(getMeadowPalsSciencePageNarration({ ...page, text: `${page.text} Extra words.` }, manifest), null);
    assert.equal(getMeadowPalsSciencePageNarration(page, {}), null);
    const wrongSpeaker = structuredClone(record);
    const utterance = wrongSpeaker.segments.find(segment => segment.speaker === "MEADOW-MUDDY");
    utterance.speaker = "MEADOW-SPLASHY";
    utterance.voice = MEADOW_PALS_SCIENCE_VOICES[utterance.speaker];
    assert.ok(validateScienceNarration(page, wrongSpeaker).includes("speaker_assignment_mismatch"));
    const wrongVoice = structuredClone(record);
    wrongVoice.segments[0].voice = "unapproved-voice";
    assert.ok(validateScienceNarration(page, wrongVoice).includes("character_voice_mismatch"));
    const wrongEngine = structuredClone(record);
    wrongEngine.segments[0].engine = "unapproved-engine";
    assert.ok(validateScienceNarration(page, wrongEngine).includes("character_voice_mismatch"));
    assert.ok(validateScienceNarration(page, { ...record, audioSha256: "" }).includes("missing_audio_hash"));
    assert.ok(validateScienceNarration(page, { ...record, segments: record.segments.slice(1) }).includes("spoken_words_mismatch"));
  }
});

test("unregistered books cannot adopt the read-aloud contract to evade graded checks", () => {
  assert.ok(validateScienceReadAloudManuscript({ ...source, id: "unregistered" }).includes("unregistered shared-read-aloud book"));
  assert.ok(validateScienceReadAloudManuscript({ ...source, pages: source.pages.slice(1) }).includes("approved manuscript changed"));
  assert.ok(validateScienceReadAloudManuscript({ ...source, level: "A" }).includes("shared-reading placement changed"));
});

test("only Pffft replays the exact Muddy sound instead of Leda word speech", () => {
  const sound = {
    text: "pffft",
    voice: "Algieba",
    engine: "gemini-2.5-pro-tts",
    speaker: "MEADOW-MUDDY",
    kind: "character-sound-replay",
    audioPath: "/audio/production/en-US/meadow_science/missing-sandwich/words/pffft.mp3",
    audioSha256: "a".repeat(64),
    reusedFrom: {
      pageNumber: 10,
      segmentId: "page-10-02",
      audioPath: "/audio/production/en-US/meadow_science/missing-sandwich/page-10.mp3",
      audioSha256: "b".repeat(64)
    }
  };
  assert.equal(getMeadowPalsScienceWordAudioPath("Pffft", { pffft: sound }), sound.audioPath);
  assert.equal(getMeadowPalsScienceWordAudioPath("pffft", { pffft: { ...sound, voice: MEADOW_PALS_SCIENCE_VOICES.narrator } }), "");
  assert.equal(getMeadowPalsScienceWordAudioPath("pffft", { pffft: { ...sound, reusedFrom: { ...sound.reusedFrom, segmentId: "page-10-04" } } }), "");
  for (const word of new Set(source.pages.flatMap(page => expectedScienceSpeakerWords(page).map(entry => entry.word)))) {
    if (word === "pffft") continue;
    const claimedSound = { ...sound, text: word, audioPath: sound.audioPath.replace("pffft.mp3", `${word.replace(/[^a-z0-9]+/g, "-")}.mp3`) };
    assert.equal(getMeadowPalsScienceWordAudioPath(word, { [word]: claimedSound }), "", `${word} cannot use the character-sound exception`);
    assert.equal(getMeadowPalsScienceWordAudioPath(word, { [word]: { ...claimedSound, voice: MEADOW_PALS_SCIENCE_VOICES.narrator, engine: MEADOW_PALS_SCIENCE_VOICE_ENGINES.narrator } }), "", `${word} cannot retain sound-replay provenance with a narration label`);
  }
});

test("dialogue closing quotes stay with their sentence throughout the current library", () => {
  for (const book of getRuntimeGuidedReadingBooks()) {
    for (const page of book.pages) {
      const text = String(page.text || "");
      const parts = splitGuidedReadingSentences(text);
      assert.equal(parts.some(part => /^["”’']+$/.test(part)), false, `${book.id}:${page.pageNumber}`);
      assert.equal(parts.join(" ").replace(/\s+/g, " ").trim(), text.replace(/\s+/g, " ").trim(), `${book.id}:${page.pageNumber} preserves displayed text`);
    }
  }
});

test("shared science dialogue preserves every approved paragraph and spoken word", () => {
  for (const page of source.pages) {
    const paragraphs = splitGuidedReadingParagraphs(page.text);
    assert.deepEqual(paragraphs.map(sentences => sentences.join(" ")), page.text.split(/\n\s*\n/));
    assert.equal(paragraphs.flat().join(" "), splitGuidedReadingSentences(page.text).join(" "));
  }
});
