// PRACTICE SHEET — the report no competitor can print.
//
// Sound Seekers knows, with evidence, which sounds a child is weakest at
// (questMastery.weakestTargets powers the teacher dashboard). This tool turns
// that list into a printable home-practice pack: one teacher page (the
// 5-minute routine + the sort buckets) and one student page (large-type word
// grids a child points to and reads — K-2 word work never renders as
// paragraph runs, per the vendored ELA reference).
//
// The rendering pipeline in ./render/ is vendored from
// anthropics/k12-teacher-skills (Apache-2.0, Anthropic PBC + Learning
// Commons — NOTICE and LICENSE alongside). One JSON, three outputs (json /
// html preview / editable docx), and `shared` blocks guarantee the teacher
// page and the student page can never drift apart.
//
// Every word comes from wordsForTarget(), which is decodable-only at the
// given curriculum position — rubric P-E5 holds by construction, not by
// proofreading.
//
// Usage:
//   npm run export:practice-sheet -- --name "Sam" --targets sh,ch,e,ll,st --stop 13
//
//   --name     child's first name (appears on both pages)
//   --targets  comma list of graphemes/blends, weakest first (from the
//              teacher dashboard's weakest-five)
//   --stop     curriculum position 1-40 (default 40): words use only sounds
//              taught at or before this stop
//   --out      output directory (default .artifacts/practice-sheets)
//
// Output: <out>/<name>-<date>/practice.json + rendered .html/.docx per page.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { wordsForTarget } from "../../src/utils/questRounds.js";
import { heartWordsThrough, taughtThrough, QUEST_STOPS } from "../../src/data/questSequence.js";
import { displayGrapheme } from "../../src/components/quest/shells/shellContract.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");

function arg(flag, fallback = null) {
  const index = process.argv.indexOf(flag);
  return index > -1 ? process.argv[index + 1] : fallback;
}

const childName = arg("--name", "").trim();
const targets = (arg("--targets", "") || "").split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
const stopIndex = Math.max(1, Math.min(QUEST_STOPS.length, Number(arg("--stop", QUEST_STOPS.length)) || QUEST_STOPS.length));
const outBase = arg("--out", path.join(ROOT, ".artifacts", "practice-sheets"));

if (!childName || !targets.length) {
  console.error('usage: node tools/practiceSheet/buildPracticeSheet.mjs --name "Sam" --targets sh,ch,e --stop 13');
  process.exit(2);
}

// ── gather the words ─────────────────────────────────────────────────────────
const known = taughtThrough(stopIndex);
const sections = [];
const skipped = [];
for (const target of targets) {
  if (!known.has(target) && ![...known].some(g => g === target)) {
    // A blend is not in the taught set; wordsForTarget handles both kinds.
  }
  const words = wordsForTarget(target, stopIndex, { max: 6 });
  if (words.length < 2) {
    skipped.push(target);
    continue;
  }
  sections.push({ target, words });
}
if (!sections.length) {
  console.error(`none of [${targets.join(", ")}] has enough decodable words at stop ${stopIndex} — nothing to print`);
  process.exit(1);
}

const hearts = heartWordsThrough(stopIndex).slice(-6);
const readCheck = sections.slice(0, 3).map(section => section.words[0]);
const spellCheck = sections.slice(0, 2).map(section => section.words[1] || section.words[0]);
const soundList = sections.map(section => displayGrapheme(section.target)).join(", ");

// A grid a small finger can track: 3 columns, big type.
function wordGrid(words) {
  const rows = [];
  for (let i = 0; i < words.length; i += 3) {
    const row = words.slice(i, i + 3);
    while (row.length < 3) row.push("");
    rows.push(row);
  }
  return { type: "table", display: "large", rows };
}

// ── compose the document set ────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);
const material = {
  shared: {
    focus: {
      type: "labeled",
      label: "Focus sounds",
      text: `${soundList} — chosen from ${childName}'s own Sound Seekers evidence (weakest first).`
    },
    exit_ticket: {
      type: "group",
      blocks: [
        { type: "labeled", label: "Quick check (end of the week)", text: `Read: ${readCheck.join(", ")}. Spell (say the word, child writes): ${spellCheck.join(", ")}.` },
        { type: "table", headers: ["Got it", "Almost there", "Needs re-teaching"], rows: [["", "", ""]], empty_row_height_pt: 40 }
      ]
    }
  },
  theme: { accent: "forest" },
  documents: [
    {
      id: "teacher_plan",
      audience: "teacher",
      eyebrow: "Sound Seekers — home practice",
      title: `${childName} — five-minute sound practice`,
      meta: `Week of ${today} · sounds: ${soundList}`,
      sections: [
        {
          heading: "Why these sounds",
          blocks: [
            { type: "from_shared", key: "focus" },
            { type: "paragraph", text: `Each grid below appears on ${childName}'s page in large type. Every word is fully decodable with the sounds taught so far — there is nothing to guess, only to sound out.` }
          ]
        },
        {
          heading: "The five-minute routine (daily)",
          blocks: [
            { type: "list", items: [
              "Say the sound together. Child repeats it twice.",
              "Child points to each word in the grid and reads it aloud, left to right. Sound it out, then say it smoothly.",
              "A stumble is fine: say \"sound it out, one letter at a time\", and let them finish the word themselves.",
              "Pick one word. Child spells it aloud while writing it in the practice box.",
              "Stop at five minutes even mid-grid. Short and daily beats long and rare."
            ] }
          ]
        },
        {
          heading: "End of the week",
          blocks: [
            { type: "from_shared", key: "exit_ticket" },
            { type: "paragraph", text: "Sort each word into a bucket. Anything in \"Needs re-teaching\" will keep coming back inside Sound Seekers automatically — nothing is lost by being honest here." }
          ]
        }
      ]
    },
    {
      id: "student_sheet",
      audience: "student",
      eyebrow: "Sound Seekers",
      title: `${childName}'s sound trail`,
      meta: "Name: ____________",
      sections: [
        ...sections.map(section => ({
          heading: `The sound ${displayGrapheme(section.target)}`,
          blocks: [
            wordGrid(section.words),
            { type: "labeled", label: "Write one", text: "" },
            { type: "workspace", size: "small" }
          ]
        })),
        ...(hearts.length ? [{
          heading: "Tricky words (you just know them)",
          blocks: [wordGrid(hearts)]
        }] : [])
      ]
    }
  ]
};

// ── write + render ───────────────────────────────────────────────────────────
const outDir = path.join(outBase, `${childName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${today}`);
fs.mkdirSync(outDir, { recursive: true });
const jsonPath = path.join(outDir, "practice.json");
fs.writeFileSync(jsonPath, JSON.stringify(material, null, 2));

try {
  execFileSync("python3", [path.join(HERE, "render", "render_documents.py"), jsonPath, "--outdir", outDir, "--format", "both"], {
    stdio: "inherit"
  });
} catch {
  console.error("\nrender step failed — the JSON is still valid; install python-docx (pip install python-docx) and re-run.");
  process.exitCode = 1;
}

if (skipped.length) console.warn(`skipped (too few decodable words at stop ${stopIndex}): ${skipped.join(", ")}`);
console.log(`\npractice pack for ${childName} -> ${path.relative(ROOT, outDir)}`);
