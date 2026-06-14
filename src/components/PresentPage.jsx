import { useMemo, useState } from "react";
import {
  presentationCycleOptions,
  getPresentationCycle,
  openCyclePresentation
} from "../utils/present/presentationBuilder.js";
import "../styles/worksheets.css";

export function PresentPage() {
  const cycleOptions = useMemo(() => presentationCycleOptions(), []);
  const [cycleId, setCycleId] = useState(cycleOptions[0]?.id || "");
  const [note, setNote] = useState("");

  const cycle = useMemo(() => getPresentationCycle(cycleId), [cycleId]);
  const isFluency = (cycle?.cycleNumber || 0) >= 25;

  function handlePresent() {
    setNote("");
    const ok = openCyclePresentation(cycleId);
    if (!ok) setNote("Please allow pop-ups for this site so the presentation can open.");
  }

  return (
    <div className="ws-page">
      <header className="ws-page-head">
        <h1>Present a cycle</h1>
        <p>A full-screen slideshow for the projector — letter sounds, writing, sight words, sound games and the poem. Pick a cycle and press Present. Use the arrow keys (or the on-screen arrows) to move through it; press <b>F</b> for full screen and <b>Esc</b> to leave.</p>
      </header>

      <section className="ws-builder" aria-label="Presentation options">
        <label className="ws-field" style={{ gridColumn: "1 / -1" }}>
          <span>Cycle</span>
          <select value={cycleId} onChange={e => setCycleId(e.target.value)}>
            {cycleOptions.map(opt => (
              <option key={opt.id} value={opt.id}>Cycle {opt.cycleNumber} — {opt.title}</option>
            ))}
          </select>
        </label>

        <p className="ws-blurb">
          {isFluency
            ? "This is a fluency cycle (25–27): the deck covers sight words, pattern power, word chains and the poem — no new letters."
            : "The deck covers each focus letter's sound + writing, the cycle's sight words, sound games (change / take away / join words) and the poem."}
        </p>

        <div className="ws-actions">
          <button type="button" className="ws-primary" onClick={handlePresent}>
            ▶ Present (opens full screen)
          </button>
        </div>
        {note && <p className="ws-note" role="status">{note}</p>}
      </section>
    </div>
  );
}
