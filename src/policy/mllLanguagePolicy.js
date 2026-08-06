/**
 * Multilingual learner language policy — the WIDA layer.
 *
 * NAMING. "EL" in this codebase already means EL Education / EL Skills Block —
 * `elSkillsBlockCycles.js`, `ElSkillsQuest.jsx`, and the six `el_*` benchmark
 * assessments. That is curriculum alignment, not learner classification. This
 * module therefore uses **MLL — multilingual learner**, which is also WIDA's own
 * preferred term: it names the student by what they have rather than what they
 * lack. "English Learner" survives only where it is a legal term of art.
 *
 * WHAT THIS MODULE IS. A WIDA Language Development Portfolio, not a scoring
 * engine. It describes language along WIDA's own dimensions and never assigns a
 * WIDA proficiency level. Proficiency levels come from cut scores WIDA owns and
 * is currently re-setting; a third party cannot compute the quantity, and any
 * mapping published today is against 2016 cuts that expire in Spring 2027.
 *
 * See `docs/reporting/REPORTING_BIBLE.md` Part IX and
 * `docs/reporting/MLL_LANGUAGE_REPORTING.md`.
 */

export const MLL_POLICY_VERSION = "2026.08.06-mll-1";

/* ------------------------------------------------------------------ *
 * Proficiency levels
 * ------------------------------------------------------------------ */

/**
 * The six levels. Display number-first — "Level 3 (Developing)" — because the
 * 2020 PLD tables are numeric ("End of Level 1" … "Level 6") and will survive
 * the 2027 revision, while the names keep it legible to teachers.
 *
 * Level 6 has no "End of" in the source. That is deliberate: the framework
 * refuses to define a point at which a multilingual learner is finished.
 */
export const MLL_LEVELS = Object.freeze([
  Object.freeze({ level: 1, name: "Entering", boundaryLabel: "End of Level 1" }),
  Object.freeze({ level: 2, name: "Emerging", boundaryLabel: "End of Level 2" }),
  Object.freeze({ level: 3, name: "Developing", boundaryLabel: "End of Level 3" }),
  Object.freeze({ level: 4, name: "Expanding", boundaryLabel: "End of Level 4" }),
  Object.freeze({ level: 5, name: "Bridging", boundaryLabel: "End of Level 5" }),
  Object.freeze({ level: 6, name: "Reaching", boundaryLabel: "Level 6" })
]);

export function mllLevelLabel(level) {
  const entry = MLL_LEVELS.find(item => item.level === Number(level));
  return entry ? `Level ${entry.level} (${entry.name})` : "";
}

/**
 * The product emits ranges, never decimals.
 *
 * "Levels 2-3" is a description. "2.4" mimics a scale-score-derived quantity and
 * is the single clearest way to cross the line from describing language to
 * claiming a WIDA score. This function is the only sanctioned formatter.
 */
export function mllLevelRangeLabel(low, high) {
  const lo = Math.max(1, Math.min(6, Math.trunc(Number(low) || 0)));
  const hi = Math.max(1, Math.min(6, Math.trunc(Number(high) || lo)));
  if (!lo) return "Not enough evidence yet";
  if (lo === hi) return mllLevelLabel(lo);
  const lowName = MLL_LEVELS.find(item => item.level === Math.min(lo, hi))?.name || "";
  const highName = MLL_LEVELS.find(item => item.level === Math.max(lo, hi))?.name || "";
  return `Levels ${Math.min(lo, hi)}-${Math.max(lo, hi)} (${lowName} to ${highName})`;
}

/* ------------------------------------------------------------------ *
 * Domains, modes, dimensions
 * ------------------------------------------------------------------ */

export const MLL_DOMAINS = Object.freeze([
  Object.freeze({ id: "listening", label: "Listening", mode: "interpretive", order: 1 }),
  Object.freeze({ id: "speaking", label: "Speaking", mode: "expressive", order: 2 }),
  Object.freeze({ id: "reading", label: "Reading", mode: "interpretive", order: 3 }),
  Object.freeze({ id: "writing", label: "Writing", mode: "expressive", order: 4 })
]);

/**
 * The 2020 framework regrouped the four assessment domains into two standards
 * modes, adding viewing to interpretive and representing to expressive. Both
 * mappings are carried: domains for assessment, modes for standards.
 */
export const MLL_MODES = Object.freeze([
  Object.freeze({
    id: "interpretive",
    label: "Interpretive",
    description: "Listening, reading and viewing.",
    domains: ["listening", "reading"]
  }),
  Object.freeze({
    id: "expressive",
    label: "Expressive",
    description: "Speaking, writing and representing.",
    domains: ["speaking", "writing"]
  })
]);

/** The three PLD dimensions, with their 2020 named criteria. */
export const MLL_DIMENSIONS = Object.freeze([
  Object.freeze({
    id: "discourse",
    label: "Discourse",
    plainLabel: "How ideas hang together",
    criteria: ["Organization", "Cohesion", "Density"]
  }),
  Object.freeze({
    id: "sentence",
    label: "Sentence",
    plainLabel: "How sentences are built",
    criteria: ["Grammatical complexity"]
  }),
  Object.freeze({
    id: "word_phrase",
    label: "Word/Phrase",
    plainLabel: "Word choice",
    criteria: ["Precision"]
  })
]);

/**
 * The 2012 Performance Definitions, expressive. Still underpinning ACCESS score
 * interpretation through Spring 2027.
 *
 * Levels 5 and 6 are genuinely identical in the source table. That is not a
 * transcription error — Level 6 is distinguished by an accompanying note that
 * the student's language is comparable to English-proficient peers, not by
 * different dimension text. It will look like a data bug; it is not.
 */
export const MLL_PERFORMANCE_DEFINITIONS = Object.freeze({
  1: Object.freeze({
    discourse: "Words, phrases, or chunks of language",
    sentence: "Phrase-level grammatical structures",
    word_phrase: "General content-related words"
  }),
  2: Object.freeze({
    discourse: "Phrases or short sentences",
    sentence: "Formulaic grammatical structures",
    word_phrase: "General content words and expressions"
  }),
  3: Object.freeze({
    discourse: "Short and some expanded sentences with emerging complexity",
    sentence: "Simple and compound grammatical structures with occasional variation",
    word_phrase: "Specific content language, including cognates and expressions"
  }),
  4: Object.freeze({
    discourse: "Short, expanded, and some complex sentences",
    sentence: "Compound and complex grammatical structures",
    word_phrase: "Specific and some technical content-area language"
  }),
  5: Object.freeze({
    discourse: "Multiple, complex sentences",
    sentence: "A variety of complex grammatical structures matched to purpose",
    word_phrase: "Technical and abstract content-area language, including content-specific collocations"
  }),
  6: Object.freeze({
    discourse: "Multiple, complex sentences",
    sentence: "A variety of complex grammatical structures matched to purpose",
    word_phrase: "Technical and abstract content-area language, including content-specific collocations"
  })
});

/* ------------------------------------------------------------------ *
 * Composites
 * ------------------------------------------------------------------ */

/**
 * Composite weights, as printed on the ACCESS Individual Student Report.
 * WIDA's rationale: literacy scale scores carry greater weight than oral
 * language "due to their relative emphasis and importance to success in school."
 *
 * Order of operations, which any calculation must respect:
 *   domain scale scores -> weighted average -> composite scale score ->
 *   composite proficiency level.
 * Proficiency levels cannot be averaged to produce a composite.
 */
export const MLL_COMPOSITES = Object.freeze([
  Object.freeze({
    id: "oral_language",
    label: "Oral Language",
    weights: Object.freeze({ listening: 0.5, speaking: 0.5 }),
    k3Headline: true,
    note: "Listening and Speaking, weighted equally."
  }),
  Object.freeze({
    id: "literacy",
    label: "Literacy",
    weights: Object.freeze({ reading: 0.5, writing: 0.5 }),
    k3Headline: false,
    note: "Reading and Writing, weighted equally."
  }),
  Object.freeze({
    id: "comprehension",
    label: "Comprehension",
    weights: Object.freeze({ listening: 0.3, reading: 0.7 }),
    k3Headline: false,
    note: "Listening 30%, Reading 70%."
  }),
  Object.freeze({
    id: "overall",
    label: "Overall",
    weights: Object.freeze({ listening: 0.15, speaking: 0.15, reading: 0.35, writing: 0.35 }),
    k3Headline: false,
    note: "Listening 15%, Speaking 15%, Reading 35%, Writing 35%."
  })
]);

/**
 * K-3 reports lead with Oral Language, not Overall.
 *
 * Overall is 70% literacy-weighted. A young multilingual learner who
 * communicates well but cannot yet read posts a depressed Overall that
 * under-represents their functional English; a strong decoder with a speaking
 * gap posts a flattering one. Most platforms lead with Overall because it is the
 * exit number. For K-3 that is the wrong headline.
 */
export const MLL_K3_HEADLINE_COMPOSITE = "oral_language";

/**
 * Compute a composite scale score from domain scale scores. Returns null when a
 * required domain is missing, rather than silently treating it as zero — a
 * missing domain is a missing domain.
 */
export function computeCompositeScaleScore(compositeId, domainScaleScores = {}) {
  const composite = MLL_COMPOSITES.find(entry => entry.id === compositeId);
  if (!composite) return null;
  let total = 0;
  let weightUsed = 0;
  const missing = [];
  Object.entries(composite.weights).forEach(([domain, weight]) => {
    const value = Number(domainScaleScores?.[domain]);
    if (!Number.isFinite(value)) {
      missing.push(domain);
      return;
    }
    total += value * weight;
    weightUsed += weight;
  });
  if (missing.length) {
    return { compositeId, scaleScore: null, missingDomains: missing, complete: false };
  }
  return {
    compositeId,
    scaleScore: Math.round(total / weightUsed),
    missingDomains: [],
    complete: true
  };
}

/* ------------------------------------------------------------------ *
 * Kindergarten
 * ------------------------------------------------------------------ */

/**
 * Kindergarten ACCESS uses a restricted scale (100-400, versus 100-600 for
 * grades 1-12), so some proficiency levels are simply not available. WIDA:
 * "This is not a score cap. Rather, not having the full scale score range that
 * is available to Grades 1-12 also means some corresponding proficiency levels
 * are also not available."
 *
 * A naive distance-to-exit calculation will tell a teacher a kindergartner is
 * failing to progress toward a target that is arithmetically unreachable. Every
 * calculation in this module is kindergarten-aware.
 *
 * These figures predate the 2025-26 kindergarten redesign and may move at the
 * July 2026 standard setting. They are configuration, not constants.
 */
export const MLL_KINDERGARTEN_LIMITS = Object.freeze({
  scaleScoreMin: 100,
  scaleScoreMax: 400,
  maximumLevelByDomain: Object.freeze({
    listening: 6.0,
    speaking: 6.0,
    reading: 5.0,
    writing: 4.5
  }),
  provenance: "Pre-redesign WIDA guides. Verify after the July 2026 standard setting.",
  verified: false
});

export const MLL_SCALE_SCORE_RANGE = Object.freeze({ min: 100, max: 600 });

/** Screener domain rules. The kindergarten semester split is easy to get wrong. */
export const MLL_SCREENER_RULES = Object.freeze([
  Object.freeze({
    id: "k_first_semester",
    label: "Kindergarten, first semester",
    domains: ["listening", "speaking"],
    composite: "oral_language"
  }),
  Object.freeze({
    id: "k_second_semester_or_g1_first",
    label: "Kindergarten second semester, or Grade 1 first semester",
    domains: ["listening", "speaking", "reading", "writing"],
    composite: "overall"
  })
]);

/* ------------------------------------------------------------------ *
 * Exit criteria — configuration, never constants
 * ------------------------------------------------------------------ */

/**
 * State exit thresholds range 4.0 to 5.0. 5.0 is the most common (15 states);
 * the other 17 spread from 4.0 (Colorado, Florida) to about 4.8 (Alabama,
 * North Carolina, Oklahoma). Eight states require criteria beyond the ELP test.
 *
 * Criteria are frequently conjunctive — composite at or above X AND no domain
 * below Y — so the shape below supports that. Every threshold carries an
 * effective date, because the July 2026 standard setting will force every WIDA
 * state to revisit its cut.
 */
export const MLL_EXIT_CRITERIA_SHAPE = Object.freeze({
  compositeId: "overall",
  compositeMinimum: null,
  domainFloor: null,
  additionalCriteria: [],
  effectiveFrom: null,
  effectiveTo: null,
  source: ""
});

export const MLL_DEFAULT_EXIT_CRITERIA = Object.freeze({
  ...MLL_EXIT_CRITERIA_SHAPE,
  compositeId: "overall",
  compositeMinimum: 4.5,
  domainFloor: null,
  additionalCriteria: Object.freeze([]),
  effectiveFrom: "2016-01-01",
  source: "Placeholder. Replace with your state's published criteria before using distance-to-exit."
});

export const MLL_ADDITIONAL_EXIT_CRITERIA_TYPES = Object.freeze([
  "local_reading_data",
  "local_writing_data",
  "teacher_judgement",
  "language_use_inventory",
  "writing_sample",
  "passing_grades"
]);

/**
 * Distance to exit, kindergarten-aware and honest about what it cannot say.
 *
 * Returns `reachable: false` with an explanation when the configured target is
 * above the kindergarten ceiling, rather than reporting a shortfall against an
 * impossible number.
 */
export function evaluateDistanceToExit({
  gradeCluster = "2-3",
  compositeLevel = null,
  domainLevels = {},
  criteria = MLL_DEFAULT_EXIT_CRITERIA
} = {}) {
  const isKindergarten = String(gradeCluster) === "K";
  const target = Number(criteria?.compositeMinimum);
  const current = Number(compositeLevel);

  if (!Number.isFinite(target)) {
    return {
      policyVersion: MLL_POLICY_VERSION,
      applicable: false,
      reachable: null,
      note: "No exit criteria are configured for this district yet, so distance to exit is not shown."
    };
  }

  /**
   * The kindergarten trap, in two parts.
   *
   * Part one: the composite may be arithmetically out of reach. Part two — and
   * this is the commoner one — a domain floor may be unreachable even when the
   * composite is fine. Writing tops out around 4.5 at kindergarten, so a
   * district rule of "no domain below 4.5" is unsatisfiable for every
   * kindergartner in the state, and a naive calculation reports every one of
   * them as falling short.
   */
  const ceilings = MLL_KINDERGARTEN_LIMITS.maximumLevelByDomain;
  const compositeCeiling = isKindergarten
    ? compositeCeilingForKindergarten(criteria.compositeId, ceilings)
    : null;
  const unreachableDomainFloors = [];
  if (isKindergarten && Number.isFinite(Number(criteria?.domainFloor))) {
    const floor = Number(criteria.domainFloor);
    MLL_DOMAINS.forEach(domain => {
      const ceiling = ceilings[domain.id];
      if (Number.isFinite(ceiling) && floor > ceiling) {
        unreachableDomainFloors.push({ domain: domain.id, label: domain.label, floor, ceiling });
      }
    });
  }

  if (isKindergarten && compositeCeiling !== null && target > compositeCeiling) {
    return {
      policyVersion: MLL_POLICY_VERSION,
      applicable: true,
      reachable: false,
      target,
      current: Number.isFinite(current) ? current : null,
      ceiling: compositeCeiling,
      unreachableDomainFloors,
      note: `Kindergarten ACCESS uses a shorter scale, so the highest ${labelForComposite(criteria.compositeId)} available at this grade is about ${compositeCeiling}. The configured exit level of ${target} cannot be reached in kindergarten, so no shortfall is shown. This is a property of the test, not of the student.`
    };
  }

  if (unreachableDomainFloors.length) {
    const names = unreachableDomainFloors.map(entry => `${entry.label} (tops out at ${entry.ceiling})`).join(" and ");
    return {
      policyVersion: MLL_POLICY_VERSION,
      applicable: true,
      reachable: false,
      target,
      current: Number.isFinite(current) ? current : null,
      ceiling: compositeCeiling,
      unreachableDomainFloors,
      note: `The configured rule requires no domain below ${criteria.domainFloor}, but kindergarten ACCESS cannot produce that level in ${names}. No kindergartner can meet this rule, so no shortfall is shown against it. Check the district's kindergarten exit criteria.`
    };
  }

  const domainShortfalls = [];
  if (Number.isFinite(Number(criteria?.domainFloor))) {
    const floor = Number(criteria.domainFloor);
    MLL_DOMAINS.forEach(domain => {
      const value = Number(domainLevels?.[domain.id]);
      if (Number.isFinite(value) && value < floor) {
        domainShortfalls.push({ domain: domain.id, label: domain.label, level: value, floor });
      }
    });
  }

  /**
   * Reachable, but only at the very top of the scale. Worth saying out loud:
   * a target within half a level of the arithmetic ceiling means a kindergartner
   * would need close to the maximum in every domain, which is not a realistic
   * expectation to hold a five-year-old to.
   */
  const nearCeiling =
    isKindergarten && compositeCeiling !== null && target > compositeCeiling - 0.5;

  /** A floor sitting exactly on the ceiling is technically attainable and practically not. */
  const domainFloorsAtCeiling = [];
  if (isKindergarten && Number.isFinite(Number(criteria?.domainFloor))) {
    const floor = Number(criteria.domainFloor);
    MLL_DOMAINS.forEach(domain => {
      if (ceilings[domain.id] === floor) {
        domainFloorsAtCeiling.push({ domain: domain.id, label: domain.label, floor });
      }
    });
  }

  if (!Number.isFinite(current)) {
    return {
      policyVersion: MLL_POLICY_VERSION,
      applicable: true,
      reachable: true,
      target,
      current: null,
      domainShortfalls,
      note: `No ${labelForComposite(criteria.compositeId)} score on file, so distance to exit cannot be calculated. The configured target is ${target}.`
    };
  }

  const gap = Math.round((target - current) * 10) / 10;
  const ceilingCaveat = [
    nearCeiling
      ? ` Note that at kindergarten this composite tops out around ${compositeCeiling}, so the configured target of ${target} needs close to the maximum in every domain.`
      : "",
    domainFloorsAtCeiling.length
      ? ` The domain floor of ${criteria.domainFloor} is exactly the kindergarten ceiling for ${domainFloorsAtCeiling.map(entry => entry.label).join(" and ")}, so it can only be met at the very top of the scale.`
      : ""
  ].join("");
  return {
    policyVersion: MLL_POLICY_VERSION,
    applicable: true,
    reachable: true,
    nearCeiling,
    ceiling: compositeCeiling,
    target,
    current,
    gap: gap > 0 ? gap : 0,
    meetsComposite: current >= target,
    domainShortfalls,
    meetsAll: current >= target && !domainShortfalls.length,
    note:
      (current >= target && !domainShortfalls.length
        ? `Meets the configured exit criteria (${labelForComposite(criteria.compositeId)} ${target}+).`
        : current >= target
          ? `Meets the ${labelForComposite(criteria.compositeId)} threshold, but ${domainShortfalls.map(item => item.label).join(" and ")} sits below the domain floor of ${criteria.domainFloor}.`
          : `${gap} ${gap === 1 ? "level" : "levels"} below the configured exit threshold of ${target}.`) + ceilingCaveat
  };
}

function labelForComposite(compositeId) {
  return MLL_COMPOSITES.find(entry => entry.id === compositeId)?.label || "composite";
}

function compositeCeilingForKindergarten(compositeId, ceilings) {
  const composite = MLL_COMPOSITES.find(entry => entry.id === compositeId);
  if (!composite) return null;
  let total = 0;
  let weight = 0;
  Object.entries(composite.weights).forEach(([domain, share]) => {
    const ceiling = ceilings[domain];
    if (!Number.isFinite(ceiling)) return;
    total += ceiling * share;
    weight += share;
  });
  return weight ? Math.round((total / weight) * 10) / 10 : null;
}

/* ------------------------------------------------------------------ *
 * The 2025-26 discontinuity
 * ------------------------------------------------------------------ */

/**
 * WIDA rebuilt ACCESS for 2025-26 and rebaselined the scale.
 *
 * WIDA's own words: use 2025-26 proficiency level scores "with caution" (they
 * still carry 2016 cut scores), and "you cannot compare scale scores from
 * previous years." New cuts, revised PLDs and updated reports arrive Spring 2027
 * after the standard-setting event of 28-31 July 2026.
 *
 * Hard rule: never join scale scores across this boundary. Every trajectory
 * carries a visible break marker. This is correctness, not decoration.
 */
export const MLL_SCALE_REBASELINE = Object.freeze({
  boundaryTestingYear: "2025-2026",
  boundaryDate: "2025-07-01",
  newCutScoresExpected: "2027-03-01",
  standardSettingEvent: "2026-07-28",
  breakMarkerLabel: "New test, new scale — scores before and after this line are not comparable",
  caution:
    "WIDA advises using 2025-2026 proficiency level scores with caution: they reflect cut scores set in 2016. New cut scores and revised descriptors are expected in Spring 2027.",
  namingNote: 'The tests are now "WIDA ACCESS" and "WIDA ACCESS for Kindergarten" — "for ELLs" was dropped.'
});

export function crossesScaleRebaseline(dateA, dateB) {
  const boundary = new Date(MLL_SCALE_REBASELINE.boundaryDate).getTime();
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return (a < boundary) !== (b < boundary);
}

/* ------------------------------------------------------------------ *
 * Grade clusters
 * ------------------------------------------------------------------ */

/**
 * Six clusters exist; a K-3 product spans three of them. Do not treat K-3 as one
 * band for PLDs or Language Expectations. The single exception is Standard 1
 * (Social and Instructional Language), which WIDA does band as ELD-SI.K-3.
 */
export const MLL_GRADE_CLUSTERS = Object.freeze([
  Object.freeze({ id: "K", label: "Kindergarten", grades: ["K"] }),
  Object.freeze({ id: "1", label: "Grade 1", grades: ["1"] }),
  Object.freeze({ id: "2-3", label: "Grades 2-3", grades: ["2", "3"] })
]);

export function gradeClusterForGrade(grade) {
  const value = String(grade || "").trim().toUpperCase();
  if (value === "K" || value === "KG" || value === "0") return "K";
  if (value === "1") return "1";
  if (value === "2" || value === "3") return "2-3";
  return "";
}

/* ------------------------------------------------------------------ *
 * Standards
 * ------------------------------------------------------------------ */

export const MLL_STANDARDS = Object.freeze([
  Object.freeze({ code: "SI", number: 1, label: "Social and Instructional Language", statement: "English language learners communicate for Social and Instructional purposes within the school setting" }),
  Object.freeze({ code: "LA", number: 2, label: "Language for Language Arts", statement: "English language learners communicate information, ideas, and concepts necessary for academic success in the content area of Language Arts" }),
  Object.freeze({ code: "MA", number: 3, label: "Language for Mathematics", statement: "English language learners communicate information, ideas, and concepts necessary for academic success in the content area of Mathematics" }),
  Object.freeze({ code: "SC", number: 4, label: "Language for Science", statement: "English language learners communicate information, ideas, and concepts necessary for academic success in the content area of Science" }),
  Object.freeze({ code: "SS", number: 5, label: "Language for Social Studies", statement: "English language learners communicate information, ideas, and concepts necessary for academic success in the content area of Social Studies" })
]);

export const MLL_KEY_LANGUAGE_USES = Object.freeze([
  Object.freeze({ id: "narrate", label: "Narrate", definition: "Narrate highlights language to recount events in a sequenced manner." }),
  Object.freeze({ id: "inform", label: "Inform", definition: "Inform highlights language to name, define, describe, or compare and contrast something." }),
  Object.freeze({ id: "explain", label: "Explain", definition: "Explain highlights language to give an account for how things work or why things happen." }),
  Object.freeze({ id: "argue", label: "Argue", definition: "Argue highlights language to justify claims using evidence and reasoning." })
]);

/**
 * The complete ELD-SI.K-3 Language Expectations, verbatim.
 *
 * This is the single most directly encodable artefact in the framework for a
 * K-3 product: Standard 1 is the one standard WIDA bands across all of K-3, so
 * a K-3 app can use it whole without splitting by cluster.
 */
export const MLL_ELD_SI_K3 = Object.freeze({
  narrate: Object.freeze([
    "Share ideas about one's own and others' lived experiences and previous learning",
    "Connect stories with images and representations to add meaning",
    "Ask questions about what others have shared",
    "Recount and restate ideas",
    "Discuss how stories might end or next steps"
  ]),
  inform: Object.freeze([
    "Define and classify objects or concepts",
    "Describe characteristics, patterns, or behavior",
    "Describe parts and wholes",
    "Sort, clarify, and summarize ideas",
    "Summarize information from interaction with others and from learning experiences"
  ]),
  explain: Object.freeze([
    "Share initial thinking with others",
    "Follow and describe cycles in diagrams, steps in procedures, or causes and effects",
    "Compare and contrast objects or concepts",
    "Offer ideas and suggestions",
    "Act on feedback to revise understandings of how or why something works"
  ]),
  argue: Object.freeze([
    "Ask questions about others' opinions",
    "Support own opinions with reasons",
    "Clarify and elaborate ideas based on feedback",
    "Defend change in one's own thinking",
    "Revise one's own opinions based on new information"
  ])
});

/** ELD-[Standard].[Cluster].[Key Language Use].[Mode] */
export function languageExpectationCode({ standard = "SI", cluster = "K-3", keyLanguageUse = "narrate", mode = "" } = {}) {
  const klu = MLL_KEY_LANGUAGE_USES.find(entry => entry.id === keyLanguageUse)?.label || "";
  const modeLabel = mode ? `.${mode.charAt(0).toUpperCase()}${mode.slice(1)}` : "";
  return `ELD-${standard}.${cluster}.${klu}${modeLabel}`;
}

/* ------------------------------------------------------------------ *
 * Claims discipline
 * ------------------------------------------------------------------ */

export const MLL_STANDING_DISCLAIMER = Object.freeze({
  paragraphs: Object.freeze([
    "Literacy Guide generates classroom evidence of language development aligned to the WIDA English Language Development Standards Framework, 2020 Edition. It describes what multilingual learners can do using the language of the WIDA Proficiency Level Descriptors across the discourse, sentence, and word/phrase dimensions.",
    "Literacy Guide does not produce WIDA proficiency levels or scores. Official English language proficiency levels come only from your state's designated ELP assessment. Use this evidence alongside — never instead of — those results.",
    "WIDA is a registered trademark of the Board of Regents of the University of Wisconsin System. These alignments are not affiliated with, sponsored by, or endorsed by the Board of Regents of the University of Wisconsin System."
  ]),
  short:
    "Classroom evidence aligned to the WIDA ELD Standards Framework. Not a WIDA proficiency level or score."
});

/** Where a score-like value came from. These never share an axis or a colour. */
export const MLL_EVIDENCE_SOURCES = Object.freeze({
  ACCESS: Object.freeze({ id: "access", label: "WIDA ACCESS", official: true }),
  SCREENER: Object.freeze({ id: "screener", label: "WIDA Screener", official: true }),
  MODEL: Object.freeze({ id: "model", label: "WIDA MODEL", official: true }),
  DISTRICT: Object.freeze({ id: "district", label: "District assessment", official: false }),
  CLASSROOM: Object.freeze({ id: "classroom", label: "Classroom evidence (Literacy Guide)", official: false }),
  TEACHER: Object.freeze({ id: "teacher", label: "Teacher observation", official: false })
});

/**
 * The asset-based copy linter.
 *
 * Every descriptor in the bank begins with a gerund of an observable action and
 * describes present capability, never absence. This checks generated prose for
 * the deficit constructions the Can Do Philosophy exists to displace.
 */
export const MLL_BANNED_PHRASES = Object.freeze([
  { pattern: /\bcannot yet\b/i, instead: "is beginning to" },
  { pattern: /\bstruggl(es|ing)\b/i, instead: "is developing" },
  { pattern: /\blacks\b/i, instead: "is building" },
  { pattern: /\blow proficiency\b/i, instead: "Level 2 (Emerging)" },
  { pattern: /\bweak in (listening|speaking|reading|writing)\b/i, instead: "at an earlier level in that domain" },
  { pattern: /\blanguage deficit\b/i, instead: "language development" },
  { pattern: /\blanguage barrier\b/i, instead: "developing English alongside their home language" },
  { pattern: /\bnon-?English speaker\b/i, instead: "emerging bilingual" },
  { pattern: /\bfailed to progress\b/i, instead: "growth not yet visible on this measure" },
  { pattern: /\blimited English\b/i, instead: "developing English" },
  { pattern: /\bdeficien(t|cy)\b/i, instead: "still developing" }
]);

export function lintMllLanguage(text) {
  const value = String(text || "");
  return MLL_BANNED_PHRASES
    .filter(rule => rule.pattern.test(value))
    .map(rule => ({
      matched: value.match(rule.pattern)?.[0] || "",
      instead: rule.instead,
      message: `"${value.match(rule.pattern)?.[0]}" is deficit framing — write "${rule.instead}" instead.`
    }));
}

/* ------------------------------------------------------------------ *
 * Lifecycle
 * ------------------------------------------------------------------ */

export const MLL_LIFECYCLE_STAGES = Object.freeze([
  Object.freeze({ id: "home_language_survey", label: "Home language survey", note: "At enrollment, for every student." }),
  Object.freeze({ id: "screened", label: "Screened", note: "Within 30 days of enrollment in most states." }),
  Object.freeze({ id: "identified", label: "Identified", note: "Parent notification within 30 days of the school year, or 2 weeks for a mid-year enrollee." }),
  Object.freeze({ id: "served", label: "Receiving language support", note: "Families may decline services in writing, annually." }),
  Object.freeze({ id: "monitoring", label: "Monitoring after exit", note: "Four years under ESSA reporting; some states also require two years of active monitoring." }),
  Object.freeze({ id: "former", label: "Former multilingual learner", note: "Monitoring period complete." }),
  Object.freeze({ id: "never_identified", label: "Not identified", note: "Screened and not eligible, or no other language indicated." })
]);

/**
 * ESEA §1112(e)(3) parent notification. Eight required elements, verbatim in
 * intent. Elements 2 and 6 are directly generatable by this module.
 */
export const MLL_PARENT_NOTIFICATION = Object.freeze({
  deadlineDaysFromSchoolYearStart: 30,
  deadlineWeeksForMidYearEnrollee: 2,
  languageRule:
    "In an understandable and uniform format and, to the extent practicable, in a language the parents can understand.",
  requiredElements: Object.freeze([
    { id: "reasons", label: "Why the child was identified and needs placement", generatable: false },
    { id: "level_and_achievement", label: "The child's level of English proficiency, how it was assessed, and their academic achievement status", generatable: true },
    { id: "methods", label: "Methods of instruction in this program and in other available programs", generatable: false },
    { id: "strengths_and_needs", label: "How the program will meet the child's strengths and needs", generatable: false },
    { id: "how_it_helps", label: "How the program will help the child learn English and meet academic standards", generatable: false },
    { id: "exit_requirements", label: "Specific exit requirements and the expected rate of transition", generatable: true },
    { id: "iep", label: "For a child with a disability, how the program meets IEP objectives", generatable: false },
    { id: "parent_rights", label: "The right to remove the child from the program on request, decline enrollment, or choose another program", generatable: false }
  ])
});

export const MLL_MONITORING = Object.freeze({
  essaReportingYears: 4,
  commonStateActiveMonitoringYears: 2,
  recordRetentionYearsAfterLastAttendance: 4,
  note:
    "Both 2 and 4 are correct in different contexts. ESSA requires four years of reporting former multilingual learners' results in Title I accountability; many state policies specify two years of active monitoring. Configurable, default 4."
});

/* ------------------------------------------------------------------ *
 * What this module refuses to do
 * ------------------------------------------------------------------ */

export const MLL_PROHIBITIONS = Object.freeze([
  Object.freeze({
    id: "no_wida_level",
    rule: "Never emit a WIDA proficiency level or a decimal proficiency score.",
    because: "Levels are computed from cut scores WIDA owns and is re-setting in 2026-27."
  }),
  Object.freeze({
    id: "no_decimals",
    rule: "Emit level ranges, never decimals.",
    because: "A decimal mimics scale-score precision this product does not have."
  }),
  Object.freeze({
    id: "no_sped_referral",
    rule: "Never recommend a special education referral.",
    because:
      "Over 90% of the variance in multilingual-learner special-education classification is unrelated to English proficiency."
  }),
  Object.freeze({
    id: "no_transfer_claim_without_l1",
    rule: "Never offer a language-transfer analysis without a recorded home language.",
    because: "A transfer hypothesis without a named L1 is a guess dressed as evidence."
  }),
  Object.freeze({
    id: "no_cross_rebaseline_join",
    rule: "Never join WIDA scale scores across the 2025-26 rebaseline.",
    because: "WIDA states the scores are not comparable."
  }),
  Object.freeze({
    id: "no_deficit_at_entering",
    rule: "Suppress deficit framing automatically at Levels 1-2.",
    because: "Low English performance at Entering and Emerging is the expected pattern, not a problem."
  })
]);
