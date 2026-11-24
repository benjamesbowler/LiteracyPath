import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { LITERACY_MOCK_SHORT_ITEM_COUNTS } from '../../policy/literacyMockQuestionLimit.js';
import { LITERACY_MOCK_ADAPTIVE_VERSION } from '../../policy/literacyMockVersions.js';
import { TeacherPageHeader, TeacherPageShell } from './ui/TeacherPrimitives.jsx';
import { teacherCycleOptions } from './teacherCycleReference.js';
import { elSkillsBlockCycles } from '../../data/elSkillsBlockCycles.js';
import { buildCyclePracticePlan } from '../cycle-practice/cyclePracticeContent.js';
import { CycleActivityRenderer } from '../cycle-practice/CycleActivityRenderer.jsx';
import { resolveCyclePracticeAudio } from '../cycle-practice/cyclePracticeAudio.js';
import { playCueAudio, playCueSequence, stopCueAudio } from '../../utils/audio/cuePlayer.js';
import { loadLiteracyMockRuntimeBank } from '../../data/literacyMockRuntimeBank.js';
import { getLiteracyMockV14Availability } from '../../data/literacyMockSessionCore.js';
import { getMockAudioElement, primeMockAudioElement } from '../../utils/mockAudioElement.js';
import { LiteracyMockHeader } from '../progress/LiteracyMockHeader.jsx';
import { LiteracyMockQuestion } from '../progress/LiteracyMockQuestion.jsx';
import { WHOLE_CLASS_CYCLE_ACTIVITIES, createWholeClassMockSession, submitWholeClassMockAnswer } from './wholeClassPracticeModel.js';
import '../../styles/cycle-practice.css';
import '../../styles/literacy-mock.css';
import '../../styles/teacher-whole-class-practice.css';

const noop = () => {};
const newSeed = () => `class-practice:${globalThis.crypto?.randomUUID?.() || `${Date.now()}:${Math.random()}`}`;

function ClassTestScreen({ children }) {
  const dialog = useRef(null);
  useEffect(() => {
    const node = dialog.current;
    node.showModal();
    node.querySelector('.literacy-mock-question')?.focus({ preventScroll:true });
    return () => node.close();
  }, []);
  return createPortal(<dialog className="literacy-mock-class-screen" aria-label="Class assessment" ref={dialog}
    onCancel={event => event.preventDefault()}>{children}</dialog>, document.body);
}

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

export default function TeacherWholeClassPractice({ kind, initialCycleId, client, onExit }) {
  const cycles = kind === 'cycles';
  const [cycleId, setCycleId] = useState(initialCycleId || 'cycle-1');
  const [activity, setActivity] = useState('all');
  const [count, setCount] = useState(kind === 'cycles' ? '12' : '25');
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
    const controller = new AbortController();
    async function loadBank() {
      const ready = !client || await getLiteracyMockV14Availability({ client, signal: controller.signal });
      if (!ready) throw new Error('Adaptive question catalogue unavailable');
      return loadLiteracyMockRuntimeBank({ contentVersion: LITERACY_MOCK_ADAPTIVE_VERSION, mixed: true });
    }
    loadBank().then(rows => {
      if (active) { setBank(rows); setLoad('ready'); }
    }).catch(() => { if (active) setLoad('failed'); });
    return () => { active = false; controller.abort(); };
  }, [client, cycles]);
  useEffect(() => () => stopCueAudio(), []);
  useEffect(() => {
    const changed = () => setIsFullscreen(document.fullscreenElement === stage.current);
    document.addEventListener('fullscreenchange', changed);
    return () => document.removeEventListener('fullscreenchange', changed);
  }, []);
  const item = session?.rounds[index];
  const total = session?.rounds.length;
  function start() {
    const seed = newSeed();
    if (cycles) {
      const rounds=buildCyclePracticePlan(elSkillsBlockCycles.find(cycle => cycle.id === cycleId), seed).rounds
        .filter(round => activity === 'all' || round.mechanicId === activity);
      setSession({seed,rounds:count === 'all' ? rounds : rounds.slice(0,Number(count))});
    } else {
      try {
        primeMockAudioElement(getMockAudioElement(noop));
        setSession(createWholeClassMockSession(bank, { sessionId: globalThis.crypto?.randomUUID?.() || seed, itemCount: Number(count) }));
      } catch (error) {
        setFeedback({ tone: 'incorrect', text: error.message });
        return;
      }
    }
    setIndex(0); setFeedback(null); setShowAnswer(false);
  }
  function move(offset) {
    stopCueAudio();
    setIndex(value => value + offset); setFeedback(null); setShowAnswer(false);
    requestAnimationFrame(() => stage.current?.querySelector('[data-practice-question-title]')?.focus());
  }
  function handleMockAnswer(answer) {
    try {
      const next = submitWholeClassMockAnswer(session, item, answer);
      setSession(next);
      setIndex(next.run.responses.length);
      setFeedback(null);
    } catch (error) {
      setFeedback({ tone: 'incorrect', text: error.message });
    }
  }
  function settings() { stopCueAudio(); setSession(null); setFeedback(null); setShowAnswer(false); }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen?.();
      else await stage.current?.requestFullscreen?.();
    } catch { /* The complete page remains usable if the browser declines fullscreen. */ }
  }
  if (!cycles && item) return <ClassTestScreen><main className="literacy-mock" data-child-surface="literacy-mock" ref={stage}>
    <div className="literacy-mock-canvas">
      <LiteracyMockHeader onEnd={settings}/>
      {feedback && <p role="alert">{feedback.text}</p>}
      <LiteracyMockQuestion key={item.id} item={item} seed={session.seed} index={index} total={total}
        studentName="Whole class" persistDraft={false} onSubmit={handleMockAnswer}/>
    </div>
  </main></ClassTestScreen>;
  return <TeacherPageShell intent="resources" product="whole-class-practice" className="whole-class-practice" ref={stage}>
    <TeacherPageHeader eyebrow="Teach · Whole class" title={cycles ? 'Cycles · Class practice' : 'Mock MAP · Class test'}
      description={cycles ? "Talk, choose and practise together. No student results are recorded." : "Display the pupil assessment on one screen and enter the class’s agreed answer."}>
      <button type="button" className="lp-button" onClick={onExit}>Back to Teach</button>
      {isFullscreen && !item && <button type="button" className="lp-button" onClick={fullscreen}>Exit full screen</button>}
    </TeacherPageHeader>
    {!session ? <section className="whole-class-setup" aria-label="Class practice settings">
      {cycles ? <><label>Cycle<select value={cycleId} onChange={event => setCycleId(event.target.value)}>
        {teacherCycleOptions().map(cycle => <option key={cycle.id} value={cycle.id}>{cycle.label}</option>)}</select></label>
        <label>Activity<select value={activity} onChange={event => setActivity(event.target.value)}><option value="all">Mixed activities</option>
          {WHOLE_CLASS_CYCLE_ACTIVITIES.map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label></>
        : <p>Start the same eight-area adaptive test used on pupil devices. Each area begins at Starter.</p>}
      <label>Questions<select value={count} onChange={event => setCount(event.target.value)}>{(cycles ? [12,24] : LITERACY_MOCK_SHORT_ITEM_COUNTS).map(value => <option key={value} value={value}>{cycles ? '' : 'Up to '}{value} questions</option>)}{cycles && <option value="all">All available questions</option>}</select></label>
      {feedback && <p role="alert">{feedback.text}</p>}
      {load === 'loading' && <p role="status">Loading practice questions…</p>}
      {load === 'failed' && <p role="alert">Questions could not load. Reload Teach, then open class practice again. <button type="button" onClick={() => window.location.reload()}>Reload Teach</button></p>}
      <button type="button" className="lp-button lp-button-primary" disabled={load !== 'ready'} onClick={start}>{cycles ? 'Start class practice' : 'Start class test'}</button>
    </section> : !item ? <section className="whole-class-empty" role="status"><p>{cycles ? 'End of these questions.' : 'Class test finished.'}</p>
      <button type="button" className="lp-button" onClick={settings}>{cycles ? 'Choose practice' : 'Test settings'}</button></section> : <>
      <div className="whole-class-controls"><h3 tabIndex={-1} data-practice-question-title>Practice question {index + 1} of {total}</h3>
        <button type="button" className="lp-button" onClick={settings}>Change practice</button>
        <button type="button" className="lp-button" aria-pressed={isFullscreen} onClick={fullscreen}>{isFullscreen ? 'Exit full screen' : 'Full screen'}</button></div>
      <div className="whole-class-question" key={`${session.seed}:${index}`}>
        <CycleClassQuestion round={item} onFeedback={setFeedback} showAnswer={showAnswer} onHideAnswer={() => setShowAnswer(false)}/>
      </div>
      {feedback && <p className={`whole-class-feedback is-${feedback.tone}`} role="status">{feedback.tone === 'correct' ? '✓ ' : '↻ '}{feedback.text}</p>}
      <nav className="whole-class-navigation" aria-label="Practice questions"><button type="button" className="lp-button" disabled={index === 0} onClick={() => move(-1)}>Previous question</button>
        <button type="button" className="lp-button" onClick={() => setShowAnswer(value => !value)}>{showAnswer ? 'Hide answer' : 'Show answer'}</button>
        <button type="button" className="lp-button lp-button-primary" onClick={() => move(1)}>Next question</button></nav>
    </>}
  </TeacherPageShell>;
}
