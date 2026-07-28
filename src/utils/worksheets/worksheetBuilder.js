// Deterministic worksheet generator for the EL Skills Block cycles.
//
// Pure + deterministic: the SAME (cycleId, type, pages) recipe always produces
// the SAME worksheet, so a saved recipe in the bank re-downloads identically.
// Output is a self-contained printable HTML document (browser "Save as PDF").
//
// Every exercise is built from THE CYCLE'S OWN content - its focus letters,
// its example words, its sight words, its poem and its spelling patterns - and
// only ever tests against material taught by that point in the curriculum,
// so no two cycles print the same worksheet.
import { elSkillsBlockCycles, LETTER_EXAMPLES } from "../../data/elSkillsBlockCycles.js";
import { cycleOptionLabel } from "../cycleTitles.js";
import { EL_CYCLE_POEMS } from "../../data/elCyclePoems.js";
import { getChildWordAsset } from "../../data/childAssets.js";
import { openHtmlDocument } from "../openHtmlDocument.js";

export const WORKSHEET_TYPES = [
  { id: "letterFormation", label: "Letter formation", blurb: "Trace and write the cycle's focus letters, then hunt for them." },
  { id: "wordBuilding", label: "Word building", blurb: "Read, complete and build words made from the cycle's sounds." },
  { id: "sightWords", label: "Sight words", blurb: "Trace, find and use the cycle's tricky words in real sentences." },
  { id: "patternFluency", label: "Pattern & fluency", blurb: "Sort this cycle's spelling patterns, chain words and read the poem (cycles 25-27)." }
];

function isFluencyCycle(cycle) {
  return (cycle?.cycleNumber || 0) >= 25;
}

// Which worksheet types make sense for a given cycle.
export function availableWorksheetTypes(cycle) {
  if (!cycle) return [];
  const ids = [];
  const hasRealLetters = !isFluencyCycle(cycle) && focusCards(cycle).length > 0;
  if (hasRealLetters) ids.push("letterFormation", "wordBuilding");
  if ((cycle.highFrequencyWords || []).length > 0) ids.push("sightWords");
  if (isFluencyCycle(cycle)) ids.push("patternFluency");
  return WORKSHEET_TYPES.filter(t => ids.includes(t.id)).map(t => t.id);
}

export function getWorksheetCycle(cycleId) {
  return elSkillsBlockCycles.find(c => c.id === cycleId) || null;
}

// Cycles a teacher can pick from (numbered cycles only). Each option carries
// its own finished label so the picker never has to re-derive one.
export function worksheetCycleOptions() {
  return elSkillsBlockCycles
    .filter(c => c.cycleNumber)
    .map(c => ({
      id: c.id,
      cycleNumber: c.cycleNumber,
      title: c.title,
      label: cycleOptionLabel(c)
    }));
}

// Every cycle picker in the app names what the cycle covers ("Cycle 2 · Tt and
// Ss"), never a bare "Cycle 2" - most cycle titles in the curriculum data carry
// no topic, so the topic is derived from the cycle's own focus letters.
// Callers may pass a picker option or a whole cycle record; when the caller
// only has the option shape, the full record is looked up for its letters.
export function worksheetCycleLabel(cycle = {}) {
  if (cycle.label) return cycle.label;
  const full = (cycle.focusLetters || cycle.reviewLetters)
    ? cycle
    : (cycle.id ? getWorksheetCycle(cycle.id) : null) || cycle;
  return cycleOptionLabel(full);
}

// ── Curriculum-aware content selectors (all deterministic) ───────────────────
const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const CVC_POOL = [
  "cat", "map", "bag", "tap", "ham", "van", "mat", "sat", "pan", "fan",
  "bed", "ten", "net", "peg", "hen", "wet", "pet", "leg", "red", "men",
  "pig", "sit", "lip", "fin", "win", "dig", "pin", "bin", "hit", "zip",
  "dog", "hop", "pot", "mop", "log", "cot", "top", "pop", "fog", "box",
  "sun", "bug", "cup", "mud", "run", "hut", "bus", "nut", "rug", "jug"
];

function focusCards(cycle) {
  const cards = (cycle.focusLetters || []).length ? cycle.focusLetters : cycle.reviewLetters || [];
  return cards
    .map(card => ({
      grapheme: card.grapheme || card.spelling,
      sound: card.sound || "",
      spelling: (card.spelling || "").toLowerCase()
    }))
    .filter(card => /^[a-z]{1,2}$/.test(card.spelling));
}

// Single letters the child has been TAUGHT by the end of this cycle. Hunts and
// distractors never use letters the class has not met yet.
function taughtLettersThrough(cycleNumber) {
  const taught = [];
  for (const cycle of elSkillsBlockCycles) {
    if (!cycle.cycleNumber || cycle.cycleNumber > cycleNumber) continue;
    for (const item of cycle.focusLetters || []) {
      const spelling = (item.spelling || "").toLowerCase();
      if (/^[a-z]$/.test(spelling) && !taught.includes(spelling)) taught.push(spelling);
    }
  }
  return taught;
}

// Words made only of taught letters, preferring words that USE a focus letter.
function cycleWords(cycle) {
  const cards = focusCards(cycle);
  const taught = new Set(taughtLettersThrough(cycle.cycleNumber || 1));
  const usesTaught = word => word.split("").every(ch => taught.has(ch));
  const fromExamples = cards
    .flatMap(card => LETTER_EXAMPLES[card.spelling] || [])
    .filter(word => /^[a-z]{2,5}$/.test(word));
  const seen = [];
  // 1) Focus-letter example words fully decodable with taught letters.
  for (const word of fromExamples) if (usesTaught(word) && !seen.includes(word)) seen.push(word);
  // 2) CVC words that use a focus letter and only taught letters.
  const focusSet = new Set(cards.map(c => c.spelling));
  for (const word of CVC_POOL) {
    if (seen.length >= 10) break;
    if (usesTaught(word) && word.split("").some(ch => focusSet.has(ch)) && !seen.includes(word)) seen.push(word);
  }
  // 3) Otherwise any focus example words, then any taught-letter CVC words.
  for (const word of fromExamples) if (seen.length < 8 && !seen.includes(word)) seen.push(word);
  for (const word of CVC_POOL) if (seen.length < 8 && usesTaught(word) && !seen.includes(word)) seen.push(word);
  return seen;
}

function sightWords(cycle) {
  const own = [];
  for (const w of cycle.highFrequencyWords || []) {
    const clean = String(w).toLowerCase();
    if (clean && !own.includes(clean)) own.push(clean);
  }
  return own;
}

// "I" is always written as a capital - never teach children to trace "i".
function displayWord(word) {
  return word === "i" ? "I" : word;
}

// Sight words from EARLIER cycles only - used as hunt-grid distractors.
function earlierSightWords(cycle) {
  const words = [];
  for (const other of elSkillsBlockCycles) {
    if (!other.cycleNumber || other.cycleNumber >= (cycle.cycleNumber || 1)) continue;
    for (const w of other.highFrequencyWords || []) {
      const clean = String(w).toLowerCase();
      if (clean && !words.includes(clean)) words.push(clean);
    }
  }
  return words;
}

// One real cloze sentence per sight word in the curriculum (K-level language).
const HFW_SENTENCES = {
  am: "I ___ six.",
  i: "___ can hop and run.",
  a: "I see ___ fat cat.",
  the: "___ dog is big.",
  an: "I see ___ ant on the log.",
  and: "Mum ___ I hop.",
  is: "The cat ___ on the mat.",
  of: "I see a lot ___ ants.",
  go: "We ___ to the park.",
  no: "\"___, not yet!\" said Mum.",
  so: "I am ___ happy.",
  do: "We ___ our best.",
  my: "This is ___ red hat.",
  to: "We run ___ the bus.",
  into: "The frog hops ___ the pond.",
  said: "\"Hop in!\" ___ Dad.",
  not: "The cat is ___ big.",
  that: "Look at ___ big dog!",
  he: "___ is my dad.",
  me: "Come and sit with ___.",
  she: "___ is my mum.",
  are: "We ___ at school.",
  as: "Run ___ fast as you can.",
  you: "Can ___ see the sun?",
  see: "I can ___ a little bug.",
  was: "The dog ___ wet.",
  for: "This hat is ___ you.",
  or: "Is it red ___ blue?",
  her: "That is ___ bag.",
  his: "That is ___ cap.",
  this: "___ is my pet hen.",
  with: "I dig ___ my dad.",
  your: "Is this ___ cup?",
  good: "The cake is so ___.",
  look: "___ at the stars!",
  all: "We ___ like to sing.",
  says: "Mum ___ it is bedtime.",
  they: "___ run to the bus.",
  each: "___ pal gets a turn.",
  like: "I ___ to hop and skip.",
  little: "The bug is so ___.",
  from: "This gift is ___ Gran.",
  have: "I ___ a red hat.",
  more: "Can I have some ___?",
  about: "This book is ___ dogs.",
  out: "The sun came ___.",
  put: "___ the cup on the mat.",
  be: "I will ___ six soon.",
  get: "Can you ___ the ball?",
  very: "The hill is ___ big.",
  what: "___ is in the box?",
  when: "___ do we eat?",
  who: "___ is at the door?",
  does: "___ the dog like ham?",
  goes: "The bus ___ up the hill.",
  only: "I have ___ one pet.",
  other: "Where is my ___ sock?",
  off: "The cat got ___ the mat.",
  which: "___ hat do you like?",
  again: "Let's play ___!",
  day: "It is a sunny ___.",
  say: "What did you ___?",
  by: "The cat sat ___ the door.",
  why: "___ is the sky blue?",
  try: "I will ___ my best.",
  first: "I am ___ in line.",
  friend: "You are my best ___.",
  half: "I ate ___ of the plum."
};

// ── Fluency cycle data (25-27): each cycle drills ITS OWN pattern ─────────────
const CYCLE_PATTERNS = {
  25: [
    { label: "end with -ay", yes: ["day", "say", "may", "play", "stay", "way"], no: ["sun", "map", "run", "top"] },
    { label: "end with -ll", yes: ["ball", "fall", "call", "tall", "bell", "fill"], no: ["bat", "mop", "net", "pin"] }
  ],
  26: [
    { label: "end with y", yes: ["by", "my", "why", "try", "fly", "sky"], no: ["bed", "cup", "ten", "log"] },
    { label: "have -ng", yes: ["ring", "king", "song", "bang", "hang", "long"], no: ["rat", "pig", "red", "tap"] }
  ],
  27: [
    { label: "end with -ck", yes: ["duck", "sock", "kick", "lock", "back", "pick"], no: ["dog", "sun", "ten", "fan"] },
    { label: "start with sh", yes: ["ship", "shop", "shed", "shell", "shut", "shin"], no: ["pig", "top", "bed", "map"] }
  ]
};
const CYCLE_CHAINS = {
  25: [["day", "say", "way", "may"], ["man", "mat", "map", "cap"]],
  26: [["my", "by", "be", "he"], ["pig", "pin", "pan", "pat"]],
  27: [["sat", "sit", "sip", "lip"], ["hot", "hop", "top", "tap"]]
};

// Deterministic rotation so each page differs without randomness.
function rotate(list, by) {
  if (!list.length) return list;
  const n = ((by % list.length) + list.length) % list.length;
  return [...list.slice(n), ...list.slice(0, n)];
}

function wordImage(word) {
  const asset = getChildWordAsset(word) || {};
  return asset.image || "";
}

// ── HTML helpers ─────────────────────────────────────────────────────────────
function esc(value) {
  return String(value).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

function pageHeader(cycle, typeLabel) {
  return `<div class="ws-head">
    <div class="ws-name">Name: <span class="ws-line"></span> &nbsp; Date: <span class="ws-line short"></span></div>
    <div class="ws-meta"><strong>Cycle ${esc(cycle.cycleNumber)}</strong> · ${esc(cycle.title)} <span class="ws-type">${esc(typeLabel)}</span></div>
  </div>`;
}

function traceLines(count = 2) {
  return `<div class="ws-write">${Array.from({ length: count }, () => '<div class="ws-rule"></div>').join("")}</div>`;
}

// Letter hunt: 24 letters where the target is GUARANTEED to appear exactly six
// times among letters the class has already been taught.
function letterHunt(cycle, target, page) {
  const taught = taughtLettersThrough(cycle.cycleNumber || 1).filter(l => l !== target);
  const fillers = taught.length >= 3 ? taught : [...taught, "a", "m", "t", "s"].filter(l => l !== target);
  const cells = [];
  for (let i = 0; i < 24; i += 1) {
    // Deterministic scatter: target lands on 6 pseudo-scattered positions.
    const isTarget = (i * 5 + page * 3) % 4 === 1;
    cells.push(isTarget ? target : fillers[(i + page) % fillers.length]);
  }
  // Guarantee exactly six targets even if the scatter formula drifts.
  let count = cells.filter(c => c === target).length;
  for (let i = 0; count < 6 && i < 24; i += 1) {
    if (cells[i] !== target) { cells[i] = target; count += 1; }
  }
  for (let i = 23; count > 6 && i >= 0; i -= 1) {
    if (cells[i] === target) { cells[i] = fillers[i % fillers.length]; count -= 1; }
  }
  return cells;
}

// Picture row: circle the pictures that start with the focus sound.
function startSoundPictures(cycle, card, page) {
  const targets = rotate((LETTER_EXAMPLES[card.spelling] || []).filter(w => wordImage(w)), page).slice(0, 2);
  if (!targets.length) return "";
  const taught = taughtLettersThrough(cycle.cycleNumber || 1).filter(l => l !== card.spelling);
  const decoys = [];
  for (const letter of rotate(taught, page + 1)) {
    if (decoys.length >= 2) break;
    const candidate = (LETTER_EXAMPLES[letter] || []).find(w => wordImage(w) && !targets.includes(w));
    if (candidate) decoys.push(candidate);
  }
  if (decoys.length < 2) return "";
  const items = rotate([...targets, ...decoys], page).map(word =>
    `<span class="ws-pic"><img src="${esc(wordImage(word))}" alt="${esc(word)}"/></span>`).join("");
  return `<div class="ws-block">
      <div class="ws-block-title small">Circle the pictures that start with <b>${esc(card.grapheme)}</b> ${esc(card.sound || "")}</div>
      <div class="ws-pics">${items}</div>
    </div>`;
}

function letterFormationPage(cycle, page) {
  const cards = rotate(focusCards(cycle), page);
  const rows = cards.slice(0, 2).map(card => {
    const big = card.spelling.length === 1 ? `${card.spelling.toUpperCase()}${card.spelling}` : card.grapheme;
    const trace = Array.from({ length: 4 }, () => `<span class="ws-trace">${esc(big)}</span>`).join("");
    return `<div class="ws-block">
      <div class="ws-block-title">${esc(big)} <span class="ws-sound">${esc(card.sound || "")}</span></div>
      <div class="ws-trace-row">${trace}</div>
      ${traceLines(2)}
    </div>`;
  }).join("");
  const target = cards[0]?.spelling || "a";
  const hunt = letterHunt(cycle, target, page);
  const huntHtml = hunt.map(l => `<span>${esc(page % 2 === 0 ? l.toUpperCase() : l)}</span>`).join("");
  return `${rows}
    <div class="ws-block">
      <div class="ws-block-title small">Circle every <b>${esc(page % 2 === 0 ? target.toUpperCase() : target)}</b> (there are 6!)</div>
      <div class="ws-find">${huntHtml}</div>
    </div>
    ${startSoundPictures(cycle, cards[0] || focusCards(cycle)[0], page)}`;
}

function wordBuildingPage(cycle, page) {
  const words = rotate(cycleWords(cycle), page * 3).slice(0, 6);
  // First-letter fill: picture cue where we have one, so it is a real task
  // (not copy-the-word-bank).
  const fill = words.slice(0, 4).map(word => {
    const img = wordImage(word);
    const cue = img ? `<img class="ws-cue" src="${esc(img)}" alt=""/>` : "";
    return `<div class="ws-fill">${cue}<span class="ws-blank"></span>${esc(word.slice(1))}</div>`;
  }).join("");
  // Missing-vowel fill for CVC words.
  const vowelWords = words.filter(w => w.length === 3 && VOWELS.has(w[1])).slice(0, 3);
  const vowelFill = vowelWords.map(word => {
    const img = wordImage(word);
    const cue = img ? `<img class="ws-cue" src="${esc(img)}" alt=""/>` : "";
    return `<div class="ws-fill">${cue}${esc(word[0])}<span class="ws-blank"></span>${esc(word.slice(2))}</div>`;
  }).join("");
  const letters = focusCards(cycle).map(c => c.spelling).join("  ");
  return `<div class="ws-block">
      <div class="ws-block-title small">Write the missing FIRST letter:</div>
      <div class="ws-fill-grid">${fill}</div>
    </div>
    ${vowelWords.length ? `<div class="ws-block">
      <div class="ws-block-title small">Write the missing MIDDLE sound:</div>
      <div class="ws-fill-grid">${vowelFill}</div>
    </div>` : ""}
    <div class="ws-block">
      <div class="ws-block-title small">Read each word, then write it two times:</div>
      ${words.slice(0, 3).map(word => `<div class="ws-copy"><span class="ws-trace">${esc(word)}</span>${traceLines(1)}</div>`).join("")}
    </div>
    <div class="ws-block">
      <div class="ws-block-title small">Build your own words with: <b>${esc(letters || "your sounds")}</b> + letters you know</div>
      <div class="ws-build">${Array.from({ length: 3 }, () => '<span class="ws-box"></span><span class="ws-box"></span><span class="ws-box"></span>').join('<br/>')}</div>
    </div>
    <div class="ws-block ws-bank">
      <div class="ws-block-title small">Word bank (check your answers):</div>
      <div class="ws-bank-words">${words.map(w => esc(w)).join(" &nbsp;·&nbsp; ")}</div>
    </div>`;
}

function sightWordsPage(cycle, page) {
  const words = rotate(sightWords(cycle), page);
  const trace = words.slice(0, 4).map(word =>
    `<div class="ws-copy"><span class="ws-trace">${esc(displayWord(word))}</span>${traceLines(1)}</div>`).join("");
  const target = words[0] || "the";
  // Hunt grid: this cycle's words hide among words from EARLIER cycles only.
  const earlier = rotate(earlierSightWords(cycle), page * 2);
  const distractors = earlier.length >= 3 ? earlier : [...earlier, ...words.slice(1)];
  const gridWords = [];
  for (let i = 0; i < 24; i += 1) {
    gridWords.push((i * 7 + page) % 4 === 1 ? target : distractors[i % distractors.length] || target);
  }
  let count = gridWords.filter(w => w === target).length;
  for (let i = 0; count < 6 && i < 24; i += 1) {
    if (gridWords[i] !== target) { gridWords[i] = target; count += 1; }
  }
  const grid = `<div class="ws-grid">${gridWords.map(w => `<span>${esc(displayWord(w))}</span>`).join("")}</div>`;
  // Real cloze sentences for THIS cycle's words.
  const clozeWords = rotate(words, page).slice(0, 3).filter(w => HFW_SENTENCES[w]);
  const sentences = clozeWords.map(word =>
    `<div class="ws-sentence">${esc(HFW_SENTENCES[word]).replace("___", '<span class="ws-line"></span>')}</div>`).join("");
  const bank = clozeWords.map(w => esc(displayWord(w))).join(" &nbsp;·&nbsp; ");
  return `<div class="ws-block">
      <div class="ws-block-title small">Trace and write this cycle's tricky words:</div>
      ${trace}
    </div>
    <div class="ws-block">
      <div class="ws-block-title small">Colour every <b>${esc(displayWord(target))}</b> (there are 6!)</div>
      ${grid}
    </div>
    ${sentences ? `<div class="ws-block">
      <div class="ws-block-title small">Finish each sentence with a word from the box: <b>${bank}</b></div>
      ${sentences}
    </div>` : ""}`;
}

function patternFluencyPage(cycle, page) {
  const patterns = CYCLE_PATTERNS[cycle.cycleNumber] || CYCLE_PATTERNS[27];
  const sort = patterns[page % patterns.length];
  const chains = CYCLE_CHAINS[cycle.cycleNumber] || CYCLE_CHAINS[27];
  const chain = chains[page % chains.length];
  const poem = EL_CYCLE_POEMS.find(p => p.cycle === cycle.cycleNumber);
  const words = rotate([...sort.yes.slice(0, 4), ...sort.no], page).slice().sort();
  const chainHtml = chain.map((word, i) => {
    if (i === 0) return `<span class="ws-chip">${esc(word)}</span>`;
    return `<span class="ws-arrow">→</span><span class="ws-chip blank"></span>`;
  }).join("");
  const chainHint = `Start with <b>${esc(chain[0])}</b>. Change one letter each time. (Hint: ${chain.slice(1).map(w => esc(w)).join(", ")})`;
  // The poem task always works: its findWords are IN the poem by definition.
  const poemHtml = poem
    ? `<div class="ws-block"><div class="ws-block-title small">Read the poem 3 times. Circle these words: <b>${poem.findWords.map(w => esc(w)).join(", ")}</b></div>
        <div class="ws-poem">${esc(poem.lines.join("\n"))}</div></div>`
    : "";
  return `<div class="ws-block">
      <div class="ws-block-title small">Sort the words. Write each word under the right heading.</div>
      <div class="ws-wordstrip">${words.map(w => `<span class="ws-chip">${esc(w)}</span>`).join("")}</div>
      <div class="ws-sort">
        <div class="ws-col"><div class="ws-col-head">Words that ${esc(sort.label)}</div>${'<div class="ws-rule"></div>'.repeat(4)}</div>
        <div class="ws-col"><div class="ws-col-head">Other words</div>${'<div class="ws-rule"></div>'.repeat(4)}</div>
      </div>
    </div>
    <div class="ws-block">
      <div class="ws-block-title small">Finish the word chain. ${chainHint}</div>
      <div class="ws-chain">${chainHtml}</div>
    </div>
    ${poemHtml}`;
}

const PAGE_BUILDERS = {
  letterFormation: letterFormationPage,
  wordBuilding: wordBuildingPage,
  sightWords: sightWordsPage,
  patternFluency: patternFluencyPage
};

const WS_STYLES = `
  @page { size: A4 portrait; margin: 13mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Andika', 'Comic Sans MS', 'Quicksand', sans-serif; color: #14110c; }
  .page { padding: 0 0 8mm; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .ws-head { border-bottom: 3px solid #0C6B65; padding-bottom: 8px; margin-bottom: 14px; }
  .ws-name { font-size: 13px; color: #475569; }
  .ws-line { display: inline-block; border-bottom: 1.5px solid #94a3b8; width: 180px; height: 14px; vertical-align: middle; }
  .ws-line.short { width: 110px; }
  .ws-meta { margin-top: 6px; font-size: 18px; }
  .ws-type { float: right; color: #0C6B65; font-weight: 700; }
  .ws-block { margin: 0 0 14px; }
  .ws-block-title { font-size: 30px; font-weight: 700; color: #0C6B65; margin-bottom: 6px; }
  .ws-block-title.small { font-size: 16px; color: #b8650f; }
  .ws-sound { font-size: 18px; color: #64748b; font-weight: 400; }
  .ws-trace-row { display: flex; gap: 26px; font-size: 52px; line-height: 1; margin-bottom: 6px; }
  .ws-trace { color: #cfd6dd; }
  .ws-write { display: grid; gap: 14px; }
  .ws-rule { height: 24px; border-bottom: 2px solid #cbd5e1; position: relative; }
  .ws-rule::before { content: ""; position: absolute; left: 0; right: 0; top: 50%; border-top: 1px dashed #e2e8f0; }
  .ws-find { display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; font-size: 24px; text-align: center; }
  .ws-find span { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 6px 0; }
  .ws-pics { display: flex; gap: 16px; }
  .ws-pic img { width: 92px; height: 92px; object-fit: contain; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 6px; }
  .ws-fill-grid { display: flex; flex-wrap: wrap; gap: 18px; font-size: 28px; align-items: center; }
  .ws-fill { display: inline-flex; align-items: center; gap: 6px; }
  .ws-cue { width: 54px; height: 54px; object-fit: contain; }
  .ws-blank { display: inline-block; width: 30px; border-bottom: 2px solid #475569; margin-right: 2px; height: 24px; }
  .ws-copy { margin-bottom: 8px; }
  .ws-copy .ws-trace { font-size: 32px; }
  .ws-box { display: inline-block; width: 40px; height: 40px; border: 2px solid #94a3b8; border-radius: 6px; margin: 4px; }
  .ws-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; font-size: 19px; text-align: center; }
  .ws-grid span { border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 8px 0; }
  .ws-sentence { font-size: 21px; margin: 10px 0; }
  .ws-bank { border-top: 2px dashed #cbd5e1; padding-top: 8px; }
  .ws-bank-words { font-size: 18px; color: #475569; }
  .ws-poem { white-space: pre-wrap; font-size: 19px; line-height: 1.7; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 12px 16px; }
  .ws-wordstrip, .ws-chain { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
  .ws-chip { border: 2px solid #0C6B65; border-radius: 10px; padding: 6px 14px; font-size: 21px; }
  .ws-chip.blank { min-width: 70px; border-style: dashed; }
  .ws-arrow { font-size: 24px; align-self: center; }
  .ws-sort { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .ws-col-head { font-weight: 700; margin-bottom: 8px; }
  .ws-footer { margin-top: 10px; text-align: center; color: #98a2b3; font-size: 11px; }
`;

// Build the full printable HTML document for a recipe. Returns { title, html }.
export function buildWorksheetDocument({ cycleId, type, pages = 1 }) {
  const cycle = getWorksheetCycle(cycleId);
  if (!cycle) throw new Error("Unknown cycle");
  const builder = PAGE_BUILDERS[type];
  const typeMeta = WORKSHEET_TYPES.find(t => t.id === type);
  if (!builder || !typeMeta) throw new Error("Unknown worksheet type");
  if (!availableWorksheetTypes(cycle).includes(type)) {
    throw new Error(`${typeMeta.label} is not available for Cycle ${cycle.cycleNumber}`);
  }
  const count = Math.max(1, Math.min(8, Number(pages) || 1));
  const pagesHtml = Array.from({ length: count }, (_unused, i) => `
    <section class="page">
      ${pageHeader(cycle, typeMeta.label)}
      ${builder(cycle, i)}
      <div class="ws-footer">Literacy Guide · Cycle ${esc(cycle.cycleNumber)} · ${esc(typeMeta.label)} · Page ${i + 1} of ${count}</div>
    </section>`).join("");
  const title = `Cycle ${cycle.cycleNumber} - ${typeMeta.label}`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
    <link href="https://fonts.googleapis.com/css2?family=Andika:wght@400;700&display=swap" rel="stylesheet">
    <style>${WS_STYLES}</style></head>
    <body>${pagesHtml}</body></html>`;
  return { title, html };
}

// Open the worksheet in a new window and trigger the print / save-as-PDF dialog.
export function printWorksheet(recipe) {
  const { html } = buildWorksheetDocument(recipe);
  return openHtmlDocument({
    html,
    name: "lp-worksheet",
    features: "width=900,height=1100",
    autoPrint: true
  }).ok;
}
