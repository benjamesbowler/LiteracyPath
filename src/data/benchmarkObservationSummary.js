/** Plain observations from one saved assessment; never a mastery judgment. */
export function benchmarkObservationSummary(profile = {}, detail = profile.detail) {
  if (!profile.hasSavedEvidence) return "Not checked yet.";
  if (!detail || detail.performanceSuppressed) return "Saved answers are available. No score is reported for this assessment.";
  const count = value => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
  const total = detail.administeredCount;
  if (profile.domainKey === "phonologicalAwareness" && count(total) && total > 0 && count(detail.correctCount)) {
    return `${detail.correctCount} of ${total} spoken answers correct.`;
  }
  if (profile.domainKey === "encoding" && count(total) && total > 0 && count(detail.exactSpellingCount) && count(detail.plausibleSpellingCount)) {
    return `${detail.exactSpellingCount} of ${total} words spelled correctly. ${detail.plausibleSpellingCount} more represented the sounds with a different spelling.`;
  }
  if (profile.domainKey === "decoding" && count(total) && total > 0 && count(detail.accurateCount) && count(detail.automaticCount)) {
    return `${detail.accurateCount} of ${total} words read correctly; ${detail.automaticCount} read straight away.`;
  }
  if (profile.domainKey === "oralReadingFluency") {
    const rows = detail.passageRows?.length ? detail.passageRows : [detail];
    return rows.map(row => {
      const title = row.passageTitle ? `${row.passageTitle}: ` : "";
      if (!count(row.wordsCorrect) || !count(row.wordsAttempted)) return `${title}Reading counts not recorded.`;
      const rate = count(row.wcpm) ? ` ${row.wcpm} correct words per minute.` : " No per-minute score for this read.";
      return `${title}${row.wordsCorrect} of ${row.wordsAttempted} words read correctly.${rate}`;
    }).join(" ");
  }
  return "No scored answers recorded. See the saved answer details.";
}

export const BENCHMARK_REPORT_LABELS = Object.freeze({
  phonologicalAwareness: "Sound awareness",
  encoding: "Spelling",
  decoding: "Word reading",
  oralReadingFluency: "Reading fluency"
});

export const BENCHMARK_ASSESSMENT_LABELS = Object.freeze({
  el_phonological_awareness: BENCHMARK_REPORT_LABELS.phonologicalAwareness,
  el_encoding: BENCHMARK_REPORT_LABELS.encoding,
  el_decoding: BENCHMARK_REPORT_LABELS.decoding,
  el_oral_reading_fluency: BENCHMARK_REPORT_LABELS.oralReadingFluency
});
