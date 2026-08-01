// Independent release audit for the Skills Assessment v3 rebuild.
//
// This intentionally does not reuse gate.mjs verdicts. It rebuilds the authored
// banks, checks the published/runtime contract from a second direction, and
// emits evidence that can be reviewed without trusting the release gate.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  AUTHORING_DIR,
  ROOT,
  expandBank,
  makeImageResolver,
  norm,
  optionSetSignature,
  promptAnswerSignature,
  shingles,
  jaccard
} from "./lib.mjs";
import {
  ASSESSMENT_REBUILD_STANDARD_VERSION,
  skillBlueprints
} from "../../src/content/blueprints/skillBlueprints.js";
import {
  assessmentRebuildStatusBySkillId,
  assessmentRebuildStatusVersion
} from "../../src/content/assessments/v3/assessmentRebuildStatus.generated.js";

const OUT_JSON = path.join(ROOT, "docs", "validation", "assessment_rebuild_independent_audit.json");
const OUT_MD = path.join(ROOT, "docs", "validation", "assessment_rebuild_independent_audit.md");

const sourceFiles = fs.readdirSync(AUTHORING_DIR)
  .filter(file => file.endsWith(".mjs"))
  .sort();

const banks = new Map();
for (const file of sourceFiles) {
  const skillId = file.replace(/\.mjs$/, "");
  const blueprint = skillBlueprints[skillId];
  if (!blueprint) continue;
  const source = (await import(`${pathToFileURL(path.join(AUTHORING_DIR, file)).href}?audit=${Date.now()}`)).default;
  banks.set(skillId, expandBank(source, blueprint, source.imageResolver || makeImageResolver()));
}

const allItems = [...banks.values()].flat();
const formKey = item => `${item.level}:${item.form}`;
const textForSimilarity = item => [item.prompt, item.sentence, item.passage].filter(Boolean).join(" ");
const instructionSkeleton = text => norm(text)
  .replace(/\b(?:which|choose|pick|tap|read|listen|look|word|picture|sentence|passage|answer|best|one|this|the|a|an)\b/g, " ")
  .replace(/\b[A-Z][a-z]+\b/g, "@")
  .replace(/\b\d+\b/g, "#")
  .replace(/[^a-z@# ]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

function countBy(values) {
  const out = new Map();
  for (const value of values) out.set(value, (out.get(value) || 0) + 1);
  return [...out.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
}

function duplicateGroups(items, signatureFn) {
  const groups = new Map();
  for (const item of items) {
    const signature = signatureFn(item);
    if (!signature) continue;
    const list = groups.get(signature) || [];
    list.push(item.id);
    groups.set(signature, list);
  }
  return [...groups.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([signature, ids]) => ({ signature, ids }));
}

function similarityPairs(items) {
  const candidates = items
    .filter(item => textForSimilarity(item).split(/\s+/).length >= 8)
    .map(item => ({
      item,
      bigrams: shingles(instructionSkeleton(textForSimilarity(item)), 2),
      trigrams: shingles(instructionSkeleton(textForSimilarity(item)), 3),
      fourgrams: shingles(instructionSkeleton(textForSimilarity(item)), 4)
    }));
  const pairs = [];
  for (let left = 0; left < candidates.length; left += 1) {
    for (let right = left + 1; right < candidates.length; right += 1) {
      const a = candidates[left];
      const b = candidates[right];
      const score2 = jaccard(a.bigrams, b.bigrams);
      const score3 = jaccard(a.trigrams, b.trigrams);
      const score4 = jaccard(a.fourgrams, b.fourgrams);
      if (score4 >= 0.35 || score3 >= 0.55 || score2 >= 0.72) {
        pairs.push({
          left: a.item.id,
          right: b.item.id,
          score2: Number(score2.toFixed(3)),
          score3: Number(score3.toFixed(3)),
          score4: Number(score4.toFixed(3))
        });
      }
    }
  }
  return pairs.sort((a, b) => b.score4 - a.score4 || b.score3 - a.score3 || b.score2 - a.score2);
}

function auditSkill(skillId, items) {
  const blueprint = skillBlueprints[skillId];
  const status = assessmentRebuildStatusBySkillId[skillId] || null;
  const exactPromptAnswers = duplicateGroups(items, promptAnswerSignature);
  const exactOptionSets = duplicateGroups(
    items.filter(item => !item.soundTiles?.length && !item.letterTiles?.length),
    optionSetSignature
  );
  const exactPassages = duplicateGroups(items, item => norm(item.passage));
  const nearSimilar = similarityPairs(items);
  const malformedAudio = items.filter(item => (
    /\bhmm\b/i.test(item.spokenPrompt || "")
    || /\bblank\b/i.test(item.spokenPrompt || "")
    || /_{3,}/.test(item.spokenPrompt || "")
  )).map(item => item.id);
  const missingNotes = items.filter(item => !String(item.notes || "").trim()).map(item => item.id);
  const level2WithoutDemandNote = items
    .filter(item => item.level === 2 && !item.retentionOnly && String(item.notes || "").trim().length < 12)
    .map(item => item.id);
  const mediaMissing = items.filter(item => {
    if (item.mediaTier !== "image-required") return false;
    if (item.imagePath) return !fs.existsSync(path.join(ROOT, "public", item.imagePath.replace(/^\//, "")));
    if (item.imageCards?.length) {
      return item.imageCards.some(card => (
        !card.imagePath
        || !fs.existsSync(path.join(ROOT, "public", card.imagePath.replace(/^\//, "")))
      ));
    }
    return true;
  }).map(item => item.id);

  const answerPositions = {};
  for (const [bucket, bucketItems] of Object.entries(Object.groupBy(items.filter(item => item.choices.length), formKey))) {
    const positions = [0, 0, 0, 0];
    for (const item of bucketItems) {
      const index = item.choices.findIndex(choice => norm(choice) === norm(item.answer));
      if (index >= 0) positions[index] = (positions[index] || 0) + 1;
    }
    answerPositions[bucket] = positions;
  }
  const unbalancedAnswerBuckets = Object.entries(answerPositions)
    .filter(([, positions]) => {
      const total = positions.reduce((sum, value) => sum + value, 0);
      return total >= 4 && Math.max(...positions) / total > 0.35;
    })
    .map(([bucket, positions]) => ({ bucket, positions }));

  const provenance = {
    authors: countBy(items.map(item => item.provenance?.author || "")),
    reviewed: items.filter(item => item.provenance?.reviewedBy?.length).length,
    signedOff: items.filter(item => item.provenance?.signedOffBy).length
  };

  const defects = [];
  if (!status?.cutover) defects.push("No published v3 cutover status.");
  if (status?.standardVersion !== ASSESSMENT_REBUILD_STANDARD_VERSION) defects.push("Published status version does not match the blueprint standard.");
  if (exactPromptAnswers.length) defects.push(`${exactPromptAnswers.length} duplicate prompt/passage/answer signatures.`);
  if (exactOptionSets.length) defects.push(`${exactOptionSets.length} repeated option sets.`);
  if (exactPassages.length) defects.push(`${exactPassages.length} passages are reused.`);
  if (nearSimilar.length) defects.push(`${nearSimilar.length} near-similar item pairs exceed the independent anti-template threshold.`);
  if (unbalancedAnswerBuckets.length) defects.push(`${unbalancedAnswerBuckets.length} level/form buckets exceed the 35% keyed-position cap.`);
  if (malformedAudio.length) defects.push(`${malformedAudio.length} spoken prompts say “hmm”, “blank”, or literal underscores instead of a silent cloze beat.`);
  if (missingNotes.length) defects.push(`${missingNotes.length} items have no author note.`);
  if (level2WithoutDemandNote.length) defects.push(`${level2WithoutDemandNote.length} Level 2 items do not name a meaningful added demand.`);
  if (mediaMissing.length) defects.push(`${mediaMissing.length} image-required items have unresolved files.`);

  return {
    skillId,
    itemCount: items.length,
    blueprintFamily: blueprint.family,
    forms: countBy(items.map(formKey)),
    formats: countBy(items.map(item => item.formatType)),
    provenance,
    exactPromptAnswers,
    exactOptionSets,
    exactPassages,
    nearSimilar,
    answerPositions,
    unbalancedAnswerBuckets,
    malformedAudio,
    missingNotes,
    level2WithoutDemandNote,
    mediaMissing,
    defects,
    provisionalScore: Math.max(0, 10 - Math.min(10, defects.length))
  };
}

const skillResults = [...banks.entries()].map(([skillId, items]) => auditSkill(skillId, items));

const productionFiles = {
  roundController: fs.readFileSync(path.join(ROOT, "src", "appState", "assessmentRoundController.js"), "utf8"),
  reportingSystem: fs.readFileSync(path.join(ROOT, "src", "data", "reportingSystem.js"), "utf8"),
  reportingWorkspace: fs.readFileSync(path.join(ROOT, "src", "data", "studentReportingWorkspaceModel.js"), "utf8"),
  gate: fs.readFileSync(path.join(ROOT, "tools", "assessmentRebuild", "gate.mjs"), "utf8")
};

const systemic = [
  {
    id: "RUNTIME-LEGACY-MASTERY",
    pass: productionFiles.roundController.includes("computeSkillStatus("),
    evidence: "assessmentRoundController must call computeSkillStatus for v3 progression."
  },
  {
    id: "REPORT-CLASS-ONE-BRAIN",
    pass: productionFiles.reportingSystem.includes("computeSkillStatus("),
    evidence: "reportingSystem must call computeSkillStatus for v3 skill status."
  },
  {
    id: "REPORT-STUDENT-ONE-BRAIN",
    pass: productionFiles.reportingWorkspace.includes("computeSkillStatus("),
    evidence: "studentReportingWorkspaceModel must call computeSkillStatus for v3 skill status."
  },
  {
    id: "GATE-G6",
    pass: /G6_[A-Za-z0-9_]+/.test(productionFiles.gate),
    evidence: "The release gate must include the one-report integration gate."
  },
  {
    id: "NO-ROUTINE-SIGNOFF-GATE",
    pass: !/hardGateKeys[^;]*human_signoff/s.test(productionFiles.gate),
    evidence: "Routine named human sign-off must not override or block the machine-verifiable publication policy."
  },
  {
    id: "GATE-SCANNER-5-PERCENT",
    pass: /leakShare\s*<\s*0\.05/.test(productionFiles.gate),
    evidence: "SIM-SCANNER release threshold must be <5%."
  },
  {
    id: "GATE-GUESS-10000",
    pass: /GUESS_TRIALS\s*=[^;\n]*10_?000/.test(productionFiles.gate),
    evidence: "SIM-GUESS must run 10,000 trials."
  },
  {
    id: "GATE-REGRESSION-ASSERTED",
    pass: /G4_mastery_logic[\s\S]{0,500}regress/i.test(productionFiles.gate)
      && !/void regressLedgerRun/.test(productionFiles.gate),
    evidence: "SIM-REGRESS must change the G4 verdict, not be computed and discarded."
  }
];

const crossSkillPassageReuse = duplicateGroups(allItems, item => norm(item.passage));
const result = {
  generatedAt: new Date().toISOString(),
  standardVersion: ASSESSMENT_REBUILD_STANDARD_VERSION,
  publishedStatusVersion: assessmentRebuildStatusVersion,
  bankCount: banks.size,
  itemCount: allItems.length,
  signedOffItems: allItems.filter(item => item.provenance?.signedOffBy).length,
  reviewedItems: allItems.filter(item => item.provenance?.reviewedBy?.length).length,
  systemic,
  crossSkillPassageReuse,
  skills: skillResults,
  verdict: systemic.every(row => row.pass)
    && skillResults.every(row => row.defects.length === 0)
    ? "release-ready"
    : "not-release-ready"
};

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, `${JSON.stringify(result, null, 2)}\n`);

const systemicRows = systemic
  .map(row => `| ${row.id} | ${row.pass ? "PASS" : "FAIL"} | ${row.evidence} |`)
  .join("\n");
const skillRows = skillResults
  .map(row => `| ${row.skillId} | ${row.itemCount} | ${row.provenance.signedOff}/${row.itemCount} | ${row.nearSimilar.length} | ${row.unbalancedAnswerBuckets.length} | ${row.malformedAudio.length} | ${row.defects.length ? row.defects.join(" ") : "No mechanical defects found."} |`)
  .join("\n");
fs.writeFileSync(OUT_MD, `# Independent Skills Assessment v3 audit

Generated ${result.generatedAt}. This report deliberately does not inherit the verdict from \`gate.mjs\`.

## Verdict

**${result.verdict === "release-ready" ? "RELEASE READY" : "NOT RELEASE READY"}**

- Banks: ${result.bankCount}/30
- Items: ${result.itemCount}
- Independently reviewed items recorded in provenance: ${result.reviewedItems}/${result.itemCount}
- Optional named sign-offs recorded in provenance: ${result.signedOffItems}/${result.itemCount}
- Cross-skill reused passages: ${crossSkillPassageReuse.length}

## Systemic gates

| Gate | Result | Requirement |
|---|---|---|
${systemicRows}

## Per-skill mechanical audit

| Skill | Items | Optional sign-offs | Near-template pairs | Answer-position buckets over cap | Broken cloze speech | Findings |
|---|---:|---:|---:|---:|---:|---|
${skillRows}

## Interpretation

Mechanical checks can disprove release readiness; they cannot prove that every answer is pedagogically defensible. The required human review remains a separate hard gate, exactly as AUTHORING_STANDARDS §7 specifies.
`);

console.log(JSON.stringify({
  verdict: result.verdict,
  banks: result.bankCount,
  items: result.itemCount,
  systemicFailures: systemic.filter(row => !row.pass).map(row => row.id),
  skillsWithFindings: skillResults.filter(row => row.defects.length).length,
  signedOff: result.signedOffItems,
  reviewed: result.reviewedItems,
  report: path.relative(ROOT, OUT_MD)
}, null, 2));

process.exit(result.verdict === "release-ready" ? 0 : 1);
