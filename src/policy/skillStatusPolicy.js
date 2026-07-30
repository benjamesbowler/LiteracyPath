// Skills Assessment Rebuild v3 — the single skill-status brain.
//
// Pure functions from an attempt ledger + a blueprint to unit states and one
// skill status. No stored "mastered" boolean anywhere: recency always wins, and
// every surface that reports a skill must derive its words from THIS module.
// Spec: docs/skills-assessment-rebuild/MASTERY_SYSTEM.md §2–§6.

import {
  getSkillBlueprint,
  isNonGatingUnit,
  LEVEL_PASS_RULE,
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

// A ledger attempt (normalized): see normalizeLedgerAttempt for accepted raw shapes.
// { itemId, itemKey, itemType, level, isCorrect, dayKey, formatType,
//   responseState: "correct"|"incorrect"|"skipped"|"not_administered"|"supported"|"media_failed",
//   mode: "formal"|"guided"|"retention", sittingId }

export function toDayKey(value, timeZone = "Asia/Shanghai") {
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
    formatType: String(raw.formatType || raw.format_type || raw.templateType || ""),
    isCorrect,
    responseState,
    mode: raw.mode || "formal",
    supported: Boolean(raw.supported) || raw.responseState === "supported",
    sittingId: String(raw.sittingId || raw.sitting_id || raw.checkpointId || ""),
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
  if (!attempt.timestamp) return true; // undated legacy rows stay visible as evidence
  return nowMs - attempt.timestamp <= windowDays * 24 * 60 * 60 * 1000;
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
    const list = byUnit.get(attempt.itemKey) || [];
    list.push(attempt);
    byUnit.set(attempt.itemKey, list);
  }

  const allUnits = new Set([
    ...(blueprint.unitsByLevel?.[1] || []),
    ...(blueprint.unitsByLevel?.[2] || []),
    ...byUnit.keys()
  ]);

  for (const unitKey of allUnits) {
    const unitAttempts = byUnit.get(unitKey) || [];
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

    states.set(unitKey, {
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

function levelSummary(attempts, level, blueprint, unitStates) {
  const levelAttempts = attempts.filter(a => a.level === level);
  const scored = levelAttempts.length;
  const correct = levelAttempts.filter(a => a.isCorrect).length;
  const days = new Set(levelAttempts.map(a => a.dayKey).filter(Boolean));
  const accuracy = scored ? correct / scored : 0;

  // "Latest sitting" = attempts sharing the most recent sittingId, falling back
  // to the most recent dayKey when sitting ids are absent (legacy rows).
  const latest = levelAttempts.at(-1);
  let latestSitting = [];
  if (latest) {
    latestSitting = latest.sittingId
      ? levelAttempts.filter(a => a.sittingId === latest.sittingId)
      : levelAttempts.filter(a => a.dayKey === latest.dayKey);
  }
  const latestSittingAccuracy = latestSitting.length
    ? latestSitting.filter(a => a.isCorrect).length / latestSitting.length
    : 0;

  const levelUnits = (blueprint.unitsByLevel?.[level] || [])
    .filter(unitKey => !isNonGatingUnit(blueprint.skillId, unitKey));
  const unitRows = levelUnits.map(unitKey => unitStates.get(unitKey)).filter(Boolean);
  const passedUnits = unitRows.filter(row => row.state === UNIT_STATE_IDS.PASSED);
  const reviewUnits = unitRows.filter(row => row.state === UNIT_STATE_IDS.REVIEW);

  const minScored = blueprint.unitRule.family === "cell"
    ? LEVEL_PASS_RULE.minScoredCell
    : LEVEL_PASS_RULE.minScoredDiscrete;

  const blockers = [];
  if (passedUnits.length < levelUnits.length) {
    const missing = levelUnits.filter(unitKey => unitStates.get(unitKey)?.state !== UNIT_STATE_IDS.PASSED);
    blockers.push(`Not every item is secure yet (${passedUnits.length}/${levelUnits.length}). Still working on: ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? "…" : ""}.`);
  }
  if (scored < minScored) blockers.push(`Needs ${minScored} scored answers at this level (has ${scored}).`);
  if (accuracy < LEVEL_PASS_RULE.accuracyMin) blockers.push(`Needs ${Math.round(LEVEL_PASS_RULE.accuracyMin * 100)}% accuracy at this level (has ${Math.round(accuracy * 100)}%).`);
  if (latestSittingAccuracy < LEVEL_PASS_RULE.latestSittingMin) blockers.push(`Most recent sitting must score ${Math.round(LEVEL_PASS_RULE.latestSittingMin * 100)}% (scored ${Math.round(latestSittingAccuracy * 100)}%).`);
  if (days.size < LEVEL_PASS_RULE.sessionsMin) blockers.push(`Needs evidence from ${LEVEL_PASS_RULE.sessionsMin} different days (has ${days.size}).`);

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
    passed: blockers.length === 0 && levelUnits.length > 0,
    blockers
  };
}

function retentionSummary(attempts) {
  const retention = attempts.filter(a => a.mode === "retention");
  if (!retention.length) {
    return { attempted: false, passed: false, blockers: ["Retention check not taken yet (unlocks 3 days after Level 2 passes)."] };
  }
  const latestSittingId = retention.at(-1).sittingId || retention.at(-1).dayKey;
  const latest = retention.filter(a => (a.sittingId || a.dayKey) === latestSittingId);
  const correct = latest.filter(a => a.isCorrect).length;
  const passed = latest.length >= RETENTION_RULE.items && correct >= RETENTION_RULE.passMin;
  return {
    attempted: true,
    passed,
    correct,
    total: latest.length,
    blockers: passed ? [] : [`Latest retention check scored ${correct}/${latest.length}; needs ${RETENTION_RULE.passMin}/${RETENTION_RULE.items}.`]
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
  const retention = retentionSummary(attempts, blueprint);

  // High-water pass detection: a level counts as "ever passed" ONLY if the FULL
  // pass rule (units + accuracy + latest-sitting + days) held at the end of
  // some completed sitting in the window. This is what lets a regression show
  // as "Level passed · Needs review" without letting lucky streaks or guessers
  // bank partial credit they never actually earned.
  const boundaries = [];
  for (let i = 0; i < formal.length; i++) {
    const next = formal[i + 1];
    if (!next || next.sittingId !== formal[i].sittingId) boundaries.push(i);
  }
  const cappedBoundaries = boundaries.slice(-200);
  const levelPassedEver = level => cappedBoundaries.some(endIndex => {
    const prefix = formal.slice(0, endIndex + 1);
    const prefixStates = computeUnitStates(prefix, blueprint, { now, timeZone });
    return levelSummary(prefix, level, blueprint, prefixStates).passed;
  });
  level1.passedEver = level1.passed || levelPassedEver(1);
  level2.passedEver = level2.passed || (level1.passedEver && levelPassedEver(2));

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
  const statusNow = ladder(level1.passed, level2.passed, retention.passed);
  // High-water status: what the ledger proved before contradicting evidence.
  // Shown WITH the review flag — history is never silently forgotten, and it
  // is never silently kept either.
  const statusEver = ladder(level1.passedEver, level2.passedEver, retention.passed);
  const regressed = RANK[statusEver] > RANK[statusNow];
  const status = regressed ? statusEver : statusNow;

  const reviewUnits = [...unitStates.values()]
    .filter(row => row.state === UNIT_STATE_IDS.REVIEW && !row.nonGating)
    .map(row => row.unitKey);
  const needsReview =
    regressed
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
    `L1 ${level1.unitsPassed}/${level1.unitsTotal} · L2 ${level2.unitsPassed}/${level2.unitsTotal}`
  ];
  if (evidence.skipped) parts.push(`${evidence.skipped} skipped`);
  if (evidence.supported) parts.push(`${evidence.supported} with help`);
  return parts.join(" · ");
}
