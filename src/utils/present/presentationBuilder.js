// Whole-class Present lessons and classroom resources. The same assembly owns
// the lesson metadata and projector document.
// One daily 15–20 minute lesson follows the Present weekday sequence. Notes are extracted
// before projection, and every projected asset uses an absolute same-origin URL.
// The stage is authored at 1920x1080; the external CSP-safe runtime scales it.
import { elSkillsBlockCycles, LETTER_EXAMPLES } from "../../data/elSkillsBlockCycles.js";
import { graphemeAudioPath, wordAudioPath } from "../../components/elQuest/elQuestEngine.js";
import { childWordAssets, getChildWordAsset } from "../../data/childAssets.js";
import { bookCharacterAsset } from "../../components/quest/bookCharacterAvatar.js";
import { initialSoundWordBank } from "../../content/initialSounds/initialSoundWordBank.js";

import { themeWorldForCycle } from "../../utils/palWorlds.js";
import { LETTER_STROKES, LETTER_GUIDES } from "../../data/letterStrokes.js";
import { openHtmlDocument } from "../openHtmlDocument.js";
import { PRESENT_VOCABULARY } from "../../data/presentVocabulary.js";
import { THREE_SYLLABLE_BANK, getPresentHfwTeaching, PRESENT_SORT_ACTIVITIES } from "../../data/presentTeachingContent.js";
import { dailyPresentReading, presentGameSchedule } from "../../data/presentDailyReading.js";
import { buildPresentClassGames, PRESENT_CLASS_GAMES_CSS } from "./presentationClassGames.js";
import { buildPresentActivityViews } from "./presentationActivities.js";
import { PHONEME_RECORDING_TARGETS } from "../../data/phonemeRecordingSpec.js";
import { getApprovedPhonemeAudioPath } from "../../data/approvedPhonemeAudio.js";
import { PRESENT_NARRATION_AUDIO, PRESENT_NARRATION_METADATA } from "../../data/generated/presentNarration.generated.js";
import { getLedaInstructionAudioPath, normalizeLedaAudioText } from "../../data/ledaProductionAudio.js";
import { PRESENT_AIR_WRITING_READY_COPY } from "../../copy/presentLearningCopy.js";
import {
  cycleOptionLabel,
  cycleTopic,
  humanizePhase,
  isFluencyCycle,
  presentationCycleDisplayTitle,
  presentationDisplayText
} from "../cycleTitles.js";

// Re-exported so the Present surfaces keep importing cycle naming from one place.
export { presentationCycleDisplayTitle };

// Book covers for the "Our books this cycle" slide, looked up from the real
// guided-reading library so the deck never invents a path.


// EVERY asset URL the deck emits must be absolute. The deck opens as a `blob:`
// document, and a blob: document's base URL is the blob URL itself - it has no
// path and no origin to resolve against.
function siteOrigin() {
  if (typeof window === "undefined") return "";
  return window.location?.origin || "";
}

function assetUrl(path) {
  const raw = String(path || "").trim();
  if (!raw) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith("//")) return raw;
  const origin = siteOrigin();
  if (!origin) return raw;
  return raw.startsWith("/") ? `${origin}${raw}` : `${origin}/${raw.replace(/^\.\//, "")}`;
}

function graphemeAudio(spelling) {
  return assetUrl(graphemeAudioPath(spelling));
}
function wordAudio(word) {
  return assetUrl(wordAudioPath(word));
}

export function presentationSentenceAudio(text) { return assetUrl(PRESENT_NARRATION_AUDIO[normalizeLedaAudioText(text)] || ""); }

// Fisher–Yates with a repeatable lesson seed. A retry preserves the authored
// order; the runtime uses a new seed only for an explicitly fresh game.
export function shufflePresentationChoices(items, seed) {
  let state = 2166136261;
  for (const ch of String(seed)) state = Math.imul(state ^ ch.charCodeAt(0), 16777619) >>> 0;
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    const j = Math.floor(((value ^ (value >>> 14)) >>> 0) / 4294967296 * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function shufflePresentationMemoryCards(items, seed, dayIndex, extra = false) {
  if (!items.length) return [];
  const key = item => typeof item === "string" ? item : item.text;
  // Identical taught word banks share a baseline, so weekday rotation cannot
  // accidentally reproduce yesterday's visible arrangement.
  const cards = shufflePresentationChoices([...items].sort((a,b)=>key(a).localeCompare(key(b))), seed);
  const periodic = [1,2,4].some(shift => cards.every((item,i)=>key(item)===key(cards[(i+shift)%cards.length])));
  const different = cards.findIndex(item=>key(item)!==key(cards[0]));
  if (periodic && different > 0) [cards[0],cards[different]]=[cards[different],cards[0]];
  const offset = (dayIndex + Number(extra) * 5) % cards.length;
  return [...cards.slice(offset),...cards.slice(0,offset)];
}

function soundVariants(spelling) {
  return spelling === "th" ? [
    { id: "th-unvoiced", label: "Unvoiced th, as in thumb", src: assetUrl(getApprovedPhonemeAudioPath("th")), example: "thumb" },
    { id: "th-voiced", label: "Voiced th, as in this", src: assetUrl(getApprovedPhonemeAudioPath("th_voiced")), example: "this" }
  ] : [{ id: spelling, label: `Hear ${spelling}`, src: graphemeAudio(spelling) }];
}

// Broken-image fallbacks are declared as data-hide-on-error, NOT as an inline
// onerror="" handler: the deck is a blob: document and inherits the opener's
// `script-src 'self'` CSP. public/present/deck.js turns the attribute into a
// real listener. Value is "self" or a selector passed to closest().

// Use the child's actual book characters and their canonical painted poses.
// World remains a parameter so concurrent builds cannot mix character art.
const CHARACTER_BODY_BY_WORLD = { meadow: "tuft", dino: "pebble", moonwood: "moth" };
function palImg(world, pose, cls = "") {
  const file = bookCharacterAsset({ body: CHARACTER_BODY_BY_WORLD[world.id] }, {
    pose: pose === "celebrate" ? "cheer" : pose === "think" ? "think" : "idle"
  });
  return `<img class="p-pal ${cls}" src="${esc(assetUrl(file))}" alt="" data-hide-on-error="self"/>`;
}
function isCharacterMedia(src) {
  return src.includes('/pals/') || src.includes('/game-assets/sound-seekers/characters/');
}
function wordImage(word) {
  // The shared "thin" artwork is an open book with no thickness contrast.
  // Keep thin in taught-code reading, but do not use it as a picture cue.
  if (word === "thin") return "";
  if (word === "cry") return assetUrl("/images/assessment/language/variants/antonyms-synonyms/cry-weep-01.webp");
  const asset = getChildWordAsset(word) || {};
  return assetUrl(asset.image || "");
}

function presentationWorldFor(cycle) {
  if (cycle.cycleNumber) return themeWorldForCycle(cycle.cycleNumber);
  const index = elSkillsBlockCycles.findIndex(item => item.id === cycle.id);
  for (let i = index - 1; i >= 0; i -= 1) {
    if (elSkillsBlockCycles[i].cycleNumber) return themeWorldForCycle(elSkillsBlockCycles[i].cycleNumber);
  }
  return themeWorldForCycle(1);
}

export const PRESENTATION_DAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" }
];

export const PRESENTATION_FORMATS = [
  { value: "core", label: "Daily lesson", minutes: 18, description: "One 15–20 minute lesson, with Friday games and weekly recap." }
];

function normalizeFormat(format = "core") {
  // Saved links to the retired formats open the same daily lesson.
  if (!["core", "extended", "review"].includes(format)) throw new Error(`Unknown presentation format: ${format}`);
  return "core";
}

const DAY_LABELS = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday"
};

// The rail's vocabulary. deck.js renders only the sections a given deck
// actually emitted, in this order, so the frame can never over-promise.
export const PRESENTATION_SECTIONS = [
  "Warm-up",
  "Sounds",
  "Writing",
  "Blending",
  "Words",
  "Games",
  "Vocabulary",
  "Reading",
  "Review",
  "Together",
  "Books",
  "This week",
  "Vocabulary",
  "Shared reading",
  "Review"
];

function normalizeDay(day) {
  const clean = String(day || "").trim().toLowerCase();
  if (!clean || clean === "cycle" || clean === "whole" || clean === "all") return "monday";
  if (DAY_LABELS[clean]) return clean;
  throw new Error(`Unknown presentation day: ${day}`);
}

export function presentationCycleOptions() {
  return elSkillsBlockCycles
    .filter(c => c.cycleNumber || c.type === "assessment")
    .map(c => ({
      id: c.id,
      cycleNumber: c.cycleNumber || null,
      title: c.title,
      type: c.type || "cycle",
      label: cycleOptionLabel(c)
    }));
}

export function getPresentationCycle(cycleId) {
  return elSkillsBlockCycles.find(c => c.id === cycleId) || null;
}

// ── Curated phonemic-awareness banks, one per curriculum skill ────────────────
const COMPOUND_BANK = [
  ["sun", "set"], ["cup", "cake"], ["rain", "bow"], ["pan", "cake"],
  ["back", "pack"], ["pop", "corn"], ["star", "fish"], ["dog", "house"],
  ["sand", "box"], ["bed", "time"], ["snow", "man"], ["tea", "pot"]
];
const TWO_SYLLABLE_BANK = [
  { word: "pencil", first: "pen", last: "cil" },
  { word: "carpet", first: "car", last: "pet" },
  { word: "picnic", first: "pic", last: "nic" },
  { word: "napkin", first: "nap", last: "kin" },
  { word: "muffin", first: "muf", last: "fin" },
  { word: "basket", first: "bas", last: "ket" },
  { word: "rabbit", first: "rab", last: "bit" },
  { word: "sunset", first: "sun", last: "set" },
  { word: "laptop", first: "lap", last: "top" },
  { word: "cactus", first: "cac", last: "tus" }
];
const ONSET_BANK = [
  { word: "cup", left: "up" }, { word: "sit", left: "it" }, { word: "man", left: "an" },
  { word: "cat", left: "at" }, { word: "fox", left: "ox" }, { word: "pin", left: "in" },
  { word: "hen", left: "en" }, { word: "mud", left: "ud" }, { word: "bag", left: "ag" }
];

const CHANGE_FIRST_BANK = [
  { base: "cat", made: ["hat", "bat", "rat"] },
  { base: "man", made: ["fan", "pan", "ran"] },
  { base: "pig", made: ["wig", "dig", "big"] },
  { base: "dog", made: ["log", "fog", "jog"] },
  { base: "sun", made: ["bun", "fun", "run"] },
  { base: "bed", made: ["red", "fed", "led"] },
  { base: "hop", made: ["top", "mop", "pop"] },
  { base: "wet", made: ["net", "pet", "jet"] }
];
const CHANGE_RIME_BANK = [
  { onset: "c", base: "cat", made: ["cup", "can", "cot"] },
  { onset: "m", base: "map", made: ["mud", "men", "mop"] },
  { onset: "p", base: "pig", made: ["pat", "pen", "pot"] },
  { onset: "s", base: "sun", made: ["sat", "sip", "set"] },
  { onset: "b", base: "bag", made: ["bed", "bin", "bus"] },
  { onset: "h", base: "hat", made: ["hen", "hip", "hug"] }
];
const RHYME_PAIRS_BANK = [
  { a: "cat", b: "hat", odd: "sun" }, { a: "dog", b: "log", odd: "pen" },
  { a: "pig", b: "wig", odd: "map" }, { a: "net", b: "wet", odd: "bus" },
  { a: "bug", b: "rug", odd: "hen" }, { a: "mop", b: "top", odd: "bag" },
  { a: "fan", b: "van", odd: "log" }, { a: "fin", b: "pin", odd: "cot" }
];
const RHYME_PRODUCE_BANK = [
  { base: "cat", rhymes: ["hat", "bat", "mat"] },
  { base: "pin", rhymes: ["fin", "win", "bin"] },
  { base: "dog", rhymes: ["log", "fog", "hog"] },
  { base: "sun", rhymes: ["run", "fun", "bun"] },
  { base: "bed", rhymes: ["red", "fed", "led"] },
  { base: "top", rhymes: ["hop", "mop", "pop"] }
];
const CYCLE_PATTERN_SORTS = {
  25: { label: "end with -ay", words: ["day", "say", "may", "play", "stay", "way"] },
  26: { label: "end with y", words: ["by", "my", "why", "try", "fly", "sky"] },
  27: { label: "have -ng", words: ["ring", "king", "song", "bang", "hang", "long"] }
};
const CYCLE_CHAINS = {
  25: ["day", "say", "way", "may"],
  26: ["my", "by", "be", "he"],
  27: ["sat", "sit", "sip", "lip"]
};

const PATTERN_EXAMPLES = {
  ang: ["bang", "sang"],
  ing: ["ring", "sing", "king"],
  ong: ["song", "long"],
  ung: ["hung"],
  ff: ["puff", "off"],
  ss: ["miss", "grass"],
  zz: ["buzz"],
  ll: ["ball", "fall", "call", "bell"]
};

function pickPer(list, cycleNumber, count = 2, offset = 0) {
  if (!list.length) return [];
  const start = (((cycleNumber - 1) * count) + offset) % list.length;
  return Array.from({ length: count }, (_u, i) => list[(start + i) % list.length]);
}

function esc(value) {
  return String(value).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

function focusCards(cycle) {
  const source = (cycle.focusLetters || []).length ? cycle.focusLetters : cycle.reviewLetters || [];
  const cards = [];
  for (const raw of source) {
    const grapheme = String(raw.grapheme || raw.spelling || "");
    const sound = raw.sound || "";
    const day = raw.day || "";
    let spelling = String(raw.spelling || "").toLowerCase();
    if (/^([a-z])\1$/.test(spelling) && /^[A-Z][a-z]$/.test(grapheme) && grapheme.toLowerCase() === spelling) {
      spelling = spelling[0];
    }
    const parts = spelling.split(/[\s/,+]+/).filter(part => /^[a-z]{1,3}$/.test(part));
    if (parts.length > 1) {
      for (const part of parts) {
        const partSound = part.length === 2 && part[0] === part[1] ? `/${part[0]}/` : sound;
        cards.push({ grapheme: part, sound: partSound, spelling: part, day });
      }
    } else if (/^[a-z]{1,3}$/.test(spelling)) {
      cards.push({ grapheme, sound, spelling, day });
    }
  }
  return cards.map((card, index) => ({ ...card, day: index === 0 ? "Monday" : "Tuesday" }));
}

function displayGrapheme(card) {
  return card.spelling.length === 1 ? `${card.spelling.toUpperCase()}${card.spelling}` : card.spelling;
}

// The grapheme sits inside a fixed 520px circle. "Ww" and "Mm" are roughly
// 40% wider than "Bb" at the same point size, so a single font-size makes the
// two otherwise-identical Sound slides look nothing alike - and wide pairs
// spill out of the circle entirely. Step the size down by glyph width so every
// Sound slide reads the same.
function graphemeFontSize(text) {
  const wide = /[wmWM]/.test(text);
  if (text.length >= 3) return 190;
  if (text.length === 2) return wide ? 240 : 270;
  return 300;
}

function exampleWords(spelling, limit = 3) {
  const own = (LETTER_EXAMPLES[spelling] || []).filter(word => spelling !== "wh" || word !== "who");
  const list = own.length ? own : (PATTERN_EXAMPLES[spelling] || []);
  return list.filter(w => /^[a-z]{2,6}$/.test(w)).slice(0, limit);
}

function taughtSinglesThrough(cycleNumber, day = "") {
  const taught = new Set();
  for (const cycle of elSkillsBlockCycles) {
    if (!cycle.cycleNumber || cycle.cycleNumber > cycleNumber) continue;
    for (const card of focusCards(cycle)) {
      if (day && cycle.cycleNumber === cycleNumber && card.day && Object.values(DAY_LABELS).indexOf(card.day) > Object.keys(DAY_LABELS).indexOf(day)) continue;
      const spelling = String(card.spelling || "").toLowerCase();
      if (/^[a-z]$/.test(spelling)) taught.add(spelling);
    }
  }
  return taught;
}

// This bank is deliberately short-vowel and transparent. Letter membership
// alone admits ball, wolf and lamb before their spelling patterns are taught.
const SHORT_VOWEL_WORDS = new Set(("am at mat sat sam tap map nap man tan pan pat rat ran ram fan fat fit fin fig sit sip tip tin pin pit dip did dig dim dog dot log lot pot top pop mop hop hot hat ham hen red net ten men met bed fed pet pen wet web vet van bag bat bad big bin bit bug bun bus but cap can cat cup cut cot cub gap gas gum gut get pig pup rib rim rip rug rub run sad set sun sum mud mug mad jam jet jug zip zap yes yet nod not nut leg let lid lip lap lad win wig wag wax six mix fox box kit kid sun lamp tent desk nest gift jump hand sand pond damp camp bent best milk silk list lift mint must rust swim stop spin spot step skip skin snug trap trip clap clip drop drum flag flat frog grin plug plum sled slim slip snap snip spit stem stub twin went wind mask task tusk").split(/\s+/));
const BLEND_DIGRAPHS = ["sh", "ch", "th", "wh", "ng", "nk", "qu", "ck"];
function isBlendable(word) {
  if (!SHORT_VOWEL_WORDS.has(word) || !/^[a-z]{3,4}$/.test(word) || word.includes("x")) return false;
  const vowels = [...word].filter(ch => "aeiou".includes(ch));
  if (vowels.length !== 1 || "aeiou".includes(word[word.length - 1])) return false;
  return !BLEND_DIGRAPHS.some(d => word.includes(d));
}

function blendWordsFor(cycle, offset = 0, day = "") {
  if ((cycle.cycleNumber || 0) < 2) return [];
  const taught = taughtSinglesThrough(cycle.cycleNumber, day);
  const eligible = [...SHORT_VOWEL_WORDS].filter(word => isBlendable(word) && word.length === 3 && [...word].every(letter => taught.has(letter)) && wordAudioPath(word));
  const focus = cardsAvailableOn(cycle, day || "friday").map(card => card.spelling).filter(part => part.length === 1);
  const preferred = eligible.filter(word => focus.some(letter => word.includes(letter)));
  const ordered = [...shufflePresentationChoices(preferred, `${cycle.id}:focus-blends`), ...shufflePresentationChoices(eligible.filter(word=>!preferred.includes(word)), `${cycle.id}:review-blends`)];
  const start = (offset * 2) % Math.max(1, ordered.length);
  return [...ordered.slice(start), ...ordered.slice(0,start)].slice(0,2);
}

// ── Slide shell ──────────────────────────────────────────────────────────────
// opts.section  - rail section this slide belongs to ("" for cover/close)
// opts.teacher  - text for the quiet bottom "For you" strip
// opts.reveal   - "1" if the slide holds a .p-answer the teacher unhides
// opts.timer    - seconds for a thinking-time ring
function slide(world, inner, opts = {}) {
  const attrs = { ...(opts.attrs || {}) };
  if (opts.audio) attrs["data-audio"] = assetUrl(opts.audio);
  if (opts.stroke) attrs["data-stroke"] = opts.stroke;
  if (opts.section) attrs["data-section"] = opts.section;
  if (opts.reveal) attrs["data-reveal"] = "1";
  if (opts.timer) attrs["data-timer"] = String(opts.timer);
  attrs["data-response-cue"] = opts.responseCue || (opts.cls === "p-word-build" ? "Everyone: finger-tap the sounds, then say the spelling before the board turn." : opts.cls === "p-writing" ? "Everyone: air-write, hide the model, then trace on your palm." : opts.section === "Warm-up" ? "Everyone: listen, think, then say your response to a partner." : opts.section === "Reading" ? "Everyone: read, then point, act or explain the meaning." : "Everyone: think, then say or point before the teacher selects.");
  // Old warm-up markup used clickable spans. All cues have native keyboard
  // activation, including a truthful unavailable state rather than empty play.
  inner = inner.replace(/<(span|div)([^>]*\sdata-play="[^"]*"[^>]*)>([^<]*)<\/\1>/g, (_match, _tag, attributes, text) => `<button type="button"${attributes}>${text}</button>`)
    .replace(/data-play=""/g, 'data-audio-unavailable="true"');
  const data = Object.entries(attrs).map(([key, value]) => `${key}="${esc(value)}"`).join(" ");
  // The thinking-time dial and the corner mascot share the bottom-right of the
  // stage, so a timer slide gets the dial and the mascot yields.
  const timer = opts.timer ? timerDial(opts.timer) : "";
  const char = !timer && opts.char ? palImg(world, opts.char, "p-pal-corner") : "";
  // Notes are extracted for the teacher workspace, then removed from the
  // projected document. Dictation answers must never appear on the projector.
  const teacher = opts.teacher ? `<template data-teacher-note>${esc(opts.teacher)}</template>` : "";
  const record = opts.meta ? `<template data-teacher-record>${esc(JSON.stringify(opts.meta))}</template>` : "";
  return `<section class="slide ${opts.cls || ""}" ${data}>${inner}${teacher}${record}${timer}${char}</section>`;
}

// Inline SVG icons: Lucide geometry at stroke-width 2.75, per the design system.
// The deck must contain no emoji (scrubber-safe, projector-safe).
const ICON_SPEAKER = `<svg class="p-ico" viewBox="0 0 24 24" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>`;
const ICON_PENCIL = `<svg class="p-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 4 3 9 8 9"/></svg>`;
const ICON_PLAY = `<svg class="p-ico" viewBox="0 0 24 24" aria-hidden="true"><polygon points="6 3 20 12 6 21 6 3"/></svg>`;
const ICON_EYE = `<svg class="p-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
const ICON_ARROW = `<svg class="p-arrow" viewBox="0 0 24 24" aria-hidden="true"><line x1="4" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>`;

function audioButton(src, label = "Play sound") {
  if (!src) return `<button class="p-audio p-audio-unavailable" data-audio-unavailable="true" type="button"><span>${esc(label)} · teacher model (recording unavailable)</span></button>`;
  return `<button class="p-audio" data-play="${esc(assetUrl(src))}" type="button">${ICON_SPEAKER}<span>${esc(label)}</span></button>`;
}

function revealButton(kind = "answer") {
  return `<button class="p-reveal-btn" type="button" data-reveal-toggle data-reveal-kind="${kind}">${ICON_EYE}<span>Show ${kind === "example" ? "an example" : "the answer"}</span></button>`;
}

function timerDial(seconds = 60) {
  return `<div class="p-timer-wrap">
    <button class="p-timer" type="button" data-timer-start aria-label="Start thinking time">
      <span class="p-timer-ring"></span><span class="p-timer-face">${seconds}</span>
    </button>
    <span class="p-timer-label">Thinking time</span>
  </div>`;
}

// The rail label the teacher sees on every slide - the same label the cycle
// pickers show, so a teacher recognises the deck they chose.
function railTitle(cycle) {
  return cycleOptionLabel(cycle);
}

// The cover promises what the lesson contains, as one line of plain English.
function coverBlurb(cycle) {
  const letters = focusCards(cycle).map(displayGrapheme);
  const hfw = (cycle.highFrequencyWords || []).map(w => String(w).toLowerCase());
  const bits = [];
  if (letters.length) bits.push(letters.length === 1 ? "one new sound" : `${letters.length} sounds`);
  if (hfw.length) bits.push(hfw.length === 1 ? "one focus word" : `${hfw.length} focus words`);
  if (!bits.length) return "Everything we are practising this week.";
  const last = bits.pop();
  return `${bits.length ? `${bits.join(", ")} and ${last}` : last}, all together.`;
}

function titleSlide(cycle, world, dayLabel = "", dailyGoal = "") {
  const kickerParts = [
    cycle.type === "assessment" ? "Assessment week" : `Cycle ${cycle.cycleNumber}`,
    dayLabel,
    world.name
  ].filter(Boolean);
  return slide(world, `
    <div class="p-cover-text">
      <p class="p-kicker">${esc(kickerParts.join(" · "))}</p>
      <h1 class="p-title">${esc(cycleTopic(cycle))}</h1>
      <p class="p-phase">${esc(humanizePhase(cycle.phase))}</p>
      <p class="p-blurb">${esc(dailyGoal || coverBlurb(cycle))}</p>
      <p class="p-hint">Press the right arrow key or click to begin</p>
    </div>
    <div class="p-cover-art"><span class="p-blob"></span>${palImg(world, "celebrate", "p-pal-hero")}</div>`,
  { cls: "p-cover" });
}

function letterSoundSlide(card, cycle, world) {
  const big = displayGrapheme(card);
  const phoneme = graphemeAudio(card.spelling);
  const detail = (cycle?.sections?.letterLearning?.cards || [])
    .find(c => (c.spelling || "").toLowerCase() === card.spelling) || {};
  const tip = detail.articulation || "";
  const words = exampleWords(card.spelling, 6).filter(w => wordImage(w)).slice(0, 3);
  const pics = words.map(word => `<button class="p-word" data-play="${esc(wordAudio(word))}" type="button">
      <img src="${esc(wordImage(word))}" alt="${esc(word)}" data-hide-on-error=".p-word"/>
      <span>${esc(word)}</span></button>`).join("");
  const sound = card.sound || `/${card.spelling}/`;
  return slide(world, `
    <div class="p-two-col">
      <div class="p-col-left">
        <span class="p-disc"><span class="p-letter" style="font-size:${graphemeFontSize(big)}px">${esc(big)}</span></span>
        <div class="p-sound-row">
          ${card.spelling === "th" ? soundVariants("th").map(variant => `<span data-sound-variant="${variant.id}">${audioButton(variant.src, variant.label)}</span>`).join("") : audioButton(phoneme, `Hear ${sound}`)}
          <span class="p-phoneme">${esc(sound)}</span>
        </div>
      </div>
      <div class="p-col-right">
        <p class="p-kicker">Our sound</p>
        <div class="p-words p-words-${words.length || 1}">${pics}</div>
      </div>
    </div>`,
  {
    cls: "p-letter-slide",
    section: "Sounds",
    audio: phoneme,
    teacher: card.spelling === "th" ? `${tip} Contrast thumb (/θ/, voice off) with this (/ð/, voice on). Children touch their throat to feel the difference; both values use th.` : tip,
    meta: { target: card.spelling, construct: "grapheme-phoneme", soundVariants: soundVariants(card.spelling), teacher: { model: tip || `Model ${sound} for ${card.spelling}; say a matching example, then retrieve silently.`, likelyError: card.spelling === "th" ? "Treating both values as the unvoiced sound." : "Using a letter name instead of its sound.", correction: "Replay the exact value, observe mouth movement, then retrieve without playback.", support: "Model once and invite a quiet echo.", stretch: "Name a new example with this sound." } },
    char: "wave"
  });
}

function writingSvg(text) {
  const chars = String(text).split("");
  if (!chars.length || chars.some(ch => !LETTER_STROKES[ch])) return "";
  const width = 100;
  const g = LETTER_GUIDES;
  const guides = `<line x1="0" y1="${g.top}" x2="${width}" y2="${g.top}" class="p-guide"/>` +
    `<line x1="0" y1="${g.mid}" x2="${width}" y2="${g.mid}" class="p-guide dash"/>` +
    `<line x1="0" y1="${g.base}" x2="${width}" y2="${g.base}" class="p-guide base"/>`;
  const body = chars.map((ch, i) =>
    `<g data-writing-letter="${esc(ch)}" data-writing-letter-index="${i}" ${i ? "hidden" : ""}>` +
    LETTER_STROKES[ch].map(d => `<path class="p-ghost-stroke" d="${d}"/>`).join("") +
    LETTER_STROKES[ch].map(d => `<path class="p-ink-stroke" data-write-stroke d="${d}"/>`).join("") +
    `</g>`).join("");
  const pencil = `<g data-pencil class="p-pencil"><circle r="7"/><path d="M2 -4 L20 -34 L30 -28 L14 4 Z" /></g>`;
  return `<svg class="p-write-svg" data-trace-surface viewBox="0 0 100 140" role="img" aria-label="Finger trace ${esc(chars[0])}">${guides}${body}<g data-trace-ink></g>${pencil}</svg>`;
}

function writingSlide(card, world, letterCase = "lower") {
  const text = letterCase === "upper" ? card.spelling.toUpperCase() : card.spelling;
  const svg = writingSvg(text);
  if (!svg) return "";
  return slide(world, `<p class="p-kicker">${letterCase === "upper" ? "Uppercase" : "Lowercase"} · finger trace</p>
    <p class="p-teacher-prompt">Watch once, then trace on the screen, your palm or your board.</p>
    <div class="p-paper">${svg}</div>
    <p class="p-write-ready" data-write-status role="status">Ready when you are.</p>
    <div class="p-write-actions"><button class="p-audio" type="button" data-replay>${ICON_PENCIL}<span>Start ${letterCase === "upper" ? "uppercase" : "lowercase"}${text.length > 1 ? ` ${esc(text[0])}` : ""}</span></button><button class="p-audio p-audio-ghost" type="button" data-trace-clear>Clear</button>${text.length > 1 ? `<button class="p-audio p-audio-ghost" type="button" data-writing-next-letter>Next letter: ${esc(text[1])}</button>` : ""}</div>`,
    { cls: "p-writing", section: "Writing", stroke: "1", teacher: `Model ${text} one letter at a time. Pause for everyone to trace. Choose the next letter or case only when ready; each animation starts with a separate press. Finger marks are practice, not handwriting scores.`, attrs: { 'data-letter-case': letterCase, 'data-writing-ready-audio': assetUrl(getLedaInstructionAudioPath(PRESENT_AIR_WRITING_READY_COPY)) }, meta: {target:card.spelling,construct:"letter-formation",letterCase,modelText:text} });
}





function sightWordSlide(word, cycle, world) {
  const teaching = getPresentHfwTeaching(word);
  return slide(world, `<p class="p-kicker">Our new sight word</p><div class="p-sight p-memory-model">${esc(word)}</div>
    <div class="p-lesson-actions">${audioButton(wordAudio(word), "Hear word")}<button class="p-audio p-audio-ghost" type="button" data-memory-toggle>Hide and write</button></div>
    <p class="p-teacher-prompt">${esc(teaching?.phrase || "Read, cover, write, compare.")}</p>`,
    {cls:"p-sight-slide",section:"Words",audio:wordAudio(word),teacher:teaching ? `${teaching.coverWritePrompt} ${teaching.meaning} ${teaching.correction}` : "Read, hide, write and compare.",meta:{target:word,construct:"high-frequency-word",answer:word,phonemeIds:teaching?.phonemeIds,regularParts:teaching?.regularParts,exceptionParts:teaching?.exceptionParts,teacher:{model:teaching?.phrase,likelyError:teaching?.likelyError,correction:teaching?.correction,support:"Model, cover, then retrieve.",stretch:"Use it in a spoken phrase."}}});
}

function blendSlides(cycle, world, offset = 0, day = "") {
  return blendWordsFor(cycle, offset, day).map(word => {
    const letters = word.split("").map(ch =>
      `<button class="p-tile-btn" data-play="${esc(graphemeAudio(ch))}" type="button">${esc(ch)}</button>`).join("");
    return slide(world, `
      <p class="p-kicker">Blend with me</p>
      <div class="p-compound" data-blend-word="${esc(word)}">${letters}${ICON_ARROW}<button class="p-made" data-play="${esc(wordAudio(word))}" type="button">${esc(word)}</button></div>
      <h2 class="p-h2">Say each sound on its own. Then say the whole word.</h2>
      <button class="p-audio p-audio-ghost" type="button" data-model-blend>Guide the blend</button>`,
    {
      cls: "p-blend",
      section: "Blending",
      teacher: "Let children try before playing the word. Guide the blend points to each spelling, then sweeps through the whole word; model pure sounds without adding an uh.",
      char: "wave"
    });
  });
}

// "Everyone together": the cycle's own call-and-response, given a slide of its
// own so the teacher has a planned whole-class beat instead of improvising one.




function routinesSlide(cycle, world) {
  const items = (cycle.routines || [])
    .map(r => `<li>${esc(presentationDisplayText(r))}</li>`)
    .join("");
  if (!items) return "";
  return slide(world, `
    <p class="p-kicker">This week</p>
    <h2 class="p-h2">${esc(presentationCycleDisplayTitle(cycle))}</h2>
    <ul class="p-routines">${items}</ul>`,
  { cls: "p-routines-slide", section: "This week", char: "think" });
}

// ── Phonemic-awareness candidates, one builder per curriculum skill ───────────


































function endSlide(cycle, world) {
  const letterChips = focusCards(cycle).map(card =>
    `<button class="p-chip accent" data-play="${esc(graphemeAudio(card.spelling))}" type="button">${esc(displayGrapheme(card))}</button>`).join("");
  const wordChips = (cycle.highFrequencyWords || []).map(w => {
    const word = String(w);
    return `<button class="p-chip sage" data-play="${esc(wordAudio(word))}" type="button">${esc(word)}</button>`;
  }).join("");
  const recap = (letterChips || wordChips)
    ? `<div class="p-chips p-recap">${letterChips}${wordChips}</div><p class="p-blurb-dark">Tap one and call the sound back to me.</p>`
    : "";
  return slide(world, `
    <div class="p-cover-text">
      <p class="p-kicker">That's the lesson</p>
      <h1 class="p-h1">Today we learned</h1>
      ${recap}
      <p class="p-hint">Press Esc to leave full screen</p>
    </div>
    <div class="p-cover-art">${palImg(world, "celebrate", "p-pal-hero")}</div>`,
  { cls: "p-close" });
}

export function presentationCycleSummary(cycleId) {
  const cycle = getPresentationCycle(cycleId);
  if (!cycle) return "";
  const parts = [
    cycle.cycleNumber ? `Cycle ${cycle.cycleNumber}` : presentationCycleDisplayTitle(cycle)
  ];
  const letters = (cycle.focusLetters || []).map(c => c.grapheme).filter(Boolean);
  if (!isFluencyCycle(cycle) && letters.length && letters.length <= 5) parts.push(letters.join(" "));
  const hfw = cycle.highFrequencyWords || [];
  if (hfw.length) parts.push(`${hfw.length} sight word${hfw.length === 1 ? "" : "s"}`);
  const warmups = [];
  for (const skill of cycle.phonemicAwareness || []) {
    const s = String(skill).toLowerCase();
    let label = "";
    if (s.includes("rhym")) label = "rhyming";
    else if (s.includes("compound")) label = "compound words";
    else if (s.includes("syllable")) label = "syllables";
    else if (s.includes("substitut")) label = "sound swapping";
    else if (s.includes("delet") || s.includes("onset") || s.includes("rime")) label = "sound deletion";
    if (label && !warmups.includes(label)) warmups.push(label);
  }
  if (warmups.length) parts.push(`${warmups.join(" + ")} warm-ups`);
  return parts.join(" · ");
}

function cardsAvailableOn(cycle, day) {
  const dayIndex = Object.keys(DAY_LABELS).indexOf(day);
  return focusCards(cycle).filter(card => Object.values(DAY_LABELS).indexOf(card.day) <= dayIndex);
}

function sightWordsAvailableOn(cycle, day, beforeLesson = false) {
  const index = Object.keys(DAY_LABELS).indexOf(day) - Number(beforeLesson);
  const words = cycle.highFrequencyWords || [];
  if (index < 2) return [];
  return index === 2 ? words.slice(0, Math.ceil(words.length / 2)) : words;
}

export function presentationReviewContent(cycleId, day = "monday", reviewPolicy = {}) {
  const cycle = getPresentationCycle(cycleId);
  if (!cycle) throw new Error("Unknown cycle");
  const dayKey = normalizeDay(day);
  const cards = new Map(), words = new Set();
  for (const previous of elSkillsBlockCycles) {
    if (!previous.cycleNumber || previous.cycleNumber > cycle.cycleNumber) continue;
    const same = previous.id === cycle.id;
    const available = same ? cardsAvailableOn(previous, dayKey).filter(card => !reviewPolicy.beforeLesson || card.day !== DAY_LABELS[dayKey]) : focusCards(previous);
    for (const card of available) if (!cards.has(card.spelling)) cards.set(card.spelling, card);
    for (const word of same ? sightWordsAvailableOn(previous, dayKey, reviewPolicy.beforeLesson) : previous.highFrequencyWords || []) words.add(word);
  }
  const full = { cards: [...cards.values()], words: [...words] };
  if (reviewPolicy.mode !== "focused-review") return full;
  return { cards: full.cards.filter(card => (reviewPolicy.graphemes || []).includes(card.spelling)), words: full.words.filter(word => (reviewPolicy.words || []).includes(word)) };
}

function letterRecapItem(card) {
  // Picture anchors support oral recall; they are not new decoding targets.
  // Keep the same clear anchor for a spelling across daily recaps.
  const preferred = {a:"apple",t:"turtle",f:"fish",r:"rug",w:"web",u:"umbrella",k:"kite",y:"yo-yo",z:"zebra",q:"queen",wh:"wheel"};
  const candidates = [...new Set([preferred[card.spelling], ...exampleWords(card.spelling, 6)].filter(Boolean))];
  const anchorImage = word => wordImage(word) || assetUrl(initialSoundWordBank.find(item => item.active && item.targetWord === word)?.imagePath || "");
  const anchorWord = candidates.find(word => anchorImage(word) && wordAudioPath(word)) || candidates.find(word => wordAudioPath(word)) || "";
  return {text:displayGrapheme(card),audio:graphemeAudio(card.spelling),target:card.spelling,anchorWord,anchorAudio:anchorWord ? wordAudio(anchorWord) : "",imagePath:anchorWord ? anchorImage(anchorWord) : "",variants:card.spelling === "th" ? soundVariants("th") : []};
}

function cumulativeReviewSlides(cycle, world, day, kind) {
  const review = presentationReviewContent(cycle.id, day, {beforeLesson: true});
  const items = kind === "letters" ? review.cards : review.words;
  if (!items.length) return [];
  const cards = items.map(item => kind === "letters" ? letterRecapItem(item) : {text:item,audio:wordAudio(item),target:item,variants:[]});
  const first = cards[0];
  const stimulus = kind === "letters" ? `<div class="p-recap-stimulus"><div class="p-review-focus" role="status">${esc(first.text)}</div><figure class="p-recap-anchor" data-review-anchor><img src="${esc(first.imagePath)}" alt="${esc(first.anchorWord)}" ${first.imagePath ? "" : "hidden"}/><figcaption data-review-anchor-word>${esc(first.anchorWord)}</figcaption></figure></div>` : `<div class="p-review-focus" role="status">${esc(first.text)}</div>`;
  return [slide(world, `<p class="p-kicker">Quick recap · ${kind === "letters" ? "sounds" : "sight words"}</p><p class="p-teacher-prompt">Say each one together. Use Hear only when needed.</p>
    <div data-review-carousel data-review-items="${esc(JSON.stringify(cards))}">${stimulus}<p class="p-review-count">1 / ${cards.length}</p><div class="p-lesson-actions"><button class="p-audio p-audio-ghost" type="button" data-review-prev disabled>Back</button><button class="p-audio" type="button" data-review-hear>Hear${kind === "letters" ? " sound" : ""}</button>${kind === "letters" ? `<button class="p-audio p-audio-ghost" type="button" data-review-anchor-hear ${first.anchorAudio ? "" : "hidden"}>Hear ${esc(first.anchorWord)}</button>` : ""}<button class="p-audio" type="button" data-review-next>Next ${kind === "letters" ? "sound" : "word"}</button></div><div data-review-variants></div></div>
    <template data-review-ledger>${cards.map(card => `<span data-review-${kind === "letters" ? "spelling" : "word"}="${esc(card.target)}"></span>${card.variants.map(variant => `<span data-sound-variant="${variant.id}" data-review-audio="${esc(variant.src)}"></span>`).join("")}`).join("")}</template>`,
    {cls:kind === "letters" ? "p-letter-review" : "p-hfw-review",section:"Review",teacher:"Quickly retrieve every earlier item one at a time. Name the letter, say its sound and name the picture anchor. Pictures support oral recall; children need not decode untaught anchor spellings. Replay a forgotten item, then ask again. New targets are introduced later in this lesson. Choral practice is not a mastery score.",meta:{target:kind === "letters" ? "Earlier sounds" : "Earlier sight words",construct:"cumulative-retrieval",reviewItems:cards,requiredAudio:cards.flatMap(card => [{src:card.audio,type:"audio",role:"review",transcript:card.target,required:true},...(card.anchorAudio ? [{src:card.anchorAudio,type:"audio",role:"picture-anchor",transcript:card.anchorWord,required:true}] : []),...card.variants.map(variant => ({src:variant.src,type:"audio",role:"phoneme",transcript:variant.label,required:true}))])}})];
}

function sightMatchSlide(cycle, world, day, extra = false) {
  const review = presentationReviewContent(cycle.id, day).words;
  const index = Math.max(0, Object.keys(DAY_LABELS).indexOf(day));
  const current = sightWordsAvailableOn(cycle, day);
  const pool = [...new Set([...current, ...pickPer(review, cycle.cycleNumber, 4, index * 4 + Number(extra) * 4), ...review])];
  const offset = Number(extra) % Math.max(1, pool.length);
  const available = [...pool.slice(offset), ...pool.slice(0, offset)].slice(0, 4);
  // Four pairs on every round. Repeat already-taught words in early cycles;
  // never introduce an untaught word just to fill the memory board.
  const words = available.length ? Array.from({length:4},(_,i)=>available[i % available.length]) : [];
  if (!words.length) {
    const letters = presentationReviewContent(cycle.id,day).cards.filter(card=>card.spelling.length===1).slice(-4);
    const targets = letters.length ? Array.from({length:4},(_,i)=>letters[i % letters.length]) : [];
    const pairs = targets.length ? shufflePresentationMemoryCards(targets.flatMap(card=>[{value:card.spelling,text:card.spelling.toUpperCase()},{value:card.spelling,text:card.spelling}]),`${cycle.id}:letter-pairs`,index,extra) : [];
    if (!pairs.length) return "";
    return slide(world, `<p class="p-kicker">Letter pairs</p><p class="p-teacher-prompt">Find the uppercase and lowercase pair.</p><div class="p-match" data-match-game data-match-kind="letters"><div class="p-match-grid">${pairs.map((card,i)=>`<button class="p-match-card" type="button" data-match-word="${esc(card.value)}" aria-label="Card ${i+1}"><span class="p-card-back">${i+1}</span><span class="p-card-word" hidden>${esc(card.text)}</span></button>`).join("")}</div><p class="p-game-feedback" data-match-feedback role="status">Say the sound when you find a pair.</p><button class="p-audio p-audio-ghost" type="button" data-match-reset>Again</button></div>`,{cls:"p-letter-match",section:"Review",teacher:"Match the two forms of each taught letter and say its sound.",meta:{target:letters.map(card=>card.spelling).join(", "),construct:"letter-case-matching"}});
  }
  const cards = shufflePresentationMemoryCards([...words, ...words], `${cycle.id}:word-pairs`, index, extra);
  return slide(world, `<p class="p-kicker">Sight word pairs</p>
    <h2 class="p-h2">Turn two cards. Read. Find a pair!</h2>
    <div class="p-match" data-match-game data-match-seed="${esc(`${cycle.id}:${day}:${extra}`)}">
      <div class="p-match-grid">${cards.map((word, i) => `<button class="p-match-card" type="button" data-match-word="${esc(word)}" aria-label="Card ${i + 1}"><span class="p-card-back">${i + 1}</span><span class="p-card-word" hidden>${esc(word)}</span></button>`).join("")}</div>
      <p class="p-game-feedback" data-match-feedback role="status">Read each word as it turns over.</p>
      <button type="button" class="p-audio p-audio-ghost" data-match-reset>Play again</button>
    </div>`, { cls: "p-sight-match", section: "Words", meta:{target:words.join(", "),construct:"high-frequency-word-matching"}, teacher: `Match ${words.join(", ")}. Everyone reads the revealed words and predicts a pair before a volunteer chooses. If the words differ, compare their letters before trying another pair. Keep the same cards during a retry.` });
}

function pictureWordsFor(cycle, day) {
  const index = Math.max(0, Object.keys(DAY_LABELS).indexOf(day));
  const current = (PRESENT_VOCABULARY[cycle.cycleNumber] || []).map(card => card.word);
  const examples = cardsAvailableOn(cycle, day || "friday").flatMap(card => exampleWords(card.spelling, 6));
  const previous = elSkillsBlockCycles.filter(c => c.cycleNumber && c.cycleNumber < cycle.cycleNumber)
    .flatMap(c => (PRESENT_VOCABULARY[c.cycleNumber] || []).map(card => card.word));
  const freshExamples = [...new Set(examples)].filter(word => !current.includes(word) && wordImage(word) && wordAudioPath(word));
  const familiar = [...new Set(previous)].filter(word => !current.includes(word) && !freshExamples.includes(word));
  return [...new Set([...current, ...pickPer(freshExamples, cycle.cycleNumber, 2, index), ...pickPer(familiar, cycle.cycleNumber, 2, index * 2), ...freshExamples, ...familiar])]
    .filter(word => wordImage(word) && wordAudioPath(word)).slice(0, 6);
}



function pictureMatchSlide(cycle, world, day, offset = 0) {
  const words = pictureWordsFor(cycle, day);
  const index = Math.max(0, Object.keys(DAY_LABELS).indexOf(day));
  const target = words[(index + offset) % words.length];
  const choices = shufflePresentationChoices([target, ...words.filter(word => word !== target)].slice(0, 3), `${cycle.id}:${day}:${offset}:picture-match`);
  const meanings = Object.values(PRESENT_VOCABULARY).flat();
  const alternatives = choices.map(word => ({id:word,text:word,rationale:word===target?`This is the mapped label for ${target}.`:`${word} names ${meanings.find(card=>card.word===word)?.definition || "a different familiar picture word"}; compare that meaning with the pictured ${target}.`}));
  return slide(world, `<p class="p-kicker">Picture word match</p>
    <h2 class="p-h2">Which word matches this picture?</h2>
    <div class="p-picture-game" data-choice-target="${esc(target)}">
      <img class="p-game-picture" src="${esc(wordImage(target))}" alt="Picture to name"/>
      <div class="p-choice-bank">${choices.map(word => `<button class="p-choice" type="button" data-choice-value="${esc(word)}">${esc(word)}</button>`).join("")}</div>
      <p class="p-game-feedback" data-choice-feedback role="status">Read the words. Point to your choice.</p>
    </div>`, { cls: "p-picture-match", section: "Review", meta:{target,construct:"supported-vocabulary-label-recognition",answer:target,choices:alternatives,acceptedPictureLabels:[target],teacher:{model:`Name ${target} and compare it with each alternate label.`,likelyError:"Selecting a familiar printed label without comparing its meaning to the picture.",correction:`${alternatives.filter(choice=>choice.id!==target).map(choice=>choice.rationale).join(" ")}`,support:"Read and explain every choice before the supported retry.",stretch:"Give another example of the picture word."}}, teacher: `Revisit the picture words before this game. The picture is ${target}. Read all choices with the class, then let everyone point and a volunteer choose. Compare meanings after a mismatch. This is supported vocabulary practice, not independent decoding evidence.` });
}

function sentenceSlide(cycle, world, day, second = false) {
  const card = dailyPresentReading(cycle.cycleNumber, day)[Number(second)];
  return slide(world, `<p class="p-kicker">${second ? "Read together · a fresh sentence" : presentGameSchedule(cycle.cycleNumber,day).some(name=>["detective","scramble"].includes(name)) ? "Reread and explain · today’s picture" : "Read together · today’s picture"}</p>
    <div class="p-picture-sentence">
      <img src="${esc(assetUrl(card.imagePath || wordImage(card.word)))}" alt="${esc(card.imageRole==='proposition-scene' ? card.sceneRequirements : 'Vocabulary support for the sentence')}"/>
      <div><div class="p-shared-sentence" data-track-sentence>${card.sentence.split(/\s+/).map(token => `<span data-track-word>${esc(token)}</span>`).join(" ")}</div>
      <div class="p-lesson-actions">${audioButton(presentationSentenceAudio(card.sentence),'Hear the sentence')}<button type="button" class="p-audio" data-track-next>Point to word</button></div></div>
    </div><p class="p-teacher-prompt">${esc(card.meaningPrompt)}</p>`, {
    cls: "p-sentence-track", section: "Reading", teacher: `Model "${card.sentence}" naturally, then reread together while tracking words and spaces. ${card.meaningPrompt} Accept: ${card.acceptedResponses.join(' / ')}. Image role: ${card.imageRole}. ${card.sceneGap || ''} Adults read untaught spellings; pointer completion is participation, not understanding.`,
    meta: {...card,target:card.sentence,construct:"supported-shared-reading",answer:card.acceptedResponses.join(' / '),teacher:card.teacher,requiredAudio:[{src:presentationSentenceAudio(card.sentence),type:'audio',role:'sentence',transcript:card.sentence,required:true}],codeStatus:"adult-supported"}
  });
}

export function presentationDayPlan(cycleId, day = "monday", { format = "core" } = {}) {
  const cycle = getPresentationCycle(cycleId);
  if (!cycle) throw new Error("Unknown cycle");
  const key = normalizeDay(day);
  const formatKey = normalizeFormat(format);
  if (cycle.type === "assessment") return null;
  const titles = {monday:"Meet the first letter",tuesday:"Meet the next letter",wednesday:"New sight words",thursday:"New sight words and letter practice",friday:"Our week · recap and games"};
  const newCards = (cycle.focusLetters?.length ? focusCards(cycle) : []).filter(card => card.day === DAY_LABELS[key]);
  const words = cycle.highFrequencyWords || [];
  const newWords = key === "wednesday" ? words.slice(0, Math.ceil(words.length / 2)) : key === "thursday" ? words.slice(Math.ceil(words.length / 2)) : [];
  return {day:key,format:formatKey,title:titles[key],minutes:18,minimumMinutes:15,maximumMinutes:20,newGraphemes:key === "friday" ? [] : newCards.map(card=>card.spelling),newWords,focus:newCards.map(displayGrapheme).join(" · ") || newWords.join(" · "),support:"Model briefly, allow everyone to respond, then retry.",stretch:"Ask for a new example within the taught code.",preparation:"No equipment needed. Children say, point, air-write or trace on a palm. Only the teacher operates the screen.",blocks:[
    {id:"recall",label:"Brief recap of earlier learning",minutes:3,guidance:"One item at a time; revisit all previous cycles."},
    {id:"teach",label:key === "friday" ? "Monday–Thursday round-up" : "Today's focus",minutes:4,guidance:key === "friday" ? "Retrieve this week's letters and words; introduce nothing new." : "Introduce only today's letter or sight words, then practise both letter cases separately."},
    {id:"blend",label:key === "friday" ? "Read and match" : "Blend and read",minutes:2,guidance:"Use varied words within the code already taught."},
    {id:"games",label:"Whole-class quick games",minutes:key === "friday" ? 6 : 5,guidance:"Everyone chooses or builds before the board turn."},
    {id:"reading",label:key === "friday" ? "Picture reading and weekly round-up" : "Picture reading and round-up",minutes:key === "friday" ? 3 : 4,guidance:"Read the text, hear the exact recording, and discuss the matching picture."}
  ]};
}

const PATTERN_READING = {
  15: [["sh", "i", "p"], ["ch", "i", "p"], ["th", "i", "n"]],
  16: [["b", "all"], ["f", "all"], ["c", "all"]],
  21: [["wh", "e", "n"], ["wh", "i", "p"], ["wh", "i", "sk"]],
  22: [["s", "i", "nk"], ["p", "i", "nk"], ["b", "a", "nk"]],
  23: [["r", "ing"], ["s", "ong"], ["h", "ung"], ["b", "ang"]],
  24: [["p", "u", "ff"], ["m", "i", "ss"], ["b", "u", "zz"], ["w", "i", "ll"]]
};

function patternPartsFor(cycle, day = "") {
  const introduced = new Set();
  for (const item of elSkillsBlockCycles) {
    if (!item.cycleNumber || item.cycleNumber > cycle.cycleNumber) continue;
    for (const card of item.cycleNumber === cycle.cycleNumber && day ? cardsAvailableOn(item, day) : focusCards(item)) introduced.add(card.spelling);
  }
  return (PATTERN_READING[cycle.cycleNumber] || []).filter(parts => parts.every(part =>
    introduced.has(part) || (/^[bcdfghjklmnpqrstvwxyz]+$/.test(part) && [...part].every(c => introduced.has(c)) && !BLEND_DIGRAPHS.some(d => part.includes(d)))));
}

function readingPartsFor(cycle, day) {
  if (isFluencyCycle(cycle)) return CYCLE_PATTERN_SORTS[cycle.cycleNumber].words.map(word => [word]);
  const pattern = patternPartsFor(cycle, day);
  if (pattern.length) return pattern;
  const words = blendWordsFor(cycle, Math.max(0, Object.keys(DAY_LABELS).indexOf(day)), day);
  if (words.length) return words.map(word => [...word]);
  const taught = taughtSinglesThrough(cycle.cycleNumber,day);
  return ["am","at"].filter(word=>[...word].every(letter=>taught.has(letter))).map(word=>[...word]);
}

function wordBuildSlide(cycle, world, day, offset = 0) {
  const dayIndex = Math.max(0, Object.keys(DAY_LABELS).indexOf(day));
  const options = readingPartsFor(cycle, day);
  const pool = shufflePresentationChoices(options, `${cycle.id}:weekly-spelling`);
  const reading = pool[(dayIndex + offset) % pool.length];
  const familiarWords = presentationReviewContent(cycle.id,day).words;
  const word = reading?.join("") || familiarWords[(dayIndex + offset) % familiarWords.length];
  if (!word) return "";
  // Fluency words use letter tiles here; the task is spelling, not phoneme count.
  const parts = reading?.length > 1 ? reading : [...word];
  const taught = [...taughtSinglesThrough(cycle.cycleNumber, day)];
  const distractor = pickPer(taught.filter(part => !parts.includes(part)), cycle.cycleNumber, 1, dayIndex + offset)[0];
  const bank = shufflePresentationChoices([...parts, ...(distractor ? [distractor] : [])].map((part, index) => ({ part, index })), `${cycle.id}:${day}:spelling:${offset}`);
  const cvc = parts.length === 3 && parts.every(part => part.length === 1) && /^[bcdfghjklmnpqrstvwzy][aeiou][bcdfghjklmnpqrstvwzy]$/.test(word);
  const picture = reading ? wordImage(word) : "";
  return slide(world, `<p class="p-kicker">Build a word${cvc ? " · CVC spelling" : ""}</p>
    <h2 class="p-h2">Say it. Tap the parts. Build it!</h2>
    <div class="p-spelling-layout">${picture ? `<img class="p-spelling-picture" src="${esc(picture)}" alt="Picture of the word to spell"/>` : ""}<div>
    ${audioButton(wordAudio(word), "Hear the word")}
    <div class="p-build" data-build-target="${esc(JSON.stringify(parts))}" data-attempt-mode="whole-word">
      <div class="p-build-slots" aria-label="Your word">${parts.map((_, i) => `<span class="p-build-slot" aria-label="Spelling part ${i + 1}"></span>`).join("")}</div>
      <div class="p-build-bank" role="group" aria-label="Spelling parts">${bank.map(({ part, index }) => `<button type="button" class="p-tile-btn" data-build-part="${esc(part)}" data-tile-id="${index}">${esc(part)}</button>`).join("")}</div>
      <p class="p-build-feedback" role="status">Say the word before you build it.</p>
      <div class="p-lesson-actions"><button type="button" class="p-audio" data-build-check>Check</button><button type="button" class="p-audio p-audio-ghost" data-build-undo>Undo</button></div>
    </div></div></div>`, { cls: "p-word-build", section: "Writing", attrs: { "data-spelling-kind": cvc ? "cvc" : reading ? "pattern" : "sight-word" }, meta:{target:word,answer:word,construct:"encoding",codeStatus:reading?"taught-code":"taught-HFW-guided",teacher:{model:`Say ${word}. Segment, map, blend, then hide and write.`,likelyError:"A different middle vowel or omitted spelling part.",correction:"Keep the draft visible. Compare the spoken sounds with the written parts, model the actual difference, then try a fresh word.",support:"Say the word again and model only the difficult spelling part; the retry is supported.",stretch:"Hide the screen model and write another word with the same code."}}, teacher: `Say ${word}. Children say and finger-tap its parts before a volunteer builds it. Read the completed word together. ${reading ? "Use the taught code to explain each part. Each box holds a spelling part, not necessarily one sound." : "No CVC word is available within the taught code yet. This is a taught high-frequency word; model its spelling."}` });
}



function dailyReadingSlides(cycle, world, day) {
  const bank = patternPartsFor(cycle, day);
  const index = Object.keys(DAY_LABELS).indexOf(day);
  if (!bank.length) return blendSlides(cycle, world, index, day);
  return [...bank.slice(index % bank.length), ...bank.slice(0, index % bank.length)].slice(0, 2).map(parts => {
    const word = parts.join("");
    return slide(world, `<p class="p-kicker">Read the spelling pattern</p>
      <div class="p-compound" data-pattern-word="${word}">${parts.map(part => `<span class="p-tile"${graphemeAudio(part) ? ` data-play="${esc(graphemeAudio(part))}"` : ` data-visual-model="true"`}>${part}</span>`).join("")}</div>
      <h2 class="p-h2">Read each part. Blend the word.</h2>
      <div class="p-answer"><span class="p-response">${word}</span>${audioButton(wordAudio(word), "Read the word")}</div>${revealButton()}<button class="p-audio p-audio-ghost" type="button" data-model-blend>Guide the parts (teacher models sound chunks)</button>`,
      { cls: "p-pattern-read", section: "Blending", reveal: true,
        teacher: `Point to ${parts.join(" / ")}. A reviewed single-sound part can replay; a multi-sound chunk without a reviewed exact recording is a visual model for you to say aloud. Blend ${word}, then reread smoothly. Reveal after children try.`, meta: {target:word,answer:word,construct:"decoding",codeStatus:"taught-code",parts:parts.map(part=>({text:part,audio:graphemeAudio(part),mode:graphemeAudio(part)?"recorded-phoneme":"teacher-spoken-chunk"}))} });
  });
}



function assembleDailySlides(cycle, world, day) {
  const plan = presentationDayPlan(cycle.id, day);
  const index = Object.keys(DAY_LABELS).indexOf(day);
  const cards = cardsAvailableOn(cycle, day);
  const fresh = (cycle.focusLetters?.length ? cards : []).filter(card => card.day === DAY_LABELS[day]);
  const tracePool = cards.length ? cards : presentationReviewContent(cycle.id,day).cards.filter(card=>card.spelling.length === 1).slice(-2);
  const traceCards = (fresh.length ? fresh : [...tracePool.slice((index*2)%Math.max(1,tracePool.length)),...tracePool.slice(0,(index*2)%Math.max(1,tracePool.length))].slice(0,2)).slice(0,4);
  const activities = buildPresentActivityViews({cycle,world,day,dayIndex:index,slide,esc,wordAudio,wordImage,audioButton,sentenceAudio:presentationSentenceAudio,mediaUrl:assetUrl,shuffle:shufflePresentationChoices,review:presentationReviewContent(cycle.id,day),initialSoundCards:cards});
  const weekItems = [...focusCards(cycle).map(card=>({text:displayGrapheme(card),audio:graphemeAudio(card.spelling),target:card.spelling,variants:card.spelling === "th" ? soundVariants("th") : []})),...cycle.highFrequencyWords.map(word=>({text:word,audio:wordAudio(word),target:word,variants:[]}))];
  const weekly = slide(world, `<p class="p-kicker">Our week · Monday to Thursday</p><p class="p-teacher-prompt">Say the sounds and read the words from this week.</p><div data-review-carousel data-review-items="${esc(JSON.stringify(weekItems))}"><div class="p-review-focus" role="status">${esc(weekItems[0].text)}</div><p class="p-review-count">1 / ${weekItems.length}</p><div class="p-lesson-actions"><button class="p-audio p-audio-ghost" type="button" data-review-prev disabled>Back</button><button class="p-audio" type="button" data-review-hear>Hear</button><button class="p-audio" type="button" data-review-next>Next</button></div><div data-review-variants></div></div>`,{cls:"p-week-roundup",section:"Review",teacher:"Recap the letters and words taught Monday to Thursday. No new teaching on Friday.",meta:{target:"Monday–Thursday learning",construct:"weekly-retrieval",newTargets:[],reviewItems:weekItems,requiredAudio:weekItems.map(item=>({src:item.audio,type:"audio",role:"weekly-review",transcript:item.target,required:true}))}});
  const groups = [
    [...cumulativeReviewSlides(cycle,world,day,"letters"),...cumulativeReviewSlides(cycle,world,day,"words")],
    day === "friday" ? [weekly] : [...fresh.map(card=>letterSoundSlide(card,cycle,world)),...traceCards.flatMap(card=>[writingSlide(card,world,"upper"),writingSlide(card,world,"lower")]),...plan.newWords.map(word=>sightWordSlide(word,cycle,world))],
    dailyReadingSlides(cycle,world,day).slice(0,day === "friday" ? 1 : 2),
    [...buildPresentClassGames({cycle,day,world,slide,esc,mediaUrl:assetUrl,sentenceAudio:presentationSentenceAudio,wordAudio,shuffle:shufflePresentationChoices,focusWords:plan.newWords.length?plan.newWords:sightWordsAvailableOn(cycle,day),words:[...new Set([...sightWordsAvailableOn(cycle,day),...presentationReviewContent(cycle.id,day).words])],letters:cards.map(card=>({...card,text:displayGrapheme(card),audio:graphemeAudio(card.spelling)}))}),...(presentGameSchedule(cycle.cycleNumber,day).includes("pairs")?[sightMatchSlide(cycle,world,day)]:[]),wordBuildSlide(cycle,world,day),...(["monday","wednesday","friday"].includes(day)?[pictureMatchSlide(cycle,world,day)]:[activities.sort]),...(day === "friday" ? [wordBuildSlide(cycle,world,day,1)] : [])],
    [sentenceSlide(cycle,world,day),sentenceSlide(cycle,world,day,true),slide(world,`<p class="p-kicker">${day === "friday" ? "Week complete" : "Today's round-up"}</p><p class="p-teacher-prompt">${day === "friday" ? "Name your favourite game. Say a sound, read a word, and explain one picture sentence." : "Say today's sounds and words. Show your teacher one thing you remember."}</p><div class="p-roundup-stimulus">${(day === "friday" ? cycle.highFrequencyWords : [...new Set([...traceCards.map(displayGrapheme),...plan.newWords])]).map(text=>`<span>${esc(text)}</span>`).join("")}</div>`,{cls:"p-daily-roundup",section:"Review",teacher:"Invite a few individual responses before finishing; supported practice is not a formal score.",meta:{target:day === "friday" ? "Weekly recap" : "Daily recap",construct:"round-up"}})]
  ];
  let elapsed = 0;
  return groups.flatMap((group,i) => { const block=plan.blocks[i],start=elapsed;elapsed+=block.minutes;return group.filter(Boolean).map((html,j)=>html.replace(/<section class="([^"]*)"/,`<section class="$1" data-lesson-block="${block.id}" data-block-label="${esc(block.label)}" data-block-minutes="${block.minutes}" data-block-start="${j === 0 ? "1" : "0"}"`).replace('</section>',`<p class="p-pacing">${start}–${elapsed} min · ${esc(block.label)}</p></section>`)); });
}

function assembleSlides(cycle, world, day) {
  if (cycle.type === "assessment") return [titleSlide(cycle,world),routinesSlide(cycle,world),endSlide(cycle,world)];
  return assembleDailySlides(cycle,world,day);
}

function plainText(html = "") {
  return String(html).replace(/<[^>]*>/g, " ").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

function indexSlides(slides) {
  return slides.map((html, index) => {
    const attrs = /<section class="slide ([^"]*)"([^>]*)>/.exec(html);
    const attribute = name => plainText(new RegExp(`${name}="([^"]*)"`).exec(attrs?.[2] || "")?.[1] || "");
    const heading = /class="p-kicker[^"]*">([\s\S]*?)<\/p>/.exec(html)?.[1];
    const target = /class="p-(?:sight|letter)"[^>]*>([^<]*)</.exec(html)?.[1];
    return {
      index, cls: attrs?.[1] || "", section: attribute("data-section"),
      title: [plainText(heading), plainText(target)].filter(Boolean).join(" · ") || "Lesson",
      teacher: plainText(/<template data-teacher-note>([\s\S]*?)<\/template>/.exec(html)?.[1] || "Invite everyone to respond. Model clearly, give thinking time, and listen to individual voices before moving on."),
      block: attribute("data-lesson-block"), blockLabel: attribute("data-block-label")
    };
  });
}

function readTeachingRecord(html) {
  try { return JSON.parse(plainText(/<template data-teacher-record>([\s\S]*?)<\/template>/.exec(html)?.[1] || '{}')); } catch { return {}; }
}
// Semantic lookup uses the actual active resolvers, never filename guesses.
let sharedMediaSemantics;
function sharedMediaLookup() {
  if (sharedMediaSemantics) return sharedMediaSemantics;
  const audio=new Map(), images=new Map();
  const words=new Set([...Object.keys(childWordAssets),...Object.values(LETTER_EXAMPLES).flat(),...Object.values(PRESENT_VOCABULARY).flat().map(card=>card.word),...elSkillsBlockCycles.flatMap(cycle=>cycle.highFrequencyWords || []),...Object.values(PATTERN_READING).flat(2),...Object.values(CYCLE_CHAINS).flat(),...COMPOUND_BANK.flatMap(parts=>[...parts,parts.join('')]),...THREE_SYLLABLE_BANK.flatMap(item=>[item.word,item.firstResult,item.lastResult]),...TWO_SYLLABLE_BANK.flatMap(item=>[item.word,item.first,item.last]),...ONSET_BANK.flatMap(item=>[item.word,item.left]),...CHANGE_FIRST_BANK.flatMap(item=>[item.base,...item.made]),...CHANGE_RIME_BANK.flatMap(item=>[item.base,...item.made]),...RHYME_PAIRS_BANK.flatMap(item=>[item.a,item.b,item.odd]),...RHYME_PRODUCE_BANK.flatMap(item=>[item.base,...item.rhymes])]);
  for (const word of words) {
    const src=wordAudio(word);if(src)audio.set(src,{role:'isolated-word',transcript:word,meaning:getPresentHfwTeaching(word)?.meaning || Object.values(PRESENT_VOCABULARY).flat().find(card=>card.word===word)?.definition || `Spoken word: ${word}`,dialect:'en-US',sourceAuthority:'src/components/elQuest/elQuestEngine.js:wordAudioPath; src/data/childAssets.js; current Leda production registry',rightsAuthority:'Current shared recording provenance and docs/audio/PHONEME_RECORDING_STANDARD.md; no new rights claim',reviewState:'current-canonical-recording; task-specific listening unobserved'});
    const image=wordImage(word);if(image)images.set(image,{role:'vocabulary-support',meaning:word,imageRole:'vocabulary-support',sceneRequirements:`Recognisable ${word}; no complete caption proposition claim.`,sourceAuthority:'src/data/childAssets.js; src/data/childWordImageOverrides.js',rightsAuthority:'Current shared image catalogue and associated source-art provenance; no new rights claim',reviewState:'current-catalogue; proposition coverage unobserved'});
  }
  for (const target of PHONEME_RECORDING_TARGETS) {
    const src=graphemeAudio(target.key);if(!src)continue;
    const prior=audio.get(src);
    const value={role:'phoneme',transcript:target.ipa,intendedIpa:target.ipa,phonemeId:target.key,dialect:'en-US',anchor:target.anchor,aliases:[...(prior?.aliases || []),target.key],sourceAuthority:'src/data/phonemeAudioBank.js; src/data/approvedPhonemeAudio.js; src/data/phonemeRecordingSpec.js',rightsAuthority:'docs/audio/PHONEME_RECORDING_STANDARD.md; public/audio/phonemes/reviewed/contextual-source.json and existing sound provenance',reviewState:'current runtime-approved cue; specification is intended value, not a new listening receipt'};
    audio.set(src,value);
  }
  for(const value of [{key:'th',id:'th-unvoiced',ipa:'/θ/',anchor:'thumb'},{key:'th_voiced',id:'th-voiced',ipa:'/ð/',anchor:'this'}])audio.set(assetUrl(getApprovedPhonemeAudioPath(value.key)),{role:'phoneme',transcript:value.ipa,intendedIpa:value.ipa,phonemeId:value.id,dialect:'en-US',anchor:value.anchor,sourceAuthority:'src/data/approvedPhonemeAudio.js',rightsAuthority:'Existing reviewed phoneme provenance; docs/audio/PHONEME_RECORDING_STANDARD.md',reviewState:'existing-reviewed-phoneme; no new human listening claim'});
  audio.set(assetUrl(getLedaInstructionAudioPath(PRESENT_AIR_WRITING_READY_COPY)),{role:'direction',transcript:PRESENT_AIR_WRITING_READY_COPY,dialect:'en-US',sourceAuthority:'src/copy/presentLearningCopy.js; current Leda production registry',rightsAuthority:'Existing recording provenance and docs/audio/PHONEME_RECORDING_STANDARD.md',reviewState:'existing canonical direction; delivery checked separately'});
  sharedMediaSemantics={audio,images};return sharedMediaSemantics;
}
function legacyTeachingRecord(entry,html,target,parts) {
  const values=[...html.matchAll(/data-review-(?:spelling|word)="([^"]+)"/g)].map(match=>plainText(match[1]));
  const labels=[...html.matchAll(/data-match-word="([^"]+)"/g)].map(match=>plainText(match[1]));
  const pictures=[...html.matchAll(/<span>([^<]+)<\/span>/g)].map(match=>plainText(match[1])).filter(Boolean);
  const spec={model:entry.teacher};
  if(['p-cover','p-close','p-goal-slide','p-books-slide','p-routines-slide'].includes(entry.cls))return {...spec,likelyError:'Not an individual literacy response item.',correction:'Orient the class to the named learning and materials; no attainment decision is made here.',support:'Teacher explains the lesson purpose and access choices.',stretch:'Invite a connection to this week’s learning.'};
  if(entry.cls==='p-letter-review'||entry.cls==='p-sound-review')return {...spec,likelyError:`Saying letter names or confusing sound values in ${values.join(', ') || target}.`,correction:'Identify the forgotten card, model its exact sound with a matching anchor, then re-present that card silently. For th contrast /θ/ voice off with /ð/ voice on.',support:'Retrieve one card at a time with mouth or throat gesture after the first attempt.',stretch:'Give a new spoken example beginning or ending with that exact value.'};
  if(entry.cls==='p-hfw-review')return {...spec,likelyError:`Recognising ${values.join(', ')} by location or echoing the class rather than reading.`,correction:'Name one of these words in a different order; compare its print and mapping with the confused word, then ask for a fresh phrase.',support:'Read the unfamiliar word and explain its regular/exception parts before a supported retry.',stretch:'Use the named word in a new spoken phrase without the group model.'};
  if(entry.cls==='p-writing')return {...spec,likelyError:`Starting ${target} in the wrong place, reversing direction or copying without remembering.`,correction:'Reveal the numbered model after the air-writing attempt; compare start point, direction, stroke sequence and legibility. Demonstrate the one observed difference.',support:'Use a larger air-writing motion or seated palm trace.',stretch:'Hide the formation model and air-write the spelling from memory; screen tracing is not a pencil-control score.'};
  if(entry.cls==='p-sight-match')return {...spec,likelyError:`Pairing by card position or comparing only the first letter among ${[...new Set(labels)].join(', ')}.`,correction:'Use the two-second comparison to read both words and compare their spelling parts. After they hide, ask the class to predict another pair.',support:'Read each revealed word aloud after the first retrieval attempt.',stretch:'On a match, use the word in a fresh spoken phrase; a matching picture is not required.'};
  if(entry.cls==='p-vocabulary')return {...spec,likelyError:`Confusing the pictured meanings or guessing unfamiliar labels among ${pictures.join(', ')}.`,correction:'Name the actual pictured object/action, explain what it is or does, and contrast it with the selected alternate before replaying all labels.',support:'Teacher reads the labels; children point, mime or use a real object.',stretch:'Describe a different example of one gallery word and explain why it fits.'};
  if(['p-blend','p-pattern-read','p-word-change'].includes(entry.cls))return {...spec,likelyError:`Reading ${target} by its picture, using letter names, or treating a multi-sound spelling chunk as one phoneme.`,correction:`Attend to ${parts.length?parts.join(' / '):target}; model each intended sound or chunk, blend through the whole word, then hide the model for a fresh attempt.`,support:'Teacher models only the difficult unit and labels the retry supported.',stretch:'Write or read a different word using the same taught correspondence and explain the changed unit.'};
  if(entry.cls==='p-phoneme')return {...spec,likelyError:`Changing the first sound when the prompt asks for the ending, or choosing a meaning association in ${target}.`,correction:'Restate the exact operation in the displayed prompt, orally separate the requested sound units, model one change and resample a new word.',support:'Use counters for the named spoken units; keep the print answer hidden.',stretch:'Produce a second valid response without the displayed examples.'};
  if(entry.cls==='p-together')return {...spec,likelyError:'The group echo can conceal a child who has not retrieved the named sound or word.',correction:'Repeat the same prompt quietly and listen to a deliberately sampled fresh response.',support:'Use a model and a gesture; mark the response supported.',stretch:'Ask for a new example with the retrieved sound or word.'};
  return {...spec,likelyError:`A response to ${target} may omit the feature named in this prompt.`,correction:`Return to the displayed ${entry.title} stimulus, demonstrate the named feature, then request a fresh response.`,support:'Use the specific object, gesture or oral model in this activity.',stretch:`Explain the named feature in a fresh example of ${target}.`};
}
function manifestForSlides(cycle, slides, entries, { day, format, reviewPolicy, deckKey, sortMode, planningBudgetMinutes, timingAllowances = {} }) {
  const full = presentationReviewContent(cycle.id, day);
  const selected = presentationReviewContent(cycle.id, day, reviewPolicy);
  const indexed = slides.map((html, index) => {
    const record = readTeachingRecord(html);
    const entry = entries[index];
    const attr = name => plainText(new RegExp(`${name}="([^"]*)"`).exec(html)?.[1] || '');
    let target = record.target || attr('data-pattern-word') || attr('data-blend-word') || plainText(/class="p-(?:sight|letter)"[^>]*>([^<]*)</.exec(html)?.[1] || '');
    const build = attr('data-build-target');
    let parts = [];
    try { parts = build ? JSON.parse(build) : []; } catch { /* semantic gate reports malformed targets */ }
    if (parts.length) target = parts.join('');
    const sentence = plainText(/data-track-sentence>([\s\S]*?)<\/div>/.exec(html)?.[1] || '');
    if (sentence) target = sentence;
    if(entry.cls==='p-writing')target=record.modelText || plainText(/aria-label="Finger trace ([^"]+)"/.exec(html)?.[1] || target);
    target ||= entry.title;
    const media = [];
    for (const match of html.matchAll(/(?:src|data-play|data-audio|data-writing-ready-audio)="([^"]+)"/g)) {
      const src = plainText(match[1]);
      if (!media.some(item => item.src === src)) media.push({ src, type: /\.(?:mp3|wav|ogg)(?:[?#]|$)/.test(src) ? 'audio':'image', role: /\.(?:mp3|wav|ogg)(?:[?#]|$)/.test(src) ? 'instructional-cue':'supporting-image', transcript: record.audioTranscript || '', required: Boolean(build || sentence || record.construct === 'oral-narrative') });
    }
    media.push(...(record.requiredAudio || []).filter(role=>!media.some(item=>role.src && item.src===role.src)).map(role=>({...role,src:role.src||""})));
    for (const card of record.reviewItems || []) if (card.imagePath) {
      const authored = {src:card.imagePath,type:"image",required:true,role:"vocabulary-support",imageRole:"vocabulary-support",meaning:card.anchorWord,sceneRequirements:`Recognisable ${card.anchorWord}; oral spelling recall anchor.`,sourceAuthority:"Current child word catalogue; approved initial-sound word bank"};
      const current = media.find(item => item.src === card.imagePath);
      if (current) Object.assign(current, authored); else media.push(authored);
    }
    // Hidden JSON scenes and narration are as real as visible first-frame media.
    for(const scene of [...(record.sentences || []),...(record.story?.events || []),...(record.vocabularyScenes || []),...(record.rounds || []),...(record.chain?.steps || []).map(step=>({audio:step.audio,target:step.to}))]) {
      const src=scene.imagePath || scene.image;if(src){const authored={src,type:'image',required:true,role:scene.imageRole || (scene.sentence || scene.text || scene.meaning?'proposition-scene':'vocabulary-support'),meaning:scene.correctSentence || scene.sentence || scene.text || scene.meaning || scene.target,sceneRequirements:scene.sceneRequirements || `The concrete requested ${scene.target}.`,imageRole:scene.imageRole || (scene.sentence || scene.text || scene.meaning?'proposition-scene':'vocabulary-support')};const current=media.find(item=>item.src===src);if(current)Object.assign(current,authored);else media.push(authored);}
      const cue=scene.audioPath || scene.audio;if(cue&&!media.some(item=>item.src===cue))media.push({src:cue,type:'audio',required:true});
    }
    const known=sharedMediaLookup();
    for (const mediaRecord of media) {
      const narration = Object.values(PRESENT_NARRATION_METADATA).find(item => assetUrl(item.audio || item.path || item.audioPath || item.src) === mediaRecord.src);
      const explicit = mediaRecord.src ? record.requiredAudio?.find(item=>item.src===mediaRecord.src && item.transcript) : null;
      if (narration) Object.assign(mediaRecord,{role:narration.role || 'sentence',transcript:narration.transcript,dialect:'en-US',aiGenerated:narration.aiGenerated,sourceAuthority:'src/data/generated/presentNarration.generated.js',rightsAuthority:narration.rightsSource || narration.provenance,reviewState:`technical decode: ${narration.codec}; human listening: ${narration.humanListening || 'unknown'}`});
      else if(mediaRecord.type==='audio')Object.assign(mediaRecord,known.audio.get(mediaRecord.src) || {role:explicit?.role || mediaRecord.role || 'teacher-model-cue',transcript:explicit?.transcript || mediaRecord.transcript || target,sourceAuthority:'Active lesson authored cue; shared resolver',rightsAuthority:'Existing source recording provenance; exact receipt not attached to this record',reviewState:mediaRecord.src?'current asset; semantic listening unobserved':'unavailable',dialect:'en-US'});
      else {
        const original={...mediaRecord};if(original.role==='supporting-image')delete original.role;Object.assign(mediaRecord,known.images.get(mediaRecord.src) || {role:isCharacterMedia(mediaRecord.src)?'decorative-character':'supporting-image',meaning:isCharacterMedia(mediaRecord.src)?'Decorative book character; no answer content':original.meaning || target,sourceAuthority:'Current local image catalogue and source-art manifest',rightsAuthority:'Existing image/source-art provenance; asset-level receipt not attached',reviewState:'current catalogue; no new visual-review claim'},original);
        if(record.imagePath && assetUrl(record.imagePath)===mediaRecord.src)Object.assign(mediaRecord,{role:record.imageRole || 'vocabulary-support',imageRole:record.imageRole || 'vocabulary-support',meaning:record.definition || target,sceneRequirements:record.sceneRequirements,sourceAuthority:record.mediaEvidence?.image?.sourceAuthority || 'src/data/presentVocabulary.js',rightsAuthority:record.mediaEvidence?.image?.rightsAuthority || 'Current image provenance',reviewState:record.mediaEvidence?.image?.reviewState || 'current authored scene metadata'});
        const authoredVocabularyScene=record.vocabularyScenes?.find(scene=>scene.imagePath===mediaRecord.src);if(authoredVocabularyScene)Object.assign(mediaRecord,authoredVocabularyScene,{role:'proposition-scene',imageRole:'proposition-scene'});
        if(record.sentences?.some(item=>item.imagePath===mediaRecord.src))Object.assign(mediaRecord,{sourceAuthority:'source-art/present/sentence-studio/manifest.json',rightsAuthority:'Original art; source-art/present/sentence-studio/manifest.json provenance',reviewState:'parent visual inspection 2026-10-11'});
        if(record.story?.events.some(item=>item.imagePath===mediaRecord.src))Object.assign(mediaRecord,{sourceAuthority:'Existing original seed sequence /images/assessment/literacy-interactions/seed-{1,2,3}.webp',rightsAuthority:'Existing original asset provenance; no new rights claim',reviewState:'parent visual inspection of all three events 2026-10-11'});
      }
      if(explicit)Object.assign(mediaRecord,{role:explicit.role,transcript:explicit.transcript,required:explicit.required});
    }
    if ((html.match(/data-audio-unavailable/g)||[]).length && !(record.requiredAudio || []).some(item=>!item.src)) media.push({src:'',type:'audio',role:'teacher-model-cue',transcript:target,required:false,availability:'unavailable-explicit-teacher-model',sourceAuthority:'Active lesson cue without installed recording',rightsAuthority:'No recording present; no media rights asserted',reviewState:'unavailable'});
    const teacher = { ...legacyTeachingRecord(entry,html,target,parts), ...(record.teacher || {}) };
    return { ...record, id: `${cycle.id}:${day || 'whole'}:${format}:${index}`, index, title: entry.title, section: entry.section, target, construct: record.construct || (parts.length ? 'encoding' : sentence ? 'supported-shared-reading' : entry.section === 'Writing' ? 'letter-formation' : entry.section === 'Words' ? 'high-frequency-word' : 'teacher-led-practice'), studentPrompt: plainText(/<h2[^>]*>([\s\S]*?)<\/h2>/.exec(html)?.[1] || ''), responseCue: attr('data-response-cue'), answer: record.answer || (parts.length ? target : ''), teacher, codeStatus: record.codeStatus || (parts.length ? 'taught-code-or-taught-HFW' : sentence ? 'adult-supported' : 'see-current-cycle'), audioRoles: media.filter(item=>item.type==='audio'), media, mediaUnavailable: (html.match(/data-audio-unavailable/g)||[]).length, responseTurns: Math.max(1,(html.match(/data-review-(?:word|spelling)=/g)||[]).length || parts.length || (html.match(/data-match-word=/g)||[]).length / 2), materials: { vocabularyScenes:record.vocabularyScenes || [], sort:record.sort || null, sentences:record.sentences || [], story:record.story || null, counterCount: record.boxCount || 0, graphemes: parts, tileBank: [...html.matchAll(/data-build-part="([^"]+)"/g)].map(match=>plainText(match[1])), pictureChoices: [...html.matchAll(/data-choice-value="([^"]+)"/g)].map(match=>plainText(match[1])), writingPrompt: entry.cls === 'p-writing' ? `Watch ${target}, hide the model, write from memory, then compare start, direction, sequence and legibility.` : '', images: media.filter(item=>item.type==='image' && !isCharacterMedia(item.src)).map(item=>item.src) } };
  });
  const responseTurns = indexed.reduce((sum,item)=>sum+item.responseTurns,0);
  const nominalBudgetMinutes=PRESENTATION_FORMATS.find(item=>item.value===format)?.minutes || 0;
  const budgetMinutes=Number.isFinite(Number(planningBudgetMinutes)) && Number(planningBudgetMinutes)>0?Math.min(180,Math.max(1,Number(planningBudgetMinutes))):nominalBudgetMinutes;
  const responseSeconds=Math.min(120,Math.max(1,Number(timingAllowances.responseSeconds) || 12));
  const transitionSeconds=Number.isFinite(Number(timingAllowances.transitionSeconds))?Math.min(120,Math.max(0,Number(timingAllowances.transitionSeconds))):20;
  const estimatedMinutes = cycle.type === "assessment" ? Math.ceil((responseTurns * responseSeconds + indexed.length * transitionSeconds) / 60) : presentationDayPlan(cycle.id,day).minutes;
  return { deckKey, cycleId: cycle.id, day, format, sortMode, sortChoices:PRESENT_SORT_ACTIVITIES.filter(item=>(item.prerequisites?.graphemes || []).every(g=>full.cards.some(card=>card.spelling===g))).map(item=>({value:item.construct,label:item.prompt})), slides:indexed, reviewCoverage: {mode:reviewPolicy.mode || 'full-cumulative', included:{graphemes:selected.cards.map(card=>card.spelling),words:selected.words}, omitted:{graphemes:full.cards.filter(card=>!selected.cards.some(item=>item.spelling===card.spelling)).map(card=>card.spelling),words:full.words.filter(word=>!selected.words.includes(word))}}, timing:{budgetMinutes,nominalBudgetMinutes,estimatedMinutes,responseTurns,observedMinutes:null,responseSeconds,transitionSeconds,estimateBasis:"18-minute activity-block plan: brief cumulative recap 3, focus 4, reading 2, games 5–6, picture/story round-up 3–4. Teacher-paced; 15–20 minute target, not an observed classroom duration."}, coverage:indexed.map(item=>({target:item.target,label:item.construct,responseTurns:item.responseTurns,section:item.section,mediaUnavailable:item.mediaUnavailable})), print:indexed.filter(item=>item.materials.graphemes.length || item.materials.pictureChoices.length || item.materials.writingPrompt || item.materials.counterCount || item.construct==='oral-narrative' || item.sentences?.length || item.materials.sentences.length || item.materials.sort || item.materials.vocabularyScenes.length).map(item=>({id:item.id,target:item.target,answer:item.answer,...item.materials})) };
}

export function buildPresentationCoverageDashboard() {
  const rows = [], warnings = [];
  for (const cycle of elSkillsBlockCycles.filter(item=>item.cycleNumber)) for (const day of Object.keys(DAY_LABELS)) for (const format of PRESENTATION_FORMATS.map(item=>item.value)) {
    const deck = buildCyclePresentation(cycle.id,{day,format});
    const manifest=deck.manifest;
    const oral=(cycle.phonemicAwareness || []).map((skill,skillIndex)=>({skill,skillIndex,count:[...deck.html.matchAll(/data-pa-skill="(\d+)"/g)].filter(match=>Number(match[1])===skillIndex).length}));
    const constructs={};for(const activity of manifest.slides)constructs[activity.construct]=(constructs[activity.construct]||0)+1;
    const variants=[...new Set([...deck.html.matchAll(/data-sound-variant="([^" ]+)"/g)].map(match=>match[1]))];
    const unavailable=manifest.slides.flatMap(item=>item.media).filter(item=>!item.src).length;
    const generatedSlides=[...deck.html.matchAll(/<section class="slide [^"]*"[\s\S]*?<\/section>/g)].map(match=>match[0]);
    const countTargets=(values,kind)=>values.map(value=>{const escaped=String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),attribute=kind==='grapheme'?'review-spelling':'(?:review-word|match-word)';const occurrences=[];manifest.slides.forEach((activity,i)=>{const direct=activity.target===value&&(kind==='grapheme'?['grapheme-phoneme','letter-formation'].includes(activity.construct):['high-frequency-word','audio-to-print-HFW'].includes(activity.construct));if(direct)occurrences.push({slideId:activity.id,title:activity.title,role:'teaching-target'});const cards=[...(generatedSlides[i] || '').matchAll(new RegExp('data-'+attribute+'="'+escaped+'"','g'))];cards.forEach((_,card)=>occurrences.push({slideId:activity.id,title:activity.title,role:'explicit-review-or-pair-card',cardIndex:card}));});return {target:value,count:occurrences.length,occurrences};});
    const languageObjectives=[];for(const activity of manifest.slides.filter(item=>['vocabulary-meaning','supported-shared-reading','supported-shared-reading-change','code-controlled-child-reading','oral-narrative'].includes(item.construct))){let objective=languageObjectives.find(item=>item.target===activity.target&&item.construct===activity.construct);if(!objective){objective={target:activity.target,construct:activity.construct,model:activity.teacher.model,count:0,occurrences:[]};languageObjectives.push(objective);}objective.count++;objective.occurrences.push({slideId:activity.id,title:activity.title,responseTurns:activity.responseTurns});}
    const teachingOccurrences={graphemes:countTargets(manifest.reviewCoverage.included.graphemes,'grapheme'),highFrequencyWords:countTargets(manifest.reviewCoverage.included.words,'word')};
    rows.push({cycleId:cycle.id,day,format,oral,review:{graphemes:manifest.reviewCoverage.included.graphemes,words:manifest.reviewCoverage.included.words},teachingOccurrences,languageObjectives,constructs,audioUnavailable:unavailable,thVariants:variants,estimatedMinutes:manifest.timing.estimatedMinutes,planningBudgetMinutes:manifest.timing.budgetMinutes});
    if(manifest.reviewCoverage.included.graphemes.includes('th')&&!['th-voiced','th-unvoiced'].every(value=>variants.includes(value)))warnings.push(`${cycle.id} ${day} ${format}: missing th value.`);
    if(unavailable)warnings.push(`${cycle.id} ${day} ${format}: ${unavailable} explicitly unavailable media roles.`);
  }
  return {choiceCount:rows.length,rows,warnings,occurrenceBasis:'Named teaching targets and explicit review/pair cards in actual generated slides. Incidental prose mentions and inferred mastery are excluded.',oralRationale:'Core and extended revisit both declared skills each day. Quick revisits alternate the first skill over Monday to Friday (3:2 or 2:3 intentionally); no array slicing chooses the curriculum priority.',evidenceLimit:'Generated semantic coverage; physical classroom duration, acoustics and fresh-item transfer remain observations.'};
}

export function buildPresentationManifest(cycleId, options = {}) { return buildCyclePresentation(cycleId,options).manifest; }
export function buildPresentationPrintHtml(cycleId, options = {}) {
  const deck = buildCyclePresentation(cycleId,options);
  const pages = deck.manifest.print.map(item=> {
    const special=item.sort ? `<p>${esc(item.sort.prompt)}</p><div class="sort-headings">${item.sort.headings.map(heading=>`<span>${esc(heading)}</span>`).join('')}</div><div class="print-cards">${item.sort.items.map(card=>`<figure>${item.sort.construct==='print-pattern'?`<strong>${esc(card.word)}</strong>`:`<img src="${esc(wordImage(card.word))}" alt="Picture to sort"/>${item.sort.construct==='semantic-category'?`<figcaption>${esc(card.word)}</figcaption>`:''}`}</figure>`).join('')}</div>` : item.sentences.length ? `<p>Read the print. Change the action word. Match each sentence with its scene after reading.</p><div class="print-cards">${item.sentences.map(card=>`<figure><strong>${esc(card.sentence)}</strong><img src="${esc(card.imagePath)}" alt="Sentence scene"/></figure>`).join('')}</div>` : item.story ? `<p>Cut the three scenes apart. Tell your partner: first, next, later. What helped the seed grow?</p><div class="print-cards">${item.images.map(src=>`<figure><img src="${esc(src)}" alt="Story scene"/></figure>`).join('')}</div>` : '';
    return `<section class="material" data-activity-id="${esc(item.id)}"><h2>${item.sort ? 'Sort and explain one rule' : item.sentences.length ? 'Read, change, show' : item.story ? 'Retell scene cards' : item.counterCount ? 'Sound counter mat' : item.graphemes.length ? 'Hear and build' : item.writingPrompt ? 'Write from memory' : 'Picture choices'}</h2>${item.counterCount ? `<div class="boxes">${Array.from({length:item.counterCount},()=>'<span></span>').join('')}</div><p>Move one counter for each spoken sound.</p>`:''}${item.tileBank.length ? `<div class="tiles">${item.tileBank.map(part=>`<span>${esc(part)}</span>`).join('')}</div><p>Hear your teacher. Build or write the word.</p>`:''}${item.pictureChoices.length ? `<div class="tiles">${item.pictureChoices.map(word=>`<span>${esc(word)}</span>`).join('')}</div>`:''}${item.vocabularyScenes.length ? `<div class="print-cards">${item.vocabularyScenes.map((scene,i)=>`<figure><img src="${esc(scene.imagePath)}" alt="Scene ${i+1} to describe"/></figure>`).join('')}</div><p>Compare the two cat scenes. Use the dog scene later with the model hidden.</p>` : special || item.images.slice(0,item.counterCount ? 1 : 3).map(src=>`<img src="${esc(src)}" alt="Activity picture"/>`).join('')}${item.writingPrompt ? `<p>${esc(item.writingPrompt)}</p><div class="writing-lines"></div>`:''}</section>`;
  }).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(deck.title)} · exact lesson materials</title><style>${fontFaces()}body{font-family:Andika,Arial,sans-serif;color:#201e1d;margin:20mm}h1{font-size:24px}h2{font-size:21px}.material{break-after:page}.boxes,.tiles{display:flex;gap:8mm;flex-wrap:wrap;margin:12mm 0}.boxes span{width:35mm;height:35mm;border:2px solid #201e1d}.tiles span{min-width:22mm;padding:5mm;border:2px dashed #201e1d;font-size:34px}img{height:45mm;width:55mm;object-fit:contain}.writing-lines{height:60mm;background:repeating-linear-gradient(white 0,white 14mm,#82796a 14.4mm,white 15mm)}.sort-headings,.print-cards{display:flex;gap:8mm;flex-wrap:wrap}.sort-headings span{border:2px solid #201e1d;padding:8mm;flex:1}.print-cards figure{border:2px dashed #201e1d;padding:4mm;margin:0;display:flex;flex-direction:column;font-size:24px}.teacher{break-before:page}.teacher li{margin:5mm 0}@page{size:A4;margin:15mm}</style></head><body><h1>${esc(deck.title)}</h1><p>Use these exact selected activity materials. Children respond before the teacher model. Planning budget: ${deck.manifest.timing.budgetMinutes} minutes; estimate: ${deck.manifest.timing.estimatedMinutes} minutes. ${esc(deck.manifest.timing.estimateBasis)}</p>${pages}<section class="teacher"><h1>Teacher key and preparation</h1><p>Keep this portion private. Supported participation is not a formal Cycle Check.</p><ol>${deck.manifest.slides.map(item=>`<li><strong>${esc(item.title)} · ${esc(item.target)}</strong>${item.answer ? `<p>Model: ${esc(item.answer)}</p>`:''}<p>${esc(item.teacher.model)}</p></li>`).join('')}</ol></section></body></html>`;
}

export function buildCyclePresentation(cycleId, { day = "", format = "core", startIndex = 0, sessionId = "", reviewPolicy = {}, quiet = true, speech = true, retrievalMode = "retrieval", sortMode = "auto", planningBudgetMinutes = null, timingAllowances = {} } = {}) {
  const cycle = getPresentationCycle(cycleId);
  if (!cycle) throw new Error("Unknown cycle");
  const requestedDay = normalizeDay(day);
  const dayKey = cycle.type === "assessment" ? "" : requestedDay;
  const formatKey = normalizeFormat(format);
  const world = presentationWorldFor(cycle);
  const slides = assembleSlides(cycle, world, dayKey, formatKey, reviewPolicy, sortMode);
  const slideIndex = indexSlides(slides);
  const projectedSlides = slides.map(html => html.replace(/<template data-teacher-(?:note|record)>[\s\S]*?<\/template>/g, ""));
  const initial = Number.isFinite(Number(startIndex)) ? Math.max(0, Math.min(slides.length - 1, Math.trunc(Number(startIndex)))) : 0;
  const baseTitle = cycle.cycleNumber ? `Cycle ${cycle.cycleNumber} - ${cycleTopic(cycle)}` : presentationCycleDisplayTitle(cycle);
  const title = dayKey ? `${baseTitle} - ${DAY_LABELS[dayKey]} - ${PRESENTATION_FORMATS.find(item => item.value === formatKey).label}` : baseTitle;
  const deckScriptUrl = assetUrl("/present/deck.js");
  const railLabel = dayKey ? `${railTitle(cycle)} · ${DAY_LABELS[dayKey]}` : railTitle(cycle);
  const deckKey = `${cycleId}:${dayKey}:${formatKey}:${reviewPolicy.mode || "full-cumulative"}:${(reviewPolicy.graphemes || []).join(',')}:${(reviewPolicy.words || []).join(',')}:${retrievalMode}:${sortMode}`;
  const manifest = manifestForSlides(cycle, slides, slideIndex, { day: dayKey, format: formatKey, reviewPolicy, deckKey, sortMode, planningBudgetMinutes, timingAllowances });
  const lessonPlan = dayKey ? { ...presentationDayPlan(cycleId, dayKey, {format: formatKey}), estimatedMinutes: manifest.timing.estimatedMinutes, timingBasis:manifest.timing.estimateBasis, responseTurns:manifest.timing.responseTurns, blocks:presentationDayPlan(cycleId,dayKey,{format:formatKey}).blocks.map(block=>{const activities=manifest.slides.filter(item=>slideIndex[item.index].block===block.id);return {...block,estimatedMinutes:Math.round((activities.reduce((sum,item)=>sum+item.responseTurns,0)*manifest.timing.responseSeconds+activities.length*manifest.timing.transitionSeconds)/6)/10,activities:activities.map(item=>item.title)};}), timeWarning: manifest.timing.estimatedMinutes > manifest.timing.budgetMinutes ? "Full review and response routines may take longer. Adjust the budget or stop at a saved slide boundary." : "This is a planning estimate; observe actual classroom time." } : null;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title>
<style>${fontFaces()}${DECK_CSS}${PRESENT_CLASS_GAMES_CSS}</style></head>
<body data-deck-key="${esc(deckKey)}" data-session-id="${esc(sessionId)}" data-quiet="${quiet}" data-speech="${speech}" data-retrieval-mode="${esc(retrievalMode)}" data-start-index="${initial}" data-world="${world.id}">
<div id="scaler"><div id="stage">
  <header id="rail"><span id="rail-title">${esc(railLabel)}</span><nav id="rail-sections" aria-label="Lesson sections"></nav></header>
  <div id="deck">${projectedSlides.join("")}</div>
  <div id="lesson-progress" role="progressbar" aria-label="Lesson progress" aria-valuemin="1" aria-valuemax="${slides.length}"><span></span></div>
  <nav id="nav" aria-label="Presentation controls"><button id="overview-toggle" type="button" aria-label="Choose a slide">Slides</button><button id="blank-toggle" type="button" aria-label="Pause the screen">Pause</button><button id="fullscreen-toggle" type="button" aria-label="Toggle full screen">Full screen</button><button id="prev" type="button" aria-label="Previous">&#8249;</button><span id="counter" aria-live="polite"></span><button id="next" type="button" aria-label="Next">&#8250;</button></nav>
  <div id="overview" role="dialog" aria-modal="true" aria-label="Choose a slide" hidden><header><h2>Choose a slide</h2><button id="overview-close" type="button">Back to lesson</button></header><div id="overview-list">${slideIndex.map(entry => `<button type="button" data-go-slide="${entry.index}"><span>${entry.index + 1}</span>${esc(entry.title)}</button>`).join("")}</div></div>
  <button id="blank-screen" type="button" hidden>Ready when you are<span>Tap or press B to return</span></button>
  <p id="audio-status" role="status"></p>
</div></div>
<div id="start"><p class="p-kicker">Whole-class learning</p><h1>${esc(baseTitle)}</h1><button id="startBtn" type="button">${ICON_PLAY}<span>Start presentation</span></button><p>Arrow keys move · Enter reveals · B pauses the screen · F opens full screen</p></div>
<script src="${assetUrl("/present/audio.js")}"></script><script src="${assetUrl("/present/classGames.js")}"></script><script src="${deckScriptUrl}"></script>
</body></html>`;
  return { title, slideCount: slides.length, html, slideIndex, lessonPlan, manifest };
}

export function presentationSlideIndex(cycleId, options = {}) {
  return buildCyclePresentation(cycleId, options).slideIndex;
}

export function openCyclePresentation(cycleId, options = {}) {
  const { html, title } = buildCyclePresentation(cycleId, options);
  const result = openHtmlDocument({ html, name: `lp-present-${options.sessionId || "standalone"}`, features: "width=1280,height=800", keepUrlWhenBlocked: true });
  return { ok: result.ok, url: result.url, title, window: result.window };
}

function fontFaces() {
  return [400, 700].flatMap(weight => [
    `@font-face {font-family: Andika; font-style: normal; font-weight: ${weight}; font-display: swap; src: url("${assetUrl(`/fonts/present/andika-latin-${weight}-normal.woff2`)}") format("woff2");}`,
    `@font-face {font-family: 'Source Sans 3'; font-style: normal; font-weight: ${weight}; font-display: swap; src: url("${assetUrl(`/fonts/present/source-sans-3-latin-${weight}-normal.woff2`)}") format("woff2");}`
  ]).join("");
}

// Self-hosted Andika is the literacy face, including headings. System stacks
// retain readable glyphs while the small font files load.
const FONT_BODY = `'Source Sans 3','Segoe UI','Helvetica Neue',Arial,sans-serif`;
const FONT_DISPLAY = `'Andika','Segoe UI Rounded','Arial Rounded MT Bold','Trebuchet MS',sans-serif`;
const FONT_LETTER = `'Andika','Segoe UI Rounded','Arial Rounded MT Bold','Trebuchet MS',sans-serif`;

const DECK_CSS = `
  /* Quiet classroom hierarchy: small teacher notes, large child stimuli. */
  .p-teacher-prompt { font-size:26px; line-height:1.35; color:var(--ink-muted); margin:12px 0 24px; }
  .slide > [data-review-carousel] { width:100%; }
  .p-review-focus { font-size:230px; line-height:1.3; font-weight:700; text-align:center; margin:36px 0; }
  .p-recap-stimulus { display:grid; grid-template-columns:1fr 1fr; align-items:center; gap:72px; max-width:1200px; min-height:430px; margin:24px auto; }
  .p-recap-anchor { margin:0; text-align:center; }
  .p-recap-anchor img { width:300px; height:300px; object-fit:contain; }
  .p-recap-anchor figcaption { font:700 88px/1.2 ${FONT_LETTER}; margin-top:14px; }
  .p-review-count { text-align:center; font-size:24px; color:var(--ink-muted); }
  [data-review-carousel] .p-lesson-actions, [data-review-variants] { justify-content:center; }
  .p-week-sounds,.p-week-words,.p-roundup-stimulus { display:flex; flex-wrap:wrap; justify-content:center; gap:32px; margin:46px 0; }
  .p-roundup-stimulus span { font-size:128px; font-weight:700; }
  /* Chalk white and cobalt: docs/design/BLUE_UI_AND_SIMPLE_HOLLOW.md.
     World identity comes from the original character art, not UI recoloring. */
  :root {
    --bg: #F7F8FA;
    --ink: #18263E;
    --ink-muted: #5C677A;
    --surface: #FFFFFF;
    --accent: #3454C8;
    --accent-100: #F7F8FA;
    --accent-200: #E9EDF9;
    --accent-300: #CCD5F4;
    --accent-600: #3454C8;
    --accent-700: #3454C8;
    --sage: #3454C8;
    --sage-100: #F7F8FA;
    --sage-200: #E9EDF9;
    --sage-300: #CCD5F4;
    --sage-600: #3454C8;
    --sage-700: #2844A9;
    --sage-800: #18263E;
    --n-200: #E9EDF9;
    --n-300: #DFE3EB;
    --n-400: #929DAF;
    --n-500: #5C677A;
    --n-600: #5C677A;
    --n-700: #18263E;
    --n-900: #18263E;
    --radius: 28px;
    --shadow-md: 0 3px 10px rgba(24,38,62,.10);
    --shadow-lg: 0 12px 32px rgba(24,38,62,.14);
    /* Type scale authored against the fixed classroom stage. */
    --t-rail: 26px;
    --t-kicker: 32px;
    --t-small: 30px;
    --t-body: 44px;
    --t-h2: 72px;
    --t-h1: 120px;
    --t-title: 116px;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; overflow: hidden; background: var(--bg);
    color: var(--ink); font-family: ${FONT_BODY}; }
  ::selection { background: var(--accent-200); }
  :focus { outline: none; }
  :focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }

  /* ── The stage ───────────────────────────────────────────────────────────
     Everything lays out at exactly 1920x1080 and deck.js scales #stage to the
     window. This is what killed the old clipping: a slide can no longer be
     shorter than its content, because the box never changes size.
     Centering is done with an explicit translate in the transform (set by
     deck.js), NOT with grid place-items: Chromium start-aligns a grid item
     that overflows its track, which pushed the stage down-right and cut it
     off on every window smaller than 1920x1080. */
  #scaler { position: fixed; inset: 0; overflow: hidden; }
  #stage { position: absolute; left: 50%; top: 50%; width: 1920px; height: 1080px;
    transform: translate(-50%, -50%); transform-origin: center center;
    background: var(--bg); overflow: hidden; }

  /* ── The persistent frame ───────────────────────────────────────────────── */
  #rail { position: absolute; top: 0; left: 0; right: 0; height: 128px; z-index: 5;
    display: flex; align-items: center; justify-content: space-between; gap: 40px;
    padding: 0 80px; transition: opacity .25s ease; }
  #stage.chromeless #rail { visibility: hidden; }
  #rail-title { font-size: var(--t-rail); font-weight: 600; color: var(--n-700); white-space: nowrap; max-width: 460px; overflow: hidden; text-overflow: ellipsis; }
  #rail-sections { display: flex; align-items: center; gap: 4px; overflow: auto; scrollbar-width: thin; }
  .rail-pill { border: 0; background: transparent; font-family: inherit; cursor: pointer; font-size: 23px; font-weight: 600; color: var(--n-600);
    padding: 10px 14px; border-radius: 999px; white-space: nowrap; }
  .rail-pill.on { background: var(--accent-200); color: var(--accent-700); }
  .rail-pill.done { color: var(--n-500); }

  /* ── Slides ─────────────────────────────────────────────────────────────── */
  .slide { position: absolute; inset: 0; display: none; flex-direction: column;
    align-items: flex-start; justify-content: center; gap: 36px;
    text-align: left; padding: 168px 104px 128px; overflow: hidden; }
  .slide.active { display: flex; animation: rise .45s cubic-bezier(.2,.9,.3,1) both; }
  @keyframes rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }

  /* Cover and close run full bleed on the sage ground, with no rail. */
  .p-cover, .p-close, .p-together { padding: 96px 104px; display: none; }
  .p-cover.active, .p-close.active, .p-together.active { display: grid; }
  .p-cover, .p-together { grid-template-columns: 1fr 620px; align-items: center; gap: 64px;
    background: var(--sage-800); color: var(--bg); }
  .p-close { grid-template-columns: 1fr 520px; align-items: center; gap: 64px; }
  .p-cover-text { display: flex; flex-direction: column; align-items: flex-start; gap: 36px; }
  .p-cover-art { position: relative; display: flex; align-items: center; justify-content: center; }
  .p-blob { position: absolute; width: 520px; height: 520px; border-radius: 999px; background: var(--sage-700); }

  .p-ico { width: 1em; height: 1em; fill: none; stroke: currentColor; stroke-width: 2.75;
    stroke-linecap: round; stroke-linejoin: round; flex: 0 0 auto; }
  .p-ico polygon { fill: currentColor; stroke-linejoin: round; }
  .p-arrow { width: 90px; height: 90px; fill: none; stroke: var(--n-400); stroke-width: 2.75;
    stroke-linecap: round; stroke-linejoin: round; flex: 0 0 auto; }

  .p-kicker { margin: 0; font-size: var(--t-kicker); font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase; color: var(--accent-600); }
  .p-kicker-sage { color: var(--sage-600); }
  .p-kicker-invert { color: var(--sage-300); }
  .p-title { margin: 0; font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: var(--t-title);
    line-height: .92; letter-spacing: -.02em; }
  .p-h1 { margin: 0; font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: var(--t-h1); line-height: 1; }
  .p-h1-invert { margin: 0; font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: 92px;
    line-height: 1.1; color: var(--bg); }
  .p-h2 { margin: 0; font-family: ${FONT_LETTER}; font-weight: 700; font-size: var(--t-h2);
    line-height: 1.2; max-width: 30ch; text-wrap: pretty; }
  .p-h2 b { color: var(--accent-700); }
  .p-goal { margin: 0; font-family: ${FONT_LETTER}; font-weight: 700; font-size: 132px;
    line-height: 1.14; max-width: 20ch; text-wrap: pretty; }
  .p-phase { margin: 0; font-size: var(--t-body); color: var(--sage-300); }
  .p-blurb { margin: 0; font-size: var(--t-body); line-height: 1.3; color: var(--sage-300); max-width: 22ch; text-wrap: pretty; }
  .p-blurb-dark { margin: 0; font-size: 38px; line-height: 1.35; color: var(--n-700); max-width: 26ch; text-wrap: pretty; }
  .p-hint { margin: 0; font-size: var(--t-small); color: var(--n-500); }
  .p-cover .p-hint, .p-together .p-hint { color: var(--sage-300); }
  .p-response { display: inline-flex; align-self: flex-start; margin: 0; padding: 28px 56px;
    border-radius: 999px; background: var(--sage-700);
    font-family: ${FONT_LETTER}; font-weight: 700; font-size: 96px; color: var(--sage-100); }

  /* ── Two-column teaching layouts ────────────────────────────────────────── */
  .p-two-col { flex: 1; width: 100%; display: grid; grid-template-columns: 640px 1fr;
    gap: 80px; align-items: center; }
  .p-two-col-wide { grid-template-columns: 1fr 520px; }
  .p-two-col-narrow { grid-template-columns: 380px 1fr; }
  .p-col-left { display: flex; flex-direction: column; align-items: flex-start; gap: 32px; }
  .p-col-left-text { gap: 28px; }
  .p-col-right { display: flex; flex-direction: column; align-items: flex-start;
    justify-content: center; gap: 32px; min-width: 0; }
  .p-col-rule { border-left: 4px solid var(--n-300); padding-left: 56px; }

  /* ── Letter sound ───────────────────────────────────────────────────────── */
  .p-disc { width: 520px; height: 520px; border-radius: 999px; background: var(--accent-200);
    display: flex; align-items: center; justify-content: center; flex: 0 0 auto; }
  .p-letter { font-family: ${FONT_LETTER}; font-weight: 700; line-height: 1; color: var(--accent-700); }
  .p-sound-row { display: flex; flex-wrap:wrap; align-items: center; gap: 24px; }
  .p-phoneme { font-family: ${FONT_LETTER}; font-weight: 700; font-size: 56px; color: var(--sage-700); }
  .p-words { display: grid; gap: 36px; width: 100%; }
  .p-words-1 { grid-template-columns: minmax(0, 420px); }
  .p-words-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); max-width: 760px; }
  .p-words-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .p-word { display: flex; flex-direction: column; align-items: center; gap: 20px;
    background: var(--surface); border: 0; border-radius: var(--radius); padding: 32px 20px;
    cursor: pointer; box-shadow: var(--shadow-md); font: inherit; color: inherit;
    transition: background .15s ease, transform .15s ease; }
  .p-word:hover { background: var(--accent-100); transform: translateY(-6px); }
  .p-word:active { background: var(--accent-200); transform: none; }
  .p-word img { width: 220px; height: 220px; object-fit: contain; }
  .p-word span { font-family: ${FONT_LETTER}; font-size: 52px; font-weight: 700; }

  /* ── Buttons ────────────────────────────────────────────────────────────── */
  .p-audio { display: inline-flex; align-items: center; gap: 14px; background: var(--accent-700);
    color: var(--bg); border: 0; border-radius: 999px; padding: 20px 40px;
    font-family: ${FONT_BODY}; font-size: 32px; font-weight: 700; cursor: pointer;
    transition: background .15s ease; }
  .p-audio:hover { background: #2844A9; }
  .p-audio:active { background: #18263E; }
  .p-audio-ghost, .p-reveal-btn { display: inline-flex; align-items: center; gap: 14px;
    background: transparent; color: var(--accent-700); border: 3px solid var(--accent);
    border-radius: 999px; padding: 18px 38px; font-family: ${FONT_BODY}; font-size: 32px;
    font-weight: 700; cursor: pointer; transition: background .15s ease; }
  .p-audio-ghost:hover, .p-reveal-btn:hover { background: var(--accent-200); }
  .p-audio-ghost:active, .p-reveal-btn:active { background: var(--accent-300); }

  /* ── Reveal ─────────────────────────────────────────────────────────────── */
  .p-sound-hunt { gap: 20px; }
  .p-sound-hunt .p-word { padding: 20px; }
  .p-sound-hunt .p-word img { width: 180px; height: 180px; }
  .p-sound-hunt .p-h2 { font-size: 60px; }
  .p-pacing { position: absolute; top: 104px; right: 104px; margin: 0; font-size: 26px; color: var(--n-700); background: var(--surface); padding: 8px 16px; border-radius: 16px; }
  .p-answer { visibility: hidden; opacity: 0; transition: opacity .35s ease; }
  .slide.revealed .p-answer { visibility: visible; opacity: 1; }
  .p-tag-sage { font-size: var(--t-kicker); font-weight: 700; color: var(--sage-700); }
  .p-tag-accent { font-size: var(--t-kicker); font-weight: 700; color: var(--accent-600); }

  /* ── Thinking-time ring ─────────────────────────────────────────────────── */
  .p-timer-wrap { position: absolute; right: 104px; bottom: 176px; display: flex;
    flex-direction: column; align-items: center; gap: 20px; }
  .p-timer { position: relative; width: 260px; height: 260px; border-radius: 999px;
    border: 0; padding: 0; cursor: pointer; background: var(--n-300);
    display: flex; align-items: center; justify-content: center; }
  .p-timer-ring { position: absolute; inset: 0; border-radius: 999px;
    background: conic-gradient(var(--accent) var(--t-deg, 360deg), var(--n-300) var(--t-deg, 360deg)); }
  .p-timer-face { position: relative; width: 214px; height: 214px; border-radius: 999px;
    background: var(--bg); display: flex; align-items: center; justify-content: center;
    font-family: ${FONT_DISPLAY}; font-size: 76px; color: var(--n-700); }
  .p-timer-label { font-size: var(--t-rail); font-weight: 600; color: var(--n-600); }

  /* ── Words, chips, tiles ────────────────────────────────────────────────── */
  .p-sight { font-family: ${FONT_LETTER}; font-size: 260px; font-weight: 700; line-height: 1; }
  .p-tiles { display: flex; gap: 20px; }
  .p-tile { width: 100px; height: 100px; border-radius: 24px; background: var(--surface);
    display: flex; align-items: center; justify-content: center;
    font-family: ${FONT_LETTER}; font-size: 56px; font-weight: 700; color: var(--n-700); }
  .p-tile-btn { width: 200px; height: 200px; border-radius: 36px; background: var(--surface);
    border: 4px solid var(--n-300); font-family: ${FONT_LETTER}; font-size: 120px;
    font-weight: 700; color: var(--ink); cursor: pointer; transition: border-color .15s ease; }
  .p-tile-btn:hover { border-color: var(--accent); }
  .p-made { min-width: 420px; height: 200px; padding: 0 48px; border-radius: 36px;
    background: var(--accent-700); border: 0; font-family: ${FONT_LETTER}; font-size: 120px;
    font-weight: 700; color: var(--bg); cursor: pointer; transition: background .15s ease; }
  .p-made:hover { background: #2844A9; }
  .p-made:active { background: #18263E; }
  .p-sentence { margin: 0; font-family: ${FONT_LETTER}; font-size: 68px; line-height: 1.3; }
  .p-big-word { font-family: ${FONT_LETTER}; font-size: 200px; font-weight: 700; line-height: 1;
    color: var(--ink); background: none; border: 0; cursor: pointer; }
  .p-big-word.made { color: var(--accent-700); }
  .p-take, .p-compound { display: flex; align-items: center; gap: 48px; flex-wrap: wrap; }
  .p-compound { gap: 32px; }
  .p-chips { display: flex; gap: 24px; flex-wrap: wrap; align-items: center; max-width: 1600px; }
  .p-chip { background: var(--surface); color: var(--ink); border: 4px solid var(--n-300);
    border-radius: 999px; padding: 16px 40px; font-family: ${FONT_LETTER}; font-weight: 700;
    font-size: 56px; cursor: pointer; transition: border-color .15s ease, background .15s ease; }
  .p-chip:hover { border-color: var(--accent); }
  .p-chip.big { font-size: 72px; }
  .p-chip.accent { background: var(--accent-200); border-color: transparent; color: var(--accent-700); font-size: 64px; }
  .p-chip.accent:hover { background: var(--accent-300); }
  .p-chip.sage { background: var(--sage-200); border-color: transparent; color: var(--sage-700); font-size: 64px; }
  .p-chip.sage:hover { background: var(--sage-300); }
  .p-recap { gap: 24px; }

  /* ── Rhyme panels ───────────────────────────────────────────────────────── */
  .p-rhyme { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; width: 100%; max-width: 1500px; }
  .p-rhyme-item { display: flex; flex-direction: column; align-items: center; gap: 20px; }
  .p-panel { width: 100%; height: 220px; border-radius: 36px; border: 0; background: var(--sage-200);
    font-family: ${FONT_LETTER}; font-size: 104px; font-weight: 700; color: var(--sage-800);
    cursor: pointer; transition: background .15s ease; }
  .p-panel:hover { background: var(--sage-300); }
  .slide.revealed .p-panel.odd { background: var(--accent-200); color: var(--accent-700); }
  .slide.revealed .p-panel.odd:hover { background: var(--accent-300); }

  /* ── Writing demo ───────────────────────────────────────────────────────── */
  .p-paper { background: var(--surface); border-radius: 36px; padding: 40px 56px;
    box-shadow: var(--shadow-md); display: flex; align-items: center; justify-content: center; }
  .p-write-svg { width: 100%; height: auto; max-height: 620px; display: block; }
  .p-write-svg .p-guide { stroke: var(--n-300); stroke-width: 1.5; }
  .p-write-svg .p-guide.dash { stroke-dasharray: 6 5; }
  .p-write-svg .p-guide.base { stroke: var(--n-400); stroke-width: 2; }
  .p-write-svg .p-ghost-stroke { fill: none; stroke: var(--n-200); stroke-width: 12;
    stroke-linecap: round; stroke-linejoin: round; }
  .p-write-svg .p-ink-stroke { fill: none; stroke: var(--accent); stroke-width: 12;
    stroke-linecap: round; stroke-linejoin: round; }
  .p-pencil { opacity: 0; transition: opacity 160ms ease; }
  .p-write-ready { font-size: 32px; line-height: 1.35; min-height: 86px; }
  .p-write-actions { display: flex; flex-wrap: wrap; gap: 20px; }
  .p-pencil circle { fill: var(--accent-300); stroke: var(--accent-700); stroke-width: 2.5; }
  .p-pencil path { fill: var(--accent-200); stroke: var(--accent-700); stroke-width: 2.5; stroke-linejoin: round; }

  /* ── Books ────────────────────────────────────────────────────────────── */

  .p-books { display: grid; grid-template-columns: repeat(2, 1fr); gap: 56px; }
  .p-book { margin: 0; display: flex; flex-direction: column; gap: 24px; }
  .p-book-cover { width: 100%; height: 440px; object-fit: contain; border-radius: var(--radius);
    box-shadow: var(--shadow-lg); }
  .p-book figcaption { display: flex; flex-direction: column; gap: 10px; }
  .p-book-title { font-family: ${FONT_DISPLAY}; font-size: 44px; line-height: 1.15; }
  .p-book-level { font-size: 28px; font-weight: 600; color: var(--sage-600); }
  .p-routines { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column;
    gap: 20px; font-size: 40px; max-width: 1400px; }
  .p-routines li { background: var(--surface); border-radius: var(--radius); padding: 24px 40px;
    box-shadow: var(--shadow-md); }

  /* ── Mascot ─────────────────────────────────────────────────────────────── */
  .p-pal-corner { position: absolute; bottom: 152px; right: 104px; height: 200px;
    pointer-events: none; z-index: 1; animation: mascot-enter .6s ease-out both;
    filter: drop-shadow(0 12px 20px rgba(46,43,37,.22)); }
  .p-pal-hero { position: relative; height: 540px; object-fit: contain;
    animation: mascot-enter .6s ease-out both; filter: drop-shadow(0 24px 40px rgba(0,0,0,.35)); }
  .p-close .p-pal-hero { height: 500px; filter: drop-shadow(0 20px 34px rgba(46,43,37,.3)); }
  @keyframes mascot-enter { from { opacity: 0; transform: translateY(24px) rotate(3deg); } to { opacity: 1; transform: none; } }

  /* ── Start overlay and nav ──────────────────────────────────────────────── */
  #start { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 24px; z-index: 10; background: var(--bg); }
  #start button { display: inline-flex; align-items: center; gap: 16px; font-family: ${FONT_BODY};
    font-weight: 700; font-size: 34px; background: var(--accent-700); color: var(--bg); border: 0;
    border-radius: 999px; padding: 22px 64px; cursor: pointer; transition: background .15s ease; }
  #start button:hover { background: #2844A9; }
  #start button:active { background: #18263E; }
  #start p { color: var(--n-600); font-size: 20px; }
  #nav { position: absolute; right: 48px; bottom: 28px; z-index: 6; display: flex;
    align-items: center; gap: 14px; }
  #nav button { font-size: 40px; line-height: 1; background: var(--surface); color: var(--n-700);
    border: 3px solid var(--n-300); border-radius: 999px; width: 72px; height: 72px;
    cursor: pointer; transition: border-color .15s ease, color .15s ease; }
  #nav button:hover { border-color: var(--accent); color: var(--accent-700); }
  #counter { color: var(--n-600); font-size: var(--t-rail); font-weight: 600; min-width: 7ch;
    text-align: center; }

  [hidden] { display: none !important; }
  button:disabled { cursor: default; opacity: .4; }
  #nav #overview-toggle, #nav #blank-toggle, #nav #fullscreen-toggle { width: auto; padding: 0 24px; font: 700 27px ${FONT_BODY}; }
  #nav button:focus-visible, .rail-pill:focus-visible { outline: 5px solid var(--sage-700); outline-offset: 4px; }
  #lesson-progress { position: absolute; bottom: 0; inset-inline: 0; height: 8px; background: var(--n-300); z-index: 7; }
  #lesson-progress span { display: block; height: 100%; background: var(--accent); transform-origin: left; transition: transform .3s ease; }
  #start { padding: 30px; text-align: center; }
  #start h1 { font-family: ${FONT_LETTER}; max-width: 22ch; font-size: clamp(28px, 4vw, 56px); margin: 0 0 16px; }
  #start p { max-width: 60ch; line-height: 1.5; }
  #overview { position: absolute; inset: 40px; z-index: 8; padding: 42px; background: var(--surface); border: 3px solid var(--n-300); border-radius: 32px; box-shadow: var(--shadow-lg); }
  #overview header { display: flex; justify-content: space-between; align-items: center; gap: 30px; margin-bottom: 32px; }
  #overview h2 { font-size: 48px; margin: 0; }
  #overview button { font: 700 32px ${FONT_BODY}; border: 2px solid var(--n-300); background: var(--bg); color: var(--ink); border-radius: 16px; padding: 24px; cursor: pointer; }
  #overview-list { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 18px; max-height: 820px; overflow: auto; padding: 6px; }
  #overview-list button { text-align: left; display: flex; gap: 22px; align-items: center; }
  #overview-list button span { font-variant-numeric: tabular-nums; font-size: 26px; color: var(--n-700); }
  #overview-list [aria-current="true"] { border-color: var(--accent); background: var(--accent-100); }
  #blank-screen { position: absolute; inset: 0; z-index: 9; border: 0; background: #18263E; color: #FFFFFF; font: 700 76px ${FONT_LETTER}; cursor: pointer; width: 100%; }
  #blank-screen span { display: block; font: 400 32px ${FONT_BODY}; margin-top: 32px; }
  #audio-status { position: absolute; left: 80px; bottom: 38px; max-width: 720px; margin: 0; font-size: 24px; color: var(--ink); background: var(--surface); border-radius: 14px; z-index: 7; }
  #audio-status:not(:empty) { padding: 16px; }
  .p-change-row { display: flex; align-items: center; gap: 40px; }
  .p-change-row .p-tile { font-size: 90px; }
  .p-changed-part { background: var(--accent-200); color: var(--accent-700); outline: 5px solid var(--accent-700); outline-offset: 4px; }
  .p-lesson-actions { display: flex; flex-wrap: wrap; gap: 24px; }
  .p-build { display: flex; flex-direction: column; gap: 24px; align-items: flex-start; }
  .p-build-slots, .p-build-bank { display: flex; gap: 24px; align-items: center; flex-wrap: wrap; }
  .p-build-slot { min-width: 130px; min-height: 138px; display: grid; place-items: center; padding: 12px 24px; border: 4px dashed var(--n-400); border-radius: 22px; font: 700 84px ${FONT_LETTER}; }
  .p-build-slot.filled { border-style: solid; border-color: var(--sage-700); background: var(--sage-100); animation: fill-part .2s ease-out; }
  .p-build-feedback { font-size: 36px; margin: 0; min-height: 50px; }
  .p-build-bank button:disabled { opacity: .25; }
  .p-word-build .p-h2 { font-size: 60px; max-width: none; }
  .p-word-build { gap: 24px; }
  .p-review-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 28px; width: 100%; }
  .p-review-card { min-height: 180px; padding: 16px; border: 3px solid var(--n-300); border-radius: 28px; background: var(--surface); color: var(--ink); font: 700 72px ${FONT_LETTER}; cursor: pointer; }
  .p-review-card:hover { background: var(--accent-100); border-color: var(--accent); }
  .p-letter-review .p-h2, .p-hfw-review .p-h2, .p-sight-match .p-h2, .p-vocabulary .p-h2, .p-picture-match .p-h2 { font-size: 60px; max-width: none; }
  .p-match { width: 100%; display: flex; flex-direction: column; align-items: flex-start; gap: 24px; }
  .p-match-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 24px; width: 100%; }
  .p-match-card { height: 168px; border: 4px solid var(--accent); border-radius: 28px; background: var(--accent); color: var(--surface); font: 700 72px ${FONT_LETTER}; cursor: pointer; }
  .p-match-card.is-open { background: var(--surface); color: var(--ink); }
  .p-match-card.is-matched { background: var(--sage-100); color: var(--sage-800); opacity: 1; border-style: dashed; }
  .p-match-card.is-matched .p-card-word::after { content: ' ✓'; font-size: 40px; }
  .p-game-feedback { font: 400 32px/1.4 ${FONT_LETTER}; min-height: 90px; margin: 0; }
  .p-picture-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; width: 100%; }
  .p-picture-card { display: flex; align-items: center; gap: 22px; min-height: 210px; padding: 22px; border: 3px solid var(--n-300); border-radius: 26px; background: var(--surface); color: var(--ink); cursor: pointer; font: 700 46px ${FONT_LETTER}; }
  .p-picture-card img { width: 170px; height: 170px; object-fit: contain; }
  .p-picture-card span { overflow-wrap: anywhere; }
  .p-picture-sentence { display: grid; grid-template-columns: 520px minmax(0, 1fr); gap: 60px; align-items: center; width: 100%; }
  .p-picture-sentence > img { width: 520px; height: 490px; object-fit: contain; background: var(--surface); border-radius: 36px; padding: 24px; }
  .p-picture-sentence > div { display: flex; flex-direction: column; gap: 36px; }
  .p-picture-sentence .p-shared-sentence { font-size: 68px; line-height: 1.45; padding: 28px; gap: 4px 12px; }
  .p-picture-game { display: grid; grid-template-columns: 520px minmax(0, 1fr); gap: 24px 64px; width: 100%; align-items: center; }
  .p-game-picture { width: 520px; height: 420px; object-fit: contain; border-radius: 36px; background: var(--surface); padding: 24px; }
  .p-choice-bank { display: flex; flex-direction: column; gap: 24px; }
  .p-choice { min-height: 118px; padding: 14px 32px; background: var(--surface); color: var(--ink); border: 4px solid var(--n-300); border-radius: 24px; font: 700 70px ${FONT_LETTER}; cursor: pointer; }
  .p-choice.is-correct { border-color: var(--sage-700); background: var(--sage-100); }
  .p-picture-game .p-game-feedback { grid-column: 1 / -1; }
  .p-spelling-layout { display: flex; gap: 56px; align-items: center; width: 100%; }
  .p-spelling-picture { width: 380px; height: 400px; object-fit: contain; padding: 20px; background: var(--surface); border-radius: 28px; }
  .p-spelling-layout > div { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 20px; }
  .p-spelling-layout .p-tile-btn { width: 120px; height: 110px; font-size: 68px; border-radius: 22px; }
  .p-spelling-layout .p-build-slot { min-width: 106px; min-height: 110px; padding: 10px 18px; font-size: 68px; }
  .p-spelling-layout .p-build { gap: 20px; }
  .p-spelling-layout .p-build-bank, .p-spelling-layout .p-build-slots { gap: 18px; }
  .p-spelling-layout .p-build-feedback { font-size: 32px; }
  .p-vocabulary .p-hint, .p-sentence-track .p-hint, .p-hfw-review .p-hint, .p-letter-review .p-hint { color: var(--n-700); }
  .p-writing .p-says { font-size: 56px; }
  .p-writing .p-write-actions { gap: 16px; }
  .p-writing .p-audio { font-size: 27px; padding: 16px 26px; }
  .p-write-svg { touch-action: none; cursor: crosshair; user-select: none; }
  .p-finger-stroke { fill: none; stroke: var(--sage-700); stroke-width: 6; stroke-linecap: round; stroke-linejoin: round; pointer-events: none; }
  .p-stroke-start { fill: var(--accent-700); stroke: var(--bg); stroke-width: 1; pointer-events: none; }
  .p-stroke-number { fill: var(--bg); font: 700 6px ${FONT_BODY}; text-anchor: middle; pointer-events: none; }
  .p-shared-sentence { display: flex; flex-wrap: wrap; gap: 14px 22px; padding: 36px; border-radius: 28px; background: var(--surface); font: 700 76px/1.5 ${FONT_LETTER}; max-width: 1660px; }
  .p-shared-sentence span { border-radius: 12px; padding: 0 10px; border-bottom: 6px solid transparent; }
  .p-shared-sentence .is-guided { background: var(--accent-200); border-bottom-color: var(--accent-700); }
  .p-compound .is-guided { transform: translateY(-14px); outline: 6px solid var(--accent-700); outline-offset: 8px; background: var(--accent-200); color: var(--ink); }
  .p-compound .p-tile, .p-compound .p-tile-btn, .p-compound .p-made { transition: transform .22s ease, background .22s ease; }
  .p-pattern-read { gap: 24px; }
  .p-pattern-read .p-tile { font-size: 100px; padding: 12px 32px; }
  .p-pattern-read .p-answer { display: flex; align-items: center; gap: 24px; }
  .p-pattern-read .p-response { font-size: 80px; padding: 18px 40px; }
  .try-again { animation: try-part .24s ease; }
  [hidden] { display: none !important; }
  .p-hint, .rail-pill, .rail-pill.done, .p-timer-label, #counter, #start p { color: var(--n-700); }
  .p-kicker, .p-tag-accent { color: var(--accent-700); }
  .p-kicker-sage { color: var(--sage-700); }
  .p-kicker-invert { color: var(--sage-300); }
  /* Only classroom stimuli use the fixed canvas. Teacher controls use actual
     viewport pixels, including the narrow preview and tablet projector. */
  #rail { position: fixed; height: 52px; padding: 6px 12px; gap: 12px; background: var(--surface); }
  #rail-title { font-size: 15px; max-width: 34vw; }
  #rail-sections { gap: 4px; }
  .rail-pill { font-size: 15px; padding: 10px 12px; min-height: 44px; }
  #nav { position: fixed; bottom: 0; left: 0; right: 0; width: auto; height: 54px; padding: 5px 10px; gap: 8px; background: var(--surface); transform: none; justify-content: center; border-radius: 0; }
  #nav button { width:auto; height:44px; min-width: 44px; min-height: 44px; padding: 7px 12px; font-size: 15px; }
  #counter { font-size: 15px; min-width: 64px; }
  #response-cue { flex: 1; font-size: 14px; color: var(--n-700); }
  .embedded
  .embedded #rail { display: none; }
  #overview { position: fixed; inset: 8px; width: auto; height: auto; padding: 16px; overflow: auto; z-index: 12; }
  #overview h2 { font-size: 24px; }
  #overview button { min-height: 44px; font-size: 16px; padding: 10px; }
  #overview-list { max-height: calc(100vh - 100px); gap: 10px; }
  #overview-list button span { font-size: 16px; }
  #blank-screen { position: fixed; inset: 0; font-size: 44px; z-index: 15; }
  #audio-status { position:static; flex:1 1 80%; margin:0; max-width:none; font-size:14px; line-height:1.3; color:var(--ink); }
  #audio-status:empty { display:none; }
  #dismiss-media-notice { flex:0 0 auto; }
  .quiet-teaching *, .quiet-teaching *::before, .quiet-teaching *::after { animation: none !important; }
  .p-media-failure { position: absolute; bottom: 110px; left: 100px; right: 100px; padding: 24px; background: var(--surface); border: 4px solid var(--accent-700); font-size: 30px; z-index: 5; }
  .p-media-failure button { font: inherit; min-height: 64px; padding: 10px; border-radius: 12px; }
  .p-daily-target .p-goal { font-size: 100px; max-width: 26ch; }
  .p-th-review { display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 58px; }
  .p-th-review button { font: 700 24px/1.2 ${FONT_BODY}; background: var(--surface); border: 2px solid var(--sage-700); border-radius: 12px; min-height: 44px; padding: 5px; }
  .p-hfw-mapping{display:flex;gap:12px}.p-hfw-part{padding:8px 14px;border:2px solid var(--n-700);border-radius:12px;font:700 48px Andika,Arial,sans-serif}.p-hfw-notice{text-decoration:underline;text-underline-offset:8px;border-width:4px}
  .p-hfw-meaning, .p-hfw-mapping { font-size: 30px; line-height: 1.25; margin: 0; }
  .p-sight-slide .p-col-right { gap: 18px; }
  .p-sight-slide .p-sentence { font-size: 44px; }
  .p-mini-vocabulary { display: grid; grid-template-columns: 480px 1fr; gap: 48px; align-items: center; width: 100%; }
  .p-mini-vocabulary img { width: 480px; height: 420px; object-fit: contain; }
  .p-mini-vocabulary p { font-size: 42px; line-height: 1.25; }
  .p-vocabulary-contrast{gap:18px;padding-top:110px;padding-bottom:90px}.p-vocabulary-contrast .p-mini-vocabulary{grid-template-columns:580px 1fr}.p-vocabulary-contrast .p-mini-vocabulary img{width:560px;height:560px}.p-vocabulary-pair{display:flex;gap:32px}.p-vocabulary-pair button{background:var(--surface);border:4px solid var(--n-700);border-radius:20px;padding:12px;cursor:pointer}.p-vocabulary-pair button[aria-pressed="true"]{border:8px solid var(--accent-700)}.p-vocabulary-pair img,.p-vocabulary-fresh-scene{width:560px;height:560px;object-fit:contain}.p-vocabulary-contrast [data-vocabulary-prompt],.p-vocabulary-contrast [data-vocabulary-frame]{font-size:38px;line-height:1.3;margin:12px 0 0;max-width:64ch}.p-vocabulary-contrast .p-lesson-actions{gap:12px}.p-vocabulary-contrast .p-audio{font-size:24px;padding:12px 16px}
  .p-mini-vocabulary .p-audio { font-size: 28px; padding: 16px 22px; margin: 6px; }
  .p-vocabulary-detective, .p-fresh-exit, .p-chain-board, .p-sentence-studio, .p-sound-map-slide { gap: 20px; }
  .p-fresh-exit .p-answer p { font-size: 42px; }
  .p-word-build .p-lesson-actions .p-audio, .p-sound-map-slide .p-lesson-actions .p-audio { font-size: 24px; padding: 12px 18px; }
  .p-word-build .p-build { gap: 14px; }
  .p-sound-map { width: 100%; display: flex; flex-direction: column; gap: 16px; }
  .p-sound-map-slide .p-h2 { font-size: 58px; }
  .p-sound-map-slide .p-audio { font-size: 25px; padding: 12px 18px; }
  .p-sound-map-slide .p-build { gap: 16px; }
  .p-sound-map-slide .p-tile-btn { width: 108px; height: 96px; font-size: 62px; }
  .p-sound-map-slide .p-build-slot { min-height: 90px; min-width: 108px; font-size: 58px; }
  .p-sound-map-slide .p-build-feedback { font-size: 28px; }
  .p-sound-boxes { display: flex; gap: 22px; }
  .p-sound-boxes button { width: 116px; height: 96px; border: 4px solid var(--sage-700); background: var(--surface); border-radius: 12px; font-size: 58px; color: var(--sage-800); }
  .p-sound-boxes [aria-pressed=true] { background: var(--sage-200); }
  .p-studio-print { font: 700 96px ${FONT_LETTER}; margin: 0 0 16px; }
  .p-studio-scene { width: 330px; height: 260px; object-fit: contain; }
  [data-studio-prompt] { font-size: 38px; margin: 16px 0 0; }
  .p-sentence-studio .p-audio { font-size: 28px; padding: 12px 20px; }
  .p-sentence-track { gap: 18px; }
  .p-picture-sentence { grid-template-columns: 380px minmax(0,1fr); gap: 36px; }
  .p-picture-sentence > img { width: 380px; height: 340px; }
  .p-picture-sentence > div { gap: 20px; }
  .p-picture-sentence .p-shared-sentence { font-size: 62px; padding: 22px; }
  .p-sentence-track .p-audio { font-size: 26px; padding: 12px 20px; }
  .p-meaning-prompt { margin: 0; font: 700 36px ${FONT_LETTER}; }
  .p-cooperative-sort { gap: 22px; }
  .p-cooperative-sort .p-h2 { font-size: 52px; }
  [data-sort-game] { width: 100%; }
  .p-sort-choice{display:flex;flex-direction:column;gap:8px;align-items:center}.p-sort-choice .p-audio{font-size:24px;padding:10px 14px}
  .p-sort-items, .p-sort-bins { display: flex; gap: 24px; justify-content: center; margin: 18px 0; }
  .p-sort-item { width: 250px; min-height: 180px; border: 4px solid var(--n-700); border-radius: 20px; background: var(--surface); font: 700 54px ${FONT_LETTER}; }
  .p-sort-item img { width: 180px; height: 150px; object-fit: contain; }
  .p-sort-item span { display: block; font-size: 34px; }
  .p-sort-item.is-selected { outline: 8px solid var(--sage-700); outline-offset: 4px; }
  .p-sort-item.is-sorted { border-style: dashed; opacity: .5; }
  [data-sort-bin] { flex: 1; min-height: 130px; background: var(--surface); border: 4px solid var(--sage-700); border-radius: 20px; font: 700 40px ${FONT_LETTER}; padding: 14px; }
  [data-sort-placed] { display: flex; justify-content: center; flex-wrap: wrap; gap: 16px; font-size: 28px; margin-top: 10px; }
  [data-sort-feedback], [data-transfer-feedback], [data-retell-feedback], [data-cooperate-feedback] { font: 400 32px/1.3 ${FONT_LETTER}; }
  .p-retell-story { gap: 18px; }
  .p-retell-story .p-h2 { font-size: 54px; }
  [data-retell-game] { width: 100%; }
  .p-retell-cards { display: flex; gap: 28px; justify-content: center; }
  .p-retell-cards button { border: 4px solid var(--n-700); background: var(--surface); border-radius: 18px; padding: 8px; }
  .p-retell-cards img { width: 270px; height: 220px; object-fit: contain; }
  .p-retell-order { display: flex; gap: 22px; min-height: 140px; justify-content: center; margin-top: 14px; }
  .p-retell-order img { width: 160px; height: 130px; object-fit: contain; }
  .p-retell-story .p-audio { font-size: 25px; padding: 10px 18px; }
  .p-cooperate-pack { gap: 20px; }
  .p-cooperate-choices { display: flex; gap: 30px; margin: 24px 0; }
  .p-packed-items { display: flex; gap: 30px; min-height: 180px; }
  .p-packed-items img { width: 180px; height: 170px; object-fit: contain; }
  .is-correct { outline: 5px solid var(--sage-700); }
  @media (max-width:600px) {
    #response-cue { display: none; }
    #rail-title { max-width: 24vw; font-size: 14px; }
    #nav { gap: 3px; padding: 4px; }
    #nav button { font-size: 14px; padding: 5px; }
    #overview-list { grid-template-columns: 1fr; }
  }
  @keyframes fill-part { from { opacity: .5; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  @keyframes try-part { 50% { transform: translateX(8px); } }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; }
    .p-compound .is-guided { transform: none; }
  }

  @media print {
    #scaler { position: static; display: block; overflow: visible; }
    #stage { position: static; transform: none !important; }
    #start, #nav { display: none !important; }
    .slide { position: relative; display: flex !important; page-break-after: always; }
    .p-cover, .p-close, .p-together { display: grid !important; }
    .p-answer { visibility: visible; opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    .slide.active, .p-pal-corner, .p-pal-hero { animation: none; }
  }

  .slide .p-h2,.slide .p-says { font-family:${FONT_BODY}; font-size:26px; line-height:1.35; font-weight:400; max-width:1400px; margin:18px 0; color:var(--ink-muted); }
  .p-kicker { font-size:24px; letter-spacing:1.5px; margin-bottom:16px; }
  .p-hint,.p-game-feedback,.p-build-feedback,[data-sort-feedback],[data-retell-feedback],[data-studio-prompt],.p-write-ready { font-size:24px; line-height:1.4; }
  .p-pacing,.p-phase,.p-phoneme,.p-hfw-meaning,.p-memory-hint { display:none; }
  .p-audio,.p-reveal-btn { font-size:24px; min-height:66px; padding:12px 24px; }
  .p-lesson-actions { gap:18px; margin-top:24px; }
  .slide.p-writing { padding:72px 104px; gap:12px; }
  .p-writing .p-kicker,.p-writing .p-teacher-prompt { margin:0; flex-shrink:0; }
  .p-writing .p-paper { width:100%; height:auto; min-height:0; flex:1; margin:0; padding:24px; }
  .p-writing .p-write-svg { width:100%; height:100%; }
  .p-writing .p-write-ready,.p-writing .p-write-actions { text-align:center; justify-content:center; }
  .p-writing .p-write-ready { min-height:36px; margin:0; width:100%; flex-shrink:0; }
  .p-writing .p-write-actions { width:100%; margin:0; flex-shrink:0; }
  .p-sight-slide .p-sight { text-align:center; font-size:280px; line-height:1.25; margin:40px 0; }
  .p-sight-slide .p-lesson-actions { justify-content:center; }
  .p-sight-slide .p-teacher-prompt { text-align:center; }
  .p-sentence-studio [data-sentence-studio] { display:grid; grid-template-columns:1fr 620px; gap:24px 50px; align-items:center; }
  .p-studio-print { font-size:132px; line-height:1.4; grid-column:1; margin:0; }
  .p-studio-scene { width:620px; height:580px; object-fit:contain; grid-column:2; grid-row:1 / span 3; margin:0; }
  .p-picture-sentence { grid-template-columns:600px 1fr; gap:64px; }
  .p-picture-sentence img { width:600px; height:580px; object-fit:contain; }
  .p-picture-sentence .p-sentence,.p-shared-sentence { font-size:96px; line-height:1.4; }
  .p-retell-cards { gap:28px; }
  .p-retell-cards button { width:460px; padding:18px; }
  .p-retell-cards img { width:420px; height:330px; object-fit:contain; }
  .p-retell-text { font-size:38px; line-height:1.3; display:block; }
  .p-story-panel { display:grid; grid-template-columns:650px 1fr; gap:60px; align-items:center; }
  .p-story-panel img { width:650px; height:550px; object-fit:contain; }
  .p-story-panel p { font-size:72px; line-height:1.35; }
  .p-sort-items { gap:30px; }
  .p-sort-item { width:260px; height:230px; }
  .p-sort-item img { width:220px; height:200px; object-fit:contain; }
  .p-sort-bins strong { font-size:96px; }
  .p-sort-bins [data-sort-placed] { font-size:32px; }
  #rail-sections { display:none; }
  #nav button { min-height:44px; font-size:17px; padding:6px 16px; }
  #nav { height:56px; }
  #audio-status { position:fixed; bottom:58px; left:16px; right:16px; z-index:25; background:#FFFFFF; border:1px solid #929DAF; padding:12px; font-size:16px; }
  #audio-status:empty { display:none; }
`;
