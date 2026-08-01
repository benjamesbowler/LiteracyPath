import { useEffect, useMemo, useState } from "react";
import {
  WORKSHEET_TYPES,
  worksheetCycleOptions,
  worksheetCycleLabel,
  getWorksheetCycle,
  availableWorksheetTypes,
  buildWorksheetDocument,
  printWorksheet
} from "../utils/worksheets/worksheetBuilder.js";
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

export function WorksheetGeneratorPage({ className = "", onBack }) {
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
  const [bank, setBank] = useState([]);
  const [bankReadState, setBankReadState] = useState({
    status: "loading",
    message: ""
  });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState("");

  const cycle = useMemo(() => getWorksheetCycle(cycleId), [cycleId]);
  const availableTypes = useMemo(() => availableWorksheetTypes(cycle), [cycle]);

  // Derived during render so a cycle change can't leave an invalid type
  // selected (no reset-in-effect needed).
  const effectiveType = availableTypes.includes(type) ? type : (availableTypes[0] || "");

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

  return (
    <main className="ws-page" data-teacher-route="worksheets">
      <nav className="ws-route-nav" aria-label="Worksheet navigation">
        <button type="button" className="ws-back-link" onClick={onBack}>
          ← Back to Resources
        </button>
      </nav>
      <header className="ws-page-head">
        <h1>Worksheet generator</h1>
        <p>Choose the teaching cycle and the practice you need. We will open a print preview.</p>
        {className && <span className="ws-context">Class: {className}</span>}
      </header>

      <section className="ws-builder" aria-label="Worksheet options">
        <label className="ws-field">
          <span>Cycle</span>
          <select value={cycleId} onChange={e => rememberCycle(e.target.value)}>
            {cycleOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{worksheetCycleLabel(opt)}</option>
            ))}
          </select>
        </label>

        <label className="ws-field">
          <span>Worksheet type</span>
          <select value={effectiveType} onChange={e => setType(e.target.value)}>
            {availableTypes.map(id => (
              <option key={id} value={id}>{TYPE_LABEL[id]}</option>
            ))}
          </select>
        </label>

        <label className="ws-field">
          <span>Pages</span>
          <select value={pages} onChange={e => setPages(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <option key={n} value={n}>{n} page{n === 1 ? "" : "s"}</option>
            ))}
          </select>
        </label>

        <p className="ws-blurb">{WORKSHEET_TYPES.find(t => t.id === effectiveType)?.blurb}</p>
        <p className="ws-selection-summary" aria-live="polite">
          <strong>{worksheetCycleLabel(cycle)}</strong>
          {" · "}
          {TYPE_LABEL[effectiveType] || "Choose a worksheet"}
          {" · "}
          {pages} page{pages === 1 ? "" : "s"}
        </p>

        <div className="ws-actions">
          <button type="button" className="ws-primary" onClick={handleGenerate} disabled={!effectiveType}>
            Open print preview
          </button>
          <button type="button" className="ws-ghost" onClick={handleSave} disabled={!effectiveType || busy}>
            Save to bank
          </button>
        </div>
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
