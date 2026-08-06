import {
  MLL_COMPOSITES,
  MLL_DEFAULT_EXIT_CRITERIA,
  MLL_DOMAINS,
  MLL_EVIDENCE_SOURCES,
  MLL_KINDERGARTEN_LIMITS,
  MLL_LIFECYCLE_STAGES,
  MLL_MONITORING,
  MLL_POLICY_VERSION,
  MLL_SCALE_REBASELINE,
  crossesScaleRebaseline,
  gradeClusterForGrade,
  mllLevelLabel
} from "../../policy/mllLanguagePolicy.js";

/**
 * The multilingual-learner profile: who a student is, linguistically.
 *
 * Modelled on the fields a real district EL Individual Learning Plan carries
 * (Gloucester Public Schools Appendix M is the most complete public template),
 * and on what an EL teacher actually has to produce for an ILP meeting, a parent
 * conference, or a compliance audit.
 *
 * Three fields here are frequently missed elsewhere and are load-bearing:
 *
 *  - **Home language oral and home language literacy are tracked separately.**
 *    A child literate in Spanish transfers differently from one who is not, and
 *    a child whose first language uses a non-Latin script differs again.
 *  - **Every score carries its source.** ACCESS, screener and classroom evidence
 *    never share a visual treatment or an axis, so a report can never be misread
 *    as claiming a WIDA level it did not produce.
 *  - **The parent communication log records method and date.** That is the audit
 *    trail, and it is the thing an EL teacher is asked for and cannot reconstruct.
 */

export const MLL_PROFILE_SCHEMA_VERSION = 1;

export const MLL_PROGRAM_MODELS = Object.freeze([
  "ESL periods", "ESL class", "Pull-out", "Push-in", "Transitional bilingual",
  "Two-way bilingual", "Newcomer program", "SLIFE", "Sheltered instruction",
  "Consultation only", "Family declined services", "Other"
]);

export const MLL_SUPPORT_TYPES = Object.freeze([
  "Paraprofessional in-class support", "Title I", "Literacy support",
  "Tutoring", "Title III", "Math support", "Other"
]);

export const MLL_PARENT_CONTACT_METHODS = Object.freeze([
  "In person", "Phone", "Email", "Letter", "Interpreter-supported meeting", "Home visit", "Other"
]);

function safeString(value) {
  return value === null || value === undefined ? "" : String(value);
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * Normalise whatever the roster holds into the profile the reports expect.
 * Missing fields stay missing — never defaulted into a claim.
 */
export function buildMllStudentProfile(input = {}) {
  const grade = safeString(input.grade);
  const cluster = input.gradeCluster || gradeClusterForGrade(grade);

  return {
    schemaVersion: MLL_PROFILE_SCHEMA_VERSION,
    policyVersion: MLL_POLICY_VERSION,

    studentId: safeString(input.studentId),
    studentName: safeString(input.studentName),
    classId: safeString(input.classId),
    className: safeString(input.className),
    grade,
    gradeCluster: cluster,
    gradeClusterKnown: Boolean(cluster),

    isMultilingualLearner: input.isMultilingualLearner === true,
    lifecycleStage: MLL_LIFECYCLE_STAGES.some(stage => stage.id === input.lifecycleStage)
      ? input.lifecycleStage
      : "",
    dateFirstIdentified: safeString(input.dateFirstIdentified),
    dateExited: safeString(input.dateExited),
    monitoringYearsConfigured: safeNumber(input.monitoringYears) ?? MLL_MONITORING.essaReportingYears,

    // Language background — oral and literacy tracked apart, deliberately.
    homeLanguage: safeString(input.homeLanguage),
    homeLanguageOral: input.homeLanguageOral === undefined ? null : Boolean(input.homeLanguageOral),
    homeLanguageLiteracy: input.homeLanguageLiteracy === undefined ? null : Boolean(input.homeLanguageLiteracy),
    otherLanguages: Array.isArray(input.otherLanguages) ? input.otherLanguages.map(safeString) : [],
    countryOfOrigin: safeString(input.countryOfOrigin),
    yearsInUsSchools: safeNumber(input.yearsInUsSchools),

    // Assets, not gaps. WIDA's Can Do Philosophy, as a field.
    fundsOfKnowledge: safeString(input.fundsOfKnowledge),
    interests: safeString(input.interests),

    // Services
    programModel: safeString(input.programModel),
    serviceMinutesPerWeek: safeNumber(input.serviceMinutesPerWeek),
    serviceProvider: safeString(input.serviceProvider),
    supportTypes: Array.isArray(input.supportTypes) ? input.supportTypes.map(safeString) : [],
    accommodations: Array.isArray(input.accommodations) ? input.accommodations.map(safeString) : [],
    familyDeclinedServices: input.familyDeclinedServices === true,

    // Assessment history and district configuration
    languageAssessments: normalizeAssessments(input.languageAssessments),
    exitCriteria: normalizeExitCriteria(input.exitCriteria),

    goals: Array.isArray(input.goals) ? input.goals.map(normalizeGoal) : [],
    parentContacts: Array.isArray(input.parentContacts) ? input.parentContacts.map(normalizeContact) : [],
    notes: safeString(input.notes)
  };
}

function normalizeAssessments(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map(row => {
      const sourceId = safeString(row?.source).toLowerCase();
      const source =
        Object.values(MLL_EVIDENCE_SOURCES).find(entry => entry.id === sourceId) ||
        MLL_EVIDENCE_SOURCES.CLASSROOM;
      const domainLevels = {};
      const domainScaleScores = {};
      MLL_DOMAINS.forEach(domain => {
        const level = safeNumber(row?.domainLevels?.[domain.id]);
        const scale = safeNumber(row?.domainScaleScores?.[domain.id]);
        if (level !== null) domainLevels[domain.id] = level;
        if (scale !== null) domainScaleScores[domain.id] = scale;
      });
      const compositeLevels = {};
      MLL_COMPOSITES.forEach(composite => {
        const level = safeNumber(row?.compositeLevels?.[composite.id]);
        if (level !== null) compositeLevels[composite.id] = level;
      });
      return {
        id: safeString(row?.id) || `${sourceId}-${safeString(row?.administeredOn)}`,
        source: source.id,
        sourceLabel: source.label,
        official: source.official,
        testingYear: safeString(row?.testingYear),
        administeredOn: safeString(row?.administeredOn),
        gradeAtTest: safeString(row?.gradeAtTest),
        domainLevels,
        domainScaleScores,
        compositeLevels,
        preRebaseline: isPreRebaseline(row?.administeredOn),
        note: safeString(row?.note)
      };
    })
    .filter(row => row.administeredOn || Object.keys(row.domainLevels).length)
    .sort((a, b) => String(a.administeredOn).localeCompare(String(b.administeredOn)));
}

function isPreRebaseline(date) {
  const stamp = new Date(date).getTime();
  const boundary = new Date(MLL_SCALE_REBASELINE.boundaryDate).getTime();
  return Number.isFinite(stamp) ? stamp < boundary : null;
}

function normalizeExitCriteria(criteria) {
  if (!criteria) return { ...MLL_DEFAULT_EXIT_CRITERIA, configured: false };
  return {
    compositeId: safeString(criteria.compositeId) || "overall",
    compositeMinimum: safeNumber(criteria.compositeMinimum),
    domainFloor: safeNumber(criteria.domainFloor),
    additionalCriteria: Array.isArray(criteria.additionalCriteria)
      ? criteria.additionalCriteria.map(safeString)
      : [],
    effectiveFrom: safeString(criteria.effectiveFrom),
    effectiveTo: safeString(criteria.effectiveTo),
    source: safeString(criteria.source),
    configured: safeNumber(criteria.compositeMinimum) !== null
  };
}

function normalizeGoal(goal) {
  return {
    id: safeString(goal?.id),
    domain: safeString(goal?.domain),
    languageExpectation: safeString(goal?.languageExpectation),
    text: safeString(goal?.text),
    targetDate: safeString(goal?.targetDate),
    status: safeString(goal?.status) || "in_progress",
    evidence: safeString(goal?.evidence)
  };
}

function normalizeContact(contact) {
  return {
    date: safeString(contact?.date),
    method: safeString(contact?.method),
    language: safeString(contact?.language),
    topic: safeString(contact?.topic),
    outcome: safeString(contact?.outcome),
    interpreterUsed: contact?.interpreterUsed === true
  };
}

/* ------------------------------------------------------------------ *
 * Trajectory
 * ------------------------------------------------------------------ */

/**
 * The three-year, four-domain view an ILP meeting needs — with the 2025-26 break
 * marker inserted wherever the series crosses it.
 *
 * WIDA states plainly that scale scores from before and after the rebaseline are
 * not comparable. A chart that joins them draws a growth line out of a change of
 * instrument. The break row is not decoration; it is the correctness fix.
 */
export function buildMllTrajectory(profile = {}) {
  const assessments = Array.isArray(profile.languageAssessments) ? profile.languageAssessments : [];
  const points = [];
  let previous = null;

  assessments.forEach(assessment => {
    if (previous && crossesScaleRebaseline(previous.administeredOn, assessment.administeredOn)) {
      points.push({
        kind: "break",
        label: MLL_SCALE_REBASELINE.breakMarkerLabel,
        caution: MLL_SCALE_REBASELINE.caution,
        at: MLL_SCALE_REBASELINE.boundaryDate
      });
    }
    points.push({
      kind: "assessment",
      id: assessment.id,
      date: assessment.administeredOn,
      testingYear: assessment.testingYear,
      source: assessment.source,
      sourceLabel: assessment.sourceLabel,
      official: assessment.official,
      gradeAtTest: assessment.gradeAtTest,
      domains: MLL_DOMAINS.map(domain => ({
        id: domain.id,
        label: domain.label,
        level: assessment.domainLevels[domain.id] ?? null,
        levelLabel: assessment.domainLevels[domain.id] != null
          ? mllLevelLabel(Math.floor(assessment.domainLevels[domain.id]))
          : "",
        scaleScore: assessment.domainScaleScores[domain.id] ?? null
      })),
      composites: MLL_COMPOSITES.map(composite => ({
        id: composite.id,
        label: composite.label,
        level: assessment.compositeLevels[composite.id] ?? null
      }))
    });
    previous = assessment;
  });

  const crosses = points.some(point => point.kind === "break");
  return {
    points,
    crossesRebaseline: crosses,
    scaleScoreComparisonBlocked: crosses,
    note: crosses
      ? "This student's history spans the 2025-26 WIDA rebaseline. Scores either side of the marked line came from different tests on different scales and are not comparable. Growth across that line is not calculated."
      : ""
  };
}

/**
 * The most recent official levels, per domain, with their source and date.
 * Classroom evidence never fills a gap here — an empty domain stays empty.
 */
export function latestOfficialLevels(profile = {}) {
  const official = (profile.languageAssessments || []).filter(row => row.official);
  const latest = official.at(-1) || null;
  if (!latest) {
    return {
      available: false,
      note: "No official English language proficiency scores are on file for this student.",
      domains: MLL_DOMAINS.map(domain => ({ id: domain.id, label: domain.label, level: null, source: "", date: "" })),
      composites: []
    };
  }
  return {
    available: true,
    date: latest.administeredOn,
    source: latest.sourceLabel,
    testingYear: latest.testingYear,
    preRebaseline: latest.preRebaseline,
    caution: latest.preRebaseline === false ? MLL_SCALE_REBASELINE.caution : "",
    domains: MLL_DOMAINS.map(domain => ({
      id: domain.id,
      label: domain.label,
      level: latest.domainLevels[domain.id] ?? null,
      levelLabel: latest.domainLevels[domain.id] != null
        ? mllLevelLabel(Math.floor(latest.domainLevels[domain.id]))
        : "",
      scaleScore: latest.domainScaleScores[domain.id] ?? null,
      source: latest.sourceLabel,
      date: latest.administeredOn,
      kindergartenCeiling:
        profile.gradeCluster === "K" ? MLL_KINDERGARTEN_LIMITS.maximumLevelByDomain[domain.id] ?? null : null
    })),
    composites: MLL_COMPOSITES.map(composite => ({
      id: composite.id,
      label: composite.label,
      level: latest.compositeLevels[composite.id] ?? null,
      note: composite.note,
      headlineForK3: composite.k3Headline
    }))
  };
}

/** Monitoring status for an exited student, honest about the 2-vs-4 ambiguity. */
export function monitoringStatus(profile = {}, now = new Date()) {
  if (!profile.dateExited) return { applicable: false };
  const exited = new Date(profile.dateExited);
  if (Number.isNaN(exited.getTime())) return { applicable: false };
  const years = (now.getTime() - exited.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  const configured = profile.monitoringYearsConfigured || MLL_MONITORING.essaReportingYears;
  return {
    applicable: true,
    exitedOn: profile.dateExited,
    yearsSinceExit: Math.round(years * 10) / 10,
    configuredYears: configured,
    inMonitoringWindow: years < configured,
    yearsRemaining: Math.max(0, Math.round((configured - years) * 10) / 10),
    note: MLL_MONITORING.note
  };
}
