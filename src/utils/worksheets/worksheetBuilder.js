// Deterministic worksheet generator for the EL Skills Block cycles.
//
// Pure + deterministic: the SAME (cycleId, type, pages) recipe always produces
// the SAME worksheet, so a saved recipe in the bank re-downloads identically.
// Output is a self-contained printable HTML document (browser "Save as PDF"),
// the same lightweight approach the certificate printer uses - no libraries.
import { elSkillsBlockCycles, LETTER_EXAMPLES } from "../../data/elSkillsBlockCycles.js";
import { EL_CYCLE_POEMS } from "../../data/elCyclePoems.js";

export const WORKSHEET_TYPES = [
  { id: "letterFormation", label: "Letter formation", blurb: "Trace and write the cycle's focus letters." },
  { id: "wordBuilding", label: "Word building", blurb: "Read, fill in and build words with the cycle's sounds." },
  { id: "sightWords", label: "Sight words", blurb: "Trace, write, find and use the cycle's tricky words." },
  { id: "patternFluency", label: "Pattern & fluency", blurb: "Sort patterns, complete word chains and read the poem (cycles 25-27)." }
];

function isFluencyCycle(cycle) {
  return (cycle?.cycleNumber || 0) >= 25;
}

// Which worksheet types make sense for a given cycle.
export function availableWorksheetTypes(cycle) {
  if (!cycle) return [];
  const ids = [];
  const hasRealLetters = !isFluencyCycle(cycle) && (cycle.focusLetters || []).length > 0;
  if (hasRealLetters) ids.push("letterFormation", "wordBuilding");
  if ((cycle.highFrequencyWords || []).length > 0) ids.push("sightWords");
  if (isFluencyCycle(cycle)) ids.push("patternFluency");
  return WORKSHEET_TYPES.filter(t => ids.includes(t.id)).map(t => t.id);
}

export function getWorksheetCycle(cycleId) {
  return elSkillsBlockCycles.find(c => c.id === cycleId) || null;
}

// Cycles a teacher can pick from (numbered cycles only).
export function worksheetCycleOptions() {
  return elSkillsBlockCycles
    .filter(c => c.cycleNumber)
    .map(c => ({ id: c.id, cycleNumber: c.cycleNumber, title: c.title }));
}

// ── Content selectors (deterministic) ────────────────────────────────────────
const CVC_FALLBACK = {
  a: ["cat", "map", "bag", "tap", "ham", "van"],
  e: ["bed", "ten", "net", "peg", "hen", "wet"],
  i: ["pig", "sit", "lip", "fin", "win", "dig"],
  o: ["dog", "hop", "pot", "mop", "log", "cot"],
  u: ["sun", "bug", "cup", "mud", "run", "hut"]
};

function focusCards(cycle) {
  const cards = (cycle.focusLetters || []).length ? cycle.focusLetters : cycle.reviewLetters || [];
  return cards
    .map(card => ({ grapheme: card.grapheme || card.spelling, spelling: (card.spelling || "").toLowerCase() }))
    .filter(card => /^[a-z]{1,2}$/.test(card.spelling));
}

function cycleWords(cycle) {
  const fromExamples = focusCards(cycle)
    .flatMap(card => LETTER_EXAMPLES[card.spelling] || [])
    .filter(word => /^[a-z]{2,5}$/.test(word));
  const seen = [];
  for (const word of fromExamples) if (!seen.includes(word)) seen.push(word);
  if (seen.length < 6) {
    const vowels = focusCards(cycle).map(c => c.spelling).filter(s => CVC_FALLBACK[s]);
    const pool = (vowels.length ? vowels : ["a", "i", "o"]).flatMap(v => CVC_FALLBACK[v]);
    for (const word of pool) if (!seen.includes(word)) seen.push(word);
  }
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

// Deterministic rotation so each page differs without randomness.
function rotate(list, by) {
  if (!list.length) return list;
  const n = by % list.length;
  return [...list.slice(n), ...list.slice(0, n)];
}

// ── Pattern & fluency data (cycles 25-27) ────────────────────────────────────
const PATTERN_SORTS = [
  { label: "end with y", yes: ["by", "my", "why", "try", "fly", "sky"], no: ["sun", "map", "run", "top"] },
  { label: "end with -ay", yes: ["day", "say", "may", "play", "stay", "way"], no: ["dog", "sit", "cup", "ten"] },
  { label: "have -ng", yes: ["ring", "king", "song", "bang", "hang", "long"], no: ["rat", "pig", "cup", "red"] }
];
const CHAINS = [
  ["sat", "sit", "sip", "lip"],
  ["man", "mat", "map", "cap"],
  ["pig", "pin", "pan", "pat"]
];

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

function letterFormationPage(cycle, page) {
  const cards = rotate(focusCards(cycle), page);
  const rows = cards.map(card => {
    const big = card.grapheme.length === 1 ? `${card.grapheme.toUpperCase()}${card.grapheme}` : card.grapheme;
    const trace = Array.from({ length: 4 }, () => `<span class="ws-trace">${esc(big)}</span>`).join("");
    return `<div class="ws-block">
      <div class="ws-block-title">${esc(big)}</div>
      <div class="ws-trace-row">${trace}</div>
      ${traceLines(2)}
    </div>`;
  }).join("");
  const mix = ["a", "m", "t", "s", "i", "n", "o", "p", "c", "d"].join("  ").toUpperCase();
  const target = (cards[0]?.grapheme || "a").toUpperCase();
  return `${rows}
    <div class="ws-block">
      <div class="ws-block-title small">Circle every <b>${esc(target)}</b></div>
      <div class="ws-find">${esc(mix)}  ${esc(mix.split("").reverse().join(""))}</div>
    </div>`;
}

function wordBuildingPage(cycle, page) {
  const words = rotate(cycleWords(cycle), page * 2).slice(0, 6);
  const bank = words.join(" &nbsp;·&nbsp; ");
  const fill = words.map(word => `<div class="ws-fill"><span class="ws-blank"></span>${esc(word.slice(1))}</div>`).join("");
  const letters = focusCards(cycle).map(c => c.spelling.toUpperCase()).join("  ");
  return `<div class="ws-block">
      <div class="ws-block-title small">Word bank: <b>${bank}</b></div>
      <div class="ws-block-title small">Write the first letter:</div>
      <div class="ws-fill-grid">${fill}</div>
    </div>
    <div class="ws-block">
      <div class="ws-block-title small">Write each word two times:</div>
      ${words.slice(0, 3).map(word => `<div class="ws-copy"><span class="ws-trace">${esc(word)}</span>${traceLines(1)}</div>`).join("")}
    </div>
    <div class="ws-block">
      <div class="ws-block-title small">Build your own words with: <b>${esc(letters || "your sounds")}</b></div>
      <div class="ws-build">${Array.from({ length: 4 }, () => '<span class="ws-box"></span><span class="ws-box"></span><span class="ws-box"></span>').join('<br/>')}</div>
    </div>`;
}

function sightWordsPage(cycle, page) {
  const words = rotate(sightWords(cycle), page);
  const trace = words.map(word => `<div class="ws-copy"><span class="ws-trace">${esc(word)}</span>${traceLines(1)}</div>`).join("");
  const target = words[0] || "the";
  const gridWords = [];
  const distractors = sightWords(cycle).slice(1).concat(["and", "is", "it", "in", "on"]);
  for (let i = 0; i < 24; i += 1) {
    gridWords.push(i % 3 === 0 ? target : distractors[i % distractors.length] || target);
  }
  const grid = `<div class="ws-grid">${gridWords.map(w => `<span>${esc(w)}</span>`).join("")}</div>`;
  return `<div class="ws-block">
      <div class="ws-block-title small">Trace and write:</div>
      ${trace}
    </div>
    <div class="ws-block">
      <div class="ws-block-title small">Colour every <b>${esc(target)}</b></div>
      ${grid}
    </div>
    <div class="ws-block">
      <div class="ws-block-title small">Finish the sentence:</div>
      <div class="ws-sentence">I can see the <span class="ws-line"></span> .</div>
      <div class="ws-sentence"><span class="ws-line"></span> is here.</div>
    </div>`;
}

function patternFluencyPage(cycle, page) {
  const sort = PATTERN_SORTS[page % PATTERN_SORTS.length];
  const chain = CHAINS[page % CHAINS.length];
  const words = [...sort.yes.slice(0, 4), ...sort.no].sort();
  const poem = EL_CYCLE_POEMS.find(p => p.cycle === cycle.cycleNumber);
  const chainHtml = chain.map((word, i) => {
    if (i === 0) return `<span class="ws-chip">${esc(word)}</span>`;
    return `<span class="ws-arrow">→</span><span class="ws-chip blank"></span>`;
  }).join("");
  const poemHtml = poem
    ? `<div class="ws-block"><div class="ws-block-title small">Read the poem 3 times. Underline every word that ${esc(sort.label)}.</div>
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
      <div class="ws-block-title small">Finish the word chain. Change one sound each time.</div>
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
  .ws-block { margin: 0 0 16px; }
  .ws-block-title { font-size: 30px; font-weight: 700; color: #0C6B65; margin-bottom: 6px; }
  .ws-block-title.small { font-size: 16px; color: #b8650f; }
  .ws-trace-row { display: flex; gap: 26px; font-size: 56px; line-height: 1; margin-bottom: 6px; }
  .ws-trace { color: #cfd6dd; }
  .ws-write { display: grid; gap: 16px; }
  .ws-rule { height: 26px; border-bottom: 2px solid #cbd5e1; position: relative; }
  .ws-rule::before { content: ""; position: absolute; left: 0; right: 0; top: 50%; border-top: 1px dashed #e2e8f0; }
  .ws-find { font-size: 26px; letter-spacing: 10px; }
  .ws-fill-grid { display: flex; flex-wrap: wrap; gap: 18px; font-size: 30px; }
  .ws-blank { display: inline-block; width: 30px; border-bottom: 2px solid #475569; margin-right: 2px; }
  .ws-copy { margin-bottom: 8px; }
  .ws-copy .ws-trace { font-size: 34px; }
  .ws-box { display: inline-block; width: 40px; height: 40px; border: 2px solid #94a3b8; border-radius: 6px; margin: 4px; }
  .ws-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; font-size: 20px; text-align: center; }
  .ws-grid span { border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 8px 0; }
  .ws-sentence { font-size: 22px; margin: 10px 0; }
  .ws-poem { white-space: pre-wrap; font-size: 20px; line-height: 1.7; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 12px 16px; }
  .ws-wordstrip, .ws-chain { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
  .ws-chip { border: 2px solid #0C6B65; border-radius: 10px; padding: 6px 14px; font-size: 22px; }
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
  const { title, html } = buildWorksheetDocument(recipe);
  const win = window.open("", "lp-worksheet", "width=900,height=1100");
  if (!win) return false;
  win.document.write(html.replace("<body>", '<body onload="setTimeout(function(){window.print()},300)">'));
  win.document.close();
  win.document.title = title;
  return true;
}
