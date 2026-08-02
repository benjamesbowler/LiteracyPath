import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { LETTER_STROKES } from "../../src/data/letterStrokes.js";
import { plainEnglishSoundText } from "../../src/utils/childFacingText.js";

const PHONEME_SLASH_NOTATION = /\/([A-Za-zăĕĭŏŭæɑɒʌəɛɪɔʊʃʒθðŋɜɚɝː]{1,8})\//;

test("child-facing sound copy uses plain English instead of slash notation", () => {
  assert.equal(plainEnglishSoundText("I can hear /ă/ and /m/."), "I can hear short a and m.");
  assert.equal(plainEnglishSoundText("Try /th/ and /TH/."), "Try th and th in this.");
});

test("the complete Skills Block programme contains no child-visible phoneme notation", () => {
  const renderedProgramme = JSON.stringify(elSkillsBlockCycles);
  assert.doesNotMatch(renderedProgramme, PHONEME_SLASH_NOTATION);
  assert.doesNotMatch(renderedProgramme, /[ăĕĭŏŭ]/);
});

test("app letter models use the school-style font token", () => {
  const appStyles = readFileSync("src/App.css", "utf8");
  const phonicsStyles = readFileSync("src/styles/phonics.css", "utf8");
  const questStyles = readFileSync("src/styles/skills-block-quest.css", "utf8");
  assert.match(appStyles, /--lp-font-letter:\s*"Fredoka"/);
  assert.match(phonicsStyles, /--phonics-font-letter:\s*var\(--lp-font-letter/);
  assert.match(phonicsStyles, /\.phonics-letter-symbol[\s\S]*?var\(--phonics-font-letter\)/);
  assert.match(phonicsStyles, /\.cvc-sound-tile,[\s\S]*?var\(--phonics-font-letter\)/);
  assert.match(questStyles, /\.sbq-answer-grid\.letters button[\s\S]*?var\(--lp-font-letter/);
});

test("letter tracing uses manuscript single-storey a and g paths", () => {
  assert.equal(LETTER_STROKES.a.length, 2);
  assert.match(LETTER_STROKES.a.join(" "), /C58 62 26 60/);
  assert.match(LETTER_STROKES.g.join(" "), /L66 118 C66 138/);
});
