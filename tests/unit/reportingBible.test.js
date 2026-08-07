import assert from "node:assert/strict";
import test from "node:test";

import {
  DO_NOT_REPORT_RULES,
  EVIDENCE_SUFFICIENCY_IDS,
  HFW_BUCKETS,
  PA_PROGRESSION,
  PHONICS_GROUPS,
  REPORTING_BIBLE_POLICY,
  REPORT_STATUS_IDS,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_ORDER,
  ROPE_STRANDS,
  canonicalStatusId,
  evaluateEvidenceSufficiency,
  evaluateMasteryGates,
  evaluateTrendEligibility,
  isNeutralStatus,
  isReportableWcpmChange,
  reportStatusLabel,
  reportingBibleMigrationDeltas,
  resolveSvrProfile,
  riskBandNarrative,
  ruleForbids,
  theilSenSlope
} from "../../src/policy/reportingBible.js";
import { LEARNING_EVIDENCE_POLICY } from "../../src/policy/learningPolicy.js";

/**
 * The bible's numbers are the product's promises. These tests are the promises
 * written down so a future change has to argue with them rather than slip past.
 */

test("every legacy status string in the codebase canonicalises to one of six ids", () => {
  const legacy = [
    "on_track", "mastered", "passed", "Got it",
    "developing", "practising", "Growing", "building", "Almost there",
    "needs_teaching", "needs_support", "Needs reteaching", "Needs more practice",
    "mixed", "mixed_evidence", "Mixed results",
    "not_enough_evidence", "not_enough_yet", "unscored_evidence",
    "not_started", "not_assessed", "yet_to_learn", "Not started yet", "unseen"
  ];
  const known = new Set(Object.values(REPORT_STATUS_IDS));
  legacy.forEach(value => {
    assert.ok(known.has(canonicalStatusId(value)), `${value} did not canonicalise`);
  });
});

test("unknown status input becomes not_checked, never a guess", () => {
  assert.equal(canonicalStatusId("something we never shipped"), REPORT_STATUS_IDS.NOT_CHECKED);
  assert.equal(canonicalStatusId(""), REPORT_STATUS_IDS.NOT_CHECKED);
  assert.equal(canonicalStatusId(null), REPORT_STATUS_IDS.NOT_CHECKED);
  assert.equal(canonicalStatusId(undefined), REPORT_STATUS_IDS.NOT_CHECKED);
});

test("the retired export-only vocabulary never comes back as a display label", () => {
  const banned = ["Growing", "Not started yet", "Needs more practice", "Got it", "Almost there", "Needs reteaching"];
  const shown = Object.values(REPORT_STATUS_LABELS);
  banned.forEach(word => assert.ok(!shown.includes(word), `${word} is still a display label`));
});

test("needs support is displayed first, because it is the group a teacher acts on", () => {
  assert.equal(REPORT_STATUS_ORDER[0], REPORT_STATUS_IDS.NEEDS_SUPPORT);
});

test("the two thin-evidence states are neutral, never a failure colour", () => {
  assert.ok(isNeutralStatus("not_enough_evidence"));
  assert.ok(isNeutralStatus("not_checked"));
  assert.ok(!isNeutralStatus("needs_support"));
  assert.ok(!isNeutralStatus("secure"));
});

/* --------------------------- Law 2: evidence --------------------------- */

test("no judgement below ten scored items (Sinharay)", () => {
  for (let items = 1; items <= 9; items += 1) {
    const result = evaluateEvidenceSufficiency(items);
    assert.equal(result.ready, false, `${items} items should not be judgeable`);
    assert.equal(result.id, EVIDENCE_SUFFICIENCY_IDS.INSUFFICIENT);
  }
});

test("ten to nineteen items is judgeable but provisional", () => {
  [10, 14, 19].forEach(items => {
    const result = evaluateEvidenceSufficiency(items);
    assert.equal(result.ready, true);
    assert.equal(result.provisional, true);
    assert.equal(result.id, EVIDENCE_SUFFICIENCY_IDS.PROVISIONAL);
  });
});

test("twenty items or more is a confident judgement", () => {
  const result = evaluateEvidenceSufficiency(20);
  assert.equal(result.provisional, false);
  assert.equal(result.id, EVIDENCE_SUFFICIENCY_IDS.SUFFICIENT);
});

test("zero items reads as no results, not as insufficient", () => {
  assert.equal(evaluateEvidenceSufficiency(0).id, EVIDENCE_SUFFICIENCY_IDS.NONE);
});

test("non-numeric evidence counts do not become a judgement", () => {
  [null, undefined, "", "many", NaN, -4].forEach(value => {
    assert.equal(evaluateEvidenceSufficiency(value).ready, false);
  });
});

/* --------------------------- mastery gates --------------------------- */

test("secure needs all four gates", () => {
  const pass = { accuracyPercent: 95, scoredItems: 20, separateDays: 3, retentionPassed: true };
  assert.equal(evaluateMasteryGates(pass).secure, true);

  assert.equal(evaluateMasteryGates({ ...pass, accuracyPercent: 89 }).secure, false);
  assert.equal(evaluateMasteryGates({ ...pass, scoredItems: 9 }).secure, false);
  assert.equal(evaluateMasteryGates({ ...pass, separateDays: 1 }).secure, false);
  assert.equal(evaluateMasteryGates({ ...pass, retentionPassed: null }).secure, false);
});

test("90 percent is the accuracy bar, not the field's 80 percent convention", () => {
  assert.equal(REPORTING_BIBLE_POLICY.mastery.accuracyPercentMinimum, 90);
  const at80 = evaluateMasteryGates({ accuracyPercent: 80, scoredItems: 30, separateDays: 5, retentionPassed: true });
  assert.equal(at80.secure, false);
});

test("failing a retention check demotes, and says so in plain words", () => {
  const demoted = evaluateMasteryGates({
    accuracyPercent: 100, scoredItems: 30, separateDays: 5, retentionPassed: false
  });
  assert.equal(demoted.secure, false);
  assert.equal(demoted.demoted, true);
  assert.match(demoted.whyNotSecure, /slipped/);
});

test("a rate criterion becomes a fifth gate only when the construct has one", () => {
  const withoutRate = evaluateMasteryGates({ accuracyPercent: 95, scoredItems: 20, separateDays: 3, retentionPassed: true });
  assert.equal(withoutRate.gates.length, 4);
  const withRate = evaluateMasteryGates({
    accuracyPercent: 95, scoredItems: 20, separateDays: 3, retentionPassed: true, rateCriterionMet: false
  });
  assert.equal(withRate.gates.length, 5);
  assert.equal(withRate.secure, false);
});

test("high-stakes skills need a third separate day", () => {
  const twoDays = { accuracyPercent: 95, scoredItems: 20, separateDays: 2, retentionPassed: true };
  assert.equal(evaluateMasteryGates(twoDays).secure, true);
  assert.equal(evaluateMasteryGates({ ...twoDays, highStakes: true }).secure, false);
});

test("the mastery rule is stated in words a teacher can argue with", () => {
  const summary = evaluateMasteryGates({}).summary;
  assert.match(summary, /90%/);
  assert.match(summary, /10 items/);
  assert.match(summary, /separate days/);
  assert.match(summary, /14-28 days/);
});

/* --------------------------- growth and trend --------------------------- */

test("no trend line below five data points", () => {
  [0, 1, 2, 3, 4].forEach(points => {
    assert.equal(evaluateTrendEligibility(points).mayDrawLine, false, `${points} points`);
  });
  assert.equal(evaluateTrendEligibility(5).mayDrawLine, true);
});

test("five points draws a line but does not justify changing instruction", () => {
  const five = evaluateTrendEligibility(5);
  assert.equal(five.mayDrawLine, true);
  assert.equal(five.mayRecommend, false);
  assert.equal(five.provisional, true);
  assert.equal(evaluateTrendEligibility(6).mayRecommend, true);
});

test("a robust estimator is used below ten points", () => {
  assert.equal(evaluateTrendEligibility(7).estimator, "theil-sen");
  assert.equal(evaluateTrendEligibility(12).estimator, "least-squares");
});

test("theil-sen ignores the outlier that would swing least squares", () => {
  const clean = [{ x: 0, y: 20 }, { x: 1, y: 25 }, { x: 2, y: 30 }, { x: 3, y: 35 }, { x: 4, y: 40 }];
  const withOutlier = [{ x: 0, y: 20 }, { x: 1, y: 25 }, { x: 2, y: 300 }, { x: 3, y: 35 }, { x: 4, y: 40 }];
  assert.equal(theilSenSlope(clean), 5);
  assert.equal(theilSenSlope(withOutlier), 5);
});

test("theil-sen returns null rather than a misleading number", () => {
  assert.equal(theilSenSlope([]), null);
  assert.equal(theilSenSlope([{ x: 1, y: 1 }]), null);
  assert.equal(theilSenSlope([{ x: 1, y: 1 }, { x: 1, y: 9 }]), null);
});

test("a WCPM change inside the measurement error is not growth", () => {
  assert.equal(isReportableWcpmChange(5).reportable, false);
  assert.equal(isReportableWcpmChange(10).reportable, false);
  assert.equal(isReportableWcpmChange(11).reportable, true);
  assert.equal(isReportableWcpmChange(7, { medianOfThree: true }).reportable, true);
  assert.equal(isReportableWcpmChange(-14).reportable, true, "a loss is still a real change");
});

test("grade 1 fall oral reading fluency percentiles are hard-blocked", () => {
  assert.ok(REPORTING_BIBLE_POLICY.oralReadingFluency.percentileBlockedGradeWindows.includes("1:BOY"));
});

test("the product does not claim growth percentiles it has no norms for", () => {
  assert.equal(REPORTING_BIBLE_POLICY.growth.growthPercentilesAvailable, false);
});

/* --------------------------- risk in odds --------------------------- */

test("risk is narrated as odds, with the support level defined", () => {
  const band = riskBandNarrative("below_benchmark");
  assert.equal(band.support, "strategic");
  assert.match(band.sentence, /40-60% chance/);
  assert.match(band.supportDetail, /supplemental support/);
});

test("an unknown band returns null rather than an invented one", () => {
  assert.equal(riskBandNarrative("amber"), null);
});

/* --------------------------- taxonomy --------------------------- */

test("the phonics taxonomy is the full ordered UFLI sequence", () => {
  assert.equal(PHONICS_GROUPS.length, 12);
  assert.deepEqual(PHONICS_GROUPS.map(group => group.order), Array.from({ length: 12 }, (_, i) => i + 1));
});

test("segmentation is the phonological-awareness gateway and manipulation cannot raise a flag", () => {
  const gateway = PA_PROGRESSION.filter(step => step.gateway);
  assert.equal(gateway.length, 1);
  assert.equal(gateway[0].id, "segmentation");
  const manipulation = PA_PROGRESSION.find(step => step.id === "manipulation");
  assert.equal(manipulation.riskFlagEligible, false);
});

test("high-frequency words are reported in three buckets, not as one score", () => {
  assert.deepEqual(HFW_BUCKETS.map(bucket => bucket.id), ["flash", "heart", "temporarily_irregular"]);
  HFW_BUCKETS.forEach(bucket => assert.ok(bucket.teachingNote.length > 10));
});

test("every rope strand belongs to exactly one half of the simple view", () => {
  const halves = new Set(ROPE_STRANDS.map(strand => strand.svr));
  assert.equal(halves.size, 2);
  assert.equal(ROPE_STRANDS.length, 8);
});

test("the simple view resolves all four profiles and names an action for each", () => {
  const combos = [[true, true], [false, true], [true, false], [false, false]];
  const seen = new Set();
  combos.forEach(([wr, lc]) => {
    const profile = resolveSvrProfile({ wordRecognitionSecure: wr, languageComprehensionSecure: lc });
    assert.ok(profile, `no profile for ${wr}/${lc}`);
    assert.ok(profile.move.length > 20, "every profile implies an action");
    seen.add(profile.id);
  });
  assert.equal(seen.size, 4);
});

/* --------------------------- do not report --------------------------- */

test("the do-not-report list covers the things the research says to withhold", () => {
  const ids = DO_NOT_REPORT_RULES.map(rule => rule.id);
  ["text_level", "ranked_roster", "percentile", "diagnosis", "thin_subscore", "thin_trend",
   "g1_fall_orf", "unconfirmed_tier", "wida_level", "sped_referral"]
    .forEach(id => assert.ok(ids.includes(id), `${id} missing from the do-not-report list`));
});

test("every do-not-report rule carries a basis, so it can be argued with", () => {
  DO_NOT_REPORT_RULES.forEach(rule => {
    assert.ok(rule.basis && rule.basis.length > 10, `${rule.id} has no stated basis`);
  });
});

test("reading levels are withheld from families and children but not from teachers", () => {
  assert.equal(ruleForbids("text_level", "family"), true);
  assert.equal(ruleForbids("text_level", "child"), true);
  assert.equal(ruleForbids("text_level", "teacher_diagnostic"), false);
});

test("thin subscores, ranked rosters and referrals are forbidden to everyone", () => {
  ["thin_subscore", "ranked_roster", "sped_referral", "wida_level", "diagnosis"].forEach(id => {
    assert.equal(ruleForbids(id, "teacher_diagnostic"), true, `${id} should be forbidden to everyone`);
  });
});

/* --------------------------- export privacy --------------------------- */

test("exports leaving the roster context default to pseudonymous", () => {
  assert.equal(REPORTING_BIBLE_POLICY.exportPrivacy.defaultIdentifiabilityModeOutsideRoster, "pseudonymous");
});

test("free-text teacher notes are not in a bulk export by default", () => {
  assert.equal(REPORTING_BIBLE_POLICY.exportPrivacy.includeFreeTextNotesByDefault, false);
});

test("every export carries the FERPA banner", () => {
  assert.match(REPORTING_BIBLE_POLICY.exportPrivacy.confidentialityBanner, /FERPA/);
});

/* --------------------------- migration honesty --------------------------- */

test("the migration deltas name every place the bible is stricter than today's policy", () => {
  const deltas = reportingBibleMigrationDeltas();
  const ids = deltas.map(delta => delta.id);
  assert.ok(ids.includes("secure_accuracy"));
  assert.ok(ids.includes("minimum_items"));
  deltas.forEach(delta => {
    assert.ok(delta.effect.length > 10, `${delta.id} does not say what changes for a teacher`);
  });
});

test("the bible is stricter than the policy it supersedes, in the stated direction", () => {
  assert.ok(
    REPORTING_BIBLE_POLICY.mastery.accuracyPercentMinimum >
      LEARNING_EVIDENCE_POLICY.accuracyPercent.secureMinimum,
    "the bible's accuracy bar must be at least as high as the existing one"
  );
  assert.ok(
    REPORTING_BIBLE_POLICY.evidenceSufficiency.judgementMinimumScoredItems >=
      LEARNING_EVIDENCE_POLICY.minimumEvidence.learnerScoredResponses
  );
});

test("status labels and notes cover every status id", () => {
  Object.values(REPORT_STATUS_IDS).forEach(id => {
    assert.ok(REPORT_STATUS_LABELS[id], `${id} has no label`);
    assert.equal(reportStatusLabel(id), REPORT_STATUS_LABELS[id]);
  });
});
