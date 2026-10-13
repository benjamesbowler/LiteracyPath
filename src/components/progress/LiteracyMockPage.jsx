import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, SpeakerHigh, CheckCircle } from '@phosphor-icons/react';
import { loadLiteracyMockBank, LITERACY_MOCK_TUTORIAL_IDS, scoreLiteracyMockResponse } from '../../data/literacyMockBank.js';
import { getStudentLiteracyMockRun, saveStudentLiteracyMockRun, recordLiteracyMockEvent, literacyMockMutationReceiptContext, verifyLiteracyMockMutationReceipt } from '../../data/literacyMockSessionCore.js';
import { selectLiteracyMockPlan, selectLiteracyMockFreshCheck, adaptLiteracyMockPlan, replaceFailedLiteracyMockMedia, replaceInvalidLiteracyMockContent, sameLiteracyMockPlan } from '../../utils/literacyMockPlanner.js';
import { readAssessmentDraft, writeAssessmentDraft, removeAssessmentDraft } from '../../utils/assessmentDraftStorage.js';
import { LiteracyMockQuestion } from './LiteracyMockQuestion.jsx';
import { buildLiteracyExposureIndex, canonicalLiteracyIdentity, getLiteracyExposure, readLiteracyExposures, recordLiteracyExposures } from '../../utils/literacyEvidence.js';
import { useMockAudio } from '../../hooks/useMockAudio.js';
import { PROGRESS_CHECK_INSTRUCTIONS } from '../../data/progressCheckInstructions.js';
import { progressCheckAudioPath } from '../../utils/progressCheckAudio.js';
import { readLiteracyMockReadiness, recordLiteracyMockReadiness, selectLiteracyMockTutorials } from '../../utils/literacyMockReadiness.js';
import { LITERACY_MOCK_EVIDENCE_VERSIONS } from '../../policy/literacyMockVersions.js';
import { literacyItemQualityIssue } from '../../policy/literacyItemEligibility.js';
import '../../styles/literacy-mock.css';

function MockSoundCheck({ onReady, disabled }) {
  const [selected, setSelected] = useState(false);
  const cue = { path: progressCheckAudioPath(PROGRESS_CHECK_INSTRUCTIONS.circle) };
  const audio = useMockAudio([cue]);
  const ready = selected && audio.delivery[cue.path] === 'completed';
  return <section className="literacy-mock-welcome">
    <h2>Let’s try the buttons.</h2>
    <p data-child-instruction>Listen. Choose the circle, then tap Next.</p>
    <button type="button" className="literacy-mock-speaker" aria-label="Check my sound" onClick={() => audio.play()}><SpeakerHigh weight="fill" aria-hidden="true"/></button>
    <div className="literacy-mock-warmup" role="group" aria-label="Practice shapes" data-child-choices>
      <button type="button" aria-label="Circle" aria-pressed={selected} onClick={() => setSelected(true)}><span className="literacy-mock-circle"/></button>
      <button type="button" aria-label="Square" aria-pressed={false} onClick={() => setSelected(false)}><span className="literacy-mock-square"/></button>
    </div>
    <p data-child-progress>Button practice · not a test question</p>
    {Object.values(audio.delivery).includes('failed') && <p role="alert">The sound did not load. Ask your teacher, then try the speaker again.</p>}
    <button type="button" className="literacy-mock-next" data-child-primary disabled={!ready || disabled} onClick={onReady}>Next <ArrowRight aria-hidden="true"/></button>
  </section>;
}

const requestId = () => globalThis.crypto?.randomUUID?.() || `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
function readPending(key, studentId) { try { return JSON.parse(readAssessmentDraft(key, studentId) || 'null'); } catch { return null; } }
function containsWithdrawnRequest(request, answeredCount = 0) {
  return Boolean(literacyItemQualityIssue(request?.response || {})
    || request?.plan?.itemIds?.slice(answeredCount).some(id => literacyItemQualityIssue({ id })));
}

function OwnedLiteracyMockPage({ studentId, studentName, token, focusSession, client, onContentAvailabilityChange }) {
  const sessionId = focusSession?.id;
  const storageKey = `lp-mock-pending:${studentId}:${sessionId}`;
  const [bank, setBank] = useState(null);
  const [bankError, setBankError] = useState('');
  const [run, setRun] = useState(null);
  const [mock, setMock] = useState(focusSession?.mock || null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [pending, setPending] = useState(() => readPending(storageKey, studentId));
  const [ready, setReady] = useState(false);
  const [soundChecked, setSoundChecked] = useState(false);
  const [tutorialIndex, setTutorialIndex] = useState(0);
  const [serverExposures, setServerExposures] = useState([]);
  const [controlReadiness] = useState(() => readLiteracyMockReadiness(studentId));
  const [tutorialMessage, setTutorialMessage] = useState('');
  const [reminderId, setReminderId] = useState(null);
  const adaptRef = useRef(null);
  const [now, setNow] = useState(() => Date.now());
  const owner = useRef({ active: true, writing: false, pending: readPending(storageKey, studentId), run: null, mock: null, bank: null, clockOffset: 0, exposures: new Map() });
  const contentCallback = useRef(onContentAvailabilityChange);
  useEffect(() => { contentCallback.current = onContentAvailabilityChange; }, [onContentAvailabilityChange]);
  const [clockOffset, setClockOffset] = useState(0);
  const contentVersion = run?.contentVersion || mock?.content_version || focusSession?.content_version || 'literacy-mock-v1';
  const hasWithdrawnQuestions = Boolean(run?.plan?.itemIds?.slice(run.responses?.length || 0)
    .some(id => literacyItemQualityIssue({ id })));
  const reloadBank = useCallback(async () => {
    setBankError('');
    owner.current.loadingContentVersion = contentVersion;
    try {
      const items = await loadLiteracyMockBank({ contentVersion });
      if (!owner.current.active || owner.current.loadingContentVersion !== contentVersion) return;
      if (Object.values(LITERACY_MOCK_TUTORIAL_IDS).some(id => !items.some(item => item.id === id))) throw new Error('missing_practice_media');
      owner.current.bank = items; setBank(items); contentCallback.current?.(true);
    } catch {
      if (owner.current.active) { setBankError('Your questions did not load. Ask your teacher, then try again.'); contentCallback.current?.(false); }
    }
  }, [contentVersion]);
  const accept = useCallback(result => {
    if (!owner.current.active) return;
    const received = [...(result.exposures || []), ...(result.run?.responses || []), ...(result.run?.mediaFailures || []), ...(result.run?.presentations || [])];
    const ledger = owner.current.exposures;
    const previousSize = ledger.size;
    for (const value of received) {
      const identity = canonicalLiteracyIdentity(value);
      if (identity.itemId || identity.passageKey || identity.familyId) ledger.set(JSON.stringify(identity), {
        exposureItemId: identity.itemId, exposurePassageKey: identity.passageKey, exposureFamilyId: identity.familyId,
      });
    }
    if (ledger.size !== previousSize) setServerExposures([...ledger.values()]);
    recordLiteracyExposures(studentId, received);
    if (result.mock && (!owner.current.mock || result.mock.revision > owner.current.mock.revision
      || (result.mock.revision === owner.current.mock.revision && Date.parse(result.mock.server_now) >= Date.parse(owner.current.mock.server_now)))) {
      owner.current.mock = result.mock; setMock(result.mock);
      setClockOffset(Date.parse(result.mock.server_now) - Date.now());
    }
    if (result.run && (!owner.current.run || (result.run.revision >= owner.current.run.revision && (result.run.eventRevision || 0) >= (owner.current.run.eventRevision || 0)))) {
      owner.current.run = result.run; setRun(result.run); setReady(true);
    }
  }, [studentId]);
  const refresh = useCallback(async () => {
    if (owner.current.polling) return;
    const controller = new AbortController();
    owner.current.polling = controller;
    let timeout;
    try {
      const result = await Promise.race([
        getStudentLiteracyMockRun({ client, token, sessionId, signal: controller.signal }),
        new Promise((_, reject) => { timeout = setTimeout(() => { controller.abort(); reject(new Error('read_timeout')); }, 10000); })
      ]);
      if (!owner.current.active) return;
      if (!result?.ok) throw new Error(result?.error || 'unavailable');
      accept(result); setConnected(true); setLoading(false);
    } catch { if (owner.current.active) { setConnected(false); setLoading(false); } }
    finally { clearTimeout(timeout); if (owner.current.polling === controller) owner.current.polling = null; }
  }, [client, token, sessionId, accept]);
  useEffect(() => {
    const lifetime = owner.current; lifetime.active = true;
    queueMicrotask(() => void reloadBank());
    queueMicrotask(() => void refresh()); const interval = setInterval(() => { setNow(Date.now()); void refresh(); }, 2000);
    window.addEventListener('online', refresh);
    return () => { lifetime.active = false; lifetime.polling?.abort(); clearInterval(interval); window.removeEventListener('online', refresh); };
  }, [refresh, reloadBank]);

  async function mutate(mutation) {
    if (!owner.current.active || owner.current.writing) return;
    if (!mutation && containsWithdrawnRequest(owner.current.pending, owner.current.run?.responses?.length || 0)
      && !owner.current.mock?.capabilities?.contentQuarantineRepair) {
      setError('A question is being checked. Your saved answers are safe.');
      return;
    }
    owner.current.writing = true; setBusy(true); setError('');
    const request = mutation ? { ...mutation, receiptContext: literacyMockMutationReceiptContext(owner.current.run, contentVersion) } : owner.current.pending;
    owner.current.pending = request; setPending(request);
    // The request is scoped to the learner and assignment, contains no token,
    // and is replayed byte-for-byte after an uncertain network result.
    try { writeAssessmentDraft(storageKey, JSON.stringify(request), studentId); } catch { /* The server receipt remains the source of truth. */ }
    try {
      let saveTimeout;
      let result;
      try {
        result = await Promise.race([
          request.type === 'event' ? recordLiteracyMockEvent({ client, token, sessionId, ...request }) : saveStudentLiteracyMockRun({ client, token, sessionId, ...request }),
          new Promise((_, reject) => { saveTimeout = setTimeout(() => reject(new Error('save_timeout')), 10000); })
        ]);
      } finally { clearTimeout(saveTimeout); }
      if (!owner.current.active) return;
      if (result?.ok === false) {
        accept(result);
        adaptRef.current = null;
        owner.current.pending = null; setPending(null); try { removeAssessmentDraft(storageKey); } catch { /* no durable local entry */ }
        await refresh();
        setError(['assessment_finished', 'assessment_not_running'].includes(result?.error) ? '' : request.type === 'event'
          ? 'Your question status was not saved. Check with your teacher, then try again.'
          : request.response ? 'Your answer was not saved. Check with your teacher, then try again.'
            : 'Your questions could not be updated. Check with your teacher, then try again.');
        return;
      }
      verifyLiteracyMockMutationReceipt(result, request, { sessionId, studentId, contentVersion });
      accept(result);
      owner.current.pending = null; setPending(null); try { removeAssessmentDraft(storageKey); } catch { /* server receipt already verified */ }
      if (request.response && result.run?.plan?.seed) {
        try { removeAssessmentDraft(`lp-mock-selection:${result.run.plan.seed}:${request.response.questionId}`); } catch { /* receipt is authoritative */ }
      }
      setConnected(true);
    } catch {
      if (owner.current.active) { setConnected(false); setError('Your work is waiting to save. Reconnect, then tap Try again.'); }
    } finally {
      owner.current.writing = false;
      if (owner.current.active) setBusy(false);
    }
  }
  function retryRejected() {
    setError(''); adaptRef.current = null; void refresh();
  }
  async function register() {
    try {
      const options = { sessionId, studentId, itemCount: mock.item_count, exposures: [...owner.current.exposures.values(), ...readLiteracyExposures(studentId)] };
      const fresh = mock.plan_kind === 'fresh_check' ? selectLiteracyMockFreshCheck(bank, { ...options, focus: mock.focus, eligibleItemIds: mock.candidate_item_ids }) : null;
      if (fresh?.unavailable) throw new Error('fresh_items_unavailable');
      const plan = fresh?.plan || selectLiteracyMockPlan(bank, options);
      setReady(true);
      await mutate({ requestId: requestId(), expectedRevision: 0, plan, response: null });
    } catch { setBankError('There are not enough new questions for this check. Ask your teacher to choose a different check. Your saved answers are safe.'); }
  }
  async function submit(response) {
    const latest = owner.current.run;
    if (!latest || owner.current.pending || !connected || literacyItemQualityIssue(response)) return;
    await mutate({ requestId: requestId(), expectedRevision: latest.revision, plan: null, response });
  }
  function recordEvent(question, event) {
    if (!mock?.capabilities?.presentationReceipts) return;
    if (event === 'presented' && owner.current.run?.presentations?.some(value => value.questionId === question.id)) return;
    void mutate({ type: 'event', requestId: requestId(), questionId: question.id, event });
  }
  // Repair withdrawn content and unavailable media before adapting. Neither changes a saved
  // answer or advances the child; the server must accept the plan before display.
  let adaptivePlan = null;
  let mediaUnavailable = false;
  let contentUnavailable = false;
  if (bank && run && mock?.state === 'running' && run.status !== 'completed') {
    try {
      const repairBank = mock.plan_kind === 'fresh_check' ? bank.filter(candidate => mock.candidate_item_ids?.includes(candidate.id)) : bank;
      const exposures = [...serverExposures, ...readLiteracyExposures(studentId)];
      const contentReplacement = hasWithdrawnQuestions && !mock?.capabilities?.contentQuarantineRepair
        ? { plan: run.plan, unavailable: true }
        : replaceInvalidLiteracyMockContent(repairBank, run.plan, run.responses, run.mediaFailures || [], run.presentations || [], { exposures });
      contentUnavailable = contentReplacement.unavailable;
      if (!contentUnavailable) {
        const replacement = replaceFailedLiteracyMockMedia(repairBank, contentReplacement.plan, run.responses, run.mediaFailures || [], run.presentations || [], { exposures });
        mediaUnavailable = replacement.unavailable;
        // Persist a same-level content/media repair before evaluating later
        // assistance. Neither kind of invalid evidence changes task demand.
        const repairNeeded = !sameLiteracyMockPlan(replacement.plan, run.plan);
        if (!mediaUnavailable) adaptivePlan = mock.plan_kind === 'fresh_check' || repairNeeded ? replacement.plan : adaptLiteracyMockPlan(bank, run.plan, run.responses, run.mediaFailures || [], run.presentations || [], { resetUnsupported: run.presentationTracking === true, exposures });
      }
    } catch { if (hasWithdrawnQuestions) contentUnavailable = true; else mediaUnavailable = true; }
  }
  const adaptationNeeded = Boolean(adaptivePlan && !sameLiteracyMockPlan(adaptivePlan, run.plan));
  useEffect(() => {
    if (!adaptationNeeded || !connected || pending || busy || error || adaptRef.current === run.revision) return;
    adaptRef.current = run.revision;
    void mutate({ requestId: requestId(), expectedRevision: run.revision, plan: adaptivePlan, response: null });
  });
  const clockFinished = mock?.state === 'running' && Date.parse(mock.deadline_at) <= now + clockOffset;
  const finished = mock?.state === 'completed' || run?.status === 'completed';
  const itemIndex = run?.responses?.length || 0;
  const item = bank?.find(candidate => candidate.id === run?.plan?.itemIds?.[itemIndex]);
  const allTutorials = bank ? Object.values(LITERACY_MOCK_TUTORIAL_IDS).map(id => bank.find(candidate => candidate.id === id)).filter(Boolean) : [];
  const tutorials = bank ? selectLiteracyMockTutorials(bank, LITERACY_MOCK_TUTORIAL_IDS, mock, controlReadiness) : [];
  const reminder = reminderId && allTutorials.find(value => value.id === reminderId);
  const tutorial = reminder || (soundChecked && !run && !ready ? tutorials[tutorialIndex] : null);
  async function finishTutorial(response) {
    if (response.responseStatus !== 'answered') { setTutorialMessage('Ask your teacher to check the sound and pictures, then try again.'); return; }
    if (!scoreLiteracyMockResponse(tutorial, response.selected)) { setTutorialMessage('Look at the example above, then try the buttons again.'); return; }
    recordLiteracyMockReadiness(studentId, tutorial.format);
    try { removeAssessmentDraft(`lp-mock-selection:warmup:${sessionId}:${studentId}:${tutorial.id}`); } catch { /* unscored practice only */ }
    setTutorialMessage('');
    if (reminder) { setReminderId(null); return; }
    if (tutorialIndex + 1 === tutorials.length) await register();
    else setTutorialIndex(value => value + 1);
  }
  const stopped = mock?.state !== 'running' || finished || clockFinished || !connected;
  const withdrawnPendingRequest = containsWithdrawnRequest(pending, itemIndex);
  const contentReviewBlocked = hasWithdrawnQuestions && (contentUnavailable || mediaUnavailable || Boolean(error) || !adaptationNeeded)
    || withdrawnPendingRequest && !busy && !mock?.capabilities?.contentQuarantineRepair;
  const contentReviewState = <><h2>Ask your teacher.</h2><p role="alert" data-child-instruction>A question is being checked. Your saved answers are safe.</p><p data-child-progress>{itemIndex} questions finished</p><button type="button" className="literacy-mock-next" data-child-primary onClick={retryRejected}>Try again</button></>;
  let stateContent;
  if (bankError) stateContent = <><p role="alert" data-child-instruction>{bankError}</p><button type="button" className="literacy-mock-next" data-child-primary onClick={reloadBank}>Try again</button></>;
  else if (loading || !bank) stateContent = <p role="status">Getting your questions…</p>;
  else if (pending && contentReviewBlocked && !mock?.capabilities?.contentQuarantineRepair) stateContent = contentReviewState;
  else if (pending) stateContent = <><p data-child-instruction>{busy ? 'Saving your work…' : 'Your work is waiting to save.'}</p><button className="literacy-mock-next" type="button" disabled={busy} data-child-primary onClick={() => mutate()}>Try again</button></>;
  else if (!connected) stateContent = <><p data-child-instruction>Ask your teacher to check the connection.</p><button className="literacy-mock-next" type="button" data-child-primary onClick={refresh}>Try again</button></>;
  else if (finished) stateContent = <><CheckCircle size={64} aria-hidden="true"/><h2>All done. Thank you!</h2><p data-child-instruction>Your answers are saved. Wait for your teacher.</p><p data-child-progress>{itemIndex} questions finished</p></>;
  else if (clockFinished) stateContent = <><p data-child-instruction>Checking with your teacher…</p><p data-child-progress>{itemIndex} questions finished</p></>;
  else if (!run && !ready && !soundChecked) stateContent = <MockSoundCheck disabled={!mock || busy} onReady={() => { setSoundChecked(true); if (!tutorials.length) void register(); }}/>;
  else if (tutorial && !run) stateContent = null;
  else if (!run) stateContent = <><p data-child-instruction>Getting your questions ready.</p>{!busy && <button className="literacy-mock-next" type="button" data-child-primary onClick={register}>Try again</button>}</>;
  else if (mock?.state === 'prepared') stateContent = <><h2>You’re ready.</h2><p data-child-instruction>Wait for your teacher to start.</p><p data-child-progress>Sound and buttons checked</p></>;
  else if (mock?.state === 'paused') stateContent = <><h2>Time for a break.</h2><p data-child-instruction>Wait for your teacher to carry on.</p><p data-child-progress>{itemIndex} questions finished</p></>;
  else if (contentReviewBlocked) stateContent = contentReviewState;
  else if (mediaUnavailable) stateContent = <><h2>Ask your teacher.</h2><p role="alert" data-child-instruction>The pictures or sounds for these questions are not available. Your saved answers are safe.</p><p data-child-progress>{itemIndex} questions finished</p></>;
  else if (adaptationNeeded) stateContent = <p role="status">Getting the next question…</p>;
  else if (!item) stateContent = <p role="alert">This question needs an update. Ask your teacher to reload.</p>;
  return <main className="literacy-mock" data-child-surface="literacy-mock" aria-busy={loading || busy}>
    <div className="literacy-mock-canvas">
      <header className="literacy-mock-header"><h1 data-child-title>Mock MAP test</h1><span>Reading &amp; language</span></header>
      {error && !contentReviewBlocked && <div className="literacy-mock-error" role="alert">{error}{!pending && <button type="button" onClick={retryRejected}>Try again</button>}</div>}
      {stateContent ? <div className="literacy-mock-state">{stateContent}</div> : tutorial ? <LiteracyMockQuestion key={tutorial.id} item={tutorial} seed={`warmup:${sessionId}:${studentId}`} index={Math.max(0, tutorials.indexOf(tutorial))} total={reminder ? null : tutorials.length} studentName={studentName} studentId={studentId} disabled={busy} demonstration demonstrationMessage={tutorialMessage} onSubmit={finishTutorial}/>
        : <LiteracyMockQuestion key={item.id} item={item} seed={run.plan.seed} index={itemIndex} total={run.plan.itemIds.length} studentName={studentName} studentId={studentId} disabled={stopped || busy || Boolean(error)} exposure={run.presentations?.find(value => value.questionId === item.id) || getLiteracyExposure(item, buildLiteracyExposureIndex({ exposures: [...serverExposures, ...readLiteracyExposures(studentId)] }))} onPresented={() => { recordEvent(item, 'presented'); recordLiteracyExposures(studentId, [item]); }} onHelpRequest={mock?.capabilities?.supportResolution ? event => recordEvent(item, event) : undefined} helpRequest={run.helpRequests?.find(value => value.questionId === item.id)} helpPending={busy} legacyHelpEnabled={!LITERACY_MOCK_EVIDENCE_VERSIONS.includes(contentVersion)} onMechanicReminder={allTutorials.some(value => value.format === item.format) ? () => { setTutorialMessage(''); setReminderId(allTutorials.find(value => value.format === item.format).id); } : undefined} onSubmit={submit}/>}
    </div>
  </main>;
}

export function LiteracyMockPage(props) {
  return <OwnedLiteracyMockPage key={`${props.studentId}:${props.token}:${props.focusSession?.id}`} {...props}/>;
}
