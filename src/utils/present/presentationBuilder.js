// Whole-class "Present" mode: builds a self-contained, fullscreen teaching deck
// for one cycle, opened in a new window for the projector. Deterministic (same
// cycle + same day => same deck bytes). Uses existing gold-voice audio and
// picture-word images. Decks can be built for the whole cycle (default) or for
// a single teaching day (Monday..Friday) - day decks reuse the same slide
// builders, they only select which sections appear.
import { elSkillsBlockCycles, LETTER_EXAMPLES } from "../../data/elSkillsBlockCycles.js";
import { EL_CYCLE_POEMS } from "../../data/elCyclePoems.js";
import { AUDIO_FILE_PATHS } from "../../data/generated/audioFilePaths.generated.js";
import { graphemeAudioPath, wordAudioPath } from "../../components/elQuest/elQuestEngine.js";
import { getChildWordAsset } from "../../data/childAssets.js";
import { guidedReadingBooks } from "../../data/guidedReadingBooks.js";
import { themeWorldForCycle } from "../../utils/palWorlds.js";
import { LETTER_STROKES, LETTER_GUIDES } from "../../data/letterStrokes.js";
import { openHtmlDocument } from "../openHtmlDocument.js";

function isFluencyCycle(cycle) {
  return (cycle?.cycleNumber || 0) >= 25;
}

// Book covers for the "Our books this cycle" slide, looked up from the real
// guided-reading library so the deck never invents a path.
const BOOK_COVERS = new Map(
  guidedReadingBooks.map(book => [book.id, book.coverImage || book.cover || ""])
);

// The Pals mascot for a deck's world. Threaded as a parameter through every
// slide builder (never module state) so concurrent builds cannot
// cross-contaminate each other's art.
function palImg(world, pose, cls = "") {
  return `<img class="p-pal ${cls}" src="/images/pals/poses/${world.id}-${pose}.webp" alt="" onerror="this.style.display='none'"/>`;
}
function wordImage(word) {
  const asset = getChildWordAsset(word) || {};
  return asset.image || "";
}

// World for a deck: numbered cycles use the quest-map land bands; assessment
// weeks borrow the land of the nearest preceding numbered cycle (BOY sits
// before cycle 1 => Meadow, MOY after cycle 12 => Dino, EOY after 27 => Moonwood).
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

function normalizeDay(day) {
  const clean = String(day || "").trim().toLowerCase();
  if (!clean || clean === "cycle" || clean === "whole" || clean === "all") return "";
  if (DAY_LABELS[clean]) return clean;
  throw new Error(`Unknown presentation day: ${day}`);
}

export function presentationCycleOptions() {
  return elSkillsBlockCycles
    .filter(c => c.cycleNumber || c.type === "assessment")
    .map(c => {
      const rest = String(c.title || "").replace(/^Cycle \d+:?\s*/, "").trim();
      return {
        id: c.id,
        cycleNumber: c.cycleNumber || null,
        title: c.title,
        type: c.type || "cycle",
        label: c.cycleNumber
          ? (rest ? `Cycle ${c.cycleNumber}: ${rest}` : `Cycle ${c.cycleNumber}`)
          : c.title
      };
    });
}

export function getPresentationCycle(cycleId) {
  return elSkillsBlockCycles.find(c => c.id === cycleId) || null;
}

// ── Curated phonemic-awareness banks, one per curriculum skill ────────────────
// Every EL cycle declares its own phonemicAwareness skills; the deck teaches
// EXACTLY those skills, with different examples per cycle (offset rotation),
// so no two cycles show the same warm-up.
const COMPOUND_BANK = [
  ["sun", "set"], ["cup", "cake"], ["rain", "bow"], ["pan", "cake"],
  ["back", "pack"], ["pop", "corn"], ["star", "fish"], ["dog", "house"],
  ["sand", "box"], ["bed", "time"], ["snow", "man"], ["tea", "pot"]
];
// Two-syllable words split into sayable parts (first part / last part).
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
// Three-syllable compounds split at a syllable boundary.
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
// Fluency cycles: each cycle drills the pattern ITS OWN sight words follow.
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

// Pattern graphemes without their own LETTER_EXAMPLES entry borrow real
// recorded words that contain the pattern (mirrors the quest engine's list).
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

// Deterministic per-cycle slice so consecutive cycles that share a skill see
// DIFFERENT examples. The offset (per-skill within one deck) keeps two skills
// that draw on the SAME bank in one cycle on disjoint slices - no repeats.
function pickPer(list, cycleNumber, count = 2, offset = 0) {
  const start = (((cycleNumber - 1) * count) + offset) % list.length;
  return Array.from({ length: count }, (_u, i) => list[(start + i) % list.length]);
}

function esc(value) {
  return String(value).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

// Every grapheme the curriculum declares gets a card. Multi-grapheme rows
// ("ff ss zz ll", the fizzle letters) split into one card per grapheme, and
// "Aa"-style review entries reduce to their single letter (never "aa").
// Spellings up to 3 letters are kept so digraph/pattern cycles (sh, ch, th,
// all, ang, ing, ong, ung) keep their letter-sound and writing slides.
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

function exampleWords(spelling, limit = 3) {
  const own = LETTER_EXAMPLES[spelling] || [];
  const list = own.length ? own : (PATTERN_EXAMPLES[spelling] || []);
  return list.filter(w => /^[a-z]{2,6}$/.test(w)).slice(0, limit);
}

// Single letters taught by the end of a given cycle - blend words must never
// use a letter the class has not met (same rule as the quest's Word Build).
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

// A word is letter-by-letter blendable only if every letter says its own
// sound: exactly one vowel (no teams, no silent e), vowel not final, and no
// consonant digraph hiding two letters inside one sound.
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

// ── Slide builders (each returns one .slide section) ─────────────────────────
function slide(world, inner, opts = {}) {
  const attrs = { ...(opts.attrs || {}) };
  if (opts.audio) attrs["data-audio"] = opts.audio;
  if (opts.stroke) attrs["data-stroke"] = opts.stroke;
  const data = Object.entries(attrs).map(([key, value]) => `${key}="${esc(value)}"`).join(" ");
  const char = opts.char ? palImg(world, opts.char, "p-pal-corner") : "";
  return `<section class="slide ${opts.cls || ""}" ${data}>${inner}${char}</section>`;
}

// Inline SVG icons: the deck must contain no emoji (scrubber-safe, projector-safe).
const ICON_SPEAKER = `<svg class="p-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9Z"/><path d="M16.5 8.3a4.8 4.8 0 0 1 0 7.4l-1.3-1.5a2.9 2.9 0 0 0 0-4.4Z"/></svg>`;
const ICON_PENCIL = `<svg class="p-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.2 13.9 6.3l3.8 3.8L6.8 21H3ZM15.3 4.9l1.8-1.8a1.4 1.4 0 0 1 2 0l1.8 1.8a1.4 1.4 0 0 1 0 2l-1.8 1.8Z"/></svg>`;
const ICON_PLAY = `<svg class="p-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5Z"/></svg>`;

function audioButton(src, label = "Play sound") {
  if (!src) return "";
  return `<button class="p-audio" data-play="${esc(src)}" type="button">${ICON_SPEAKER} ${esc(label)}</button>`;
}

// Human phase labels for the title slide - never raw slugs, never all-caps.
const PHASE_LABELS = {
  "early-letter-sound": "Letter sounds · Early",
  "letter-sound-expansion": "Letter sounds · Expansion",
  "letter-sound-completion": "Letter sounds · Completion",
  "cvc-onset": "CVC words · First sounds",
  "cvc-rime": "CVC words · Endings",
  "microphase-wrap-up": "Review and wrap-up",
  digraphs: "Digraphs",
  patterns: "Patterns",
  "pattern-power": "Pattern power",
  baseline: "Baseline assessment",
  benchmark: "Benchmark assessment",
  "review-extension": "Review and extension",
  celebration: "Celebration",
  "skills-block": "Skills block"
};

function humanizePhase(phase) {
  const key = String(phase || "").toLowerCase();
  if (PHASE_LABELS[key]) return PHASE_LABELS[key];
  const text = key.replace(/-/g, " ").trim();
  return text ? text[0].toUpperCase() + text.slice(1) : "Review time";
}

function cycleHeading(cycle) {
  const letters = (cycle.focusLetters || []).map(c => c.grapheme).filter(Boolean);
  // Long lists ("ng and ang and ing and...") read badly - fall back to title.
  if (!isFluencyCycle(cycle) && letters.length && letters.length <= 3) return letters.join(" and ");
  if (cycle.title && cycle.title !== `Cycle ${cycle.cycleNumber}`) {
    return cycle.title.replace(/^Cycle \d+:\s*/, "");
  }
  if (!isFluencyCycle(cycle) && letters.length) return `${letters[0]} families`;
  return humanizePhase(cycle.phase);
}

function titleSlide(cycle, world, dayLabel = "") {
  const kickerParts = [
    cycle.type === "assessment" ? "Assessment week" : `Cycle ${cycle.cycleNumber}`,
    dayLabel,
    world.name
  ].filter(Boolean);
  return slide(world, `
    ${palImg(world, "celebrate", "p-pal-hero")}
    <p class="p-kicker">${esc(kickerParts.join(" · "))}</p>
    <h1 class="p-title">${esc(cycleHeading(cycle))}</h1>
    <p class="p-phase">${esc(humanizePhase(cycle.phase))}</p>
    <p class="p-hint">Press the right arrow key or click to begin</p>`, { cls: "p-cover" });
}

function letterSoundSlide(card, cycle, world) {
  const big = displayGrapheme(card);
  const phoneme = graphemeAudioPath(card.spelling);
  // The curriculum ships a real articulation tip per letter - teach with it,
  // styled as a "teacher tip" ribbon (the teacher reads it, kids do not decode it).
  const detail = (cycle?.sections?.letterLearning?.cards || [])
    .find(c => (c.spelling || "").toLowerCase() === card.spelling) || {};
  const tip = detail.articulation || "";
  // Only show example words that actually have a picture - no empty boxes.
  const words = exampleWords(card.spelling, 6).filter(w => wordImage(w)).slice(0, 3);
  const pics = words.map(word => `<button class="p-word" data-play="${esc(wordAudioPath(word))}" type="button">
      <img src="${esc(wordImage(word))}" alt="${esc(word)}" onerror="this.closest('.p-word').style.display='none'"/>
      <span>${esc(word)}</span></button>`).join("");
  return slide(world, `
    <p class="p-kicker">Our sound</p>
    <div class="p-letter">${esc(big)}</div>
    <p class="p-says">This says <b>${esc(card.sound || "/" + card.spelling + "/")}</b></p>
    ${tip ? `<p class="p-tip"><b>Teacher tip</b><span>${esc(tip)}</span></p>` : ""}
    ${audioButton(phoneme, "Hear the sound")}
    <div class="p-words">${pics}</div>`, { cls: "p-letter-slide", audio: phoneme, char: "wave" });
}

// Real stroke-by-stroke writing demo: each stroke draws itself in pedagogic
// order while a pencil tip follows the line (data from letterStrokes.js).
// Returns "" when ANY character lacks stroke data - never a partial demo.
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
  const pencil = `<g data-pencil class="p-pencil"><circle r="7"/><path d="M2 -4 L20 -34 L30 -28 L14 4 Z"/></g>`;
  return `<svg class="p-write-svg" viewBox="0 0 ${width} 140" aria-hidden="true">${guides}${body}${pencil}</svg>`;
}

function writingSlide(card, world) {
  const svg = writingSvg(displayGrapheme(card));
  if (!svg) return "";
  return slide(world, `
    <p class="p-kicker">Let's write it</p>
    ${svg}
    <button class="p-audio" type="button" data-replay>${ICON_PENCIL} Watch again</button>
    <p class="p-hint">Now you write it in the air!</p>`, { cls: "p-writing", stroke: "1", char: "think" });
}

function letterPairSlides(cards, cycle, world) {
  return cards.flatMap(card => {
    const out = [letterSoundSlide(card, cycle, world)];
    const writing = writingSlide(card, world);
    if (writing) out.push(writing);
    return out;
  });
}

// Review cycles re-visit 12-14 known letters: one tap-to-hear sound wall
// beats 24+ re-teaching slides the class has already seen.
function soundReviewSlide(cards, world) {
  if (!cards.length) return "";
  const chips = cards.map(card =>
    `<button class="p-chip big" data-play="${esc(graphemeAudioPath(card.spelling))}" type="button">${esc(displayGrapheme(card))}</button>`).join("");
  return slide(world, `
    <p class="p-kicker">Sound check</p>
    <h2 class="p-says">What sound does each one make? Tap to check.</h2>
    <div class="p-chips">${chips}</div>`, { cls: "p-sound-review", char: "point" });
}

function sightWordSlide(word, world) {
  return slide(world, `
    <p class="p-kicker">Tricky word</p>
    <div class="p-sight">${esc(word)}</div>
    ${audioButton(wordAudioPath(word), "Read it")}
    <p class="p-sentence">Find it, say it, spell it: <b>${esc(word.split("").join(" "))}</b></p>`,
  { cls: "p-sight-slide", audio: wordAudioPath(word), char: "read" });
}

// "Blend with me": sound out a word built ONLY from taught letters, then read
// it whole. Letter chips speak their phoneme; the word chip speaks the word.
function blendSlides(cycle, world) {
  return blendWordsFor(cycle).map(word => {
    const letters = word.split("").map(ch =>
      `<button class="p-chip big" data-play="${esc(graphemeAudioPath(ch))}" type="button">${esc(ch)}</button>`).join("");
    return slide(world, `
      <p class="p-kicker">Blend with me</p>
      <div class="p-compound" data-blend-word="${esc(word)}">${letters}<span class="p-arrow">&#8594;</span><button class="p-chip big made" data-play="${esc(wordAudioPath(word))}" type="button">${esc(word)}</button></div>
      <p class="p-says">Say each sound, then read the whole word.</p>`,
    { cls: "p-blend", audio: wordAudioPath(word), char: "point" });
  });
}

// "Our books this cycle": the guided-reading fiction + nonfiction picks with
// real covers from the book library (onerror hides a missing image).
function booksSlide(cycle, world) {
  const rec = cycle.guidedReadingRecommendations || {};
  const books = [rec.fiction, rec.nonfiction].filter(Boolean);
  if (!books.length) return "";
  const cards = books.map(book => {
    const cover = BOOK_COVERS.get(book.bookId) || "";
    return `<figure class="p-book">
      ${cover ? `<img class="p-book-cover" src="${esc(cover)}" alt="" onerror="this.style.display='none'"/>` : ""}
      <figcaption><span class="p-book-title">${esc(book.title)}</span><span class="p-book-level">Level ${esc(book.level)} · ${esc(book.type === "fiction" ? "Story" : "Real world")}</span></figcaption>
    </figure>`;
  }).join("");
  return slide(world, `
    <p class="p-kicker">Our books this cycle</p>
    <div class="p-books">${cards}</div>
    <p class="p-hint">We will read these together this week</p>`, { cls: "p-books-slide", char: "read" });
}

// Assessment weeks: a simple deck listing the week's routines.
function routinesSlide(cycle, world) {
  const items = (cycle.routines || []).map(r => `<li>${esc(r)}</li>`).join("");
  if (!items) return "";
  return slide(world, `
    <p class="p-kicker">This week</p>
    <h2 class="p-goal">${esc(cycle.title)}</h2>
    <ul class="p-routines">${items}</ul>`, { cls: "p-routines-slide", char: "point" });
}

// ── Phonemic-awareness candidates, one builder per curriculum skill ───────────
// Builders return CANDIDATES ({ key, inner, opts }); assembly budgets them so
// every declared skill keeps at least one slide and no example repeats.
function deleteCandidate({ kicker, whole, wholeAudio, removed, left, leftAudio }) {
  return {
    key: whole,
    inner: `
    <p class="p-kicker">${esc(kicker)}</p>
    <div class="p-take">
      <span class="p-big-word" data-play="${esc(wholeAudio || "")}">${esc(whole)}</span>
      <span class="p-arrow">&#8594;</span>
      <span class="p-big-word made" data-play="${esc(leftAudio || "")}">${esc(left)}</span>
    </div>
    <p class="p-says">Say <b>${esc(whole)}</b>. Now say it without <b>${esc(removed)}</b>. What is left?</p>`,
    opts: { cls: "p-phoneme", char: "wave" }
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
      whole, wholeAudio: wordAudioPath(whole), removed, left, leftAudio: wordAudioPath(left)
    });
  });
}

function syllableDeleteCands(cycleNumber, bank, part, offset) {
  return pickPer(bank, cycleNumber, PA_CANDIDATES, offset).map(item => deleteCandidate({
    kicker: part === "first" ? "Take the first part away" : "Take the last part away",
    whole: item.word,
    wholeAudio: wordAudioPath(item.word),
    removed: part === "first" ? (item.first || "") : (item.last || item.rest || ""),
    left: part === "first" ? (item.rest || item.last || "") : (item.first || ""),
    leftAudio: wordAudioPath(part === "first" ? (item.rest || item.last || "") : (item.first || ""))
  }));
}

function onsetDeleteCands(cycleNumber, offset) {
  return pickPer(ONSET_BANK, cycleNumber, PA_CANDIDATES, offset).map(item => deleteCandidate({
    kicker: "Take the first sound away",
    whole: item.word, wholeAudio: wordAudioPath(item.word),
    removed: `/${item.word[0]}/`, left: item.left, leftAudio: wordAudioPath(item.left)
  }));
}

function rimeDeleteCands(cycleNumber, offset) {
  return pickPer(RIME_DELETE_BANK, cycleNumber, PA_CANDIDATES, offset).map(item => deleteCandidate({
    kicker: "Keep only the first sound",
    whole: item.word, wholeAudio: wordAudioPath(item.word),
    removed: `-${item.word.slice(1)}`, left: item.left, leftAudio: ""
  }));
}

function chipRow(words) {
  return words.map(w => `<button class="p-chip" data-play="${esc(wordAudioPath(w))}" type="button">${esc(w)}</button>`).join("");
}

function changeFirstCands(cycleNumber, offset) {
  return pickPer(CHANGE_FIRST_BANK, cycleNumber, PA_CANDIDATES, offset).map(item => ({
    key: item.base,
    inner: `
      <p class="p-kicker">Change the first sound</p>
      <div class="p-big-word" data-play="${esc(wordAudioPath(item.base))}">${esc(item.base)}</div>
      <p class="p-says">Change the first sound of <b>${esc(item.base)}</b> to make new words:</p>
      <div class="p-chips">${chipRow(item.made)}</div>`,
    opts: { cls: "p-phoneme", char: "wave" }
  }));
}

function changeRimeCands(cycleNumber, offset) {
  return pickPer(CHANGE_RIME_BANK, cycleNumber, PA_CANDIDATES, offset).map(item => ({
    key: item.base,
    inner: `
      <p class="p-kicker">Keep the first sound, change the ending</p>
      <div class="p-big-word" data-play="${esc(wordAudioPath(item.base))}">${esc(item.base)}</div>
      <p class="p-says">Keep <b>/${esc(item.onset)}/</b> and change the ending of <b>${esc(item.base)}</b>:</p>
      <div class="p-chips">${chipRow(item.made)}</div>`,
    opts: { cls: "p-phoneme", char: "wave" }
  }));
}

function rhymeIdentifyCands(cycleNumber, offset) {
  return pickPer(RHYME_PAIRS_BANK, cycleNumber, PA_CANDIDATES, offset).map(item => ({
    key: `${item.a}+${item.b}`,
    inner: `
      <p class="p-kicker">Rhyme time</p>
      <p class="p-says">Which two words rhyme? Which one does not?</p>
      <div class="p-chips big">${chipRow([item.a, item.b, item.odd])}</div>`,
    opts: { cls: "p-phoneme", char: "read" }
  }));
}

function rhymeProduceCands(cycleNumber, offset) {
  return pickPer(RHYME_PRODUCE_BANK, cycleNumber, PA_CANDIDATES, offset).map(item => ({
    key: item.base,
    inner: `
      <p class="p-kicker">Make a rhyme</p>
      <div class="p-big-word" data-play="${esc(wordAudioPath(item.base))}">${esc(item.base)}</div>
      <p class="p-says">What rhymes with <b>${esc(item.base)}</b>? Say your own, then check ours:</p>
      <div class="p-chips">${chipRow(item.rhymes)}</div>`,
    opts: { cls: "p-phoneme", char: "wave" }
  }));
}

// Skills that route to TWO builders interleave their candidates so a trimmed
// budget still shows one of each variety.
function interleave(a, b) {
  const out = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    if (a[i]) out.push(a[i]);
    if (b[i]) out.push(b[i]);
  }
  return out;
}

// Route each curriculum phonemicAwareness line to its candidate builder(s).
// `index` is the skill's position in the cycle's own list - it doubles as the
// per-deck pickPer offset so two skills never share a bank slice.
function paSkillCandidateSets(cycle) {
  const n = cycle.cycleNumber || 1;
  const sets = [];
  (cycle.phonemicAwareness || []).forEach((skill, index) => {
    const s = String(skill).toLowerCase();
    const off = index * PA_CANDIDATES;
    let candidates = [];
    // Three-syllable rules must be tested BEFORE the generic compound rules:
    // "Delete first syllable in three-syllable compound words" contains both.
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

// Budget PA slides per skill: every declared skill keeps at least one slide
// (2 each when the cycle declares 1-2 skills, trimmed WITHIN skills when it
// declares more) and no two slides in one deck reuse an example.
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
    // Never drop a declared skill, even in the (unreachable-today) case where
    // every candidate collided with an earlier skill's examples.
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
    <p class="p-hint">Say it together!</p>`, { cls: "p-goal-slide", char: "point" });
}

function poemSlide(cycle, world) {
  const poem = EL_CYCLE_POEMS.find(p => p.cycle === cycle.cycleNumber);
  if (!poem) return "";
  // v2 poem narration matches the rewritten character poems (see audio request).
  // Old v1 recordings voiced the previous poems, so we never play them here.
  const narration = `/audio/learn-games/poems/v2/cycle-${String(cycle.cycleNumber).padStart(2, "0")}.mp3`;
  const audio = AUDIO_FILE_PATHS.has(narration) ? narration : "";
  const pics = (poem.findWords || []).map(word => {
    const asset = getChildWordAsset(word) || {};
    return asset.image ? `<img src="${esc(asset.image)}" alt="${esc(word)}" onerror="this.style.display='none'"/>` : "";
  }).filter(Boolean).slice(0, 3).join("");
  // Bespoke per-poem illustration (generated from the art briefs). Shows when
  // the file exists; until then it hides and the text + word pictures remain.
  const poemImg = `/images/pals/poems/cycle-${String(cycle.cycleNumber).padStart(2, "0")}.webp`;
  return slide(world, `
    <p class="p-kicker">Our poem</p>
    <h2 class="p-poem-title">${esc(poem.title)}</h2>
    ${audioButton(audio, "Listen to the poem")}
    <div class="p-poem-wrap">
      <img class="p-poem-hero" src="${esc(poemImg)}" alt="" onerror="this.style.display='none'"/>
      <div class="p-poem">${esc(poem.lines.join("\n"))}</div>
    </div>
    <div class="p-poem-pics">${pics}</div>`, { cls: "p-poem-slide", audio, char: "read" });
}

function patternSlide(cycle, world) {
  // Each fluency cycle drills the pattern its OWN sight words follow
  // (25: -ay like "day/say"; 26: -y like "by/my/why/try"; 27: review).
  const sort = CYCLE_PATTERN_SORTS[cycle.cycleNumber] || CYCLE_PATTERN_SORTS[27];
  return slide(world, `
    <p class="p-kicker">Pattern power</p>
    <h2 class="p-says">Read the words that <b>${esc(sort.label)}</b></h2>
    <div class="p-chips big">${chipRow(sort.words)}</div>`, { cls: "p-phoneme", char: "wave" });
}

function chainSlide(cycle, world) {
  const chain = CYCLE_CHAINS[cycle.cycleNumber] || CYCLE_CHAINS[27];
  const chips = chain.map((w, i) => `${i ? '<span class="p-arrow">&#8594;</span>' : ""}<button class="p-chip big" data-play="${esc(wordAudioPath(w))}" type="button">${esc(w)}</button>`).join("");
  return slide(world, `
    <p class="p-kicker">Word chain</p>
    <h2 class="p-says">Change one letter each time</h2>
    <div class="p-compound">${chips}</div>`, { cls: "p-phoneme", char: "wave" });
}

// Celebration slide with a recap of WHAT was learned - tappable audio chips.
function endSlide(cycle, world) {
  const letterChips = focusCards(cycle).map(card =>
    `<button class="p-chip" data-play="${esc(graphemeAudioPath(card.spelling))}" type="button">${esc(displayGrapheme(card))}</button>`).join("");
  const wordChips = (cycle.highFrequencyWords || []).map(w => {
    const word = String(w).toLowerCase();
    return `<button class="p-chip made" data-play="${esc(wordAudioPath(word))}" type="button">${esc(word)}</button>`;
  }).join("");
  const recap = (letterChips || wordChips)
    ? `<p class="p-says">We learned:</p><div class="p-chips p-recap">${letterChips}${wordChips}</div>`
    : "";
  return slide(world, `${palImg(world, "celebrate", "p-pal-hero")}
    <div class="p-stars">&#9733; &#9733; &#9733;</div><h1 class="p-title">Great learning!</h1>
    ${recap}
    <p class="p-hint">Press Esc to leave full screen</p>`, { cls: "p-cover" });
}

// One-line teacher summary for the picker, built from the same cycle data as
// the deck itself so it can never drift.
export function presentationCycleSummary(cycleId) {
  const cycle = getPresentationCycle(cycleId);
  if (!cycle) return "";
  const parts = [cycle.cycleNumber ? `Cycle ${cycle.cycleNumber}` : cycle.title];
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
  const hfwSlides = () => hfwWords.map(word => sightWordSlide(word, world));
  const cardsForDay = name => cards.filter(card => (card.day || "") === name);

  push(titleSlide(cycle, world, dayLabel));

  if (assessment) {
    // Assessment weeks: a short routines deck (no letters/HFW to teach).
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
    // Whole cycle (default): everything the cycle declares.
    push(goal);
    if (!fluency) {
      if (reviewOnly) push(soundReviewSlide(cards, world));
      else pushAll(letterPairSlides(cards, cycle, world));
      pushAll(blend);
    }
    pushAll(hfwSlides());
    pushAll(paSlides(cycle, world));
    if (fluency) push(patternSlide(cycle, world), chainSlide(cycle, world));
    push(poem, books, endSlide(cycle, world));
  } else if (day === "monday" || day === "tuesday") {
    // Letter day: that day's grapheme(s) + a PA warm-up.
    push(goal);
    if (fluency) push(patternSlide(cycle, world), chainSlide(cycle, world));
    else if (reviewOnly && day === "monday") push(soundReviewSlide(cards, world));
    else pushAll(letterPairSlides(cardsForDay(DAY_LABELS[day]), cycle, world));
    pushAll(paSlides(cycle, world, { skillIndex: day === "monday" ? 0 : 1 }));
    if (day === "monday") push(books);
    push(poem, endSlide(cycle, world));
  } else if (day === "wednesday") {
    // Sight words + blending (plus any Wednesday grapheme, e.g. cycles 11/13/23).
    push(goal);
    if (fluency) push(patternSlide(cycle, world));
    else pushAll(letterPairSlides(cardsForDay("Wednesday"), cycle, world));
    pushAll(hfwSlides());
    pushAll(blend);
    push(poem, endSlide(cycle, world));
  } else if (day === "thursday") {
    // Feel-the-beat day: all PA skills + sight words + blending review.
    push(goal);
    pushAll(paSlides(cycle, world));
    pushAll(hfwSlides());
    pushAll(blend);
    if (fluency) push(chainSlide(cycle, world));
    push(poem, endSlide(cycle, world));
  } else if (day === "friday") {
    if (fridayCheck) {
      // Cycle Check: quiz-style prompts only - no new teaching.
      if (fluency) push(patternSlide(cycle, world), chainSlide(cycle, world));
      else push(soundReviewSlide(cards, world));
      pushAll(hfwSlides());
      pushAll(blend);
      push(endSlide(cycle, world));
    } else {
      // Cycle Practice: mixed replay of the week.
      push(goal);
      if (fluency) push(patternSlide(cycle, world), chainSlide(cycle, world));
      else if (reviewOnly) push(soundReviewSlide(cards, world));
      else pushAll(cards.map(card => letterSoundSlide(card, cycle, world)));
      pushAll(hfwSlides());
      pushAll(paSlides(cycle, world));
      pushAll(blend);
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

  const baseTitle = cycle.cycleNumber ? `Cycle ${cycle.cycleNumber} - ${cycleHeading(cycle)}` : cycle.title;
  const title = dayKey ? `${baseTitle} - ${DAY_LABELS[dayKey]}` : baseTitle;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Andika:wght@400;700&family=Fredoka:wght@400;500;600&display=swap" rel="stylesheet">
<style>${DECK_CSS}</style></head>
<body>
<div id="deck" style="--w-accent:${world.accent};--w-soft:${world.accentSoft};--w-deep:${world.deep}">${slides.join("")}</div>
<div id="start"><button id="startBtn" type="button">${ICON_PLAY} Start presentation</button><p>Best on a projector. Arrow keys move, F is full screen, Esc leaves.</p></div>
<div id="nav"><button id="prev" type="button" aria-label="Previous">&#8249;</button><span id="counter"></span><button id="next" type="button" aria-label="Next">&#8250;</button></div>
<script>${DECK_JS}</script>
</body></html>`;
  return { title, slideCount: slides.length, html };
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

// The system-font fallbacks keep the deck legible on an OFFLINE classroom
// projector (the Google Fonts link is a progressive enhancement with
// display=swap; these stacks are what renders when it never loads).
const FONT_STACK = `'Fredoka','Andika','Segoe UI Rounded','Arial Rounded MT Bold','Trebuchet MS','Comic Sans MS',sans-serif`;
const LETTER_FONT_STACK = `'Andika','Segoe UI Rounded','Arial Rounded MT Bold','Trebuchet MS','Comic Sans MS',sans-serif`;

const DECK_CSS = `
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; overflow: hidden;
    color: #2b2118; font-family: ${FONT_STACK};
    background:
      radial-gradient(80vw 60vh at 50% -10%, color-mix(in srgb, var(--w-accent) 22%, #fff), transparent 70%),
      linear-gradient(180deg, #FFFDF7 0%, var(--w-soft) 100%); }
  #deck { height: 100vh; }
  .slide { position: absolute; inset: 0; display: none; flex-direction: column;
    align-items: center; justify-content: center; gap: 2.2vh; text-align: center; padding: 6vh 6vw; }
  .slide.active { display: flex; animation: pop .5s cubic-bezier(.2,1.3,.4,1) both; }
  @keyframes pop { from { opacity: 0; transform: translateY(14px) scale(.97); } to { opacity: 1; transform: none; } }
  .p-ico { width: 1.05em; height: 1.05em; fill: currentColor; vertical-align: -0.14em; }
  .p-kicker { margin: 0; letter-spacing: .06em; font-weight: 600;
    color: var(--w-deep); font-size: 2.6vh; }
  .p-title { font-family: ${FONT_STACK}; font-weight: 600; font-size: 9vh; margin: 0; color: var(--w-deep); }
  .p-phase { font-size: 3vh; color: #6b5a48; }
  .p-hint { color: #9a8a76; font-size: 2.4vh; }
  .p-letter { font-family: ${LETTER_FONT_STACK}; font-size: 34vh; line-height: .95; font-weight: 700; color: var(--w-accent);
    text-shadow: 0 6px 0 color-mix(in srgb, var(--w-accent) 28%, #fff); animation: wobble 2.4s ease-in-out infinite; }
  @keyframes wobble { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
  .p-says { font-size: 4.4vh; margin: 0; }
  .p-says b, .p-sentence b { color: var(--w-accent); }
  .p-words { display: flex; gap: 3vw; margin-top: 1vh; }
  .p-word, .p-chip, .p-big-word, .p-audio { cursor: pointer; }
  .p-word { background: none; border: 0; color: inherit; display: flex; flex-direction: column; align-items: center; gap: 1vh; font: inherit; }
  .p-word img { width: 20vh; height: 20vh; object-fit: contain; background: #fff; border: 4px solid #fff;
    border-radius: 24px; box-shadow: 0 10px 24px rgba(0,0,0,.12); padding: 1vh; }
  .p-word:hover img { transform: translateY(-1vh) rotate(-2deg); }
  .p-word span { font-size: 3.6vh; font-weight: 600; }
  .p-audio { margin-top: 1vh; background: var(--w-accent); color: #fff; border: 0; border-radius: 999px;
    padding: 1.6vh 3.4vw; font: inherit; font-weight: 600; font-size: 3vh; box-shadow: 0 8px 0 var(--w-deep); }
  .p-audio:active { transform: translateY(4px); box-shadow: 0 4px 0 var(--w-deep); }
  .p-sight { font-family: ${FONT_STACK}; font-size: 24vh; font-weight: 600; color: var(--w-accent); line-height: 1;
    text-shadow: 0 6px 0 color-mix(in srgb, var(--w-accent) 28%, #fff); }
  .p-sentence { font-size: 3.6vh; }
  .p-big-word { font-family: ${FONT_STACK}; font-size: 17vh; font-weight: 600; color: var(--w-accent); background: none; border: 0; }
  .p-big-word.made { color: #E0991C; }
  .p-take, .p-compound { display: flex; align-items: center; gap: 2.5vw; flex-wrap: wrap; justify-content: center; }
  .p-arrow { font-size: 9vh; color: #E0991C; }
  .p-chips { display: flex; gap: 2vw; flex-wrap: wrap; justify-content: center; margin-top: 1vh; max-width: 88vw; }
  .p-chip { background: #fff; color: var(--w-deep); border: 3px solid var(--w-accent); border-radius: 18px;
    padding: 1.4vh 3vw; font: inherit; font-weight: 600; font-size: 5vh; box-shadow: 0 6px 0 color-mix(in srgb, var(--w-accent) 30%, #fff); }
  .p-chip.big, .p-chips.big .p-chip { font-size: 7vh; }
  .p-chip.made { border-color: #E0991C; color: #8A5A1D; box-shadow: 0 6px 0 #F3D9A4; }
  .p-blend .p-compound { gap: 1.2vw; }
  .p-blend .p-compound .p-chip { padding: 1.4vh 2vw; }
  .p-stars { font-size: 14vh; color: #E0991C; letter-spacing: 1vh; }
  .p-recap .p-chip { font-size: 4vh; }
  .p-goal { font-family: ${FONT_STACK}; font-weight: 600; font-size: 6.4vh; margin: 0; color: var(--w-deep);
    max-width: 70vw; line-height: 1.3; }
  .p-tip { display: inline-flex; align-items: center; gap: 1.4vw; background: #FFF6E3; border: 2px solid #E8C97A;
    border-left: 10px solid #E0991C; border-radius: 14px; color: #6b5a48; font-size: 2.6vh; max-width: 64vw;
    margin: 0; padding: 1.2vh 2vw; text-align: left; }
  .p-tip b { color: #8A5A1D; white-space: nowrap; }
  .p-books { display: flex; gap: 4vw; align-items: flex-start; justify-content: center; flex-wrap: wrap; }
  .p-book { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 1.4vh; }
  .p-book-cover { height: 42vh; max-width: 34vw; object-fit: contain; background: #fff; border: 4px solid #fff;
    border-radius: 18px; box-shadow: 0 12px 30px rgba(0,0,0,.14); }
  .p-book figcaption { display: flex; flex-direction: column; gap: .4vh; }
  .p-book-title { font-size: 3.4vh; font-weight: 600; color: var(--w-deep); }
  .p-book-level { font-size: 2.4vh; color: #9a8a76; }
  .p-routines { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1.6vh;
    font-size: 3.6vh; max-width: 76vw; }
  .p-routines li { background: #fff; border-radius: 16px; padding: 1.4vh 3vw; box-shadow: 0 8px 20px rgba(0,0,0,.08); }
  .p-poem-title { font-family: ${FONT_STACK}; font-weight: 600; font-size: 5.4vh; margin: 0; color: var(--w-deep); }
  .p-poem-wrap { display: flex; align-items: center; gap: 3vw; flex-wrap: wrap; justify-content: center; }
  .p-poem-hero { height: 40vh; max-width: 42vw; object-fit: contain; border-radius: 22px;
    box-shadow: 0 14px 34px rgba(0,0,0,.16); background: #fff; }
  .p-poem { white-space: pre-wrap; font-size: 4vh; line-height: 1.5; background: #fff;
    border: 4px solid #fff; border-radius: 22px; box-shadow: 0 12px 30px rgba(0,0,0,.1); padding: 3vh 4vw; }
  .p-poem-pics { display: flex; gap: 2vw; margin-top: 1vh; }
  .p-poem-pics img { width: 16vh; height: 16vh; object-fit: contain; background: #fff; border: 4px solid #fff; border-radius: 18px; box-shadow: 0 10px 24px rgba(0,0,0,.12); padding: 1vh; }
  /* Writing demo: every stroke draws itself in real stroke ORDER while a
     pencil tip follows the line - animated by animateWriting() in the deck JS. */
  .p-write-svg { height: 52vh; max-width: 86vw; }
  .p-write-svg .p-guide { stroke: rgba(31,63,42,.18); stroke-width: 1.5; }
  .p-write-svg .p-guide.dash { stroke-dasharray: 6 5; }
  .p-write-svg .p-guide.base { stroke: rgba(31,63,42,.30); stroke-width: 2; }
  .p-write-svg .p-ghost-stroke { fill: none; stroke: rgba(20,17,12,.10); stroke-width: 11;
    stroke-linecap: round; stroke-linejoin: round; }
  .p-write-svg .p-ink-stroke { fill: none; stroke: var(--w-accent); stroke-width: 11;
    stroke-linecap: round; stroke-linejoin: round; }
  .p-pencil { opacity: 0; transition: opacity 160ms ease; }
  .p-pencil circle { fill: #F4A83C; stroke: #8A5A1D; stroke-width: 2.5; }
  .p-pencil path { fill: #F8C97E; stroke: #8A5A1D; stroke-width: 2.5; stroke-linejoin: round; }
  /* The Pals mascot, branding every slide */
  .p-pal-corner { position: absolute; bottom: 3vh; right: 3vw; height: 22vh; pointer-events: none;
    animation: bob 2.6s ease-in-out infinite; filter: drop-shadow(0 8px 14px rgba(0,0,0,.18)); }
  .p-pal-hero { height: 34vh; animation: bob 2.6s ease-in-out infinite; filter: drop-shadow(0 10px 18px rgba(0,0,0,.2)); }
  @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-1.4vh); } }
  #start { position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2vh; z-index: 10;
    background: radial-gradient(80vw 60vh at 50% 0%, color-mix(in srgb, var(--w-accent) 22%, #fff), transparent 70%), linear-gradient(180deg, #FFFDF7, var(--w-soft)); }
  #start button { font: inherit; font-weight: 600; font-size: 4.4vh; background: var(--w-accent); color: #fff; border: 0; border-radius: 999px; padding: 2.2vh 6vw; cursor: pointer; box-shadow: 0 10px 0 var(--w-deep); }
  #start button:active { transform: translateY(5px); box-shadow: 0 5px 0 var(--w-deep); }
  #start p { color: #9a8a76; font-size: 2.4vh; }
  #nav { position: fixed; bottom: 2vh; left: 0; right: 0; display: none; align-items: center; justify-content: center; gap: 3vw; z-index: 9; }
  /* Projector-friendly hit areas: never below 56px even on small windows. */
  #nav button { font-size: 5vh; background: #fff; color: var(--w-deep); border: 3px solid var(--w-accent); border-radius: 16px;
    width: max(8vh, 56px); height: max(8vh, 56px); cursor: pointer; }
  #counter { color: #9a8a76; font-size: 2.6vh; min-width: 8ch; }
  @media (prefers-reduced-motion: reduce) {
    .slide.active, .p-letter, .p-pal-corner, .p-pal-hero { animation: none; }
  }
`;

const DECK_JS = `
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var idx = 0, started = false;
  function playAudio(src){ if(!src) return; try { var a = new Audio(src); a.play().catch(function(){}); } catch(e){} }
  var writeRaf = 0;
  function animateWriting(slideEl){
    cancelAnimationFrame(writeRaf);
    var svg = slideEl && slideEl.querySelector('.p-write-svg'); if(!svg) return;
    var pencil = svg.querySelector('[data-pencil]');
    // NOTE: the writing demo is TEACHING CONTENT (like a video), so it plays
    // even when the OS asks for reduced motion - only decorative motion obeys.
    var paths = Array.prototype.slice.call(svg.querySelectorAll('[data-write-stroke]'));
    var plan = paths.map(function(p){
      var L = Math.max(p.getTotalLength(), 0.6);
      p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
      return { p: p, L: L, d: Math.max(300, L / 130 * 1000) };
    });
    if (!plan.length) return;
    var i = 0, start = 0, pause = 0;
    function step(now){
      var it = plan[i];
      if (!it) { if (pencil) pencil.style.opacity = 0; return; }
      if (pause && now < pause) { writeRaf = requestAnimationFrame(step); return; }
      if (pause) { pause = 0; start = 0; }
      if (!start) start = now;
      var t = Math.min(1, (now - start) / it.d), e = t * (2 - t);
      it.p.style.strokeDashoffset = it.L * (1 - e);
      if (pencil) {
        var pt = it.p.getPointAtLength(it.L * e);
        var off = Number(it.p.getAttribute('data-offset') || 0);
        pencil.setAttribute('transform', 'translate(' + (pt.x + off) + ',' + pt.y + ')');
        pencil.style.opacity = 1;
      }
      if (t >= 1) { i += 1; pause = now + 260; }
      writeRaf = requestAnimationFrame(step);
    }
    writeRaf = requestAnimationFrame(step);
  }
  function show(i){
    idx = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach(function(s, n){ s.classList.toggle('active', n === idx); });
    document.getElementById('counter').textContent = (idx+1) + ' / ' + slides.length;
    var s = slides[idx];
    animateWriting(s);
    if (started && s.getAttribute('data-audio')) playAudio(s.getAttribute('data-audio'));
  }
  function go(d){ show(idx + d); }
  document.addEventListener('keydown', function(e){
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
    else if (e.key === 'f' || e.key === 'F') { toggleFs(); }
  });
  document.getElementById('next').addEventListener('click', function(){ go(1); });
  document.getElementById('prev').addEventListener('click', function(){ go(-1); });
  document.addEventListener('click', function(e){
    var btn = e.target.closest('[data-play]'); if (btn) { playAudio(btn.getAttribute('data-play')); return; }
    if (e.target.closest('[data-replay]')) { animateWriting(slides[idx]); return; }
  });
  function toggleFs(){ try { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); } catch(e){} }
  document.getElementById('startBtn').addEventListener('click', function(){
    started = true; document.getElementById('start').style.display = 'none';
    document.getElementById('nav').style.display = 'flex'; toggleFs(); show(0);
  });
  show(0);
`;
