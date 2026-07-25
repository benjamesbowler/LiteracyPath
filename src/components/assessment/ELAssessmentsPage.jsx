/* eslint-disable react-hooks/set-state-in-effect -- extracted legacy assessment-route state synchronization; behavior is unchanged. */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  EL_BENCHMARK_CATALOG,
  EL_BENCHMARK_IDS,
  EL_DECODING_MICROPHASES,
  listElBenchmarkRoutes
} from "../../data/elBenchmarkAssessments.js";
import {
  findLatestElBenchmarkAttempt,
  getElBenchmarkPrerequisiteStatus,
  isCompletedElBenchmarkRouteEvidence
} from "../../data/elBenchmarkSession.js";
import "../../styles/el-assessment-hub.css";

const EL_WINDOW_LABELS = Object.freeze({ BOY: "Beginning of year", MOY: "Middle of year", EOY: "End of year" });

function formatBenchmarkMinutes(value, assessmentId = "", grade = "") {
  if (assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY) {
    if (grade === "1") return "5–10 min";
    if (grade === "2") return "1–5 min";
    if (grade === "K") return "Optional in Kindergarten";
  }
  if (Number.isFinite(Number(value))) return `About ${Number(value)} min`;
  const minimum = Number(value?.minimum);
  const maximum = Number(value?.maximum);
  if (Number.isFinite(minimum) && Number.isFinite(maximum)) {
    return minimum === maximum ? `About ${minimum} min` : `${minimum}-${maximum} min`;
  }
  return "Teacher paced";
}

function getElPathGuidance(grade, windowName) {
  if (grade === "K") {
    if (windowName === "BOY") {
      return "Start with Letter Name and Sound, then Sound Awareness. Add spelling or word reading later if needed.";
    }
    return "Start with Letter Name and Sound and Sound Awareness. Add spelling and word reading when letter sounds are secure.";
  }
  return "A useful order is Spelling, Word Reading, Reading Fluency, then Sound Awareness. Use Letter Name and Sound when earlier results suggest it.";
}

function getBenchmarkRecommendation(assessmentId, grade, windowName) {
  if (assessmentId === EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS) {
    return { label: "Recommended", tone: "recommended", detail: "One-to-one oral check at each time of year." };
  }
  if (assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY && grade === "K") {
    return { label: "Optional in K", tone: "optional", detail: "Not on the usual Kindergarten path; use only when word-reading results support it." };
  }
  if ([EL_BENCHMARK_IDS.ENCODING, EL_BENCHMARK_IDS.DECODING].includes(assessmentId) && grade === "K") {
    if (windowName === "BOY") {
      return { label: "Not routine", tone: "as-needed", detail: "Begin with letter and spoken-sound results." };
    }
    return { label: "Earlier result needed", tone: "optional", detail: "Use only after the child accurately shows the taught letter sounds." };
  }
  if (assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY) {
    return { label: "After Decoding", tone: "recommended", detail: "Begin at the last decoding band read accurately and automatically." };
  }
  if (assessmentId === EL_BENCHMARK_IDS.DECODING) {
    return { label: "After Spelling", tone: "recommended", detail: "Start at the band suggested by the spelling result." };
  }
  return { label: "Recommended", tone: "recommended", detail: "Use the selected grade and time-of-year route." };
}

function formatAttemptStatus(attempt) {
  if (!attempt) return "Not checked";
  const status = attempt.administrationStatus || attempt.status || "recorded";
  return status.replace(/_/g, " ").replace(/^\w/, letter => letter.toUpperCase());
}

function humanizeBenchmarkKey(value = "") {
  return String(value || "").replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

const EL_PREREQUISITE_REASON_OPTIONS = Object.freeze([
  {
    id: "recent_classroom_evidence",
    label: "Recent classroom work",
    detail: "Current work shows the child is ready.",
    reason: "Recent classroom work shows the child is ready for this check."
  },
  {
    id: "equivalent_assessment_evidence",
    label: "Equivalent check completed",
    detail: "I have a comparable check result.",
    reason: "The teacher reviewed a comparable result showing the child is ready for this check."
  },
  {
    id: "student_support_decision",
    label: "Child support decision",
    detail: "This start matches an agreed support or accommodation.",
    reason: "This starting decision follows the child's agreed support or accommodation."
  },
  {
    id: "other",
    label: "Other reason",
    detail: "Add a short explanation.",
    reason: ""
  }
]);

function getPrerequisiteReasonText(reasonId = "", otherReason = "") {
  if (reasonId === "other") return String(otherReason || "").trim();
  return EL_PREREQUISITE_REASON_OPTIONS.find(option => option.id === reasonId)?.reason || "";
}

function getBenchmarkCardDescription(assessmentId, fallback = "") {
  if (assessmentId === EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS) {
    return "Listen to short sound tasks and tap the child's answer.";
  }
  if (assessmentId === EL_BENCHMARK_IDS.ENCODING) {
    return "The child writes each word on paper; you tap the closest result.";
  }
  if (assessmentId === EL_BENCHMARK_IDS.DECODING) {
    return "The child reads words from the screen; you tap how they read each one.";
  }
  if (assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY) {
    return "The child reads on screen while the built-in timer guides the check.";
  }
  return fallback;
}

function getBenchmarkCardNote(assessmentId) {
  if (assessmentId === EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS) return "Teacher-led · spoken responses";
  if (assessmentId === EL_BENCHMARK_IDS.ENCODING) return "Paper and pencil";
  if (assessmentId === EL_BENCHMARK_IDS.DECODING) return "Child reads on screen";
  if (assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY) return "Built-in one-minute timer";
  return "Teacher paced";
}

function getBenchmarkStartLabel(assessmentId) {
  if (assessmentId === EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS) return "sound awareness";
  if (assessmentId === EL_BENCHMARK_IDS.ENCODING) return "spelling";
  if (assessmentId === EL_BENCHMARK_IDS.DECODING) return "word reading";
  if (assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY) return "reading fluency";
  return "check";
}

export function ELAssessmentsPage({
  studentId,
  studentName,
  startLetterAssessment,
  startAdvancedPhonicsAssessment,
  startElBenchmarkAssessment,
  resumeElBenchmarkAssessment,
  discardElBenchmarkDraft,
  elBenchmarkDraft = null,
  assessmentHistory = []
}) {
  const [grade, setGrade] = useState(elBenchmarkDraft?.grade || "K");
  const [windowName, setWindowName] = useState(elBenchmarkDraft?.window || "BOY");
  const [pendingStart, setPendingStart] = useState(null);
  const [prerequisiteReason, setPrerequisiteReason] = useState("");
  const [prerequisiteOtherReason, setPrerequisiteOtherReason] = useState("");
  const prerequisiteReviewRef = useRef(null);
  const routes = useMemo(() => listElBenchmarkRoutes(), []);
  const selectedRoute = useMemo(() => routes.find(route => (
    route.grade === grade && route.window === windowName
  )), [grade, routes, windowName]);
  const latestByAssessment = useMemo(() => Object.fromEntries(
    EL_BENCHMARK_CATALOG.map(entry => [entry.id, findLatestElBenchmarkAttempt({
      assessmentHistory,
      studentId,
      assessmentId: entry.id,
      grade,
      window: windowName
    })])
  ), [assessmentHistory, grade, studentId, windowName]);
  const completedHistory = useMemo(() => (
    assessmentHistory.filter(isCompletedElBenchmarkRouteEvidence)
  ), [assessmentHistory]);
  const latestCompletedByAssessment = useMemo(() => Object.fromEntries(
    EL_BENCHMARK_CATALOG.map(entry => [entry.id, findLatestElBenchmarkAttempt({
      assessmentHistory: completedHistory,
      studentId,
      assessmentId: entry.id,
      grade,
      window: windowName
    })])
  ), [completedHistory, grade, studentId, windowName]);
  const draftCatalogEntry = elBenchmarkDraft
    ? EL_BENCHMARK_CATALOG.find(entry => entry.id === elBenchmarkDraft.assessmentId)
    : null;
  const decodingBandOptions = useMemo(() => {
    const startIndex = EL_DECODING_MICROPHASES.findIndex(row => row.id === selectedRoute?.rangeStart);
    const endIndex = EL_DECODING_MICROPHASES.findIndex(row => row.id === selectedRoute?.rangeEnd);
    if (startIndex < 0 || endIndex < startIndex) return [];
    return EL_DECODING_MICROPHASES.slice(startIndex, endIndex + 1);
  }, [selectedRoute]);
  const latestEncoding = latestCompletedByAssessment[EL_BENCHMARK_IDS.ENCODING];
  const confirmedEncodingIndication = latestEncoding?.confirmedPlacement?.candidateMicrophase ||
    latestEncoding?.confirmedPlacement?.microphase || "";
  const provisionalEncodingIndication = latestEncoding?.candidatePlacement?.candidateMicrophase ||
    latestEncoding?.candidatePlacement?.microphase || "";
  const encodingIndication = confirmedEncodingIndication || provisionalEncodingIndication;
  const encodingIndicationSource = confirmedEncodingIndication
    ? "confirmed_encoding_placement"
    : provisionalEncodingIndication
      ? "provisional_encoding_indication"
      : "grade_window_anchor";
  const latestDecoding = latestCompletedByAssessment[EL_BENCHMARK_IDS.DECODING];
  const savedFluencyHandoff = latestDecoding?.metrics?.fluencyStartMicrophase ||
    latestDecoding?.fluencyStartMicrophase ||
    latestDecoding?.confirmedPlacement?.fluencyStartMicrophase ||
    null;
  const fluencyIndication = String(
    typeof savedFluencyHandoff === "string"
      ? savedFluencyHandoff
      : savedFluencyHandoff?.microphase || savedFluencyHandoff?.id || ""
  );
  const allowedStartIds = new Set(decodingBandOptions.map(row => row.id));
  const initialDecodingIndication = allowedStartIds.has(encodingIndication) ? encodingIndication : "";
  const initialFluencyIndication = allowedStartIds.has(fluencyIndication) ? fluencyIndication : "";
  const [decodingStart, setDecodingStart] = useState(
    initialDecodingIndication || selectedRoute?.expectedMicrophase || decodingBandOptions[0]?.id || "middle_pre"
  );
  const [decodingStartSource, setDecodingStartSource] = useState(
    initialDecodingIndication ? encodingIndicationSource : "grade_window_anchor"
  );
  const [fluencyStart, setFluencyStart] = useState(
    initialFluencyIndication || selectedRoute?.expectedMicrophase || decodingBandOptions[0]?.id || "middle_pre"
  );
  const [fluencyStartSource, setFluencyStartSource] = useState(
    initialFluencyIndication ? "decoding_fluency_handoff" : "grade_window_anchor"
  );

  useEffect(() => {
    const allowed = new Set(decodingBandOptions.map(row => row.id));
    const indicated = allowed.has(encodingIndication) ? encodingIndication : "";
    setDecodingStart(indicated || selectedRoute?.expectedMicrophase || decodingBandOptions[0]?.id || "middle_pre");
    setDecodingStartSource(indicated ? encodingIndicationSource : "grade_window_anchor");
  }, [decodingBandOptions, encodingIndication, encodingIndicationSource, selectedRoute?.expectedMicrophase]);

  useEffect(() => {
    const allowed = new Set(decodingBandOptions.map(row => row.id));
    const indicated = allowed.has(fluencyIndication) ? fluencyIndication : "";
    setFluencyStart(indicated || selectedRoute?.expectedMicrophase || decodingBandOptions[0]?.id || "middle_pre");
    setFluencyStartSource(indicated ? "decoding_fluency_handoff" : "grade_window_anchor");
  }, [decodingBandOptions, fluencyIndication, selectedRoute?.expectedMicrophase]);

  useEffect(() => {
    setPendingStart(null);
    setPrerequisiteReason("");
    setPrerequisiteOtherReason("");
  }, [grade, windowName]);

  useEffect(() => {
    if (!pendingStart || !prerequisiteReviewRef.current) return;
    prerequisiteReviewRef.current.focus({ preventScroll: true });
    prerequisiteReviewRef.current.scrollIntoView({ block: "center" });
  }, [pendingStart]);

  const prerequisiteFor = assessmentId => {
    const baseStatus = getElBenchmarkPrerequisiteStatus({
      assessmentHistory,
      studentId,
      assessmentId,
      grade,
      window: windowName
    });
    if (assessmentId === EL_BENCHMARK_IDS.DECODING) {
      const allowed = decodingBandOptions.some(row => row.id === confirmedEncodingIndication);
      if (confirmedEncodingIndication && !allowed) {
        return {
          ...baseStatus,
          state: "override",
          code: "confirmed_encoding_outside_selected_route",
          message: "The confirmed Encoding band is outside this grade/window route. Record why a different in-range start is appropriate."
        };
      }
      if (
        confirmedEncodingIndication &&
        decodingStartSource === "teacher_selected" &&
        decodingStart !== confirmedEncodingIndication
      ) {
        return {
          ...baseStatus,
          state: "override",
          code: "teacher_changed_confirmed_encoding_start",
          message: `Encoding indicated ${humanizeBenchmarkKey(confirmedEncodingIndication)}. Record why ${humanizeBenchmarkKey(decodingStart)} is the better Decoding start.`
        };
      }
    }
    if (assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY) {
      const allowed = decodingBandOptions.some(row => row.id === fluencyIndication);
      if (fluencyIndication && !allowed) {
        return {
          ...baseStatus,
          state: "override",
          code: "decoding_fluency_handoff_outside_selected_route",
          message: "The completed Decoding handoff is outside this grade/window route. Record why a different in-range Fluency start is appropriate."
        };
      }
      if (
        fluencyIndication &&
        fluencyStartSource === "teacher_selected" &&
        fluencyStart !== fluencyIndication
      ) {
        return {
          ...baseStatus,
          state: "override",
          code: "teacher_changed_decoding_fluency_handoff",
          message: `Decoding indicated ${humanizeBenchmarkKey(fluencyIndication)}. Record why ${humanizeBenchmarkKey(fluencyStart)} is the better Fluency start.`
        };
      }
    }
    return baseStatus;
  };

  const launchAssessment = (entry, prerequisite, reason = "") => {
    const teacherReviewed = prerequisite.state !== "ready" && Boolean(reason.trim());
    const useEncodingProvenance = entry.id === EL_BENCHMARK_IDS.DECODING &&
      decodingStartSource === "confirmed_encoding_placement" &&
      decodingStart === confirmedEncodingIndication;
    const useFluencyProvenance = entry.id === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY &&
      fluencyStartSource === "decoding_fluency_handoff" &&
      fluencyStart === fluencyIndication;
    const selectedStart = entry.id === EL_BENCHMARK_IDS.DECODING
      ? (useEncodingProvenance ? "" : decodingStart)
      : entry.id === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY
        ? (useFluencyProvenance ? "" : fluencyStart)
        : "";
    startElBenchmarkAssessment?.(entry.id, {
      grade,
      window: windowName,
      startMicrophase: selectedStart,
      prerequisiteReview: {
        state: prerequisite.state,
        code: prerequisite.code,
        evidenceAttemptId: prerequisite.evidenceAttemptId || "",
        teacherConfirmed: teacherReviewed,
        overrideReason: reason.trim(),
        reviewedAt: teacherReviewed ? new Date().toISOString() : ""
      }
    });
    setPendingStart(null);
    setPrerequisiteReason("");
    setPrerequisiteOtherReason("");
  };

  const requestAssessmentStart = entry => {
    const prerequisite = prerequisiteFor(entry.id);
    if (prerequisite.state === "ready") {
      launchAssessment(entry, prerequisite);
      return;
    }
    setPendingStart({ entry, prerequisite });
    setPrerequisiteReason("");
    setPrerequisiteOtherReason("");
  };

  const prerequisiteReasonText = getPrerequisiteReasonText(
    prerequisiteReason,
    prerequisiteOtherReason
  );

  return (
    <div className="teacher-product-page el-assessment-hub">
      <section className="teacher-page-header el-assessment-hub-hero">
        <div>
          <p className="panel-label">Progress monitoring</p>
          <h2>Choose a check for {studentName || "this child"}</h2>
          <p>Set the grade and time of year once, then start the check you need.</p>
        </div>
        <span className="el-assessment-provisional-label">Six early literacy checks</span>
      </section>

      <section className="el-assessment-route-panel" aria-labelledby="el-assessment-route-title">
        <div className="el-assessment-route-copy">
          <p className="panel-label">Child&apos;s level</p>
          <h3 id="el-assessment-route-title">Grade and time of year</h3>
          <p>{getElPathGuidance(grade, windowName)}</p>
        </div>
        <div className="el-assessment-route-controls">
          <label>
            Grade
            <select onChange={event => setGrade(event.target.value)} value={grade}>
              <option value="K">Kindergarten</option>
              <option value="1">Grade 1</option>
              <option value="2">Grade 2</option>
            </select>
          </label>
          <label>
            Time of year
            <select onChange={event => setWindowName(event.target.value)} value={windowName}>
              {Object.entries(EL_WINDOW_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        <details className="el-assessment-advanced-starts">
          <summary>
            <span>Advanced starting points</span>
            <small>Optional · change only when earlier results support a different start</small>
          </summary>
          <div className="el-assessment-advanced-start-grid">
            <label>
              Decoding start
              <select onChange={event => {
                setDecodingStart(event.target.value);
                setDecodingStartSource("teacher_selected");
              }} value={decodingStart}>
                {decodingBandOptions.map(band => (
                  <option key={band.id} value={band.id}>
                    {band.label}{band.anchorCycle ? ` · Cycle ${band.anchorCycle}` : ""}
                  </option>
                ))}
              </select>
              <small>
                {confirmedEncodingIndication && decodingBandOptions.some(row => row.id === confirmedEncodingIndication)
                  ? "Set from the latest teacher-confirmed Encoding result."
                  : provisionalEncodingIndication && decodingBandOptions.some(row => row.id === provisionalEncodingIndication)
                    ? "Set from a provisional Encoding result; review before starting Decoding."
                    : "The usual grade and window starting point is selected."}
              </small>
            </label>
            <label>
              Fluency start
              <select onChange={event => {
                setFluencyStart(event.target.value);
                setFluencyStartSource("teacher_selected");
              }} value={fluencyStart}>
                {decodingBandOptions.map(band => (
                  <option key={band.id} value={band.id}>
                    {band.label}{band.anchorCycle ? ` · Cycle ${band.anchorCycle} anchor` : ""}
                  </option>
                ))}
              </select>
              <small>
                {fluencyIndication && decodingBandOptions.some(row => row.id === fluencyIndication)
                  ? "Set from the latest completed Decoding result."
                  : "The usual grade and window starting point is selected."}
              </small>
            </label>
          </div>
          <p className="el-assessment-advanced-note">
            Results are descriptive. No unpublished cut score is assumed.
          </p>
        </details>
      </section>

      {pendingStart && (
        <section
          aria-labelledby="el-prerequisite-review-title"
          className="el-assessment-prerequisite-review"
          ref={prerequisiteReviewRef}
          tabIndex="-1"
        >
          <div>
            <p className="panel-label">Sequence check</p>
            <h3 id="el-prerequisite-review-title">One quick check before starting</h3>
            <p>{pendingStart.prerequisite.message}</p>
          </div>
          <fieldset className="el-assessment-reason-fieldset">
            <legend>Why are you starting here?</legend>
            <div className="el-assessment-reason-options">
              {EL_PREREQUISITE_REASON_OPTIONS.map(option => (
                <button
                  aria-pressed={prerequisiteReason === option.id}
                  key={option.id}
                  onClick={() => {
                    setPrerequisiteReason(option.id);
                    if (option.id !== "other") setPrerequisiteOtherReason("");
                  }}
                  type="button"
                >
                  <strong>{option.label}</strong>
                  <small>{option.detail}</small>
                </button>
              ))}
            </div>
          </fieldset>
          {prerequisiteReason === "other" && (
            <label className="el-assessment-other-reason">
              Short explanation
              <textarea
                autoFocus
                onChange={event => setPrerequisiteOtherReason(event.target.value)}
                placeholder="Briefly note the result or reason."
                rows={2}
                value={prerequisiteOtherReason}
              />
            </label>
          )}
          <div className="teacher-action-list">
            <button
              className="lp-button lp-button-primary"
              disabled={!prerequisiteReasonText}
              onClick={() => launchAssessment(
                pendingStart.entry,
                pendingStart.prerequisite,
                prerequisiteReasonText
              )}
              type="button"
            >
              Start {pendingStart.entry.shortTitle || pendingStart.entry.title}
            </button>
            <button
              className="lp-button lp-button-secondary"
              onClick={() => {
                setPendingStart(null);
                setPrerequisiteReason("");
                setPrerequisiteOtherReason("");
              }}
              type="button"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {elBenchmarkDraft && draftCatalogEntry && (
        <section className="el-assessment-draft-banner" aria-label="Saved check draft">
          <div>
            <span>Saved draft</span>
            <strong>{draftCatalogEntry.title}</strong>
            <small>{elBenchmarkDraft.grade === "K" ? "Kindergarten" : `Grade ${elBenchmarkDraft.grade}`} · {EL_WINDOW_LABELS[elBenchmarkDraft.window] || elBenchmarkDraft.window} · {formatAttemptStatus(elBenchmarkDraft)}</small>
          </div>
          <div className="teacher-action-list">
            <button className="lp-button lp-button-primary" onClick={resumeElBenchmarkAssessment} type="button">Resume draft</button>
            <button className="lp-button lp-button-secondary" onClick={discardElBenchmarkDraft} type="button">Discard draft</button>
          </div>
        </section>
      )}

      <div className="el-assessment-list-heading">
        <div>
          <p className="panel-label">Checks</p>
          <h3>Choose one check</h3>
        </div>
        <p>Each check saves its own results. You can come back for another when you are ready.</p>
      </div>

      <section className="el-assessment-domain-grid">
        <article className="teacher-action-panel el-assessment-domain-card" data-domain="letters">
          <div className="el-assessment-card-topline">
            <span className="el-assessment-card-index">01</span>
            <span className="el-assessment-recommendation recommended">Recommended</span>
          </div>
          <h3>Letter Name and Sound</h3>
          <p>Name and sound recognition for uppercase and lowercase letters.</p>
          <small>Check 1 · Kindergarten routine · Grade 1 or 2 as needed</small>
          <div className="teacher-action-list">
            <button className="lp-button lp-button-secondary" onClick={startLetterAssessment}>
              Start letter check
            </button>
          </div>
        </article>

        <article className="teacher-action-panel el-assessment-domain-card supplemental" data-domain="advanced-phonics">
          <div className="el-assessment-card-topline">
            <span className="el-assessment-card-index">02</span>
            <span className="el-assessment-recommendation supplemental">Extra detail when needed</span>
          </div>
          <h3>Phonics Pattern Diagnostic</h3>
          <p>Take a closer look at advanced phoneme and grapheme-pattern knowledge using the established scoring route.</p>
          <small>Check 2 · use for a closer look</small>
          <div className="teacher-action-list">
            <button className="lp-button lp-button-secondary" onClick={startAdvancedPhonicsAssessment}>
              Start phonics pattern check
            </button>
          </div>
        </article>

        {EL_BENCHMARK_CATALOG.map((entry, index) => {
          const recommendation = getBenchmarkRecommendation(entry.id, grade, windowName);
          const latest = latestByAssessment[entry.id];
          const prerequisite = prerequisiteFor(entry.id);
          return (
            <article className="teacher-action-panel el-assessment-domain-card" data-domain={entry.id} key={entry.id}>
              <div className="el-assessment-card-topline">
                <span className="el-assessment-card-index">{String(index + 3).padStart(2, "0")}</span>
                <span className={`el-assessment-recommendation ${recommendation.tone}`}>{recommendation.label}</span>
              </div>
              <h3>{entry.title}</h3>
              <p>{getBenchmarkCardDescription(entry.id, entry.description)}</p>
              <small>{getBenchmarkCardNote(entry.id)} · {formatBenchmarkMinutes(entry.estimatedMinutes, entry.id, grade)}</small>
              <div className="el-assessment-card-evidence">
                <span>{formatAttemptStatus(latest)}</span>
                {latest?.completedAt && <time dateTime={latest.completedAt}>{new Date(latest.completedAt).toLocaleDateString()}</time>}
              </div>
              {prerequisite.state !== "ready" && (
                <p className="el-assessment-prerequisite-note">Review an earlier result before starting.</p>
              )}
              <div className="teacher-action-list">
                <button
                  className="lp-button lp-button-secondary"
                  disabled={Boolean(elBenchmarkDraft)}
                  onClick={() => requestAssessmentStart(entry)}
                  title={elBenchmarkDraft ? "Resume or discard the saved draft before starting another check" : undefined}
                  type="button"
                >
                  {prerequisite.state === "ready" ? "Start" : "Check & start"} {getBenchmarkStartLabel(entry.id)}
                </button>
              </div>
            </article>
          );
        })}

      </section>

      <p className="el-assessment-validity-note">
        These are original Literacy Guide checks aligned to the supplied EL Skills Block overview. They are not official EL Education forms, nationally normed scores, or diagnostic tests for a disability.
      </p>
    </div>
  );
}
