import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowCounterClockwise, SpeakerHigh, Hand } from '@phosphor-icons/react';
import { mockChoices } from '../../utils/literacyMockPlanner.js';
import { useMockAudio } from '../../hooks/useMockAudio.js';
import { mockResponseValue, mockResponseComplete, mockConstructionLength } from '../../utils/literacyMockResponse.js';
import { LiteracyMockImage } from './LiteracyMockImage.jsx';
import { readAssessmentDraft, writeAssessmentDraft } from '../../utils/assessmentDraftStorage.js';
import { AssessmentTextFeature } from '../assessment/AssessmentTextFeature.jsx';
import { MOCK_RUNTIME_INSTRUCTION_AUDIO } from '../../data/generated/literacyMockRuntimeAudio.generated.js';
import { LiteracyMockPassage } from './LiteracyMockPassage.jsx';

export function LiteracyMockQuestion({ item, seed, index, total, studentName, studentId, disabled = false, onSubmit, demonstration = false, demonstrationMessage = '', exposure = {}, onPresented, onHelpRequest, helpRequest, helpPending = false, onMechanicReminder, legacyHelpEnabled = false, blockPendingHelp = false, resolveMedia }) {
  const choices = useMemo(() => mockChoices(item, seed), [item, seed]);
  const showPassage = Boolean(item.passage && item.displayPassageDuringResponse && item.format !== 'select_text');
  const readingInstructionPath = item.modality === 'reading' && item.passage && item.displayPassageDuringResponse
    ? MOCK_RUNTIME_INSTRUCTION_AUDIO.readPassage : null;
  const audioCues = useMemo(() => [
    ...(readingInstructionPath !== null ? [{ role: 'layout_instruction', path: readingInstructionPath }] : []),
    ...item.requiredAudioCues.filter(cue => cue.role !== 'choice'),
    ...choices.flatMap(choice => item.requiredAudioCues.filter(cue => cue.role === 'choice' && (cue.choiceId === choice.id || (!cue.choiceId && cue.path === choice.audioPath))))
  ], [item, choices, readingInstructionPath]);
  const draftKey = `lp-mock-selection:${seed}:${item.id}`;
  const [draft] = useState(() => {
    try {
      const value = JSON.parse(readAssessmentDraft(draftKey, studentId) || 'null');
      if (Array.isArray(value?.selection) && value.selection.every(id => !id || item.choices.some(choice => choice.id === id))) return value;
    } catch { /* A missing draft starts a fresh uncommitted answer. */ }
    return { selection: [], knownFamiliar: exposure.knownFamiliar ?? null };
  });
  const [knownFamiliar] = useState(draft.knownFamiliar ?? null);
  const [recordPresentation] = useState(() => onPresented);
  useEffect(() => { recordPresentation?.(); }, [recordPresentation]);
  const [selection, setSelection] = useState(draft.selection);
  // Preserve any already-recorded legacy help flag. V3 assistance is resolved
  // by the teacher and overlaid by the server, never inferred from a request.
  const [legacySupportUsed, setLegacySupportUsed] = useState(draft.supportUsed === true);
  const [picked, setPicked] = useState('');
  const [images, setImages] = useState({});
  const [startedAt] = useState(() => Date.now());
  const audio = useMockAudio(audioCues, !disabled, resolveMedia);
  const play = audio.play;
  useEffect(() => { const timer = setTimeout(() => void play(), 0); return () => clearTimeout(timer); }, [play]);
  useEffect(() => {
    try { writeAssessmentDraft(draftKey, JSON.stringify({ selection, knownFamiliar, supportUsed: legacySupportUsed }), studentId); } catch { /* The answer is not committed until Next. */ }
  }, [draftKey, selection, knownFamiliar, legacySupportUsed, studentId]);
  const constructionLength = useMemo(() => mockConstructionLength(item), [item]);
  const instructionFailed = readingInstructionPath !== null && audio.delivery[readingInstructionPath] === 'failed';
  const mediaFailed = item.requiredAudioPaths.some(path => audio.delivery[path] === 'failed') || Object.values(images).includes('failed');
  const ready = item.requiredAudioPaths.every(path => audio.delivery[path] === 'completed')
    && (readingInstructionPath === null || audio.delivery[readingInstructionPath] === 'completed')
    && item.requiredImagePaths.every(path => images[path] === 'completed');
  const picture = (src, alt, role = 'choice') => <LiteracyMockImage src={src} mediaSource={resolveMedia?.(src)} alt={alt || ''} role={role} onLoad={() => setImages(value => ({ ...value, [src]: 'completed' }))} onError={() => setImages(value => ({ ...value, [src]: 'failed' }))}/>;
  function choose(id) {
    if (disabled) return;
    if (item.format === 'multi_select') setSelection(value => value.includes(id) ? value.filter(x => x !== id) : value.length < item.selectCount ? [...value, id] : value);
    else if (item.format === 'match') setPicked(value => value === id ? '' : id);
    else if (['order', 'build_word'].includes(item.format)) setSelection(value => value.includes(id) ? value.filter(x => x !== id) : value.length < constructionLength ? [...value, id] : value);
    else setSelection([id]);
  }
  function place(slot, id = picked) {
    if (!id || disabled) return;
    setSelection(previous => {
      const next = Array.from({ length: item.matchTargets.length }, (_, i) => previous[i] === id ? '' : previous[i] || '');
      next[slot] = id; return next;
    }); setPicked('');
  }
  function drop(event, slot) {
    if (disabled) return;
    event.preventDefault(); const id = event.dataTransfer.getData('text/plain');
    if (!choices.some(choice => choice.id === id)) return;
    if (item.format === 'match') place(slot, id);
    else setSelection(value => { const next = value.filter(x => x !== id); if (next.length >= constructionLength) return value; next.splice(slot, 0, id); return next; });
  }
  function submit(responseStatus = 'answered') {
    if (disabled || blockPendingHelp && helpRequest?.status === 'pending' || (responseStatus === 'answered' && (!ready || mediaFailed || !mockResponseComplete(item, selection)))) return;
    audio.stop();
    onSubmit({ questionId: item.id, selected: responseStatus === 'answered' ? mockResponseValue(item, selection) : null,
      responseStatus, audioDelivery: Object.fromEntries(Object.entries(audio.delivery).filter(([path]) => path !== readingInstructionPath || item.requiredAudioPaths.includes(path))), supportUsed: legacySupportUsed, responseTimeMs: Math.min(7200000, Date.now() - startedAt), knownFamiliar,
      ...(responseStatus === 'media_failed' ? { failedMediaPaths: [...new Set([
        ...Object.keys(audio.delivery).filter(path => item.requiredAudioPaths.includes(path) && audio.delivery[path] === 'failed'),
        ...Object.keys(images).filter(path => images[path] === 'failed')
      ])] } : {}) });
  }
  const choiceButton = (choice, number) => <div className={`literacy-mock-option${audio.activePath && audio.activePath === choice.audioPath ? ' is-speaking' : ''}`} key={choice.id}>
    <button type="button" className={`literacy-mock-choice${choice.image ? ' has-picture' : item.hideWrittenLabels ? ' is-spoken-choice' : ''}`} aria-label={item.hideWrittenLabels ? `Answer ${number + 1}` : undefined}
      aria-pressed={selection.includes(choice.id) || picked === choice.id} disabled={disabled}
      draggable={['match', 'order', 'build_word'].includes(item.format)} onDragStart={event => event.dataTransfer.setData('text/plain', choice.id)}
      onClick={() => choose(choice.id)}>
      {choice.image && picture(choice.image, choice.imageAlt)}
      {!item.hideWrittenLabels && <span>{choice.label}</span>}
      {item.hideWrittenLabels && <span className="literacy-mock-answer-number">{number + 1}</span>}
      {item.hideWrittenLabels && !choice.image && <span className="literacy-mock-spoken-label" aria-hidden="true">Spoken answer</span>}
    </button>
    {choice.audioPath && <button className="literacy-mock-choice-audio" type="button" disabled={disabled} aria-label={`Hear answer ${number + 1}`} onClick={() => audio.play(item.requiredAudioCues.filter(cue => cue.path === choice.audioPath))}><SpeakerHigh aria-hidden="true"/></button>}
  </div>;
  const constructed = ['order', 'build_word'].includes(item.format);
  const modelChoices = (Array.isArray(item.answer) ? item.answer : [item.answer]).map(id => item.choices.find(choice => choice.id === id)).filter(Boolean);
  return <>
    <section className={`literacy-mock-question question-${item.format}${showPassage ? ' has-passage' : ''}${item.image && !demonstration ? ' has-stimulus' : ''}${demonstration ? ' is-demonstration' : ''}`} aria-label={`Question ${index + 1}`}>
      {demonstration && <aside className="literacy-mock-demonstration" aria-label="Worked example">
        <strong>Button practice · copy the example</strong>
        <div className="literacy-mock-model">{item.format === 'build_word' ? <span>{item.answer}</span> : modelChoices.map((choice, n) => <span key={choice.id}>
          {item.format === 'match' && <>{item.matchTargets[n]?.label} → </>}
          {choice.image ? <LiteracyMockImage src={choice.image} alt={choice.imageAlt || choice.label}/> : choice.label}
          {item.format === 'order' && n < modelChoices.length - 1 && ' → '}
        </span>)}</div>
        {item.image && <div className="literacy-mock-stimulus">{picture(item.image, item.imageAlt, 'stimulus')}</div>}
        <p>Try this answer below. This practice does not count.</p>
        {demonstrationMessage && <p role="status">{demonstrationMessage}</p>}
      </aside>}
      {showPassage && <section className="literacy-mock-reading-text" aria-label="Passage">
        <h2>{item.modality === 'reading' ? 'Read this' : 'The passage'}</h2>
        {item.textFeature ? <AssessmentTextFeature feature={item.textFeature}/> : <LiteracyMockPassage key={item.id} text={item.passage}/>}
      </section>}
      <div className="literacy-mock-stem">
        <button type="button" className="literacy-mock-speaker" aria-label="Listen to the question" disabled={disabled} onClick={() => audio.play()}><SpeakerHigh weight="fill" aria-hidden="true"/></button>
        <div><span className="literacy-mock-region-label">Question</span><p data-child-instruction>{item.prompt}</p></div>
      </div>
      {item.image && !demonstration && <div className="literacy-mock-stimulus">{picture(item.image, item.imageAlt, 'stimulus')}</div>}
      <div className={`literacy-mock-responses format-${item.format}`} role="group" aria-label="Answer choices" data-child-choices>
        {item.format !== 'select_text' && <p className="literacy-mock-region-label">{item.format === 'multi_select' ? `Choose ${item.selectCount} answers` : constructed || item.format === 'match' ? 'Build your answer' : 'Choose your answer'}</p>}
        {onMechanicReminder && <button type="button" className="literacy-mock-reminder" disabled={disabled} onClick={onMechanicReminder}>Practice the buttons</button>}
        {item.format === 'multi_select' && <p className="literacy-mock-selection-count" role="status">Choose {item.selectCount}. {selection.length} of {item.selectCount} selected.</p>}
        {item.format === 'select_text' ? <div className="literacy-mock-text-selection-box" role="region" aria-label="Passage"><p className="literacy-mock-region-label">Read this</p><p className="literacy-mock-text-selection">{[...item.choices].sort((a, b) => a.tokenIndex - b.tokenIndex).map(choice => <button type="button" key={choice.id} aria-pressed={selection.includes(choice.id)} disabled={disabled} onClick={() => choose(choice.id)}>{choice.label}</button>)}</p></div> : <>
          {item.format === 'match' && <>
            <p className="literacy-mock-mechanic">Tap a tile, then its space. You can also drag it.</p>
            <div className="literacy-mock-match-targets">{item.matchTargets.map((target, i) => <div key={target.id || i}>
              <span>{target.image ? picture(target.image, target.label) : target.label}</span>
              <button type="button" disabled={disabled} className="literacy-mock-slot" aria-label={`Space ${i + 1} for ${target.label}${selection[i] ? `: ${choices.find(x => x.id === selection[i])?.label}` : ', empty'}`}
                onClick={() => picked ? place(i) : setSelection(value => value.map((id, n) => n === i ? '' : id))} onDragOver={event => event.preventDefault()} onDrop={event => drop(event, i)}>
                {selection[i] ? choices.find(x => x.id === selection[i])?.label : <span aria-hidden="true">＋</span>}
              </button></div>)}</div>
          </>}
          {constructed && <>
            <p className="literacy-mock-mechanic">Tap the tiles in order. Tap a placed tile to take it back.</p>
            <div className="literacy-mock-construction" role="group" aria-label="Your answer" onDragOver={event => event.preventDefault()} onDrop={event => drop(event, selection.length)}>
              {Array.from({ length: constructionLength }, (_, i) => { const id = selection[i]; return id ? <button key={i} type="button" disabled={disabled} draggable onDragStart={event => event.dataTransfer.setData('text/plain', id)}
                onDragOver={event => event.preventDefault()} onDrop={event => { event.stopPropagation(); drop(event, i); }} onClick={() => choose(id)} aria-label={`Remove ${choices.find(x => x.id === id)?.label}`}>{choices.find(x => x.id === id)?.label}</button>
                : <span className="literacy-mock-empty-slot" key={i} aria-label={`Space ${i + 1}, empty`} onDragOver={event => event.preventDefault()} onDrop={event => { event.stopPropagation(); drop(event, i); }}>＋</span>; })}
            </div>
          </>}
          <div className="literacy-mock-choice-bank">{choices.map(choiceButton)}</div>
        </>}
      </div>
      <div className="literacy-mock-access" aria-live="polite">
        {audio.blocked && <p role="status">Tap the speaker to listen.</p>}
        {instructionFailed && <p>The direction did not load. Tap the speaker to try the direction again.</p>}
        {mediaFailed ? <><p>A picture or recording did not load. This question will not count.</p>{item.requiredAudioPaths.some(path=>audio.delivery[path]==='failed') && <button type="button" disabled={disabled || audio.speaking} onClick={()=>audio.play()}>Try sound again</button>}<button type="button" disabled={disabled || blockPendingHelp && helpRequest?.status === 'pending'} onClick={() => submit('media_failed')}>Go to another question</button></> : !ready && !audio.blocked ? <p>{audio.speaking ? 'Listen…' : 'Listen to the whole question before Next.'}</p> : null}
        {helpRequest?.status === 'pending' && <p>{helpRequest.localOnly ? 'Ask your teacher for help.' : 'Your teacher has been asked to help.'} <button type="button" disabled={disabled || helpPending} onClick={() => onHelpRequest?.('help_cancelled')}>Cancel request</button></p>}
        {helpRequest?.assistanceType === 'access' && <p>Your teacher helped with the controls.</p>}
        {helpRequest?.assistanceType === 'answer' && <p>Your teacher helped with this answer.</p>}
        {legacyHelpEnabled && legacySupportUsed && <p>Ask your teacher. Your answer will be marked as helped.</p>}
      </div>
    </section>
    <footer className="literacy-mock-footer">
      <button type="button" className="literacy-mock-reset" aria-label="Reset" disabled={disabled || !selection.length} onClick={() => { setSelection([]); setPicked(''); }}><ArrowCounterClockwise aria-hidden="true"/><span>Reset</span></button>
      <span className="literacy-mock-student">{studentName}</span>
      <span className="literacy-mock-test-name">Reading &amp; language</span>
      <span data-child-progress>{demonstration ? `Button practice${total ? ` ${index + 1} of ${total}` : ''}` : `Question ${index + 1}${total ? ` of ${total}` : ''}`}</span>
      {(onHelpRequest || legacyHelpEnabled) && <button type="button" className="literacy-mock-help" disabled={disabled || helpPending || helpRequest?.status === 'pending' || helpRequest?.assistanceType === 'answer' || (legacyHelpEnabled && legacySupportUsed)} aria-label="I need help" onClick={() => onHelpRequest ? onHelpRequest('help_requested') : setLegacySupportUsed(true)}><Hand aria-hidden="true"/></button>}
      <button type="button" className="literacy-mock-next" data-child-primary disabled={disabled || blockPendingHelp && helpRequest?.status === 'pending' || !ready || mediaFailed || !mockResponseComplete(item, selection)} onClick={() => submit()}><ArrowRight weight="bold" aria-hidden="true"/><span>{demonstration ? "Next" : index + 1 === total ? "Finish test" : "Next question"}</span></button>
    </footer>
  </>;
}
