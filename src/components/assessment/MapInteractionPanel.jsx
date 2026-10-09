import { useEffect, useRef, useState } from 'react';
import ActivityButton from '../ActivityButton.jsx';
import { AssessmentAudioButton } from './AssessmentAudioButton.jsx';
import { AssessmentConstructionStatus } from './AssessmentConstructionStatus.jsx';
import { useAssessmentCompletion } from './useAssessmentCompletion.js';
import { mapPracticeResponse, placeMapTile } from '../../utils/mapPracticeResponse.js';
import '../../styles/map-interactions.css';

export function MapInteractionPanel({ currentQuestion: question, answerQuestion, speakText, onEvidenceImageError }) {
  const options = question.answerOptions || [];
  const count = question.mapSlots || 0;
  const draftKey = 'lp-map-draft:' + (question.practiceSessionId || 'preview') + ':' + question.id;
  const [draft, setDraft] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftKey) || 'null');
      if (saved?.length === count && saved.every(id => !id || options.some(option => option.value === id))
        && new Set(saved.filter(Boolean)).size === saved.filter(Boolean).length) return saved;
    } catch { /* Fresh uncommitted response. */ }
    return Array(count).fill('');
  });
  const [picked, setPicked] = useState('');
  const [dragging, setDragging] = useState(null);
  const gesture = useRef(null), suppressClick = useRef(false);
  const { complete, pending, error, retry } = useAssessmentCompletion(question.id, answerQuestion);
  useEffect(() => {
    if (pending) { try { sessionStorage.removeItem(draftKey); } catch { /* The committed episode owns the response. */ } }
  }, [pending, draftKey]);
  useEffect(() => {
    const stop = () => {
      if (gesture.current) suppressClick.current = true;
      gesture.current = null; setDragging(null); setPicked('');
    };
    const visibility = () => { if (document.hidden) stop(); };
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', visibility);
    return () => { window.removeEventListener('blur', stop); document.removeEventListener('visibilitychange', visibility); gesture.current = null; };
  }, []);
  const used = new Set(draft.filter(Boolean));
  const picture = option => <img src={option.image} alt={option.alt || option.label}
    data-assessment-media-kind="evidence" data-assessment-media-role="choice" draggable={false}
    onError={() => onEvidenceImageError?.({ questionId: question.id, src: option.image, role: 'choice' })}/>;
  function save(next) {
    setDraft(next);
    try { sessionStorage.setItem(draftKey, JSON.stringify(next)); } catch { /* Durable answer saving is owned by the practice controller. */ }
  }
  function place(id, slot) {
    if (pending || !options.some(option => option.value === id)) return;
    save(placeMapTile(draft, id, slot, count)); setPicked('');
  }
  function down(event, option) {
    if (pending || event.button !== 0) return;
    gesture.current = { id: option.value, x: event.clientX, y: event.clientY, moved: false, owner: event.currentTarget };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event) {
    const current = gesture.current;
    if (!current || pending) return;
    if (Math.hypot(event.clientX - current.x, event.clientY - current.y) > 8) current.moved = true;
    if (current.moved) setDragging({ id: current.id, x: event.clientX, y: event.clientY });
  }
  function up(event) {
    const current = gesture.current;
    gesture.current = null; setDragging(null);
    if (!current?.moved || pending) return;
    suppressClick.current = true;
    const slot = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-map-slot]');
    if (slot && current.owner.closest('.map-interaction-panel')?.contains(slot)) place(current.id, Number(slot.dataset.mapSlot));
  }
  function cancel() { gesture.current = null; setDragging(null); setPicked(''); suppressClick.current = true; }
  function click(event, action) {
    if (suppressClick.current && event.detail !== 0) { suppressClick.current = false; return; }
    suppressClick.current = false;
    if (!pending) action();
  }
  const tile = (option, slot) => <button type="button" key={option.value}
    className={'map-move-tile wa-choice' + (picked === option.value ? ' picked' : '') + (option.image ? ' has-picture' : '')}
    aria-pressed={picked === option.value} disabled={pending}
    aria-label={(slot === undefined ? 'Pick ' : 'Pick placed ') + (option.image ? 'picture ' + (options.indexOf(option) + 1) : option.label)}
    onPointerDown={event => down(event, option)} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}
    onClick={event => click(event, () => setPicked(value => value === option.value ? '' : option.value))}>
      {option.image ? picture(option) : <span>{option.label}</span>}
    </button>;
  const selectedText = question.mapInteraction === 'select_text';
  const pictureChoice = question.mapInteraction === 'picture_choice';
  if (selectedText || pictureChoice) return <div className={'map-interaction-panel map-select-panel ' + (pictureChoice ? 'map-picture-choices' : 'map-hot-text')} data-map-format={question.mapInteraction}>
    {selectedText && question.passageAudioPath && <AssessmentAudioButton text={question.passage} audioPath={question.passageAudioPath}
      speakText={speakText} audioRole="passage" label="Listen to sentence" displayLabel="Listen" showDisabled/>}
    <div role="group" aria-label={selectedText ? 'Words in the sentence' : 'Story pictures'}>
      {(selectedText ? [...options].sort((a, b) => a.tokenIndex - b.tokenIndex) : options).map((option, index) => <ActivityButton
        type="button" className="map-select-tile wa-choice" key={option.value} disabled={pending}
        aria-label={pictureChoice ? 'Choose picture ' + (index + 1) : 'Select word ' + (index + 1) + ': ' + option.label}
        onClick={() => complete(option.value)}>
        {option.image ? picture(option) : option.label}
      </ActivityButton>)}
    </div>
    <AssessmentConstructionStatus pending={pending} error={error} onRetry={retry} readyText="Answer ready…">
      {selectedText ? 'Choose a word in the sentence.' : 'Choose a picture.'}
    </AssessmentConstructionStatus>
  </div>;
  return <div className="map-interaction-panel" data-map-format={question.mapInteraction} aria-busy={pending}
    onPointerDownCapture={() => { suppressClick.current = false; }}>
    <p className="map-move-instruction">Tap a tile, then a space. You can also drag.</p>
    <div className={'map-drop-line ' + (options.some(option => option.image) ? 'map-picture-line' : '')} role="group" aria-label="Your answer">
      {draft.map((id, slot) => {
        const option = options.find(candidate => candidate.value === id);
        return <div key={slot} className="map-slot-wrap" data-map-slot={slot}>
          <ActivityButton type="button" className="map-drop-slot wa-choice" disabled={pending} aria-label={'Place in space ' + (slot + 1)}
            onClick={event => click(event, () => { if (picked) place(picked, slot); })}>
            {question.mapTargets?.[slot]?.label || (slot + 1)}
          </ActivityButton>
          {option && tile(option, slot)}
          {option && <ActivityButton type="button" className="map-remove wa-choice" disabled={pending} aria-label={'Remove from space ' + (slot + 1)}
            onClick={() => save(draft.map((value, i) => i === slot ? '' : value))}>Remove</ActivityButton>}
        </div>;
      })}
    </div>
    <div className={'map-tile-bank ' + (question.mapInteraction === 'build_word' ? 'map-letter-bank' : '')} role="group" aria-label="Tiles to move" data-child-choices>
      {options.map(option => used.has(option.value) ? <div className="map-used-tile" key={option.value}>Placed</div> : tile(option))}
    </div>
    <p role="status" className="map-placement-status">{dragging ? 'Moving tile.' : picked ? 'Choose a space for your tile.' : used.size + ' of ' + count + ' placed.'}</p>
    <ActivityButton type="button" className="map-check-answer assessment-answer-card wa-choice" disabled={pending || draft.some(id => !id)}
      onClick={() => complete(mapPracticeResponse(question, draft))}>Check answer</ActivityButton>
    <AssessmentConstructionStatus pending={pending} error={error} onRetry={retry} readyText="Answer ready…"/>
    {dragging && <div className="map-drag-ghost" aria-hidden="true" style={{ left: dragging.x, top: dragging.y }}>
      {options.find(option => option.value === dragging.id)?.image
        ? <img src={options.find(option => option.value === dragging.id).image} alt=""/>
        : options.find(option => option.value === dragging.id)?.label}
    </div>}
  </div>;
}
