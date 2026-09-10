import { useEffect, useMemo, useRef, useState } from 'react';
import { hasRecordedSpeech, speak, speakWord } from '../../../../utils/learnGamesAudio.js';
import { playPopSound } from '../../../../utils/audio/gameSfx.js';
import { hfwOptions, sentenceTiles, shuffled } from '../../../../utils/recognitionPractice.js';
import { completeRepairDisplay } from '../../../../utils/repairSentence.js';
import { PhonicsPlayScene, PlayHero } from './PhonicsPlayShared.jsx';
import { practiceEvidence, wordTargetLayout, hopscotchRoutes, hopPosition } from './phonicsPlayModel.js';
import { useStageSnapshot, useResumeTransition } from './phonicsSession.js';
import { usePiecePlacement } from './usePhonicsPiecePlacement.js';
import { useRecordedPracticeCue } from '../shared/useRecordedPracticeCue.js';
import { usePlayClock, usePlaySize } from './usePhonicsMotion.js';

export function MatchGame({ state, round = 0, setRound, isSoundEnabled, correct, setCorrect, addScore, miss, finish, resultReady, schedule, recordFirstResponse, recordAssistedRetry, paused, discovered, onDiscover, difficulty, resume, onSnapshot }) {
  const [boardIndex, setBoardIndex] = useState(() => resume?.boardIndex ?? Math.min(round, state.boards.length - 1));
  const [selected, setSelected] = useState(resume?.selected || []);
  const [matchedIds, setMatchedIds] = useState(() => resume?.matchedIds || state.boards.slice(0, round).flat().map(card => card.id));
  const selectedRef = useRef(resume?.selected || []);
  const matchedRef = useRef(new Set(matchedIds));
  const attemptsRef = useRef(new Map(resume?.attempts || []));
  const cards = state.boards[boardIndex];
  const total = state.cards.length / 2;
  function choose(card) {
    if (paused || selectedRef.current.length >= 2 || matchedRef.current.has(card.id) || selectedRef.current.some(item => item.id === card.id)) return;
    if (isSoundEnabled) void speakWord(card.word);
    const next = [...selectedRef.current, card]; selectedRef.current = next; setSelected(next);
    if (next.length !== 2) return;
    const matched = next[0].pairId === next[1].pairId;
    recordFirstResponse({ ...practiceEvidence('visual_memory', ['spatial_pairing']), game: 'sight-word-memory', round: next[0].pairId, target: next[0].word, response: card.word, correct: matched });
    if (!matched) {
      attemptsRef.current.set(next[0].pairId, (attemptsRef.current.get(next[0].pairId) || 0) + 1); miss();
      schedule(() => { selectedRef.current = []; setSelected([]); }, 1000);
      return;
    }
    const attempts = attemptsRef.current.get(next[0].pairId) || 0;
    if (attempts) recordAssistedRetry({ game: 'sight-word-memory', round: next[0].pairId, attempts, supportUsed: ['revealed_cards', 'spatial_pairing'] });
    next.forEach(item => matchedRef.current.add(item.id));
    setMatchedIds([...matchedRef.current]); selectedRef.current = []; setSelected([]); addScore(12);
    const nextCorrect = matchedRef.current.size / 2; setCorrect(nextCorrect);
    onDiscover({ id: card.pairId, word: card.object });
    if (cards.every(item => matchedRef.current.has(item.id))) schedule(() => {
      if (boardIndex + 1 < state.boards.length) { setBoardIndex(boardIndex + 1); setRound?.(boardIndex + 1); }
      else { resultReady(nextCorrect); finish(nextCorrect); }
    }, 1100);
  }
  useStageSnapshot(() => ({ boardIndex, selected, matchedIds, attempts: [...attemptsRef.current] }), onSnapshot);
  const restoredComplete = resume?.matchedIds && cards.every(card => resume.matchedIds.includes(card.id));
  useResumeTransition(restoredComplete || resume?.selected?.length === 2, () => {
    if (restoredComplete) {
      if (boardIndex + 1 < state.boards.length) { setBoardIndex(boardIndex + 1); setRound?.(boardIndex + 1); }
      else { resultReady(correct); finish(correct); }
    } else { selectedRef.current = []; setSelected([]); }
  }, schedule, 800);
  return <PhonicsPlayScene mode="memory" prompt="Find the matching words" isSoundEnabled={isSoundEnabled} progress={correct} total={total} discovered={discovered} paused={paused}>
    <div className="pp-memory-table" data-card-count={cards.length}>
      {cards.map((card, index) => {
        const matched = matchedIds.includes(card.id);
        const visible = matched || selected.some(item => item.id === card.id);
        return <button type="button" key={card.id} data-pair-id={card.pairId} data-card-id={card.id} disabled={paused || matched} className={`pp-memory-card${visible ? ' is-revealed' : ''}${matched ? ' is-matched' : ''}`} aria-label={`${matched ? 'Matched' : visible ? 'Revealed' : 'Hidden'} card ${index + 1} of ${cards.length}${visible ? `: ${card.word}` : ''}`} onClick={() => choose(card)}>
          <span className="pp-card-turn"><span className="pp-card-back" aria-hidden="true">✦</span><span className="pp-card-front" aria-hidden={!visible}>{card.word}</span></span>
        </button>;
      })}
    </div>
    <PlayHero difficulty={difficulty} className="pp-memory-host" />
  </PhonicsPlayScene>;
}

export function TargetGame({ state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, totalRounds, schedule, recordFirstResponse, recordAssistedRetry, paused, discovered, onDiscover, resume, onSnapshot }) {
  const target = state.words[round];
  const options = useMemo(() => resume?.options || hfwOptions(target, state.pool), [target, state.pool, resume]);
  const [fieldRef, size] = usePlaySize();
  const [still, setStill] = useState(() => resume?.still ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { if (preference.matches) setStill(true); };
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  const time = usePlayClock(paused || still || keyboardFocus);
  const [popped, setPopped] = useState(resume?.popped || false);
  const [wrong, setWrong] = useState(resume?.wrong || '');
  const solved = useRef(resume?.popped || Boolean(resume?.answer)), attempts = useRef(resume?.attempts || 0);
  const { canHear, replay } = useRecordedPracticeCue(target, isSoundEnabled && !paused);
  const positions = wordTargetLayout(size.width, size.height, options, time);
  function pop(word) {
    if (paused || solved.current) return;
    recordFirstResponse({ ...practiceEvidence('high_frequency_word_recognition', [canHear ? 'recorded_word_cue' : 'printed_target']), game: 'pop-the-word', round, target, response: word, correct: word === target });
    if (word !== target) { attempts.current += 1; miss(); setWrong(word); schedule(() => setWrong(''), 1200); return; }
    solved.current = true; setPopped(true); setWrong(''); addScore(20, playPopSound); setCorrect(correct + 1);
    if (attempts.current) recordAssistedRetry({ game: 'pop-the-word', round, target, attempts: attempts.current, supportUsed: ['word_contrast', canHear ? 'recorded_word_cue' : 'printed_target'] });
    onDiscover({ id: `word-${round}`, sentence: target });
    schedule(() => round + 1 >= totalRounds ? finish(correct + 1) : setRound(round + 1), 700);
  }
  useStageSnapshot(() => ({ options, still, popped, wrong, attempts: attempts.current }), onSnapshot);
  useResumeTransition(resume?.popped, () => round + 1 >= totalRounds ? finish(correct) : setRound(round + 1), schedule, 500);
  return <PhonicsPlayScene mode="target" prompt={canHear ? 'Pop the word you hear' : `Pop ${target}`} cue={target} onReplay={replay} canHearCue={canHear} isSoundEnabled={isSoundEnabled} progress={correct} total={totalRounds} discovered={discovered} paused={paused} tools={<button className="pp-tool" type="button" aria-pressed={still} onClick={() => setStill(value => !value)}>{still ? 'Move' : 'Still'}</button>}>
    <div className="pp-target-field" ref={fieldRef}>
      {positions.map(item => <button type="button" className={`pp-word-balloon${popped && item.word === target ? ' is-popped' : ''}${wrong === item.word ? ' is-wrong' : ''}`} key={item.word} data-word={item.word} disabled={paused || popped} onFocus={() => setKeyboardFocus(true)} onBlur={() => setKeyboardFocus(false)} onClick={() => pop(item.word)} style={{ left: item.x, top: item.y, width: item.width, height: item.height, fontSize: item.fontSize }}>{item.word}</button>)}
      {wrong && <p className="pp-local-feedback" role="status">That says {wrong}. {canHear ? 'Hear the target again.' : `Find ${target}.`}</p>}
    </div>
  </PhonicsPlayScene>;
}

export function SentenceGame({ state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, schedule, recordFirstResponse, recordAssistedRetry, paused, discovered, onDiscover, difficulty, resume, onSnapshot }) {
  const sentence = state.sentences[round];
  const tiles = useMemo(() => sentenceTiles(sentence), [sentence]);
  const routes = useMemo(() => hopscotchRoutes(state.sentences), [state.sentences]);
  const previous = round ? routes[round - 1].at(-1).find(stone => stone.accepted) : { x: 60, y: .76 };
  const [hero, setHero] = useState(resume?.hero || previous);
  const [jump, setJump] = useState(null);
  const [index, setIndex] = useState(resume?.index || 0);
  const [wrong, setWrong] = useState(resume?.wrong || '');
  const [worldRef, size] = usePlaySize();
  const time = usePlayClock(paused);
  const locked = useRef(resume?.index === tiles.length), attempts = useRef(resume?.attempts || 0);
  const { canHear, replay } = useRecordedPracticeCue(sentence, isSoundEnabled && !paused);
  const position = jump ? hopPosition(jump.from, jump.to, (time - jump.started) / jump.duration) : { ...hero, lift: 0 };
  const camera = Math.max(0, position.x - size.width * .28);
  const heroHeight = Math.min(86, Math.max(40, size.height * .24));
  const heroFoot = position.y * size.height - position.lift - 28;
  const cameraLift = Math.max(0, heroHeight + 6 - heroFoot);
  function choose(stone) {
    if (paused || locked.current || stone.index !== index || stone.sentenceIndex !== round) return;
    locked.current = true;
    recordFirstResponse({ ...practiceEvidence('sentence_word_order', [canHear ? 'recorded_sentence_cue' : 'printed_sentence_model']), game: 'word-hopscotch', round: `${round}:${index}`, sentence, target: tiles[index].word, response: stone.word, tileId: stone.id, correct: stone.accepted });
    const from = hero; setJump({ from, to: stone, started: time, duration: .55 });
    schedule(() => {
      if (!stone.accepted) {
        attempts.current += 1; miss(); setWrong(`${stone.word} does not fit here. Try another stone.`);
        setJump({ from: stone, to: from, started: time + .55, duration: .4 });
        schedule(() => { setHero(from); setJump(null); locked.current = false; }, 400);
        return;
      }
      setHero(stone); setJump(null); setWrong(''); setIndex(index + 1); addScore(10); locked.current = false;
      if (attempts.current) recordAssistedRetry({ game: 'word-hopscotch', round: `${round}:${index}`, target: stone.word, attempts: attempts.current, supportUsed: ['sentence_order_feedback'] });
      attempts.current = 0;
      if (index + 1 === tiles.length) {
        locked.current = true; setCorrect(correct + 1); onDiscover({ id: `sentence-${round}`, sentence });
        schedule(() => round + 1 >= state.sentences.length ? finish(correct + 1) : setRound(round + 1), 850);
      }
    }, 550);
  }
  useStageSnapshot(() => ({ hero, index, wrong, attempts: attempts.current }), onSnapshot);
  useResumeTransition(resume?.index === tiles.length, () => round + 1 >= state.sentences.length ? finish(correct) : setRound(round + 1), schedule, 700);
  return <PhonicsPlayScene mode="sentence" prompt={canHear ? (tiles.slice(0, index).map(tile => tile.word).join(' ') || 'Hop to build the sentence') : sentence} cue={sentence} onReplay={replay} canHearCue={canHear} isSoundEnabled={isSoundEnabled} progress={correct} total={state.sentences.length} discovered={discovered} paused={paused}>
    <div className="pp-hop-world" ref={worldRef}>
      <div className="pp-hop-river" aria-hidden="true" />
      <div className="pp-hop-course" style={{ transform: `translate(${-camera}px, ${cameraLift}px)` }}>
        {routes.flat(2).filter(stone => stone.x > camera - 140 && stone.x < camera + size.width + 180).map(stone => <button type="button" key={stone.id} className={`pp-hop-stone${stone.accepted && (stone.sentenceIndex < round || (stone.sentenceIndex === round && stone.index < index)) ? ' is-reached' : ''}`} data-stone-id={stone.id} data-world-x={stone.x} disabled={paused || Boolean(jump) || stone.sentenceIndex !== round || stone.index !== index} onClick={() => choose(stone)} style={{ left: stone.x, top: stone.y * size.height }}>{stone.word}</button>)}
        <PlayHero difficulty={difficulty} className={jump ? 'pp-hopping-hero' : ''} style={{ left: position.x, top: heroFoot, width: heroHeight * .84, height: heroHeight, bottom: 'auto', transform: 'translate(-50%, -100%)' }} />
      </div>
      {wrong && <p className="pp-local-feedback" role="status">{wrong}</p>}
    </div>
  </PhonicsPlayScene>;
}

export function FixGame({ state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, schedule, recordFirstResponse, recordAssistedRetry, paused, discovered, onDiscover, difficulty, resume, onSnapshot }) {
  const fix = state.fixes[round];
  const [answer, setAnswer] = useState(resume?.answer || '');
  const [wrong, setWrong] = useState(resume?.wrong || '');
  const [viewIndex, setViewIndex] = useState(resume?.viewIndex ?? round);
  const [travelled, setTravelled] = useState(Boolean(resume) || round === 0);
  const [repairRef, repairSize] = usePlaySize();
  const stationWidth = repairSize.width + 48;
  useEffect(() => { if (round > 0) schedule(() => setTravelled(true), 40); }, [round, schedule]);
  const solved = useRef(resume?.popped || Boolean(resume?.answer)), attempts = useRef(resume?.attempts || 0);
  const options = useMemo(() => resume?.options || shuffled(fix.options).map((label, index) => ({ id: `repair-${index}`, label })), [fix, resume]);
  function apply(piece) {
    if (paused || solved.current || viewIndex !== round) return;
    const accepted = (fix.acceptedAnswers || [fix.answer]).includes(piece.label);
    recordFirstResponse({ ...practiceEvidence('sentence_repair', ['sentence_context', 'repair_intent']), game: 'sentence-fix-it', round, repairCategory: fix.kind, target: fix.answer, response: piece.label, correct: accepted });
    if (!accepted) { attempts.current += 1; setWrong(piece.label); miss(); return; }
    solved.current = true; setAnswer(piece.label); setWrong(''); setCorrect(correct + 1); addScore(25);
    const sentence = completeRepairDisplay(fix.display, piece.label);
    onDiscover({ id: `repair-${round}`, sentence, index: round });
    if (attempts.current) recordAssistedRetry({ game: 'sentence-fix-it', round, target: fix.answer, attempts: attempts.current, supportUsed: ['repair_category_feedback', 'reversible_replacement'] });
    if (isSoundEnabled && hasRecordedSpeech(sentence)) void speak(sentence);
    schedule(() => round + 1 >= state.fixes.length ? finish(correct + 1) : setRound(round + 1), 1700);
  }
  const drag = usePiecePlacement(apply, paused || Boolean(answer));
  useStageSnapshot(() => ({ answer, wrong, viewIndex, options, attempts: attempts.current }), onSnapshot);
  useResumeTransition(Boolean(resume?.answer), () => round + 1 >= state.fixes.length ? finish(correct) : setRound(round + 1), schedule, 800);
  const cameraIndex = travelled ? viewIndex : Math.max(0, round - 1);
  return <PhonicsPlayScene mode="quiz" prompt={fix.prompt} cue={fix.prompt} isSoundEnabled={isSoundEnabled} progress={correct} total={state.fixes.length} discovered={discovered} paused={paused}>
    <div className="pp-repair-world" ref={repairRef}>
      <div className="pp-repair-district" style={{ transform: `translateX(${-cameraIndex * stationWidth}px)` }}>
        {state.fixes.slice(0, round + 1).map((viewed, station) => {
          const oldRepair = discovered.find(item => item.id === `repair-${station}`);
          const repaired = station < round || Boolean(answer);
          const parts = viewed.display.split('___');
          return <div key={station} className={`pp-repair-station${repaired ? ' is-repaired' : ''}`} style={{ left: station * stationWidth, width: repairSize.width }} aria-hidden={station !== viewIndex}>
            <div className="pp-neighbourhood"><span className="pp-shop-window" /><div className="pp-gate"><span /><span /></div><span className="pp-street-lamp" /></div>
            <div className="pp-repair-sign" data-sign-index={station}>
              {station < round ? <span>{oldRepair?.sentence || completeRepairDisplay(viewed.display, viewed.answer)}</span> : parts.map((part, index) => <span key={index}>{part}{index < parts.length - 1 && <button type="button" className={`pp-repair-socket${drag.overSlot === 0 ? ' is-drop-target' : ''}${wrong ? ' is-wrong' : ''}`} data-piece-slot="0" disabled={paused || Boolean(answer) || station !== viewIndex} onClick={() => drag.placeSelected(0)} aria-label="Place the repair here">{answer || wrong || '…'}</button>}</span>)}
            </div>
          </div>;
        })}
      </div>
      <PlayHero difficulty={difficulty} className="pp-street-hero" />
      {round > 0 && <nav className="pp-repair-travel" aria-label="Visit repaired signs"><button type="button" aria-label="Previous sign" disabled={viewIndex === 0 || paused} onClick={() => setViewIndex(value => value - 1)}>◀</button><button type="button" aria-label="Current sign" disabled={viewIndex === round || paused} onClick={() => setViewIndex(value => value + 1)}>▶</button></nav>}
      {wrong && <p className="pp-local-feedback" role="status">{fix.kind === 'capital' ? 'Names and sentence starts need a capital.' : fix.kind === 'end' ? 'Check whether it tells, asks, or shows strong feeling.' : 'Read the whole message. Try another word.'}</p>}
    </div>
    <div className="pp-piece-bank" aria-label="Repair pieces">{options.map(piece => <button type="button" className="pp-piece pp-repair-tool" key={piece.id} disabled={paused || Boolean(answer)} {...drag.pieceProps(piece)}>{piece.label}</button>)}</div>
    {drag.ghost}
  </PhonicsPlayScene>;
}
