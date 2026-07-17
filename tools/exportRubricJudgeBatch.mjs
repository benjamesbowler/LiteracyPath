// EXPORT: LLM-as-judge content batch.
//
// The mechanically-checkable rubric criteria run in CI (check:content-rubric).
// The other ~35 criteria need judgement, and judgement can still be a gate if
// it is cheap to run: this packs the published judge prompt (tools/rubrics/),
// the rubric CSVs, and a deterministic sample of live runtime questions into
// ONE markdown request document. Paste it into Claude (or the KIMI route),
// paste the JSON verdict back into docs/validation/, done — content quality
// gets a scored, repeatable pass instead of a vibe.
//
//   npm run export:rubric-judge            40-item sample (default)
//   npm run export:rubric-judge -- --n 80
//
// Deterministic sampling (seeded stride, not Math.random) so two exports of
// the same banks produce the same document and verdicts stay comparable.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RUBRIC_DIR = path.join(ROOT, "tools", "rubrics");
const OUT_DIR = path.join(ROOT, "docs", "validation");

const BANKS = [
  "src/data/generated/languageSkillQuestions.generated.js",
  "src/data/generated/rhyming.generated.js",
  "src/data/generated/hfwApprovedQuestionBank.generated.js"
];

function arg(flag, fallback) {
  const index = process.argv.indexOf(flag);
  return index > -1 ? process.argv[index + 1] : fallback;
}

function firstQuestionArray(module) {
  for (const value of Object.values(module)) {
    if (Array.isArray(value) && value.length && typeof value[0] === "object"
      && ("question" in value[0] || "prompt" in value[0] || "spokenPrompt" in value[0])) {
      return value;
    }
  }
  return null;
}

const sampleSize = Math.max(10, Math.min(200, Number(arg("--n", 40)) || 40));
const items = [];
for (const bank of BANKS) {
  const module = await import(path.join(ROOT, bank));
  const rows = firstQuestionArray(module);
  if (!rows) {
    console.warn(`skip (no question array found): ${bank}`);
    continue;
  }
  const take = Math.ceil(sampleSize / BANKS.length);
  const stride = Math.max(1, Math.floor(rows.length / take));
  for (let i = 0; i < rows.length && items.length < sampleSize; i += stride) {
    const row = rows[i];
    items.push({
      source: path.basename(bank),
      id: row.id || `${path.basename(bank)}#${i}`,
      grade: row.grade ?? null,
      skill: row.skill || row.skillId || null,
      passage: row.passage || null,
      question: row.question || row.prompt || null,
      choices: row.choices || null,
      answer: row.answer ?? null
    });
  }
}

if (!items.length) {
  console.error("no items sampled — bank shapes may have changed");
  process.exit(1);
}

const read = name => fs.readFileSync(path.join(RUBRIC_DIR, name), "utf8").trim();
const today = new Date().toISOString().slice(0, 10);
const outPath = path.join(OUT_DIR, `rubric-judge-request-${today}.md`);

const doc = `# Content rubric — LLM-as-judge request · ${today}

**How to run:** paste this whole document into Claude. It will return ONE JSON
array of verdicts. Save that array as
\`docs/validation/rubric-judge-verdict-${today}.json\` and commit both files.
Score each ITEM against each applicable criterion; skip criteria whose
Conditional column doesn't match the item's grade/subject.

Sample: ${items.length} items, deterministic stride across ${BANKS.length} runtime banks.

---

## Judge system prompt (verbatim, tools/rubrics/judge-prompt.txt)

\`\`\`
${read("judge-prompt.txt")}
\`\`\`

## Rubric — shared criteria (tools/rubrics/shared.csv)

\`\`\`csv
${read("shared.csv")}
\`\`\`

## Rubric — ELA overlay (tools/rubrics/ela.csv)

\`\`\`csv
${read("ela.csv")}
\`\`\`

## Items under review

\`\`\`json
${JSON.stringify(items, null, 1)}
\`\`\`
`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(outPath, doc);
console.log(`wrote ${path.relative(ROOT, outPath)} (${items.length} items)`);
