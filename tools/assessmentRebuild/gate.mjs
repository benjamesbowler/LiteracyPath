// Skills Assessment Rebuild v3 — the honest release gate.
//
//   node tools/assessmentRebuild/gate.mjs [--skill <id>] [--write]
//
// Builds every authored v3 bank, runs lints, simulations, and the shared-policy
// integration check. Every run writes machine-readable evidence to the ignored
// audit-artifact directory. With --write it also regenerates:
//   - src/data/v3/banks/<skill>.v3.generated.js
//   - src/content/assessments/v3/assessmentRebuildStatus.generated.js
//   - .artifacts/assessment-rebuild/assessment_rebuild_gate.md
// Exit code is non-zero when ANY cutover skill has a red gate. "not run" is
// reported as its own state, never as a pass.

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import {
  ROOT, AUTHORING_DIR, STATUS_FILE, REPORT_DIR,
  expandBank, lintBank, lintPerceptualMediaIndependence, simulate, simulateRegression, scannerAnswer, writeGeneratedBank, loadLexicon,
  norm, makeImageResolver
} from "./lib.mjs";
import { skillBlueprints, ASSESSMENT_REBUILD_STANDARD_VERSION } from "../../src/content/blueprints/skillBlueprints.js";
import * as policy from "../../src/policy/skillStatusPolicy.js";
import { getLedaWordAudioPath } from "../../src/data/ledaProductionAudio.js";
import { getAssessmentSceneMediaDecision } from "../../src/content/assessments/v3/assessmentSceneMediaDecisions.js";
import { ASSESSMENT_ITEM_MEDIA_DECISIONS } from "../../src/content/assessments/v3/assessmentItemMediaDecisions.generated.js";
import { ASSESSMENT_IMAGE_STYLE_DECISIONS } from "../../src/content/assessments/v3/assessmentImageStyleDecisions.generated.js";
import {
  ASSESSMENT_REJECTED_IMAGE_HASHES,
  ASSESSMENT_REVIEWED_REPLACEMENT_HASHES
} from "../../src/content/assessments/v3/assessmentImageReviewPolicy.js";

const args = process.argv.slice(2);
const onlySkill = args.includes("--skill") ? args[args.indexOf("--skill") + 1] : null;
const write = args.includes("--write");

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

function requiredAudioIssues(items) {
  const issues = [];
  const requireWord = (item, word, role) => {
    const audioPath = getLedaWordAudioPath(word);
    const absolutePath = audioPath
      ? path.join(ROOT, "public", audioPath.replace(/^\//, ""))
      : "";
    if (!audioPath || !fs.existsSync(absolutePath)) {
      issues.push({
        code: "L-AUDIO-REQUIRED",
        itemId: item.id,
        message: `missing approved LEDA ${role} audio for "${word}"`
      });
    }
  };

  for (const item of items) {
    if (item.formatType === "HFW_AUDIO_FIND_WORD") {
      requireWord(item, item.targetWord || item.answer, "target-word");
    }
    if (["RHYME_MATCH_PICTURE", "INITIAL_SOUND_PAIR_SELECT", "FINAL_SOUND_PAIR_SELECT"].includes(item.formatType)) {
      for (const card of item.imageCards || []) requireWord(item, card.word || card.label, "answer-card");
    }
  }
  return issues;
}

function sceneManifestIssues() {
  const sceneRoot = path.join(ROOT, "public", "images", "assessment", "scenes");
  const files = [];
  const visit = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (/\.(?:png|webp)$/i.test(entry.name)) files.push(path.relative(sceneRoot, absolute).replaceAll(path.sep, "/"));
    }
  };
  visit(sceneRoot);
  const issues = [];
  for (const file of files) {
    const decision = getAssessmentSceneMediaDecision(file);
    if (!decision) {
      issues.push({ code: "L-SCENE-MANIFEST", itemId: file, message: "scene asset has no explicit scoring-use decision" });
      continue;
    }
    if (decision.mediaRole === "scoring-evidence" && (
      decision.visualReview !== "approved-clean-cartoon"
      || decision.alignmentReview !== "approved-exact-scoring-evidence"
      || !decision.reviewedAt
      || decision.styleProfile?.bright !== true
      || decision.styleProfile?.bold !== true
      || decision.styleProfile?.flat2d !== true
      || decision.styleProfile?.crispOutlines !== true
      || decision.styleProfile?.smoothSurfaces !== true
      || decision.styleProfile?.canvasOrPaperGrain !== false
      || decision.styleProfile?.embossedOrBevelledEdges !== false
      || decision.styleProfile?.grittyOrFauxPaintTexture !== false
      || decision.styleProfile?.photorealOrCinematicFinish !== false
    )) {
      issues.push({
        code: "L-SCENE-MANIFEST",
        itemId: file,
        message: "scoring scene lacks recorded bright, bold, clean-cartoon style and exact-alignment approval"
      });
    }
  }
  return issues;
}

function itemImagePaths(item) {
  return [...new Set([
    item.imagePath,
    item.imageUrl,
    item.targetImage,
    item.targetImagePath,
    ...(item.imageCards || []).flatMap(card => [card.image, card.imagePath]),
    ...(item.sequenceCards || []).flatMap(card => [card.image, card.imagePath])
  ].filter(Boolean))];
}

function visualPolicyIssues(items) {
  const issues = [];
  const allowedRoles = new Set(["answer-cards", "sequence", "target-or-scene", "neutral-support", "construct-support"]);
  const push = (item, message) => issues.push({ code: "L-VISUAL-POLICY", itemId: item.id, message });
  for (const item of items) {
    const decision = ASSESSMENT_ITEM_MEDIA_DECISIONS[item.id];
    const actualPaths = itemImagePaths(item);
    if (!decision) {
      push(item, "item has no explicit reviewed media decision");
      continue;
    }
    if (!allowedRoles.has(decision.role)) push(item, `invalid media role: ${decision.role || "(missing)"}`);
    if (decision.constructReview !== "approved") push(item, "construct review is not approved");
    if (!String(decision.answerNeutral || "").startsWith("approved") && !String(decision.answerNeutral || "").startsWith("not-applicable")) {
      push(item, "answer-neutrality review is not approved");
    }
    const expectedPaths = [...new Set(decision.paths || [])];
    if (!actualPaths.length) push(item, "item has no meaningful target, scene, answer-card, or sequence image");
    if (actualPaths.length !== expectedPaths.length || actualPaths.some(assetPath => !expectedPaths.includes(assetPath))) {
      push(item, "expanded item images do not exactly match its reviewed decision");
    }
    if (["neutral-support", "construct-support", "target-or-scene"].includes(decision.role) && !item.imageAlt) {
      push(item, "target or scene image is missing non-answer-revealing alt text");
    }
    if (decision.role === "answer-cards" && !(item.imageCards || []).length) push(item, "answer-card decision has no image cards");
    if (decision.role === "sequence" && !(item.sequenceCards || []).length) push(item, "sequence decision has no sequence cards");
    for (const assetPath of actualPaths) {
      if (!assetPath.startsWith("/images/assessment/")) {
        push(item, `active image is outside the assessment-owned namespace: ${assetPath}`);
        continue;
      }
      const absolutePath = path.join(ROOT, "public", assetPath.replace(/^\//, ""));
      if (!fs.existsSync(absolutePath)) {
        push(item, `active image file is missing: ${assetPath}`);
        continue;
      }
      const style = ASSESSMENT_IMAGE_STYLE_DECISIONS[assetPath];
      if (!style) {
        push(item, `active image has no direct visual-review style decision: ${assetPath}`);
        continue;
      }
      const currentHash = createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex");
      if (ASSESSMENT_REJECTED_IMAGE_HASHES[currentHash]) {
        push(item, `active image matches a directly rejected bitmap: ${assetPath}`);
      }
      const reviewedReplacementHash = ASSESSMENT_REVIEWED_REPLACEMENT_HASHES[assetPath];
      if (reviewedReplacementHash && reviewedReplacementHash !== currentHash) {
        push(item, `reviewed replacement pixels changed without a new direct review: ${assetPath}`);
      }
      if (
        style.sha256 !== currentHash
        || style.visualReview !== "approved"
        || style.brightness !== "bright"
        || style.saturation !== "bold"
        || style.medium !== "classic-flat-2d-cartoon"
        || style.contours !== "crisp"
        || style.surfaces !== "smooth-solid"
        || style.grain !== false
        || style.paperOrCanvasTexture !== false
        || style.embossed !== false
        || style.bevelled !== false
        || style.faux3d !== false
        || style.photoreal !== false
        || style.painterly !== false
      ) {
        push(item, `active image fails the exact reviewed style/hash policy: ${assetPath}`);
      }
    }
  }
  return issues;
}

const lexicon = loadLexicon();
const globalSceneManifestIssues = sceneManifestIssues();
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
    const perceptualMediaIssues = await lintPerceptualMediaIndependence(items);
    const audioIssues = requiredAudioIssues(items);
    const manifestIssues = skillId === "sentence_comprehension" ? globalSceneManifestIssues : [];
    const visualIssues = visualPolicyIssues(items);
    detail.lint = [...lintIssues, ...perceptualMediaIssues, ...audioIssues, ...manifestIssues, ...visualIssues];
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

    // Blind-guess Monte Carlo thresholds were retired because they created a
    // second, sample-dependent pass rule. The only learner-facing threshold is
    // PHASE_PASS_RULE; G4 proves reachability, answer-leak resistance and
    // regression behavior against that same policy.
    const random = seededRandom(`${skillId}:${ASSESSMENT_REBUILD_STANDARD_VERSION}`);
    const scanner = await simulate(items, blueprint, {
      policy,
      answerFn: item => {
        if (item.copyExempt || item.constructClaim === "recognize_shared_digraph_pattern" || item.constructClaim === "apply_affix_meaning_in_context") {
          return random() < 1 / Math.max(2, item.choices.length || 4);
        }
        const leak = scannerAnswer(item);
        if (leak && norm(leak) === norm(item.answer)) return true;
        return random() < 1 / Math.max(2, item.choices.length || 4);
      },
      maxSittings: 6
    });
    const scannerLeaks = items.filter(i => {
      if (i.copyExempt) return false;
      if (i.constructClaim === "recognize_shared_digraph_pattern") return false;
      if (i.constructClaim === "apply_affix_meaning_in_context") return false;
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
    gates.G7_construct_validity = !lintIssues.some(i => [
      "L-AMBIG", "L-HFW-COPY", "L-MODALITY", "L-SEQUENCE-COPY",
      "L-COMPREHENSION-COPY", "L-COMPREHENSION-VERBATIM", "L-MEDIA-CONSTRUCT", "L-CONSTRUCT-WEAK"
    ].includes(i.code));
    gates.G8_media_independence = ![...lintIssues, ...perceptualMediaIssues, ...manifestIssues].some(i => [
      "L-MEDIA", "L-MEDIA-INDEPENDENCE", "L-MEDIA-CONSTRUCT"
      , "L-SCENE-MANIFEST"
    ].includes(i.code));
    gates.G9_required_audio = audioIssues.length === 0;
    gates.G10_visual_policy = visualIssues.length === 0;

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
  "G7_construct_validity",
  "G8_media_independence",
  "G9_required_audio",
  "G10_visual_policy"
];
let failed = 0;
for (const row of results) {
  const reds = hardGateKeys.filter(k => row.gates[k] === false);
  row.ready = reds.length === 0 && !row.error;
  if (!row.ready) failed++;
  const gateText = hardGateKeys.map(k => `${k.split("_")[0]}:${row.gates[k] === true ? "PASS" : row.gates[k] === false ? "FAIL" : "not-run"}`).join(" ");
  console.log(`${row.ready ? "READY" : "RED  "} ${row.skillId.padEnd(28)} ${gateText} items=${row.counts?.total ?? 0} sim=${JSON.stringify(row.detail?.sims?.pass || {})} scanner=${row.detail?.sims?.scanner?.leakyItems ?? "?"}/${row.counts?.total ?? 0}`);
  for (const issue of (row.detail?.lint || []).slice(0, 12)) {
    console.log(`    ${issue.code} ${issue.itemId}: ${issue.message}`);
  }
  if ((row.detail?.lint || []).length > 12) console.log(`    …and ${row.detail.lint.length - 12} more lint issues`);
  if (row.detail?.error) console.log(`    ERROR ${row.detail.error.split("\n")[0]}`);
}

let commit = "";
try { commit = execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim(); } catch { /* fine */ }

const reportPath = path.join(REPORT_DIR, "assessment_rebuild_gate");
fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(reportPath + ".json", JSON.stringify({
  generatedAt: new Date().toISOString(),
  commit,
  results
}, null, 1));

if (write) {

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

  fs.writeFileSync(reportPath + ".md",
    `# Assessment rebuild gate — ${new Date().toISOString()} @ ${commit}\n\n` +
    `| Skill | Ready | G1 | G2 | G3 | G4 | G5 | G6 | G7 | G8 | G9 | G10 | Items | Sittings to Secure |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n` +
    results.map(r => `| ${r.skillId} | ${r.ready ? "✅" : "❌"} | ${hardGateKeys.map(k => r.gates[k] === true ? "✅" : r.gates[k] === false ? "❌" : "—").join(" | ")} | ${r.counts?.total ?? 0} | ${r.detail?.sims?.pass?.sittings ?? "—"} |`).join("\n") +
    `\n\nPublication requires all ten reproducible gates above.\n`);

  console.log(`\nWrote status (${statusEntries.length} ready) and gate report.`);
}

process.exit(failed > 0 && authoringFiles.length > 0 ? 1 : 0);
