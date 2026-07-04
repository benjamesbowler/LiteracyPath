// Whole-class "Present" mode: builds a self-contained, fullscreen teaching deck
// for one cycle, opened in a new window for the projector. Deterministic (same
// cycle => same deck). Uses existing gold-voice audio and picture-word images;
// letter-sound video/song links are an optional future add (see notes in code).
import { elSkillsBlockCycles, LETTER_EXAMPLES } from "../../data/elSkillsBlockCycles.js";
import { EL_CYCLE_POEMS } from "../../data/elCyclePoems.js";
import { AUDIO_FILE_PATHS } from "../../data/generated/audioFilePaths.generated.js";
import { graphemeAudioPath, wordAudioPath } from "../../components/elQuest/elQuestEngine.js";
import { getChildWordAsset } from "../../data/childAssets.js";
import { themeWorldForCycle } from "../../utils/palWorlds.js";
import { LETTER_STROKES, LETTER_GUIDES } from "../../data/letterStrokes.js";

function isFluencyCycle(cycle) {
  return (cycle?.cycleNumber || 0) >= 25;
}

// The Pals mascot for the current deck's world (set per build). Used to brand
// every slide with the right world character + palette. Rotates every 3 cycles.
let CURRENT_WORLD = themeWorldForCycle(1);
function palImg(pose, cls = "") {
  return `<img class="p-pal ${cls}" src="/images/pals/poses/${CURRENT_WORLD.id}-${pose}.webp" alt="" onerror="this.style.display='none'"/>`;
}
function wordImage(word) {
  const asset = getChildWordAsset(word) || {};
  return asset.image || "";
}

export function presentationCycleOptions() {
  return elSkillsBlockCycles
    .filter(c => c.cycleNumber)
    .map(c => ({ id: c.id, cycleNumber: c.cycleNumber, title: c.title }));
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

// Deterministic per-cycle slice so consecutive cycles that share a skill see
// DIFFERENT examples (cycle 1 gets items 0-1, cycle 2 gets 2-3, ...).
function pickPer(list, cycleNumber, count = 2) {
  const start = ((cycleNumber - 1) * count) % list.length;
  return Array.from({ length: count }, (_u, i) => list[(start + i) % list.length]);
}

function esc(value) {
  return String(value).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

function focusCards(cycle) {
  const cards = (cycle.focusLetters || []).length ? cycle.focusLetters : cycle.reviewLetters || [];
  return cards
    .map(card => ({ grapheme: card.grapheme || card.spelling, sound: card.sound || "", spelling: (card.spelling || "").toLowerCase() }))
    .filter(card => /^[a-z]{1,2}$/.test(card.spelling));
}

function exampleWords(spelling, limit = 3) {
  return (LETTER_EXAMPLES[spelling] || []).filter(w => /^[a-z]{2,6}$/.test(w)).slice(0, limit);
}

// ── Slide builders (each returns one .slide section) ─────────────────────────
function slide(inner, opts = {}) {
  const data = [
    opts.audio ? `data-audio="${esc(opts.audio)}"` : "",
    opts.stroke ? `data-stroke="${esc(opts.stroke)}"` : ""
  ].join(" ");
  const char = opts.char ? palImg(opts.char, "p-pal-corner") : "";
  return `<section class="slide ${opts.cls || ""}" ${data}>${inner}${char}</section>`;
}

function audioButton(src, label = "Play sound") {
  if (!src) return "";
  return `<button class="p-audio" data-play="${esc(src)}" type="button">🔊 ${esc(label)}</button>`;
}

function cycleHeading(cycle) {
  const letters = (cycle.focusLetters || []).map(c => c.grapheme).filter(Boolean);
  // Long lists ("ng and ang and ing and...") read badly - fall back to title.
  if (!isFluencyCycle(cycle) && letters.length && letters.length <= 3) return letters.join(" and ");
  if (cycle.title && cycle.title !== `Cycle ${cycle.cycleNumber}`) {
    return cycle.title.replace(/^Cycle \d+:\s*/, "");
  }
  if (!isFluencyCycle(cycle) && letters.length) return `${letters[0]} families`;
  return String(cycle.phase || "Review time").replace(/-/g, " ");
}

function titleSlide(cycle) {
  const phase = String(cycle.phase || "").replace(/-/g, " ");
  return slide(`
    ${palImg("celebrate", "p-pal-hero")}
    <p class="p-kicker">Cycle ${esc(cycle.cycleNumber)} · ${esc(CURRENT_WORLD.name)}</p>
    <h1 class="p-title">${esc(cycleHeading(cycle))}</h1>
    <p class="p-phase">${esc(phase)}</p>
    <p class="p-hint">Press → or click to begin</p>`, { cls: "p-cover" });
}

function letterSoundSlide(card, cycle) {
  const big = card.spelling.length === 1 ? `${card.spelling.toUpperCase()}${card.spelling}` : card.spelling;
  const phoneme = graphemeAudioPath(card.spelling);
  // The curriculum ships a real articulation tip per letter - teach with it.
  const detail = (cycle?.sections?.letterLearning?.cards || [])
    .find(c => (c.spelling || "").toLowerCase() === card.spelling) || {};
  const tip = detail.articulation || "";
  // Only show example words that actually have a picture - no empty boxes.
  const words = exampleWords(card.spelling, 6).filter(w => wordImage(w)).slice(0, 3);
  const pics = words.map(word => `<button class="p-word" data-play="${esc(wordAudioPath(word))}" type="button">
      <img src="${esc(wordImage(word))}" alt="${esc(word)}" onerror="this.closest('.p-word').style.display='none'"/>
      <span>${esc(word)}</span></button>`).join("");
  return slide(`
    <p class="p-kicker">Our sound</p>
    <div class="p-letter">${esc(big)}</div>
    <p class="p-says">This says <b>${esc(card.sound || "/" + card.spelling + "/")}</b></p>
    ${tip ? `<p class="p-tip">💡 ${esc(tip)}</p>` : ""}
    ${audioButton(phoneme, "Hear the sound")}
    <div class="p-words">${pics}</div>`, { cls: "p-letter-slide", audio: phoneme, char: "wave" });
}

// Real stroke-by-stroke writing demo: each stroke draws itself in pedagogic
// order while a pencil tip follows the line (data from letterStrokes.js).
function writingSvg(text) {
  const chars = String(text).split("").filter(ch => LETTER_STROKES[ch]);
  if (!chars.length) return "";
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

function writingSlide(card) {
  const big = card.spelling.length === 1 ? `${card.spelling.toUpperCase()}${card.spelling}` : card.spelling;
  return slide(`
    <p class="p-kicker">Let's write it</p>
    ${writingSvg(big)}
    <button class="p-audio" type="button" data-replay>✏️ Watch again</button>
    <p class="p-hint">Now you write it in the air!</p>`, { cls: "p-writing", stroke: "1", char: "think" });
}

function sightWordSlide(word) {
  return slide(`
    <p class="p-kicker">Tricky word</p>
    <div class="p-sight">${esc(word)}</div>
    ${audioButton(wordAudioPath(word), "Read it")}
    <p class="p-sentence">Find it, say it, spell it: <b>${esc(word.split("").join(" "))}</b></p>`,
  { cls: "p-sight-slide", audio: wordAudioPath(word), char: "read" });
}

// ── Phonemic-awareness slides, one builder per curriculum skill ──────────────
function deleteSlide({ kicker, whole, wholeAudio, removed, left, leftAudio }) {
  return slide(`
    <p class="p-kicker">${esc(kicker)}</p>
    <div class="p-take">
      <span class="p-big-word" data-play="${esc(wholeAudio || "")}">${esc(whole)}</span>
      <span class="p-arrow">→</span>
      <span class="p-big-word made" data-play="${esc(leftAudio || "")}">${esc(left)}</span>
    </div>
    <p class="p-says">Say <b>${esc(whole)}</b>. Now say it without <b>${esc(removed)}</b>. What is left?</p>`,
  { cls: "p-phoneme", char: "wave" });
}

function compoundDeleteSlides(cycleNumber, part) {
  return pickPer(COMPOUND_BANK, cycleNumber, 2).map(([a, b]) => {
    const whole = a + b;
    const removed = part === "first" ? a : b;
    const left = part === "first" ? b : a;
    return deleteSlide({
      kicker: part === "first" ? "Take the first word away" : "Take the last word away",
      whole, wholeAudio: wordAudioPath(whole), removed, left, leftAudio: wordAudioPath(left)
    });
  });
}

function syllableDeleteSlides(cycleNumber, bank, part) {
  return pickPer(bank, cycleNumber, 2).map(item => deleteSlide({
    kicker: part === "first" ? "Take the first part away" : "Take the last part away",
    whole: item.word,
    wholeAudio: wordAudioPath(item.word),
    removed: part === "first" ? (item.first || "") : (item.last || item.rest || ""),
    left: part === "first" ? (item.rest || item.last || "") : (item.first || ""),
    leftAudio: wordAudioPath(part === "first" ? (item.rest || item.last || "") : (item.first || ""))
  }));
}

function onsetDeleteSlides(cycleNumber) {
  return pickPer(ONSET_BANK, cycleNumber, 2).map(item => deleteSlide({
    kicker: "Take the first sound away",
    whole: item.word, wholeAudio: wordAudioPath(item.word),
    removed: `/${item.word[0]}/`, left: item.left, leftAudio: wordAudioPath(item.left)
  }));
}

function rimeDeleteSlides(cycleNumber) {
  return pickPer(RIME_DELETE_BANK, cycleNumber, 2).map(item => deleteSlide({
    kicker: "Keep only the first sound",
    whole: item.word, wholeAudio: wordAudioPath(item.word),
    removed: `-${item.word.slice(1)}`, left: item.left, leftAudio: ""
  }));
}

function changeFirstSlides(cycleNumber) {
  return pickPer(CHANGE_FIRST_BANK, cycleNumber, 2).map(item => {
    const made = item.made.map(w => `<button class="p-chip" data-play="${esc(wordAudioPath(w))}" type="button">${esc(w)}</button>`).join("");
    return slide(`
      <p class="p-kicker">Change the first sound</p>
      <div class="p-big-word" data-play="${esc(wordAudioPath(item.base))}">${esc(item.base)}</div>
      <p class="p-says">Change the first sound of <b>${esc(item.base)}</b> to make new words:</p>
      <div class="p-chips">${made}</div>`, { cls: "p-phoneme", char: "wave" });
  });
}

function changeRimeSlides(cycleNumber) {
  return pickPer(CHANGE_RIME_BANK, cycleNumber, 2).map(item => {
    const made = item.made.map(w => `<button class="p-chip" data-play="${esc(wordAudioPath(w))}" type="button">${esc(w)}</button>`).join("");
    return slide(`
      <p class="p-kicker">Keep the first sound, change the ending</p>
      <div class="p-big-word" data-play="${esc(wordAudioPath(item.base))}">${esc(item.base)}</div>
      <p class="p-says">Keep <b>/${esc(item.onset)}/</b> and change the ending of <b>${esc(item.base)}</b>:</p>
      <div class="p-chips">${made}</div>`, { cls: "p-phoneme", char: "wave" });
  });
}

function rhymeIdentifySlides(cycleNumber) {
  return pickPer(RHYME_PAIRS_BANK, cycleNumber, 2).map(item => {
    const chips = [item.a, item.b, item.odd].map(w =>
      `<button class="p-chip" data-play="${esc(wordAudioPath(w))}" type="button">${esc(w)}</button>`).join("");
    return slide(`
      <p class="p-kicker">Rhyme time</p>
      <p class="p-says">Which two words rhyme? Which one does not?</p>
      <div class="p-chips big">${chips}</div>`, { cls: "p-phoneme", char: "read" });
  });
}

function rhymeProduceSlides(cycleNumber) {
  return pickPer(RHYME_PRODUCE_BANK, cycleNumber, 2).map(item => {
    const made = item.rhymes.map(w => `<button class="p-chip" data-play="${esc(wordAudioPath(w))}" type="button">${esc(w)}</button>`).join("");
    return slide(`
      <p class="p-kicker">Make a rhyme</p>
      <div class="p-big-word" data-play="${esc(wordAudioPath(item.base))}">${esc(item.base)}</div>
      <p class="p-says">What rhymes with <b>${esc(item.base)}</b>? Say your own, then check ours:</p>
      <div class="p-chips">${made}</div>`, { cls: "p-phoneme", char: "wave" });
  });
}

// Route each curriculum phonemicAwareness line to the matching slide builder.
function phonemicAwarenessSlides(cycle) {
  const n = cycle.cycleNumber || 1;
  const slides = [];
  for (const skill of cycle.phonemicAwareness || []) {
    const s = String(skill).toLowerCase();
    // Three-syllable rules must be tested BEFORE the generic compound rules:
    // "Delete first syllable in three-syllable compound words" contains both.
    if (s.includes("three-syllable") && s.includes("first")) slides.push(...syllableDeleteSlides(n, THREE_SYLLABLE_BANK, "first"));
    else if (s.includes("three-syllable") && s.includes("last")) slides.push(...syllableDeleteSlides(n, THREE_SYLLABLE_BANK, "last"));
    else if (s.includes("compound") && s.includes("first")) slides.push(...compoundDeleteSlides(n, "first"));
    else if (s.includes("compound") && s.includes("last")) slides.push(...compoundDeleteSlides(n, "last"));
    else if (s.includes("two-syllable") && s.includes("first")) slides.push(...syllableDeleteSlides(n, TWO_SYLLABLE_BANK, "first"));
    else if (s.includes("two-syllable") && s.includes("last")) slides.push(...syllableDeleteSlides(n, TWO_SYLLABLE_BANK, "last"));
    else if (s.includes("two-syllable")) slides.push(...syllableDeleteSlides(n, TWO_SYLLABLE_BANK, "first"), ...syllableDeleteSlides(n + 1, TWO_SYLLABLE_BANK, "last"));
    else if (s.includes("delete onset")) slides.push(...onsetDeleteSlides(n));
    else if (s.includes("delete rime")) slides.push(...rimeDeleteSlides(n));
    else if (s.includes("combine deletion")) slides.push(...onsetDeleteSlides(n), ...rimeDeleteSlides(n));
    else if (s.includes("review deletion")) slides.push(...compoundDeleteSlides(n, "last"), ...syllableDeleteSlides(n, THREE_SYLLABLE_BANK, "first"));
    else if (s.includes("substitute initial")) slides.push(...changeFirstSlides(n));
    else if (s.includes("substitute rime")) slides.push(...changeRimeSlides(n));
    else if (s.includes("review substitution")) slides.push(...changeFirstSlides(n), ...changeRimeSlides(n + 1));
    else if (s.includes("rhyme production")) slides.push(...rhymeProduceSlides(n));
    else if (s.includes("rhym") && s.includes("review")) slides.push(...rhymeIdentifySlides(n), ...rhymeProduceSlides(n));
    else if (s.includes("rhym")) slides.push(...rhymeIdentifySlides(n));
  }
  // Never more than 4 PA slides: keep the deck brisk.
  return slides.slice(0, 4);
}

function goalsSlide(cycle) {
  const goals = cycle.sections?.overview?.goals || [];
  const childGoal = goals.find(g => /^i can/i.test(g)) || cycle.childFriendlyGoal || "";
  if (!childGoal) return "";
  return slide(`
    <p class="p-kicker">Today we learn</p>
    <h2 class="p-goal">${esc(childGoal)}</h2>
    <p class="p-hint">Say it together!</p>`, { cls: "p-goal-slide", char: "point" });
}

function poemSlide(cycle) {
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
  return slide(`
    <p class="p-kicker">Our poem</p>
    <h2 class="p-poem-title">${esc(poem.title)}</h2>
    ${audioButton(audio, "Listen to the poem")}
    <div class="p-poem-wrap">
      <img class="p-poem-hero" src="${esc(poemImg)}" alt="" onerror="this.style.display='none'"/>
      <div class="p-poem">${esc(poem.lines.join("\n"))}</div>
    </div>
    <div class="p-poem-pics">${pics}</div>`, { cls: "p-poem-slide", audio, char: "read" });
}

function patternSlide(cycle) {
  // Each fluency cycle drills the pattern its OWN sight words follow
  // (25: -ay like "day/say"; 26: -y like "by/my/why/try"; 27: review).
  const sort = CYCLE_PATTERN_SORTS[cycle.cycleNumber] || CYCLE_PATTERN_SORTS[27];
  const chips = sort.words.map(w => `<button class="p-chip" data-play="${esc(wordAudioPath(w))}" type="button">${esc(w)}</button>`).join("");
  return slide(`
    <p class="p-kicker">Pattern power</p>
    <h2 class="p-says">Read the words that <b>${esc(sort.label)}</b></h2>
    <div class="p-chips big">${chips}</div>`, { cls: "p-phoneme", char: "wave" });
}

function chainSlide(cycle) {
  const chain = CYCLE_CHAINS[cycle.cycleNumber] || CYCLE_CHAINS[27];
  const chips = chain.map((w, i) => `${i ? '<span class="p-arrow">→</span>' : ""}<button class="p-chip big" data-play="${esc(wordAudioPath(w))}" type="button">${esc(w)}</button>`).join("");
  return slide(`
    <p class="p-kicker">Word chain</p>
    <h2 class="p-says">Change one letter each time</h2>
    <div class="p-compound">${chips}</div>`, { cls: "p-phoneme", char: "wave" });
}

function endSlide() {
  return slide(`${palImg("celebrate", "p-pal-hero")}
    <div class="p-stars">★ ★ ★</div><h1 class="p-title">Great learning!</h1>
    <p class="p-hint">Press Esc to leave full screen</p>`, { cls: "p-cover" });
}

// ── Deck assembly ────────────────────────────────────────────────────────────
export function buildCyclePresentation(cycleId) {
  const cycle = getPresentationCycle(cycleId);
  if (!cycle) throw new Error("Unknown cycle");
  CURRENT_WORLD = themeWorldForCycle(cycle.cycleNumber);

  const slides = [titleSlide(cycle)];
  const goal = goalsSlide(cycle);
  if (goal) slides.push(goal);
  const cards = focusCards(cycle);
  if (!isFluencyCycle(cycle)) {
    cards.forEach(card => { slides.push(letterSoundSlide(card, cycle)); slides.push(writingSlide(card)); });
  }
  (cycle.highFrequencyWords || []).slice(0, 4).forEach(word => slides.push(sightWordSlide(String(word).toLowerCase())));
  // Teach the cycle's ACTUAL phonemic-awareness skills (not generic warm-ups).
  slides.push(...phonemicAwarenessSlides(cycle));
  if (isFluencyCycle(cycle)) { slides.push(patternSlide(cycle)); slides.push(chainSlide(cycle)); }
  const poem = poemSlide(cycle);
  if (poem) slides.push(poem);
  slides.push(endSlide());

  const title = `Cycle ${cycle.cycleNumber} - ${cycleHeading(cycle)}`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Andika:wght@400;700&family=Fredoka:wght@400;500;600&display=swap" rel="stylesheet">
<style>${DECK_CSS}</style></head>
<body>
<div id="deck" style="--w-accent:${CURRENT_WORLD.accent};--w-soft:${CURRENT_WORLD.accentSoft};--w-deep:${CURRENT_WORLD.deep}">${slides.join("")}</div>
<div id="start"><button id="startBtn" type="button">▶ Start presentation</button><p>Best on a projector. Use → ← to move, F for full screen.</p></div>
<div id="nav"><button id="prev" type="button" aria-label="Previous">‹</button><span id="counter"></span><button id="next" type="button" aria-label="Next">›</button></div>
<script>${DECK_JS}</script>
</body></html>`;
  return { title, slideCount: slides.length, html };
}

export function openCyclePresentation(cycleId) {
  const { html, title } = buildCyclePresentation(cycleId);
  const win = window.open("", "lp-present", "width=1280,height=800");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.document.title = title;
  return true;
}

const DECK_CSS = `
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; overflow: hidden;
    color: #2b2118; font-family: 'Fredoka','Andika','Comic Sans MS',sans-serif;
    background:
      radial-gradient(80vw 60vh at 50% -10%, color-mix(in srgb, var(--w-accent) 22%, #fff), transparent 70%),
      linear-gradient(180deg, #FFFDF7 0%, var(--w-soft) 100%); }
  #deck { height: 100vh; }
  .slide { position: absolute; inset: 0; display: none; flex-direction: column;
    align-items: center; justify-content: center; gap: 2.2vh; text-align: center; padding: 6vh 6vw; }
  .slide.active { display: flex; animation: pop .5s cubic-bezier(.2,1.3,.4,1) both; }
  @keyframes pop { from { opacity: 0; transform: translateY(14px) scale(.97); } to { opacity: 1; transform: none; } }
  .p-kicker { margin: 0; text-transform: uppercase; letter-spacing: .14em; font-weight: 600;
    color: var(--w-deep); font-size: 2.4vh; }
  .p-title { font-family: 'Fredoka',sans-serif; font-weight: 600; font-size: 9vh; margin: 0; color: var(--w-deep);
    text-transform: capitalize; }
  .p-phase { font-size: 3vh; color: #6b5a48; text-transform: capitalize; }
  .p-hint { color: #9a8a76; font-size: 2.4vh; }
  .p-letter { font-family: 'Andika',sans-serif; font-size: 34vh; line-height: .95; font-weight: 700; color: var(--w-accent);
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
  .p-sight { font-family: 'Fredoka',sans-serif; font-size: 24vh; font-weight: 600; color: var(--w-accent); line-height: 1;
    text-shadow: 0 6px 0 color-mix(in srgb, var(--w-accent) 28%, #fff); }
  .p-sentence { font-size: 3.6vh; }
  .p-big-word { font-family: 'Fredoka',sans-serif; font-size: 17vh; font-weight: 600; color: var(--w-accent); background: none; border: 0; }
  .p-big-word.made { color: #E0991C; }
  .p-take, .p-compound { display: flex; align-items: center; gap: 2.5vw; flex-wrap: wrap; justify-content: center; }
  .p-arrow { font-size: 9vh; color: #E0991C; }
  .p-chips { display: flex; gap: 2vw; flex-wrap: wrap; justify-content: center; margin-top: 1vh; }
  .p-chip { background: #fff; color: var(--w-deep); border: 3px solid var(--w-accent); border-radius: 18px;
    padding: 1.4vh 3vw; font: inherit; font-weight: 600; font-size: 5vh; box-shadow: 0 6px 0 color-mix(in srgb, var(--w-accent) 30%, #fff); }
  .p-chip.big, .p-chips.big .p-chip { font-size: 7vh; }
  .p-stars { font-size: 14vh; color: #E0991C; letter-spacing: 1vh; }
  .p-goal { font-family: 'Fredoka',sans-serif; font-weight: 600; font-size: 6.4vh; margin: 0; color: var(--w-deep);
    max-width: 70vw; line-height: 1.3; }
  .p-tip { font-size: 3vh; color: #6b5a48; max-width: 60vw; margin: 0; }
  .p-poem-title { font-family: 'Fredoka',sans-serif; font-weight: 600; font-size: 5.4vh; margin: 0; color: var(--w-deep); }
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
  #nav button { font-size: 5vh; background: #fff; color: var(--w-deep); border: 3px solid var(--w-accent); border-radius: 16px; width: 8vh; height: 8vh; cursor: pointer; }
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
