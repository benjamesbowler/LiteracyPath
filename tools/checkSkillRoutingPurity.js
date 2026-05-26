import path from "node:path";

import { getQuestionRoutingIssue, getQuestionRoutingFormat } from "../src/data/skillTemplateRouting.js";
import { getRhymeGroup } from "../src/data/rhymeGroups.js";
import {
  inferPatternForSkill,
  normalizeWord,
  repoRoot,
  selectableRuntimeQuestionsForSkill,
  writeFile
} from "./phonicsRuntimeUtils.js";

const skillChecks = [
  {
    id: "final_sounds",
    label: "Final Sounds",
    forbiddenPrompt: /\b(start|starts|starting|first|beginning|initial)\b/i
  },
  {
    id: "cvc_short_vowels",
    label: "CVC Short Vowels",
    forbiddenPrompt: /\b(start|starts|starting|first|beginning|initial|end|ends|ending|final)\b/i
  },
  {
    id: "rhyming",
    label: "Rhyming Words",
    forbiddenPrompt: /\b(start|starts|starting|first|beginning|initial|end|ends|ending|final)\b/i,
    requireRime: true
  }
];

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function rotate(items, count) {
  if (!items.length) return [];
  const offset = count % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function samplePureRound(items, skillId, roundIndex) {
  const rotated = rotate(items, roundIndex * 7);
  const selected = [];
  const usedWords = new Set();
  const usedPatterns = new Set();

  for (const item of rotated) {
    const word = normalizeWord(item.targetWord || item.answer || item.correctAnswer);
    const pattern = inferPatternForSkill(skillId, item);
    if (word && usedWords.has(word)) continue;
    if (pattern && usedPatterns.has(pattern) && selected.length < 12) continue;
    selected.push(item);
    if (word) usedWords.add(word);
    if (pattern) usedPatterns.add(pattern);
    if (selected.length === 15) break;
  }

  if (selected.length < 15) {
    for (const item of rotated) {
      if (selected.includes(item)) continue;
      selected.push(item);
      if (selected.length === 15) break;
    }
  }

  return selected;
}

function textForQuestion(question = {}) {
  return [question.prompt, question.question, question.spokenPrompt].filter(Boolean).join(" ");
}

const failures = [];
const sections = [];

for (const skill of skillChecks) {
  const pool = selectableRuntimeQuestionsForSkill(skill.id);
  const poolFailures = [];
  const roundRows = [];

  pool.forEach(question => {
    const routeIssue = getQuestionRoutingIssue(question, skill.id);
    if (routeIssue) poolFailures.push(`${question.id}: ${routeIssue}`);
    if (skill.forbiddenPrompt.test(textForQuestion(question))) {
      poolFailures.push(`${question.id}: forbidden prompt language "${textForQuestion(question)}"`);
    }
    if (skill.requireRime) {
      const pattern = inferPatternForSkill(skill.id, question);
      const answerGroup = getRhymeGroup(question.correctAnswer || question.answer || "");
      if (!pattern && !answerGroup) {
        poolFailures.push(`${question.id}: missing rhyme/rime metadata.`);
      }
    }
  });

  for (let roundIndex = 0; roundIndex < 20; roundIndex += 1) {
    const round = samplePureRound(pool, skill.id, roundIndex);
    if (pool.length >= 15 && round.length !== 15) {
      poolFailures.push(`${skill.label} round ${roundIndex + 1} returned ${round.length}/15.`);
    }
    round.forEach(question => {
      const routeIssue = getQuestionRoutingIssue(question, skill.id);
      if (routeIssue) poolFailures.push(`${skill.label} round ${roundIndex + 1} ${question.id}: ${routeIssue}`);
      if (skill.forbiddenPrompt.test(textForQuestion(question))) {
        poolFailures.push(`${skill.label} round ${roundIndex + 1} ${question.id}: forbidden prompt language.`);
      }
    });
    roundRows.push(`| ${roundIndex + 1} | ${round.length} | ${unique(round.map(item => getQuestionRoutingFormat(item))).join(", ")} | ${round.map(item => item.targetWord || item.correctAnswer || item.id).join(", ")} |`);
  }

  failures.push(...poolFailures);
  sections.push(`## ${skill.label}

- Runtime-selectable pool: ${pool.length}
- Routing/purity failures: ${poolFailures.length}

| Simulated Round | Questions | Formats | Target Words |
| ---: | ---: | --- | --- |
${roundRows.join("\n")}

### Failures

${poolFailures.length ? poolFailures.map(item => `- ${item}`).join("\n") : "- none"}
`);
}

writeFile(
  path.join(repoRoot, "docs/validation/skill_routing_purity_audit.md"),
  `# Skill Routing Purity Audit

Generated: ${new Date().toISOString()}

## Summary

- Fatal routing failures: ${failures.length}
- Rhyming, CVC Short Vowels, and Final Sounds were checked for cross-skill contamination across 20 simulated rounds each.

${sections.join("\n")}
`
);

console.log(`Skill routing purity failures: ${failures.length}`);
console.log("Wrote docs/validation/skill_routing_purity_audit.md");

if (failures.length) {
  failures.slice(0, 50).forEach(failure => console.error(`- ${failure}`));
  if (failures.length > 50) console.error(`...and ${failures.length - 50} more`);
  process.exit(1);
}

console.log("Skill routing purity check passed.");
