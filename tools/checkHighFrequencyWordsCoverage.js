import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getQuestionChoices,
  getSkillBankItems,
  runtimeQuestionSignature
} from "../src/content/skillMedia/skillAssetRegistry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const roundLength = 15;
const canonicalSkillId = "high_frequency_words";
const acceptedTemplates = new Set([
  "LISTEN_FIND_WORD",
  "READ_FIND_WORD",
  "COMPREHENSION",
  "FILL_MISSING_WORD",
  "MATCH_WORD_TO_AUDIO",
  "SENTENCE_RECOGNITION",
  "SPELL_SIGHT_WORD",
  "UNKNOWN",
  "cloze_choice",
  "multiple_choice"
]);

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function markdownTable(headers, rows) {
  if (!rows.length) return "_None._";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(value => String(value ?? "").replace(/\|/g, "\\|")).join(" | ")} |`)
  ].join("\n");
}

function normalize(value = "") {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function getTemplate(item) {
  const raw = item.raw || {};
  return raw.templateType || raw.formatType || raw.questionType || "UNKNOWN";
}

function buildRound(items) {
  const selected = [];
  const usedTargets = new Set();
  const shuffled = [...items].sort((a, b) => {
    const levelDiff = Number(a.level || 1) - Number(b.level || 1);
    if (levelDiff) return levelDiff;
    return String(a.id).localeCompare(String(b.id));
  });

  for (const item of shuffled) {
    if (selected.length >= roundLength) break;
    if (usedTargets.has(item.target)) continue;
    selected.push(item);
    usedTargets.add(item.target);
  }

  if (selected.length < roundLength) {
    for (const item of shuffled) {
      if (selected.length >= roundLength) break;
      if (selected.some(existing => existing.id === item.id)) continue;
      selected.push(item);
    }
  }

  return selected;
}

const allItems = getSkillBankItems();
const hfwItems = allItems.filter(item => item.skillId === canonicalSkillId);
const activeItems = hfwItems.filter(item => item.active !== false);
const signatures = activeItems.map(item => item.signature || runtimeQuestionSignature(item.raw || item));
const duplicateSignatures = [...new Set(signatures.filter((signature, index) => signature && signatures.indexOf(signature) !== index))];
const uniqueTargets = [...new Set(activeItems.map(item => item.target || normalize(item.targetWord)).filter(Boolean))].sort();
const byLevel = {};
const byTemplate = {};
const failures = [];
const warnings = [];
const invalidRows = [];

activeItems.forEach(item => {
  const template = getTemplate(item);
  byLevel[item.level] = (byLevel[item.level] || 0) + 1;
  byTemplate[template] = (byTemplate[template] || 0) + 1;

  const choices = getQuestionChoices(item.raw || {});
  const correct = normalize(item.correctAnswer || item.raw?.correctAnswer || item.raw?.answer);
  if (!correct) {
    invalidRows.push([item.id, item.level, template, item.targetWord, "Missing correct answer."]);
  }
  if (choices.length && !choices.map(normalize).includes(correct)) {
    invalidRows.push([item.id, item.level, template, item.targetWord, `Correct answer "${correct}" is not in visible options.`]);
  }
  if (choices.length && new Set(choices.map(normalize)).size !== choices.length) {
    invalidRows.push([item.id, item.level, template, item.targetWord, "Duplicate answer options."]);
  }
  if (!acceptedTemplates.has(template)) {
    warnings.push(`${item.id}: template ${template} is not in the preferred HFW template list; review if this is not a pure sight-word task.`);
  }
});

const sampleRound = buildRound(activeItems);

if (activeItems.length < 150) failures.push(`High Frequency Words has ${activeItems.length} active questions; expected at least 150.`);
if (uniqueTargets.length < 45) failures.push(`High Frequency Words has ${uniqueTargets.length} unique target words; expected at least 45 for Pre-Primer/Primer coverage.`);
if (sampleRound.length < roundLength) failures.push(`High Frequency Words can only build a ${sampleRound.length}-question round; expected ${roundLength}.`);
if (duplicateSignatures.length) warnings.push(`Duplicate-equivalent HFW signatures detected: ${duplicateSignatures.length}. Runtime selector should canonicalize these.`);
if (invalidRows.length) failures.push(`${invalidRows.length} active HFW questions have invalid answer structure.`);

const doc = `# High Frequency Words Coverage Audit

Generated: ${new Date().toISOString()}

## Summary

- Canonical skill id: \`${canonicalSkillId}\`
- Aliases accepted by the skill registry: \`sight_words\`, \`highFrequencyWords\`, \`hfw\`, \`hfw_1_25\`, \`hfw_26_50\`, \`hfw_51_100\`
- Active HFW questions: ${activeItems.length}
- Unique target words: ${uniqueTargets.length}
- Sample round size: ${sampleRound.length}/${roundLength}
- Duplicate-equivalent signatures: ${duplicateSignatures.length}
- Structural failures: ${failures.length}
- Warnings: ${warnings.length}

## Counts By Level

${markdownTable(["Level", "Active Questions"], Object.entries(byLevel).sort(([a], [b]) => Number(a) - Number(b)).map(([level, count]) => [level, count]))}

## Counts By Template

${markdownTable(["Template", "Active Questions"], Object.entries(byTemplate).sort(([a], [b]) => a.localeCompare(b)).map(([template, count]) => [template, count]))}

## Sample 15-Question Round

${markdownTable(["Question ID", "Level", "Target Word", "Template"], sampleRound.map(item => [item.id, item.level, item.targetWord || item.target, getTemplate(item)]))}

## Invalid Active Questions

${markdownTable(["Question ID", "Level", "Template", "Target Word", "Issue"], invalidRows)}

## Warnings

${warnings.length ? warnings.map(warning => `- ${warning}`).join("\n") : "_None._"}
`;

write(path.join(rootDir, "docs", "validation", "high_frequency_words_coverage_audit.md"), doc);

console.log(`High Frequency Words active questions: ${activeItems.length}`);
console.log(`High Frequency Words unique targets: ${uniqueTargets.length}`);
console.log(`Sample round size: ${sampleRound.length}/${roundLength}`);
console.log("Wrote docs/validation/high_frequency_words_coverage_audit.md");

if (failures.length) {
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("High Frequency Words coverage audit passed.");
