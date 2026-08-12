import {
  LEARNING_EVIDENCE_POLICY,
  isLearningEvidenceRecent
} from "../policy/learningPolicy.js";
import { REPORTING_STATUS_IDS } from "./reportingEvidenceModel.js";

const REVIEW_SYNC_STATUSES = new Set(["error", "failed", "partial", "rejected"]);
const PENDING_SYNC_STATUSES = new Set(["loading", "pending", "syncing"]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizedSyncStatus(value = "") {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function hasValidDate(value = "") {
  return Boolean(value && Number.isFinite(new Date(value).getTime()));
}

function uniqueLabels(rows = []) {
  return Array.from(new Set(rows.map(row => row?.label).filter(Boolean))).sort();
}

function makeSignal({ id, level, title, detail, action, count, labels = [] }) {
  return Object.freeze({
    id,
    level,
    title,
    detail,
    action,
    count,
    labels: Object.freeze(labels.slice(0, 8))
  });
}

/**
 * Explains whether the evidence behind a Whole Child report needs review.
 *
 * This is deliberately diagnostic rather than a score. It never changes a
 * concept status, invents a confidence percentage, or treats missing evidence
 * as a negative result. It simply combines quality signals that already exist
 * in the reporting policy so a teacher can see why a report may need another
 * look.
 */
export function buildEvidenceHealth({
  concepts = [],
  evidence = [],
  sourceReads = [],
  now = new Date()
} = {}) {
  const conceptRows = asArray(concepts);
  const evidenceRows = asArray(evidence).filter(row => (
    row?.knowledgeEligible && row?.scorable && row?.statusCandidate
  ));
  const mixed = conceptRows.filter(row => row?.status?.id === REPORTING_STATUS_IDS.MIXED_EVIDENCE);
  const insufficient = conceptRows.filter(row => (
    row?.status?.id === REPORTING_STATUS_IDS.NOT_ENOUGH_EVIDENCE
  ));
  const stale = evidenceRows.filter(row => (
    hasValidDate(row.observedAt)
    && !isLearningEvidenceRecent(row.observedAt, {
      now,
      maximumAgeDays: LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays,
      allowUndated: false
    })
  ));
  const undated = evidenceRows.filter(row => !hasValidDate(row.observedAt));
  const reads = asArray(sourceReads);
  const failedReads = reads.filter(row => REVIEW_SYNC_STATUSES.has(
    normalizedSyncStatus(row?.syncStatus)
  ));
  const pendingReads = reads.filter(row => PENDING_SYNC_STATUSES.has(
    normalizedSyncStatus(row?.syncStatus)
  ));
  const signals = [];

  if (failedReads.length) {
    signals.push(makeSignal({
      id: "source_read_warning",
      level: "review",
      title: "Some result sources need checking",
      detail: `${failedReads.length} result source${failedReads.length === 1 ? " did" : "s did"} not finish cleanly. Missing records have not been treated as a low result.`,
      action: "Retry the result load before using this report for a decision.",
      count: failedReads.length,
      labels: failedReads.map(row => row.store || row.purpose || "Saved results")
    }));
  }
  if (mixed.length) {
    signals.push(makeSignal({
      id: "source_conflict",
      level: "review",
      title: "Direct results disagree",
      detail: `${mixed.length} learning goal${mixed.length === 1 ? " has" : "s have"} reliable current results pointing in different directions. They remain separate and are not averaged.`,
      action: "Open the affected goal and compare the dated evidence before planning the next step.",
      count: mixed.length,
      labels: uniqueLabels(mixed)
    }));
  }
  if (undated.length) {
    signals.push(makeSignal({
      id: "undated_evidence",
      level: "review",
      title: "Some results have no usable date",
      detail: `${undated.length} scored result${undated.length === 1 ? " has" : "s have"} no usable observation date, so recency cannot be confirmed.`,
      action: "Check the original record or collect a new dated observation.",
      count: undated.length,
      labels: uniqueLabels(undated.map(row => row.concept))
    }));
  }
  if (stale.length) {
    signals.push(makeSignal({
      id: "stale_evidence",
      level: "collect",
      title: "Some results are outside the current window",
      detail: `${stale.length} scored result${stale.length === 1 ? " is" : "s are"} older than the ${LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays}-day reporting window. Older results stay visible but cannot create a current conclusion.`,
      action: "Collect a fresh check for the affected learning goals.",
      count: stale.length,
      labels: uniqueLabels(stale.map(row => row.concept))
    }));
  }
  if (insufficient.length) {
    signals.push(makeSignal({
      id: "insufficient_evidence",
      level: "collect",
      title: "More results are needed",
      detail: `${insufficient.length} learning goal${insufficient.length === 1 ? " does" : "s do"} not yet meet the existing evidence policy for a current conclusion.`,
      action: "Use another independent check; do not interpret this as a low result.",
      count: insufficient.length,
      labels: uniqueLabels(insufficient)
    }));
  }
  if (pendingReads.length) {
    signals.push(makeSignal({
      id: "source_read_pending",
      level: "collect",
      title: "Saved results are still loading",
      detail: `${pendingReads.length} result source${pendingReads.length === 1 ? " is" : "s are"} still being checked.`,
      action: "Wait for loading to finish before printing or downloading the report.",
      count: pendingReads.length,
      labels: pendingReads.map(row => row.store || row.purpose || "Saved results")
    }));
  }

  const state = signals.some(signal => signal.level === "review")
    ? "review"
    : signals.length
      ? "collect"
      : "clear";
  const summary = state === "review"
    ? "Review the evidence before using this report for a decision."
    : state === "collect"
      ? "The report is usable, with clear places to collect more current evidence."
      : "No conflict, recency, sufficiency, or source-read warning was found in the results shown.";

  return Object.freeze({
    state,
    label: state === "review" ? "Review needed" : state === "collect" ? "Collect more results" : "Evidence checks clear",
    summary,
    signals: Object.freeze(signals),
    signalCount: signals.length,
    isCombined: signals.length > 1,
    policyWindowDays: LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays,
    doesNotChangeLearningStatus: true
  });
}
