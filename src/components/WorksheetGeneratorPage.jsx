import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  WORKSHEET_TYPES,
  WORKSHEET_CATEGORIES,
  worksheetCycleOptions,
  worksheetCycleLabel,
  getWorksheetCycle,
  availableWorksheetTypes,
  buildWorksheetDocument,
  printWorksheet,
  printTrackedWorksheet
} from "../utils/worksheets/worksheetBuilder.js";
import { buildWorksheetInstanceRecipe } from "../utils/worksheets/buildWorksheetInstance.js";
import { buildWorksheetQrPayload } from "../utils/worksheets/buildWorksheetQrPayload.js";
import { createWorksheetInstance, resolveWorksheetCode } from "../data/worksheets/worksheetEvidence.js";
import { TrackedWorksheetDialog } from "./teacher/worksheets/TrackedWorksheetDialog.jsx";
import { WorksheetMarkingPage } from "./teacher/worksheets/WorksheetMarkingPage.jsx";
import {
  listWorksheetRecipes,
  saveWorksheetRecipe,
  deleteWorksheetRecipe
} from "../utils/worksheets/worksheetBank.js";
import { ActionFeedback } from "./ActionFeedback.jsx";
import "../styles/worksheets.css";

const TYPE_LABEL = Object.fromEntries(WORKSHEET_TYPES.map(t => [t.id, t.label]));

const LAST_CYCLE_KEY = "lp-worksheets-last-cycle";

function describeWorksheetBankLoadError(error) {
  const detail = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();
  if (/(failed to fetch|network|offline|timeout|load failed)/.test(detail)) {
    return "We couldn't reach your saved worksheet bank. Check your connection and try again. You can still build and print a new worksheet.";
  }
  if (/(permission|policy|jwt|authori[sz]|401|403)/.test(detail)) {
    return "Your teacher session could not open the saved worksheet bank. Try again, then sign in again if it still fails. You can still build and print a new worksheet.";
  }
  return "Your saved worksheet bank could not be loaded. Try again. You can still build and print a new worksheet.";
}

export function WorksheetGeneratorPage({ client = null, classId = "", className = "", studentList = [], onBack, onPlanLesson }) {
  const cycleOptions = useMemo(() => worksheetCycleOptions(), []);
  const [cycleId, setCycleId] = useState(() => {
    // Default to the cycle the teacher used last time.
    try {
      const saved = window.localStorage.getItem(LAST_CYCLE_KEY);
      if (saved && cycleOptions.some(option => option.id === saved)) return saved;
    } catch { /* first visit or storage unavailable */ }
    return cycleOptions[0]?.id || "";
  });
  const [type, setType] = useState("");
  const [pages, setPages] = useState(2);
  const [category, setCategory] = useState("all");
  const [activityQuery, setActivityQuery] = useState("");
  const [bank, setBank] = useState([]);
  const [bankReadState, setBankReadState] = useState({
    status: "loading",
    message: ""
  });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState("");
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackedLearnerIds, setTrackedLearnerIds] = useState([]);
  const [markingInstance, setMarkingInstance] = useState(null);
  const [lookupCode, setLookupCode] = useState("");

  const cycle = useMemo(() => getWorksheetCycle(cycleId), [cycleId]);
  const availableTypes = useMemo(() => availableWorksheetTypes(cycle), [cycle]);
  const librarySize = useMemo(() => cycleOptions.reduce((total, option) => (
    total + availableWorksheetTypes(getWorksheetCycle(option.id)).length
  ), 0), [cycleOptions]);

  // Derived during render so a cycle change can't leave an invalid type
  // selected (no reset-in-effect needed).
  const effectiveType = availableTypes.includes(type) ? type : (availableTypes[0] || "");
  const effectiveTypeMeta = WORKSHEET_TYPES.find(item => item.id === effectiveType);
  const visibleActivityTypes = useMemo(() => {
    const query = activityQuery.trim().toLowerCase();
    return WORKSHEET_TYPES.filter(item => (
      availableTypes.includes(item.id)
      && (category === "all" || item.category === category)
      && (!query || `${item.label} ${item.blurb} ${item.format}`.toLowerCase().includes(query))
    ));
  }, [activityQuery, availableTypes, category]);

  async function refreshBank() {
    setBankReadState({ status: "loading", message: "" });
    const { rows, error } = await listWorksheetRecipes();
    if (error) {
      setBankReadState({
        status: "error",
        message: describeWorksheetBankLoadError(error)
      });
      return false;
    }
    setBank(rows);
    setBankReadState({ status: "complete", message: "" });
    return true;
  }

  // Load the saved bank once on mount.
  useEffect(() => {
    let alive = true;
    (async () => {
      const { rows, error } = await listWorksheetRecipes();
      if (!alive) return;
      if (error) {
        setBankReadState({
          status: "error",
          message: describeWorksheetBankLoadError(error)
        });
        return;
      }
      setBank(rows);
      setBankReadState({ status: "complete", message: "" });
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!client) return;
    const code = new URLSearchParams(window.location.hash.split("?")[1] || "").get("worksheet");
    if (!code) return;
    resolveWorksheetCode(client, code).then(setMarkingInstance).catch(error => setNote(error?.message || "That tracked worksheet could not be opened."));
  }, [client]);

  const recipe = { cycleId, type: effectiveType, pages };

  function rememberCycle(nextCycleId) {
    setCycleId(nextCycleId);
    try { window.localStorage.setItem(LAST_CYCLE_KEY, nextCycleId); } catch { /* best effort */ }
  }

  function handleGenerate() {
    setNote("");
    try {
      const result = printWorksheet(recipe);
      if (!result.ok) {
        setNote("Please allow pop-ups for this site so the worksheet can open.");
        return;
      }
      setNote("Getting the worksheet pictures ready…");
      result.ready
        .then(() => setNote(""))
        .catch(() => setNote("We couldn't load every worksheet picture, so nothing was printed. Check your connection and try again."));
    } catch {
      setNote("We couldn't open that worksheet. Nothing was saved or changed. Try again.");
    }
  }

  async function handleCreateTracked() {
    setBusy(true); setNote("");
    try {
      const frozen = buildWorksheetInstanceRecipe(recipe);
      const created = await createWorksheetInstance(client, { classId, learnerIds: trackedLearnerIds, recipe: frozen });
      const qrPayload = buildWorksheetQrPayload({ origin: window.location.origin, lookupToken: created.lookup_token });
      const qrDataUrl = await QRCode.toDataURL(qrPayload, { errorCorrectionLevel: "M", margin: 1, width: 220 });
      const result = printTrackedWorksheet(recipe, { qrDataUrl, shortCode: created.short_code });
      if (!result.ok) throw new Error("Please allow pop-ups so the tracked worksheet can open.");
      result.ready.catch(() => setNote("The tracked instance was saved, but its printable pictures could not be prepared."));
      const instance = await resolveWorksheetCode(client, created.lookup_token);
      setTrackOpen(false); setMarkingInstance(instance); setNote("Tracked worksheet created. Its QR requires a signed-in teacher; the short code is printed as a camera-free fallback.");
    } catch (error) { setNote(error?.message || "The tracked worksheet could not be created."); }
    finally { setBusy(false); }
  }

  async function handleResolveCode(event) {
    event.preventDefault(); setBusy(true); setNote("");
    try { setMarkingInstance(await resolveWorksheetCode(client, lookupCode)); }
    catch (error) { setNote(error?.message || "That worksheet code was not found."); }
    finally { setBusy(false); }
  }

  async function handleSave() {
    setBusy(true);
    setNote("");
    try {
      const { title } = buildWorksheetDocument(recipe);
      const { error } = await saveWorksheetRecipe({ ...recipe, title });
      if (error) {
        setNote("Saved worksheets need you to be signed in as a teacher. (Could not save right now.)");
      } else {
        const refreshed = await refreshBank();
        setNote(refreshed
          ? "Saved to your worksheet bank."
          : "Saved, but the worksheet bank could not be refreshed. Reload the page to see it.");
      }
    } catch {
      setNote("We couldn't save that worksheet. Your choices are still here. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (busy) return;
    setBusy(true);
    setNote("");
    try {
      const { error } = await deleteWorksheetRecipe(id);
      if (error) {
        setNote("We couldn't remove that saved worksheet. Nothing was changed. Try again.");
        return;
      }
      const refreshed = await refreshBank();
      setDeleteCandidate("");
      setNote(refreshed
        ? "Saved worksheet removed."
        : "The worksheet was removed, but the bank could not be refreshed. Reload the page.");
    } catch {
      setNote("We couldn't remove that saved worksheet. Nothing was changed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function openSavedWorksheet(item) {
    try {
      const result = printWorksheet({
        cycleId: item.cycle_id,
        type: item.type,
        pages: item.pages
      });
      if (!result.ok) {
        setNote("Please allow pop-ups for this site so the worksheet can open.");
        return;
      }
      setNote("Getting the worksheet pictures ready…");
      result.ready
        .then(() => setNote(""))
        .catch(() => setNote("We couldn't load every worksheet picture, so nothing was printed. Check your connection and try again."));
    } catch {
      setNote("We couldn't open that worksheet. Nothing was changed. Try again.");
    }
  }

  if (markingInstance) return <WorksheetMarkingPage client={client} instance={markingInstance} students={studentList} onClose={() => setMarkingInstance(null)} onPlanLesson={onPlanLesson} />;

  return (
    <main className="ws-page" data-teacher-route="worksheets">
      <nav className="ws-route-nav" aria-label="Worksheet navigation">
        <button type="button" className="ws-back-link" onClick={onBack}>
          ← Back to Resources
        </button>
      </nav>
      <header className="ws-page-head">
        <h1>Printable activity library</h1>
        <p>Choose a teaching cycle, then pick practice, puzzles, colouring, crafts or a classroom game.</p>
        <p className="ws-library-count">{librarySize} cycle-matched activities across {cycleOptions.length} teaching cycles.</p>
        {className && <span className="ws-context">Class: {className}</span>}
      </header>

      <section className="ws-builder" aria-label="Worksheet options">
        <div className="ws-builder-controls">
          <label className="ws-field ws-cycle-field">
            <span>Teaching cycle</span>
            <select value={cycleId} onChange={e => rememberCycle(e.target.value)}>
              {cycleOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{worksheetCycleLabel(opt)}</option>
              ))}
            </select>
          </label>

          <label className="ws-field ws-pages-field">
            <span>Pack length</span>
            <select value={pages} onChange={e => setPages(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map(n => (
                <option key={n} value={n}>{n} page{n === 1 ? "" : "s"}</option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="ws-activity-picker">
          <legend>Choose an activity</legend>
          <p>{availableTypes.length} activities match {worksheetCycleLabel(cycle)}.</p>
          <div className="ws-library-tools">
            <label className="ws-field ws-search-field">
              <span>Find an activity</span>
              <input
                type="search"
                value={activityQuery}
                onChange={event => setActivityQuery(event.target.value)}
                placeholder="Try word search, colour or cut"
              />
            </label>
            <div className="ws-category-filters" aria-label="Activity categories">
              {WORKSHEET_CATEGORIES.map(item => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={category === item.id}
                  onClick={() => setCategory(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {visibleActivityTypes.length ? (
            <div className="ws-activity-grid" role="radiogroup" aria-label="Available printable activities">
              {visibleActivityTypes.map(item => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={effectiveType === item.id}
                  className={`ws-activity-card${effectiveType === item.id ? " is-selected" : ""}`}
                  onClick={() => setType(item.id)}
                >
                  <span className="ws-activity-format">{item.format}</span>
                  <strong>{item.label}</strong>
                  <span>{item.blurb}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="ws-library-empty" role="status">
              <strong>No matching activities</strong>
              <span>Clear the search or choose another category.</span>
              <button type="button" onClick={() => { setActivityQuery(""); setCategory("all"); }}>
                Show all activities
              </button>
            </div>
          )}
        </fieldset>

        <div className="ws-selection-summary" aria-live="polite">
          <span><b>Cycle</b>{worksheetCycleLabel(cycle)}</span>
          <span><b>Activity</b>{TYPE_LABEL[effectiveType] || "Choose an activity"}</span>
          <span><b>Pack</b>{pages} page{pages === 1 ? "" : "s"}</span>
          <p>{effectiveTypeMeta?.blurb}</p>
        </div>

        <div className="ws-actions">
          <button type="button" className="ws-primary" onClick={handleGenerate} disabled={!effectiveType}>
            Open print preview
          </button>
          <button type="button" className="ws-ghost" onClick={handleSave} disabled={!effectiveType || busy}>
            Save to bank
          </button>
          {client && classId && <button type="button" className="ws-ghost" onClick={() => { setTrackedLearnerIds(studentList.filter(row=>!row.archived_at&&!row.archivedAt).map(row=>row.id)); setTrackOpen(true); }} disabled={!effectiveType || busy}>Track and print</button>}
        </div>
        {trackOpen && <TrackedWorksheetDialog students={studentList} selectedIds={trackedLearnerIds} onToggle={id=>setTrackedLearnerIds(current=>current.includes(id)?current.filter(value=>value!==id):[...current,id])} onCancel={()=>setTrackOpen(false)} onCreate={handleCreateTracked} busy={busy} />}
        {client && <form className="ws-code-entry" onSubmit={handleResolveCode}><label><span>Open a tracked worksheet</span><input value={lookupCode} onChange={event=>setLookupCode(event.target.value.toUpperCase())} maxLength="64" placeholder="Enter 8-character code" /></label><button type="submit" disabled={busy||lookupCode.length<8}>Open marking</button></form>}
        {note && <p className="ws-note" role="status">{note}</p>}
      </section>

      <section className="ws-bank" aria-label="Saved worksheets">
        <h2>Your worksheet bank</h2>
        {bankReadState.status === "loading" && (
          <p className="ws-bank-loading" role="status">Loading saved worksheets…</p>
        )}
        {bankReadState.status === "error" && (
          <ActionFeedback
            className="ws-bank-feedback"
            feedback={{
              kind: "error",
              message: bankReadState.message,
              actionLabel: "Try again",
              onAction: refreshBank
            }}
          />
        )}
        {bankReadState.status === "complete" && bank.length === 0 ? (
          <p className="ws-empty">No saved worksheets yet. Build one above and press “Save to bank”.</p>
        ) : bankReadState.status === "complete" ? (
          <ul className="ws-bank-list">
            {bank.map(item => (
              <li key={item.id}>
                <div className="ws-bank-info">
                  <strong>{item.title || `Cycle ${item.cycle_id}`}</strong>
                  <span>{item.pages} page{item.pages === 1 ? "" : "s"}</span>
                </div>
                <div className="ws-bank-actions">
                  <button type="button" className="ws-ghost" onClick={() => openSavedWorksheet(item)}>
                    Open
                  </button>
                  {deleteCandidate === item.id ? (
                    <>
                      <button type="button" className="ws-danger" disabled={busy} onClick={() => handleDelete(item.id)}>
                        Confirm remove
                      </button>
                      <button type="button" className="ws-ghost" disabled={busy} onClick={() => setDeleteCandidate("")}>
                        Keep
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="ws-danger"
                      disabled={busy}
                      onClick={() => setDeleteCandidate(item.id)}
                      aria-label={`Remove ${item.title || "saved worksheet"}`}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
