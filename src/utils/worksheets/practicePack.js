// SOUND PRACTICE PACK — the report no competitor can print, now one click
// from the teacher area.
//
// Sound Seekers knows, with evidence, which sounds a child is weakest at.
// This module turns that list into a printable home-practice pack: one
// TEACHER page (why these sounds, the five-minute routine, an end-of-week
// exit ticket sorted Got it / Almost there / Needs re-teaching) and one
// STUDENT page (large-type word grids a child points to and reads — K-2
// word work never renders as paragraph runs).
//
// The content design is ported from tools/practiceSheet/buildPracticeSheet.mjs,
// which follows the published Anthropic / Learning Commons K-2 materials
// (vendored under tools/rubrics/ and tools/practiceSheet/render/, Apache-2.0).
// The CLI renders editable .docx via Python; this module renders the same
// pack as self-contained printable HTML so it works inside the app with the
// browser's own print / save-as-PDF — exactly like worksheetBuilder.js.
//
// Every word comes from wordsForTarget(), which is decodable-only at the
// given curriculum position — rubric P-E5 ("decodable text only") holds by
// construction, not by proofreading. Deterministic: the same
// (name, targets, stopIndex, date) always produces the same bytes.
import { wordsForTarget } from "../questRounds.js";
import { heartWordsThrough, QUEST_STOPS } from "../../data/questSequence.js";

// "a_e" prints as "a–e" — the shared label rule from questLabels.js (DOM-free,
// so worksheets stay printable from node too).
import { graphemeLabel } from "../questLabels.js";
import { openHtmlDocument } from "../openHtmlDocument.js";
export const packTargetLabel = graphemeLabel;

function esc(value) {
  return String(value).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

// The child's current curriculum position, derived from the heat map the
// dashboard already has: the furthest stop with any evidence. A child with
// no evidence yet has no position (null) — and nothing worth printing.
export function packStopIndex(report) {
  let furthest = 0;
  for (const tile of report?.heat || []) {
    if (tile.bucket !== "unseen" && (Number(tile.stopIndex) || 0) > furthest) {
      furthest = Number(tile.stopIndex);
    }
  }
  return furthest > 0 ? furthest : null;
}

// Stops a teacher can pick from on the manual builder.
export function packStopOptions() {
  return QUEST_STOPS.map(stop => ({ index: stop.index, name: stop.name }));
}

// A grid a small finger can track: 3 columns, big type.
function wordGrid(words) {
  const rows = [];
  for (let i = 0; i < words.length; i += 3) {
    const row = words.slice(i, i + 3);
    while (row.length < 3) row.push("");
    rows.push(row);
  }
  return `<div class="pp-grid">${rows.map(row =>
    row.map(word => `<span class="pp-word">${esc(word)}</span>`).join("")).join("")}</div>`;
}

const PP_STYLES = `
  @page { size: A4 portrait; margin: 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Andika', 'Comic Sans MS', 'Quicksand', sans-serif; color: #14110c; }
  .page { padding: 0 0 8mm; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .pp-eyebrow { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #2e4b3e; font-weight: 700; }
  h1 { margin: 2px 0 4px; font-size: 26px; color: #2e4b3e; }
  .pp-meta { color: #64748b; font-size: 13px; margin-bottom: 14px; border-bottom: 2px solid #2e4b3e; padding-bottom: 8px; }
  h2 { font-size: 17px; color: #b8650f; margin: 18px 0 6px; }
  p { font-size: 14px; line-height: 1.55; margin: 6px 0; }
  .pp-label { font-weight: 700; color: #2e4b3e; }
  ol { font-size: 14px; line-height: 1.6; padding-left: 22px; margin: 6px 0; }
  ol li { margin-bottom: 5px; }
  .pp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 8px 0; }
  .pp-word { font-size: 30px; text-align: center; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 10px 4px; min-height: 34px; }
  .pp-ticket { width: 100%; border-collapse: collapse; margin: 8px 0; }
  .pp-ticket th { border: 1.5px solid #94a3b8; padding: 6px; font-size: 14px; background: #f4f7f4; }
  .pp-ticket td { border: 1.5px solid #94a3b8; height: 56px; }
  .pp-write { border-bottom: 2px solid #cbd5e1; height: 30px; margin: 8px 0 4px; }
  .pp-box { border: 2px dashed #cbd5e1; border-radius: 10px; height: 64px; margin: 4px 0 10px; }
  .pp-footer { margin-top: 10px; text-align: center; color: #98a2b3; font-size: 11px; }
`;

// Build the printable two-page pack. Returns { title, html, sections, skipped }
// so callers (and tests) can see exactly which sounds made the page and which
// were skipped for having too few decodable words at this stop.
export function buildPracticePackDocument({ name, targets = [], stopIndex, date } = {}) {
  const childName = String(name || "").trim();
  if (!childName) throw new Error("The pack needs the child's first name.");
  // Teachers naturally type "a-e" for the split digraph; the curriculum id is
  // "a_e". Accept hyphen and en dash as the same thing.
  const cleanTargets = [...new Set(targets
    .map(t => String(t || "").trim().toLowerCase().replace(/[-–]/g, "_"))
    .filter(Boolean))].slice(0, 6);
  if (!cleanTargets.length) throw new Error("Pick at least one sound to practise.");
  const stop = Math.max(1, Math.min(QUEST_STOPS.length, Number(stopIndex) || QUEST_STOPS.length));
  const today = date || new Date().toISOString().slice(0, 10);

  const sections = [];
  const skipped = [];
  for (const target of cleanTargets) {
    const words = wordsForTarget(target, stop, { max: 6 });
    if (words.length < 2) {
      skipped.push(target);
      continue;
    }
    sections.push({ target, label: packTargetLabel(target), words });
  }
  if (!sections.length) {
    throw new Error(`None of ${cleanTargets.join(", ")} has enough decodable words at stop ${stop} — nothing to print.`);
  }

  const hearts = heartWordsThrough(stop).slice(-6);
  const readCheck = sections.slice(0, 3).map(section => section.words[0]);
  const spellCheck = sections.slice(0, 2).map(section => section.words[1] || section.words[0]);
  const soundList = sections.map(section => section.label).join(", ");

  const teacherPage = `<section class="page">
    <div class="pp-eyebrow">Sound Seekers — home practice</div>
    <h1>${esc(childName)} — five-minute sound practice</h1>
    <div class="pp-meta">Week of ${esc(today)} · sounds: ${esc(soundList)}</div>
    <h2>Why these sounds</h2>
    <p><span class="pp-label">Focus sounds:</span> ${esc(soundList)} — chosen from ${esc(childName)}'s own Sound Seekers evidence (weakest first).</p>
    <p>Each grid below appears on ${esc(childName)}'s page in large type. Every word is fully decodable with the sounds taught so far — there is nothing to guess, only to sound out.</p>
    <h2>The five-minute routine (daily)</h2>
    <ol>
      <li>Say the sound together. Child repeats it twice.</li>
      <li>Child points to each word in the grid and reads it aloud, left to right. Sound it out, then say it smoothly.</li>
      <li>A stumble is fine: say &quot;sound it out, one letter at a time&quot;, and let them finish the word themselves.</li>
      <li>Pick one word. Child spells it aloud while writing it in the practice box.</li>
      <li>Stop at five minutes even mid-grid. Short and daily beats long and rare.</li>
    </ol>
    <h2>End of the week</h2>
    <p><span class="pp-label">Quick check:</span> Read: ${esc(readCheck.join(", "))}. Spell (say the word, child writes): ${esc(spellCheck.join(", "))}.</p>
    <table class="pp-ticket"><thead><tr><th>Got it</th><th>Almost there</th><th>Needs re-teaching</th></tr></thead>
      <tbody><tr><td></td><td></td><td></td></tr></tbody></table>
    <p>Sort each word into a bucket. Anything in &quot;Needs re-teaching&quot; will keep coming back inside Sound Seekers automatically — nothing is lost by being honest here.</p>
    <div class="pp-footer">Literacy Guide · Sound Seekers practice pack · teacher page</div>
  </section>`;

  const studentPage = `<section class="page">
    <div class="pp-eyebrow">Sound Seekers</div>
    <h1>${esc(childName)}'s sound trail</h1>
    <div class="pp-meta">Name: ____________</div>
    ${sections.map(section => `
      <h2>The sound ${esc(section.label)}</h2>
      ${wordGrid(section.words)}
      <p class="pp-label">Write one</p>
      <div class="pp-write"></div>
      <div class="pp-box"></div>`).join("")}
    ${hearts.length ? `<h2>Tricky words (you just know them)</h2>${wordGrid(hearts)}` : ""}
    <div class="pp-footer">Literacy Guide · Sound Seekers practice pack · student page</div>
  </section>`;

  const title = `${childName} — sound practice pack`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
    <link href="https://fonts.googleapis.com/css2?family=Andika:wght@400;700&display=swap" rel="stylesheet">
    <style>${PP_STYLES}</style></head>
    <body>${teacherPage}${studentPage}</body></html>`;
  return { title, html, sections, skipped };
}

// Open the pack in a new window and trigger print / save-as-PDF. Returns the
// build result (so callers can surface skipped sounds), or false when the
// browser blocked the pop-up.
export function printPracticePack(options) {
  const result = buildPracticePackDocument(options);
  const opened = openHtmlDocument({
    html: result.html,
    name: "lp-practice-pack",
    features: "width=900,height=1100",
    autoPrint: true
  });
  if (!opened.ok) return false;
  return result;
}
