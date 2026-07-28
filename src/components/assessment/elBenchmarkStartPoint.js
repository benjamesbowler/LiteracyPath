/**
 * THE STARTING-POINT RULES FOR THE FOUR EL CHECKS.
 *
 * This file used to be a whole second hub page: it asked for grade and time of
 * year, hid the starting band inside a collapsed "Advanced" panel, and carried
 * its own grid of cards for starting a check. That made two live ways to start
 * the same check - this page and the roster - and neither of them had a URL, so
 * a refresh threw the teacher back to the student list.
 *
 * The Checks funnel owns the layout now (class, student, check, starting point,
 * Begin). What is left here is the part that is genuinely about these four
 * checks and belongs nowhere else:
 *
 *   - which bands the chosen grade and time of year allow;
 *   - which band the child's own saved results point at, and how firm that is;
 *   - the sequence gate: deviating from the indicated band needs a reason,
 *     recorded on the attempt. That is a teaching safeguard, not a nicety.
 */
import { useMemo } from "react";
import {
  EL_BENCHMARK_IDS,
  EL_DECODING_MICROPHASES,
  listElBenchmarkRoutes
} from "../../data/elBenchmarkAssessments.js";
import {
  getElBenchmarkPrerequisiteStatus,
  isCompletedElBenchmarkRouteEvidence
} from "../../data/elBenchmarkSession.js";
import { findLatestElBenchmarkAttempt } from "../../data/elBenchmarkSession.js";

// Checks that read part-way through the word-pattern bands, so they need a
// third starting question. The other two always begin at the top.
export const EL_CHECKS_WITH_A_BAND = Object.freeze([
  EL_BENCHMARK_IDS.DECODING,
  EL_BENCHMARK_IDS.ORAL_READING_FLUENCY
]);

export const EL_PREREQUISITE_REASON_OPTIONS = Object.freeze([
  {
    id: "recent_classroom_work",
    label: "Recent classroom work",
    detail: "Current work shows the student is ready.",
    reason: "Recent classroom work shows the student is ready for this assessment."
  },
  {
    id: "comparable_result",
    label: "Comparable result seen",
    detail: "I have a comparable result from elsewhere.",
    reason: "The teacher reviewed a comparable result showing the student is ready for this assessment."
  },
  {
    id: "agreed_support",
    label: "Agreed support plan",
    detail: "This start matches an agreed support or adjustment.",
    reason: "This starting decision follows the student's agreed support or adjustment."
  },
  {
    id: "other",
    label: "Another reason",
    detail: "Write a short explanation.",
    reason: ""
  }
]);

export function getPrerequisiteReasonText(reasonId = "", otherReason = "") {
  if (reasonId === "other") return String(otherReason || "").trim();
  return EL_PREREQUISITE_REASON_OPTIONS.find(option => option.id === reasonId)?.reason || "";
}

function humanizeBandId(value = "") {
  return EL_DECODING_MICROPHASES.find(band => band.id === value)?.label
    || String(value || "").replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

/**
 * Everything the funnel needs to draw and police the starting point for one of
 * the four EL checks. `bandChosenByTeacher` says whether the band on screen is
 * the one this child's results pointed at, or one the teacher typed over - the
 * difference is what turns the sequence gate on.
 */
export function useElBenchmarkStartPoint({
  assessmentHistory = [],
  studentId = "",
  assessmentId = "",
  grade = "K",
  timeOfYear = "BOY",
  band = "",
  bandChosenByTeacher = false
}) {
  const route = useMemo(() => listElBenchmarkRoutes()
    .find(row => row.grade === grade && row.window === timeOfYear), [grade, timeOfYear]);

  const bandOptions = useMemo(() => {
    const startIndex = EL_DECODING_MICROPHASES.findIndex(row => row.id === route?.rangeStart);
    const endIndex = EL_DECODING_MICROPHASES.findIndex(row => row.id === route?.rangeEnd);
    if (startIndex < 0 || endIndex < startIndex) return [];
    return EL_DECODING_MICROPHASES.slice(startIndex, endIndex + 1);
  }, [route]);

  const completedHistory = useMemo(
    () => assessmentHistory.filter(isCompletedElBenchmarkRouteEvidence),
    [assessmentHistory]
  );
  const latestSpelling = useMemo(() => findLatestElBenchmarkAttempt({
    assessmentHistory: completedHistory,
    studentId,
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade,
    window: timeOfYear
  }), [completedHistory, grade, studentId, timeOfYear]);
  const latestWordReading = useMemo(() => findLatestElBenchmarkAttempt({
    assessmentHistory: completedHistory,
    studentId,
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade,
    window: timeOfYear
  }), [completedHistory, grade, studentId, timeOfYear]);

  const confirmedSpellingBand = latestSpelling?.confirmedPlacement?.candidateMicrophase
    || latestSpelling?.confirmedPlacement?.microphase || "";
  const provisionalSpellingBand = latestSpelling?.candidatePlacement?.candidateMicrophase
    || latestSpelling?.candidatePlacement?.microphase || "";
  const spellingBand = confirmedSpellingBand || provisionalSpellingBand;
  const spellingBandSource = confirmedSpellingBand
    ? "confirmed_encoding_placement"
    : provisionalSpellingBand
      ? "provisional_encoding_indication"
      : "grade_window_anchor";

  const savedHandoff = latestWordReading?.metrics?.fluencyStartMicrophase
    || latestWordReading?.fluencyStartMicrophase
    || latestWordReading?.confirmedPlacement?.fluencyStartMicrophase
    || null;
  const fluencyBand = String(
    typeof savedHandoff === "string" ? savedHandoff : savedHandoff?.microphase || savedHandoff?.id || ""
  );

  const isFluency = assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY;
  const indicatedBand = isFluency ? fluencyBand : spellingBand;
  const indicatedIsAllowed = bandOptions.some(row => row.id === indicatedBand);
  const suggestedBand = indicatedIsAllowed
    ? indicatedBand
    : route?.expectedMicrophase || bandOptions[0]?.id || "";
  const suggestedBandSource = indicatedIsAllowed
    ? (isFluency ? "decoding_fluency_handoff" : spellingBandSource)
    : "grade_window_anchor";

  const bandNote = !EL_CHECKS_WITH_A_BAND.includes(assessmentId)
    ? ""
    : indicatedIsAllowed && isFluency
      ? "Set from this student's last completed word reading result."
      : indicatedIsAllowed && suggestedBandSource === "confirmed_encoding_placement"
        ? "Set from this student's last confirmed spelling result."
        : indicatedIsAllowed
          ? "Set from a spelling result that has not been confirmed yet. Read it before you start."
          : "The usual starting point for this grade and time of year is chosen.";

  const prerequisite = useMemo(() => {
    const baseStatus = getElBenchmarkPrerequisiteStatus({
      assessmentHistory,
      studentId,
      assessmentId,
      grade,
      window: timeOfYear
    });
    if (!EL_CHECKS_WITH_A_BAND.includes(assessmentId)) return baseStatus;
    const firmIndication = isFluency ? fluencyBand : confirmedSpellingBand;
    if (!firmIndication) return baseStatus;
    if (!bandOptions.some(row => row.id === firmIndication)) {
      return {
        ...baseStatus,
        state: "override",
        code: isFluency
          ? "decoding_fluency_handoff_outside_selected_route"
          : "confirmed_encoding_outside_selected_route",
        message: "This student's last result points outside the grade and time of year you chose. Say why a different start is right."
      };
    }
    if (bandChosenByTeacher && band && band !== firmIndication) {
      return {
        ...baseStatus,
        state: "override",
        code: isFluency
          ? "teacher_changed_decoding_fluency_handoff"
          : "teacher_changed_confirmed_encoding_start",
        message: `This student's last result points at ${humanizeBandId(firmIndication)}. Say why ${humanizeBandId(band)} is the better start.`
      };
    }
    return baseStatus;
  }, [
    assessmentHistory, assessmentId, band, bandChosenByTeacher, bandOptions,
    confirmedSpellingBand, fluencyBand, grade, isFluency, studentId, timeOfYear
  ]);

  const needsRecordedReason = prerequisite.state !== "ready";

  /**
   * The options object `startElBenchmarkAssessment` expects. A start that came
   * from the child's own confirmed result is sent as an empty string so the
   * engine keeps its own provenance rather than recording a teacher override
   * that never happened.
   */
  function buildStartOptions(reasonText = "") {
    const teacherReviewed = needsRecordedReason && Boolean(String(reasonText).trim());
    const firmIndication = isFluency ? fluencyBand : confirmedSpellingBand;
    const keepEngineProvenance = EL_CHECKS_WITH_A_BAND.includes(assessmentId)
      && !bandChosenByTeacher
      && Boolean(firmIndication)
      && band === firmIndication;
    return {
      grade,
      window: timeOfYear,
      startMicrophase: EL_CHECKS_WITH_A_BAND.includes(assessmentId) && !keepEngineProvenance ? band : "",
      prerequisiteReview: {
        state: prerequisite.state,
        code: prerequisite.code,
        evidenceAttemptId: prerequisite.evidenceAttemptId || "",
        teacherConfirmed: teacherReviewed,
        overrideReason: String(reasonText).trim(),
        reviewedAt: teacherReviewed ? new Date().toISOString() : ""
      }
    };
  }

  return {
    bandOptions,
    suggestedBand,
    suggestedBandSource,
    bandNote,
    prerequisite,
    needsRecordedReason,
    buildStartOptions
  };
}
