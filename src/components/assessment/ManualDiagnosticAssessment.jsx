import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TeacherDialog } from "../teacher/ui/TeacherDialog.jsx";
import { TeacherPageShell, TeacherPageHeader } from "../teacher/ui/TeacherPrimitives.jsx";
import { MANUAL_DIAGNOSTIC_COPY as COPY } from "../../copy/manualDiagnosticCopy.js";
import { diagnosticDraft, diagnosticObservationIssue, isDiagnosticEntryComplete, summarizeDiagnostic } from "../../utils/manualDiagnosticEvidence.js";
import "../../styles/manual-diagnostic.css";

function taskLabels(kind) {
  return kind === "letter" ? { name: COPY.letterName, sound: COPY.letterSound } : { sound: COPY.patternSound, word: COPY.patternWord };
}

function PupilStimulus({ stimulus, prompt, onClose }) {
  useEffect(() => {
    const root = document.getElementById("root");
    const previousInert = root?.inert;
    const previousHidden = root?.getAttribute("aria-hidden");
    if (root) { root.inert = true; root.setAttribute("aria-hidden", "true"); }
    return () => {
      if (!root) return;
      root.inert = previousInert;
      if (previousHidden === null) root.removeAttribute("aria-hidden");
      else root.setAttribute("aria-hidden", previousHidden);
    };
  }, []);
  return createPortal(
    <TeacherDialog className="md-pupil" label={COPY.pupilDialog} onClose={onClose}>
      <p>{prompt}</p>
      <div className="md-pupil-glyph">{stimulus}</div>
      <button type="button" className="md-pupil-close" onClick={onClose}>{COPY.pupilClose}</button>
    </TeacherDialog>,
    document.body
  );
}

function DiagnosticSummary({ kind, items, entries, onRestart, onReturn }) {
  const labels = taskLabels(kind);
  const profile = summarizeDiagnostic(entries, items, kind);
  return <TeacherPageShell className="md-page md-complete" product="manual-diagnostic" intent="assessments">
    <TeacherPageHeader eyebrow={kind === "letter" ? COPY.letterTitle : COPY.patternTitle} title={COPY.complete} description={COPY.completionNote} />
    <section className="md-summary-grid" aria-label={COPY.profile}>
      {Object.entries(profile.totals).map(([task, totals]) => <article key={task}>
        <h3>{labels[task]}</h3>
        <strong>{COPY.score(totals.correct, totals.scored)}</strong><p>{COPY.correct} · {COPY.scored.toLowerCase()}</p>
        <dl><div><dt>{COPY.noResponse}</dt><dd>{totals.no_response}</dd></div><div><dt>{COPY.unscorable}</dt><dd>{totals.not_scorable}</dd></div><div><dt>{COPY.missing}</dt><dd>{totals.not_administered}</dd></div></dl>
      </article>)}
    </section>
    <section className="md-profile-groups" aria-label={COPY.profile}>
      {Object.entries(profile.groups).map(([group, scores]) => <div key={group}><h3>{COPY[group] || group}</h3>{Object.entries(scores).map(([task, score]) => <p key={task}><span>{labels[task]}</span><strong>{COPY.score(score.correct, score.scored)}</strong></p>)}</div>)}
    </section>
    <section className="md-next-teaching"><h3>{COPY.nextTeaching}</h3><p>{profile.review.length ? COPY.needsPractice : COPY.noErrors}</p>{profile.review.length > 0 && <p className="md-targets">{[...new Set(profile.review.map(row => row.target))].join(" · ")}</p>}</section>
    <section className="md-evidence"><h3>{COPY.reviewEvidence}</h3><p>{COPY.savedEvidenceHint}</p>
      <div className="md-evidence-list">{items.map((item, index) => <article key={item.display || item.pattern}>
        <strong className="md-review-target">{item.display || item.pattern}</strong>
        {Object.entries(diagnosticDraft(entries[index], kind)).map(([task, response]) => <div key={task}><strong>{labels[task]} · {COPY.outcomes.find(option => option.value === response.outcome)?.label || COPY.missing}</strong><p>{response.responseText || (response.outcome === "correct" ? COPY.observedCorrect : COPY.notTranscribed)}</p>{response.notes && <p>{response.notes}</p>}{response.selfCorrected && <small>{COPY.selfCorrected}</small>}{response.errorTags.length > 0 && <small>{response.errorTags.map(tag => COPY.errorLabels[tag]).join(" · ")}</small>}</div>)}
      </article>)}</div>
    </section>
    <div className="md-summary-actions"><button type="button" className="md-secondary" onClick={onRestart}>{COPY.restart}</button>{onReturn && <button type="button" className="md-primary" onClick={onReturn}>{COPY.return}</button>}</div>
  </TeacherPageShell>;
}

function DiagnosticResponseControls({ kind, task, label, observation, saving, errorTags, detailsOpen, onDetailsChange, onChange, onChoose, firstButtonRef }) {
  return <section className="md-task-response" aria-label={label}>
    <h3>{label}</h3>
    {kind === "letter" && <p className="md-response-prompt">{task === "name" ? COPY.namePrompt : COPY.soundPrompt}</p>}
    <div className="md-outcomes md-quick-outcomes" role="group" aria-label={label}>
      {COPY.outcomes.slice(0, 2).map((choice, position) => <button ref={position === 0 ? firstButtonRef : undefined} key={choice.value} type="button" aria-pressed={observation.outcome === choice.value} disabled={saving} className={"md-outcome md-outcome-" + choice.value} onClick={() => onChoose(choice.value)}><span aria-hidden="true">{position === 0 ? "✓" : "×"}</span>{kind === "letter" ? position === 0 ? COPY.knows : COPY.doesNotKnow : choice.label}</button>)}
    </div>
    <details className="md-optional-detail" open={detailsOpen} onToggle={event => onDetailsChange(event.currentTarget.open)}>
      <summary>{COPY.moreOptions}</summary>
      <div className="md-outcomes md-other-outcomes" role="group" aria-label={label + " · " + COPY.moreOptions}>{COPY.outcomes.slice(2).map(choice => <button key={choice.value} type="button" aria-pressed={observation.outcome === choice.value} disabled={saving} className={"md-outcome md-outcome-" + choice.value} onClick={() => onChange({ outcome: choice.value, outcomeRecordedAt: new Date().toISOString() })}>{choice.label}</button>)}</div>
      <label className="md-field"><span>{COPY.actual}</span><input value={observation.responseText} disabled={saving} onChange={event => onChange({ responseText: event.target.value })} placeholder={COPY.actualPlaceholder} maxLength={600} /><small>{COPY.optionalActual}</small></label>
      <label className="md-checkbox"><input type="checkbox" checked={observation.selfCorrected} disabled={saving} onChange={event => onChange({ selfCorrected: event.target.checked })}/><span>{COPY.selfCorrected}</span></label>
      <details className="md-error-details"><summary>{COPY.errorTypes}</summary><div>{errorTags.map(tag => <label className="md-checkbox" key={tag}><input type="checkbox" disabled={saving} checked={observation.errorTags.includes(tag)} onChange={event => onChange({ errorTags: event.target.checked ? [...observation.errorTags, tag] : observation.errorTags.filter(value => value !== tag) })}/><span>{COPY.errorLabels[tag]}</span></label>)}</div></details>
      <label className="md-field"><span>{COPY.notes}</span><textarea value={observation.notes} disabled={saving} onChange={event => onChange({ notes: event.target.value })} placeholder={COPY.notePlaceholder} rows={2} maxLength={1000}/></label>
    </details>
  </section>;
}

function DiagnosticRunner({ kind, studentName, index, items, entries, onSave, onExit, onPrevious, onNavigate, onDraft }) {
  const tasks = kind === "letter" ? ["name", "sound"] : ["sound", "word"];
  const initial = diagnosticDraft(entries[index], kind);
  const [draft, setDraft] = useState(initial);
  const [taskIndex, setTaskIndex] = useState(initial[tasks[0]].outcome && !initial[tasks[1]].outcome ? 1 : 0);
  const [studentView, setStudentView] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(() => Object.fromEntries(tasks.map(name => [name, Boolean(
    initial[name].responseText || initial[name].notes || initial[name].selfCorrected || initial[name].errorTags.length || ["no_response", "not_scorable", "not_administered"].includes(initial[name].outcome)
  )])));
  const firstButtonRef = useRef(null);
  const saveInFlight = useRef(false);
  const task = tasks[taskIndex];
  const observation = draft[task];
  const item = items[index];
  const labels = taskLabels(kind);
  const stimulus = kind === "letter" ? item.display : task === "word" ? item.exampleWord : item.pattern.replaceAll("_", "—");
  const prompt = kind === "letter" ? task === "name" ? COPY.namePrompt : COPY.soundPrompt : task === "word" ? COPY.wordPrompt : item.soundPrompt;
  const guidance = task === "word" ? COPY.wordGuide : kind === "pattern" ? item.soundGuidance : task === "name" ? COPY.nameGuide : COPY.soundGuide;
  const completedCount = entries.filter(entry => isDiagnosticEntryComplete(entry, kind)).length;
  const reviewCount = entries.length + (entries.length === 0 || isDiagnosticEntryComplete(entries.at(-1), kind) ? 1 : 0);
  const errorTags = kind === "letter" ? ["letter_confusion", "name_for_sound", "sound_for_name"] : ["vowel", "consonant", "omission", "addition", "substitution", "blending", "word_guess"];

  useEffect(() => {
    if (index > 0 && kind === "letter") firstButtonRef.current?.focus();
  }, [index, kind]);

  function argumentsFor(next = draft) {
    return [next[tasks[0]].outcome, next[tasks[1]].outcome, Object.fromEntries(tasks.map(name => [name, next[name]]))];
  }

  function updateObservation(patch, name = task) {
    const previous = draft[name];
    const nextObservation = { ...previous, ...patch };
    if (["no_response", "not_administered"].includes(patch.outcome)) {
      nextObservation.responseText = "";
      nextObservation.selfCorrected = false;
      nextObservation.errorTags = [];
    } else if (patch.responseText?.trim() && ["no_response", "not_administered"].includes(previous.outcome)) {
      nextObservation.outcome = "";
    }
    const next = { ...draft, [name]: nextObservation };
    setDraft(next);
    setError("");
    onDraft?.(...argumentsFor(next));
    return next;
  }

  async function save(exit = false, next = draft) {
    if (saveInFlight.current) return;
    const invalidTask = tasks.find(name => next[name].outcome ? diagnosticObservationIssue(next[name].outcome, next[name]) : !exit);
    if (invalidTask) {
      setError(diagnosticObservationIssue(next[invalidTask].outcome, next[invalidTask]));
      if (next[invalidTask].outcome === "not_scorable") setDetailsOpen(previous => ({ ...previous, [invalidTask]: true }));
      return;
    }
    setSaving(true);
    saveInFlight.current = true;
    setError("");
    try {
      const saved = await (exit ? onExit : onSave)(...argumentsFor(next));
      if (saved === false) setError(COPY.saveError);
    } catch {
      setError(COPY.saveError);
    } finally {
      setSaving(false);
      saveInFlight.current = false;
    }
  }

  function chooseOutcome(name, outcome) {
    const next = updateObservation({ outcome, outcomeRecordedAt: new Date().toISOString() }, name);
    if (kind === "letter" && index < items.length - 1 && !Object.values(detailsOpen).some(Boolean) && tasks.every(target => !diagnosticObservationIssue(next[target].outcome, next[target]))) void save(false, next);
  }

  function responseControls(name, focusFirst = false) {
    return <DiagnosticResponseControls key={name} kind={kind} task={name} label={labels[name]} observation={draft[name]} saving={saving} errorTags={errorTags} detailsOpen={Boolean(detailsOpen[name])} onDetailsChange={open => setDetailsOpen(previous => ({ ...previous, [name]: open }))} onChange={patch => updateObservation(patch, name)} onChoose={outcome => chooseOutcome(name, outcome)} firstButtonRef={focusFirst ? firstButtonRef : undefined}/>;
  }

  async function navigate(target) {
    setError("");
    if (onNavigate) {
      setSaving(true);
      try { if (await onNavigate(target) === false) setError(COPY.saveError); } catch { setError(COPY.saveError); } finally { setSaving(false); }
    } else if (target === index - 1) onPrevious?.();
  }

  return <>
    <TeacherPageShell className={"md-page" + (kind === "letter" ? " md-paired-letter" : "")} product="manual-diagnostic" intent="assessments" data-assessment-kind={kind}>
      <TeacherPageHeader eyebrow={COPY.teacherView + " · " + (studentName || COPY.unnamed)} title={kind === "letter" ? COPY.letterTitle : COPY.patternTitle} description={kind === "letter" ? COPY.letterDescription : COPY.patternDescription}>
        <button type="button" className="md-secondary" disabled={saving} onClick={() => save(true)}>{saving ? COPY.saving : COPY.saveExit}</button>
      </TeacherPageHeader>
      <div className="md-progress"><strong>{COPY.stage(index + 1, items.length)}</strong><span>{COPY.saved(completedCount, items.length)}</span><progress value={completedCount} max={items.length} aria-label={COPY.saved(completedCount, items.length)} /></div>
      <div className="md-workspace">
        <section className="md-stimulus-panel" aria-label={COPY.instruction}>
          {kind !== "letter" && <div className="md-task-tabs" role="group" aria-label={COPY.taskStep(taskIndex + 1, tasks.length)}>{tasks.map((name, position) => <button type="button" key={name} aria-pressed={task === name} disabled={saving || (position === 1 && Boolean(diagnosticObservationIssue(draft[tasks[0]].outcome, draft[tasks[0]])))} onClick={() => { setTaskIndex(position); setError(""); }}><span>{position + 1}</span>{labels[name]}{draft[name].outcome && <span aria-label={COPY.recorded}>✓</span>}</button>)}</div>}
          <div className="md-stimulus">{kind !== "letter" && <p>{prompt}</p>}<div className={"md-glyph" + (kind === "pattern" && task === "word" ? " md-word" : "")}>{stimulus}</div><button type="button" className="md-secondary" onClick={() => setStudentView(true)}>{COPY.pupilView}</button></div>
          {kind !== "letter" && <details className="md-guidance"><summary>{COPY.scoringGuide}</summary><p>{guidance}</p>{task === "sound" && <p>{item.administrationNote}</p>}<p>{COPY.supportNote}</p></details>}
        </section>
        <section className="md-record-panel" aria-label={COPY.mark}>
          {kind === "letter" ? <div className="md-paired-responses">{tasks.map((name, position) => responseControls(name, position === 0))}</div> : <><div className="md-record-heading"><p>{COPY.taskStep(taskIndex + 1, tasks.length)}</p></div>{responseControls(task)}</>}
          {error && <p className="md-error" role="alert">{error}</p>}
          <div className="md-navigation"><button type="button" className="md-secondary" disabled={index === 0 || saving} onClick={() => navigate(index - 1)}>{COPY.previous}</button>{kind !== "letter" && taskIndex === 0 ? <button type="button" className="md-primary" disabled={saving} onClick={() => { const issue=diagnosticObservationIssue(observation.outcome, observation); if(issue) setError(issue); else {setTaskIndex(1);setError("");} }}>{COPY.nextTask(labels[tasks[1]])}</button> : <button type="button" className="md-primary" disabled={saving} onClick={() => save()}>{saving ? COPY.saving : index === items.length - 1 ? COPY.finish : COPY.nextItem}</button>}</div>
        </section>
      </div>
      {kind === "letter" && <details className="md-guidance"><summary>{COPY.scoringGuide}</summary><p>{COPY.nameGuide}</p><p>{COPY.soundGuide}</p><p>{COPY.soundVariants}</p><p>{COPY.supportNote}</p></details>}
      <details className="md-review"><summary>{COPY.review}</summary><p>{COPY.reviewHint}</p><div>{items.slice(0, Math.min(reviewCount, items.length)).map((target, position) => <button type="button" key={target.display || target.pattern} aria-current={index === position ? "step" : undefined} disabled={saving} onClick={() => navigate(position)}><strong>{target.display || target.pattern}</strong><span>{isDiagnosticEntryComplete(entries[position],kind) ? COPY.recorded : COPY.pending}</span></button>)}</div>{completedCount === items.length && <button type="button" className="md-secondary" disabled={saving} onClick={() => navigate(items.length)}>{COPY.reviewResults}</button>}</details>
      <p className="md-draft-note">{COPY.draftNote}</p>
    </TeacherPageShell>
    {studentView && <PupilStimulus stimulus={stimulus} prompt={kind === "letter" ? COPY.pairedPrompt : prompt} onClose={() => setStudentView(false)}/>}
  </>;
}

export function ManualDiagnosticAssessment(props) {
  if (props.index >= props.items.length) return <DiagnosticSummary {...props}/>;
  return <DiagnosticRunner key={props.kind + ":" + props.index} {...props}/>;
}
