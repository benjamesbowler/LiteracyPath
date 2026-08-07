import {
  LEARNING_EVIDENCE_POLICY,
  LEARNING_STATUS_IDS,
  LEARNING_STATUS_LABELS
} from "./learningPolicy.js";

/**
 * The machine-readable Reporting Bible.
 *
 * `docs/reporting/REPORTING_BIBLE.md` is the prose; this file is the numbers.
 * Every threshold, label, colour and rule that governs a report or an export is
 * defined exactly once, here, and consumed from here.
 *
 * Two hard rules, both learned the expensive way:
 *
 *  1. No number in the bible may be hand-copied into another module. Finding H1
 *     of `docs/ADVERSARIAL_AUDIT_2026-07-31.md` was a tuned threshold table
 *     silently overwritten by a flat constant, with a comment above it claiming
 *     the opposite. `tools/checkReportingBible.mjs` fails the build on a repeat.
 *
 *  2. Missing evidence is never zero. `not_enough_evidence` and `not_checked`
 *     are neutral states with neutral colours. A child who has not been assessed
 *     has not failed anything.
 */
export const REPORTING_BIBLE_VERSION = "2026.08.06-bible-1";

/* ------------------------------------------------------------------ *
 * Part IV — one status vocabulary, everywhere
 * ------------------------------------------------------------------ */

export const REPORT_STATUS_IDS = Object.freeze({
  SECURE: "secure",
  DEVELOPING: "developing",
  NEEDS_SUPPORT: "needs_support",
  MIXED_EVIDENCE: "mixed_evidence",
  NOT_ENOUGH_EVIDENCE: "not_enough_evidence",
  NOT_CHECKED: "not_checked"
});

/**
 * The only status strings any surface may display — screen, print or workbook.
 *
 * Retired display strings, kept working through `canonicalStatusId` but never
 * shown again: on_track, mastered, needs_teaching, not_started, not_assessed,
 * unscored_evidence, "Growing", "Not started yet", "Got it", "Almost there",
 * "Needs reteaching", "Needs more practice", "Mixed results" as a sixth ad-hoc
 * state invented in the UI layer.
 */
export const REPORT_STATUS_LABELS = Object.freeze({
  [REPORT_STATUS_IDS.SECURE]: "Secure",
  [REPORT_STATUS_IDS.DEVELOPING]: "Developing",
  [REPORT_STATUS_IDS.NEEDS_SUPPORT]: "Needs support",
  [REPORT_STATUS_IDS.MIXED_EVIDENCE]: "Mixed results",
  [REPORT_STATUS_IDS.NOT_ENOUGH_EVIDENCE]: "Not enough results",
  [REPORT_STATUS_IDS.NOT_CHECKED]: "Not checked"
});

/** Display order. Needs support first: it is the group a teacher acts on. */
export const REPORT_STATUS_ORDER = Object.freeze([
  REPORT_STATUS_IDS.NEEDS_SUPPORT,
  REPORT_STATUS_IDS.DEVELOPING,
  REPORT_STATUS_IDS.SECURE,
  REPORT_STATUS_IDS.MIXED_EVIDENCE,
  REPORT_STATUS_IDS.NOT_ENOUGH_EVIDENCE,
  REPORT_STATUS_IDS.NOT_CHECKED
]);

export const REPORT_STATUS_NOTES = Object.freeze({
  [REPORT_STATUS_IDS.NEEDS_SUPPORT]: "Review these first and assess again after giving support.",
  [REPORT_STATUS_IDS.DEVELOPING]: "Making progress but not secure yet.",
  [REPORT_STATUS_IDS.SECURE]: "Enough recent results support a secure judgement.",
  [REPORT_STATUS_IDS.MIXED_EVIDENCE]: "Two reliable sources disagree. Results are shown side by side, never averaged.",
  [REPORT_STATUS_IDS.NOT_ENOUGH_EVIDENCE]: "Some answers, but not enough for a judgement.",
  [REPORT_STATUS_IDS.NOT_CHECKED]: "This has not been checked yet."
});

const STATUS_ALIASES = Object.freeze({
  secure: REPORT_STATUS_IDS.SECURE,
  mastered: REPORT_STATUS_IDS.SECURE,
  on_track: REPORT_STATUS_IDS.SECURE,
  passed: REPORT_STATUS_IDS.SECURE,
  "got it": REPORT_STATUS_IDS.SECURE,
  developing: REPORT_STATUS_IDS.DEVELOPING,
  practising: REPORT_STATUS_IDS.DEVELOPING,
  practicing: REPORT_STATUS_IDS.DEVELOPING,
  growing: REPORT_STATUS_IDS.DEVELOPING,
  building: REPORT_STATUS_IDS.DEVELOPING,
  almost: REPORT_STATUS_IDS.DEVELOPING,
  "almost there": REPORT_STATUS_IDS.DEVELOPING,
  needs_support: REPORT_STATUS_IDS.NEEDS_SUPPORT,
  needs_teaching: REPORT_STATUS_IDS.NEEDS_SUPPORT,
  needs_practice: REPORT_STATUS_IDS.NEEDS_SUPPORT,
  "needs reteaching": REPORT_STATUS_IDS.NEEDS_SUPPORT,
  "needs more practice": REPORT_STATUS_IDS.NEEDS_SUPPORT,
  support: REPORT_STATUS_IDS.NEEDS_SUPPORT,
  mixed: REPORT_STATUS_IDS.MIXED_EVIDENCE,
  mixed_evidence: REPORT_STATUS_IDS.MIXED_EVIDENCE,
  "mixed results": REPORT_STATUS_IDS.MIXED_EVIDENCE,
  not_enough_evidence: REPORT_STATUS_IDS.NOT_ENOUGH_EVIDENCE,
  not_enough_yet: REPORT_STATUS_IDS.NOT_ENOUGH_EVIDENCE,
  "not enough results": REPORT_STATUS_IDS.NOT_ENOUGH_EVIDENCE,
  unscored_evidence: REPORT_STATUS_IDS.NOT_ENOUGH_EVIDENCE,
  not_checked: REPORT_STATUS_IDS.NOT_CHECKED,
  not_started: REPORT_STATUS_IDS.NOT_CHECKED,
  not_assessed: REPORT_STATUS_IDS.NOT_CHECKED,
  yet_to_learn: REPORT_STATUS_IDS.NOT_CHECKED,
  "not started yet": REPORT_STATUS_IDS.NOT_CHECKED,
  unseen: REPORT_STATUS_IDS.NOT_CHECKED
});

/**
 * The single boundary translator. Every legacy status id or display string in
 * the codebase enters the reporting layer through this function and leaves it
 * as one of six ids. Unknown input is `not_checked`, never a guess.
 */
export function canonicalStatusId(value) {
  if (!value) return REPORT_STATUS_IDS.NOT_CHECKED;
  const key = String(value).trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (STATUS_ALIASES[key]) return STATUS_ALIASES[key];
  const spaced = String(value).trim().toLowerCase();
  return STATUS_ALIASES[spaced] || REPORT_STATUS_IDS.NOT_CHECKED;
}

export function reportStatusLabel(value) {
  return REPORT_STATUS_LABELS[canonicalStatusId(value)];
}

/** True for the two states that mean "we have not looked hard enough yet". */
export function isNeutralStatus(value) {
  const id = canonicalStatusId(value);
  return id === REPORT_STATUS_IDS.NOT_ENOUGH_EVIDENCE || id === REPORT_STATUS_IDS.NOT_CHECKED;
}

/* ------------------------------------------------------------------ *
 * Part IV.2 — evidence sufficiency and the mastery gates
 * ------------------------------------------------------------------ */

export const EVIDENCE_SUFFICIENCY_IDS = Object.freeze({
  NONE: "none",
  INSUFFICIENT: "insufficient",
  PROVISIONAL: "provisional",
  SUFFICIENT: "sufficient"
});

export const EVIDENCE_SUFFICIENCY_LABELS = Object.freeze({
  [EVIDENCE_SUFFICIENCY_IDS.NONE]: "No results",
  [EVIDENCE_SUFFICIENCY_IDS.INSUFFICIENT]: "Not enough results",
  [EVIDENCE_SUFFICIENCY_IDS.PROVISIONAL]: "Provisional",
  [EVIDENCE_SUFFICIENCY_IDS.SUFFICIENT]: "Enough results"
});

export const REPORTING_BIBLE_POLICY = Object.freeze({
  id: "literacy-reporting-bible",
  version: REPORTING_BIBLE_VERSION,

  /**
   * Sinharay: subscores below ~20 items rarely add value over the total score,
   * and "subscores based on tests smaller than 10 items almost never have added
   * value". 10 is therefore the floor for any judgement at all; 10-19 renders
   * provisional with a visible uncertainty affordance.
   * https://files.eric.ed.gov/fulltext/ED523969.pdf
   */
  evidenceSufficiency: Object.freeze({
    judgementMinimumScoredItems: 10,
    confidentMinimumScoredItems: 20
  }),

  /**
   * Fuller & Fienup measured maintenance 3-4 weeks after acquisition:
   * 50% criterion -> 53.6% retained, 80% -> 69.1%, 90% -> 88.2%.
   * The field's 80% convention is convention, not evidence.
   * https://pmc.ncbi.nlm.nih.gov/articles/PMC5843573/
   */
  mastery: Object.freeze({
    accuracyPercentMinimum: 90,
    scoredItemsMinimum: 10,
    separateDaysMinimum: 2,
    separateDaysHighStakes: 3,
    retentionReprobeMinDays: 14,
    retentionReprobeMaxDays: 28,
    demoteOnRetentionFailure: true
  }),

  /** Accuracy bands below the mastery bar. Unchanged from learningPolicy. */
  accuracyPercent: Object.freeze({
    secureMinimum: LEARNING_EVIDENCE_POLICY.accuracyPercent.secureMinimum,
    developingMinimum: LEARNING_EVIDENCE_POLICY.accuracyPercent.developingMinimum,
    intensiveSupportMaximum: LEARNING_EVIDENCE_POLICY.accuracyPercent.intensiveSupportMaximum
  }),

  recency: Object.freeze({
    conclusionWindowDays: LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays
  }),

  /**
   * Van Norman & Nelson: the 4-point rule has a 57% false-positive rate at a
   * typical CBM-R standard error; 5 points -> 29%, 6 -> 13%, 7 -> 6%. NCII still
   * teaches the 4-point rule at 6 data points. We implement both, label the
   * 4-point output provisional, and recommend on 6.
   * https://ga.thereadingleague.org/wp-content/uploads/sites/32/2021/07/Decision-making-accuracy-of-CBM.pdf
   */
  trend: Object.freeze({
    minimumPointsForAnyLine: 5,
    minimumPointsForRecommendation: 6,
    minimumPointsForTrendLineRule: 8,
    robustEstimatorBelowPoints: 10,
    estimator: "theil-sen",
    fourPointRuleIsProvisional: true
  }),

  /**
   * Christ & Silberglitt: median SEM 10 WCPM (range 4-15) on a single passage;
   * 5-7 with a median of three. Passage difficulty alone moves scores by up to
   * 46 WCPM between easiest and hardest form.
   * https://brtprojects.org/wp-content/uploads/2022/07/NASP2013_v5.pdf
   */
  oralReadingFluency: Object.freeze({
    singlePassageWcpmStandardError: 10,
    medianOfThreeWcpmStandardError: 6,
    minimumReportableWcpmGain: 11,
    /** Hasbrouck & Tindal publish no Grade 1 fall norms. Hard block. */
    percentileBlockedGradeWindows: Object.freeze(["1:BOY"])
  }),

  /**
   * Acadience risk bands, reported as odds rather than colours. These describe
   * an external instrument's semantics; Literacy Guide does not compute a
   * band from them, it uses the odds language.
   * https://acadiencelearning.org/help-center/acadience-reading-k-6-benchmarks-and-cut-points-for-risk/
   */
  riskBands: Object.freeze([
    Object.freeze({ id: "above_benchmark", label: "Above benchmark", oddsLow: 90, oddsHigh: 99, support: "core" }),
    Object.freeze({ id: "at_benchmark", label: "At benchmark", oddsLow: 70, oddsHigh: 85, support: "core" }),
    Object.freeze({ id: "below_benchmark", label: "Below benchmark", oddsLow: 40, oddsHigh: 60, support: "strategic" }),
    Object.freeze({ id: "well_below_benchmark", label: "Well below benchmark", oddsLow: 10, oddsHigh: 20, support: "intensive" })
  ]),

  supportLevels: Object.freeze({
    core: "Effective base classroom instruction.",
    strategic: "Carefully targeted supplemental support in specific skill areas.",
    intensive: "Something more or something different — smaller groups, more time, explicit modelling, greater scaffolding."
  }),

  /**
   * Pathways-of-Progress style descriptors. Growth is normed conditional on
   * starting point. Literacy Guide has no such norms yet, so these are declared
   * but `growthPercentilesAvailable` is false and no percentile is emitted.
   */
  growth: Object.freeze({
    growthPercentilesAvailable: false,
    descriptors: Object.freeze([
      Object.freeze({ id: "well_above_typical", label: "Well above typical", minPercentile: 80 }),
      Object.freeze({ id: "above_typical", label: "Above typical", minPercentile: 60 }),
      Object.freeze({ id: "typical", label: "Typical", minPercentile: 40 }),
      Object.freeze({ id: "below_typical", label: "Below typical", minPercentile: 20 }),
      Object.freeze({ id: "well_below_typical", label: "Well below typical", minPercentile: 0 })
    ])
  }),

  /** Guskey's interpretability ceiling for a family-facing report. */
  audience: Object.freeze({
    familyMaximumStrands: 6,
    familyTargetReadingGrade: 8,
    familySuppressPercentiles: true,
    familySuppressScaledScores: true,
    familySuppressTextLevels: true,
    childSuppressStatusColours: true,
    interpretiveGuideMaximumPages: 4
  }),

  /** MTSS cadence defaults. Configurable, and honest about evidence level. */
  progressMonitoring: Object.freeze({
    tier1: Object.freeze({ cadence: "universal_screening_only", evidenceLevel: "moderate" }),
    tier2: Object.freeze({ everyNDays: 14, minimumEveryNDays: 30, evidenceLevel: "low" }),
    tier3: Object.freeze({ everyNDays: 7, evidenceLevel: "low" }),
    screeningWindowsPerYear: 3,
    regroupEveryNWeeks: 6,
    interventionTrialWeeksMin: 6,
    interventionTrialWeeksMax: 8,
    specialEducationEvaluationDays: 60
  }),

  /** Part X.5 — export privacy. */
  exportPrivacy: Object.freeze({
    identifiabilityModes: Object.freeze(["de_identified", "pseudonymous", "identified"]),
    defaultIdentifiabilityMode: "identified",
    defaultIdentifiabilityModeOutsideRoster: "pseudonymous",
    smallCellSuppressionThreshold: 10,
    includeFreeTextNotesByDefault: false,
    confidentialityBanner:
      "Contains student education records — protected under FERPA. Do not redistribute.",
    releaseNotice:
      "Once downloaded, this file is outside Literacy Guide's control. Store it under your school's records policy."
  })
});

/* ------------------------------------------------------------------ *
 * Part IV.2 — the sufficiency gate, as a function
 * ------------------------------------------------------------------ */

/**
 * The Law 2 gate. Given how many scored items back a judgement, decide whether
 * a judgement may be rendered at all, and how confidently.
 *
 * Returns `{ id, label, scoredItems, ready, provisional, minimumForJudgement,
 * minimumForConfidence, reason }`. `ready === false` means the caller must
 * render `not_enough_evidence`, not a status.
 */
export function evaluateEvidenceSufficiency(scoredItems, options = {}) {
  const {
    judgementMinimum = REPORTING_BIBLE_POLICY.evidenceSufficiency.judgementMinimumScoredItems,
    confidentMinimum = REPORTING_BIBLE_POLICY.evidenceSufficiency.confidentMinimumScoredItems
  } = options;
  const items = Number.isFinite(Number(scoredItems)) ? Math.max(0, Math.trunc(Number(scoredItems))) : 0;

  const base = {
    scoredItems: items,
    minimumForJudgement: judgementMinimum,
    minimumForConfidence: confidentMinimum,
    policyVersion: REPORTING_BIBLE_VERSION
  };

  if (items === 0) {
    return {
      ...base,
      id: EVIDENCE_SUFFICIENCY_IDS.NONE,
      label: EVIDENCE_SUFFICIENCY_LABELS[EVIDENCE_SUFFICIENCY_IDS.NONE],
      ready: false,
      provisional: false,
      reason: "Nothing has been assessed here yet."
    };
  }
  if (items < judgementMinimum) {
    return {
      ...base,
      id: EVIDENCE_SUFFICIENCY_IDS.INSUFFICIENT,
      label: EVIDENCE_SUFFICIENCY_LABELS[EVIDENCE_SUFFICIENCY_IDS.INSUFFICIENT],
      ready: false,
      provisional: false,
      reason: `${items} scored ${items === 1 ? "item" : "items"} — a skill judgement needs at least ${judgementMinimum}.`
    };
  }
  if (items < confidentMinimum) {
    return {
      ...base,
      id: EVIDENCE_SUFFICIENCY_IDS.PROVISIONAL,
      label: EVIDENCE_SUFFICIENCY_LABELS[EVIDENCE_SUFFICIENCY_IDS.PROVISIONAL],
      ready: true,
      provisional: true,
      reason: `${items} scored items — enough for a provisional judgement, ${confidentMinimum} for a confident one.`
    };
  }
  return {
    ...base,
    id: EVIDENCE_SUFFICIENCY_IDS.SUFFICIENT,
    label: EVIDENCE_SUFFICIENCY_LABELS[EVIDENCE_SUFFICIENCY_IDS.SUFFICIENT],
    ready: true,
    provisional: false,
    reason: `${items} scored items.`
  };
}

/**
 * The four mastery gates, evaluated together. Returns which gates passed and,
 * where a gate failed, the plain sentence a teacher reads on the tile.
 */
export function evaluateMasteryGates({
  accuracyPercent = null,
  scoredItems = 0,
  separateDays = 0,
  retentionPassed = null,
  highStakes = false,
  rateCriterionMet = null
} = {}) {
  const rules = REPORTING_BIBLE_POLICY.mastery;
  const daysNeeded = highStakes ? rules.separateDaysHighStakes : rules.separateDaysMinimum;
  const accuracy = Number.isFinite(Number(accuracyPercent)) ? Number(accuracyPercent) : null;

  const gates = [
    {
      id: "accuracy",
      label: `At least ${rules.accuracyPercentMinimum}% correct`,
      passed: accuracy !== null && accuracy >= rules.accuracyPercentMinimum,
      detail: accuracy === null ? "No scored answers yet." : `${Math.round(accuracy)}% correct.`
    },
    {
      id: "volume",
      label: `At least ${rules.scoredItemsMinimum} scored items`,
      passed: Number(scoredItems) >= rules.scoredItemsMinimum,
      detail: `${Number(scoredItems) || 0} scored so far.`
    },
    {
      id: "stability",
      label: `Met on at least ${daysNeeded} separate days`,
      passed: Number(separateDays) >= daysNeeded,
      detail: `${Number(separateDays) || 0} separate ${Number(separateDays) === 1 ? "day" : "days"} so far.`
    },
    {
      id: "retention",
      label: `Held up on a check ${rules.retentionReprobeMinDays}-${rules.retentionReprobeMaxDays} days later`,
      passed: retentionPassed === true,
      detail:
        retentionPassed === true
          ? "Retention check passed."
          : retentionPassed === false
            ? "Retention check not passed — status demoted."
            : "No retention check yet."
    }
  ];

  if (rateCriterionMet !== null) {
    gates.push({
      id: "rate",
      label: "Fast enough to be automatic",
      passed: rateCriterionMet === true,
      detail: rateCriterionMet === true ? "Rate criterion met." : "Not yet at the rate criterion."
    });
  }

  const failed = gates.filter(gate => !gate.passed);
  const demoted = rules.demoteOnRetentionFailure && retentionPassed === false;

  return {
    policyVersion: REPORTING_BIBLE_VERSION,
    gates,
    secure: failed.length === 0 && !demoted,
    demoted,
    /** The line rendered under a tile: the first unmet gate, in plain words. */
    whyNotSecure: demoted
      ? "This slipped on a later check, so it is no longer counted as secure."
      : failed.length === 0
        ? ""
        : failed[0].detail,
    summary: `Secure means ${rules.accuracyPercentMinimum}%+ across at least ${rules.scoredItemsMinimum} items on ${daysNeeded}+ separate days, still there ${rules.retentionReprobeMinDays}-${rules.retentionReprobeMaxDays} days later.`
  };
}

/**
 * Risk in odds language rather than a colour. Feed it a band id and it returns
 * the sentence the bible asks for.
 */
export function riskBandNarrative(bandId) {
  const band = REPORTING_BIBLE_POLICY.riskBands.find(entry => entry.id === bandId);
  if (!band) return null;
  return {
    ...band,
    supportLabel: band.support.charAt(0).toUpperCase() + band.support.slice(1),
    supportDetail: REPORTING_BIBLE_POLICY.supportLevels[band.support],
    sentence: `Children at this level have historically had a ${band.oddsLow}-${band.oddsHigh}% chance of meeting the next reading goal with strong classroom instruction alone.`
  };
}

/** Whether a trend line may be drawn at all, and with which estimator. */
export function evaluateTrendEligibility(pointCount) {
  const rules = REPORTING_BIBLE_POLICY.trend;
  const points = Number(pointCount) || 0;
  return {
    policyVersion: REPORTING_BIBLE_VERSION,
    points,
    mayDrawLine: points >= rules.minimumPointsForAnyLine,
    mayRecommend: points >= rules.minimumPointsForRecommendation,
    mayApplyTrendLineRule: points >= rules.minimumPointsForTrendLineRule,
    estimator: points < rules.robustEstimatorBelowPoints ? rules.estimator : "least-squares",
    provisional: points < rules.minimumPointsForRecommendation,
    reason:
      points >= rules.minimumPointsForRecommendation
        ? `${points} data points.`
        : points >= rules.minimumPointsForAnyLine
          ? `${points} data points — the line is shown, but a change of instruction needs ${rules.minimumPointsForRecommendation}.`
          : `${points} data ${points === 1 ? "point" : "points"} — a trend needs at least ${rules.minimumPointsForAnyLine}.`
  };
}

/**
 * Theil-Sen slope: the median of all pairwise slopes. Robust to the outliers
 * that make OLS untrustworthy on five to seven progress-monitoring points.
 * Returns null rather than a misleading number when there is nothing to fit.
 */
export function theilSenSlope(points = []) {
  const usable = (Array.isArray(points) ? points : [])
    .map(point => ({ x: Number(point?.x), y: Number(point?.y) }))
    .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))
    .sort((a, b) => a.x - b.x);
  if (usable.length < 2) return null;

  const slopes = [];
  for (let i = 0; i < usable.length - 1; i += 1) {
    for (let j = i + 1; j < usable.length; j += 1) {
      const dx = usable[j].x - usable[i].x;
      if (dx === 0) continue;
      slopes.push((usable[j].y - usable[i].y) / dx);
    }
  }
  if (!slopes.length) return null;
  slopes.sort((a, b) => a - b);
  const middle = Math.floor(slopes.length / 2);
  return slopes.length % 2 ? slopes[middle] : (slopes[middle - 1] + slopes[middle]) / 2;
}

/**
 * Whether a WCPM change may be called growth, or is inside the noise floor.
 * A 5-point "gain" between windows is measurement error, not learning.
 */
export function isReportableWcpmChange(change, { medianOfThree = false } = {}) {
  const rules = REPORTING_BIBLE_POLICY.oralReadingFluency;
  const error = medianOfThree ? rules.medianOfThreeWcpmStandardError : rules.singlePassageWcpmStandardError;
  const magnitude = Math.abs(Number(change) || 0);
  return {
    reportable: magnitude > error,
    standardError: error,
    band: `±${error} WCPM`,
    note: magnitude > error
      ? `A change of ${Math.round(magnitude)} WCPM is larger than the ±${error} WCPM measurement error.`
      : `A change of ${Math.round(magnitude)} WCPM is inside the ±${error} WCPM measurement error, so it is not reported as growth.`
  };
}

/* ------------------------------------------------------------------ *
 * Part III — the taxonomy
 * ------------------------------------------------------------------ */

export const SVR_COMPONENTS = Object.freeze({
  WORD_RECOGNITION: "word_recognition",
  LANGUAGE_COMPREHENSION: "language_comprehension"
});

export const SVR_COMPONENT_LABELS = Object.freeze({
  [SVR_COMPONENTS.WORD_RECOGNITION]: "Reading the words",
  [SVR_COMPONENTS.LANGUAGE_COMPREHENSION]: "Understanding language"
});

/**
 * Scarborough's Rope, level 2 of the taxonomy. Each strand carries the WWC
 * evidence tier for the domain, so a vocabulary bar is never given the same
 * visual weight as a decoding bar without the reader knowing why.
 */
export const ROPE_STRANDS = Object.freeze([
  Object.freeze({ id: "phonological_awareness", label: "Hearing sounds in words", svr: SVR_COMPONENTS.WORD_RECOGNITION, ccss: "RF.2", evidence: "strong" }),
  Object.freeze({ id: "decoding", label: "Sounding out words", svr: SVR_COMPONENTS.WORD_RECOGNITION, ccss: "RF.3", evidence: "strong" }),
  Object.freeze({ id: "sight_recognition", label: "Knowing words instantly", svr: SVR_COMPONENTS.WORD_RECOGNITION, ccss: "RF.3", evidence: "strong" }),
  Object.freeze({ id: "background_knowledge", label: "What they already know", svr: SVR_COMPONENTS.LANGUAGE_COMPREHENSION, ccss: "", evidence: "minimal" }),
  Object.freeze({ id: "vocabulary", label: "Word meanings", svr: SVR_COMPONENTS.LANGUAGE_COMPREHENSION, ccss: "L.4", evidence: "minimal" }),
  Object.freeze({ id: "language_structure", label: "How sentences work", svr: SVR_COMPONENTS.LANGUAGE_COMPREHENSION, ccss: "L.1", evidence: "minimal" }),
  Object.freeze({ id: "verbal_reasoning", label: "Thinking about meaning", svr: SVR_COMPONENTS.LANGUAGE_COMPREHENSION, ccss: "RL.1", evidence: "minimal" }),
  Object.freeze({ id: "literacy_knowledge", label: "How books and print work", svr: SVR_COMPONENTS.LANGUAGE_COMPREHENSION, ccss: "RF.1", evidence: "moderate" })
]);

/** UFLI Foundations scope and sequence — level 3, phonics reporting groups. */
export const PHONICS_GROUPS = Object.freeze([
  Object.freeze({ order: 1, id: "consonants_short_vowels", label: "Consonants and short vowels" }),
  Object.freeze({ order: 2, id: "double_letters_digraphs", label: "Double letters and consonant digraphs" }),
  Object.freeze({ order: 3, id: "cvce", label: "CVCe pattern" }),
  Object.freeze({ order: 4, id: "word_endings", label: "Word ending spelling patterns" }),
  Object.freeze({ order: 5, id: "r_controlled", label: "R-controlled vowels" }),
  Object.freeze({ order: 6, id: "vowel_teams_long", label: "Vowel teams (long vowel sounds)" }),
  Object.freeze({ order: 7, id: "vowel_teams_other", label: "Other vowel teams" }),
  Object.freeze({ order: 8, id: "diphthongs", label: "Diphthongs" }),
  Object.freeze({ order: 9, id: "silent_letters", label: "Silent letters" }),
  Object.freeze({ order: 10, id: "syllables", label: "Syllables" }),
  Object.freeze({ order: 11, id: "affixes", label: "Affixes" }),
  Object.freeze({ order: 12, id: "low_frequency_spellings", label: "Low frequency spellings" })
]);

/**
 * Phonological awareness order. Segmentation is the gateway. Manipulation is
 * measured but never used as a risk flag when segmentation is secure — a live
 * dispute (Shanahan, Clemens et al.) the product declines to alarm on.
 */
export const PA_PROGRESSION = Object.freeze([
  Object.freeze({ order: 1, id: "rhyme_syllable", label: "Rhyme and syllables", gateway: false, riskFlagEligible: true }),
  Object.freeze({ order: 2, id: "onset_rime", label: "Onset and rime", gateway: false, riskFlagEligible: true }),
  Object.freeze({ order: 3, id: "blending", label: "Blending sounds", gateway: false, riskFlagEligible: true }),
  Object.freeze({ order: 4, id: "segmentation", label: "Breaking words into sounds", gateway: true, riskFlagEligible: true }),
  Object.freeze({ order: 5, id: "manipulation", label: "Changing sounds in words", gateway: false, riskFlagEligible: false })
]);

/**
 * High-frequency words in three buckets. "X/100 sight words" is not reportable
 * because it hides the instructional difference: failing Flash Words is a
 * phonics problem, failing Heart Words is an orthographic-memory problem.
 */
export const HFW_BUCKETS = Object.freeze([
  Object.freeze({
    id: "flash",
    label: "Flash Words",
    description: "Regularly spelled and decodable — needed in a flash.",
    teachingNote: "Trouble here is usually a phonics gap, not a memory gap. Reteach the pattern."
  }),
  Object.freeze({
    id: "heart",
    label: "Heart Words",
    description: "Part of the word has to be learned by heart.",
    teachingNote: "Map the regular part, mark the irregular part, and rehearse it."
  }),
  Object.freeze({
    id: "temporarily_irregular",
    label: "Not decodable yet",
    description: "Becomes decodable once the pattern is taught.",
    teachingNote: "Teach the pattern; the word follows."
  })
]);

/** The four SVR profiles and the move each implies. */
export const SVR_PROFILES = Object.freeze([
  Object.freeze({
    id: "strong_strong",
    label: "Reading and understanding",
    wordRecognition: "strong",
    languageComprehension: "strong",
    move: "Move on to richer, harder texts and keep the talk going."
  }),
  Object.freeze({
    id: "weak_word_strong_language",
    label: "Understands more than they can read",
    wordRecognition: "weak",
    languageComprehension: "strong",
    move: "Explicit phonics and decoding. Keep reading aloud so ideas stay ahead of the print."
  }),
  Object.freeze({
    id: "strong_word_weak_language",
    label: "Reads the words, meaning not there yet",
    wordRecognition: "strong",
    languageComprehension: "weak",
    move: "Vocabulary, background knowledge and sentence structure. Check language history before anything else."
  }),
  Object.freeze({
    id: "weak_weak",
    label: "Both are still building",
    wordRecognition: "weak",
    languageComprehension: "weak",
    move: "Decoding first, language alongside. Ask whether a language screen would help."
  })
]);

export function resolveSvrProfile({ wordRecognitionSecure, languageComprehensionSecure } = {}) {
  const wr = wordRecognitionSecure ? "strong" : "weak";
  const lc = languageComprehensionSecure ? "strong" : "weak";
  return (
    SVR_PROFILES.find(profile => profile.wordRecognition === wr && profile.languageComprehension === lc) || null
  );
}

/* ------------------------------------------------------------------ *
 * Part VIII — the do-not-report list, as data
 * ------------------------------------------------------------------ */

export const REPORT_AUDIENCES = Object.freeze({
  TEACHER_DIAGNOSTIC: "teacher_diagnostic",
  TEACHER_PLANNING: "teacher_planning",
  LEADERSHIP: "leadership",
  FAMILY: "family",
  CHILD: "child"
});

export const DO_NOT_REPORT_RULES = Object.freeze([
  Object.freeze({
    id: "text_level",
    what: "A-Z or guided reading level",
    audiences: [REPORT_AUDIENCES.FAMILY, REPORT_AUDIENCES.CHILD],
    basis: "Fountas & Pinnell: a level is a teacher's tool, not a child's label."
  }),
  Object.freeze({
    id: "ranked_roster",
    what: "A roster ranked by performance with names attached",
    audiences: "all",
    basis: "Shepard on data walls; FERPA indirect-identifier risk."
  }),
  Object.freeze({
    id: "child_colour_band",
    what: "A status colour band shown to the child",
    audiences: [REPORT_AUDIENCES.CHILD],
    basis: "Normative feedback harms effort and interest, even anonymised."
  }),
  Object.freeze({
    id: "percentile",
    what: "A percentile, by default",
    audiences: [REPORT_AUDIENCES.FAMILY],
    basis: "CCSSO: avoid percentiles and overly technical metrics."
  }),
  Object.freeze({
    id: "diagnosis",
    what: "Any diagnosis or diagnosis-adjacent term",
    audiences: "all",
    basis: "Screening identifies concerns for further evaluation; it does not diagnose."
  }),
  Object.freeze({
    id: "prediction_as_fact",
    what: "A predicted future outcome stated as fact",
    audiences: "all",
    basis: "A screener cannot definitively predict future outcomes."
  }),
  Object.freeze({
    id: "thin_subscore",
    what: "A proficiency judgement from fewer than 10 scored items",
    audiences: "all",
    basis: "Sinharay on subscore added value."
  }),
  Object.freeze({
    id: "thin_trend",
    what: "A trend line from fewer than 5 data points",
    audiences: "all",
    basis: "Van Norman & Nelson: 57% false positives on the 4-point rule."
  }),
  Object.freeze({
    id: "g1_fall_orf",
    what: "An oral reading fluency percentile for Grade 1 in the fall",
    audiences: "all",
    basis: "Hasbrouck & Tindal publish no Grade 1 fall norms."
  }),
  Object.freeze({
    id: "unconfirmed_tier",
    what: "A tier assignment without human confirmation",
    audiences: "all",
    basis: "ED AI report: inspectable, explainable, overridable."
  }),
  Object.freeze({
    id: "peer_comparison",
    what: "A comparison to classmates",
    audiences: [REPORT_AUDIENCES.FAMILY, REPORT_AUDIENCES.CHILD],
    basis: "Normative feedback harms motivation."
  }),
  Object.freeze({
    id: "wida_level",
    what: "A WIDA proficiency level or score",
    audiences: "all",
    basis: "Proficiency levels are computed from cut scores WIDA owns and is re-setting."
  }),
  Object.freeze({
    id: "sped_referral",
    what: "A special education referral recommendation",
    audiences: "all",
    basis: "Over 90% of the variance in EL special-education classification is unrelated to English proficiency."
  })
]);

export function ruleForbids(ruleId, audience) {
  const rule = DO_NOT_REPORT_RULES.find(entry => entry.id === ruleId);
  if (!rule) return false;
  if (rule.audiences === "all") return true;
  return rule.audiences.includes(audience);
}

/* ------------------------------------------------------------------ *
 * Part VI — the non-dismissible notices
 * ------------------------------------------------------------------ */

export const STANDING_NOTICES = Object.freeze({
  rtiEvaluationRight:
    "A parent or carer may request a special education evaluation at any time. Moving through tiers of support is not a prerequisite, and support tiers must never delay an evaluation.",
  screeningIsNotDiagnosis:
    "These results identify where a student may need more support. They do not diagnose anything and are not a substitute for a formal evaluation.",
  missingIsNotZero:
    "Missing results are shown as missing. They are never counted as zero and never lower a student's standing.",
  accuracyIsNotMastery:
    "Answer accuracy and learning status are shown separately. A high percentage alone does not prove that learning is secure."
});

/* ------------------------------------------------------------------ *
 * Cross-check against the older policy module
 * ------------------------------------------------------------------ */

/**
 * The bible and `learningPolicy` describe the same world at different strictness.
 * This function reports the deltas so a migration is deliberate and dated rather
 * than an accident. `tools/checkReportingBible.mjs` prints it.
 */
export function reportingBibleMigrationDeltas() {
  return [
    {
      id: "secure_accuracy",
      from: `${LEARNING_EVIDENCE_POLICY.accuracyPercent.secureMinimum}%`,
      to: `${REPORTING_BIBLE_POLICY.mastery.accuracyPercentMinimum}%`,
      effect: "Fewer Secures. Intended — 85% retains ~69% at 3-4 weeks, 90% retains ~88%."
    },
    {
      id: "minimum_items",
      from: `${LEARNING_EVIDENCE_POLICY.minimumEvidence.learnerScoredResponses} scored responses`,
      to: `${REPORTING_BIBLE_POLICY.evidenceSufficiency.judgementMinimumScoredItems} scored items for any judgement, ${REPORTING_BIBLE_POLICY.evidenceSufficiency.confidentMinimumScoredItems} for a confident one`,
      effect: "More tiles read 'Not enough results'. Intended — subscores below 10 items carry no information."
    },
    {
      id: "retention",
      from: "no retention gate on concept tiles",
      to: `re-probe ${REPORTING_BIBLE_POLICY.mastery.retentionReprobeMinDays}-${REPORTING_BIBLE_POLICY.mastery.retentionReprobeMaxDays} days later, demote on failure`,
      effect: "Secure becomes revocable. This is the point of it."
    },
    {
      id: "status_vocabulary",
      from: "five vocabularies plus two ad-hoc string sets",
      to: `${Object.keys(REPORT_STATUS_LABELS).length} labels, one translator`,
      effect: "Screen and workbook say the same words about the same child."
    }
  ];
}

export const LEGACY_STATUS_LABEL_SOURCES = Object.freeze({
  learningPolicy: LEARNING_STATUS_LABELS,
  learningPolicyIds: LEARNING_STATUS_IDS
});
