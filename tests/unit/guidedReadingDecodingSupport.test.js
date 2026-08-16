import assert from "node:assert/strict";
import test from "node:test";

import { guidedReadingBooks } from "../../src/data/guidedReadingBooks.js";
import {
  DECODING_SUPPORT_STAGES,
  appendDecodingSupportEvent,
  createDecodingSupportEvent,
  getRecordedSoundSequence,
  getNextDecodingSupportStep,
  normalizeDecodingSupportEvent
} from "../../src/utils/guidedReading/decodingSupport.js";

test("safe short-vowel words follow whole word, sounds, reread, then restart", () => {
  const whole = getNextDecodingSupportStep({ word: "cat" });
  const sounds = getNextDecodingSupportStep({ word: "cat", previousStage: whole.stage });
  const reread = getNextDecodingSupportStep({ word: "cat", previousStage: sounds.stage });
  const restart = getNextDecodingSupportStep({ word: "cat", previousStage: reread.stage });

  assert.equal(whole.stage, DECODING_SUPPORT_STAGES.WHOLE_WORD_AUDIO);
  assert.equal(sounds.stage, DECODING_SUPPORT_STAGES.SEGMENTED_PHONEMES);
  assert.deepEqual(sounds.segments, ["c", "a", "t"]);
  assert.equal(sounds.hasCompletePhonemeAudio, true);
  assert.equal(sounds.phonemeAudioPaths.length, 3);
  assert.ok(sounds.phonemeAudioPaths.every(path => path.startsWith("/audio/")));
  assert.equal(reread.stage, DECODING_SUPPORT_STAGES.REREAD_PROMPT);
  assert.equal(restart.stage, DECODING_SUPPORT_STAGES.WHOLE_WORD_AUDIO);
});

test("a single-letter word uses visual spelling without playing a letter name", () => {
  const whole = getNextDecodingSupportStep({ word: "a" });
  const spelling = getNextDecodingSupportStep({ word: "a", previousStage: whole.stage });
  const reread = getNextDecodingSupportStep({ word: "a", previousStage: spelling.stage });

  assert.equal(whole.stage, DECODING_SUPPORT_STAGES.WHOLE_WORD_AUDIO);
  assert.equal(spelling.stage, DECODING_SUPPORT_STAGES.LETTER_SPELLING);
  assert.deepEqual(spelling.letterAudioPaths, []);
  assert.equal(spelling.hasCompleteSpellingAudio, false);
  assert.equal(reread.stage, DECODING_SUPPORT_STAGES.REREAD_PROMPT);
});

test("ambiguous graphemes skip guessed phonemes and keep exact visual spelling support", () => {
  for (const word of ["school", "book", "bread", "cow", "the", "circle", "giant", "character", "twitch"]) {
    const whole = getNextDecodingSupportStep({ word });
    const spelling = getNextDecodingSupportStep({ word, previousStage: whole.stage });
    assert.equal(spelling.stage, DECODING_SUPPORT_STAGES.LETTER_SPELLING, word);
    assert.equal(spelling.hasCompletePhonemeAudio, false, word);
    assert.equal(spelling.hasCompleteSpellingAudio, false, word);
    assert.deepEqual(spelling.letterAudioPaths, [], word);
    assert.doesNotMatch(spelling.message, /spell /i, word);
  }
});

test("regular final s uses its contextual sound rather than the letter name", () => {
  const runs = getRecordedSoundSequence("runs");
  const cats = getRecordedSoundSequence("cats");

  assert.equal(runs.hasCompleteAudio, true);
  assert.deepEqual(runs.segments, ["r", "u", "n", "s"]);
  assert.equal(runs.audioPaths.at(-1), "/audio/phonemes/z.mp3");
  assert.equal(cats.hasCompleteAudio, true);
  assert.deepEqual(cats.segments, ["c", "a", "t", "s"]);
  assert.equal(cats.audioPaths.at(-1), "/audio/phonemes/s.mp3");
  assert.ok([...runs.audioPaths, ...cats.audioPaths].every(path => !path.includes("/letter_name/")));

  const whole = getNextDecodingSupportStep({ word: "runs" });
  const sounds = getNextDecodingSupportStep({ word: "runs", previousStage: whole.stage });
  const reread = getNextDecodingSupportStep({ word: "runs", previousStage: sounds.stage });
  assert.equal(sounds.stage, DECODING_SUPPORT_STAGES.SEGMENTED_PHONEMES);
  assert.equal(sounds.stageNumber, 2);
  assert.equal(sounds.totalStages, 3);
  assert.equal(reread.stage, DECODING_SUPPORT_STAGES.REREAD_PROMPT);
});

test("the complete Guided Reading catalogue never uses letter-name audio as decoding support", () => {
  const words = new Set(
    guidedReadingBooks.flatMap(book =>
      book.pages.flatMap(page => String(page.text || "").match(/[a-z]+/gi) || [])
    )
  );
  assert.ok(words.size > 2_000);

  for (const word of words) {
    const whole = getNextDecodingSupportStep({ word });
    const support = getNextDecodingSupportStep({ word, previousStage: whole.stage });
    const paths = [...support.phonemeAudioPaths, ...support.letterAudioPaths];
    assert.ok(paths.every(path => !path.includes("/letter_name/")), word);
  }
});

test("support events normalize, de-duplicate by identity, and retain the newest 300", () => {
  const first = createDecodingSupportEvent({
    eventId: "support-1",
    stage: DECODING_SUPPORT_STAGES.WHOLE_WORD_AUDIO,
    word: "night",
    wordIndex: 2,
    pageNumber: 1,
    occurredAt: "2026-07-24T10:00:00.000Z",
    segments: ["n", "igh", "t"],
    audioAvailable: true
  });
  const replaced = { ...first, occurredAt: "2026-07-24T10:01:00.000Z" };
  const deduped = appendDecodingSupportEvent([first], replaced);

  assert.equal(deduped.length, 1);
  assert.equal(deduped[0].occurredAt, "2026-07-24T10:01:00.000Z");
  assert.equal(deduped[0].stageLabel, "Whole-word audio");

  const many = Array.from({ length: 305 }, (_, index) => ({
    ...first,
    eventId: `support-${index + 1}`
  }));
  const capped = appendDecodingSupportEvent(many, {
    ...first,
    eventId: "support-final",
    stage: DECODING_SUPPORT_STAGES.REREAD_PROMPT
  });
  assert.equal(capped.length, 300);
  assert.equal(capped.at(-1).eventId, "support-final");
});

test("invalid events are rejected and instructional copy never cues guessing", () => {
  assert.equal(normalizeDecodingSupportEvent({ stage: "picture_hint", word: "ship" }), null);

  const steps = [
    getNextDecodingSupportStep({ word: "night" }),
    getNextDecodingSupportStep({ word: "night", previousStage: DECODING_SUPPORT_STAGES.WHOLE_WORD_AUDIO }),
    getNextDecodingSupportStep({ word: "night", previousStage: DECODING_SUPPORT_STAGES.LETTER_SPELLING })
  ];
  const copy = steps.map(step => step.message).join(" ").toLowerCase();
  assert.doesNotMatch(copy, /picture|context|guess|illustration/);
  assert.match(copy, /look at night/);
});
