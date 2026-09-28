import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BENCHMARK_RUNNER_COPY as COPY } from "../../copy/benchmarkRunnerCopy.js";

import { alignWrittenForms } from "../../utils/assessmentSpellingComparison.js";

export function SpellingComparison({ target, written }) {
  if (!String(written || "").trim()) return null;
  const parts = alignWrittenForms(target, written);
  return <section className="el-benchmark-spelling-comparison" aria-label={COPY.compare}>
    {[{ key: "expected", label: COPY.target, text: target }, { key: "written", label: COPY.transcription, text: written }].map(row => <div key={row.key}>
      <span>{row.label}</span>
      <div className="el-benchmark-letter-comparison" aria-label={row.text}>
        {parts.map((part, index) => <span aria-hidden="true" className={`${part.differs ? "differs" : "matches"}${!part[row.key] ? " missing" : ""}`} key={index}>{part[row.key] || "–"}</span>)}
      </div>
    </div>)}
    <p>{COPY.comparisonHelp}</p>
  </section>;
}

export function ItemGuidance({ item }) {
  const scoring = item.scoringGuidance || {};
  const features = Array.isArray(item.featureGuidance) ? item.featureGuidance : [];
  if (!item.administrationNote && !Object.keys(scoring).length && !features.length) return null;
  const text = value => Array.isArray(value) ? value.join(" ") : value;
  return <details className="el-benchmark-item-guidance">
    <summary>{COPY.guidance}</summary>
    {item.administrationNote && <p>{item.administrationNote}</p>}
    {scoring.listenFor && <p>{text(scoring.listenFor)}</p>}
    {scoring.accept && <p><strong>{COPY.accept}: </strong>{text(scoring.accept)}</p>}
    {scoring.doNotAccept && <p><strong>{COPY.doNotAccept}: </strong>{text(scoring.doNotAccept)}</p>}
    {features.length > 0 && <ul>{features.map((feature, index) => <li key={feature.feature || index}><strong>{feature.label}: </strong>{feature.guidance}</li>)}</ul>}
  </details>;
}

export function ObservationField({ value, onChange }) {
  return <label className="el-benchmark-control el-benchmark-observation">
    <span>{COPY.observed}</span>
    <textarea rows="2" value={value || ""} onChange={event => onChange(event.target.value)} />
    <small>{COPY.observedHelp}</small>
  </label>;
}

export function PreparationGuide({ plan }) {
  const examples = plan.instructions?.practiceExamples || [];
  if (!examples.length) return null;
  return <details className="el-benchmark-preparation">
    <summary>{COPY.practice} <span>{COPY.unscored}</span></summary>
    <p>{COPY.practiceHelp}</p>
    <div className="el-benchmark-practice-examples">{examples.map((example, index) => <article key={index}>
      <p className="el-benchmark-practice-script">{example.teacherSay}</p>
      <p><strong>{COPY.practiceAnswer}: </strong>{example.expectedResponse}</p>
      <p>{example.explanation}</p>
    </article>)}</div>
  </details>;
}

export function StudentStimulus({ kind, item }) {
  const passage = typeof item.passage === "object" ? { ...item, ...item.passage } : item;
  if (kind === "decoding") return <main className="benchmark-student-reading"><p>{COPY.readingInstruction}</p><h1>{item.displayWord || item.targetWord || item.word}</h1></main>;
  if (kind === "fluency") return <main className="benchmark-student-passage" data-density={String(passage.text || passage.passage || "").length > 650 ? "long" : "standard"}><p className="benchmark-student-direction">{COPY.fluencyInstruction}</p><h1>{passage.title}</h1><p>{passage.text || passage.passage}</p></main>;
  return <main className="benchmark-student-listening"><span aria-hidden="true">{kind === "encoding" ? "✎" : "◌"}</span><h1>{kind === "encoding" ? COPY.spellingTitle : COPY.oralTitle}</h1><p>{kind === "encoding" ? COPY.spellingInstruction : COPY.oralInstruction}</p></main>;
}

const STUDENT_STYLE = `
@font-face {font-family:Andika;src:url('/fonts/present/andika-latin-400-normal.woff2') format('woff2');font-weight:400;font-display:swap}
*{box-sizing:border-box}body{margin:0;color:#213a32;background:#fffdf6;font-family:Andika,Arial,sans-serif}main{max-width:1040px;margin:auto;padding:clamp(24px,5vw,64px)}h1{font-weight:400} .benchmark-student-reading,.benchmark-student-listening{min-height:95vh;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center}.benchmark-student-reading h1{font-size:clamp(80px,15vw,200px);margin:32px 0;line-height:1.3;overflow-wrap:anywhere}.benchmark-student-reading p,.benchmark-student-listening p{font-size:24px}.benchmark-student-listening span{font-size:72px}.benchmark-student-listening h1{font-size:44px}.benchmark-student-passage h1{font-size:36px;margin:12px 0 28px}.benchmark-student-passage>p:not(.benchmark-student-direction){font-size:clamp(24px,3vw,34px);line-height:1.9;white-space:pre-line}.benchmark-student-direction{font:16px Arial,sans-serif;color:#56645b}.benchmark-student-passage[data-density=long]{padding:32px}.benchmark-student-passage[data-density=long]>p:not(.benchmark-student-direction){font-size:clamp(21px,2.4vw,27px);line-height:1.65}@media print{main{padding:12mm}.benchmark-student-direction{display:none}.benchmark-student-passage>p:not(.benchmark-student-direction){font-size:22pt;line-height:1.7}}`;

export function StudentDisplay({ kind, item, timing }) {
  const [display, setDisplay] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const displayRef = useRef(null);
  useEffect(() => () => { displayRef.current?.close(); }, []);
  useEffect(() => {
    if (!display) return undefined;
    const closed = () => { displayRef.current = null; setDisplay(null); };
    display.window.addEventListener("pagehide", closed);
    return () => {
      try { display.window.removeEventListener("pagehide", closed); } catch { /* The student window may have navigated away. */ }
    };
  }, [display]);
  const open = () => {
    if (displayRef.current && !displayRef.current.closed) { displayRef.current.focus(); return; }
    const next = window.open("", "_blank", "popup,width=1050,height=780");
    if (!next) { setBlocked(true); return; }
    next.document.title = `Literacy Guide · ${COPY.studentCopy}`;
    next.document.documentElement.lang = "en";
    const viewport = next.document.createElement("meta");
    viewport.name = "viewport"; viewport.content = "width=device-width, initial-scale=1";
    next.document.head.appendChild(viewport);
    const style = next.document.createElement("style");
    style.textContent = STUDENT_STYLE;
    next.document.head.appendChild(style);
    displayRef.current = next;
    setBlocked(false); setDisplay({ window: next, mount: next.document.body });
  };
  return <section className="el-benchmark-student-tools" aria-label={COPY.studentCopy}>
    <div><strong>{COPY.studentCopy}</strong>{display ? <p>{COPY.studentOpen}</p> : <details className="el-benchmark-tool-help"><summary>{COPY.displayHelp}</summary><p>{COPY.studentHelp}</p></details>}</div>
    <button className="el-benchmark-button secondary" disabled={timing} onClick={display ? () => { display.window.close(); displayRef.current = null; setDisplay(null); } : open} type="button">{display ? COPY.closeStudent : COPY.openStudent}</button>
    {blocked && <p role="alert">{COPY.studentBlocked}</p>}
    {display && !display.window.closed && createPortal(<StudentStimulus kind={kind} item={item} />, display.mount)}
  </section>;
}

export function ResponseReview({ rows, currentIndex, onSelect, navigationLocked }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const normalizedSearch = search.trim().toLowerCase();
  const visibleRows = rows.filter(row => (!normalizedSearch || `${row.title} ${row.answer} ${row.outcome}`.toLowerCase().includes(normalizedSearch)) && (filter === "all" || (filter === "recorded" && row.complete) || (filter === "unfinished" && !row.complete) || (filter === "unscorable" && row.unscorable)));
  return <section className="el-benchmark-response-review" aria-label={COPY.reviewResults}>
    <div className="el-benchmark-review-filters">
      <label className="el-benchmark-control"><span>{COPY.search}</span><input type="search" placeholder={COPY.searchPlaceholder} value={search} onChange={event => setSearch(event.target.value)} /></label>
      <label className="el-benchmark-control"><span>{COPY.filter}</span><select value={filter} onChange={event => setFilter(event.target.value)}>{["all", "recorded", "unfinished", "unscorable"].map(value => <option value={value} key={value}>{COPY[value]}</option>)}</select></label>
    </div>
    <ol className="el-benchmark-response-list">
      {visibleRows.map(row => <li key={row.index}><button aria-current={currentIndex === row.index ? "step" : undefined} disabled={navigationLocked || row.locked} title={row.lockReason || undefined} onClick={() => onSelect(row.index)} type="button"><span className="el-benchmark-review-number">{row.index + 1}</span><span><strong>{row.title}</strong><small>{row.answer || row.outcome}</small></span><span className={`el-benchmark-review-state ${row.complete ? "recorded" : ""}`}>{row.outcome}</span></button></li>)}
    </ol>
    {visibleRows.length === 0 && <p role="status">{COPY.noMatches}</p>}
  </section>;
}


export function PrintableStudentPassage({ passage }) {
  useEffect(() => {
    const prepare = () => document.body.classList.add("el-benchmark-printing");
    const finish = () => document.body.classList.remove("el-benchmark-printing");
    window.addEventListener("beforeprint", prepare);
    window.addEventListener("afterprint", finish);
    return () => {
      window.removeEventListener("beforeprint", prepare);
      window.removeEventListener("afterprint", finish);
      finish();
    };
  }, []);
  if (typeof document === "undefined") return null;
  return createPortal(<article className="el-benchmark-print-sheet" data-density={String(passage.text || passage.passage || "").length > 650 ? "long" : "standard"}><h1>{passage.title}</h1><p>{passage.text || passage.passage}</p></article>, document.body);
}


export function LegacyFormNotice({ formId }) {
  if (!["form-a-v2", "form-b-v1", "form-c-v1"].includes(formId)) return null;
  return <aside className="el-benchmark-legacy-notice" role="note"><strong>{COPY.legacyTitle}</strong><p>{COPY.legacyHelp}</p></aside>;
}
