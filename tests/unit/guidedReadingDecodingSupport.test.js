import assert from "node:assert/strict";
import test from "node:test";

import {
  DECODING_SUPPORT_STAGES,
  appendDecodingSupportEvent,
  createDecodingSupportEvent,
  getNextDecodingSupportStep,
  normalizeDecodingSupportEvent
} from "../../src/utils/guidedReading/decodingSupport.js";

test("safe short-vowel words follow whole word, sounds, spelling, reread, then restart", () => {
  const whole = getNextDecodingSupportStep({ word: "cat" });
  const sounds = getNextDecodingSupportStep({ word: "cat", previousStage: whole.stage });
  const spelling = getNextDecodingSupportStep({ word: "cat", previousStage: sounds.stage });
  const reread = getNextDecodingSupportStep({ word: "cat", previousStage: spelling.stage });
  const restart = getNextDecodingSupportStep({ word: "cat", previousStage: reread.stage });

  assert.equal(whole.stage, DECODING_SUPPORT_STAGES.WHOLE_WORD_AUDIO);
  assert.equal(sounds.stage, DECODING_SUPPORT_STAGES.SEGMENTED_PHONEMES);
  assert.deepEqual(sounds.segments, ["c", "a", "t"]);
  assert.equal(sounds.hasCompletePhonemeAudio, true);
  assert.equal(sounds.phonemeAudioPaths.length, 3);
  assert.ok(sounds.phonemeAudioPaths.every(path => path.startsWith("/audio/")));
  assert.equal(spelling.stage, DECODING_SUPPORT_STAGES.LETTER_SPELLING);
  assert.deepEqual(spelling.letters, ["c", "a", "t"]);
  assert.equal(spelling.hasCompleteSpellingAudio, true);
  assert.equal(spelling.letterAudioPaths.length, 3);
  assert.equal(reread.stage, DECODING_SUPPORT_STAGES.REREAD_PROMPT);
  assert.equal(restart.stage, DECODING_SUPPORT_STAGES.WHOLE_WORD_AUDIO);
});

test("a single-letter word skips sound segmentation but still spells before rereading", () => {
  const whole = getNextDecodingSupportStep({ word: "a" });
  const spelling = getNextDecodingSupportStep({ word: "a", previousStage: whole.stage });
  const reread = getNextDecodingSupportStep({ word: "a", previousStage: spelling.stage });

  assert.equal(whole.stage, DECODING_SUPPORT_STAGES.WHOLE_WORD_AUDIO);
  assert.equal(spelling.stage, DECODING_SUPPORT_STAGES.LETTER_SPELLING);
  assert.equal(reread.stage, DECODING_SUPPORT_STAGES.REREAD_PROMPT);
});

test("ambiguous graphemes skip guessed phonemes and keep exact word plus spelling support", () => {
  for (const word of ["school", "book", "bread", "cow", "the", "circle", "giant", "character", "twitch"]) {
    const whole = getNextDecodingSupportStep({ word });
    const spelling = getNextDecodingSupportStep({ word, previousStage: whole.stage });
    assert.equal(spelling.stage, DECODING_SUPPORT_STAGES.LETTER_SPELLING, word);
    assert.equal(spelling.hasCompletePhonemeAudio, false, word);
    assert.equal(spelling.hasCompleteSpellingAudio, true, word);
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
  assert.match(copy, /spell/);
});
