import { useEffect, useMemo, useState } from "react";
import {
  WORKSHEET_TYPES,
  WORKSHEET_CATEGORIES,
  WORKSHEET_PAGE_STAGES,
  buildWorksheetPreviewDocument,
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
import { WORKSHEET_CHARACTER_ART } from "../utils/worksheets/worksheetCharacterArt.js";
import { WorksheetPreview } from "./WorksheetPreview.jsx";
import { Printer, BookmarkSimple, ArrowLeft, ArrowRight, MagnifyingGlass, Check, FileText } from "@phosphor-icons/react";
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
  const [type, setType] = useState("characterColouring");
  const [previewPage, setPreviewPage] = useState(0);
  const [characterId, setCharacterId] = useState("muddy");
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

  const recipeType = effectiveType === "characterColouring" ? `${effectiveType}:${characterId}` : effectiveType;
  const recipe = { cycleId, type: recipeType, pages };
  const currentPage = Math.min(previewPage, pages - 1);
  const preview = useMemo(() => {
    if (!effectiveType) return null;
    try { return buildWorksheetPreviewDocument({ cycleId, type: recipeType, pages }, currentPage); }
    catch { return null; }
  }, [cycleId, effectiveType, recipeType, pages, currentPage]);

  function chooseType(nextType) { setType(nextType); setPreviewPage(0); }
  function handleActivityKey(event, index) {
    let nextIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % visibleActivityTypes.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + visibleActivityTypes.length) % visibleActivityTypes.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = visibleActivityTypes.length - 1;
    else return;
    event.preventDefault();
    chooseType(visibleActivityTypes[nextIndex].id);
    event.currentTarget.parentElement.querySelectorAll('[role="radio"]')[nextIndex]?.focus();
  }

  function rememberCycle(nextCycleId) {
    setCycleId(nextCycleId);
    setPreviewPage(0);
    try { window.localStorage.setItem(LAST_CYCLE_KEY, nextCycleId); } catch { /* best effort */ }
  }

  function handleGenerate(answerKey = false) {
    setNote("");
    try {
      const result = printWorksheet(recipe, { answerKey });
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
        <div><span className="ws-eyebrow">Resources / Print studio</span>
          <h1>Little pages. Big possibilities.</h1>
          <p>Thoughtful practice, familiar characters and space to make it their own.</p>
        </div>
        <div className="ws-header-note"><strong>{librarySize}</strong><span>cycle-matched activities</span>{className && <span className="ws-context">Class: {className}</span>}</div>
      </header>

      <section className="ws-builder" aria-label="Worksheet options">
        <div className="ws-builder-controls">
          <label className="ws-field ws-cycle-field">
            <span>1. Choose your teaching cycle</span>
            <select value={cycleId} onChange={e => rememberCycle(e.target.value)}>
              {cycleOptions.map(opt => <option key={opt.id} value={opt.id}>{worksheetCycleLabel(opt)}</option>)}
            </select>
          </label>
          <label className="ws-field ws-pages-field">
            <span>2. Choose your pack length</span>
            <select value={pages} onChange={e => { setPages(Number(e.target.value)); setPreviewPage(0); }}>
              {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} page{n === 1 ? "" : "s"}{n === 6 ? " · Full progression" : ""}</option>)}
            </select>
          </label>
        </div>
        <div className="ws-studio-layout">
          <fieldset className="ws-activity-picker">
            <legend>3. Find their next activity</legend>
            <p>{availableTypes.length} activities for {worksheetCycleLabel(cycle)}.</p>
            <div className="ws-library-tools">
              <label className="ws-search-field"><span className="ws-sr-only">Find an activity</span><MagnifyingGlass size={20} aria-hidden="true"/>
                <input type="search" value={activityQuery} onChange={event => setActivityQuery(event.target.value)} placeholder="Search tracing, puzzles, matching…"/>
              </label>
              <div className="ws-category-filters" aria-label="Activity categories">
                {WORKSHEET_CATEGORIES.map(item => <button key={item.id} type="button" aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</button>)}
              </div>
            </div>
            {visibleActivityTypes.length ? <div className="ws-activity-grid" role="radiogroup" aria-label="Available printable activities">
              {visibleActivityTypes.map((item, index) => <button key={item.id} type="button" role="radio" aria-checked={effectiveType === item.id}
                tabIndex={effectiveType === item.id || (!visibleActivityTypes.some(t => t.id === effectiveType) && index === 0) ? 0 : -1}
                onKeyDown={event => handleActivityKey(event, index)} className={`ws-activity-card${effectiveType === item.id ? " is-selected" : ""}`} onClick={() => chooseType(item.id)}>
                <ActivityArtwork type={item.id} format={item.format}/>
                <div className="ws-card-copy"><span className="ws-activity-format">{item.format}</span><strong>{item.label}</strong><span>{item.blurb}</span></div>
                <span className="ws-card-check" aria-hidden="true">{effectiveType === item.id ? <Check size={15} weight="bold"/> : null}</span>
              </button>)}
            </div> : <div className="ws-library-empty" role="status"><strong>No matching activities</strong><span>Try another word or category.</span><button type="button" onClick={() => { setActivityQuery(""); setCategory("all"); }}>Show all activities</button></div>}
          </fieldset>
          <aside className="ws-preview" aria-label="Worksheet preview">
            <div className="ws-preview-heading"><div><span className="ws-eyebrow">Your printable pack</span><h2>{TYPE_LABEL[effectiveType]}</h2></div><span className="ws-paper-badge">A4</span></div>
            <p className="ws-preview-blurb">{effectiveTypeMeta?.blurb}</p>
            {effectiveType === "characterColouring" && <label className="ws-field ws-character-picker"><span>Start with your favourite Guide</span><select value={characterId} onChange={e => { setCharacterId(e.target.value); setPreviewPage(0); }}>{WORKSHEET_CHARACTER_ART.map(art => <option key={art.id} value={art.id}>{art.name}</option>)}</select></label>}
            <div className="ws-preview-pager" aria-label="Preview pages">
              <button type="button" aria-label="Previous preview page" disabled={currentPage === 0} onClick={() => setPreviewPage(currentPage - 1)}><ArrowLeft size={18}/></button>
              <span aria-live="polite">Page {currentPage + 1} of {pages} <b>{WORKSHEET_PAGE_STAGES[currentPage].label}</b></span>
              <button type="button" aria-label="Next preview page" disabled={currentPage >= pages - 1} onClick={() => setPreviewPage(currentPage + 1)}><ArrowRight size={18}/></button>
            </div>
            <div className="ws-paper-tray">{preview ? <WorksheetPreview html={preview.html} title={`${TYPE_LABEL[effectiveType]} · Page ${currentPage + 1}`}/> : <p role="alert">This preview could not be built. Choose another activity or cycle.</p>}</div>
            <div className="ws-pack-progress" aria-label="Pack progression">{WORKSHEET_PAGE_STAGES.slice(0, pages).map((stage, i) => <button key={stage.id} type="button" aria-label={`Preview page ${i + 1}: ${stage.label}`} aria-pressed={currentPage === i} onClick={() => setPreviewPage(i)}>{i + 1}</button>)}</div>
            <div className="ws-actions"><button type="button" className="ws-primary" onClick={() => handleGenerate()} disabled={!effectiveType}><Printer size={20}/>Open print preview</button><button type="button" className="ws-ghost" onClick={handleSave} disabled={!effectiveType || busy}><BookmarkSimple size={19}/>{busy ? "Saving…" : "Save to bank"}</button></div>
            <button type="button" className="ws-answer-link" onClick={() => handleGenerate(true)} disabled={!effectiveType}><FileText size={18}/>Print teacher answers separately</button>
            <p className="ws-print-hint">Print at 100% on A4, or choose “Save as PDF”.</p>
            {note && <p className="ws-note" role="status">{note}</p>}
          </aside>
        </div>
      </section>

      <section className="ws-bank" aria-label="Saved worksheets">
        <div className="ws-bank-heading"><div><span className="ws-eyebrow">Ready for another day</span><h2>Your worksheet bank</h2></div><span>{bankReadState.status === "complete" ? `${bank.length} saved` : "Saved activities"}</span></div>
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
          <p className="ws-empty">Keep a favourite for next time. Choose an activity above and save it to your bank.</p>
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

function ActivityArtwork({ type, format }) {
  return <span className={`ws-card-art ws-art-${format.toLowerCase()}`} aria-hidden="true">
    {type === "characterColouring" ? <img src="/images/worksheets/muddy-colouring.png" alt=""/> :
      type === "crossword" || type === "wordSearch" ? <span className="ws-mini-grid">{(type === "crossword" ? ["", "c", "", "c", "a", "t", "", "p", ""] : ["s", "u", "n", "a", "a", "o", "t", "m", "p"]).map((letter,i) => <i key={i}>{letter}</i>)}</span> :
      format === "Colour" ? <span className="ws-mini-outline">Aa</span> :
      format === "Cut" || format === "Fold" ? <span className="ws-mini-cards"><i>cat</i><i>cat</i><i>sun</i><i>sun</i></span> :
      format === "Game" ? <span className="ws-mini-die">⚄<small>read</small></span> :
      format === "Match" ? <span className="ws-mini-match">a → A<br/>m → M</span> :
      <span className="ws-mini-writing"><b>{type === "letterFormation" ? "Aa" : "cat"}</b><i/><i/></span>}
  </span>;
}
