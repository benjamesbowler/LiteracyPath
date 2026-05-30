#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { elSkillsBlockCycles } from "../src/data/elSkillsBlockCycles.js";

const failures = [];
const priorityCycles = [1, 8, 15, 23];

function fail(message) {
  failures.push(message);
}

function cycle(number) {
  const found = elSkillsBlockCycles.find(item => item.cycleNumber === number);
  if (!found) fail(`Cycle ${number} is missing.`);
  return found;
}

function wordsFromCards(cycleData) {
  return (cycleData?.sections?.letterLearning?.cards || []).flatMap(card => card.examples || []);
}

function requireIncludes(values, expected, label) {
  expected.forEach(item => {
    if (!values.includes(item)) fail(`${label} is missing ${item}.`);
  });
}

function requireGameQuality(cycleData) {
  const games = cycleData.sections?.games || [];
  if (games.length < 4) fail(`${cycleData.title} needs at least four playable games.`);
  games.forEach(game => {
    ["title", "prompt", "teacherInstruction", "studentAction", "answer", "supportPrompt", "challengePrompt"].forEach(field => {
      if (!game[field]) fail(`${cycleData.title} game "${game.title || game.id}" is missing ${field}.`);
    });
    if (!Array.isArray(game.cards) || game.cards.length < 2) {
      fail(`${cycleData.title} game "${game.title || game.id}" needs playable cards.`);
    }
    if (!Array.isArray(game.targetItems) || game.targetItems.length < 1) {
      fail(`${cycleData.title} game "${game.title || game.id}" needs targetItems.`);
    }
  });
}

function requirePoemQuality(cycleData) {
  const poem = cycleData.sections?.poemAndChant;
  if (!poem?.title) fail(`${cycleData.title} poem is missing a title.`);
  if (!Array.isArray(poem?.lines) || poem.lines.length < 4 || poem.lines.length > 8) {
    fail(`${cycleData.title} poem should have 4-8 short lines.`);
  }
  (poem?.lines || []).forEach(line => {
    if (line.length > 42) fail(`${cycleData.title} poem line is too long: ${line}`);
  });
  if (!poem?.rhythm) fail(`${cycleData.title} poem needs a movement or rhythm cue.`);
  if (!Array.isArray(poem?.callAndResponse) || poem.callAndResponse.length < 2) {
    fail(`${cycleData.title} needs call-and-response practice.`);
  }
}

function requireResourceQuality(cycleData) {
  const clayMat = cycleData.sections?.clayMat;
  const vocabularyMat = cycleData.sections?.vocabularyMat;
  const worksheetTasks = cycleData.sections?.worksheets?.tasks?.["cycle worksheet pack"] || [];

  if (!clayMat?.title || !Array.isArray(clayMat.sections) || clayMat.sections.length < 2) {
    fail(`${cycleData.title} needs a printable clay mat with multiple sections.`);
  }
  (clayMat?.sections || []).forEach(section => {
    if (!section.outline || !Array.isArray(section.picturePrompts) || section.picturePrompts.length < 2 || !Array.isArray(section.handwriting)) {
      fail(`${cycleData.title} clay mat section "${section.label}" is incomplete.`);
    }
  });

  if (!vocabularyMat?.title || !Array.isArray(vocabularyMat.groups) || vocabularyMat.groups.length < 3) {
    fail(`${cycleData.title} needs a grouped vocabulary mat.`);
  }
  (vocabularyMat?.groups || []).forEach(group => {
    if (!group.label || !Array.isArray(group.words) || group.words.length < 2) {
      fail(`${cycleData.title} vocabulary group "${group.label}" is too thin.`);
    }
  });

  if (worksheetTasks.length < 6) {
    fail(`${cycleData.title} needs at least six concrete worksheet tasks.`);
  }
}

function requireVideoPolicy(cycleData) {
  const resources = cycleData.sections?.videoResources || [];
  if (!resources.length) fail(`${cycleData.title} needs teacher-controlled video search cards.`);
  resources.forEach(resource => {
    if (!resource.query || /https?:|youtube\.com\/watch|youtu\.be|embed|autoplay/i.test(resource.query)) {
      fail(`${cycleData.title} video resource must be a search query only: ${resource.label || "unnamed"}.`);
    }
  });
}

function requireNoExternalImages() {
  const source = readFileSync(new URL("../src/components/LearnAreaPage.jsx", import.meta.url), "utf8");
  if (/img\s+[^>]*src=["']https?:\/\//.test(source)) {
    fail("Learn Area UI hotlinks an external image.");
  }
}

const cycle1 = cycle(1);
const cycle8 = cycle(8);
const cycle15 = cycle(15);
const cycle23 = cycle(23);

if (cycle1) {
  const focusSpellings = cycle1.focusLetters.map(card => card.spelling);
  requireIncludes(focusSpellings, ["a", "m"], "Cycle 1 focus spellings");
  if (focusSpellings.includes("am")) fail("Cycle 1 must not treat HFW am as the phonics focus.");
  requireIncludes(cycle1.highFrequencyWords, ["am", "I"], "Cycle 1 HFW");
  requireIncludes(wordsFromCards(cycle1), ["apple", "ant", "alligator", "moon", "mouse", "map"], "Cycle 1 word bank");
  if (!/separate/i.test(cycle1.teacherGoal || "")) fail("Cycle 1 teacher goal must explicitly keep sounds and HFW separate.");
}

if (cycle8) {
  requireIncludes(cycle8.focusLetters.map(card => card.spelling), ["b", "w"], "Cycle 8 focus spellings");
  requireIncludes(cycle8.highFrequencyWords, ["not", "that"], "Cycle 8 HFW");
  requireIncludes(wordsFromCards(cycle8), ["bear", "ball", "bat", "book", "wolf", "watch", "watermelon", "wave"], "Cycle 8 word bank");
  const chainText = JSON.stringify(cycle8.sections?.decoding || {});
  if (!chainText.includes("wit") || !chainText.includes("mad")) fail("Cycle 8 needs the teacher-led wit -> bit -> bat -> mat -> mad chain.");
}

if (cycle15) {
  requireIncludes(cycle15.focusLetters.map(card => card.spelling), ["sh", "ch", "th"], "Cycle 15 focus patterns");
  requireIncludes(cycle15.highFrequencyWords, ["good", "look"], "Cycle 15 HFW");
  requireIncludes(wordsFromCards(cycle15), ["ship", "sheep", "shop", "chip", "chair", "cheese", "thumb", "three", "teeth"], "Cycle 15 word bank");
}

if (cycle23) {
  requireIncludes(cycle23.focusLetters.map(card => card.spelling), ["ng", "ang", "ing", "ong", "ung"], "Cycle 23 focus patterns");
  requireIncludes(cycle23.highFrequencyWords, ["only", "other"], "Cycle 23 HFW");
  requireIncludes(JSON.stringify(cycle23.sections?.decoding || {}).split(/[^a-z]+/), ["ring", "sing", "king", "bang", "sang", "rang", "song", "long", "gong", "sung", "hung", "rung"], "Cycle 23 rime-family building");
}

priorityCycles.map(cycle).filter(Boolean).forEach(cycleData => {
  requirePoemQuality(cycleData);
  requireGameQuality(cycleData);
  requireResourceQuality(cycleData);
  requireVideoPolicy(cycleData);
});

if (!existsSync(new URL("../docs/implementation/el_learn_area_content_quality_audit.md", import.meta.url))) {
  fail("Content quality audit document is missing.");
}

if (!existsSync(new URL("../docs/assets/kimi_learn_area_missing_visuals_request.md", import.meta.url))) {
  fail("Missing visuals request document is missing.");
}

requireNoExternalImages();

if (failures.length) {
  console.error("Learn Area content quality failures:");
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log("Learn Area content quality passed.");
console.log(`Priority cycles checked: ${priorityCycles.join(", ")}`);
