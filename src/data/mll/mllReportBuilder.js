import {
  MLL_COMPOSITES,
  MLL_DIMENSIONS,
  MLL_DOMAINS,
  MLL_ELD_SI_K3,
  MLL_K3_HEADLINE_COMPOSITE,
  MLL_KEY_LANGUAGE_USES,
  MLL_PARENT_NOTIFICATION,
  MLL_POLICY_VERSION,
  MLL_PROHIBITIONS,
  MLL_STANDING_DISCLAIMER,
  evaluateDistanceToExit,
  languageExpectationCode,
  lintMllLanguage,
  mllLevelLabel,
  mllLevelRangeLabel
} from "../../policy/mllLanguagePolicy.js";
import { canDoStatementsForReport } from "./widaCanDoBank.js";
import { analyzeL1Transfer, transferReferenceRows } from "./l1TransferModel.js";
import {
  buildMllStudentProfile,
  buildMllTrajectory,
  latestOfficialLevels,
  monitoringStatus
} from "./mllStudentProfile.js";

/**
 * Builds the multilingual-learner report.
 *
 * The eleven sections are fixed by the bible (Part IX.8) and by what an EL
 * teacher actually has to put on the table at an ILP meeting or a parent
 * conference. The order is not cosmetic: identity and assets come before any
 * score, and the transfer analysis comes before anything that could be read as
 * a concern.
 *
 * This builder never produces a WIDA proficiency level. Where it describes a
 * working level from classroom evidence it emits a range, labels the source, and
 * says in the same breath that it is not a WIDA score.
 */

export const MLL_REPORT_SCHEMA_VERSION = 1;

export const MLL_REPORT_SECTIONS = Object.freeze([
  { id: "identity", title: "Student and language background" },
  { id: "proficiency", title: "Current English language proficiency" },
  { id: "trajectory", title: "Language proficiency over time" },
  { id: "exit", title: "Progress toward exit criteria" },
  { id: "can_do", title: "What this student can do now" },
  { id: "classroom_evidence", title: "Classroom language evidence" },
  { id: "transfer", title: "First-language transfer" },
  { id: "services", title: "Services and accommodations" },
  { id: "goals", title: "Language goals" },
  { id: "family", title: "For families" },
  { id: "audit", title: "Record of communication" }
]);

/* ------------------------------------------------------------------ *
 * Turning literacy evidence into language evidence
 * ------------------------------------------------------------------ */

/**
 * Extract sound-level error patterns from the reporting workspace so the
 * transfer analysis has something to work on.
 *
 * The app already records, per concept, how many opportunities a child had and
 * how many they got right. Where the concept is a phoneme-level construct, a
 * pattern of misses on one target sound is exactly the input the transfer model
 * needs — and `correctElsewhere` falls out of the same data, which is what makes
 * the disconfirming-evidence sentence possible.
 */
export function extractSoundErrorPatterns(workspace = {}, { minimumOpportunities = 2 } = {}) {
  const concepts = workspace?.wholeChild?.concepts || [];
  const soundConstructs = new Set([
    "initial_sound", "final_sound", "medial_sound", "phoneme", "letter_sound",
    "grapheme_sound", "digraph", "blend", "vowel_sound", "encoding_phoneme"
  ]);

  const byTarget = new Map();
  concepts.forEach(concept => {
    if (!soundConstructs.has(concept.construct)) return;
    const basis = concept.currentEvidenceBasis || concept.evidenceBasis || {};
    const opportunities = Number(basis.observations ?? basis.total ?? 0);
    const correct = Number(basis.correct ?? 0);
    if (!opportunities) return;

    const target = String(concept.key || "").toLowerCase();
    if (!target) return;
    const position = concept.construct.startsWith("initial")
      ? "initial"
      : concept.construct.startsWith("final")
        ? "final"
        : concept.construct.startsWith("medial")
          ? "medial"
          : "any";

    const key = `${target}:${position}`;
    const existing = byTarget.get(key) || {
      targetPhoneme: target,
      position,
      occurrences: 0,
      opportunities: 0,
      correct: 0,
      examples: [],
      conceptIds: []
    };
    existing.opportunities += opportunities;
    existing.correct += correct;
    existing.occurrences += Math.max(0, opportunities - correct);
    existing.conceptIds.push(concept.conceptId);
    (concept.evidence || []).slice(0, 3).forEach(row => {
      const word = row?.provenance?.word || row?.details?.word;
      if (word && existing.examples.length < 4 && !existing.examples.includes(word)) {
        existing.examples.push(word);
      }
    });
    byTarget.set(key, existing);
  });

  const targetsCorrectSomewhere = new Set();
  byTarget.forEach(row => {
    if (row.correct > 0) targetsCorrectSomewhere.add(row.targetPhoneme);
  });

  return Array.from(byTarget.values())
    .filter(row => row.occurrences > 0 && row.opportunities >= minimumOpportunities)
    .map(row => ({
      ...row,
      correctElsewhere: row.correct > 0 || targetsCorrectSomewhere.has(row.targetPhoneme),
      accuracyPercent: row.opportunities ? Math.round((row.correct / row.opportunities) * 100) : null
    }))
    .sort((a, b) => b.occurrences - a.occurrences);
}

/**
 * A working-level RANGE from classroom evidence, never a level.
 *
 * The width of the range is the honesty. Thin evidence yields a wide range;
 * plentiful, consistent evidence narrows it. A single number here would be a
 * WIDA proficiency level in everything but name, which is exactly the line the
 * bible forbids crossing.
 */
export function estimateWorkingLevelRange({
  officialLevel = null,
  classroomEvidenceCount = 0,
  domain = ""
} = {}) {
  // `Number(null)` is 0 and `Number.isFinite(0)` is true, so a null official
  // level would silently anchor the range on "Level 0". Guard explicitly.
  const official = officialLevel === null || officialLevel === undefined || officialLevel === ""
    ? NaN
    : Number(officialLevel);
  if (Number.isFinite(official) && official >= 1) {
    const base = Math.floor(official);
    return {
      low: base,
      high: Math.min(6, base + 1),
      label: mllLevelRangeLabel(base, Math.min(6, base + 1)),
      basis: "official_anchored",
      domain,
      note: `Anchored on the most recent official score of ${mllLevelLabel(base)}, widened by one level because classroom performance moves within a level between tests.`
    };
  }
  if (!classroomEvidenceCount) {
    return {
      low: null,
      high: null,
      label: "Not enough evidence yet",
      basis: "none",
      domain,
      note: "No official score and no classroom language evidence yet, so no working range is offered."
    };
  }
  return {
    low: null,
    high: null,
    label: "Classroom evidence only — no range offered",
    basis: "classroom_only",
    domain,
    note:
      "There is classroom language evidence but no official score to anchor it. Literacy Guide will describe what this student can do, but it will not estimate a proficiency range from classroom evidence alone — that would be a WIDA level in all but name."
  };
}

/* ------------------------------------------------------------------ *
 * The student report
 * ------------------------------------------------------------------ */

export function buildMllStudentReport({
  student = {},
  workspace = null,
  exitCriteria = null,
  now = new Date(),
  generatedBy = ""
} = {}) {
  const profile = buildMllStudentProfile({ ...student, exitCriteria: exitCriteria || student.exitCriteria });
  const studentName = profile.studentName || "This student";
  const official = latestOfficialLevels(profile);
  const trajectory = buildMllTrajectory(profile);
  const monitoring = monitoringStatus(profile, now);

  const headlineComposite =
    MLL_COMPOSITES.find(entry => entry.id === MLL_K3_HEADLINE_COMPOSITE) || MLL_COMPOSITES[0];
  const headlineLevel = official.available
    ? official.composites.find(entry => entry.id === headlineComposite.id)?.level ?? null
    : null;

  const distanceToExit = evaluateDistanceToExit({
    gradeCluster: profile.gradeCluster,
    compositeLevel: official.available
      ? official.composites.find(entry => entry.id === profile.exitCriteria.compositeId)?.level ?? null
      : null,
    domainLevels: official.available
      ? Object.fromEntries(official.domains.map(domain => [domain.id, domain.level]))
      : {},
    criteria: profile.exitCriteria
  });

  const errorPatterns = workspace ? extractSoundErrorPatterns(workspace) : [];
  const lowestOfficialLevel = official.available
    ? official.domains.map(domain => domain.level).filter(level => level != null).sort((a, b) => a - b)[0] ?? null
    : null;

  const transfer = analyzeL1Transfer({
    homeLanguage: profile.homeLanguage,
    homeLanguageLiteracy: profile.homeLanguageLiteracy,
    errors: errorPatterns,
    proficiencyLevelLow: lowestOfficialLevel,
    studentName
  });

  const canDoByDomain = MLL_DOMAINS.map(domain => {
    const domainLevel = official.available
      ? official.domains.find(entry => entry.id === domain.id)?.level ?? null
      : null;
    const range = estimateWorkingLevelRange({
      officialLevel: domainLevel,
      classroomEvidenceCount: errorPatterns.length,
      domain: domain.id
    });
    const canDo = canDoStatementsForReport({
      cluster: profile.gradeCluster,
      levelLow: range.low,
      domain: domain.id,
      count: 4
    });
    return {
      domain: domain.id,
      domainLabel: domain.label,
      mode: domain.mode,
      officialLevel: domainLevel,
      officialLevelLabel: domainLevel != null ? mllLevelLabel(Math.floor(domainLevel)) : "",
      range,
      statements: canDo.statements,
      note: canDo.note
    };
  });

  const classroomEvidence = buildClassroomEvidenceSection(workspace, profile, transfer);

  const report = {
    schemaVersion: MLL_REPORT_SCHEMA_VERSION,
    policyVersion: MLL_POLICY_VERSION,
    reportType: "mll_student",
    generatedAt: (now instanceof Date ? now : new Date(now)).toISOString(),
    generatedBy,
    profile,
    sections: MLL_REPORT_SECTIONS,

    headline: buildHeadline({ studentName, profile, official, headlineComposite, headlineLevel, transfer }),

    identity: {
      studentName,
      className: profile.className,
      grade: profile.grade,
      gradeCluster: profile.gradeCluster,
      gradeClusterLabel: gradeClusterLabel(profile.gradeCluster),
      homeLanguage: profile.homeLanguage || "Not recorded",
      homeLanguageOral: profile.homeLanguageOral,
      homeLanguageLiteracy: profile.homeLanguageLiteracy,
      homeLanguageLiteracyLabel: describeHomeLanguageLiteracy(profile),
      otherLanguages: profile.otherLanguages,
      countryOfOrigin: profile.countryOfOrigin || "Not recorded",
      yearsInUsSchools: profile.yearsInUsSchools,
      dateFirstIdentified: profile.dateFirstIdentified || "Not recorded",
      lifecycleStage: profile.lifecycleStage,
      fundsOfKnowledge: profile.fundsOfKnowledge,
      interests: profile.interests,
      monitoring
    },

    proficiency: {
      ...official,
      headlineCompositeId: headlineComposite.id,
      headlineCompositeLabel: headlineComposite.label,
      headlineLevel,
      headlineLevelLabel: headlineLevel != null ? mllLevelLabel(Math.floor(headlineLevel)) : "",
      headlineRationale:
        "For K-3 this report leads with Oral Language rather than Overall. Overall is 70% literacy-weighted, so a young multilingual learner who communicates well but cannot yet read posts a depressed Overall that under-represents their functional English.",
      compositeWeights: MLL_COMPOSITES.map(composite => ({
        id: composite.id,
        label: composite.label,
        note: composite.note
      })),
      kindergartenNote:
        profile.gradeCluster === "K"
          ? "Kindergarten ACCESS uses a shorter score scale, so the highest levels available at this grade are lower than for Grades 1-12: Reading tops out around 5.0 and Writing around 4.5. That is a property of the test, not of the student."
          : ""
    },

    trajectory,
    distanceToExit,
    canDoByDomain,
    classroomEvidence,
    transfer,
    transferReference: transferReferenceRows(profile.homeLanguage),

    services: {
      programModel: profile.programModel || "Not recorded",
      serviceMinutesPerWeek: profile.serviceMinutesPerWeek,
      serviceProvider: profile.serviceProvider || "Not recorded",
      supportTypes: profile.supportTypes,
      accommodations: profile.accommodations,
      familyDeclinedServices: profile.familyDeclinedServices,
      declinedNote: profile.familyDeclinedServices
        ? "This family has declined language support services. The student keeps their multilingual-learner status, must still be assessed annually, and their progress must still be monitored."
        : ""
    },

    goals: profile.goals.map(goal => ({
      ...goal,
      expectationCode: goal.languageExpectation
        ? goal.languageExpectation
        : languageExpectationCode({ standard: "SI", cluster: "K-3", keyLanguageUse: "narrate" })
    })),
    suggestedExpectations: suggestLanguageExpectations(canDoByDomain),

    family: buildFamilySection({ studentName, profile, canDoByDomain, transfer }),

    audit: {
      parentContacts: profile.parentContacts,
      notificationRule: MLL_PARENT_NOTIFICATION,
      generatableElements: MLL_PARENT_NOTIFICATION.requiredElements.filter(element => element.generatable),
      lastContact: profile.parentContacts.map(contact => contact.date).filter(Boolean).sort().at(-1) || ""
    },

    disclaimer: MLL_STANDING_DISCLAIMER,
    prohibitions: MLL_PROHIBITIONS,

    dataGaps: collectDataGaps(profile, official, transfer)
  };

  report.copyIssues = lintReportCopy(report);
  return report;
}

function gradeClusterLabel(cluster) {
  if (cluster === "K") return "Kindergarten";
  if (cluster === "1") return "Grade 1";
  if (cluster === "2-3") return "Grades 2-3";
  return "Grade cluster not set";
}

function describeHomeLanguageLiteracy(profile) {
  if (!profile.homeLanguage) return "Not recorded";
  if (profile.homeLanguageLiteracy === true) return `Reads and writes in ${profile.homeLanguage}`;
  if (profile.homeLanguageLiteracy === false) return `Not yet reading or writing in ${profile.homeLanguage}`;
  return "Not recorded";
}

function buildHeadline({ studentName, profile, official, headlineComposite, headlineLevel, transfer }) {
  const parts = [];
  if (profile.homeLanguage) {
    parts.push(`${studentName} is developing English alongside ${profile.homeLanguage}.`);
  } else {
    parts.push(`${studentName} is a multilingual learner. No home language is recorded yet — adding it turns on the language-transfer section of this report.`);
  }
  if (official.available && headlineLevel != null) {
    parts.push(
      `Most recent ${headlineComposite.label}: ${mllLevelLabel(Math.floor(headlineLevel))}, from ${official.source} on ${official.date}.`
    );
  } else {
    parts.push("No official English language proficiency score is on file yet, so this report describes classroom evidence only.");
  }
  if (transfer.available && transfer.summary?.total) {
    parts.push(
      `${transfer.summary.explainedCount} of ${transfer.summary.total} sound patterns are explained by ${transfer.summary.language} transfer; ${transfer.summary.residueCount} ${transfer.summary.residueCount === 1 ? "is" : "are"} not.`
    );
  }
  return parts.join(" ");
}

function buildClassroomEvidenceSection(workspace, profile, transfer) {
  if (!workspace) {
    return {
      available: false,
      note: "No classroom literacy evidence was supplied for this report.",
      dimensions: [],
      counts: {}
    };
  }
  const summary = workspace?.wholeChild?.summary || {};
  const skills = workspace?.skillsCheck?.summary || {};

  return {
    available: true,
    counts: {
      conceptsChecked:
        (summary.secure || 0) + (summary.developing || 0) + (summary.needs_teaching || 0) + (summary.not_enough_evidence || 0),
      conceptsTotal: summary.concepts || 0,
      attempts: skills.attempts || 0,
      latestAt: summary.latestAt || ""
    },
    /**
     * The Portfolio Note Catcher, in report form: observations organised across
     * discourse, sentence and word/phrase. WIDA's own instrument, and the reason
     * this module can describe language along WIDA's dimensions without ever
     * assigning a WIDA level.
     */
    dimensions: MLL_DIMENSIONS.map(dimension => ({
      id: dimension.id,
      label: dimension.label,
      plainLabel: dimension.plainLabel,
      criteria: dimension.criteria,
      prompt: dimensionPrompt(dimension.id),
      observations: []
    })),
    soundPatterns: transfer.available ? transfer.explained.length + transfer.residue.length : 0,
    literacyCaution:
      "These are English literacy results. They describe what this student did in English, not what they know. An English-only phonics assessment cannot tell the difference between a sound a student cannot decode and a sound that does not exist in their first language.",
    keyLanguageUses: MLL_KEY_LANGUAGE_USES.map(use => ({
      ...use,
      k3Expectations: MLL_ELD_SI_K3[use.id] || []
    })),
    expectationBand: languageExpectationCode({ standard: "SI", cluster: "K-3", keyLanguageUse: "narrate" }),
    expectationNote:
      "Standard 1 (Social and Instructional Language) is the one WIDA standard banded across all of K-3, so these expectations apply whether the student is in Kindergarten, Grade 1, Grade 2 or Grade 3."
  };
}

function dimensionPrompt(dimensionId) {
  if (dimensionId === "discourse") {
    return "How much did they say or write, and did the ideas connect? Note length, order and how one idea led to the next.";
  }
  if (dimensionId === "sentence") {
    return "What did the sentences look like? Single words, phrases, simple sentences, joined sentences?";
  }
  return "Which words did they reach for? Everyday words, school words, or precise subject words?";
}

function suggestLanguageExpectations(canDoByDomain) {
  const expressive = canDoByDomain.filter(entry => entry.mode === "expressive" && entry.statements.length);
  if (!expressive.length) return [];
  return MLL_KEY_LANGUAGE_USES.slice(0, 2).map(use => ({
    keyLanguageUse: use.id,
    label: use.label,
    definition: use.definition,
    code: languageExpectationCode({ standard: "SI", cluster: "K-3", keyLanguageUse: use.id }),
    expectations: MLL_ELD_SI_K3[use.id] || []
  }));
}

/**
 * The family section. Asset-framed, and it says the thing families most need to
 * hear and least often do: keep speaking your language at home.
 */
function buildFamilySection({ studentName, profile, canDoByDomain, transfer }) {
  const language = profile.homeLanguage || "your home language";
  const strengths = canDoByDomain
    .filter(entry => entry.statements.length)
    .slice(0, 2)
    .map(entry => ({
      domain: entry.domainLabel,
      statement: entry.statements[0]?.text || ""
    }));

  const homeActions = [
    `Keep talking, reading and telling stories in ${language}. A strong first language makes English easier, not harder — the two are not in competition.`,
    "Talk about the day at home in whichever language is most comfortable. Explaining, describing and arguing in any language builds the same thinking English will need.",
    "Read together every day, in either language. Being read to builds vocabulary and story sense, which transfer directly."
  ];

  if (transfer.available && transfer.summary?.explainedCount) {
    homeActions.push(
      `Some English sounds do not exist in ${transfer.summary.language}. When ${studentName} says one differently, that is not a mistake — it is a sound they have not met yet. Say it together and move on.`
    );
  }

  return {
    strengths,
    homeActions,
    affirmL1:
      "Your child's first language is an asset. Research is consistent on this: children who keep developing their first language do better in English, not worse.",
    whoToTalkTo:
      "If you would like to talk about this report, ask the school for a meeting. You can ask for an interpreter, and you can ask for this information in your language.",
    suppressed: ["percentiles", "scaled scores", "text levels", "comparisons to classmates"]
  };
}

function collectDataGaps(profile, official, transfer) {
  const gaps = [];
  if (!profile.homeLanguage) {
    gaps.push({
      field: "Home language",
      impact: "The first-language transfer section cannot run without it. This is the highest-value missing field."
    });
  }
  if (profile.homeLanguageLiteracy === null && profile.homeLanguage) {
    gaps.push({
      field: "Home language literacy",
      impact: "Whether the student reads in their first language changes what transfers and what has to be taught from scratch."
    });
  }
  if (!profile.gradeCluster) {
    gaps.push({
      field: "Grade",
      impact: "Can Do descriptors are grade-cluster specific. Without a grade, no descriptors can be selected."
    });
  }
  if (!official.available) {
    gaps.push({
      field: "Official proficiency scores",
      impact: "No trajectory, no distance to exit, and no anchor for a working range."
    });
  }
  if (!profile.exitCriteria.configured) {
    gaps.push({
      field: "District exit criteria",
      impact: "Distance to exit is not shown. Criteria vary from 4.0 to 5.0 by state and are frequently conjunctive, so they must be configured rather than assumed."
    });
  }
  if (!profile.programModel) {
    gaps.push({ field: "Program model", impact: "Required on most state compliance forms." });
  }
  if (transfer.available && transfer.profile?.reviewStatus === "needs_linguist_review") {
    gaps.push({
      field: "First-language reference quality",
      impact: transfer.profile.reviewNote
    });
  }
  return gaps;
}

/** Runs the asset-based copy linter over everything the report will print. */
function lintReportCopy(report) {
  const strings = [
    report.headline,
    report.transfer?.narrative,
    report.transfer?.residueNarrative,
    ...(report.family?.homeActions || []),
    ...(report.canDoByDomain || []).flatMap(entry => entry.statements.map(statement => statement.text))
  ].filter(Boolean);
  return strings.flatMap(text => lintMllLanguage(text).map(issue => ({ ...issue, text })));
}

/* ------------------------------------------------------------------ *
 * The class report
 * ------------------------------------------------------------------ */

/**
 * The class view an EL teacher needs: who is at what level, who is due for
 * annual assessment, who is in a monitoring window, and where the caseload's
 * time should go.
 *
 * Deliberately NOT a ranked roster — the bible forbids one. Rows are
 * alphabetical, and the grouping is by service need, not by score.
 */
export function buildMllClassReport({
  students = [],
  className = "",
  exitCriteria = null,
  now = new Date(),
  generatedBy = ""
} = {}) {
  const reports = students
    .map(student => buildMllStudentReport({ student, exitCriteria, now, generatedBy }))
    .filter(report => report.profile.isMultilingualLearner);

  const rows = reports
    .map(report => {
      const headline = report.proficiency.headlineLevel;
      return {
        studentId: report.profile.studentId,
        studentName: report.profile.studentName,
        grade: report.profile.grade,
        gradeCluster: report.profile.gradeCluster,
        homeLanguage: report.profile.homeLanguage || "Not recorded",
        lifecycleStage: report.profile.lifecycleStage,
        programModel: report.profile.programModel,
        serviceMinutesPerWeek: report.profile.serviceMinutesPerWeek,
        headlineComposite: report.proficiency.headlineCompositeLabel,
        headlineLevel: headline,
        headlineLevelLabel: headline != null ? mllLevelLabel(Math.floor(headline)) : "Not checked",
        listening: levelOf(report, "listening"),
        speaking: levelOf(report, "speaking"),
        reading: levelOf(report, "reading"),
        writing: levelOf(report, "writing"),
        lastAssessed: report.proficiency.date || "",
        source: report.proficiency.source || "",
        distanceToExit: report.distanceToExit?.gap ?? null,
        meetsExit: report.distanceToExit?.meetsAll === true,
        exitReachable: report.distanceToExit?.reachable !== false,
        inMonitoring: report.identity.monitoring?.inMonitoringWindow === true,
        transferResidue: report.transfer?.summary?.residueCount ?? null,
        dataGapCount: report.dataGaps.length
      };
    })
    .sort((a, b) => String(a.studentName).localeCompare(String(b.studentName)));

  const languages = new Map();
  rows.forEach(row => {
    languages.set(row.homeLanguage, (languages.get(row.homeLanguage) || 0) + 1);
  });

  const byLevel = new Map();
  rows.forEach(row => {
    const key = row.headlineLevel != null ? Math.floor(row.headlineLevel) : "unknown";
    byLevel.set(key, (byLevel.get(key) || 0) + 1);
  });

  return {
    schemaVersion: MLL_REPORT_SCHEMA_VERSION,
    policyVersion: MLL_POLICY_VERSION,
    reportType: "mll_class",
    className,
    generatedAt: (now instanceof Date ? now : new Date(now)).toISOString(),
    generatedBy,
    summary: {
      multilingualLearners: rows.length,
      withOfficialScores: rows.filter(row => row.headlineLevel != null).length,
      inMonitoring: rows.filter(row => row.inMonitoring).length,
      meetingExitCriteria: rows.filter(row => row.meetsExit).length,
      languages: Array.from(languages.entries())
        .map(([language, count]) => ({ language, count }))
        .sort((a, b) => b.count - a.count),
      levelDistribution: Array.from(byLevel.entries())
        .map(([level, count]) => ({
          level,
          label: level === "unknown" ? "No official score" : mllLevelLabel(level),
          count
        }))
        .sort((a, b) => (a.level === "unknown" ? 1 : b.level === "unknown" ? -1 : a.level - b.level)),
      totalDataGaps: rows.reduce((total, row) => total + row.dataGapCount, 0)
    },
    rows,
    reports,
    orderingNote:
      "Students are listed alphabetically. This report deliberately does not rank children by score — a named ranked roster is not something this product produces.",
    disclaimer: MLL_STANDING_DISCLAIMER,
    headlineNote:
      "The headline column is Oral Language, not Overall, because Overall is 70% literacy-weighted and misrepresents young multilingual learners in both directions."
  };
}

function levelOf(report, domainId) {
  const domain = report.proficiency?.domains?.find(entry => entry.id === domainId);
  return domain?.level ?? null;
}
