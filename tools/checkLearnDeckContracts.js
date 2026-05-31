#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const failures = [];

function fail(message) {
  failures.push(message);
}

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function requireFile(path) {
  if (!existsSync(new URL(`../${path}`, import.meta.url))) fail(`${path} is missing.`);
}

function requireIncludes(source, needle, label) {
  if (!source.includes(needle)) fail(label);
}

[
  "src/data/learnDecks.js",
  "src/components/LearnDeckPlayer.jsx",
  "src/components/LearnDeckInteractionLayer.jsx",
  "src/components/learn/TurnCardReveal.jsx",
  "src/components/learn/SortCardsGame.jsx",
  "src/components/learn/WordWallGame.jsx",
  "src/components/learn/SoundSafariGame.jsx",
  "docs/implementation/teacher_created_interactive_learn_decks.md"
].forEach(requireFile);

const learnDecksSource = read("src/data/learnDecks.js");
const playerSource = read("src/components/LearnDeckPlayer.jsx");
const layerSource = read("src/components/LearnDeckInteractionLayer.jsx");
const learnAreaSource = read("src/components/LearnAreaPage.jsx");
const cssSource = read("src/App.css");
const interactionSources = [
  "src/components/learn/TurnCardReveal.jsx",
  "src/components/learn/SortCardsGame.jsx",
  "src/components/learn/WordWallGame.jsx",
  "src/components/learn/SoundSafariGame.jsx",
  "src/components/learn/LearnCardMedia.jsx"
].map(read).join("\n");
const allSources = [learnDecksSource, playerSource, layerSource, learnAreaSource, cssSource, interactionSources].join("\n");

[
  "cycle-01-lesson-01",
  "cycle-01-lesson-02",
  "cycle-01-lesson-03",
  "pptxDownload",
  "turn-card-reveal",
  "sort-cards",
  "word-wall",
  "sound-safari",
  "teacherLinks",
  "getLearnDecksForCycle",
  "countInteractiveSlides"
].forEach(needle => requireIncludes(learnDecksSource, needle, `learnDecks.js is missing ${needle}.`));

[
  "Teacher-Created Interactive Deck",
  "Previous",
  "Next",
  "Exit Lesson",
  "Slide {slideIndex + 1} of {slides.length}",
  "object-fit",
  "learn-deck-image-placeholder",
  "learn-deck-teacher-links",
  "LearnDeckInteractionLayer"
].forEach(needle => requireIncludes(playerSource + cssSource, needle, `LearnDeckPlayer contract is missing ${needle}.`));

[
  "TurnCardReveal",
  "SortCardsGame",
  "WordWallGame",
  "SoundSafariGame",
  "slide.type === \"image\""
].forEach(needle => requireIncludes(layerSource, needle, `LearnDeckInteractionLayer is missing ${needle}.`));

[
  "Teacher-Created ${cycle.title} Slide Packs",
  "Open Lesson",
  "Download PPTX",
  "download href",
  "PPTX download-only",
  "LearnDeckPlayer"
].forEach(needle => requireIncludes(learnAreaSource, needle, `LearnAreaPage is missing ${needle}.`));

[
  "new Audio",
  "Reset",
  "Reveal Answers",
  "gentle-shake",
  "learn-card-image-fallback"
].forEach(needle => requireIncludes(allSources, needle, `Interactive deck implementation is missing ${needle}.`));

if (/\bautoPlay\s*=|\bautoplay\s*=/.test(allSources)) {
  fail("Learn decks must not autoplay media.");
}

if (/<iframe|officeapps|view\.officeapps|docs\.google\.com\/presentation/i.test(allSources)) {
  fail("Learn decks must not use external PPT/PPTX viewers or embeds.");
}

if (/\.pptx["'][^>]*(iframe|embed|object)/i.test(allSources)) {
  fail("PPTX files must be download-only, not rendered in browser.");
}

if (failures.length) {
  console.error("Learn deck contract failures:");
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log("Learn deck contracts passed.");
