import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CYCLE_PRACTICE_AUDIO_TEXTS,
  CYCLE_PRACTICE_FEEDBACK,
  CYCLE_PRACTICE_INSTRUCTIONS,
  getCyclePracticeFeedbackAudio,
  getCyclePracticeInstructionAudio,
  getCyclePracticeWordAudio,
  resolveCyclePracticeAudio
} from "../../src/components/cycle-practice/cyclePracticeAudio.js";
import { CYCLE_HFW_CONTEXTS, CYCLE_WORD_PARTS, buildCyclePracticePlan } from "../../src/components/cycle-practice/cyclePracticeContent.js";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { CYCLE_PRACTICE_AUDIO_METADATA } from "../../src/data/generated/cyclePracticeInstructionAudio.generated.js";
import { AUDIO_QUEST_PATHS } from "../../src/data/generated/audioQuestPaths.generated.js";
import { normalizeLedaAudioText } from "../../src/data/ledaProductionAudio.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("every live Cycle instruction, feedback and meaningful context has a committed exact recording", () => {
  const texts = [
    ...CYCLE_PRACTICE_AUDIO_TEXTS,
    ...Object.values(CYCLE_HFW_CONTEXTS).map(item => item.contextText),
    ...CYCLE_WORD_PARTS.flatMap(item => item.parts.map(removed => `Listen. ${item.word}. Take away ${removed}. Tap what is left.`))
  ];
  for (const text of texts) {
    const audio = getCyclePracticeInstructionAudio(text);
    assert.ok(audio, text);
    assert.ok(AUDIO_QUEST_PATHS.has(audio), `Audio manifest must admit ${text}`);
    const bytes = fs.readFileSync(path.join(root, "public", audio));
    assert.ok(bytes.length > 0, text);
    const metadata = CYCLE_PRACTICE_AUDIO_METADATA[normalizeLedaAudioText(text)];
    assert.equal(metadata.text, text);
    assert.equal(metadata.audio, audio);
    assert.equal(metadata.sha256, createHash("sha256").update(bytes).digest("hex"), text);
    assert.ok(metadata.durationSeconds > 0, text);
    assert.equal(metadata.humanListening, "unknown");
  }
});

test("short Cycle instructions ask for the exact action without reading, memory or submission", () => {
  for (const script of Object.values(CYCLE_PRACTICE_INSTRUCTIONS)) {
    assert.ok(script.split(/\s+/).length <= 13, script);
    assert.doesNotMatch(script, /\b(check|submit|remember|memory|gate|read|study|reveal)\b/i, script);
    assert.match(script, /\b(tap|follow|change|put)\b/i, script);
  }
  for (const key of Object.keys(CYCLE_PRACTICE_FEEDBACK)) assert.ok(getCyclePracticeFeedbackAudio(key), key);
  assert.equal(getCyclePracticeFeedbackAudio("not-an-authored-key"), "");
});

test("independent-check feedback describes moving on while practice feedback offers retry", () => {
  assert.equal(CYCLE_PRACTICE_FEEDBACK.notQuite, "Not quite. Let's try the next one.");
  assert.equal(CYCLE_PRACTICE_FEEDBACK.retry, "Try again. Listen carefully.");
  assert.ok(getCyclePracticeFeedbackAudio("notQuite"));
  assert.notEqual(getCyclePracticeFeedbackAudio("notQuite"), getCyclePracticeFeedbackAudio("retry"));
});

test("sound-picture instructions play the sound without announcing the correct picture", () => {
  for (const instructionKey of ["firstSound", "endingSound", "endingPart"]) {
    const audio = resolveCyclePracticeAudio({
      mechanicId: "pictureSound", instructionKey,
      soundAudio: "/audio/phonemes/s.mp3", audio: "/audio/answer-sun.mp3",
      choices: [
        { value: "sun", audio: "/audio/answer-sun.mp3" },
        { value: "cat", audio: "/audio/choice-cat.mp3" }
      ]
    });
    assert.equal(audio.instructionText, CYCLE_PRACTICE_INSTRUCTIONS[instructionKey]);
    assert.deepEqual(audio.targetAudio, ["/audio/phonemes/s.mp3"]);
    assert.deepEqual(audio.sequence, [audio.instructionAudio, "/audio/phonemes/s.mp3"]);
    assert.deepEqual(audio.choiceAudio, ["/audio/answer-sun.mp3", "/audio/choice-cat.mp3"]);
    assert.ok(!audio.sequence.includes("/audio/answer-sun.mp3"));
  }
});

test("missing sound targets remain unavailable instead of substituting the answer word", () => {
  const audio = resolveCyclePracticeAudio({ mechanicId: "pictureSound", audio: "/audio/answer.mp3" });
  assert.deepEqual(audio.targetAudio, []);
  assert.deepEqual(audio.sequence, [audio.instructionAudio]);
});

test("letter matching and tracing speak the sound and pictured anchor after the instruction", () => {
  for (const mechanicId of ["letterMatch", "letterTrace"]) {
    const audio = resolveCyclePracticeAudio({ mechanicId, soundAudio: "/audio/sound.mp3", audio: "/audio/word.mp3" });
    assert.deepEqual(audio.sequence, [audio.instructionAudio, "/audio/sound.mp3", "/audio/word.mp3"]);
  }
});

test("rhyming, spelling and sound sorting introduce the word after the action cue", () => {
  for (const mechanicId of ["rhymeMatch", "wordBuild", "soundSort"]) {
    const audio = resolveCyclePracticeAudio({ mechanicId, soundAudio: "/audio/unused.mp3", audio: "/audio/word.mp3" });
    assert.deepEqual(audio.sequence, [audio.instructionAudio, "/audio/word.mp3"]);
  }
});

test("case matching, heard-word matching and syllable beats speak the pictured word without an unrelated phoneme", () => {
  for (const [mechanicId, variant, instructionKey] of [
    ["letterMatch", "letterCase", "letterCase"],
    ["letterMatch", "wordListen", "listenWord"],
    ["soundSort", "syllableSort", "syllableSort"]
  ]) {
    const audio = resolveCyclePracticeAudio({ mechanicId, variant, instructionKey,
      audio: "/audio/picture-word.mp3", soundAudio: "/audio/unneeded-sound.mp3" });
    assert.equal(audio.instructionText, CYCLE_PRACTICE_INSTRUCTIONS[instructionKey]);
    assert.deepEqual(audio.sequence, [audio.instructionAudio, "/audio/picture-word.mp3"]);
  }
});

test("supported high-frequency word copying speaks its meaningful picture context", () => {
  for (const item of Object.values(CYCLE_HFW_CONTEXTS)) {
    const audio = resolveCyclePracticeAudio({ mechanicId: "wordBuild", instructionKey: "copyWord", contextText: item.contextText, audio: getCyclePracticeWordAudio(item.word) });
    assert.equal(audio.instructionText, CYCLE_PRACTICE_INSTRUCTIONS.copyWord);
    assert.ok(audio.contentAudio, item.word);
    assert.deepEqual(audio.sequence, [audio.instructionAudio, audio.contentAudio, getCyclePracticeWordAudio(item.word)]);
  }
});

test("one-sound word changes speak the starting word before the new word", () => {
  const audio = resolveCyclePracticeAudio({
    mechanicId: "wordBuild", variant: "wordChange", instructionKey: "wordChange",
    beforeAudio: "/audio/before.mp3", audio: "/audio/after.mp3"
  });
  assert.equal(audio.instructionText, CYCLE_PRACTICE_INSTRUCTIONS.wordChange);
  assert.deepEqual(audio.targetAudio, ["/audio/before.mp3", "/audio/after.mp3"]);
  assert.deepEqual(audio.sequence, [audio.instructionAudio, "/audio/before.mp3", "/audio/after.mp3"]);
});

test("compound deletion speaks the whole word and removed part without revealing the answer", () => {
  for (const item of CYCLE_WORD_PARTS) {
    for (const removed of item.parts) {
      const instructionText = `Listen. ${item.word}. Take away ${removed}. Tap what is left.`;
      const audio = resolveCyclePracticeAudio({ mechanicId: "wordBuild", variant: "wordParts", instructionText, audio: getCyclePracticeWordAudio(item.word), removedAudio: getCyclePracticeWordAudio(removed) });
      assert.equal(audio.instructionText, instructionText);
      assert.ok(audio.instructionAudio, instructionText);
      assert.deepEqual(audio.sequence, [audio.instructionAudio]);
      assert.deepEqual(audio.targetAudio, []);
      for (const word of [item.word, ...item.parts]) {
        assert.ok(getCyclePracticeWordAudio(word), word);
        assert.ok(fs.existsSync(path.join(root, "public", getCyclePracticeWordAudio(word))), word);
      }
    }
  }
});

test("unknown and legacy mechanics fail closed without misleading instruction audio", () => {
  for (const mechanicId of ["wordWindow", "soundGate", "unknown-mechanic"]) {
    const audio = resolveCyclePracticeAudio({ mechanicId, instructionKey: "firstSound", audio: "/audio/word.mp3", soundAudio: "/audio/sound.mp3" });
    assert.equal(audio.instructionText, "");
    assert.equal(audio.instructionAudio, "");
    assert.deepEqual(audio.sequence, []);
  }
});

test("authored practice and independent checks resolve instructions plus the actual target across cycles", () => {
  const seen = new Set();
  for (const cycle of elSkillsBlockCycles.filter(item => item.cycleNumber)) {
    for (const check of [false, true]) {
      for (let pass = 0; pass < 4; pass += 1) {
        const { rounds } = buildCyclePracticePlan(cycle, "cycle-audio-regression", pass, check);
        for (const round of rounds) {
          const audio = resolveCyclePracticeAudio(round);
          seen.add(round.mechanicId);
          assert.ok(audio.instructionText, round.id);
          assert.ok(audio.instructionAudio, round.id);
          assert.equal(audio.sequence[0], audio.instructionAudio, round.id);
          if (round.variant !== "wordParts") assert.ok(audio.targetAudio.length, round.id);
          if (round.contextText) assert.ok(audio.contentAudio, round.id);
          for (const source of [...audio.sequence, ...audio.choiceAudio]) {
            assert.ok(AUDIO_QUEST_PATHS.has(source), `${round.id}: ${source}`);
            assert.ok(fs.existsSync(path.join(root, "public", source)), `${round.id}: ${source}`);
          }
        }
      }
    }
  }
  assert.deepEqual([...seen].sort(), ["pictureSound", "letterMatch", "rhymeMatch", "wordBuild", "soundSort", "letterTrace"].sort());
});
