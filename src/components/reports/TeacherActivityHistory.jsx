import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { listLiteracyMockHistoryPage } from "../../data/literacyMockSessionCore.js";
import { buildTeacherActivityHistory, filterTeacherActivityHistory, teacherActivityHref } from "../../data/teacherActivityHistory.js";
import { readTeacherFunnelParams } from "../../appState/appViewHelpers.js";
import { TeacherDataTable, TeacherFilterBar } from "../teacher/ui/TeacherPrimitives.jsx";
import { TeacherDialog } from "../teacher/ui/TeacherDialog.jsx";
import { openHtmlDocument } from "../../utils/openHtmlDocument.js";
import { isProgressTest } from "../../policy/progressTestPolicy.js";
import { ProgressCheckReportsPanel } from "../progress/ProgressCheckReportsPanel.jsx";
import "../../styles/teacher-activity-history.css";

const SavedReport = lazy(() => import("../FinishedReportPage.jsx").then(module => ({ default: module.FinishedReportPage })));
const fixedRecordRoute = () => "";
const noop = () => {};
const firstRecorded = (...values) => values.find(value => value !== undefined && value !== null && value !== "");
const responseText = value => value === undefined || value === null || value === "" ? "Not recorded" : Array.isArray(value) ? value.map(responseText).join("; ") : typeof value === "object" ? Object.entries(value).map(([key, item]) => `${key}: ${responseText(item)}`).join("; ") : String(value);

export function SavedAssessmentResponses({ record }) {
  const responses = record.questionRecords || [];
  return <details className="teacher-original-responses"><summary>Original saved responses ({responses.length})</summary>
    <p>Responses and assistance are shown as recorded. Missing details stay missing; this table does not re-score answers.</p>
    {responses.length ? <TeacherDataTable label="Original saved responses"><thead><tr><th scope="col">Question</th><th scope="col">Student response</th><th scope="col">Expected response</th><th scope="col">Recorded outcome</th><th scope="col">Help / access</th></tr></thead><tbody>{responses.map((row, index) => <tr key={`${row.responseId || row.questionId || "response"}-${index}`}>
      <th scope="row">{row.prompt || row.itemSnapshot?.prompt || row.targetWord || row.itemKey || "Question wording not recorded"}{row.itemSnapshot?.passage && <p>{row.itemSnapshot.passage}</p>}</th>
      <td>{responseText(firstRecorded(row.responseText, row.transcription, row.selectedAnswer, row.selected))}</td>
      <td>{responseText(firstRecorded(row.expectedResponse, row.correctAnswer, row.itemSnapshot?.correctAnswer, row.itemSnapshot?.correct))}</td>
      <td>{row.responseStatus ? row.responseStatus.replaceAll("_", " ") : "Not recorded"}</td>
      <td>{responseText(firstRecorded(row.assistance, row.support, row.supportUsed))}{row.audioDelivery ? ` · Audio: ${row.audioDelivery}` : ""}{row.modality || row.itemSnapshot?.modality ? ` · ${row.modality || row.itemSnapshot.modality}` : ""}</td>
    </tr>)}</tbody></TeacherDataTable> : <p>Individual responses were not retained in this saved record.</p>}
  </details>;
}

export function SavedActivityResult({ activity, className, onClose }) {
  const resultRef = useRef(null);
  const [printError, setPrintError] = useState("");
  function printSavedResult() {
    const content = resultRef.current;
    if (!content) return;
    const copy = content.cloneNode(true);
    copy.querySelectorAll("details").forEach(element => { element.open = true; });
    copy.querySelectorAll("button, nav, .screen-only").forEach(element => element.remove());
    const heading = document.createElement("h1"); heading.textContent = `${activity.studentName} · ${activity.label}`;
    const date = document.createElement("p"); date.textContent = `Selected saved assessment · ${activity.date ? new Date(activity.date).toLocaleString() : "Date not recorded"}`;
    const result = openHtmlDocument({ autoPrint: true, html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Saved assessment</title><style>@page{margin:14mm}body{font:15px/1.5 Arial,sans-serif;color:#18263e}table{border-collapse:collapse;width:100%}td,th{border:1px solid #aaa;padding:6px;text-align:left}section,article{break-inside:avoid}summary{font-weight:bold}img{max-width:100%}</style></head><body>${heading.outerHTML}${date.outerHTML}${copy.outerHTML}<p>Contains student education records. Do not redistribute.</p></body></html>` });
    if (!result.ok) setPrintError("The print window was blocked. Allow it and try again.");
  }
  return <div className="teacher-activity-overlay"><TeacherDialog className="teacher-activity-dialog" label="Saved activity results" onClose={onClose}>
    <header><div><h2>{activity.label}</h2><p>{activity.studentName} · {activity.date ? new Date(activity.date).toLocaleString() : "Date not recorded"}</p></div><button type="button" className="lp-button lp-button-secondary" onClick={onClose}>Back to activity history</button></header>
    <p role="note">This is the saved assessment you selected. Other attempts and later practice are not included. Old results do not become current learning evidence by opening them.</p>
    <div ref={resultRef}>
    <SavedAssessmentResponses record={activity.original} />
    {isProgressTest(activity.original) ? <><ProgressCheckReportsPanel records={[activity.original]} /><button type="button" className="lp-button lp-button-secondary" onClick={printSavedResult}>Print this saved assessment</button></> : <Suspense fallback={<p role="status">Opening saved results…</p>}>
      <SavedReport recordOnly assessmentHistory={[activity.original]} studentName={activity.studentName} className={className}
        progressScopeKey={activity.studentId} teacherId={activity.original.teacherId || ""} onPrintRecord={printSavedResult}
        initialReportView={activity.reportView} readReportRouteView={fixedRecordRoute}
        onReportViewChange={noop} buildReportHref={() => ""} evidenceReady
        reportStatusMessage="This saved assessment only" />
    </Suspense>}
    </div>{printError && <p role="alert">{printError}</p>}
  </TeacherDialog></div>;
}

export function TeacherActivityHistory({ client, classId, className, studentId = "", students = [], records = [], recordsReady = true, recordsLoading = false, onRetryRecords, onOpenActivity, routeHash }) {
  const [mockPage, setMockPage] = useState({ sessions: [], cursor: null, hasMore: true, status: client ? "loading" : "unavailable", error: "" });
  const [retry, setRetry] = useState(0);
  const [pageRequest, setPageRequest] = useState(null);
  const [category, setCategory] = useState("");
  const [filterStudent, setFilterStudent] = useState("");
  const [after, setAfter] = useState("");
  const [before, setBefore] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedId, setSelectedId] = useState(() => readTeacherFunnelParams(routeHash).get("activity") || "");

  useEffect(() => {
    const read = () => setSelectedId(readTeacherFunnelParams(routeHash).get("activity") || "");
    if (routeHash !== undefined) { read(); return undefined; }
    window.addEventListener("hashchange", read);
    window.addEventListener("popstate", read);
    return () => { window.removeEventListener("hashchange", read); window.removeEventListener("popstate", read); };
  }, [routeHash]);

  useEffect(() => {
    if (!client || !classId) return undefined;
    const abort = new AbortController();
    listLiteracyMockHistoryPage({ client, classId, studentId: studentId || null, cursor: pageRequest, limit: 20, signal: abort.signal }).then(page => {
      if (abort.signal.aborted) return;
      setMockPage(previous => {
        const sessions = new Map((pageRequest ? previous.sessions : []).map(row => [row.id, row]));
        page.sessions.forEach(row => sessions.set(row.id, row));
        return { sessions: [...sessions.values()], cursor: page.nextCursor, hasMore: page.hasMore, status: "ready", error: "" };
      });
    }).catch(error => {
      if (!abort.signal.aborted) setMockPage(previous => ({ ...previous, status: "error", error: error.message || "Mock history could not be loaded." }));
    });
    return () => abort.abort();
  }, [classId, client, pageRequest, retry, studentId]);

  const activities = useMemo(() => buildTeacherActivityHistory({ records: recordsReady ? records : [], sessions: mockPage.sessions, classId, studentId }), [classId, mockPage.sessions, records, recordsReady, studentId]);
  const matching = useMemo(() => filterTeacherActivityHistory(activities, { category, studentId: filterStudent, after, before }), [activities, after, before, category, filterStudent]);
  const selected = activities.find(row => row.id === selectedId && row.kind === "assessment");
  const filtersApplied = Boolean(category || filterStudent || after || before);

  function clearFilters() { setCategory(""); setFilterStudent(""); setAfter(""); setBefore(""); setVisibleCount(20); }
  function closeResult() {
    setSelectedId("");
    const hash = window.location.hash;
    const [path, query = ""] = hash.split("?");
    const params = new URLSearchParams(query); params.delete("activity");
    window.history.replaceState(null, "", `${path}${params.size ? `?${params}` : ""}`);
  }
  function loadOlder() {
    setVisibleCount(count => count + 20);
    if (client && mockPage.hasMore && mockPage.status !== "loading") {
      setMockPage(previous => ({ ...previous, status: "loading", error: "" }));
      setPageRequest(mockPage.cursor);
    }
  }
  function retryMocks() { setMockPage(previous => ({ ...previous, status: "loading", error: "" })); setRetry(value => value + 1); }

  return <section className="teacher-activity-history screen-only" aria-labelledby="teacher-activity-history-title">
    <header><h3 id="teacher-activity-history-title">Saved activity history</h3><p>Open original saved assessments and mock sessions. Reading and game history remain in each student's detailed reports. Practice and independent results stay separate.</p></header>
    <TeacherFilterBar label="Filter saved activities">
      <label>Activity<select aria-label="Activity" value={category} onChange={event => { setCategory(event.target.value); setVisibleCount(20); }}><option value="">All activities</option><option value="assessment">Assessments</option><option value="practice">Practice</option><option value="mock">Adaptive Literacy Tests</option></select></label>
      {!studentId && <label>Student<select aria-label="Student" value={filterStudent} onChange={event => { setFilterStudent(event.target.value); setVisibleCount(20); }}><option value="">All students</option>{students.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>}
      <label>From<input type="date" value={after} onChange={event => setAfter(event.target.value)} /></label>
      <label>Through<input type="date" value={before} onChange={event => setBefore(event.target.value)} /></label>
      {filtersApplied && <button type="button" className="lp-button lp-button-secondary" onClick={clearFilters}>Clear filters</button>}
    </TeacherFilterBar>
    {after && before && after > before && <p role="alert">The From date must be on or before the Through date.</p>}
    {!recordsReady && <p role="status">{recordsLoading ? "Loading saved assessments…" : "Saved assessments could not be confirmed. They are not being treated as absent."}{!recordsLoading && onRetryRecords && <button type="button" className="lp-button lp-button-secondary" onClick={onRetryRecords}>Try loading assessments again</button>}</p>}
    {mockPage.status === "loading" && <p role="status" aria-live="polite">Loading mock session history…</p>}
    {mockPage.status === "error" && <p role="alert">Mock history could not be confirmed. Previously loaded records remain available. <button type="button" className="lp-button lp-button-secondary" onClick={retryMocks}>Try loading mock history again</button></p>}
    {mockPage.status === "unavailable" && <p>Connect to the school account to load mock history.</p>}
    {matching.length > 0 && <TeacherDataTable label="Saved activity results"><caption>{Math.min(visibleCount, matching.length)} of {matching.length} loaded matching records</caption><thead><tr><th scope="col">Activity</th><th scope="col">Student / audience</th><th scope="col">Date</th><th scope="col">Recorded status</th><th scope="col">Results</th></tr></thead><tbody>{matching.slice(0, visibleCount).map(row => <tr key={row.id}><th scope="row">{row.label}{row.target && row.target !== row.label && <small>{row.target}</small>}</th><td>{row.studentName}</td><td>{row.date ? <time dateTime={row.date}>{new Date(row.date).toLocaleString()}</time> : "Date not recorded"}</td><td>{row.state}</td><td><a className="lp-button lp-button-secondary" href={teacherActivityHref({ ...row, studentId: studentId || filterStudent || row.studentId }, { reportStudentId: studentId })} onClick={event => {
      if (row.kind === "mock" && onOpenActivity) { event.preventDefault(); onOpenActivity({ ...row, studentId: studentId || filterStudent || row.studentId }); }
      else if (row.kind === "assessment") setSelectedId(row.id);
    }}>Open results<span className="sr-only"> for {row.label} · {row.studentName}</span></a></td></tr>)}</tbody></TeacherDataTable>}
    {!matching.length && recordsReady && mockPage.status === "ready" && <p>{filtersApplied ? "No matching results in the loaded history." : "No saved results in the loaded history."}</p>}
    {mockPage.hasMore && client && <p>Older mock history has not been loaded yet. Date and student filters apply to the records loaded so far.</p>}
    {(matching.length > visibleCount || (client && mockPage.hasMore)) && <button type="button" className="lp-button lp-button-secondary" disabled={mockPage.status === "loading" || mockPage.status === "error"} onClick={loadOlder}>Load older activities</button>}
    {selected && <SavedActivityResult key={selected.id} activity={selected} className={className} onClose={closeResult} />}
    {selectedId && !selected && recordsReady && <p role="status">The requested saved assessment is not available in this class or student view.</p>}
  </section>;
}
