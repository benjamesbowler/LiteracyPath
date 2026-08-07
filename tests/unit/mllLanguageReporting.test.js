import assert from "node:assert/strict";
import test from "node:test";

import {
  MLL_COMPOSITES,
  MLL_DOMAINS,
  MLL_ELD_SI_K3,
  MLL_KINDERGARTEN_LIMITS,
  MLL_K3_HEADLINE_COMPOSITE,
  MLL_LEVELS,
  MLL_PARENT_NOTIFICATION,
  MLL_PERFORMANCE_DEFINITIONS,
  MLL_PROHIBITIONS,
  MLL_SCALE_REBASELINE,
  MLL_STANDING_DISCLAIMER,
  computeCompositeScaleScore,
  crossesScaleRebaseline,
  evaluateDistanceToExit,
  gradeClusterForGrade,
  languageExpectationCode,
  lintMllLanguage,
  mllLevelLabel,
  mllLevelRangeLabel
} from "../../src/policy/mllLanguagePolicy.js";
import {
  allDescriptors,
  canDoBankStats,
  canDoStatementsForReport,
  descriptorsFor
} from "../../src/data/mll/widaCanDoBank.js";
import {
  L1_PROFILES,
  analyzeL1Transfer,
  normalizePhoneme,
  resolveL1Profile,
  transferReferenceRows
} from "../../src/data/mll/l1TransferModel.js";
import {
  buildMllClassReport,
  buildMllStudentReport,
  estimateWorkingLevelRange,
  extractSoundErrorPatterns
} from "../../src/data/mll/mllReportBuilder.js";
import { buildMllTrajectory, buildMllStudentProfile } from "../../src/data/mll/mllStudentProfile.js";

/* ------------------------------------------------------------------ *
 * Framework facts
 * ------------------------------------------------------------------ */

test("the six proficiency levels are named and ordered as WIDA names them", () => {
  assert.deepEqual(
    MLL_LEVELS.map(level => level.name),
    ["Entering", "Emerging", "Developing", "Expanding", "Bridging", "Reaching"]
  );
  assert.equal(MLL_LEVELS.at(-1).boundaryLabel, "Level 6", "Level 6 is deliberately open-ended, with no 'End of'");
});

test("levels display number first, name in parentheses", () => {
  assert.equal(mllLevelLabel(3), "Level 3 (Developing)");
});

test("composite weights match the published ACCESS report", () => {
  const overall = MLL_COMPOSITES.find(entry => entry.id === "overall").weights;
  assert.deepEqual(overall, { listening: 0.15, speaking: 0.15, reading: 0.35, writing: 0.35 });
  const comprehension = MLL_COMPOSITES.find(entry => entry.id === "comprehension").weights;
  assert.deepEqual(comprehension, { listening: 0.3, reading: 0.7 });
  const oral = MLL_COMPOSITES.find(entry => entry.id === "oral_language").weights;
  assert.deepEqual(oral, { listening: 0.5, speaking: 0.5 });
});

test("every composite's weights sum to one", () => {
  MLL_COMPOSITES.forEach(composite => {
    const total = Object.values(composite.weights).reduce((sum, weight) => sum + weight, 0);
    assert.ok(Math.abs(total - 1) < 1e-9, `${composite.id} weights sum to ${total}`);
  });
});

test("K-3 leads with oral language, not overall", () => {
  assert.equal(MLL_K3_HEADLINE_COMPOSITE, "oral_language");
  assert.equal(MLL_COMPOSITES.find(entry => entry.id === "oral_language").k3Headline, true);
  assert.equal(MLL_COMPOSITES.find(entry => entry.id === "overall").k3Headline, false);
});

test("a composite is not computed when a domain is missing", () => {
  const partial = computeCompositeScaleScore("overall", { listening: 300, speaking: 310 });
  assert.equal(partial.complete, false);
  assert.equal(partial.scaleScore, null);
  assert.deepEqual(partial.missingDomains, ["reading", "writing"]);
});

test("a complete composite is the weighted average of scale scores", () => {
  const result = computeCompositeScaleScore("oral_language", { listening: 300, speaking: 400 });
  assert.equal(result.scaleScore, 350);
});

test("levels 5 and 6 share performance-definition text, which is the source's own quirk", () => {
  assert.deepEqual(MLL_PERFORMANCE_DEFINITIONS[5], MLL_PERFORMANCE_DEFINITIONS[6]);
});

test("grade clusters split K, 1 and 2-3 rather than treating K-3 as one band", () => {
  assert.equal(gradeClusterForGrade("K"), "K");
  assert.equal(gradeClusterForGrade("1"), "1");
  assert.equal(gradeClusterForGrade("2"), "2-3");
  assert.equal(gradeClusterForGrade("3"), "2-3");
  assert.equal(gradeClusterForGrade("5"), "");
});

test("the full ELD-SI.K-3 set is present, five expectations per key language use", () => {
  ["narrate", "inform", "explain", "argue"].forEach(use => {
    assert.equal(MLL_ELD_SI_K3[use].length, 5, `${use} should carry five expectations`);
  });
  assert.equal(languageExpectationCode({ standard: "SI", cluster: "K-3", keyLanguageUse: "narrate" }), "ELD-SI.K-3.Narrate");
  assert.equal(
    languageExpectationCode({ standard: "LA", cluster: "2-3", keyLanguageUse: "inform", mode: "expressive" }),
    "ELD-LA.2-3.Inform.Expressive"
  );
});

/* ------------------------------------------------------------------ *
 * Claims discipline
 * ------------------------------------------------------------------ */

test("levels are emitted as ranges, never decimals", () => {
  assert.equal(mllLevelRangeLabel(2, 3), "Levels 2-3 (Emerging to Developing)");
  assert.equal(mllLevelRangeLabel(3, 3), "Level 3 (Developing)");
  assert.ok(!/\d\.\d/.test(mllLevelRangeLabel(2, 4)), "no decimal may appear in a range label");
});

test("the standing disclaimer says the three things it has to say", () => {
  const text = MLL_STANDING_DISCLAIMER.paragraphs.join(" ");
  assert.match(text, /does not produce WIDA proficiency levels or scores/);
  assert.match(text, /state's designated ELP assessment/);
  assert.match(text, /Board of Regents of the University of Wisconsin System/);
});

test("the prohibitions cover every line the product must not cross", () => {
  const ids = MLL_PROHIBITIONS.map(rule => rule.id);
  ["no_wida_level", "no_decimals", "no_sped_referral", "no_transfer_claim_without_l1",
   "no_cross_rebaseline_join", "no_deficit_at_entering"].forEach(id => {
    assert.ok(ids.includes(id), `${id} missing`);
  });
  MLL_PROHIBITIONS.forEach(rule => assert.ok(rule.because.length > 15, `${rule.id} has no reason`));
});

test("the asset-based linter catches deficit framing", () => {
  assert.equal(lintMllLanguage("This student is developing English alongside Spanish.").length, 0);
  assert.ok(lintMllLanguage("She struggles with reading.").length > 0);
  assert.ok(lintMllLanguage("He cannot yet read.").length > 0);
  assert.ok(lintMllLanguage("A student with low proficiency.").length > 0);
  assert.ok(lintMllLanguage("Limited English.").length > 0);
  assert.match(lintMllLanguage("She lacks vocabulary.")[0].message, /deficit framing/);
});

/* ------------------------------------------------------------------ *
 * Kindergarten
 * ------------------------------------------------------------------ */

test("kindergarten ceilings are held as configuration, flagged unverified", () => {
  assert.equal(MLL_KINDERGARTEN_LIMITS.maximumLevelByDomain.writing, 4.5);
  assert.equal(MLL_KINDERGARTEN_LIMITS.maximumLevelByDomain.reading, 5.0);
  assert.equal(MLL_KINDERGARTEN_LIMITS.verified, false);
});

test("an unreachable kindergarten exit target reports no shortfall at all", () => {
  const result = evaluateDistanceToExit({
    gradeCluster: "K",
    compositeLevel: 2.2,
    criteria: { compositeId: "overall", compositeMinimum: 5.5 }
  });
  assert.equal(result.reachable, false);
  assert.equal(result.gap, undefined);
  assert.match(result.note, /property of the test, not of the student/);
});

test("an unreachable kindergarten domain floor is caught even when the composite is fine", () => {
  const result = evaluateDistanceToExit({
    gradeCluster: "K",
    compositeLevel: 3.0,
    criteria: { compositeId: "overall", compositeMinimum: 4.0, domainFloor: 5.0 }
  });
  assert.equal(result.reachable, false);
  assert.ok(result.unreachableDomainFloors.some(entry => entry.domain === "writing"));
  assert.match(result.note, /No kindergartner can meet this rule/);
});

test("a reachable target near the kindergarten ceiling still gets a caveat", () => {
  const result = evaluateDistanceToExit({
    gradeCluster: "K",
    compositeLevel: 2.2,
    criteria: { compositeId: "overall", compositeMinimum: 5.0 }
  });
  assert.equal(result.reachable, true);
  assert.equal(result.nearCeiling, true);
  assert.match(result.note, /close to the maximum in every domain/);
});

test("a grade 2 student is not subject to kindergarten ceilings", () => {
  const result = evaluateDistanceToExit({
    gradeCluster: "2-3",
    compositeLevel: 2.2,
    criteria: { compositeId: "overall", compositeMinimum: 5.5 }
  });
  assert.equal(result.reachable, true);
});

test("no exit criteria configured means no distance is shown", () => {
  const result = evaluateDistanceToExit({ gradeCluster: "1", compositeLevel: 3, criteria: {} });
  assert.equal(result.applicable, false);
  assert.match(result.note, /No exit criteria are configured/);
});

/* ------------------------------------------------------------------ *
 * The 2025-26 rebaseline
 * ------------------------------------------------------------------ */

test("the rebaseline boundary is detected in both directions", () => {
  assert.equal(crossesScaleRebaseline("2025-02-01", "2026-02-01"), true);
  assert.equal(crossesScaleRebaseline("2026-02-01", "2025-02-01"), true);
  assert.equal(crossesScaleRebaseline("2026-02-01", "2026-05-01"), false);
  assert.equal(crossesScaleRebaseline("not a date", "2026-05-01"), false);
});

test("a trajectory spanning the rebaseline gets a visible break marker", () => {
  const profile = buildMllStudentProfile({
    studentName: "Test",
    languageAssessments: [
      { source: "access", administeredOn: "2024-02-01", domainLevels: { listening: 2 } },
      { source: "access", administeredOn: "2026-02-01", domainLevels: { listening: 3 } }
    ]
  });
  const trajectory = buildMllTrajectory(profile);
  assert.equal(trajectory.crossesRebaseline, true);
  assert.equal(trajectory.scaleScoreComparisonBlocked, true);
  const breaks = trajectory.points.filter(point => point.kind === "break");
  assert.equal(breaks.length, 1);
  assert.equal(breaks[0].label, MLL_SCALE_REBASELINE.breakMarkerLabel);
  assert.match(trajectory.note, /not comparable/);
});

test("a trajectory entirely after the rebaseline has no break marker", () => {
  const profile = buildMllStudentProfile({
    languageAssessments: [
      { source: "access", administeredOn: "2025-10-01", domainLevels: { listening: 2 } },
      { source: "access", administeredOn: "2026-02-01", domainLevels: { listening: 3 } }
    ]
  });
  assert.equal(buildMllTrajectory(profile).crossesRebaseline, false);
});

/* ------------------------------------------------------------------ *
 * Can Do bank
 * ------------------------------------------------------------------ */

test("the descriptor bank is complete for all three K-3 clusters", () => {
  const stats = canDoBankStats();
  // 3 clusters x (3 key uses x 4 domains x 5 levels + 5 oral-only Discuss rows)
  assert.equal(stats.total, 195);
  assert.deepEqual(stats.clusters, ["K", "1", "2-3"]);
  assert.equal(allDescriptors().length, 195);
});

test("every descriptor begins with a gerund — the Can Do Philosophy, mechanically", () => {
  // "Role playing" and "Re-enacting" are gerunds too — allow a hyphen and a
  // leading auxiliary word before the -ing form.
  const offenders = allDescriptors().filter(row => !/^[A-Z][a-z-]*(ing)\b|^[A-Z][a-z]+ +[a-z]+ing\b/.test(row.text));
  assert.deepEqual(offenders.map(row => row.text), [], "every descriptor should open with an -ing verb");
});

test("no descriptor contains deficit framing", () => {
  const offenders = allDescriptors().filter(row => lintMllLanguage(row.text).length);
  assert.deepEqual(offenders.map(row => row.text), []);
});

test("level 6 returns no descriptors and explains why", () => {
  const result = descriptorsFor({ cluster: "2-3", level: 6 });
  assert.equal(result.descriptors.length, 0);
  assert.match(result.note, /open-ended/);
});

test("an unset level is not treated as level zero", () => {
  assert.ok(descriptorsFor({ cluster: "K" }).descriptors.length > 0);
  assert.ok(descriptorsFor({ cluster: "K", level: null }).descriptors.length > 0);
});

test("filtering by domain and level returns exactly the expected rows", () => {
  const result = descriptorsFor({ cluster: "2-3", level: 3, domain: "speaking" });
  // Recount, Explain, Argue each contribute one speaking row at level 3; Discuss is oral-only and also matches.
  assert.equal(result.descriptors.length, 4);
  result.descriptors.forEach(row => assert.equal(row.level, 3));
});

test("Recount rows carry an inferred 2020 mapping, and say so", () => {
  const recount = allDescriptors().filter(row => row.keyUse2016 === "recount");
  assert.ok(recount.length > 0);
  recount.forEach(row => {
    assert.equal(row.crosswalkInferred, true);
    assert.ok(["narrate", "inform"].includes(row.keyUse2020), `${row.keyUse2020} is not a 2020 key language use`);
  });
});

test("Explain and Argue map straight through and are not marked inferred", () => {
  allDescriptors()
    .filter(row => ["explain", "argue"].includes(row.keyUse2016))
    .forEach(row => {
      assert.equal(row.crosswalkInferred, false);
      assert.equal(row.keyUse2020, row.keyUse2016);
    });
});

test("Discuss is oral language only and has no 2020 key language use", () => {
  const discuss = allDescriptors().filter(row => row.keyUse2016 === "discuss");
  assert.equal(discuss.length, 15, "five levels across three clusters");
  discuss.forEach(row => {
    assert.equal(row.domain, "oral_language");
    assert.equal(row.keyUse2020, "");
  });
});

test("report statements come from the lower bound of the range, not the flattering end", () => {
  const result = canDoStatementsForReport({ cluster: "1", levelLow: 2, domain: "reading", count: 3 });
  assert.ok(result.statements.length > 0);
  result.statements.forEach(statement => assert.equal(statement.level, 2));
});

test("no working level means no statements, with a reason", () => {
  const result = canDoStatementsForReport({ cluster: "1", levelLow: null, domain: "reading" });
  assert.equal(result.statements.length, 0);
  assert.match(result.note, /No working level/);
});

/* ------------------------------------------------------------------ *
 * L1 transfer
 * ------------------------------------------------------------------ */

test("phoneme notation normalises across the app's three conventions", () => {
  assert.equal(normalizePhoneme("th"), "θ");
  assert.equal(normalizePhoneme("/θ/"), "θ");
  assert.equal(normalizePhoneme("SH"), "ʃ");
  assert.equal(normalizePhoneme("short_i"), "ɪ");
  assert.equal(normalizePhoneme(""), "");
});

test("language aliases resolve, and an unmapped language is not silently substituted", () => {
  assert.equal(resolveL1Profile("Spanish").id, "spanish");
  assert.equal(resolveL1Profile("español").id, "spanish");
  assert.equal(resolveL1Profile("Chinese").id, "mandarin");
  assert.equal(resolveL1Profile("Cantonese"), null, "Cantonese must not be mapped onto Mandarin");
  assert.equal(resolveL1Profile("Tagalog"), null);
});

test("no home language means no transfer analysis at all", () => {
  const result = analyzeL1Transfer({ homeLanguage: "", errors: [{ targetPhoneme: "v", occurrences: 3 }] });
  assert.equal(result.available, false);
  assert.equal(result.reason, "no_home_language");
  assert.match(result.narrative, /a guess, not evidence/);
});

test("an unsupported language lists the patterns without pretending to explain them", () => {
  const result = analyzeL1Transfer({ homeLanguage: "Tagalog", errors: [{ targetPhoneme: "v", occurrences: 3 }] });
  assert.equal(result.available, false);
  assert.equal(result.reason, "language_not_in_reference");
  assert.equal(result.explained.length, 0);
  assert.equal(result.residue.length, 1);
});

test("Spanish /v/ errors are explained; /m/ errors are residue", () => {
  const result = analyzeL1Transfer({
    homeLanguage: "Spanish",
    errors: [
      { targetPhoneme: "v", producedPhoneme: "b", occurrences: 4, opportunities: 5, examples: ["van", "very"] },
      { targetPhoneme: "m", occurrences: 3, opportunities: 6 }
    ]
  });
  assert.equal(result.available, true);
  assert.equal(result.summary.explainedCount, 1);
  assert.equal(result.summary.residueCount, 1);
  assert.equal(result.residue[0].targetPhoneme, "m");
  assert.match(result.explained[0].sentence, /Spanish/);
});

test("the residue narrative names the patterns worth a closer look", () => {
  const result = analyzeL1Transfer({
    homeLanguage: "Spanish",
    errors: [{ targetPhoneme: "m", occurrences: 3, opportunities: 6 }],
    studentName: "Ana"
  });
  assert.match(result.residueNarrative, /\/m\//);
  assert.match(result.residueNarrative, /not mutually exclusive/);
});

test("an empty residue does not become a clean bill of health", () => {
  const result = analyzeL1Transfer({
    homeLanguage: "Spanish",
    errors: [{ targetPhoneme: "v", producedPhoneme: "b", occurrences: 2, opportunities: 4 }]
  });
  assert.equal(result.residue.length, 0);
  assert.match(result.residueNarrative, /does not rule out a difficulty/);
});

test("disconfirming evidence is stated when the sound is correct elsewhere", () => {
  const result = analyzeL1Transfer({
    homeLanguage: "Spanish",
    errors: [{ targetPhoneme: "v", producedPhoneme: "b", occurrences: 2, opportunities: 6, correctElsewhere: true }]
  });
  assert.equal(result.summary.disconfirmingCount, 1);
  assert.match(result.narrative, /produced correctly elsewhere/);
});

test("levels 1-2 automatically suppress deficit reading", () => {
  const result = analyzeL1Transfer({
    homeLanguage: "Spanish",
    errors: [{ targetPhoneme: "v", occurrences: 2, opportunities: 4 }],
    proficiencyLevelLow: 1,
    studentName: "Ana"
  });
  assert.equal(result.earlyLevelSuppression, true);
  assert.match(result.narrative, /expected pattern at this stage/);
});

test("Vietnamese final-consonant deletion is treated as expected, not as a deficit", () => {
  const result = analyzeL1Transfer({
    homeLanguage: "Vietnamese",
    errors: [{ word: "cat", targetPhoneme: "t", position: "final", occurrences: 5, opportunities: 6 }]
  });
  assert.equal(result.summary.explainedCount, 1);
});

test("Arabic /p/ for /b/ is explained, and the table's weaker sourcing is surfaced", () => {
  const result = analyzeL1Transfer({
    homeLanguage: "Arabic",
    errors: [{ targetPhoneme: "p", producedPhoneme: "b", occurrences: 4, opportunities: 4 }]
  });
  assert.equal(result.summary.explainedCount, 1);
  assert.equal(result.summary.reviewStatus, "needs_linguist_review");
  assert.match(result.caution, /dialect variation/);
});

test("no transfer analysis ever recommends a referral", () => {
  const result = analyzeL1Transfer({
    homeLanguage: "Spanish",
    errors: [{ targetPhoneme: "m", occurrences: 9, opportunities: 9 }]
  });
  const text = [result.narrative, result.residueNarrative, result.disclaimer].join(" ").toLowerCase();
  assert.ok(!/refer(ral)? (to|for) special education|recommend.*special education/.test(text));
  assert.match(result.disclaimer, /not a clinical judgement/);
});

test("every language profile carries sources and a review status", () => {
  Object.values(L1_PROFILES).forEach(profile => {
    assert.ok(profile.sources.length > 0, `${profile.id} has no sources`);
    assert.ok(["sourced", "needs_linguist_review"].includes(profile.reviewStatus));
    assert.ok(profile.highValueFlags.length >= 3);
  });
});

test("the reference table renders both sound and word-shape rows", () => {
  const rows = transferReferenceRows("Spanish");
  assert.ok(rows.some(row => row.category === "Sound"));
  assert.ok(rows.some(row => row.category === "Word shape"));
  assert.equal(transferReferenceRows("Klingon").length, 0);
});

/* ------------------------------------------------------------------ *
 * Report builder
 * ------------------------------------------------------------------ */

const SAMPLE_WORKSPACE = {
  wholeChild: {
    summary: { concepts: 40, secure: 3, developing: 4, needs_teaching: 5, not_enough_evidence: 8, latestAt: "2026-08-01" },
    concepts: [
      { conceptId: "p::initial_sound::v", construct: "initial_sound", key: "v", currentEvidenceBasis: { observations: 5, correct: 1 }, evidence: [{ provenance: { word: "van" } }] },
      { conceptId: "p::initial_sound::m", construct: "initial_sound", key: "m", currentEvidenceBasis: { observations: 6, correct: 3 }, evidence: [] },
      { conceptId: "p::final_sound::d", construct: "final_sound", key: "d", currentEvidenceBasis: { observations: 6, correct: 6 }, evidence: [] }
    ]
  },
  skillsCheck: { summary: { attempts: 9 } }
};

const SAMPLE_STUDENT = {
  studentId: "s1", studentName: "Mateo R.", className: "Room 4", grade: "1",
  isMultilingualLearner: true, homeLanguage: "Spanish", homeLanguageLiteracy: false,
  languageAssessments: [{
    source: "access", administeredOn: "2026-02-14", testingYear: "2025-2026",
    domainLevels: { listening: 3.1, speaking: 2.8, reading: 2.2, writing: 1.9 },
    compositeLevels: { oral_language: 3.0, literacy: 2.1, overall: 2.4 }
  }],
  exitCriteria: { compositeId: "overall", compositeMinimum: 4.5, effectiveFrom: "2024-08-01" }
};

test("error patterns are extracted only where there were actual misses", () => {
  const patterns = extractSoundErrorPatterns(SAMPLE_WORKSPACE);
  const keys = patterns.map(pattern => pattern.targetPhoneme);
  assert.ok(keys.includes("v"));
  assert.ok(keys.includes("m"));
  assert.ok(!keys.includes("d"), "a perfect concept is not an error pattern");
});

test("a student report leads with oral language and says why", () => {
  const report = buildMllStudentReport({ student: SAMPLE_STUDENT, workspace: SAMPLE_WORKSPACE });
  assert.equal(report.proficiency.headlineCompositeId, "oral_language");
  assert.match(report.proficiency.headlineRationale, /70% literacy-weighted/);
  assert.match(report.headline, /Level 3 \(Developing\)/);
});

test("a student report never prints a decimal proficiency level in its prose", () => {
  const report = buildMllStudentReport({ student: SAMPLE_STUDENT, workspace: SAMPLE_WORKSPACE });
  const prose = [report.headline, ...report.canDoByDomain.map(entry => entry.range.label)].join(" ");
  assert.ok(!/Level \d\.\d/.test(prose), `decimal level found in: ${prose}`);
});

test("a working range is never estimated from classroom evidence alone", () => {
  const range = estimateWorkingLevelRange({ officialLevel: null, classroomEvidenceCount: 40, domain: "reading" });
  assert.equal(range.low, null);
  assert.equal(range.basis, "classroom_only");
  assert.match(range.note, /a WIDA level in all but name/);
});

test("an official level anchors a range one level wide", () => {
  const range = estimateWorkingLevelRange({ officialLevel: 2.8, classroomEvidenceCount: 5 });
  assert.equal(range.low, 2);
  assert.equal(range.high, 3);
  assert.equal(range.label, "Levels 2-3 (Emerging to Developing)");
});

test("report copy passes its own asset-based linter", () => {
  const report = buildMllStudentReport({ student: SAMPLE_STUDENT, workspace: SAMPLE_WORKSPACE });
  assert.deepEqual(report.copyIssues, []);
});

test("missing profile fields are listed with what they change, not silently defaulted", () => {
  const report = buildMllStudentReport({
    student: { ...SAMPLE_STUDENT, homeLanguage: "", programModel: "", exitCriteria: null }
  });
  const fields = report.dataGaps.map(gap => gap.field);
  assert.ok(fields.includes("Home language"));
  assert.ok(fields.includes("District exit criteria"));
  assert.ok(fields.includes("Program model"));
  report.dataGaps.forEach(gap => assert.ok(gap.impact.length > 15));
});

test("the family section affirms the home language and suppresses the banned metrics", () => {
  const report = buildMllStudentReport({ student: SAMPLE_STUDENT, workspace: SAMPLE_WORKSPACE });
  assert.match(report.family.affirmL1, /asset/);
  assert.ok(report.family.homeActions.some(action => /Spanish/.test(action)));
  ["percentiles", "scaled scores", "text levels", "comparisons to classmates"].forEach(item => {
    assert.ok(report.family.suppressed.includes(item));
  });
});

test("the parent-notification rule names the elements this module can generate", () => {
  assert.equal(MLL_PARENT_NOTIFICATION.deadlineDaysFromSchoolYearStart, 30);
  const generatable = MLL_PARENT_NOTIFICATION.requiredElements.filter(element => element.generatable);
  assert.deepEqual(generatable.map(element => element.id), ["level_and_achievement", "exit_requirements"]);
  assert.equal(MLL_PARENT_NOTIFICATION.requiredElements.length, 8);
});

test("a class report is alphabetical and says it does not rank", () => {
  const report = buildMllClassReport({
    className: "Room 4",
    students: [
      { ...SAMPLE_STUDENT, studentId: "z", studentName: "Zoe" },
      { ...SAMPLE_STUDENT, studentId: "a", studentName: "Ana" }
    ]
  });
  assert.deepEqual(report.rows.map(row => row.studentName), ["Ana", "Zoe"]);
  assert.match(report.orderingNote, /does not rank/);
});

test("a class report only includes flagged multilingual learners", () => {
  const report = buildMllClassReport({
    className: "Room 4",
    students: [SAMPLE_STUDENT, { ...SAMPLE_STUDENT, studentId: "x", studentName: "Not flagged", isMultilingualLearner: false }]
  });
  assert.equal(report.rows.length, 1);
});

test("students with no official score are counted apart, never as zero", () => {
  const report = buildMllClassReport({
    className: "Room 4",
    students: [SAMPLE_STUDENT, { ...SAMPLE_STUDENT, studentId: "b", studentName: "Bo", languageAssessments: [] }]
  });
  assert.equal(report.summary.multilingualLearners, 2);
  assert.equal(report.summary.withOfficialScores, 1);
  const unknown = report.summary.levelDistribution.find(entry => entry.level === "unknown");
  assert.equal(unknown.count, 1);
  assert.equal(unknown.label, "No official score");
});

test("every domain is represented in a report, even with no score for it", () => {
  const report = buildMllStudentReport({ student: { ...SAMPLE_STUDENT, languageAssessments: [] } });
  assert.equal(report.canDoByDomain.length, MLL_DOMAINS.length);
  report.canDoByDomain.forEach(entry => assert.equal(entry.officialLevel, null));
});
