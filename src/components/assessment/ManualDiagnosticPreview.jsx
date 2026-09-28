import { useRef, useState } from "react";
import { letterAssessmentOrder } from "../../appState/assessmentRuntime.js";
import { advancedPhonicsPatterns } from "../../data/advancedPhonicsPatterns.js";
import { MANUAL_DIAGNOSTIC_VERSION, nextDiagnosticItemIndex, upsertDiagnosticEntry } from "../../utils/manualDiagnosticEvidence.js";
import { ManualDiagnosticAssessment } from "./ManualDiagnosticAssessment.jsx";

/** Synthetic local fixture: exercises the production runner without a hosted write. */
export function ManualDiagnosticPreview({ kind = "letter", params }) {
  const key = `manual-diagnostic-preview:${kind}`;
  const [initial] = useState(() => {
    if (params.get("resume") === "1") {
      try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { /* Use a clean fixture. */ }
    }
    return {};
  });
  const [index, setIndex] = useState(initial.index || 0);
  const [entries, setEntries] = useState(initial.entries || []);
  const [saved, setSaved] = useState(false);
  const saveAttempts = useRef(0);
  const items = kind === "letter"
    ? letterAssessmentOrder.map(display => ({ display, type: display === display.toUpperCase() ? "uppercase" : "lowercase" }))
    : advancedPhonicsPatterns.map((item, position) => ({ ...item, formIndex: 0, exampleWord: item.examples[position % item.examples.length] }));

  function update(first, second, responseEvidence, advance = false) {
    const item = items[index];
    const entry = {
      ...item, recorded: Boolean(first && second), responseEvidence,
      diagnosticVersion: MANUAL_DIAGNOSTIC_VERSION, formVersion: "preview-manual-v2",
      ...(kind === "letter"
        ? { letter: item.display, nameOutcome: first, soundOutcome: second, knowsName: first === "correct", knowsSound: second === "correct" }
        : { soundOutcome: first, wordOutcome: second, soundCorrect: first === "correct", wordCorrect: second === "correct" })
    };
    const next = upsertDiagnosticEntry(entries, index, entry);
    const nextIndex = advance ? nextDiagnosticItemIndex(next, items, kind, index) : index;
    setEntries(next);
    setIndex(nextIndex);
    localStorage.setItem(key, JSON.stringify({ entries: next, index: nextIndex }));
    return true;
  }

  async function save(first, second, evidence, exit = false) {
    saveAttempts.current += 1;
    if (params.get("save") === "fail-once" && saveAttempts.current === 1) return false;
    update(first, second, evidence, !exit);
    if (exit || index === items.length - 1) setSaved(true);
    return true;
  }
  const navigate = next => {
    setIndex(next);
    localStorage.setItem(key, JSON.stringify({ entries, index: next }));
  };
  return <>
    {saved && <p role="status" data-testid="manual-preview-saved">Saved assessment responses</p>}
    <ManualDiagnosticAssessment kind={kind} studentName="Aarav" index={index} items={items} entries={entries}
      onSave={(first, second, evidence) => save(first, second, evidence)}
      onExit={(first, second, evidence) => save(first, second, evidence, true)}
      onDraft={update} onNavigate={navigate} onPrevious={() => navigate(Math.max(0, index - 1))}
      onRestart={() => { setEntries([]); setIndex(0); localStorage.removeItem(key); }} onReturn={() => setSaved(true)} />
  </>;
}
