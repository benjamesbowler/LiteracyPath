import { useEffect, useMemo, useRef, useState } from 'react';
import { TeacherPageHeader, TeacherPageShell } from './ui/TeacherPrimitives.jsx';
import { teacherCycleOptions } from './teacherCycleReference.js';
import { elSkillsBlockCycles } from '../../data/elSkillsBlockCycles.js';
import { buildCyclePracticePlan } from '../cycle-practice/cyclePracticeContent.js';
import { CycleActivityRenderer } from '../cycle-practice/CycleActivityRenderer.jsx';
import { resolveCyclePracticeAudio } from '../cycle-practice/cyclePracticeAudio.js';
import { playCueAudio, playCueSequence, stopCueAudio } from '../../utils/audio/cuePlayer.js';
import { loadLiteracyMockRuntimeBank, scoreLiteracyMockResponse } from '../../data/literacyMockRuntimeBank.js';
import { LiteracyMockQuestion } from '../progress/LiteracyMockQuestion.jsx';
import { LITERACY_DOMAINS } from '../../policy/literacyPracticePolicy.js';
import { LITERACY_MOCK_BAND_NAMES } from '../../policy/literacyMockAdaptivePolicy.js';
import { WHOLE_CLASS_CYCLE_ACTIVITIES, wholeClassMockAnswer, wholeClassMockPool, createWholeClassMockSession, advanceWholeClassMockSession, recordWholeClassMockAttempt } from './wholeClassPracticeModel.js';
import '../../styles/cycle-practice.css';
import '../../styles/literacy-mock.css';
import '../../styles/teacher-whole-class-practice.css';

const noop = () => {};
const newSeed = () => `class-practice:${globalThis.crypto?.randomUUID?.() || `${Date.now()}:${Math.random()}`}`;

function CycleClassQuestion({ round, onFeedback, showAnswer, onHideAnswer }) {
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [revision, setRevision] = useState(0);
  const [mediaRevision, setMediaRevision] = useState(0);
  const [mediaFailed, setMediaFailed] = useState(false);
  const [picturesReady, setPicturesReady] = useState(false);
  const [soundFailed, setSoundFailed] = useState(false);
  const [object, setObject] = useState(null);
  const space = useRef(null);
  const live = useRef(true);
  const model = object ? { ...round, ...object, targetWord: object.word } : round;
  const cue = resolveCyclePracticeAudio(model);
  const sourceKey = cue.sequence.join('|');
  function replay() {
    setSoundFailed(false);
    if (!cue.sequence.length) { setSoundFailed(true); return; }
    playCueSequence(cue.sequence, { gapMs: 90, playImmediately: true,
      onUnavailable: () => { if (live.current) setSoundFailed(true); } });
  }
  useEffect(() => {
    live.current = true;
    return () => { live.current = false; stopCueAudio(); };
  }, []);
  // A sorting activity introduces the next pictured word only when the teacher
  // continues. Reuse the current recorded instruction and exact target.
  useEffect(() => {
    const timer = setTimeout(replay, 0);
    return () => { clearTimeout(timer); stopCueAudio(); };
    // The exact cue sequence owns playback, not rerenders or feedback state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey]);
  function checkPictures() {
    const images = [...(space.current?.querySelectorAll('img') || [])];
    setPicturesReady(images.every(image => image.complete && image.naturalWidth > 0));
  }
  useEffect(() => {
    const frame = requestAnimationFrame(checkPictures);
    const timeout = setTimeout(() => {
      const images = [...(space.current?.querySelectorAll('img') || [])];
      if (images.some(image => !image.complete || !image.naturalWidth)) setMediaFailed(true);
    }, 15000);
    return () => { cancelAnimationFrame(frame); clearTimeout(timeout); };
  }, [mediaRevision, revision, object]);
  function commit(next) {
    setPending(true); setOutcome(next);
    onFeedback({ tone: next.correct ? 'correct' : 'incorrect', text: next.correct
      ? next.partial ? 'Correct! Keep sorting the pictures together.' : 'Correct! Say the answer together.'
      : 'Not yet. Look and listen, then try again.' });
    return true;
  }
  function retry() {
    if (outcome?.correct && outcome.partial) setPicturesReady(false);
    setPending(false); setOutcome(null); onFeedback(null); onHideAnswer();
    if (outcome?.correct && !outcome.partial || !['wordBuild', 'soundSort'].includes(round.mechanicId)) {
      setPicturesReady(false); setRevision(value => value + 1);
    }
  }
  const choice = model.choices?.find(choice => String(choice.value) === String(model.answer));
  const answer = `Choose ${choice?.label || (Array.isArray(model.answer) ? model.answer.join('') : model.answer)}.`;
  return <div className="whole-class-cycle cycle-practice-page">
    <div className="whole-class-instruction"><h3>{round.stationTitle}</h3><p data-child-instruction>{cue.instructionText}</p>
      <button type="button" onClick={replay}>Hear question</button></div>
    {soundFailed && <p role="status">Sound did not play. Try Hear question again, or read the instruction aloud.</p>}
    <div className="cycle-activity-space" ref={space} onLoadCapture={checkPictures}>
      <CycleActivityRenderer key={revision} round={round} disabled={pending || mediaFailed || !picturesReady}
        feedbackPending={pending} mediaRevision={mediaRevision} supportLevel={showAnswer ? 2 : 0}
        assessment={false} reducedMotion={true} onCommit={commit} onSubtarget={setObject}
        onHear={src => { if (src) void playCueAudio(src); }} onMediaFailure={() => setMediaFailed(true)}
        onInteraction={noop} onRetry={noop} onSupport={noop} onStep={noop}/>
    </div>
    {mediaFailed && <div role="alert">This question needs its picture. <button type="button" onClick={() => {
      setMediaFailed(false); setPicturesReady(false); setMediaRevision(value => value + 1);
    }}>Retry pictures</button></div>}
    {showAnswer && <p className="whole-class-answer" role="status">{round.mechanicId === 'letterTrace'
      ? `Follow the large ${round.targetGrapheme} letter together.`
      : round.mechanicId === 'wordBuild' ? `Build ${round.targetWord}.` : answer}</p>}
    {pending && !mediaFailed && <button type="button" className="lp-button" onClick={retry}>{outcome?.correct ? outcome.partial ? 'Continue activity' : 'Try this question again' : 'Try again'}</button>}
  </div>;
}

export default function TeacherWholeClassPractice({ kind, initialCycleId, onExit }) {
  const cycles = kind === 'cycles';
  const [cycleId, setCycleId] = useState(initialCycleId || 'cycle-1');
  const [activity, setActivity] = useState('all');
  const [area, setArea] = useState('all');
  const [band, setBand] = useState('adaptive');
  const [count, setCount] = useState('12');
  const [bank, setBank] = useState([]);
  const [load, setLoad] = useState(cycles ? 'ready' : 'loading');
  const [session, setSession] = useState(null);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stage = useRef(null);
  useEffect(() => {
    if (cycles) return;
    let active = true;
    loadLiteracyMockRuntimeBank({ mixed: true }).then(rows => {
      if (active) { setBank(rows); setLoad('ready'); }
    }).catch(() => { if (active) setLoad('failed'); });
    return () => { active = false; };
  }, [cycles]);
  useEffect(() => () => stopCueAudio(), []);
  useEffect(() => {
    const changed = () => setIsFullscreen(document.fullscreenElement === stage.current);
    document.addEventListener('fullscreenchange', changed);
    return () => document.removeEventListener('fullscreenchange', changed);
  }, []);
  const bands = useMemo(() => [...new Set(wholeClassMockPool(bank, area, 'all').map(item => item.adaptiveAreaBand))].sort((a,b) => a-b), [bank, area]);
  const item = session?.rounds[index];
  const total = session?.adaptive ? session.targetCount : session?.rounds.length;
  function start() {
    const seed = newSeed();
    if (cycles) {
      const rounds=buildCyclePracticePlan(elSkillsBlockCycles.find(cycle => cycle.id === cycleId), seed).rounds
        .filter(round => activity === 'all' || round.mechanicId === activity);
      setSession({seed,rounds:count === 'all' ? rounds : rounds.slice(0,Number(count))});
    } else setSession(createWholeClassMockSession(bank,{area,band,seed,count}));
    setIndex(0); setFeedback(null); setShowAnswer(false);
  }
  function move(offset) {
    stopCueAudio();
    if (offset > 0 && session?.adaptive && index === session.rounds.length - 1)
      setSession(current => advanceWholeClassMockSession(bank,current));
    setIndex(value => value + offset); setFeedback(null); setShowAnswer(false);
    requestAnimationFrame(() => stage.current?.querySelector('[data-practice-question-title]')?.focus());
  }
  function settings() { stopCueAudio(); setSession(null); setFeedback(null); setShowAnswer(false); }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen?.();
      else await stage.current?.requestFullscreen?.();
    } catch { /* The complete page remains usable if the browser declines fullscreen. */ }
  }
  return <TeacherPageShell intent="resources" product="whole-class-practice" className="whole-class-practice" ref={stage}>
    <TeacherPageHeader eyebrow="Teach · Whole class" title={`${cycles ? 'Cycles' : 'MAP Mock'} · Class practice`}
      description="Talk, choose and practise together. No student results are recorded.">
      <button type="button" className="lp-button" onClick={onExit}>Back to Teach</button>
      {isFullscreen && !item && <button type="button" className="lp-button" onClick={fullscreen}>Exit full screen</button>}
    </TeacherPageHeader>
    {!session ? <section className="whole-class-setup" aria-label="Class practice settings">
      {cycles ? <><label>Cycle<select value={cycleId} onChange={event => setCycleId(event.target.value)}>
        {teacherCycleOptions().map(cycle => <option key={cycle.id} value={cycle.id}>{cycle.label}</option>)}</select></label>
        <label>Activity<select value={activity} onChange={event => setActivity(event.target.value)}><option value="all">Mixed activities</option>
          {WHOLE_CLASS_CYCLE_ACTIVITIES.map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label></>
        : <><p>Original MAP-style questions. Choose what to practise; you control the pace.</p>
          <label>Area<select value={area} onChange={event => { setArea(event.target.value); setBand('adaptive'); }}>
            <option value="all">Mixed areas</option>{LITERACY_DOMAINS.map(domain => <option key={domain.id} value={domain.id}>{domain.label}</option>)}</select></label>
          <label>Practice step<select value={band} disabled={load !== 'ready'} onChange={event => setBand(event.target.value)}>
            <option value="adaptive">Start easy · adapt gradually</option>{bands.map(value => <option key={value} value={value}>{LITERACY_MOCK_BAND_NAMES[value]}</option>)}</select></label></>}
      <label>Questions<select value={count} onChange={event => setCount(event.target.value)}><option value="12">Up to 12 questions</option><option value="24">Up to 24 questions</option><option value="all">All available questions</option></select></label>
      {load === 'loading' && <p role="status">Loading practice questions…</p>}
      {load === 'failed' && <p role="alert">Questions could not load. Reload Teach, then open class practice again. <button type="button" onClick={() => window.location.reload()}>Reload Teach</button></p>}
      <button type="button" className="lp-button lp-button-primary" disabled={load !== 'ready'} onClick={start}>Start class practice</button>
    </section> : !item ? <section className="whole-class-empty" role="status"><p>{session.rounds.length ? 'End of these questions. Choose more practice when the class is ready.' : 'No questions are available for these settings. Choose another activity or practice step.'}</p>
      <button type="button" className="lp-button" onClick={settings}>Choose practice</button></section> : <>
      <div className="whole-class-controls"><h3 tabIndex={-1} data-practice-question-title>Practice question {index + 1} of {total}</h3>
        <button type="button" className="lp-button" onClick={settings}>Change practice</button>
        <button type="button" className="lp-button" aria-pressed={isFullscreen} onClick={fullscreen}>{isFullscreen ? 'Exit full screen' : 'Full screen'}</button></div>
      <div className="whole-class-question" key={`${session.seed}:${index}`}>
        {cycles ? <CycleClassQuestion round={item} onFeedback={setFeedback} showAnswer={showAnswer} onHideAnswer={() => setShowAnswer(false)}/>
          : <div className="literacy-mock"><div className="literacy-mock-canvas"><LiteracyMockQuestion item={item} seed={`${session.seed}:${index}`} index={index} total={total}
            studentName="Whole class" practice={true} onSubmit={answer => {
              if (answer.responseStatus !== 'answered') { move(1); return; }
              const correct = scoreLiteracyMockResponse(item, answer.selected);
              setSession(current => recordWholeClassMockAttempt(current,index,{correct}));
              setFeedback({ tone: correct ? 'correct' : 'incorrect', text: correct ? 'Correct! Explain how you know.' : 'Not yet. Talk about the clues, then try again.' });
            }}/></div></div>}
      </div>
      {feedback && <p className={`whole-class-feedback is-${feedback.tone}`} role="status">{feedback.tone === 'correct' ? '✓ ' : '↻ '}{feedback.text}</p>}
      {showAnswer && !cycles && <div className="whole-class-answer" role="status"><strong>{wholeClassMockAnswer(item)}</strong>{item.explanation && <p>{item.explanation}</p>}</div>}
      <nav className="whole-class-navigation" aria-label="Practice questions"><button type="button" className="lp-button" disabled={index === 0} onClick={() => move(-1)}>Previous question</button>
        <button type="button" className="lp-button" onClick={() => {
          if (!showAnswer && !cycles) setSession(current => recordWholeClassMockAttempt(current,index,{revealed:true}));
          setShowAnswer(value => !value);
        }}>{showAnswer ? 'Hide answer' : 'Show answer'}</button>
        <button type="button" className="lp-button lp-button-primary" onClick={() => move(1)}>Next question</button></nav>
    </>}
  </TeacherPageShell>;
}
