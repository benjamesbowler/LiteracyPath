import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Books, CheckCircle, ChartBar, SpeakerHigh } from '@phosphor-icons/react';
import { StudentSkillsPracticePage } from '../StudentSkillsPracticePage.jsx';
import { LITERACY_DOMAINS, LITERACY_PRACTICE_ID, LITERACY_PRACTICE_VERSION } from '../../policy/literacyPracticePolicy.js';
import { LITERACY_PRACTICE_SKILLS, loadLiteracyPracticeBank, literacyPracticeExplanation, literacyPracticeAudioCues, literacyPracticeRequiredAudioCues, literacyPracticeTeachingCues, presentLiteracyPracticeQuestion } from '../../data/literacyPracticeBank.js';
import { selectLiteracyPracticeQuestions, adaptLiteracyPracticePlan } from '../../utils/literacyPracticePlanner.js';
import { buildLiteracyPracticeReport } from '../../utils/literacyPracticeReport.js';
import { LiteracyPracticeReport } from './LiteracyPracticeReport.jsx';
import { getProgressSyncState } from '../../utils/progressSync.js';
import { literacyPracticeAssignment, literacyPracticeOwner, decorateLiteracyPracticeSession, canResumeLiteracyPracticeSession, isCompletedLiteracyPracticeSession, completeLiteracyPracticeAssignment } from '../../utils/literacyPracticeAssignment.js';
import '../../styles/literacy-practice.css';

function LiteracyPracticeHome({ state, studentId, studentName, teacherView, assignedFocus, owner, completion, onDurableComplete, onIndependentCheck }) {
  const [chosenFocus, setFocus] = useState(state.resume?.skillId || 'all');
  const focus = assignedFocus || chosenFocus;
  const terminal = isCompletedLiteracyPracticeSession(state.session, owner) ? state.session : isCompletedLiteracyPracticeSession(state.resume, owner) ? state.resume : null;
  const resume = !terminal && state.resume?.skillId === focus ? state.resume : null;
  const finished = state.status === 'complete' || Boolean(terminal);
  const [showReport, setShowReport] = useState(false);
  const [sync, setSync] = useState(() => getProgressSyncState(studentId));
  useEffect(() => {
    const update = event => { if (event.detail?.studentId === studentId) setSync(event.detail); };
    window.addEventListener('lp-progress-sync-state', update);
    return () => window.removeEventListener('lp-progress-sync-state', update);
  }, [studentId]);
  useEffect(() => {
    if (assignedFocus && terminal) void onDurableComplete(terminal);
  }, [assignedFocus, terminal, onDurableComplete]);
  const report = useMemo(() => buildLiteracyPracticeReport({ practiceRecord: state.record }, { skills: LITERACY_PRACTICE_SKILLS }), [state.record]);
  const domain = LITERACY_DOMAINS.find(item => item.id === focus);
  const skill = LITERACY_PRACTICE_SKILLS.find(item => item.id === focus);
  const sessions = new Set((state.record.completions || []).filter(item => item.contentVersion === LITERACY_PRACTICE_VERSION).map(item => item.sessionId)).size;
  const loading = state.status === 'loading';
  return <main className="literacy-practice" data-child-surface="literacy-practice" aria-busy={loading}>
    <nav className="literacy-practice-topline" aria-label="Practice controls">
      {!assignedFocus && <button type="button" onClick={state.onExit}><ArrowLeft aria-hidden="true"/> Back</button>}
      <span><Books aria-hidden="true"/> Literacy explorer</span>
      {teacherView && <button type="button" aria-expanded={showReport} onClick={() => setShowReport(value => !value)}><ChartBar aria-hidden="true"/> Teacher report</button>}
    </nav>
    <section className="literacy-practice-hero">
      <div>
        <p className="literacy-practice-eyebrow">Listen · read · think · write</p>
        <h1 data-child-title>A little practice.<br/><em>A world to discover.</em></h1>
        <p data-child-instruction>{resume ? 'Your adventure is saved. Carry on when you are ready.' : assignedFocus ? 'Your teacher chose this adventure. Listen, think, and try your best.' : 'Choose an adventure. Listen, think, and try your best.'}</p>
        <div className="literacy-practice-launch">
          <button className="literacy-practice-primary" type="button" data-child-primary-action disabled={loading || Boolean(assignedFocus && terminal && completion.status !== 'complete')} onClick={resume && state.status !== 'error' ? state.onResume : () => state.onStart(focus)}>
            {loading ? 'Getting your questions…' : state.status === 'error' ? 'Try a fresh adventure' : resume ? 'Carry on' : finished ? 'Practise again' : focus === 'all' ? 'Start a mixed adventure' : `Start ${domain?.childLabel.toLowerCase() || skill?.label || 'practice'}`}<ArrowRight aria-hidden="true"/>
          </button>
          <span data-child-progress>{resume ? `${resume.index} ${resume.index === 1 ? 'turn' : 'turns'} finished` : focus === 'all' ? '12 turns · breaks whenever you need' : '6 turns · one area to explore'}</span>
        </div>
      </div>
      <div className="literacy-practice-hero-art" aria-hidden="true"><img src="/images/navigation/ui/books-icon.webp" alt=""/><span className="literacy-practice-art-label">One question.<br/>One new discovery.</span></div>
    </section>
    {finished && <div className="literacy-practice-complete" role="status"><CheckCircle aria-hidden="true"/><div><strong>You kept thinking and learning.</strong><p>{assignedFocus ? completion.status === 'complete' ? 'Your adventure is saved and your teacher knows you finished.' : 'Your adventure is saved on this device. We are sending your teacher the finished message.' : 'Your adventure is finished. You can explore again whenever you like.'}</p></div></div>}
    {completion.status === 'error' && <div className="literacy-practice-notice" role="alert"><p>Your finished adventure is kept on this device. Reconnect, then try sending it to your teacher again.</p><button type="button" onClick={() => onDurableComplete(terminal)}>Send finished practice</button></div>}
    {state.message && <p className="literacy-practice-notice" role={state.status === 'error' ? 'alert' : 'status'}>{state.message}</p>}
    {sync && !['saved', 'recovered', 'idle'].includes(sync.status) && completion.status !== 'complete' && <p className="literacy-practice-save" role="status">Your device keeps your practice. {['deferred', 'storage-failed', 'session-required'].includes(sync.status) ? 'Sharing it with your teacher needs a connection.' : 'Your teacher’s copy is updating.'}</p>}
    {!assignedFocus && <>
      <div className="literacy-practice-section-heading"><div><h2>What will you explore?</h2><p>Every area is open. A mixed adventure visits them all over time.</p></div><button type="button" aria-pressed={focus === 'all'} onClick={() => setFocus('all')}>Mix all areas</button></div>
      <div className="literacy-practice-domains" data-child-choices role="group" aria-label="Literacy areas">
        {LITERACY_DOMAINS.map(item => <button key={item.id} type="button" aria-pressed={focus === item.id} onClick={() => setFocus(item.id)}><img src={item.image} alt=""/><strong>{item.childLabel}</strong><span>{LITERACY_PRACTICE_SKILLS.filter(row => row.domainId === item.id).length} skills to explore</span><ArrowRight aria-hidden="true"/></button>)}
      </div>
      <details className="literacy-practice-skill-picker"><summary>Choose a particular skill</summary><label>Practice skill<select aria-label="Practice skill" value={skill ? focus : ''} onChange={event => { if (event.target.value) setFocus(event.target.value); }}><option value="">Choose a skill</option>{LITERACY_DOMAINS.map(item => <optgroup label={item.label} key={item.id}>{LITERACY_PRACTICE_SKILLS.filter(row => row.domainId === item.id).map(row => <option value={row.id} key={row.id}>{row.label}</option>)}</optgroup>)}</select></label></details>
    </>}
    <div className="literacy-practice-footnote"><SpeakerHigh aria-hidden="true"/><p>Listen again whenever you need. “Show me” gives you an example, then a fresh question.</p><span>{sessions ? `${sessions} ${sessions === 1 ? 'adventure' : 'adventures'} started` : 'Your first adventure starts here'}</span></div>
    {teacherView && showReport && <LiteracyPracticeReport report={report} studentName={studentName} onPractise={id => { setShowReport(false); state.onStart(id); }}/>}
    {teacherView && onIndependentCheck && <details className="literacy-practice-teacher-details"><summary>Independent check and earlier evidence</summary><p>Open the earlier six-task check for a neutral first-answer snapshot. MAP preparation above includes teaching and broader literacy practice.</p><button type="button" onClick={onIndependentCheck}>Open independent check</button></details>}
  </main>;
}
function OwnedLiteracyPracticePage({ studentId, studentName, client = null, token = '', focusSession, assignment, onExit, onIndependentCheck, onContentAvailabilityChange }) {
  const assignedFocus = assignment?.focusId || '';
  const owner = useMemo(() => literacyPracticeOwner(studentId, assignment), [studentId, assignment]);
  const lifecycle = useRef({ active: true, pending: null, terminal: null, completed: false });
  const [completion, setCompletion] = useState({ status: focusSession?.member_status === 'completed' ? 'complete' : 'idle' });
  useLayoutEffect(() => { const current = lifecycle.current; current.active = true; return () => { current.active = false; }; }, []);
  const onDurableComplete = useCallback(async session => {
    if (!assignment || !token || !session || !lifecycle.current.active) return;
    lifecycle.current.terminal = session;
    if (lifecycle.current.completed || focusSession?.member_status === 'completed') { setCompletion({ status: 'complete' }); return; }
    if (lifecycle.current.pending) return lifecycle.current.pending;
    setCompletion({ status: 'saving' });
    const pending = completeLiteracyPracticeAssignment({ client, token, owner, session, isCurrent: () => lifecycle.current.active })
      .then(result => {
        if (lifecycle.current.active && result.ok) { lifecycle.current.completed = true; setCompletion({ status: 'complete' }); }
        return result;
      }).catch(() => { if (lifecycle.current.active) setCompletion({ status: 'error' }); return { ok: false }; })
      .finally(() => { if (lifecycle.current.pending === pending) lifecycle.current.pending = null; });
    lifecycle.current.pending = pending;
    return pending;
  }, [assignment, token, client, owner, lifecycle, focusSession?.member_status]);
  useEffect(() => {
    const retry = () => { if (lifecycle.current.terminal) void onDurableComplete(lifecycle.current.terminal); };
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [lifecycle, onDurableComplete]);
  useEffect(() => {
    if (token && !assignment) onContentAvailabilityChange?.(false);
  }, [token, assignment, onContentAvailabilityChange]);
  const program = useMemo(() => ({ id: LITERACY_PRACTICE_ID, title: 'Literacy explorer', skills: LITERACY_PRACTICE_SKILLS,
    sessionKey: `${studentId}:${assignment?.assignmentId || 'free'}:${assignedFocus || 'free'}:${LITERACY_PRACTICE_VERSION}`,
    decorateSession: session => decorateLiteracyPracticeSession(session, owner),
    canResume: session => canResumeLiteracyPracticeSession(session, owner),
    retainCompletedSession: Boolean(assignment), onDurableComplete,
    loadBank: async () => {
      try { const bank = (await loadLiteracyPracticeBank()).map(presentLiteracyPracticeQuestion); if (lifecycle.current.active) onContentAvailabilityChange?.(true); return bank; }
      catch (error) { if (lifecycle.current.active) onContentAvailabilityChange?.(false); throw error; }
    },
    selectQuestions: (bank, options) => selectLiteracyPracticeQuestions(bank, { ...options, ...(assignedFocus ? { focus: assignedFocus } : {}) }), adaptPlan: adaptLiteracyPracticePlan,
    explain: literacyPracticeExplanation, audioCues: literacyPracticeAudioCues, requiredAudioCues: literacyPracticeRequiredAudioCues, teachingCues: literacyPracticeTeachingCues, presentQuestion: presentLiteracyPracticeQuestion,
    decorateEvent: event => event.learningEpisode ? event : { ...event, gameId: LITERACY_PRACTICE_ID, contentVersion: LITERACY_PRACTICE_VERSION },
    renderHome: state => <LiteracyPracticeHome state={state} studentId={studentId} studentName={studentName} teacherView={!token} assignedFocus={assignedFocus} owner={owner} completion={completion} onDurableComplete={onDurableComplete} onIndependentCheck={onIndependentCheck}/>
  }), [studentId, studentName, token, assignment, assignedFocus, owner, lifecycle, completion, onDurableComplete, onContentAvailabilityChange, onIndependentCheck]);
  if (token && !assignment) return <main className="literacy-practice" role="alert"><h1>Your practice needs an update</h1><p>Ask your teacher to start a new literacy adventure.</p></main>;
  return <StudentSkillsPracticePage program={program} progressScopeKey={studentId} studentName={studentName} onExit={onExit}/>;
}

export function LiteracyPracticePage(props) {
  const { studentId, token = '', focusSession } = props;
  const candidate = token ? literacyPracticeAssignment(focusSession) : null;
  const assignmentId = candidate?.assignmentId || '';
  const trackId = candidate?.focusId || '';
  const version = focusSession?.content_version || '';
  const assignment = useMemo(() => assignmentId ? { assignmentId, focusId: trackId } : null, [assignmentId, trackId]);
  return <OwnedLiteracyPracticePage key={`${studentId}:${token}:${assignment?.assignmentId || 'free'}:${assignment?.focusId || ''}:${version}`} {...props} assignment={assignment}/>;
}
