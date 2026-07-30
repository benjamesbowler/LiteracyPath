// Skills Assessment Rebuild v3 — the honest release gate.
//
//   node tools/assessmentRebuild/gate.mjs [--skill <id>] [--write]
//
// Builds every authored v3 bank, runs lints + the five simulations, and (with
// --write) regenerates:
//   - src/data/v3/banks/<skill>.v3.generated.js
//   - src/content/assessments/v3/assessmentRebuildStatus.generated.js
//   - docs/validation/assessment_rebuild_gate.md (+ .json)
//   - docs/skills-assessment-rebuild/MEDIA_REQUEST.md (+ .json)
// Exit code is non-zero when ANY cutover skill has a red gate. "not run" is
// reported as its own state, never as a pass.

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import {
  ROOT, AUTHORING_DIR, STATUS_FILE, REPORT_DIR, V3_SOURCE,
  expandBank, lintBank, simulate, simulateRegression, scannerAnswer, writeGeneratedBank, loadLexicon,
  optionSetSignature, promptAnswerSignature, norm, guessProbability, makeImageResolver
} from "./lib.mjs";
import { skillBlueprints, ASSESSMENT_REBUILD_STANDARD_VERSION } from "../../src/content/blueprints/skillBlueprints.js";
import * as policy from "../../src/policy/skillStatusPolicy.js";
import { buildMediaRequest } from "./mediaRequest.mjs";

const args = process.argv.slice(2);
const onlySkill = args.includes("--skill") ? args[args.indexOf("--skill") + 1] : null;
const write = args.includes("--write");
const fast = args.includes("--fast");

function productionUsesOneStatusBrain() {
  const files = [
    path.join(ROOT, "src", "appState", "assessmentRoundController.js"),
    path.join(ROOT, "src", "data", "reportingSystem.js"),
    path.join(ROOT, "src", "data", "studentReportingWorkspaceModel.js")
  ];
  return files.every(file => {
    const source = fs.readFileSync(file, "utf8");
    return source.includes("computeSkillStatus");
  });
}

function seededRandom(seedText) {
  let seed = 2166136261;
  for (const char of String(seedText)) {
    seed ^= char.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

const oneStatusBrain = productionUsesOneStatusBrain();

const lexicon = loadLexicon();
const results = [];
const allBanks = new Map();

const authoringFiles = fs.existsSync(AUTHORING_DIR)
  ? fs.readdirSync(AUTHORING_DIR).filter(f => f.endsWith(".mjs")).sort()
  : [];

for (const file of authoringFiles) {
  const skillId = file.replace(/\.mjs$/, "");
  if (onlySkill && skillId !== onlySkill) continue;
  const blueprint = skillBlueprints[skillId];
  const gates = {};
  const detail = { lint: [], sims: {} };
  let items = [];

  if (!blueprint) {
    results.push({ skillId, error: "no blueprint", gates: { G1_structure: false } });
    continue;
  }

  try {
    const source = (await import(path.join(AUTHORING_DIR, file))).default;
    // Every bank expands with a real resolver: an authoring file may bring its
    // own, but img/cards items must NEVER silently expand image-less (that hole
    // shipped image-required items with no imagePath — caught by the live
    // browser critic, 2026-07-30).
    items = expandBank(source, blueprint, source.imageResolver || makeImageResolver());
    allBanks.set(skillId, items);

    // G1 + G2 + G3 — lints
    const lintIssues = lintBank(items, blueprint, { ...lexicon, imageWords: new Set() });
    detail.lint = lintIssues;
    gates.G1_structure = !lintIssues.some(i => ["L-SCHEMA", "L-COVER", "L-MEDIA"].includes(i.code));
    gates.G2_originality = !lintIssues.some(i => i.code.startsWith("L-UNIQ"));
    gates.G3_answer_integrity = !lintIssues.some(i => ["L-DIST", "L-REALWORD", "L-LEX", "L-GRAM", "L-READ", "L-KEY-BALANCE", "L-AMBIG"].includes(i.code));

    // G4 — mastery logic sims
    const perfect = await simulate(items, blueprint, { policy, answerFn: () => true });
    detail.sims.pass = {
      status: perfect.final.status,
      sittings: perfect.sittings,
      levelSittings: perfect.levelSittings,
      repeats: perfect.repeats.length
    };
    const passOk = perfect.final.status === "secure"
      && perfect.levelSittings[1] <= (blueprint.passBudgetSittings || 6)
      && perfect.levelSittings[2] <= (blueprint.passBudgetSittings || 6);

    let guessPasses = 0;
    const GUESS_TRIALS = fast ? 300 : 10_000;
    const random = seededRandom(`${skillId}:${ASSESSMENT_REBUILD_STANDARD_VERSION}`);
    for (let t = 0; t < GUESS_TRIALS; t++) {
      const guess = await simulate(items, blueprint, { policy, answerFn: item => random() < guessProbability(item), maxSittings: 6 });
      if (["level_1_passed", "level_2_passed", "secure"].includes(guess.final.status)) guessPasses++;
    }
    const guessPassRate = guessPasses / GUESS_TRIALS;
    // With the product's explicit 70% phase rule, a blind guesser has a tiny
    // but non-zero mathematical chance of passing two phases across repeated
    // attempts. Requiring exactly zero successes makes the gate depend on
    // sample luck. The full run still caps blind-guess progression below 0.1%;
    // the 300-trial smoke run allows one isolated success.
    const guessSimulationPass = fast
      ? guessPasses <= 1
      : guessPassRate < 0.001;
    detail.sims.guess = {
      trials: GUESS_TRIALS,
      passes: guessPasses,
      passRate: guessPassRate,
      threshold: fast ? "at most 1 smoke-trial pass" : "<0.001"
    };

    const scanner = await simulate(items, blueprint, {
      policy,
      answerFn: item => {
        const leak = scannerAnswer(item);
        if (leak && norm(leak) === norm(item.answer)) return true;
        return random() < 1 / Math.max(2, item.choices.length || 4);
      },
      maxSittings: 6
    });
    const scannerLeaks = items.filter(i => {
      if (i.scannerExpected) return false; // blueprint-documented tier exemption
      const leak = scannerAnswer(i);
      return leak && norm(leak) === norm(i.answer);
    });
    detail.sims.scanner = {
      finalStatus: scanner.final.status,
      leakyItems: scannerLeaks.length,
      leakShare: items.length ? scannerLeaks.length / items.length : 0
    };

    const regression = await simulateRegression(items, blueprint, { policy });
    detail.sims.regression = {
      afterFailure: regression.afterFailure?.status,
      failureNeedsReview: regression.afterFailure?.needsReview,
      afterClean: regression.afterClean?.status,
      cleanNeedsReview: regression.afterClean?.needsReview,
      afterRetentionFailure: regression.afterRetentionFailure?.status,
      retentionNeedsReview: regression.afterRetentionFailure?.needsReview,
      pass: regression.pass
    };
    gates.G4_mastery_logic = passOk
      && guessSimulationPass
      && detail.sims.scanner.leakShare < 0.05
      && regression.pass;

    // G5 — no repeats and no undersized "completed" sittings across the pass
    // budget + retention. A bank that runs out after 4 questions cannot claim
    // to support a fixed 10-question administration.
    gates.G5_no_repeats =
      perfect.repeats.length === 0
      && perfect.shortSittings.length === 0;

    // G6 — runtime progression, class reports and student reports must all
    // consume the same pure status reducer.
    gates.G6_one_report = oneStatusBrain;

    // G7 — human sign-off (recorded per item; Ben flips this)
    const signedOff = items.every(i => i.provenance?.signedOffBy);
    gates.G7_human_signoff = signedOff;
  } catch (error) {
    detail.error = String(error?.stack || error).slice(0, 600);
    gates.G1_structure = false;
  }

  results.push({ skillId, counts: countBank(items), gates, detail });
}

function countBank(items) {
  const byLevel = { 1: 0, 2: 0 };
  let retention = 0;
  for (const item of items) {
    if (item.retentionOnly) retention++;
    else byLevel[item.level]++;
  }
  return { total: items.length, level1: byLevel[1], level2: byLevel[2], retention };
}

// ---------------------------------------------------------------------------
// Reporting + generated outputs
// ---------------------------------------------------------------------------
const hardGateKeys = [
  "G1_structure",
  "G2_originality",
  "G3_answer_integrity",
  "G4_mastery_logic",
  "G5_no_repeats",
  "G6_one_report",
  "G7_human_signoff"
];
let failed = 0;
for (const row of results) {
  const reds = hardGateKeys.filter(k => row.gates[k] === false);
  row.ready = reds.length === 0 && !row.error;
  if (!row.ready) failed++;
  const gateText = hardGateKeys.map(k => `${k.split("_")[0]}:${row.gates[k] === true ? "PASS" : row.gates[k] === false ? "FAIL" : "not-run"}`).join(" ");
  console.log(`${row.ready ? "READY" : "RED  "} ${row.skillId.padEnd(28)} ${gateText} items=${row.counts?.total ?? 0} sim=${JSON.stringify(row.detail?.sims?.pass || {})} guess=${row.detail?.sims?.guess?.passes ?? "?"}/${row.detail?.sims?.guess?.trials ?? "?"} scanner=${row.detail?.sims?.scanner?.leakyItems ?? "?"}/${row.counts?.total ?? 0}`);
  for (const issue of (row.detail?.lint || []).slice(0, 12)) {
    console.log(`    ${issue.code} ${issue.itemId}: ${issue.message}`);
  }
  if ((row.detail?.lint || []).length > 12) console.log(`    …and ${row.detail.lint.length - 12} more lint issues`);
  if (row.detail?.error) console.log(`    ERROR ${row.detail.error.split("\n")[0]}`);
}

if (write) {
  let commit = "";
  try { commit = execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim(); } catch { /* fine */ }

  for (const [skillId, items] of allBanks) {
    const row = results.find(r => r.skillId === skillId);
    if (row?.ready) writeGeneratedBank(skillId, items);
  }

  const statusEntries = results.filter(r => r.ready).map(row => [row.skillId, {
    skillId: row.skillId,
    cutover: true,
    standardVersion: ASSESSMENT_REBUILD_STANDARD_VERSION,
    counts: row.counts,
    gates: Object.fromEntries(Object.entries(row.gates).map(([k, v]) => [k, v === true ? "pass" : v === false ? "fail" : String(v)])),
    generatedAt: new Date().toISOString(),
    commit
  }]);
  // Preserve previously published skills not rebuilt in this run
  let previous = {};
  if (fs.existsSync(STATUS_FILE)) {
    try {
      const mod = await import(STATUS_FILE + `?t=${Date.now()}`);
      previous = mod.assessmentRebuildStatusBySkillId || {};
    } catch { previous = {}; }
  }
  const merged = onlySkill
    ? { ...previous, ...Object.fromEntries(statusEntries) }
    : Object.fromEntries(statusEntries);
  fs.mkdirSync(path.dirname(STATUS_FILE), { recursive: true });
  fs.writeFileSync(STATUS_FILE,
    `// GENERATED by tools/assessmentRebuild/gate.mjs — do not hand-edit.\n` +
    `export const assessmentRebuildStatusVersion = ${JSON.stringify(ASSESSMENT_REBUILD_STANDARD_VERSION)};\n` +
    `export const assessmentRebuildStatusBySkillId = ${JSON.stringify(merged, null, 1)};\n`);

  const reportPath = path.join(REPORT_DIR, "assessment_rebuild_gate");
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(reportPath + ".json", JSON.stringify({ generatedAt: new Date().toISOString(), commit, results }, null, 1));
  fs.writeFileSync(reportPath + ".md",
    `# Assessment rebuild gate — ${new Date().toISOString()} @ ${commit}\n\n` +
    `| Skill | Ready | G1 | G2 | G3 | G4 | G5 | G6 | G7 | Items | Sittings to Secure |\n|---|---|---|---|---|---|---|---|---|---|---|\n` +
    results.map(r => `| ${r.skillId} | ${r.ready ? "✅" : "❌"} | ${hardGateKeys.map(k => r.gates[k] === true ? "✅" : r.gates[k] === false ? "❌" : "—").join(" | ")} | ${r.counts?.total ?? 0} | ${r.detail?.sims?.pass?.sittings ?? "—"} |`).join("\n") +
    `\n\nG7 human sign-off is a hard release gate and remains red until recorded in item provenance.\n`);

  buildMediaRequest(allBanks, results);
  console.log(`\nWrote status (${statusEntries.length} ready), gate report, media request.`);
}

process.exit(failed > 0 && authoringFiles.length > 0 ? 1 : 0);
