// Whole-class "Present" mode: builds a self-contained, fullscreen teaching deck
// for one cycle, opened in a new window for the projector. Deterministic (same
// cycle + same day => same deck bytes). Uses existing gold-voice audio and
// picture-word images. Decks can be built for the whole cycle (default) or for
// a single teaching day (Monday..Friday) - day decks reuse the same slide
// builders, they only select which sections appear.
//
// 2026-07-28 REDESIGN. Three structural changes, everything else is unchanged:
//
//  1. FIXED 1920x1080 STAGE. Slides used to be sized in vh/vw against whatever
//     window the teacher happened to open, so a letter-sound slide with three
//     word cards clipped on a short window and looked different on every
//     projector. The deck now lays out at exactly 1920x1080 and deck.js scales
//     that box to fit. Every size in DECK_CSS is a plain px value against that
//     box, so what you author is what projects.
//  2. A PERSISTENT FRAME. Every teaching slide declares `data-section`
//     ("Sounds", "Writing", ...). deck.js reads the sections present in THIS
//     deck and draws the rail, so a Friday deck shows a shorter rail and the
//     rail can never drift from what the deck actually contains.
//  3. ORGANIC THEME. Cream ground, terracotta accent, sage second voice,
//     Caprasimo for chrome. Andika is kept for every glyph a CHILD decodes
//     (graphemes, sight words, chips, poem body) - a display face must never
//     be the letterform a five-year-old is learning to copy.
//
// New slide behaviour (all handled by public/present/deck.js):
//   data-reveal    - quiz-style slides hide their answer until the teacher asks
//   data-timer     - warm-ups get a thinking-time ring
//   data-teacher   - the articulation tip renders as a quiet bottom strip
import { elSkillsBlockCycles, LETTER_EXAMPLES } from "../../data/elSkillsBlockCycles.js";
import { EL_CYCLE_POEMS } from "../../data/elCyclePoems.js";
import { AUDIO_FILE_PATHS } from "../../data/generated/audioFilePaths.generated.js";
import { graphemeAudioPath, wordAudioPath } from "../../components/elQuest/elQuestEngine.js";
import { getChildWordAsset } from "../../data/childAssets.js";
import { guidedReadingBooks } from "../../data/guidedReadingBooks.js";
import { themeWorldForCycle } from "../../utils/palWorlds.js";
import { LETTER_STROKES, LETTER_GUIDES } from "../../data/letterStrokes.js";
import { openHtmlDocument } from "../openHtmlDocument.js";
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
const BOOK_COVERS = new Map(
  guidedReadingBooks.map(book => [book.id, book.coverImage || book.cover || ""])
);

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

// Broken-image fallbacks are declared as data-hide-on-error, NOT as an inline
// onerror="" handler: the deck is a blob: document and inherits the opener's
// `script-src 'self'` CSP. public/present/deck.js turns the attribute into a
// real listener. Value is "self" or a selector passed to closest().

// The Pals mascot for a deck's world. Threaded as a parameter through every
// slide builder (never module state) so concurrent builds cannot
// cross-contaminate each other's art.
//
// POSE INVENTORY: only wave / read / think / celebrate exist as files. "point"
// was referenced by three builders and silently hid every time, which is why
// the goal, blending and sound-review slides used to have no character at all.
// POSES is the whitelist; anything else falls back to a pose that exists.
const POSES = new Set(["wave", "read", "think", "celebrate"]);
function palPose(pose) {
  return POSES.has(pose) ? pose : "think";
}
function palImg(world, pose, cls = "") {
  const file = `/images/pals/poses/${world.id}-${palPose(pose)}.webp`;
  return `<img class="p-pal ${cls}" src="${esc(assetUrl(file))}" alt="" data-hide-on-error="self"/>`;
}
function wordImage(word) {
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
  { value: "", label: "Whole cycle (all days)" },
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" }
];

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
  "Together",
  "Poem",
  "Books",
  "This week"
];

function normalizeDay(day) {
  const clean = String(day || "").trim().toLowerCase();
  if (!clean || clean === "cycle" || clean === "whole" || clean === "all") return "";
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
const THREE_SYLLABLE_BANK = [
  { word: "strawberry", first: "straw", rest: "berry" },
  { word: "blueberry", first: "blue", rest: "berry" },
  { word: "butterfly", first: "butter", rest: "fly" },
  { word: "basketball", first: "basket", rest: "ball" },
  { word: "ladybug", first: "lady", rest: "bug" },
  { word: "grasshopper", first: "grass", rest: "hopper" }
];
const ONSET_BANK = [
  { word: "cup", left: "up" }, { word: "sit", left: "it" }, { word: "man", left: "an" },
  { word: "cat", left: "at" }, { word: "fox", left: "ox" }, { word: "pin", left: "in" },
  { word: "hen", left: "en" }, { word: "mud", left: "ud" }, { word: "bag", left: "ag" }
];
const RIME_DELETE_BANK = [
  { word: "cat", left: "/c/" }, { word: "sun", left: "/s/" }, { word: "map", left: "/m/" },
  { word: "pig", left: "/p/" }, { word: "dog", left: "/d/" }, { word: "bed", left: "/b/" },
  { word: "net", left: "/n/" }, { word: "log", left: "/l/" }, { word: "run", left: "/r/" }
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
  return cards;
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
  const own = LETTER_EXAMPLES[spelling] || [];
  const list = own.length ? own : (PATTERN_EXAMPLES[spelling] || []);
  return list.filter(w => /^[a-z]{2,6}$/.test(w)).slice(0, limit);
}

function taughtSinglesThrough(cycleNumber) {
  const taught = new Set();
  for (const cycle of elSkillsBlockCycles) {
    if (!cycle.cycleNumber || cycle.cycleNumber > cycleNumber) continue;
    for (const card of cycle.focusLetters || []) {
      const spelling = String(card.spelling || "").toLowerCase();
      if (/^[a-z]$/.test(spelling)) taught.add(spelling);
    }
  }
  return taught;
}

const BLEND_DIGRAPHS = ["sh", "ch", "th", "wh", "ng", "nk", "qu", "ck"];
function isBlendable(word) {
  if (!/^[a-z]{3,4}$/.test(word)) return false;
  const vowels = [...word].filter(ch => "aeiou".includes(ch));
  if (vowels.length !== 1 || "aeiou".includes(word[word.length - 1])) return false;
  return !BLEND_DIGRAPHS.some(d => word.includes(d));
}

function blendWordsFor(cycle) {
  if (isFluencyCycle(cycle) || (cycle.cycleNumber || 0) < 2) return [];
  const taught = taughtSinglesThrough(cycle.cycleNumber);
  const own = focusCards(cycle).flatMap(card => exampleWords(card.spelling, 6));
  const broad = [...taught].flatMap(letter => LETTER_EXAMPLES[letter] || []);
  const pool = [...new Set([...own, ...broad])].filter(word =>
    isBlendable(word) &&
    [...word].every(letter => taught.has(letter)) &&
    wordAudioPath(word));
  if (!pool.length) return [];
  return pickPer(pool, cycle.cycleNumber, Math.min(2, pool.length));
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
  const data = Object.entries(attrs).map(([key, value]) => `${key}="${esc(value)}"`).join(" ");
  // The thinking-time dial and the corner mascot share the bottom-right of the
  // stage, so a timer slide gets the dial and the mascot yields.
  const timer = opts.timer ? timerDial(opts.timer) : "";
  const char = !timer && opts.char ? palImg(world, opts.char, "p-pal-corner") : "";
  const teacher = opts.teacher
    ? `<p class="p-foryou"><b>For you</b><span>${esc(opts.teacher)}</span></p>`
    : "";
  return `<section class="slide ${opts.cls || ""}" ${data}>${inner}${teacher}${timer}${char}</section>`;
}

// Inline SVG icons: Lucide geometry at stroke-width 2.75, per the design system.
// The deck must contain no emoji (scrubber-safe, projector-safe).
const ICON_SPEAKER = `<svg class="p-ico" viewBox="0 0 24 24" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>`;
const ICON_PENCIL = `<svg class="p-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 4 3 9 8 9"/></svg>`;
const ICON_PLAY = `<svg class="p-ico" viewBox="0 0 24 24" aria-hidden="true"><polygon points="6 3 20 12 6 21 6 3"/></svg>`;
const ICON_EYE = `<svg class="p-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
const ICON_ARROW = `<svg class="p-arrow" viewBox="0 0 24 24" aria-hidden="true"><line x1="4" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>`;

function audioButton(src, label = "Play sound") {
  if (!src) return "";
  return `<button class="p-audio" data-play="${esc(assetUrl(src))}" type="button">${ICON_SPEAKER}<span>${esc(label)}</span></button>`;
}

function revealButton() {
  return `<button class="p-reveal-btn" type="button" data-reveal-toggle>${ICON_EYE}<span>Show the answer</span></button>`;
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
  const poem = EL_CYCLE_POEMS.find(p => p.cycle === cycle.cycleNumber);
  const bits = [];
  if (letters.length) bits.push(letters.length === 1 ? "one new sound" : `${letters.length} sounds`);
  if (hfw.length) bits.push(hfw.length === 1 ? "one tricky word" : `${hfw.length} tricky words`);
  if (poem) bits.push("a poem");
  if (!bits.length) return "Everything we are practising this week.";
  const last = bits.pop();
  return `${bits.length ? `${bits.join(", ")} and ${last}` : last}, all together.`;
}

function titleSlide(cycle, world, dayLabel = "") {
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
      <p class="p-blurb">${esc(coverBlurb(cycle))}</p>
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
          ${audioButton(phoneme, `Hear ${sound}`)}
          <span class="p-phoneme">${esc(sound)}</span>
        </div>
      </div>
      <div class="p-col-right">
        <p class="p-kicker">Our sound</p>
        <div class="p-words p-words-${words.length || 1}">${pics}</div>
      </div>
    </div>`,
  { cls: "p-letter-slide", section: "Sounds", audio: phoneme, teacher: tip, char: "wave" });
}

function writingSvg(text) {
  const chars = String(text).split("");
  if (!chars.length || chars.some(ch => !LETTER_STROKES[ch])) return "";
  const width = chars.length * 100;
  const g = LETTER_GUIDES;
  const guides = `<line x1="0" y1="${g.top}" x2="${width}" y2="${g.top}" class="p-guide"/>` +
    `<line x1="0" y1="${g.mid}" x2="${width}" y2="${g.mid}" class="p-guide dash"/>` +
    `<line x1="0" y1="${g.base}" x2="${width}" y2="${g.base}" class="p-guide base"/>`;
  const body = chars.map((ch, i) =>
    `<g transform="translate(${i * 100},0)">` +
    LETTER_STROKES[ch].map(d => `<path class="p-ghost-stroke" d="${d}"/>`).join("") +
    LETTER_STROKES[ch].map(d => `<path class="p-ink-stroke" data-write-stroke data-offset="${i * 100}" d="${d}"/>`).join("") +
    `</g>`).join("");
  const pencil = `<g data-pencil class="p-pencil"><circle r="7"/><path d="M2 -4 L20 -34 L30 -28 L14 4 Z" /></g>`;
  return `<svg class="p-write-svg" viewBox="0 0 ${width} 140" aria-hidden="true">${guides}${body}${pencil}</svg>`;
}

function writingSlide(card, world) {
  const svg = writingSvg(displayGrapheme(card));
  if (!svg) return "";
  return slide(world, `
    <div class="p-two-col p-two-col-wide">
      <div class="p-paper">${svg}</div>
      <div class="p-col-right">
        <p class="p-kicker">Let's write it</p>
        <h2 class="p-says">Watch the pencil, then draw it in the air with me.</h2>
        <button class="p-audio p-audio-ghost" type="button" data-replay>${ICON_PENCIL}<span>Watch again</span></button>
      </div>
    </div>`,
  { cls: "p-writing", section: "Writing", stroke: "1", char: "think" });
}

function letterPairSlides(cards, cycle, world) {
  return cards.flatMap(card => {
    const out = [letterSoundSlide(card, cycle, world)];
    const writing = writingSlide(card, world);
    if (writing) out.push(writing);
    return out;
  });
}

function soundReviewSlide(cards, world) {
  if (!cards.length) return "";
  const chips = cards.map(card =>
    `<button class="p-chip big" data-play="${esc(graphemeAudio(card.spelling))}" type="button">${esc(displayGrapheme(card))}</button>`).join("");
  return slide(world, `
    <p class="p-kicker">Sound check</p>
    <h2 class="p-h2">What sound does each one make?</h2>
    <div class="p-chips">${chips}</div>
    <p class="p-hint">Tap one to check.</p>`,
  { cls: "p-sound-review", section: "Sounds", char: "think" });
}

function hfwSentence(cycle, word) {
  const card = (cycle?.sections?.highFrequencyWords?.cards || [])
    .find(c => String(c.word || "").toLowerCase() === word);
  return card?.sentence || "";
}

function sightWordSlide(word, cycle, world) {
  const letters = word.split("").map(ch => `<span class="p-tile">${esc(ch)}</span>`).join("");
  const sentence = hfwSentence(cycle, word);
  return slide(world, `
    <div class="p-two-col">
      <div class="p-col-left p-col-left-text">
        <p class="p-kicker">Tricky word</p>
        <div class="p-sight">${esc(word)}</div>
        <div class="p-tiles">${letters}</div>
      </div>
      <div class="p-col-right p-col-rule">
        ${sentence ? `<p class="p-kicker p-kicker-sage">In a sentence</p><p class="p-sentence">${esc(sentence)}</p>` : ""}
        ${audioButton(wordAudio(word), "Read it")}
      </div>
    </div>`,
  { cls: "p-sight-slide", section: "Words", audio: wordAudio(word), char: "read" });
}

function blendSlides(cycle, world) {
  return blendWordsFor(cycle).map(word => {
    const letters = word.split("").map(ch =>
      `<button class="p-tile-btn" data-play="${esc(graphemeAudio(ch))}" type="button">${esc(ch)}</button>`).join("");
    return slide(world, `
      <p class="p-kicker">Blend with me</p>
      <div class="p-compound" data-blend-word="${esc(word)}">${letters}${ICON_ARROW}<button class="p-made" data-play="${esc(wordAudio(word))}" type="button">${esc(word)}</button></div>
      <h2 class="p-h2">Say each sound on its own. Then say the whole word.</h2>`,
    { cls: "p-blend", section: "Blending", audio: wordAudio(word), char: "wave" });
  });
}

// "Everyone together": the cycle's own call-and-response, given a slide of its
// own so the teacher has a planned whole-class beat instead of improvising one.
function callResponseSlide(cycle, world, index = 0) {
  const items = cycle?.sections?.poemAndChant?.callAndResponse || [];
  if (!items.length) return "";
  const item = items[index % items.length];
  if (!item?.teacher || !item?.students) return "";
  return slide(world, `
    <div class="p-cover-text">
      <p class="p-kicker p-kicker-invert">Everyone together</p>
      <h1 class="p-h1-invert">${esc(item.teacher)}</h1>
      <p class="p-response">${esc(item.students)}</p>
      <p class="p-blurb">Big voice, then small voice, then whisper.</p>
    </div>
    <div class="p-cover-art">${palImg(world, "wave", "p-pal-hero")}</div>`,
  { cls: "p-together", section: "Together" });
}

function booksSlide(cycle, world) {
  const rec = cycle.guidedReadingRecommendations || {};
  const books = [rec.fiction, rec.nonfiction].filter(Boolean);
  if (!books.length) return "";
  const cards = books.map(book => {
    const cover = assetUrl(BOOK_COVERS.get(book.bookId) || "");
    return `<figure class="p-book">
      ${cover ? `<img class="p-book-cover washed" src="${esc(cover)}" alt="" data-hide-on-error="self"/>` : ""}
      <figcaption><span class="p-book-title">${esc(book.title)}</span><span class="p-book-level">${esc(book.type === "fiction" ? "Story" : "True book")} · Level ${esc(book.level)}</span></figcaption>
    </figure>`;
  }).join("");
  return slide(world, `
    <div class="p-two-col p-two-col-narrow">
      <div class="p-col-left p-col-left-text">
        <p class="p-kicker">Reading this week</p>
        <p class="p-blurb-dark">One story and one true book. Both use the sounds we know.</p>
      </div>
      <div class="p-books">${cards}</div>
    </div>`,
  { cls: "p-books-slide", section: "Books", char: "read" });
}

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
function deleteCandidate({ kicker, whole, wholeAudio, removed, left, leftAudio }) {
  return {
    key: whole,
    inner: `
    <p class="p-kicker">${esc(kicker)}</p>
    <div class="p-take">
      <span class="p-big-word" data-play="${esc(wholeAudio || "")}">${esc(whole)}</span>
      ${ICON_ARROW}
      <span class="p-answer"><span class="p-big-word made" data-play="${esc(leftAudio || "")}">${esc(left)}</span></span>
    </div>
    <h2 class="p-h2">Say <b>${esc(whole)}</b>. Now say it without <b>${esc(removed)}</b>. What is left?</h2>
    ${revealButton()}`,
    opts: { cls: "p-phoneme", section: "Warm-up", reveal: true, timer: 60, char: "wave" }
  };
}

const PA_CANDIDATES = 4;

function compoundDeleteCands(cycleNumber, part, offset) {
  return pickPer(COMPOUND_BANK, cycleNumber, PA_CANDIDATES, offset).map(([a, b]) => {
    const whole = a + b;
    const removed = part === "first" ? a : b;
    const left = part === "first" ? b : a;
    return deleteCandidate({
      kicker: part === "first" ? "Take the first word away" : "Take the last word away",
      whole, wholeAudio: wordAudio(whole), removed, left, leftAudio: wordAudio(left)
    });
  });
}

function syllableDeleteCands(cycleNumber, bank, part, offset) {
  return pickPer(bank, cycleNumber, PA_CANDIDATES, offset).map(item => deleteCandidate({
    kicker: part === "first" ? "Take the first part away" : "Take the last part away",
    whole: item.word,
    wholeAudio: wordAudio(item.word),
    removed: part === "first" ? (item.first || "") : (item.last || item.rest || ""),
    left: part === "first" ? (item.rest || item.last || "") : (item.first || ""),
    leftAudio: wordAudio(part === "first" ? (item.rest || item.last || "") : (item.first || ""))
  }));
}

function onsetDeleteCands(cycleNumber, offset) {
  return pickPer(ONSET_BANK, cycleNumber, PA_CANDIDATES, offset).map(item => deleteCandidate({
    kicker: "Take the first sound away",
    whole: item.word, wholeAudio: wordAudio(item.word),
    removed: `/${item.word[0]}/`, left: item.left, leftAudio: wordAudio(item.left)
  }));
}

function rimeDeleteCands(cycleNumber, offset) {
  return pickPer(RIME_DELETE_BANK, cycleNumber, PA_CANDIDATES, offset).map(item => deleteCandidate({
    kicker: "Keep only the first sound",
    whole: item.word, wholeAudio: wordAudio(item.word),
    removed: `-${item.word.slice(1)}`, left: item.left, leftAudio: ""
  }));
}

function chipRow(words) {
  return words.map(w => `<button class="p-chip" data-play="${esc(wordAudio(w))}" type="button">${esc(w)}</button>`).join("");
}

function changeFirstCands(cycleNumber, offset) {
  return pickPer(CHANGE_FIRST_BANK, cycleNumber, PA_CANDIDATES, offset).map(item => ({
    key: item.base,
    inner: `
      <p class="p-kicker">Change the first sound</p>
      <div class="p-big-word" data-play="${esc(wordAudio(item.base))}">${esc(item.base)}</div>
      <h2 class="p-h2">Change the first sound of <b>${esc(item.base)}</b> to make new words.</h2>
      <div class="p-answer"><div class="p-chips">${chipRow(item.made)}</div></div>
      ${revealButton()}`,
    opts: { cls: "p-phoneme", section: "Warm-up", reveal: true, timer: 60, char: "wave" }
  }));
}

function changeRimeCands(cycleNumber, offset) {
  return pickPer(CHANGE_RIME_BANK, cycleNumber, PA_CANDIDATES, offset).map(item => ({
    key: item.base,
    inner: `
      <p class="p-kicker">Keep the first sound, change the ending</p>
      <div class="p-big-word" data-play="${esc(wordAudio(item.base))}">${esc(item.base)}</div>
      <h2 class="p-h2">Keep <b>/${esc(item.onset)}/</b> and change the ending of <b>${esc(item.base)}</b>.</h2>
      <div class="p-answer"><div class="p-chips">${chipRow(item.made)}</div></div>
      ${revealButton()}`,
    opts: { cls: "p-phoneme", section: "Warm-up", reveal: true, timer: 60, char: "wave" }
  }));
}

function rhymeIdentifyCands(cycleNumber, offset) {
  return pickPer(RHYME_PAIRS_BANK, cycleNumber, PA_CANDIDATES, offset).map(item => ({
    key: `${item.a}+${item.b}`,
    inner: `
      <p class="p-kicker">Rhyme time</p>
      <h2 class="p-h2">Two of these rhyme. Which one does not?</h2>
      <div class="p-rhyme">
        <div class="p-rhyme-item"><button class="p-panel" data-play="${esc(wordAudio(item.a))}" type="button">${esc(item.a)}</button><span class="p-answer p-tag-sage">rhymes</span></div>
        <div class="p-rhyme-item"><button class="p-panel" data-play="${esc(wordAudio(item.b))}" type="button">${esc(item.b)}</button><span class="p-answer p-tag-sage">rhymes</span></div>
        <div class="p-rhyme-item"><button class="p-panel odd" data-play="${esc(wordAudio(item.odd))}" type="button">${esc(item.odd)}</button><span class="p-answer p-tag-accent">odd one out</span></div>
      </div>
      ${revealButton()}`,
    opts: { cls: "p-phoneme", section: "Warm-up", reveal: true, timer: 60, char: "read" }
  }));
}

function rhymeProduceCands(cycleNumber, offset) {
  return pickPer(RHYME_PRODUCE_BANK, cycleNumber, PA_CANDIDATES, offset).map(item => ({
    key: item.base,
    inner: `
      <p class="p-kicker">Make a rhyme</p>
      <div class="p-big-word" data-play="${esc(wordAudio(item.base))}">${esc(item.base)}</div>
      <h2 class="p-h2">What rhymes with <b>${esc(item.base)}</b>? Say your own first.</h2>
      <div class="p-answer"><div class="p-chips">${chipRow(item.rhymes)}</div></div>
      ${revealButton()}`,
    opts: { cls: "p-phoneme", section: "Warm-up", reveal: true, timer: 60, char: "wave" }
  }));
}

function interleave(a, b) {
  const out = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    if (a[i]) out.push(a[i]);
    if (b[i]) out.push(b[i]);
  }
  return out;
}

function paSkillCandidateSets(cycle) {
  const n = cycle.cycleNumber || 1;
  const sets = [];
  (cycle.phonemicAwareness || []).forEach((skill, index) => {
    const s = String(skill).toLowerCase();
    const off = index * PA_CANDIDATES;
    let candidates = [];
    if (s.includes("three-syllable") && s.includes("first")) candidates = syllableDeleteCands(n, THREE_SYLLABLE_BANK, "first", off);
    else if (s.includes("three-syllable") && s.includes("last")) candidates = syllableDeleteCands(n, THREE_SYLLABLE_BANK, "last", off);
    else if (s.includes("compound") && s.includes("first")) candidates = compoundDeleteCands(n, "first", off);
    else if (s.includes("compound") && s.includes("last")) candidates = compoundDeleteCands(n, "last", off);
    else if (s.includes("two-syllable") && s.includes("first")) candidates = syllableDeleteCands(n, TWO_SYLLABLE_BANK, "first", off);
    else if (s.includes("two-syllable") && s.includes("last")) candidates = syllableDeleteCands(n, TWO_SYLLABLE_BANK, "last", off);
    else if (s.includes("two-syllable")) candidates = interleave(syllableDeleteCands(n, TWO_SYLLABLE_BANK, "first", off), syllableDeleteCands(n + 1, TWO_SYLLABLE_BANK, "last", off));
    else if (s.includes("delete onset")) candidates = onsetDeleteCands(n, off);
    else if (s.includes("delete rime")) candidates = rimeDeleteCands(n, off);
    else if (s.includes("combine deletion")) candidates = interleave(onsetDeleteCands(n, off), rimeDeleteCands(n, off));
    else if (s.includes("review deletion")) candidates = interleave(compoundDeleteCands(n, "last", off), syllableDeleteCands(n, THREE_SYLLABLE_BANK, "first", off));
    else if (s.includes("substitute initial")) candidates = changeFirstCands(n, off);
    else if (s.includes("substitute rime")) candidates = changeRimeCands(n, off);
    else if (s.includes("review substitution")) candidates = interleave(changeFirstCands(n, off), changeRimeCands(n + 1, off));
    else if (s.includes("rhyme production")) candidates = rhymeProduceCands(n, off);
    else if (s.includes("rhym") && s.includes("review")) candidates = interleave(rhymeIdentifyCands(n, off), rhymeProduceCands(n, off));
    else if (s.includes("rhym")) candidates = rhymeIdentifyCands(n, off);
    if (candidates.length) sets.push({ skill, index, candidates });
  });
  return sets;
}

function paSlides(cycle, world, { skillIndex = null } = {}) {
  const sets = paSkillCandidateSets(cycle);
  if (!sets.length) return [];
  const chosen = skillIndex === null ? sets : [sets[Math.min(skillIndex, sets.length - 1)]];
  const perSkill = chosen.length <= 2 ? 2 : Math.max(1, Math.floor(4 / chosen.length));
  const used = new Set();
  const out = [];
  for (const set of chosen) {
    const picked = [];
    for (const cand of set.candidates) {
      if (picked.length >= perSkill) break;
      if (used.has(cand.key)) continue;
      used.add(cand.key);
      picked.push(cand);
    }
    if (!picked.length && set.candidates.length) picked.push(set.candidates[0]);
    for (const cand of picked) {
      out.push(slide(world, cand.inner, {
        ...cand.opts,
        attrs: { "data-pa-skill": String(set.index), "data-pa-key": cand.key }
      }));
    }
  }
  return out;
}

function goalsSlide(cycle, world) {
  const goals = cycle.sections?.overview?.goals || [];
  const childGoal = goals.find(g => /^i can/i.test(g)) || cycle.childFriendlyGoal || "";
  if (!childGoal) return "";
  return slide(world, `
    <p class="p-kicker">Today we learn</p>
    <h2 class="p-goal">${esc(childGoal)}</h2>
    <p class="p-hint">Say it with me, then say it on your own.</p>`,
  { cls: "p-goal-slide", section: "Warm-up", char: "think" });
}

function poemSlide(cycle, world) {
  const poem = EL_CYCLE_POEMS.find(p => p.cycle === cycle.cycleNumber);
  if (!poem) return "";
  const narration = `/audio/learn-games/poems/v2/cycle-${String(cycle.cycleNumber).padStart(2, "0")}.mp3`;
  const audio = AUDIO_FILE_PATHS.has(narration) ? narration : "";
  const pics = (poem.findWords || []).map(word => {
    const asset = getChildWordAsset(word) || {};
    return asset.image ? `<img src="${esc(assetUrl(asset.image))}" alt="${esc(word)}" data-hide-on-error="self"/>` : "";
  }).filter(Boolean).slice(0, 3).join("");
  const poemImg = assetUrl(`/images/pals/poems/cycle-${String(cycle.cycleNumber).padStart(2, "0")}.webp`);
  return slide(world, `
    <div class="p-two-col p-two-col-poem">
      <img class="p-poem-hero washed" src="${esc(poemImg)}" alt="" data-hide-on-error="self"/>
      <div class="p-col-right">
        <p class="p-kicker">Our poem</p>
        <h2 class="p-poem-title">${esc(poem.title)}</h2>
        <div class="p-poem">${esc(poem.lines.join("\n"))}</div>
        ${audioButton(audio, "Listen to the poem")}
        ${pics ? `<div class="p-poem-pics">${pics}</div>` : ""}
      </div>
    </div>`,
  { cls: "p-poem-slide", section: "Poem", audio });
}

function patternSlide(cycle, world) {
  const sort = CYCLE_PATTERN_SORTS[cycle.cycleNumber] || CYCLE_PATTERN_SORTS[27];
  return slide(world, `
    <p class="p-kicker">Pattern power</p>
    <h2 class="p-h2">Read the words that <b>${esc(sort.label)}</b></h2>
    <div class="p-chips big">${chipRow(sort.words)}</div>`,
  { cls: "p-phoneme", section: "Blending", char: "wave" });
}

function chainSlide(cycle, world) {
  const chain = CYCLE_CHAINS[cycle.cycleNumber] || CYCLE_CHAINS[27];
  const chips = chain.map((w, i) => `${i ? ICON_ARROW : ""}<button class="p-chip big" data-play="${esc(wordAudio(w))}" type="button">${esc(w)}</button>`).join("");
  return slide(world, `
    <p class="p-kicker">Word chain</p>
    <h2 class="p-h2">Change one letter each time</h2>
    <div class="p-compound">${chips}</div>`,
  { cls: "p-phoneme", section: "Blending", char: "wave" });
}

function endSlide(cycle, world) {
  const letterChips = focusCards(cycle).map(card =>
    `<button class="p-chip accent" data-play="${esc(graphemeAudio(card.spelling))}" type="button">${esc(displayGrapheme(card))}</button>`).join("");
  const wordChips = (cycle.highFrequencyWords || []).map(w => {
    const word = String(w).toLowerCase();
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
  const poem = EL_CYCLE_POEMS.find(p => p.cycle === cycle.cycleNumber);
  if (poem) parts.push(`poem: ${poem.title}`);
  return parts.join(" · ");
}

// ── Deck assembly ────────────────────────────────────────────────────────────
function assembleSlides(cycle, world, day) {
  const fluency = isFluencyCycle(cycle);
  const assessment = cycle.type === "assessment";
  const cards = focusCards(cycle);
  const reviewOnly = !fluency && !assessment && !(cycle.focusLetters || []).length && cards.length > 0;
  const dayLabel = DAY_LABELS[day] || "";
  const hfwWords = (cycle.highFrequencyWords || []).map(w => String(w).toLowerCase());

  const slides = [];
  const push = (...items) => { for (const item of items) if (item) slides.push(item); };
  const pushAll = items => { for (const item of items) if (item) slides.push(item); };
  const hfwSlides = () => hfwWords.map(word => sightWordSlide(word, cycle, world));
  const cardsForDay = name => cards.filter(card => (card.day || "") === name);

  push(titleSlide(cycle, world, dayLabel));

  if (assessment) {
    push(routinesSlide(cycle, world));
    push(endSlide(cycle, world));
    return slides;
  }

  const goal = goalsSlide(cycle, world);
  const poem = poemSlide(cycle, world);
  const books = booksSlide(cycle, world);
  const blend = fluency ? [] : blendSlides(cycle, world);
  const fridayCheck = /check|assessment|benchmark/i.test(String(cycle.friday || ""));

  if (!day) {
    push(goal);
    if (!fluency) {
      if (reviewOnly) push(soundReviewSlide(cards, world));
      else pushAll(letterPairSlides(cards, cycle, world));
      pushAll(blend);
    }
    if (fluency) push(patternSlide(cycle, world), chainSlide(cycle, world));
    push(callResponseSlide(cycle, world, 0));
    pushAll(hfwSlides());
    pushAll(paSlides(cycle, world));
    push(poem, books, endSlide(cycle, world));
  } else if (day === "monday" || day === "tuesday") {
    push(goal);
    if (fluency) push(patternSlide(cycle, world), chainSlide(cycle, world));
    else if (reviewOnly && day === "monday") push(soundReviewSlide(cards, world));
    else pushAll(letterPairSlides(cardsForDay(DAY_LABELS[day]), cycle, world));
    push(callResponseSlide(cycle, world, day === "monday" ? 0 : 1));
    pushAll(paSlides(cycle, world, { skillIndex: day === "monday" ? 0 : 1 }));
    if (day === "monday") push(books);
    push(poem, endSlide(cycle, world));
  } else if (day === "wednesday") {
    push(goal);
    if (fluency) push(patternSlide(cycle, world));
    else pushAll(letterPairSlides(cardsForDay("Wednesday"), cycle, world));
    pushAll(hfwSlides());
    pushAll(blend);
    push(callResponseSlide(cycle, world, 2));
    push(poem, endSlide(cycle, world));
  } else if (day === "thursday") {
    push(goal);
    pushAll(paSlides(cycle, world));
    pushAll(hfwSlides());
    pushAll(blend);
    if (fluency) push(chainSlide(cycle, world));
    push(callResponseSlide(cycle, world, 3));
    push(poem, endSlide(cycle, world));
  } else if (day === "friday") {
    if (fridayCheck) {
      if (fluency) push(patternSlide(cycle, world), chainSlide(cycle, world));
      else push(soundReviewSlide(cards, world));
      pushAll(hfwSlides());
      pushAll(blend);
      push(endSlide(cycle, world));
    } else {
      push(goal);
      if (fluency) push(patternSlide(cycle, world), chainSlide(cycle, world));
      else if (reviewOnly) push(soundReviewSlide(cards, world));
      else pushAll(cards.map(card => letterSoundSlide(card, cycle, world)));
      pushAll(hfwSlides());
      pushAll(paSlides(cycle, world));
      pushAll(blend);
      push(callResponseSlide(cycle, world, 1));
      push(poem, endSlide(cycle, world));
    }
  }
  return slides;
}

export function buildCyclePresentation(cycleId, { day = "" } = {}) {
  const cycle = getPresentationCycle(cycleId);
  if (!cycle) throw new Error("Unknown cycle");
  const dayKey = normalizeDay(day);
  const world = presentationWorldFor(cycle);

  const slides = assembleSlides(cycle, world, dayKey);

  const baseTitle = cycle.cycleNumber
    ? `Cycle ${cycle.cycleNumber} - ${cycleTopic(cycle)}`
    : presentationCycleDisplayTitle(cycle);
  const title = dayKey ? `${baseTitle} - ${DAY_LABELS[dayKey]}` : baseTitle;
  const deckScriptUrl = `${typeof window === "undefined" ? "" : window.location.origin}/present/deck.js`;
  const railLabel = dayKey ? `${railTitle(cycle)} · ${DAY_LABELS[dayKey]}` : railTitle(cycle);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Andika:wght@400;700&family=Caprasimo&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${DECK_CSS}</style></head>
<body>
<div id="scaler"><div id="stage">
  <header id="rail"><span id="rail-title">${esc(railLabel)}</span><nav id="rail-sections" aria-label="Lesson sections"></nav></header>
  <div id="deck">${slides.join("")}</div>
  <div id="nav"><button id="prev" type="button" aria-label="Previous">&#8249;</button><span id="counter"></span><button id="next" type="button" aria-label="Next">&#8250;</button></div>
</div></div>
<div id="start"><button id="startBtn" type="button">${ICON_PLAY}<span>Start presentation</span></button><p>Best on a projector. Arrow keys move, F is full screen, Esc leaves.</p></div>
<script src="${deckScriptUrl}"></script>
</body></html>`;
  return { title, slideCount: slides.length, html };
}

// Per-slide metadata for the picker's preview rail. Derived from the SAME html
// the deck ships, so a thumbnail can never describe a slide the deck does not
// contain. (PresentPage renders these as the thumbnail strip.)
export function presentationSlideIndex(cycleId, { day = "" } = {}) {
  const { html } = buildCyclePresentation(cycleId, { day });
  const out = [];
  const re = /<section class="slide ([^"]*)"([^>]*)>/g;
  let match = re.exec(html);
  while (match) {
    const cls = match[1].trim();
    const attrs = match[2] || "";
    const section = /data-section="([^"]*)"/.exec(attrs)?.[1] || "";
    out.push({ index: out.length, cls, section });
    match = re.exec(html);
  }
  return out;
}

export function openCyclePresentation(cycleId, { day = "" } = {}) {
  const { html, title } = buildCyclePresentation(cycleId, { day });
  const result = openHtmlDocument({
    html,
    name: "lp-present",
    features: "width=1280,height=800",
    keepUrlWhenBlocked: true
  });
  return { ok: result.ok, url: result.url, title };
}

// Font stacks. Caprasimo is the display voice for CHROME only. Andika is the
// literacy face and stays on every glyph a child decodes - a display face must
// never be the letterform a five-year-old is copying. Both fall back to system
// stacks so the deck is still legible on an offline classroom projector.
const FONT_BODY = `'Figtree','Segoe UI','Helvetica Neue',Arial,sans-serif`;
const FONT_DISPLAY = `'Caprasimo','Segoe UI Rounded','Arial Rounded MT Bold','Trebuchet MS',sans-serif`;
const FONT_LETTER = `'Andika','Segoe UI Rounded','Arial Rounded MT Bold','Trebuchet MS',sans-serif`;

const DECK_CSS = `
  /* ── Organic tokens ──────────────────────────────────────────────────────
     Taken from the design system's styles.css. --w-accent is still set
     per-world on #stage so Meadow / Dino / Moonwood can tint the deck; it
     defaults to the terracotta accent. */
  :root {
    --bg: #f5ead8;
    --ink: #201e1d;
    --surface: #fff8ef;
    --accent: #c67139;
    --accent-100: #fff2eb;
    --accent-200: #ffe1d0;
    --accent-300: #ffc6a5;
    --accent-600: #b2622d;
    --accent-700: #8c491a;
    --sage: #7a8a5e;
    --sage-100: #f0fae1;
    --sage-200: #e1eecc;
    --sage-300: #ccdbb2;
    --sage-600: #728157;
    --sage-700: #56633f;
    --sage-800: #3d472b;
    --n-200: #eee7db;
    --n-300: #dcd3c4;
    --n-400: #c0b6a5;
    --n-500: #a19786;
    --n-600: #82796a;
    --n-700: #645c50;
    --n-900: #2e2b25;
    --radius: 28px;
    --shadow-md: 0 3px 10px rgba(46,43,37,.16);
    --shadow-lg: 0 12px 32px rgba(46,43,37,.22);
    /* Type scale for a 1920x1080 stage. Nothing here goes below 26px. */
    --t-rail: 26px;
    --t-kicker: 32px;
    --t-small: 30px;
    --t-body: 44px;
    --t-h2: 72px;
    --t-h1: 120px;
    --t-title: 168px;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; overflow: hidden; background: var(--n-900);
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
    padding: 0 104px; pointer-events: none; transition: opacity .25s ease; }
  #stage.chromeless #rail { opacity: 0; }
  #rail-title { font-size: var(--t-rail); font-weight: 600; color: var(--n-700); white-space: nowrap; }
  #rail-sections { display: flex; align-items: center; gap: 10px; }
  .rail-pill { font-size: var(--t-rail); font-weight: 600; color: var(--n-600);
    padding: 8px 20px; border-radius: 999px; white-space: nowrap; }
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
  .p-two-col-poem { grid-template-columns: 660px 1fr; gap: 72px; }
  .p-col-left { display: flex; flex-direction: column; align-items: flex-start; gap: 32px; }
  .p-col-left-text { gap: 28px; }
  .p-col-right { display: flex; flex-direction: column; align-items: flex-start;
    justify-content: center; gap: 32px; min-width: 0; }
  .p-col-rule { border-left: 4px solid var(--n-300); padding-left: 56px; }

  /* ── Letter sound ───────────────────────────────────────────────────────── */
  .p-disc { width: 520px; height: 520px; border-radius: 999px; background: var(--accent-200);
    display: flex; align-items: center; justify-content: center; flex: 0 0 auto; }
  .p-letter { font-family: ${FONT_LETTER}; font-weight: 700; line-height: 1; color: var(--accent-700); }
  .p-sound-row { display: flex; align-items: center; gap: 24px; }
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
  .p-audio { display: inline-flex; align-items: center; gap: 14px; background: var(--accent);
    color: var(--bg); border: 0; border-radius: 999px; padding: 20px 40px;
    font-family: ${FONT_BODY}; font-size: 32px; font-weight: 700; cursor: pointer;
    transition: background .15s ease; }
  .p-audio:hover { background: var(--accent-600); }
  .p-audio:active { background: var(--accent-700); }
  .p-audio-ghost, .p-reveal-btn { display: inline-flex; align-items: center; gap: 14px;
    background: transparent; color: var(--accent-700); border: 3px solid var(--accent);
    border-radius: 999px; padding: 18px 38px; font-family: ${FONT_BODY}; font-size: 32px;
    font-weight: 700; cursor: pointer; transition: background .15s ease; }
  .p-audio-ghost:hover, .p-reveal-btn:hover { background: var(--accent-200); }
  .p-audio-ghost:active, .p-reveal-btn:active { background: var(--accent-300); }

  /* ── Reveal ─────────────────────────────────────────────────────────────── */
  .p-answer { opacity: 0; transition: opacity .35s ease; }
  .slide.revealed .p-answer { opacity: 1; }
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
    background: var(--accent); border: 0; font-family: ${FONT_LETTER}; font-size: 120px;
    font-weight: 700; color: var(--bg); cursor: pointer; transition: background .15s ease; }
  .p-made:hover { background: var(--accent-600); }
  .p-made:active { background: var(--accent-700); }
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
  .p-panel.odd { background: var(--accent-200); color: var(--accent-700); }
  .p-panel.odd:hover { background: var(--accent-300); }

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
  .p-pencil circle { fill: var(--accent-300); stroke: var(--accent-700); stroke-width: 2.5; }
  .p-pencil path { fill: var(--accent-200); stroke: var(--accent-700); stroke-width: 2.5; stroke-linejoin: round; }

  /* ── Poem and books ─────────────────────────────────────────────────────── */
  .washed { filter: saturate(.6) contrast(.85) brightness(1.1) opacity(.94); }
  .p-poem-hero { width: 100%; height: 720px; object-fit: cover; border-radius: 36px; box-shadow: var(--shadow-lg); }
  .p-poem-title { margin: 0; font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: 80px; line-height: 1.1; }
  .p-poem { white-space: pre-wrap; font-family: ${FONT_LETTER}; font-size: 50px; line-height: 1.55; }
  .p-poem-pics { display: flex; gap: 24px; }
  .p-poem-pics img { width: 140px; height: 140px; object-fit: contain; background: var(--surface);
    border-radius: 24px; padding: 12px; box-shadow: var(--shadow-md); }
  .p-books { display: grid; grid-template-columns: repeat(2, 1fr); gap: 56px; }
  .p-book { margin: 0; display: flex; flex-direction: column; gap: 24px; }
  .p-book-cover { width: 100%; height: 440px; object-fit: cover; border-radius: var(--radius);
    box-shadow: var(--shadow-lg); }
  .p-book figcaption { display: flex; flex-direction: column; gap: 10px; }
  .p-book-title { font-family: ${FONT_DISPLAY}; font-size: 44px; line-height: 1.15; }
  .p-book-level { font-size: 28px; font-weight: 600; color: var(--sage-600); }
  .p-routines { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column;
    gap: 20px; font-size: 40px; max-width: 1400px; }
  .p-routines li { background: var(--surface); border-radius: var(--radius); padding: 24px 40px;
    box-shadow: var(--shadow-md); }

  /* ── The teacher strip ──────────────────────────────────────────────────
     The articulation tip is written for the ADULT. On the old deck it sat in
     the middle of the slide in a yellow ribbon, competing with the letter the
     class was meant to be looking at. Here it is a quiet rule at the base. */
  .p-foryou { position: absolute; left: 104px; right: 104px; bottom: 56px; margin: 0;
    display: flex; align-items: center; gap: 20px; border-top: 2px solid var(--n-300);
    padding-top: 24px; }
  .p-foryou b { font-size: var(--t-rail); font-weight: 700; letter-spacing: .1em;
    text-transform: uppercase; color: var(--sage-600); flex: 0 0 auto; }
  .p-foryou span { font-size: var(--t-small); color: var(--n-700); }

  /* ── Mascot ─────────────────────────────────────────────────────────────── */
  .p-pal-corner { position: absolute; bottom: 152px; right: 104px; height: 200px;
    pointer-events: none; z-index: 1; animation: bob 3.4s ease-in-out infinite;
    filter: drop-shadow(0 12px 20px rgba(46,43,37,.22)); }
  .p-pal-hero { position: relative; height: 540px; object-fit: contain;
    animation: bob 3.4s ease-in-out infinite; filter: drop-shadow(0 24px 40px rgba(0,0,0,.35)); }
  .p-close .p-pal-hero { height: 500px; filter: drop-shadow(0 20px 34px rgba(46,43,37,.3)); }
  @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }

  /* ── Start overlay and nav ──────────────────────────────────────────────── */
  #start { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 24px; z-index: 10; background: var(--bg); }
  #start button { display: inline-flex; align-items: center; gap: 16px; font-family: ${FONT_BODY};
    font-weight: 700; font-size: 34px; background: var(--accent); color: var(--bg); border: 0;
    border-radius: 999px; padding: 22px 64px; cursor: pointer; transition: background .15s ease; }
  #start button:hover { background: var(--accent-600); }
  #start button:active { background: var(--accent-700); }
  #start p { color: var(--n-600); font-size: 20px; }
  #nav { position: absolute; right: 48px; bottom: 40px; z-index: 6; display: none;
    align-items: center; gap: 20px; }
  #nav button { font-size: 40px; line-height: 1; background: var(--surface); color: var(--n-700);
    border: 3px solid var(--n-300); border-radius: 999px; width: 72px; height: 72px;
    cursor: pointer; transition: border-color .15s ease, color .15s ease; }
  #nav button:hover { border-color: var(--accent); color: var(--accent-700); }
  #counter { color: var(--n-600); font-size: var(--t-rail); font-weight: 600; min-width: 7ch;
    text-align: center; }

  @media print {
    #scaler { position: static; display: block; overflow: visible; }
    #stage { position: static; transform: none !important; }
    #start, #nav { display: none !important; }
    .slide { position: relative; display: flex !important; page-break-after: always; }
    .p-cover, .p-close, .p-together { display: grid !important; }
    .p-answer { opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    .slide.active, .p-pal-corner, .p-pal-hero { animation: none; }
  }
`;
