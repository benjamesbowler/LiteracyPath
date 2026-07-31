// Skills Assessment Rebuild v3 — the single skill-status brain.
//
// Pure functions from an attempt ledger + a blueprint to unit states and one
// skill status. No stored "mastered" boolean anywhere: recency always wins, and
// every surface that reports a skill must derive its words from THIS module.
// Spec: docs/skills-assessment-rebuild/MASTERY_SYSTEM.md §2–§6.

import {
  getSkillBlueprint,
  isNonGatingUnit,
  PHASE_PASS_RULE,
  RETENTION_RULE
} from "../content/blueprints/skillBlueprints.js";

export const SKILL_STATUS_IDS = Object.freeze({
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  LEVEL_1_PASSED: "level_1_passed",
  LEVEL_2_PASSED: "level_2_passed",
  SECURE: "secure"
});

export const SKILL_STATUS_LABELS = Object.freeze({
  [SKILL_STATUS_IDS.NOT_STARTED]: "Not started",
  [SKILL_STATUS_IDS.IN_PROGRESS]: "In progress",
  [SKILL_STATUS_IDS.LEVEL_1_PASSED]: "Level 1 passed",
  [SKILL_STATUS_IDS.LEVEL_2_PASSED]: "Level 2 passed",
  [SKILL_STATUS_IDS.SECURE]: "Secure"
});

export const UNIT_STATE_IDS = Object.freeze({
  NOT_SEEN: "not_seen",
  WORKING: "working",
  PASSED: "passed",
  REVIEW: "review"
});

export const EVIDENCE_WINDOW_DAYS = 90;

/**
 * Converts immutable assessment-attempt archives into the only evidence shape
 * accepted by this policy. Keeping this adapter beside the reducer prevents
 * the assessment runner, class reports and student reports from inventing
 * subtly different interpretations of the same saved answers.
 */
export function assessmentAttemptsToSkillLedger(records = [], skillId = "") {
  const wantedSkill = String(skillId || "").trim();
  return (Array.isArray(records) ? records : []).flatMap(record => {
    const recordSkillId = String(record?.skillId || record?.assessmentSkillId || "").trim();
    if (wantedSkill && recordSkillId && recordSkillId !== wantedSkill) return [];
    const completedAt = record?.completedAt || record?.timestamp || record?.createdAt || "";
    const sittingId = String(record?.attemptId || record?.checkpointId || record?.id || "");
    const questionRecords = Array.isArray(record?.questionRecords) ? record.questionRecords : [];
    const mode = /retention/i.test(String(record?.assessmentType || record?.mode || ""))
      ? "retention"
      : "formal";
    return questionRecords
      .filter(question => !wantedSkill || !question?.skillId || question.skillId === wantedSkill)
      .map(question => {
        const explicitStatus = String(question?.responseStatus || "").toLowerCase();
        const responseState = explicitStatus === "correct" || explicitStatus === "self_corrected"
          ? "correct"
          : ["incorrect", "no_response", "skipped"].includes(explicitStatus)
            ? explicitStatus === "skipped" ? "skipped" : "incorrect"
            : question?.isCorrect === true
              ? "correct"
              : "incorrect";
        return {
          itemId: question?.questionId || question?.itemId || "",
          itemKey: question?.itemKey || question?.item_key || "",
          itemType: question?.itemType || question?.item_type || "",
          level: question?.level || question?.itemLevel || record?.skillLevel || 1,
          phase: question?.phase || question?.itemPhase || record?.skillPhase || 1,
          formatType: question?.templateType || question?.formatType || "",
          responseState,
          isCorrect: responseState === "correct",
          supported: Boolean(question?.supported || question?.prompted),
          mode,
          sittingId,
          sittingCompleted: true,
          sittingPlannedSize: Number(record?.totalQuestions || questionRecords.length || 0) || null,
          answeredAt: question?.timestamp || question?.outcomeRecordedAt || completedAt
        };
      });
  });
}

// A ledger attempt (normalized): see normalizeLedgerAttempt for accepted raw shapes.
// { itemId, itemKey, itemType, level, phase, isCorrect, dayKey, formatType,
//   responseState: "correct"|"incorrect"|"skipped"|"not_administered"|"supported"|"media_failed",
//   mode: "formal"|"guided"|"retention", sittingId }

export function toDayKey(value, timeZone = "UTC") {
  const date = value instanceof Date ? value : new Date(value || 0);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit"
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function normalizeLedgerAttempt(raw = {}, { timeZone } = {}) {
  const isCorrect = raw.responseState
    ? raw.responseState === "correct"
    : Boolean(raw.isCorrect ?? raw.is_correct);
  const responseState = raw.responseState
    || (raw.skipped ? "skipped" : (raw.isCorrect ?? raw.is_correct) != null ? (isCorrect ? "correct" : "incorrect") : "incorrect");
  return {
    itemId: String(raw.itemId || raw.questionId || raw.question_id || ""),
    itemKey: String(raw.itemKey || raw.item_key || "").toLowerCase().trim(),
    itemType: String(raw.itemType || raw.item_type || ""),
    level: Number(raw.level || raw.itemLevel || raw.item_level || 1) >= 2 ? 2 : 1,
    phase: Number(raw.phase || raw.itemPhase || raw.item_phase || 1) === 2 ? 2 : 1,
    formatType: String(raw.formatType || raw.format_type || raw.templateType || ""),
    isCorrect,
    responseState,
    mode: raw.mode || "formal",
    supported: Boolean(raw.supported) || raw.responseState === "supported",
    sittingId: String(raw.sittingId || raw.sitting_id || raw.checkpointId || ""),
    sittingCompleted: raw.sittingCompleted ?? raw.sitting_completed ?? null,
    sittingPlannedSize: Number(raw.sittingPlannedSize || raw.sitting_planned_size || 0) || null,
    dayKey: raw.dayKey || toDayKey(raw.answeredAt || raw.timestamp || raw.created_at || raw.createdAt || raw.lastSeen || 0, timeZone),
    timestamp: Number(new Date(raw.answeredAt || raw.timestamp || raw.created_at || raw.createdAt || raw.lastSeen || 0).getTime() || 0)
  };
}

function isScorable(attempt) {
  return attempt.mode !== "guided"
    && !attempt.supported
    && (attempt.responseState === "correct" || attempt.responseState === "incorrect");
}

function inWindow(attempt, nowMs, windowDays = EVIDENCE_WINDOW_DAYS) {
  // Undated legacy summaries remain visible as history elsewhere, but they
  // cannot prove recency or distinct-day evidence under the v3 standard.
  if (!attempt.timestamp) return false;
  return nowMs - attempt.timestamp <= windowDays * 24 * 60 * 60 * 1000;
}

export function unitStateEvidenceKey(level, unitKey) {
  return `${Number(level) >= 2 ? 2 : 1}::${String(unitKey || "").toLowerCase().trim()}`;
}

// ---------------------------------------------------------------------------
// Unit states
// ---------------------------------------------------------------------------

export function computeUnitStates(rawLedger = [], blueprint, { now = Date.now(), timeZone } = {}) {
  const states = new Map();
  if (!blueprint) return states;
  const rule = blueprint.unitRule;
  const attempts = rawLedger
    .map(raw => normalizeLedgerAttempt(raw, { timeZone }))
    .filter(attempt => attempt.itemKey && isScorable(attempt) && inWindow(attempt, now))
    .sort((a, b) => a.timestamp - b.timestamp);

  const byUnit = new Map();
  for (const attempt of attempts) {
    const evidenceKey = unitStateEvidenceKey(attempt.level, attempt.itemKey);
    const list = byUnit.get(evidenceKey) || [];
    list.push(attempt);
    byUnit.set(evidenceKey, list);
  }

  const allUnits = [
    ...(blueprint.unitsByLevel?.[1] || []).map(unitKey => ({ level: 1, unitKey })),
    ...(blueprint.unitsByLevel?.[2] || []).map(unitKey => ({ level: 2, unitKey }))
  ];
  for (const attempt of attempts) {
    if (!allUnits.some(row => row.level === attempt.level && row.unitKey === attempt.itemKey)) {
      allUnits.push({ level: attempt.level, unitKey: attempt.itemKey });
    }
  }

  for (const { level, unitKey } of allUnits) {
    const evidenceKey = unitStateEvidenceKey(level, unitKey);
    const unitAttempts = byUnit.get(evidenceKey) || [];
    const correct = unitAttempts.filter(a => a.isCorrect);
    const latest = unitAttempts.at(-1) || null;
    const distinctItems = new Set(correct.map(a => a.itemId).filter(Boolean));
    const distinctDays = new Set(correct.map(a => a.dayKey).filter(Boolean));
    const distinctFormats = new Set(correct.map(a => a.formatType).filter(Boolean));

    let state = UNIT_STATE_IDS.NOT_SEEN;
    const blockers = [];
    if (unitAttempts.length > 0) {
      if (latest && !latest.isCorrect) {
        state = UNIT_STATE_IDS.REVIEW;
        blockers.push("Most recent answer on this item was incorrect.");
      } else {
        const checks = [
          [unitAttempts.length >= rule.attemptsMin, `Needs ${rule.attemptsMin} scored attempts (has ${unitAttempts.length}).`],
          [correct.length >= rule.correctMin, `Needs ${rule.correctMin} correct answers (has ${correct.length}).`],
          [distinctItems.size >= rule.distinctItemsMin, `Needs ${rule.distinctItemsMin} different questions answered correctly (has ${distinctItems.size}).`],
          [distinctDays.size >= rule.sessionsMin, `Needs correct answers on ${rule.sessionsMin} different days (has ${distinctDays.size}).`],
          [distinctFormats.size >= rule.formatsMin, `Needs ${rule.formatsMin} different question formats (has ${distinctFormats.size}).`],
          [!rule.latestMustBeCorrect || Boolean(latest?.isCorrect), "Most recent answer must be correct."]
        ];
        const failed = checks.filter(([ok]) => !ok).map(([, reason]) => reason);
        state = failed.length === 0 ? UNIT_STATE_IDS.PASSED : UNIT_STATE_IDS.WORKING;
        blockers.push(...failed);
      }
    } else {
      blockers.push("Not assessed yet.");
    }

    // High-water satisfaction: did the unit EVER meet the evidence rule inside
    // the window, ignoring the trailing-recency constraint? Used to show
    // "Level passed · Needs review" instead of silently forgetting history.
    const passedEver =
      unitAttempts.length >= rule.attemptsMin &&
      correct.length >= rule.correctMin &&
      distinctItems.size >= rule.distinctItemsMin &&
      distinctDays.size >= rule.sessionsMin &&
      distinctFormats.size >= rule.formatsMin;

    states.set(evidenceKey, {
      evidenceKey,
      level,
      unitKey,
      state,
      passedEver,
      attempts: unitAttempts.length,
      correct: correct.length,
      distinctItems: distinctItems.size,
      distinctDays: distinctDays.size,
      distinctFormats: distinctFormats.size,
      lastResult: latest ? latest.isCorrect : null,
      lastSeen: latest ? latest.timestamp : null,
      nonGating: isNonGatingUnit(blueprint.skillId, unitKey),
      blockers
    });
  }

  return states;
}

// ---------------------------------------------------------------------------
// Level + skill status
// ---------------------------------------------------------------------------

function phaseSummary(attempts, level, phase, blueprint) {
  const phaseAttempts = attempts.filter(a => a.level === level && a.phase === phase);
  const sittingRows = new Map();
  for (const attempt of phaseAttempts) {
    const key = attempt.sittingId || `${attempt.dayKey || "undated"}-L${level}P${phase}`;
    const rows = sittingRows.get(key) || [];
    rows.push(attempt);
    sittingRows.set(key, rows);
  }

  const sittings = [...sittingRows.entries()].map(([sittingId, rows]) => {
    const plannedSize = Math.max(
      ...rows.map(row => Number(row.sittingPlannedSize || 0)),
      Number(blueprint.sitting || 0),
      1
    );
    const completed = rows.some(row => row.sittingCompleted === true)
      || rows.length >= plannedSize;
    const correct = rows.filter(row => row.isCorrect).length;
    const accuracy = rows.length ? correct / rows.length : 0;
    return {
      sittingId,
      total: rows.length,
      correct,
      accuracy,
      completed,
      passed: completed && accuracy >= PHASE_PASS_RULE.accuracyMin,
      timestamp: rows.at(-1)?.timestamp || 0
    };
  }).sort((a, b) => a.timestamp - b.timestamp);

  const latest = sittings.at(-1) || null;
  const passedSittings = sittings.filter(sitting => sitting.passed);
  const passedEver = passedSittings.length > 0;
  const currentPassed = Boolean(latest?.passed);
  const blockers = [];
  if (!passedEver) {
    if (!latest) {
      blockers.push(`Level ${level} Phase ${phase} has not been assessed yet.`);
    } else if (!latest.completed) {
      blockers.push(`Level ${level} Phase ${phase} needs a completed assessment.`);
    } else {
      blockers.push(
        `Level ${level} Phase ${phase} needs ${Math.round(PHASE_PASS_RULE.accuracyMin * 100)}% (latest score ${Math.round(latest.accuracy * 100)}%).`
      );
    }
  }

  return {
    level,
    phase,
    scored: phaseAttempts.length,
    correct: phaseAttempts.filter(a => a.isCorrect).length,
    sittings: sittings.length,
    latestSittingAccuracy: latest?.accuracy || 0,
    passed: passedEver,
    passedEver,
    currentPassed,
    needsReview: passedEver && !currentPassed,
    passedAt: passedSittings.at(-1)?.timestamp || null,
    blockers
  };
}

function levelSummary(attempts, level, blueprint, unitStates) {
  const levelAttempts = attempts.filter(a => a.level === level);
  const scored = levelAttempts.length;
  const correct = levelAttempts.filter(a => a.isCorrect).length;
  const days = new Set(levelAttempts.map(a => a.dayKey).filter(Boolean));
  const accuracy = scored ? correct / scored : 0;

  const phase1 = phaseSummary(attempts, level, 1, blueprint);
  const phase2 = phaseSummary(attempts, level, 2, blueprint);
  const latestSittingAccuracy = levelAttempts.length
    ? (levelAttempts.at(-1)?.phase === 2 ? phase2 : phase1).latestSittingAccuracy
    : 0;

  const levelUnits = (blueprint.unitsByLevel?.[level] || [])
    .filter(unitKey => !isNonGatingUnit(blueprint.skillId, unitKey));
  const unitRows = levelUnits
    .map(unitKey => unitStates.get(unitStateEvidenceKey(level, unitKey)))
    .filter(Boolean);
  const passedUnits = unitRows.filter(row => row.state === UNIT_STATE_IDS.PASSED);
  const reviewUnits = unitRows.filter(row => row.state === UNIT_STATE_IDS.REVIEW);

  const blockers = [...phase1.blockers, ...phase2.blockers];
  const passed = phase1.passed && phase2.passed;

  return {
    level,
    scored,
    correct,
    accuracy,
    days: days.size,
    latestSittingAccuracy,
    unitsTotal: levelUnits.length,
    unitsPassed: passedUnits.length,
    unitsInReview: reviewUnits.map(row => row.unitKey),
    phases: { 1: phase1, 2: phase2 },
    passed,
    passedEver: passed,
    currentPassed: phase1.currentPassed && phase2.currentPassed,
    needsReview: phase1.needsReview || phase2.needsReview,
    blockers
  };
}

function retentionSummary(attempts, { level2PassedAt = null } = {}) {
  const retention = attempts.filter(a => a.mode === "retention");
  if (!level2PassedAt) {
    return { attempted: retention.length > 0, passed: false, blockers: ["Retention check unlocks only after Level 2 passes."] };
  }
  if (!retention.length) {
    return { attempted: false, passed: false, blockers: ["Retention check not taken yet (unlocks 3 days after Level 2 passes)."] };
  }
  const latestSittingId = retention.at(-1).sittingId || retention.at(-1).dayKey;
  const latest = retention.filter(a => (a.sittingId || a.dayKey) === latestSittingId);
  const correct = latest.filter(a => a.isCorrect).length;
  const unlockAt = level2PassedAt + RETENTION_RULE.minDaysAfterPass * 24 * 60 * 60 * 1000;
  const administeredAt = Math.min(...latest.map(a => a.timestamp).filter(Boolean));
  const wasEligible = Number.isFinite(administeredAt) && administeredAt >= unlockAt;
  const passed = wasEligible && latest.length >= RETENTION_RULE.items && correct >= RETENTION_RULE.passMin;
  return {
    attempted: true,
    passed,
    correct,
    total: latest.length,
    unlockAt,
    administeredAt,
    blockers: passed
      ? []
      : [
          ...(!wasEligible ? [`Retention check was taken before the ${RETENTION_RULE.minDaysAfterPass}-day wait had elapsed.`] : []),
          ...(latest.length < RETENTION_RULE.items || correct < RETENTION_RULE.passMin
            ? [`Latest retention check scored ${correct}/${latest.length}; needs ${RETENTION_RULE.passMin}/${RETENTION_RULE.items}.`]
            : [])
        ]
  };
}

export function computeSkillStatus(rawLedger = [], skillIdOrBlueprint, { now = Date.now(), timeZone } = {}) {
  const blueprint = typeof skillIdOrBlueprint === "string"
    ? getSkillBlueprint(skillIdOrBlueprint)
    : skillIdOrBlueprint;
  if (!blueprint) return null;

  const attempts = rawLedger
    .map(raw => normalizeLedgerAttempt(raw, { timeZone }))
    .filter(a => isScorable(a) && inWindow(a, now))
    .sort((a, b) => a.timestamp - b.timestamp);
  const formal = attempts.filter(a => a.mode !== "retention");
  const unitStates = computeUnitStates(rawLedger, blueprint, { now, timeZone });

  const level1 = levelSummary(formal, 1, blueprint, unitStates);
  const level2 = levelSummary(formal, 2, blueprint, unitStates);
  const level2PassedAt = level2.passed
    ? Math.max(level2.phases[1].passedAt || 0, level2.phases[2].passedAt || 0) || null
    : null;
  const retention = retentionSummary(attempts, { level2PassedAt });

  const skipped = rawLedger.map(r => normalizeLedgerAttempt(r, { timeZone }))
    .filter(a => a.responseState === "skipped" && inWindow(a, now)).length;
  const supported = rawLedger.map(r => normalizeLedgerAttempt(r, { timeZone }))
    .filter(a => a.supported && inWindow(a, now)).length;

  const ladder = (l1, l2, ret) => {
    if (l1 && l2 && ret) return SKILL_STATUS_IDS.SECURE;
    if (l1 && l2) return SKILL_STATUS_IDS.LEVEL_2_PASSED;
    if (l1) return SKILL_STATUS_IDS.LEVEL_1_PASSED;
    return attempts.length > 0 ? SKILL_STATUS_IDS.IN_PROGRESS : SKILL_STATUS_IDS.NOT_STARTED;
  };
  const RANK = {
    [SKILL_STATUS_IDS.NOT_STARTED]: 0,
    [SKILL_STATUS_IDS.IN_PROGRESS]: 1,
    [SKILL_STATUS_IDS.LEVEL_1_PASSED]: 2,
    [SKILL_STATUS_IDS.LEVEL_2_PASSED]: 3,
    [SKILL_STATUS_IDS.SECURE]: 4
  };
  const status = ladder(level1.passed, level2.passed, retention.passed);

  const reviewUnits = [...unitStates.values()]
    .filter(row => row.state === UNIT_STATE_IDS.REVIEW && !row.nonGating)
    .map(row => `L${row.level} ${row.unitKey}`);
  const needsReview =
    level1.needsReview
    || level2.needsReview
    || (RANK[status] >= RANK[SKILL_STATUS_IDS.LEVEL_1_PASSED] && reviewUnits.length >= 1)
    || (retention.attempted && !retention.passed && level1.passedEver && level2.passedEver);

  const whyNot = status === SKILL_STATUS_IDS.SECURE && !needsReview
    ? []
    : [
      ...(reviewUnits.length ? [`Needs review: ${reviewUnits.slice(0, 6).join(", ")}${reviewUnits.length > 6 ? "…" : ""} answered incorrectly most recently.`] : []),
      ...(!level1.passed ? level1.blockers : !level2.passed ? level2.blockers : retention.blockers)
    ];

  return {
    skillId: blueprint.skillId,
    status,
    statusLabel: SKILL_STATUS_LABELS[status],
    provisional: true, // stays true until the external calibration pilot signs off
    needsReview,
    reviewUnits,
    level1,
    level2,
    nextSkillUnlocked: level1.passed,
    level2Unlocked: level1.passed,
    progressionRule: {
      accuracyMin: PHASE_PASS_RULE.accuracyMin,
      requiredLevel: 1,
      requiredPhases: [1, 2],
      level2Optional: true
    },
    retention,
    unitStates,
    evidence: {
      scored: attempts.length,
      skipped,
      supported,
      days: new Set(attempts.map(a => a.dayKey).filter(Boolean)).size,
      lastSeen: attempts.at(-1)?.timestamp || null
    },
    whyNot
  };
}

export function describeSkillStatus(statusResult) {
  if (!statusResult) return "";
  const { statusLabel, level1, level2, evidence, needsReview } = statusResult;
  const parts = [
    `${statusLabel}${needsReview ? " · Needs review" : ""} (provisional)`,
    `${evidence.scored} answers over ${evidence.days} day${evidence.days === 1 ? "" : "s"}`,
    `L1 phases ${Number(level1.phases[1].passed) + Number(level1.phases[2].passed)}/2 · L2 phases ${Number(level2.phases[1].passed) + Number(level2.phases[2].passed)}/2`
  ];
  if (evidence.skipped) parts.push(`${evidence.skipped} skipped`);
  if (evidence.supported) parts.push(`${evidence.supported} with help`);
  return parts.join(" · ");
}
