import { useEffect, useMemo, useState } from "react";
import {
  WORKSHEET_TYPES,
  worksheetCycleOptions,
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
import "../styles/worksheets.css";

const TYPE_LABEL = Object.fromEntries(WORKSHEET_TYPES.map(t => [t.id, t.label]));

export function WorksheetGeneratorPage() {
  const cycleOptions = useMemo(() => worksheetCycleOptions(), []);
  const [cycleId, setCycleId] = useState(cycleOptions[0]?.id || "");
  const [type, setType] = useState("");
  const [pages, setPages] = useState(2);
  const [bank, setBank] = useState([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const cycle = useMemo(() => getWorksheetCycle(cycleId), [cycleId]);
  const availableTypes = useMemo(() => availableWorksheetTypes(cycle), [cycle]);

  // Derived during render so a cycle change can't leave an invalid type
  // selected (no reset-in-effect needed).
  const effectiveType = availableTypes.includes(type) ? type : (availableTypes[0] || "");

  async function refreshBank() {
    const { rows } = await listWorksheetRecipes();
    setBank(rows);
  }

  // Load the saved bank once on mount.
  useEffect(() => {
    let alive = true;
    (async () => {
      const { rows } = await listWorksheetRecipes();
      if (alive) setBank(rows);
    })();
    return () => { alive = false; };
  }, []);

  const recipe = { cycleId, type: effectiveType, pages };

  function handleGenerate() {
    try {
      const ok = printWorksheet(recipe);
      if (!ok) setNote("Please allow pop-ups for this site so the worksheet can open.");
    } catch (error) {
      setNote(error.message || "Could not generate that worksheet.");
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
        await refreshBank();
        setNote("Saved to your worksheet bank.");
      }
    } catch (error) {
      setNote(error.message || "Could not save that worksheet.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    await deleteWorksheetRecipe(id);
    await refreshBank();
  }

  return (
    <div className="ws-page">
      <header className="ws-page-head">
        <h1>Worksheet generator</h1>
        <p>Build printable worksheets straight from a cycle's curriculum. Choose a cycle, a worksheet type and how many pages, then download a PDF.</p>
      </header>

      <section className="ws-builder" aria-label="Worksheet options">
        <label className="ws-field">
          <span>Cycle</span>
          <select value={cycleId} onChange={e => setCycleId(e.target.value)}>
            {cycleOptions.map(opt => (
              <option key={opt.id} value={opt.id}>Cycle {opt.cycleNumber} — {opt.title}</option>
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

        <div className="ws-actions">
          <button type="button" className="ws-primary" onClick={handleGenerate} disabled={!effectiveType}>
            Generate &amp; download PDF
          </button>
          <button type="button" className="ws-ghost" onClick={handleSave} disabled={!effectiveType || busy}>
            Save to bank
          </button>
        </div>
        {note && <p className="ws-note" role="status">{note}</p>}
      </section>

      <section className="ws-bank" aria-label="Saved worksheets">
        <h2>Your worksheet bank</h2>
        {bank.length === 0 ? (
          <p className="ws-empty">No saved worksheets yet. Build one above and press “Save to bank”.</p>
        ) : (
          <ul className="ws-bank-list">
            {bank.map(item => (
              <li key={item.id}>
                <div className="ws-bank-info">
                  <strong>{item.title || `Cycle ${item.cycle_id}`}</strong>
                  <span>{item.pages} page{item.pages === 1 ? "" : "s"}</span>
                </div>
                <div className="ws-bank-actions">
                  <button type="button" className="ws-ghost" onClick={() => printWorksheet({ cycleId: item.cycle_id, type: item.type, pages: item.pages })}>
                    Download
                  </button>
                  <button type="button" className="ws-danger" onClick={() => handleDelete(item.id)} aria-label={`Delete ${item.title}`}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
