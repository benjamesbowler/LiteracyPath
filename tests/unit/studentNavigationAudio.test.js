import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  STUDENT_HOME_ACTIVITY_TITLES,
  STUDENT_HOME_COPY,
  homeHeroInstruction,
  studentBookPanelAudioText
} from "../../src/copy/studentNavigationCopy.js";
import { normalizeLedaAudioText } from "../../src/data/normalizeLedaAudioText.js";
import {
  getLedaInstructionAudioPath,
  getLedaWordAudioPath,
  normalizeLedaAudioText as fullCatalogueNormalizer
} from "../../src/data/ledaProductionAudio.js";
import { STUDENT_NAVIGATION_AUDIO } from "../../src/data/generated/studentNavigationAudio.generated.js";
import { GUIDED_READING_BOOK_INDEX } from "../../src/data/generated/guidedReadingBookIndex.generated.js";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";
import { GAME_LIST } from "../../src/data/learnGamesData.js";
import { QUEST_STOPS } from "../../src/data/questSequence.js";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { selectStudentHomeRecommendation } from "../../src/policy/learningPolicy.js";
import {
  STUDENT_RAIL_HOME,
  STUDENT_RAIL_DESTINATIONS,
  STUDENT_TAB_BAR,
  speakStudentRailLabel
} from "../../src/policy/studentRailPolicy.js";
import {
  buildShellAudioSources,
  getStudentNavigationAudioTexts,
  STUDENT_LOGIN_VOICE_LINES
} from "../../tools/generateShellAudioPaths.mjs";
import { STUDENT_LOGIN_VOICE_AUDIO } from "../../src/data/generated/shellAudioPaths.generated.js";

function originalPath(text) {
  const label = String(text || "").trim();
  return getLedaInstructionAudioPath(label) || getLedaWordAudioPath(label);
}

function audioBrowser({ rejectFirst = false, throwFirst = false } = {}) {
  const played = [];
  const instances = [];
  return {
    played,
    instances,
    Audio: class {
      constructor(src) {
        if (throwFirst && !instances.length) {
          instances.push(null);
          throw new Error("Audio unavailable");
        }
        this.src = src;
        this.listeners = {};
        instances.push(this);
      }
      addEventListener(name, listener) { this.listeners[name] = listener; }
      play() {
        played.push(this.src);
        return rejectFirst && played.length === 1
          ? Promise.reject(new Error("Playback unavailable"))
          : Promise.resolve();
      }
    }
  };
}

function livePhraseCases() {
  const cases = [
    ...[STUDENT_RAIL_HOME, ...STUDENT_RAIL_DESTINATIONS, ...STUDENT_TAB_BAR].map(item => item.label),
    ...Object.values(STUDENT_HOME_ACTIVITY_TITLES),
    ...[undefined, { label: "New" }, { label: "Teacher picked" }, { label: "Continue" }].map(homeHeroInstruction),
    STUDENT_HOME_COPY.explore,
    STUDENT_HOME_COPY.unreadableProgress,
    STUDENT_HOME_COPY.phonicsStop,
    STUDENT_HOME_COPY.storiesStop,
    STUDENT_HOME_COPY.hollowStop,
    selectStudentHomeRecommendation({ activities: [] }).childReason
  ];
  for (const stop of QUEST_STOPS) cases.push(STUDENT_HOME_COPY.soundStop(stop.index, stop.name));
  for (const cycle of elSkillsBlockCycles.filter(item => item.cycleNumber)) {
    cases.push(STUDENT_HOME_COPY.mapStop(cycle.cycleNumber));
  }
  for (const book of GUIDED_READING_BOOK_INDEX) cases.push(STUDENT_HOME_COPY.bookStop(book.title));
  for (const game of GAME_LIST) cases.push(STUDENT_HOME_COPY.gameStop(game.title));
  cases.push(STUDENT_HOME_COPY.bookStop(STUDENT_HOME_COPY.fallbackBookTitle));
  cases.push(STUDENT_HOME_COPY.gameStop(STUDENT_HOME_COPY.fallbackGameTitle));
  for (const book of getRuntimeGuidedReadingBooks()) {
    for (const resuming of [false, true]) cases.push(studentBookPanelAudioText(resuming, book.title));
  }
  return [...new Set(cases)];
}

test("shared navigation copy retains the displayed Home and Books wording", () => {
  assert.deepEqual([
    homeHeroInstruction(),
    homeHeroInstruction({ label: "Continue" }),
    homeHeroInstruction({ label: "Teacher picked" }),
    STUDENT_HOME_COPY.soundStop(12, "Windy Bridge"),
    STUDENT_HOME_COPY.mapStop(27),
    STUDENT_HOME_COPY.bookStop("Bob's Hat"),
    STUDENT_HOME_COPY.gameStop("Word Builder"),
    studentBookPanelAudioText(false, "Bob's Hat"),
    studentBookPanelAudioText(true, "Bob's Hat"),
    STUDENT_HOME_COPY.fallbackBookTitle,
    STUDENT_HOME_COPY.fallbackGameTitle
  ], [
    "Start here", "Carry on where you stopped", "Your teacher picked this",
    "Stop 12 — Windy Bridge", "Stop 27 on the map", "Your book — Bob's Hat",
    "Your game — Word Builder", "Start here. Bob's Hat.", "You stopped here. Bob's Hat.",
    "Pick a book", "Play a game"
  ]);
});

test("every current navigation, Home and Books phrase keeps canonical resolution and immediate playback", () => {
  const generatedTexts = new Set(getStudentNavigationAudioTexts());
  for (const text of livePhraseCases()) {
    assert.ok(generatedTexts.has(text), `Generator omitted live copy: ${text}`);
    const browser = audioBrowser();
    const expectedPath = originalPath(text);
    const spoken = speakStudentRailLabel(text, browser);
    assert.equal(spoken, Boolean(expectedPath), text);
    // No awaited import, media fetch or microtask may move the first play()
    // outside this call. iPad Safari needs it inside the child's tap gesture.
    assert.deepEqual(browser.played, expectedPath ? [expectedPath] : [], text);
  }
});

test("all recorded labels use the same normalization, voice and role precedence", () => {
  assert.equal(normalizeLedaAudioText, fullCatalogueNormalizer);
  const expected = Object.fromEntries(getStudentNavigationAudioTexts()
    .filter(text => originalPath(text))
    .map(text => [normalizeLedaAudioText(text.trim()), originalPath(text)]));
  assert.deepEqual({ ...STUDENT_NAVIGATION_AUDIO }, expected);
  for (const text of ["Home", "Sound Seekers", "Phonics", "Adventure Map", "Books", "Story Quests", "Arcade", "My Hollow", "Sounds", "Games", "Hollow", "Letters"]) {
    assert.ok(originalPath(text), text);
    for (const variant of [text, `  ${text.toUpperCase()}?!  `, `HFW:${text}.`, text.replaceAll(" ", "\u00a0")]) {
      const browser = audioBrowser();
      assert.equal(speakStudentRailLabel(variant, browser), true, variant);
      assert.deepEqual(browser.played, [originalPath(variant)], variant);
    }
  }
  for (const [key, text] of Object.entries(STUDENT_LOGIN_VOICE_LINES)) {
    assert.equal(STUDENT_LOGIN_VOICE_AUDIO[key], originalPath(text), key);
  }
});

test("navigation queues keep order and advance only once after ended/error events", () => {
  const browser = audioBrowser();
  assert.equal(speakStudentRailLabel(["", "No recording for this phrase", "Books", "Home"], browser), true);
  assert.deepEqual(browser.played, [originalPath("Books")]);
  browser.instances[0].listeners.ended();
  browser.instances[0].listeners.error();
  assert.deepEqual(browser.played, [originalPath("Books"), originalPath("Home")]);
});

test("a failed cue still advances without waiting for a new tap", async () => {
  const rejected = audioBrowser({ rejectFirst: true });
  assert.equal(speakStudentRailLabel(["Books", "Home"], rejected), true);
  await Promise.resolve();
  rejected.instances[0].listeners.error();
  assert.deepEqual(rejected.played, [originalPath("Books"), originalPath("Home")]);

  const unavailable = audioBrowser({ throwFirst: true });
  assert.equal(speakStudentRailLabel(["Books", "Home"], unavailable), true);
  assert.deepEqual(unavailable.played, [originalPath("Home")]);
  assert.equal(speakStudentRailLabel("Books", {}), false);
});

test("both shell audio projections are fresh and every selected recording exists", () => {
  // The builder uses the canonical resolver and checks non-empty files. This
  // fails when live copy, source titles or canonical recording precedence
  // changes without regeneration; it never rewrites files during the test.
  for (const [file, expected] of Object.entries(buildShellAudioSources())) {
    assert.equal(fs.readFileSync(file, "utf8"), expected, `${file}: run node tools/generateShellAudioPaths.mjs`);
  }
});
