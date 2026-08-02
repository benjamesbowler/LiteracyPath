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
  { id: "sightWords", label: "Sight words", blurb: "Trace, find and use the cycle's sight words in real sentences." },
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
  if (hasRealLetters) ids.push("letterFormation");
  // A word-building sheet must not ask a child to spell with untaught letters.
  // Early cycles may not yet have two decodable words with unambiguous picture
  // cues, so word building starts only when both the spelling and image contract
  // can be met.
  if (hasRealLetters && pictureWordPool(cycle).length >= 2) ids.push("wordBuilding");
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
  "ant", "cat", "map", "bag", "tap", "ham", "van", "mat", "sat", "pan", "fan",
  "bed", "ten", "net", "peg", "hen", "wet", "pet", "leg", "red", "men",
  "pig", "sit", "lip", "fin", "win", "dig", "pin", "bin", "hit", "zip",
  "dog", "hop", "pot", "mop", "log", "cot", "top", "pop", "fog", "box",
  "sun", "bug", "cup", "mud", "run", "hut", "bus", "nut", "rug", "jug"
];

// These repository images are unsuitable as small worksheet cues: they either
// print the answer in the artwork, represent an abstract word through a busy
// scene, or have more than one ordinary label at cue size.
const WORKSHEET_IMAGE_EXCLUSIONS = new Set(["bank", "pink", "sat", "six", "thin", "think", "who"]);

function focusCards(cycle) {
  const cards = (cycle.focusLetters || []).length ? cycle.focusLetters : cycle.reviewLetters || [];
  return cards
    .map(card => {
      const grapheme = card.grapheme || card.spelling || "";
      const rawSpelling = (card.spelling || "").toLowerCase();
      // Legacy review cards store Aa as spelling "aa", Mm as "mm", and so
      // forth. That represents capital/lowercase forms, not a doubled grapheme.
      const isCasePair = /^[A-Z][a-z]$/.test(grapheme) && grapheme[0].toLowerCase() === grapheme[1];
      return {
        grapheme,
        sound: card.sound || "",
        spelling: isCasePair ? grapheme[1] : rawSpelling
      };
    })
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
  // 3) Fill from any other CVC words composed only of taught letters.
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
  a: "The word for one is ___.",
  the: "We use ___ for a dog we both know.",
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
  her: "The bag belongs to Mum. It is ___ bag.",
  his: "The cap belongs to Dad. It is ___ cap.",
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
  if (WORKSHEET_IMAGE_EXCLUSIONS.has(word)) return "";
  const asset = getChildWordAsset(word) || {};
  return asset.image || "";
}

const IMAGE_MIME_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml"
};

function imageMimeType(source, suppliedType = "") {
  if (suppliedType.startsWith("image/")) return suppliedType;
  if (suppliedType) return "";
  const extension = source.split(/[?#]/, 1)[0].split(".").pop()?.toLowerCase();
  return IMAGE_MIME_TYPES[extension] || "";
}

function bytesToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  // Avoid spreading a whole image into one call: large argument lists can
  // overflow the browser stack.
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

// The worksheet itself is opened from a temporary Blob URL. Embed every image
// before navigating that print window so the browser/PDF engine never has to
// resolve late site-relative requests from a temporary document.
export async function embedWorksheetImages(html, { fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== "function") throw new Error("Worksheet pictures cannot be loaded in this browser.");
  const sources = [...new Set([...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)].map(match => match[1]))];
  if (!sources.length) return html;

  const embedded = await Promise.all(sources.map(async source => {
    const response = await fetchImpl(source, { credentials: "same-origin", cache: "force-cache" });
    if (!response?.ok) throw new Error(`Worksheet picture could not be loaded: ${source}`);
    const blob = await response.blob();
    const mimeType = imageMimeType(source, blob.type || "");
    if (!mimeType) throw new Error(`Worksheet picture has an unsupported file type: ${source}`);
    return [source, `data:${mimeType};base64,${bytesToBase64(await blob.arrayBuffer())}`];
  }));

  const sourceMap = new Map(embedded);
  return html.replace(/(<img\b[^>]*\bsrc=")([^"]+)(")/gi, (whole, before, source, after) => {
    const dataUrl = sourceMap.get(source);
    return dataUrl ? `${before}${dataUrl}${after}` : whole;
  });
}

// ── HTML helpers ─────────────────────────────────────────────────────────────
function esc(value) {
  return String(value).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

function pageHeader(cycle, typeLabel) {
  return `<div class="ws-head">
    <div class="ws-name">Name: <span class="ws-line"></span> &nbsp; Date: <span class="ws-line short"></span></div>
    <div class="ws-meta"><strong>${esc(worksheetCycleLabel(cycle))}</strong> <span class="ws-type">${esc(typeLabel)}</span></div>
  </div>`;
}

function traceLines(count = 2) {
  return `<div class="ws-write">${Array.from({ length: count }, () => '<div class="ws-rule"></div>').join("")}</div>`;
}

// Letter hunt: 24 letters where the target is GUARANTEED to appear exactly six
// times among letters the class has already been taught.
function letterHunt(cycle, target, page) {
  const taught = taughtLettersThrough(cycle.cycleNumber || 1).filter(l => l !== target);
  const fillers = taught.length ? taught : [target === "a" ? "m" : "a"];
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
  if (!card) return "";
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
  return `<div class="ws-block" data-task-kind="initial-sound-pictures" data-task-id="initial-${esc(card.spelling)}-${page}">
      <div class="ws-block-title small ws-instruction">Circle the pictures that start with the <b class="ws-school-model">${esc(card.spelling)}</b> sound.</div>
      <div class="ws-pics">${items}</div>
    </div>`;
}

function childSoundExample(card) {
  const example = (LETTER_EXAMPLES[card.spelling] || []).find(word => word.startsWith(card.spelling))
    || (LETTER_EXAMPLES[card.spelling] || [])[0]
    || "";
  return example ? `as in ${example}` : `Say the ${card.spelling} sound`;
}

export const WORKSHEET_PAGE_STAGES = [
  { id: "model", label: "Watch and try", purpose: "Look at the example. Then have a go." },
  { id: "guided", label: "Try with help", purpose: "Use the clue to help you." },
  { id: "discriminate", label: "Pick the right one", purpose: "Choose or match the right answer." },
  { id: "construct", label: "Make it", purpose: "Finish it or make it yourself." },
  { id: "transfer", label: "Use it", purpose: "Use what you know in a new way." },
  { id: "retrieve", label: "Remember it", purpose: "Have a go on your own. Then check your work." }
];

function stageFor(page) {
  return WORKSHEET_PAGE_STAGES[page % WORKSHEET_PAGE_STAGES.length];
}

function traceCardRows(cards, page, lineCount = 2) {
  return cards.slice(0, 2).map((card, index) => {
    const big = card.spelling.length === 1 ? `${card.spelling.toUpperCase()}${card.spelling}` : card.grapheme;
    const trace = Array.from({ length: 4 }, () => `<span class="ws-trace ws-school-model">${esc(big)}</span>`).join("");
    return `<div class="ws-block" data-task-kind="letter-trace" data-task-id="trace-${esc(card.spelling)}-${page}-${index}">
      <div class="ws-block-title ws-school-model">${esc(big)} <span class="ws-sound">${esc(childSoundExample(card))}</span></div>
      <div class="ws-trace-row">${trace}</div>
      ${traceLines(lineCount)}
    </div>`;
  }).join("");
}

function letterHuntBlock(cycle, target, page) {
  const hunt = letterHunt(cycle, target, page);
  const huntHtml = hunt.map(l => `<span>${esc(page % 2 === 0 ? l.toUpperCase() : l)}</span>`).join("");
  const display = page % 2 === 0 ? target.toUpperCase() : target;
  return `<div class="ws-block" data-task-kind="letter-hunt" data-task-id="hunt-${esc(target)}-${page}" data-answer="${esc(display)}">
      <div class="ws-block-title small ws-instruction">Circle every <b>${esc(display)}</b>. There are 6.</div>
      <div class="ws-find">${huntHtml}</div>
    </div>`;
}

function capitalLowercaseMatchBlock(cycle, cards, page) {
  const taught = taughtLettersThrough(cycle.cycleNumber || 1);
  const letters = [...new Set([...cards.map(card => card.spelling), ...rotate(taught, page)])]
    .filter(letter => /^[a-z]$/.test(letter))
    .slice(0, 4);
  if (letters.length < 2) return letterHuntBlock(cycle, cards[0]?.spelling || "a", page);
  const answers = rotate(letters, 1);
  return `<div class="ws-block" data-task-kind="capital-lowercase-match" data-task-id="case-match-${cycle.cycleNumber}-${page}">
      <div class="ws-block-title small ws-instruction">Draw a line from each capital letter to its small letter.</div>
      <div class="ws-match">
        <div>${letters.map(letter => `<span>${esc(letter.toUpperCase())}</span>`).join("")}</div>
        <div>${answers.map(letter => `<span data-answer="${esc(letter.toUpperCase())}">${esc(letter)}</span>`).join("")}</div>
      </div>
    </div>`;
}

function initialLetterPictureBlock(cards, page) {
  const words = [];
  for (const card of cards) {
    for (const word of LETTER_EXAMPLES[card.spelling] || []) {
      if (word.startsWith(card.spelling) && wordImage(word) && !words.includes(word)) words.push(word);
    }
  }
  const selected = rotate(words, page).slice(0, 4);
  if (!selected.length) return "";
  return `<div class="ws-block" data-task-kind="opening-letter-picture" data-task-id="opening-picture-${page}">
      <div class="ws-block-title small ws-instruction">Write the first letter or letters for each picture.</div>
      <div class="ws-fill-grid">${selected.map(word => {
        const card = cards.find(item => word.startsWith(item.spelling));
        return `<div class="ws-fill" data-answer="${esc(card?.spelling || word[0])}"><img class="ws-cue" src="${esc(wordImage(word))}" alt="${esc(word)}"/><span class="ws-box"></span></div>`;
      }).join("")}</div>
    </div>`;
}

function letterMemoryBlock(cards, page) {
  return `<div class="ws-block" data-task-kind="letter-retrieval" data-task-id="letter-memory-${page}">
      <div class="ws-block-title small ws-instruction">Write each letter you are learning. Write the capital and small letter.</div>
      <div class="ws-memory">${cards.slice(0, 2).map(card => `<div data-answer="${esc(card.spelling.toUpperCase())}${esc(card.spelling)}"><b class="ws-school-model">${esc(card.spelling)} ${esc(childSoundExample(card))}</b>${traceLines(2)}</div>`).join("")}</div>
    </div>`;
}

function letterFormationPage(cycle, page) {
  const cards = rotate(focusCards(cycle), page);
  const target = cards[0]?.spelling || "a";
  switch (page % 6) {
    case 0: {
      const pictureTask = startSoundPictures(cycle, cards[0], page);
      return `${traceCardRows(cards, page, 2)}${pictureTask || letterHuntBlock(cycle, target, page)}`;
    }
    case 1:
      return `${letterHuntBlock(cycle, target, page)}${traceCardRows(cards.slice(0, 1), page, 2)}`;
    case 2:
      return `${capitalLowercaseMatchBlock(cycle, cards, page)}${traceCardRows(cards, page, 1)}`;
    case 3: {
      const pictureTasks = `${startSoundPictures(cycle, cards[0], page)}${startSoundPictures(cycle, cards[1] || cards[0], page + 1)}`;
      const supportTask = pictureTasks ? traceCardRows(cards.slice(0, 1), page, 1) : letterHuntBlock(cycle, target, page);
      return `${pictureTasks}${supportTask}${pictureTasks ? "" : traceCardRows(cards.slice(0, 1), page, 1)}`;
    }
    case 4: {
      const pictureTask = initialLetterPictureBlock(cards, page);
      return `${pictureTask || letterHuntBlock(cycle, target, page)}${traceCardRows(cards, page, 1)}`;
    }
    default:
      return `${letterMemoryBlock(cards, page)}${letterHuntBlock(cycle, target, page)}`;
  }
}

function pictureWordPool(cycle, page = 0) {
  const taught = taughtLettersThrough(cycle.cycleNumber || 1);
  const decodable = [...new Set([
    ...cycleWords(cycle),
    ...CVC_POOL.filter(word => word.split("").every(letter => taught.includes(letter)))
  ])].filter(word => wordImage(word));
  const rotated = rotate(decodable, page * 2);
  if (page === 0 && decodable.includes("ant")) return ["ant", ...rotated.filter(word => word !== "ant")];
  return rotated;
}

function missingLetterBlock(words, position, page) {
  const isFirst = position === "first";
  const selected = words.filter(word => isFirst || (word.length === 3 && VOWELS.has(word[1]))).slice(0, 4);
  const prompts = selected.map(word => {
    const before = isFirst ? "" : word[0];
    const after = isFirst ? word.slice(1) : word.slice(2);
    const answer = isFirst ? word[0] : word[1];
    return `<div class="ws-fill" data-answer="${esc(answer)}"><img class="ws-cue" src="${esc(wordImage(word))}" alt="${esc(word)}"/>${esc(before)}<span class="ws-blank"></span>${esc(after)}</div>`;
  }).join("");
  const label = isFirst ? "FIRST" : "MIDDLE";
  return `<div class="ws-block" data-task-kind="missing-letter" data-task-id="missing-${position}-${page}">
      <div class="ws-block-title small ws-instruction">Write the missing ${label} letter.</div>
      <div class="ws-fill-grid">${prompts}</div>
    </div>`;
}

function copyWordsBlock(words, page, label = "Trace each word. Write it once.") {
  return `<div class="ws-block" data-task-kind="word-copy" data-task-id="copy-words-${page}">
      <div class="ws-block-title small ws-instruction">${esc(label)}</div>
      ${words.slice(0, 3).map(word => `<div class="ws-copy" data-answer="${esc(word)}"><span class="ws-trace">${esc(word)}</span>${traceLines(1)}</div>`).join("")}
    </div>`;
}

function pictureBuildBlock(words, page, independent = false) {
  const selected = words.slice(0, independent ? 4 : 3);
  return `<div class="ws-block" data-task-kind="${independent ? "word-spell" : "word-build"}" data-task-id="${independent ? "spell" : "build"}-${page}">
      <div class="ws-block-title small ws-instruction">${independent ? "Name each picture. Write the whole word in the boxes." : "Put the letters in order. Write the whole word in the boxes."}</div>
      <div class="ws-build-rows">${selected.map((word, index) => {
        const tiles = independent ? "" : `<span class="ws-tiles" aria-label="letters to order">${rotate(word.split(""), index + 1).map(letter => `<span>${esc(letter)}</span>`).join("")}</span>`;
        const boxes = word.split("").map(() => '<span class="ws-box"></span>').join("");
        return `<div class="ws-build-row" data-answer="${esc(word)}"><img class="ws-cue" src="${esc(wordImage(word))}" alt="${esc(word)}"/>${tiles}<span class="ws-boxes">${boxes}</span></div>`;
      }).join("")}</div>
    </div>`;
}

function pictureWordMatchBlock(words, page) {
  const selected = words.slice(0, 4);
  const answerWords = rotate(selected, 1);
  return `<div class="ws-block" data-task-kind="picture-word-match" data-task-id="picture-match-${page}">
      <div class="ws-block-title small ws-instruction">Draw a line from each picture to its word.</div>
      <div class="ws-picture-match">
        <div>${selected.map(word => `<img class="ws-cue large" src="${esc(wordImage(word))}" alt="${esc(word)}"/>`).join("")}</div>
        <div>${answerWords.map(word => `<span data-answer="${esc(word)}">${esc(word)}</span>`).join("")}</div>
      </div>
    </div>`;
}

function pictureWordChoiceBlock(words, page) {
  const selected = words.slice(0, 4);
  return `<div class="ws-block" data-task-kind="picture-word-choice" data-task-id="picture-choice-${page}">
      <div class="ws-block-title small ws-instruction">Circle the word that names each picture.</div>
      <div class="ws-choice-rows">${selected.map((word, index) => {
        const distractors = rotate(words.filter(candidate => candidate !== word), index + page).slice(0, 2);
        const options = rotate([word, ...distractors], index + 1);
        return `<div class="ws-choice-row" data-answer="${esc(word)}"><img class="ws-cue" src="${esc(wordImage(word))}" alt="${esc(word)}"/><span>${options.map(option => `<b>${esc(option)}</b>`).join(" &nbsp; ○ &nbsp; ")}</span></div>`;
      }).join("")}</div>
    </div>`;
}

function wordBuildingPage(cycle, page) {
  const words = pictureWordPool(cycle, page);
  switch (page % 6) {
    case 0:
      return `${missingLetterBlock(words, "first", page)}${copyWordsBlock(words, page)}`;
    case 1:
      return `${missingLetterBlock(words, "middle", page)}${copyWordsBlock(words.slice().reverse(), page, "Read each word. Copy it once.")}`;
    case 2:
      return `${pictureBuildBlock(words, page, false)}${missingLetterBlock(words, "first", page)}`;
    case 3:
      return `${pictureWordMatchBlock(words, page)}${copyWordsBlock(words, page, "Read each matched word. Copy it once.")}`;
    case 4:
      return `${pictureWordChoiceBlock(words, page)}${missingLetterBlock(words.slice().reverse(), "middle", page)}`;
    default:
      return `${pictureBuildBlock(words, page, true)}${copyWordsBlock(words.slice().reverse(), page, "Check each spelling. Copy it once.")}`;
  }
}

function sightWordTraceBlock(words, page) {
  const trace = words.slice(0, 4).map(word => `<div class="ws-copy" data-answer="${esc(displayWord(word))}"><span class="ws-trace">${esc(displayWord(word))}</span>${traceLines(1)}</div>`).join("");
  return `<div class="ws-block" data-task-kind="sight-word-trace" data-task-id="sight-trace-${page}">
      <div class="ws-block-title small ws-instruction">Trace each sight word. Write it once.</div>
      ${trace}
    </div>`;
}

function sightWordHuntBlock(cycle, words, page) {
  const target = words[0] || "the";
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
  return `<div class="ws-block" data-task-kind="sight-word-hunt" data-task-id="sight-hunt-${esc(target)}-${page}" data-answer="${esc(displayWord(target))}">
      <div class="ws-block-title small ws-instruction">Circle every <b>${esc(displayWord(target))}</b>. There are 6.</div>
      ${grid}
    </div>`;
}

function sightWordClozeBlock(words, page, limit = 3) {
  const clozeWords = rotate(words, page).slice(0, limit).filter(w => HFW_SENTENCES[w]);
  const sentences = clozeWords.map(word =>
    `<div class="ws-sentence" data-answer="${esc(displayWord(word))}">${esc(HFW_SENTENCES[word]).replace("___", '<span class="ws-line"></span>')}</div>`).join("");
  const bank = clozeWords.map(w => esc(displayWord(w))).join(" &nbsp;·&nbsp; ");
  return sentences ? `<div class="ws-block" data-task-kind="sight-word-cloze" data-task-id="sight-cloze-${page}">
      <div class="ws-block-title small ws-instruction">Finish each sentence with a word from the box: <b>${bank}</b></div>
      ${sentences}
    </div>` : "";
}

function sightWordCoverWriteBlock(words, page) {
  return `<div class="ws-block" data-task-kind="sight-word-cover-write" data-task-id="cover-write-${page}">
      <div class="ws-block-title small ws-instruction">Read each word. Cover it. Write it. Check it.</div>
      <div class="ws-cover-grid">${words.slice(0, 4).map(word => `<div data-answer="${esc(displayWord(word))}"><b>${esc(displayWord(word))}</b><span class="ws-cover">cover</span>${traceLines(2)}</div>`).join("")}</div>
    </div>`;
}

function sightWordSentenceFindBlock(words, page) {
  const entries = words.filter(word => HFW_SENTENCES[word]).slice(0, 4);
  return `<div class="ws-block" data-task-kind="sight-word-in-sentence" data-task-id="sentence-find-${page}">
      <div class="ws-block-title small ws-instruction">Read each sentence. Circle the bold sight word.</div>
      ${entries.map(word => {
        const full = HFW_SENTENCES[word].replace("___", displayWord(word));
        const marked = esc(full).replace(esc(displayWord(word)), `<b>${esc(displayWord(word))}</b>`);
        return `<div class="ws-sentence" data-answer="${esc(displayWord(word))}">${marked}</div>`;
      }).join("")}
    </div>`;
}

function sightWordSentenceCopyBlock(words, page) {
  const entries = words.filter(word => HFW_SENTENCES[word]).slice(0, 3);
  return `<div class="ws-block" data-task-kind="sentence-copy" data-task-id="sentence-copy-${page}">
      <div class="ws-block-title small ws-instruction">Read each sentence. Copy it on the line.</div>
      ${entries.map(word => `<div class="ws-sentence-copy" data-answer="${esc(HFW_SENTENCES[word].replace("___", displayWord(word)))}"><span>${esc(HFW_SENTENCES[word].replace("___", displayWord(word)))}</span>${traceLines(1)}</div>`).join("")}
    </div>`;
}

function sightWordDictationBlock(words, page) {
  return `<div class="ws-block" data-task-kind="sight-word-dictation" data-task-id="sight-dictation-${page}">
      <div class="ws-block-title small ws-instruction">Ask an adult to say each sight word. Write what you hear.</div>
      <div class="ws-dictation">${words.slice(0, 4).map((word, index) => `<div data-answer="${esc(displayWord(word))}"><b>${index + 1}.</b>${traceLines(1)}</div>`).join("")}</div>
    </div>`;
}

function sightWordsPage(cycle, page) {
  const words = rotate(sightWords(cycle), page);
  switch (page % 6) {
    case 0:
      return `${sightWordTraceBlock(words, page)}${sightWordHuntBlock(cycle, words, page)}${sightWordClozeBlock(words, page, 2)}`;
    case 1:
      return `${sightWordCoverWriteBlock(words, page)}${sightWordTraceBlock(words.slice().reverse(), page)}`;
    case 2:
      return `${sightWordClozeBlock(words, page)}${sightWordHuntBlock(cycle, words, page)}`;
    case 3:
      return `${sightWordSentenceFindBlock(words, page)}${sightWordCoverWriteBlock(words, page)}`;
    case 4:
      return `${sightWordSentenceCopyBlock(words, page)}${sightWordTraceBlock(words, page)}`;
    default:
      return `${sightWordDictationBlock(words, page)}${sightWordClozeBlock(words, page, 2)}`;
  }
}

function patternSortBlock(sort, words, page) {
  return `<div class="ws-block" data-task-kind="pattern-sort" data-task-id="pattern-sort-${page}">
      <div class="ws-block-title small ws-instruction">Sort the words. Write each word under the right heading.</div>
      <div class="ws-wordstrip">${words.map(w => `<span class="ws-chip">${esc(w)}</span>`).join("")}</div>
      <div class="ws-sort">
        <div class="ws-col"><div class="ws-col-head">Words that ${esc(sort.label)}</div>${'<div class="ws-rule"></div>'.repeat(4)}</div>
        <div class="ws-col"><div class="ws-col-head">Other words</div>${'<div class="ws-rule"></div>'.repeat(4)}</div>
      </div>
    </div>`;
}

function wordChainBlock(chains, page) {
  return `<div class="ws-block" data-task-kind="word-chain" data-task-id="word-chain-${page}">
      <div class="ws-block-title small ws-instruction">Change one letter each time. Use the hint words.</div>
      ${chains.map(chain => `<div class="ws-chain" data-answer="${esc(chain.join("|"))}"><span class="ws-chip">${esc(chain[0])}</span>${chain.slice(1).map(() => '<span class="ws-arrow">→</span><span class="ws-chip blank"></span>').join("")}<small>Hints: ${chain.slice(1).map(word => esc(word)).join(", ")}</small></div>`).join("")}
    </div>`;
}

function patternCompareBlock(patterns, page) {
  const words = rotate(patterns.flatMap(pattern => pattern.yes.slice(0, 4)), page);
  return `<div class="ws-block" data-task-kind="pattern-compare" data-task-id="pattern-compare-${page}">
      <div class="ws-block-title small ws-instruction">Put each word in the right spelling group.</div>
      <div class="ws-wordstrip">${words.map(word => `<span class="ws-chip">${esc(word)}</span>`).join("")}</div>
      <div class="ws-sort">${patterns.map(pattern => `<div class="ws-col"><div class="ws-col-head">${esc(pattern.label)}</div>${'<div class="ws-rule"></div>'.repeat(4)}</div>`).join("")}</div>
    </div>`;
}

function patternDetectiveBlock(patterns, page) {
  return `<div class="ws-block" data-task-kind="pattern-detective" data-task-id="pattern-detective-${page}">
      <div class="ws-block-title small ws-instruction">Underline the spelling part in each word.</div>
      ${patterns.map(pattern => `<div class="ws-pattern-row" data-answer="${esc(pattern.yes.join("|"))}"><b>${esc(pattern.label)}</b><span>${pattern.yes.map(word => esc(word)).join(" &nbsp; ")}</span></div>`).join("")}
    </div>`;
}

function poemFluencyBlock(poem, page) {
  if (!poem) return "";
  return `<div class="ws-block" data-task-kind="poem-fluency" data-task-id="poem-fluency-${page}" data-answer="${esc(poem.findWords.join("|"))}">
      <div class="ws-block-title small ws-instruction">Read the poem 3 times. Circle these words: <b>${poem.findWords.map(w => esc(w)).join(", ")}</b></div>
      <div class="ws-poem">${esc(poem.lines.join("\n"))}</div>
      <div class="ws-read-checks" aria-label="three reading checks"><span>Read 1 □</span><span>Read 2 □</span><span>Read 3 □</span></div>
    </div>`;
}

function patternFluencyPage(cycle, page) {
  const patterns = CYCLE_PATTERNS[cycle.cycleNumber] || CYCLE_PATTERNS[27];
  const chains = CYCLE_CHAINS[cycle.cycleNumber] || CYCLE_CHAINS[27];
  const poem = EL_CYCLE_POEMS.find(p => p.cycle === cycle.cycleNumber);
  const firstWords = rotate([...patterns[0].yes.slice(0, 4), ...patterns[0].no], page);
  const secondWords = rotate([...patterns[1].yes.slice(0, 4), ...patterns[1].no], page + 1);
  switch (page % 6) {
    case 0:
      return `${patternSortBlock(patterns[0], firstWords, page)}${wordChainBlock([chains[0]], page)}`;
    case 1:
      return `${patternSortBlock(patterns[1], secondWords, page)}${wordChainBlock([chains[1]], page)}`;
    case 2:
      return `${patternCompareBlock(patterns, page)}${patternDetectiveBlock(patterns.slice(0, 1), page)}`;
    case 3:
      return `${wordChainBlock(chains, page)}${patternSortBlock(patterns[page % 2], page % 2 ? secondWords : firstWords, page)}`;
    case 4:
      return `${patternDetectiveBlock(patterns, page)}${patternCompareBlock(patterns.slice().reverse(), page)}`;
    default:
      return `${poemFluencyBlock(poem, page)}${patternDetectiveBlock(patterns, page)}`;
  }
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
  html { --ws-school-font: "Comic Sans MS", "Chalkboard SE", "Chalkboard", "Comic Neue", cursive; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  body { margin: 0; background: #fff; font-family: Andika, Atkinson Hyperlegible, Arial, sans-serif; color: #14110c; font-size: 16px; line-height: 1.35; }
  .page { min-height: 267mm; padding: 0 0 5mm; page-break-after: always; break-after: page; display: flex; flex-direction: column; }
  .page:last-child { page-break-after: auto; }
  .ws-head { border-bottom: 3px solid #0C6B65; padding-bottom: 8px; margin-bottom: 14px; }
  .ws-name { font-size: 14px; color: #334155; }
  .ws-line { display: inline-block; border-bottom: 1.5px solid #64748b; width: 180px; height: 14px; vertical-align: middle; }
  .ws-line.short { width: 110px; }
  .ws-meta { margin-top: 6px; font-size: 18px; }
  .ws-type { float: right; color: #0C6B65; font-weight: 700; }
  .ws-stage { display: flex; align-items: baseline; gap: 10px; margin: -4px 0 12px; padding: 7px 10px; border: 2px solid #0C6B65; border-radius: 10px; background: #eef8f6; }
  .ws-stage strong { font-size: 18px; color: #064e49; }
  .ws-stage span { font-size: 14px; color: #334155; }
  .ws-block { margin: 0 0 14px; break-inside: avoid; page-break-inside: avoid; }
  .ws-block-title { font-size: 30px; font-weight: 700; color: #0C6B65; margin-bottom: 6px; }
  .ws-block-title.small { font-size: 17px; color: #8a4109; }
  .ws-instruction { max-width: 68ch; }
  .ws-sound { font-size: 18px; color: #475569; font-weight: 400; }
  .ws-school-model,
  .ws-trace-row,
  .ws-find,
  .ws-fill-grid,
  .ws-copy,
  .ws-tiles,
  .ws-match,
  .ws-picture-match,
  .ws-choice-rows,
  .ws-memory,
  .ws-cover-grid,
  .ws-grid,
  .ws-sentence,
  .ws-sentence-copy,
  .ws-wordstrip,
  .ws-chain,
  .ws-pattern-row,
  .ws-poem { font-family: var(--ws-school-font); }
  .ws-trace-row { display: flex; gap: 26px; font-size: 52px; line-height: 1; margin-bottom: 6px; }
  .ws-trace { color: #aeb8c2; }
  .ws-write { display: grid; gap: 14px; }
  .ws-rule { height: 25px; border-bottom: 2px solid #94a3b8; position: relative; }
  .ws-rule::before { content: ""; position: absolute; left: 0; right: 0; top: 50%; border-top: 1px dashed #cbd5e1; }
  .ws-find { display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; font-size: 24px; text-align: center; }
  .ws-find span { border: 1.5px solid #94a3b8; border-radius: 8px; padding: 6px 0; }
  .ws-pics { display: flex; gap: 16px; flex-wrap: wrap; }
  .ws-pic img { width: 88px; height: 88px; object-fit: contain; border: 2px solid #94a3b8; border-radius: 12px; padding: 6px; }
  .ws-fill-grid { display: flex; flex-wrap: wrap; gap: 18px; font-size: 28px; align-items: center; }
  .ws-fill { display: inline-flex; align-items: center; gap: 6px; }
  .ws-cue { width: 58px; height: 58px; object-fit: contain; }
  .ws-cue.large { width: 72px; height: 72px; }
  .ws-blank { display: inline-block; width: 30px; border-bottom: 2px solid #475569; margin-right: 2px; height: 24px; }
  .ws-copy { margin-bottom: 8px; }
  .ws-copy .ws-trace { font-size: 32px; }
  .ws-box { display: inline-block; width: 40px; height: 40px; border: 2px solid #64748b; border-radius: 6px; margin: 4px; }
  .ws-boxes { white-space: nowrap; }
  .ws-build-rows, .ws-choice-rows, .ws-dictation { display: grid; gap: 10px; }
  .ws-build-row, .ws-choice-row { display: flex; align-items: center; gap: 16px; min-height: 62px; }
  .ws-tiles { display: inline-flex; gap: 5px; }
  .ws-tiles span { min-width: 32px; padding: 4px 8px; border: 1.5px solid #475569; border-radius: 6px; text-align: center; font-size: 21px; }
  .ws-match, .ws-picture-match { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  .ws-match > div, .ws-picture-match > div { display: grid; gap: 10px; }
  .ws-match span, .ws-picture-match span { min-height: 42px; display: flex; align-items: center; justify-content: center; border: 1.5px solid #64748b; border-radius: 8px; font-size: 22px; }
  .ws-picture-match img { justify-self: center; }
  .ws-memory, .ws-cover-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 22px; }
  .ws-cover-grid > div { border: 1.5px solid #94a3b8; border-radius: 10px; padding: 10px; }
  .ws-cover { display: inline-block; margin-left: 16px; padding: 3px 10px; border: 1px dashed #475569; color: #475569; }
  .ws-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; font-size: 19px; text-align: center; }
  .ws-grid span { border: 1.5px solid #94a3b8; border-radius: 8px; padding: 8px 0; }
  .ws-sentence { font-size: 21px; margin: 10px 0; }
  .ws-sentence-copy { margin-bottom: 12px; font-size: 19px; }
  .ws-poem { white-space: pre-wrap; font-size: 19px; line-height: 1.6; border: 2px solid #94a3b8; border-radius: 10px; padding: 12px 16px; }
  .ws-wordstrip, .ws-chain { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
  .ws-chip { border: 2px solid #0C6B65; border-radius: 10px; padding: 6px 14px; font-size: 21px; }
  .ws-chip.blank { min-width: 70px; border-style: dashed; }
  .ws-arrow { font-size: 24px; align-self: center; }
  .ws-sort { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .ws-col-head { font-weight: 700; margin-bottom: 8px; }
  .ws-pattern-row { display: grid; grid-template-columns: 190px 1fr; gap: 14px; margin: 12px 0; padding: 10px; border: 1.5px solid #94a3b8; border-radius: 8px; font-size: 20px; }
  .ws-read-checks { display: flex; gap: 24px; margin-top: 8px; font-size: 17px; }
  .ws-footer { margin-top: auto; padding-top: 8px; text-align: center; color: #475569; font-size: 12px; }
  @media print { body { background: #fff; } .page { overflow: hidden; } }
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
  const count = Math.max(1, Math.min(6, Number(pages) || 1));
  const pagesHtml = Array.from({ length: count }, (_unused, i) => {
    const stage = stageFor(i);
    return `
    <section class="page" data-worksheet-page="${i + 1}" data-worksheet-stage="${esc(stage.id)}" aria-labelledby="worksheet-title-${i + 1}">
      ${pageHeader(cycle, typeMeta.label)}
      <div class="ws-stage"><strong id="worksheet-title-${i + 1}">${esc(stage.label)}</strong><span>${esc(stage.purpose)}</span></div>
      ${builder(cycle, i)}
      <div class="ws-footer">Literacy Guide · Cycle ${esc(cycle.cycleNumber)} · ${esc(typeMeta.label)} · Page ${i + 1} of ${count}</div>
    </section>`;
  }).join("");
  const title = `Cycle ${cycle.cycleNumber} - ${typeMeta.label}`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title>
    <style>${WS_STYLES}</style></head>
    <body>${pagesHtml}</body></html>`;
  return { title, html };
}

// Open the worksheet in a new window and trigger the print / save-as-PDF dialog.
export function printWorksheet(recipe) {
  const { html } = buildWorksheetDocument(recipe);
  return openHtmlDocument({
    prepareHtml: () => embedWorksheetImages(html),
    name: "lp-worksheet",
    features: "width=900,height=1100",
    autoPrint: true
  });
}
