import { TeacherDataTable, TeacherFilterBar } from "../teacher/ui/TeacherPrimitives.jsx";
import { useEffect, useRef, useState } from "react";
import { buildAdminUsageReport, loadAdminUsageSnapshot, purgeAdminUsageSnapshots, releaseAdminUsageSnapshot, usageDateRange } from "../../data/adminUsageInsights.js";
import { loadUsageItemManifest } from "../../data/usageItemManifest.js";
import "./admin-usage-insights.css";

const calendarDate = value => `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,"0")}-${String(value.getDate()).padStart(2,"0")}`;
const readablePercent = value => value === null ? "Not recorded" : `${Math.round(value*100)}%`;
const usageLabel = status => ({ observed_use: "Observed use", no_observed_use_when_available: "No use observed when available", no_observed_use_when_offered: "No use observed when offered", not_observed: "Opportunity not recorded" }[status] || status);
const errorText = error => /admin_create_usage_snapshot|function.*not.*found|PGRST202|schema cache/i.test(error?.message || "")
  ? "The usage-report database update has not been installed in this environment. No report has been generated."
  : error?.message || "Report generation failed. No partial report is available.";

export function AdminUsageInsightsPanel({ client, schools = [], manifestLoader = loadUsageItemManifest }) {
  const today = new Date();
  const initialFrom = new Date(today); initialFrom.setDate(initialFrom.getDate()-29);
  const [from, setFrom] = useState(() => calendarDate(initialFrom));
  const [through, setThrough] = useState(() => calendarDate(today));
  const [schoolId, setSchoolId] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(null);
  const [report, setReport] = useState(null);
  const [downloaded, setDownloaded] = useState(false);
  const owner = useRef({ sequence: 0, abort: null, snapshotId: null, client });
  useEffect(() => {
    const current = owner.current;
    current.client = client;
    if (client?.call) void purgeAdminUsageSnapshots(client).catch(() => {});
    return () => {
      current.sequence += 1; current.abort?.abort();
      if (current.snapshotId) void releaseAdminUsageSnapshot(current.client,current.snapshotId).catch(() => {});
      current.snapshotId = null;
    };
  }, [client]);

  async function generate() {
    const current = owner.current;
    current.abort?.abort();
    const sequence = ++current.sequence;
    setStatus("loading");
    const previous = current.snapshotId;
    current.snapshotId = null;
    if (previous) await releaseAdminUsageSnapshot(client,previous).catch(() => {});
    const abort = new AbortController(); current.abort = abort;
    setError(""); setReport(null); setDownloaded(false); setProgress(null); setStatus("loading");
    try {
      const range = usageDateRange(from,through);
      const snapshot = await loadAdminUsageSnapshot({ client, from: range.from, to: range.to, schoolId, signal: abort.signal,
        onProgress: value => { if (current.sequence === sequence) setProgress(value); } });
      if (current.sequence !== sequence || abort.signal.aborted) { await releaseAdminUsageSnapshot(client,snapshot.metadata.snapshotId); return; }
      current.snapshotId = snapshot.metadata.snapshotId;
      const manifest = await manifestLoader();
      if (current.sequence !== sequence || abort.signal.aborted) { await releaseAdminUsageSnapshot(client,snapshot.metadata.snapshotId); return; }
      setReport(buildAdminUsageReport({ ...snapshot, itemManifest: manifest, operatorRange: range }));
      setStatus("ready");
    } catch (failure) {
      if (current.snapshotId) await releaseAdminUsageSnapshot(client,current.snapshotId).catch(() => {});
      current.snapshotId = null;
      if (current.sequence === sequence) { setError(errorText(failure)); setStatus("error"); }
    }
  }
  function cancel() { owner.current.abort?.abort(); setStatus("canceling"); }
  async function download() {
    if (!report || !owner.current.snapshotId) return;
    setStatus("downloading"); setError("");
    try {
      const content = JSON.stringify(report,null,2);
      // Validate expiry/deletion immediately before releasing the cache and
      // recording a download request. Never hand out a stale prepared export.
      await releaseAdminUsageSnapshot(client,owner.current.snapshotId,true);
      owner.current.snapshotId = null;
      const blob = new Blob([content], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      try {
        const link = document.createElement("a"); link.href = url;
        link.download = `literacy-guide-app-insights-${report.metadata.operatorRange.calendarFrom}-${report.metadata.operatorRange.calendarThrough}.json`;
        document.body.append(link); link.click(); link.remove();
      } finally { setTimeout(() => URL.revokeObjectURL(url),0); }
      // Raw evidence stays only in the downloaded file, not browser storage.
      setReport(previous => ({ ...previous, evidence: [], responses: [], legacyAnswerObservations: [] }));
      setDownloaded(true); setStatus("ready");
    } catch (failure) { setError(errorText(failure)); setStatus("error"); }
  }
  const busy = ["loading","canceling","downloading"].includes(status);
  const reviewItems = (report?.items || []).flatMap(item => item.cohorts.filter(cohort =>
    ["review_lower_accuracy","review_higher_accuracy"].includes(cohort.reviewSignal)).map(cohort => ({ ...item, ...cohort })))
    .sort((a,b) => b.independentResponses-a.independentResponses).slice(0,20);
  const popularItems=(report?.popularity || []).filter(item=>!["skills_assessment","cycle_practice"].includes(item.area)
    && (item.area!=="skills_practice" || item.id==="skills-trail")).slice(0,20);
  return <section className="admin-usage-insights" aria-labelledby="admin-usage-title">
    <div><h2 id="admin-usage-title">App usage & improvement report</h2><p>Generate a downloadable evidence report to review with Codex: what children use, where questions need review, and where media or repeated presses affect the experience.</p></div>
    <TeacherFilterBar label="Usage report filters" className="admin-usage-filters">
      <label>School<select value={schoolId} onChange={event => setSchoolId(event.target.value)} disabled={busy}><option value="">All schools</option>{schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}</select></label>
      <label>First day<input type="date" value={from} onChange={event => setFrom(event.target.value)} disabled={busy} /></label>
      <label>Last day<input type="date" value={through} onChange={event => setThrough(event.target.value)} disabled={busy} /></label>
      <button type="button" className="main-button" disabled={busy || !client?.call} onClick={() => void generate()}>Generate report</button>
      {busy && status !== "downloading" && <button type="button" className="secondary-button" onClick={cancel} disabled={status === "canceling"}>Cancel</button>}
    </TeacherFilterBar>
    <p className="admin-usage-note">Names, contact details, login credentials and device identifiers are removed. Export-specific learner references let Codex compare patterns. The JSON still contains sensitive learning evidence; delete it after its review.</p>
    <div role="status" aria-live="polite">{status === "loading" ? progress ? `Collecting evidence: ${progress.loaded.toLocaleString()} of ${progress.total.toLocaleString()} rows.` : "Capturing a consistent snapshot…" : status === "canceling" ? "Canceling report generation…" : downloaded ? "Download requested. Temporary server evidence has been removed." : ""}</div>
    {error && <p role="alert" className="admin-usage-error">{error}</p>}
    {report && <>
      <div className="admin-usage-result-header"><div><h3>Report ready</h3><p>Captured {new Date(report.metadata.capturedAt).toLocaleString()} · {report.summary.observedLearners} learners with cloud observations{report.summary.currentCohortLearners === null ? " (linked cohort size not recorded)" : ` / ${report.summary.currentCohortLearners} linked learner records`} · {report.summary.rawRows.toLocaleString()} source rows</p><p>Dates: {report.metadata.operatorRange.calendarFrom}–{report.metadata.operatorRange.calendarThrough} ({report.metadata.operatorRange.timezone}). Prepared download expires {new Date(report.metadata.expiresAt).toLocaleTimeString()}.</p></div><button type="button" className="main-button" disabled={busy || downloaded} onClick={() => void download()}>{downloaded ? "Downloaded" : "Download JSON for Codex"}</button></div>
      <dl className="admin-usage-metrics"><div><dt>Independent responses</dt><dd>{report.summary.independentResponses}</dd></div><div><dt>Supported responses</dt><dd>{report.summary.supported}</dd></div><div><dt>Unavailable media</dt><dd>{report.summary.mediaFailed}</dd></div><div><dt>Timing recorded / missing</dt><dd>{report.summary.responsesWithTiming} / {report.summary.responsesWithoutTiming}</dd></div></dl>
      <h3>Feature use</h3><TeacherDataTable label="Feature use" className="admin-usage-table"><thead><tr><th>Feature</th><th>Learners with use evidence</th><th>Visits</th><th>Availability denominator</th><th>Evidence</th></tr></thead><tbody>{report.features.map(feature => <tr key={feature.id}><th scope="row">{feature.label}</th><td>{feature.usageStatus === "not_observed" ? "Not recorded" : feature.uniqueLearners}</td><td>{feature.visits || "Not recorded"}</td><td>{feature.availableToObservedLearners || "Not recorded"}</td><td>{usageLabel(feature.usageStatus)}</td></tr>)}</tbody></TeacherDataTable>
      <h3>Most used content</h3><p>Dated events and current stored progress are separate. Stored counters can include play or reading before these dates; they are not interval totals or independent assessment scores. Up to 20 content items are shown; the download includes all items.</p>
      {!popularItems.length ? <p>No non-question content use is recorded in these sources.</p> : <TeacherDataTable label="Most used content" className="admin-usage-table"><thead><tr><th>Content</th><th>Area</th><th>Dated use events / learners</th><th>Learners with stored progress</th><th>Stored cumulative counters</th></tr></thead><tbody>{popularItems.map(item=><tr key={`${item.area}:${item.id}`}><th scope="row">{item.catalog?.title || item.catalog?.target || item.id}</th><td>{item.area}</td><td>{item.usageEventCount} / {item.datedEvidenceLearners}</td><td>{item.storedStateLearners}</td><td>{Object.entries(item.storedCumulativeCounters).map(([field,value])=>`${field}: ${value}`).join("; ") || "Not recorded"}</td></tr>)}</tbody></TeacherDataTable>}
      <h3>Questions to review</h3><p>These are product review signals from independent responses, with at least {report.interpretation.reviewRules.minimumResponses} responses from {report.interpretation.reviewRules.minimumLearners} learners. They do not establish that a child guessed or that a question is intrinsically too hard or easy. The download includes every item and its evidence.</p>
      {!reviewItems.length ? <p>No question meets the review signal criteria in the recorded evidence.</p> : <TeacherDataTable label="Questions to review" className="admin-usage-table"><thead><tr><th>Question</th><th>Area</th><th>Independent accuracy</th><th>Responses / learners</th><th>Next review</th></tr></thead><tbody>{reviewItems.map(item => <tr key={`${item.area}:${item.id}:${item.mode}:${item.level}:${item.phase}:${item.contentVersion}:${item.instructionDelivery}:${item.targetDelivery}`}><th scope="row">{item.catalog?.target || item.target || item.id}</th><td>{item.area} · {item.mode}<br/>Level {item.level ?? "not recorded"}, phase {item.phase ?? "not recorded"}{item.instructionDelivery && <><br/>Instruction: {item.instructionDelivery}; target: {item.targetDelivery || "not recorded"}</>}</td><td>{readablePercent(item.independentAccuracy)}</td><td>{item.independentResponses} / {item.uniqueIndependentLearners}</td><td>{item.nextAction}</td></tr>)}</tbody></TeacherDataTable>}
      <details><summary>Source coverage and limits</summary><ul>{report.metadata.sources.map(source => <li key={source.source}>{source.source}: {source.available ? `${source.rows} stored rows` : "Source unavailable; not zero"}</li>)}</ul><p>Progress usage extraction: {report.progressCoverage.recognizedRows} of {report.progressCoverage.sourceRows} rows use recognized shapes. Other areas stay in raw evidence: {Object.entries(report.progressCoverage.uninterpretedAreas).map(([area,count])=>`${area} (${count})`).join(", ") || "none"}.</p><p>{report.metadata.rangeSemantics}</p><ul>{report.interpretation.limits.map(limit => <li key={limit}>{limit}</li>)}</ul></details>
    </>}
  </section>;
}
