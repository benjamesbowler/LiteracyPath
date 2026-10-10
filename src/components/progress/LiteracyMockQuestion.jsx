import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowCounterClockwise, SpeakerHigh, Hand } from '@phosphor-icons/react';
import { mockChoices } from '../../utils/literacyMockPlanner.js';
import { useMockAudio } from '../../hooks/useMockAudio.js';
import { mockResponseValue, mockResponseComplete } from '../../utils/literacyMockResponse.js';
import { LiteracyMockImage } from './LiteracyMockImage.jsx';
import { readAssessmentDraft, writeAssessmentDraft } from '../../utils/assessmentDraftStorage.js';
import { AssessmentTextFeature } from '../assessment/AssessmentTextFeature.jsx';

export function LiteracyMockQuestion({ item, seed, index, studentName, studentId, disabled = false, onSubmit, demonstration = false, demonstrationMessage = '', exposure = {}, onPresented }) {
  const choices = useMemo(() => mockChoices(item, seed), [item, seed]);
  const audioCues = useMemo(() => [
    ...item.requiredAudioCues.filter(cue => cue.role !== 'choice'),
    ...choices.flatMap(choice => item.requiredAudioCues.filter(cue => cue.role === 'choice' && (cue.choiceId === choice.id || (!cue.choiceId && cue.path === choice.audioPath))))
  ], [item, choices]);
  const draftKey = `lp-mock-selection:${seed}:${item.id}`;
  const [draft] = useState(() => {
    try {
      const value = JSON.parse(readAssessmentDraft(draftKey, studentId) || 'null');
      if (Array.isArray(value?.selection) && value.selection.every(id => !id || item.choices.some(choice => choice.id === id))) return value;
    } catch { /* A missing draft starts a fresh uncommitted answer. */ }
    return { selection: [], supportUsed: false, knownFamiliar: exposure.knownFamiliar ?? null };
  });
  const [knownFamiliar] = useState(draft.knownFamiliar ?? null);
  const [recordPresentation] = useState(() => onPresented);
  useEffect(() => { recordPresentation?.(); }, [recordPresentation]);
  const [selection, setSelection] = useState(draft.selection);
  const [picked, setPicked] = useState('');
  const [supportUsed, setSupportUsed] = useState(draft.supportUsed === true);
  const [images, setImages] = useState({});
  const [startedAt] = useState(() => Date.now());
  const audio = useMockAudio(audioCues, !disabled);
  const play = audio.play;
  useEffect(() => { const timer = setTimeout(() => void play(), 0); return () => clearTimeout(timer); }, [play]);
  useEffect(() => {
    try { writeAssessmentDraft(draftKey, JSON.stringify({ selection, supportUsed, knownFamiliar }), studentId); } catch { /* The answer is not committed until Next. */ }
  }, [draftKey, selection, supportUsed, knownFamiliar, studentId]);
  const mediaFailed = Object.values(audio.delivery).includes('failed') || Object.values(images).includes('failed');
  const ready = item.requiredAudioPaths.every(path => audio.delivery[path] === 'completed')
    && item.requiredImagePaths.every(path => images[path] === 'completed');
  const picture = (src, alt, role = 'choice') => <LiteracyMockImage src={src} alt={alt || ''} role={role} onLoad={() => setImages(value => ({ ...value, [src]: 'completed' }))} onError={() => setImages(value => ({ ...value, [src]: 'failed' }))}/>;
  function choose(id) {
    if (disabled) return;
    if (item.format === 'multi_select') setSelection(value => value.includes(id) ? value.filter(x => x !== id) : value.length < item.selectCount ? [...value, id] : value);
    else if (item.format === 'match') setPicked(value => value === id ? '' : id);
    else if (['order', 'build_word'].includes(item.format)) setSelection(value => value.includes(id) ? value.filter(x => x !== id) : [...value, id]);
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
    else setSelection(value => { const next = value.filter(x => x !== id); next.splice(slot, 0, id); return next; });
  }
  function submit(responseStatus = 'answered') {
    audio.stop();
    onSubmit({ questionId: item.id, selected: responseStatus === 'answered' ? mockResponseValue(item, selection) : null,
      responseStatus, audioDelivery: audio.delivery, supportUsed, responseTimeMs: Math.min(7200000, Date.now() - startedAt), knownFamiliar,
      ...(responseStatus === 'media_failed' ? { failedMediaPaths: [...new Set([
        ...Object.keys(audio.delivery).filter(path => audio.delivery[path] === 'failed'),
        ...Object.keys(images).filter(path => images[path] === 'failed')
      ])] } : {}) });
  }
  const choiceButton = (choice, number) => <div className={`literacy-mock-option${audio.activePath && audio.activePath === choice.audioPath ? ' is-speaking' : ''}`} key={choice.id}>
    <button type="button" className={`literacy-mock-choice${choice.image ? ' has-picture' : ''}`} aria-label={item.hideWrittenLabels ? `Answer ${number + 1}` : undefined}
      aria-pressed={selection.includes(choice.id) || picked === choice.id} disabled={disabled}
      draggable={['match', 'order', 'build_word'].includes(item.format)} onDragStart={event => event.dataTransfer.setData('text/plain', choice.id)}
      onClick={() => choose(choice.id)}>
      {choice.image && picture(choice.image, choice.imageAlt)}
      {!item.hideWrittenLabels && <span>{choice.label}</span>}
      {item.hideWrittenLabels && <span className="literacy-mock-answer-number">{number + 1}</span>}
    </button>
    {choice.audioPath && <button className="literacy-mock-choice-audio" type="button" disabled={disabled} aria-label={`Hear answer ${number + 1}`} onClick={() => audio.play(item.requiredAudioCues.filter(cue => cue.path === choice.audioPath))}><SpeakerHigh aria-hidden="true"/></button>}
  </div>;
  const constructed = ['order', 'build_word'].includes(item.format);
  const modelChoices = (Array.isArray(item.answer) ? item.answer : [item.answer]).map(id => item.choices.find(choice => choice.id === id)).filter(Boolean);
  return <>
    <section className="literacy-mock-question" aria-label={`Question ${index + 1}`}>
      {demonstration && <aside className="literacy-mock-demonstration" aria-label="Worked example">
        <strong>Button practice · copy the example</strong>
        <div className="literacy-mock-model">{item.format === 'build_word' ? <span>{item.answer}</span> : modelChoices.map((choice, n) => <span key={choice.id}>
          {item.format === 'match' && <>{item.matchTargets[n]?.label} → </>}
          {choice.image ? <LiteracyMockImage src={choice.image} alt={choice.imageAlt || choice.label}/> : choice.label}
          {item.format === 'order' && n < modelChoices.length - 1 && ' → '}
        </span>)}</div>
        <p>Try this answer below. This practice does not count.</p>
        {demonstrationMessage && <p role="status">{demonstrationMessage}</p>}
      </aside>}
      <div className="literacy-mock-stem">
        <button type="button" className="literacy-mock-speaker" aria-label="Listen to the question" disabled={disabled} onClick={() => audio.play()}><SpeakerHigh weight="fill" aria-hidden="true"/></button>
        <p data-child-instruction>{item.prompt}</p>
      </div>
      {audio.blocked && <p role="status">Tap the speaker to listen.</p>}
      {item.image && <div className="literacy-mock-stimulus">{picture(item.image, item.imageAlt, 'stimulus')}</div>}
      {item.passage && item.displayPassageDuringResponse && item.format !== 'select_text' && (item.textFeature
        ? <AssessmentTextFeature feature={item.textFeature}/>
        : <p className="literacy-mock-passage">{item.passage}</p>)}
      <div className={`literacy-mock-responses format-${item.format}`} role="group" aria-label="Answer choices" data-child-choices>
        {item.format === 'select_text' ? <p className="literacy-mock-text-selection">{[...item.choices].sort((a, b) => a.tokenIndex - b.tokenIndex).map(choice => <button type="button" key={choice.id} aria-pressed={selection.includes(choice.id)} disabled={disabled} onClick={() => choose(choice.id)}>{choice.label}</button>)}</p> : <>
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
              {selection.map((id, i) => <button key={id} type="button" disabled={disabled} draggable onDragStart={event => event.dataTransfer.setData('text/plain', id)}
                onDragOver={event => event.preventDefault()} onDrop={event => { event.stopPropagation(); drop(event, i); }} onClick={() => choose(id)} aria-label={`Remove ${choices.find(x => x.id === id)?.label}`}>{choices.find(x => x.id === id)?.label}</button>)}
              {!selection.length && <span aria-hidden="true">＋</span>}
            </div>
          </>}
          <div className="literacy-mock-choice-bank">{choices.map(choiceButton)}</div>
        </>}
      </div>
      <div className="literacy-mock-access" aria-live="polite">
        {mediaFailed ? <><p>A picture or recording did not load. This question will not count.</p><button type="button" disabled={disabled} onClick={() => submit('media_failed')}>Go to another question</button></> : !ready ? <p>{audio.speaking ? 'Listen…' : 'Listen to the whole question before Next.'}</p> : null}
        {supportUsed && <p>Ask your teacher. Your answer will be marked as helped.</p>}
      </div>
    </section>
    <footer className="literacy-mock-footer">
      <button type="button" className="literacy-mock-reset" aria-label="Reset" disabled={disabled || !selection.length} onClick={() => { setSelection([]); setPicked(''); }}><ArrowCounterClockwise aria-hidden="true"/><span>Reset</span></button>
      <span className="literacy-mock-student">{studentName}</span>
      <span className="literacy-mock-test-name">Reading &amp; language</span>
      <span data-child-progress>{demonstration ? `Button practice ${index + 1} of 5` : `Question ${index + 1}`}</span>
      <button type="button" className="literacy-mock-help" disabled={disabled || supportUsed} aria-label="I need help" onClick={() => setSupportUsed(true)}><Hand aria-hidden="true"/></button>
      <button type="button" className="literacy-mock-next" data-child-primary aria-label="Next" disabled={disabled || !ready || mediaFailed || !mockResponseComplete(item, selection)} onClick={() => submit()}><ArrowRight weight="bold" aria-hidden="true"/><span>Next</span></button>
    </footer>
  </>;
}
