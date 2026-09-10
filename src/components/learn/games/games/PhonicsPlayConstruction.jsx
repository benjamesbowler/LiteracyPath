import { useEffect, useMemo, useRef, useState } from 'react';
import { shuffled } from '../../../../utils/recognitionPractice.js';
import { hasRecordedSpeech, speakPhoneme, speakWord } from '../../../../utils/learnGamesAudio.js';
import { WorkshopObjectAction } from '../shared/WorkshopObjectAction.jsx';
import { PhonicsPlayScene, PlayHero, WordPicture } from './PhonicsPlayShared.jsx';
import { usePiecePlacement } from './usePhonicsPiecePlacement.js';
import { useStageSnapshot, useResumeTransition } from './phonicsSession.js';
import { practiceEvidence } from './phonicsPlayModel.js';

export function BuildGame({ state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, totalRounds, schedule, recordFirstResponse, recordAssistedRetry, paused, discovered, onDiscover, difficulty, resume, onSnapshot }) {
  const target = state.rounds[round];
  const [placed, setPlaced] = useState(() => resume?.placed || Array(target.units.length).fill(null));
  const [wrong, setWrong] = useState(resume?.wrong || null);
  const [done, setDone] = useState(resume?.done || false);
  const placedRef = useRef(placed);
  const solvedRef = useRef(resume?.done || false);
  const attempts = useRef(resume?.attempts || 0);
  const tiles = useMemo(() => {
    if (resume?.tiles) return resume.tiles;
    const candidates = [...new Set(state.rounds.flatMap(item => item.units.map(unit => unit.grapheme)))];
    const decoys = shuffled(candidates.filter(unit => !target.units.some(t => t.grapheme === unit))).slice(0, 3);
    return shuffled([...target.units, ...decoys.map((grapheme, index) => ({ id: `decoy-${index}`, grapheme, phoneme: grapheme }))]);
  }, [state, target, resume]);
  useEffect(() => { if (isSoundEnabled && hasRecordedSpeech(target.word)) void speakWord(target.word); }, [isSoundEnabled, target.word]);
  function place(piece, index) {
    if (paused || solvedRef.current || index < 0 || index >= placedRef.current.length) return;
    if (placedRef.current.some(item => item?.id === piece.id)) return;
    const accepted = piece.grapheme === target.units[index].grapheme;
    recordFirstResponse({ ...practiceEvidence('ordered_grapheme_construction', ['picture_cue', 'movable_graphemes']), game: 'building-workshop', round: `${round}:${index}`, target: target.units[index].grapheme, word: target.word, response: piece.grapheme, correct: accepted, soundEnabled: isSoundEnabled });
    if (!accepted) {
      attempts.current += 1; miss(); setWrong({ index, grapheme: piece.grapheme });
      if (isSoundEnabled) void speakPhoneme(target.units[index].phoneme || target.units[index].grapheme);
      return;
    }
    const next = [...placedRef.current]; next[index] = piece;
    placedRef.current = next; setPlaced(next); setWrong(null);
    if (isSoundEnabled) void speakPhoneme(piece.phoneme || piece.grapheme);
    if (!next.every(Boolean)) return;
    solvedRef.current = true; setDone(true); addScore(25); setCorrect(correct + 1);
    if (attempts.current) recordAssistedRetry({ game: 'building-workshop', round, target: target.word, attempts: attempts.current, supportUsed: ['specific_grapheme_feedback', 'preserved_correct_pieces'] });
    onDiscover({ id: `build-${round}`, word: target.word });
    if (isSoundEnabled) void speakWord(target.word);
    schedule(() => round + 1 >= totalRounds ? finish(correct + 1) : setRound(round + 1), 1800);
  }
  const drag = usePiecePlacement(place, paused || done);
  useStageSnapshot(() => ({ placed, wrong, done, tiles, attempts: attempts.current }), onSnapshot);
  useResumeTransition(resume?.done, () => round + 1 >= totalRounds ? finish(correct) : setRound(round + 1), schedule, 800);
  const used = new Set(placed.filter(Boolean).map(piece => piece.id));
  return <PhonicsPlayScene mode="build" cue={target.word} prompt={done ? `${target.word} — built!` : 'Put the sounds together'} isSoundEnabled={isSoundEnabled} progress={correct} total={totalRounds} discovered={discovered} paused={paused}>
    <div className={`pp-workshop-world${done ? ' is-built' : ''}`}>
      <PlayHero difficulty={difficulty} className={done ? 'pp-hero-cheer' : ''} />
      <div className="pp-blueprint"><WordPicture word={target.word} label={target.label} /></div>
      <div className="pp-workbench">
        <div className="pp-slot-row" role="group" aria-label="Word assembly slots">
          {target.units.map((unit, index) => <button type="button" key={unit.id} data-piece-slot={index} className={`pp-slot${drag.overSlot === index ? ' is-drop-target' : ''}${placed[index] ? ' is-filled' : ''}${wrong?.index === index ? ' is-wrong' : ''}`} aria-label={placed[index] ? `Remove ${placed[index].grapheme} from position ${index + 1}` : `Place sound in position ${index + 1}`} disabled={paused || done} onClick={() => {
            if (drag.selected) drag.placeSelected(index);
            else if (placed[index]) { const next = [...placedRef.current]; next[index] = null; placedRef.current = next; setPlaced(next); }
          }}>{placed[index]?.grapheme || <span aria-hidden="true">{index + 1}</span>}</button>)}
        </div>
        {done && <div className="pp-object-payoff"><WorkshopObjectAction target={target} active /></div>}
      </div>
      {wrong && <p className="pp-local-feedback" role="status">{wrong.grapheme} does not fit sound {wrong.index + 1}. Try another piece.</p>}
    </div>
    <div className="pp-piece-bank" aria-label="Sound pieces">
      {tiles.map(piece => <button type="button" className="pp-piece" key={piece.id} data-tile-id={piece.id} disabled={paused || done || used.has(piece.id)} {...drag.pieceProps(piece)}>{piece.grapheme}</button>)}
    </div>
    {drag.ghost}
  </PhonicsPlayScene>;
}

export function FamilyGame({ state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, schedule, recordFirstResponse, recordAssistedRetry, paused, discovered, onDiscover, difficulty, resume, onSnapshot }) {
  const mission = state.missions[round];
  const [onset, setOnset] = useState(resume?.onset || '');
  const [built, setBuilt] = useState(resume?.built || []);
  const [wrong, setWrong] = useState(resume?.wrong || '');
  const [finished, setFinished] = useState(resume?.finished || false);
  const attempts = useRef(resume?.attempts || 0);
  const advancing = useRef(resume?.finished || false);
  const options = useMemo(() => resume?.options || shuffled([...new Set(mission.familyWords.map(word => word.slice(0, -mission.rime.length)))])
    .map((grapheme, index) => ({ id: `onset-${index}`, grapheme })), [mission, resume]);
  const nextTarget = built.includes(mission.word) ? mission.familyWords.find(word => !built.includes(word)) : mission.word;
  useEffect(() => { if (isSoundEnabled && nextTarget && hasRecordedSpeech(nextTarget)) void speakWord(nextTarget); }, [isSoundEnabled, nextTarget]);
  function join(piece) {
    if (paused || advancing.current) return;
    const word = piece.grapheme + mission.rime;
    setOnset(piece.grapheme);
    const accepted = word === nextTarget;
    recordFirstResponse({ ...practiceEvidence('onset_rime_construction', ['picture_cue', 'visible_rime']), game: 'blend-family', round: `${round}:${built.length}`, target: nextTarget, response: word, correct: accepted });
    if (!accepted) { attempts.current += 1; miss(); setWrong(`${word} is a different word. Build ${nextTarget}.`); return; }
    setWrong(''); const nextBuilt = [...built, word]; setBuilt(nextBuilt); onDiscover({ id: `family-${round}-${word}`, word });
    if (isSoundEnabled) void speakWord(word);
    addScore(12);
    if (attempts.current) recordAssistedRetry({ game: 'blend-family', round: `${round}:${built.length}`, target: word, attempts: attempts.current, supportUsed: ['rime_contrast', 'reversible_onset'] });
    attempts.current = 0;
    if (nextBuilt.length >= Math.min(3, mission.familyWords.length)) {
      advancing.current = true; setFinished(true); setCorrect(correct + 1);
      schedule(() => round + 1 >= state.total ? finish(correct + 1) : setRound(round + 1), 1600);
    }
  }
  const drag = usePiecePlacement(join, paused || finished);
  useStageSnapshot(() => ({ onset, built, wrong, finished, options, attempts: attempts.current }), onSnapshot);
  useResumeTransition(resume?.finished, () => round + 1 >= state.total ? finish(correct) : setRound(round + 1), schedule, 800);
  return <PhonicsPlayScene mode="family" cue={nextTarget || mission.word} prompt={finished ? `The ${mission.rime} collection is growing!` : `Build ${nextTarget}`} isSoundEnabled={isSoundEnabled} progress={correct} total={state.total} discovered={discovered} paused={paused}>
    <div className="pp-family-world">
      <PlayHero difficulty={difficulty} />
      <div className="pp-family-town" aria-label="Words built in this family">{built.map(word => <div className="pp-family-house" key={word}><WordPicture word={word} /><strong>{word}</strong></div>)}</div>
      {!finished && <div className="pp-family-target"><WordPicture word={nextTarget} /></div>}
      <div className="pp-family-machine"><button type="button" data-piece-slot="0" className={`pp-slot pp-onset-socket${drag.overSlot === 0 ? ' is-drop-target' : ''}${wrong ? ' is-wrong' : ''}`} disabled={paused || finished} onClick={() => drag.placeSelected(0)} aria-label={`Join onset to ${mission.rime}`}>{onset || '…'}</button><span className="pp-rime">{mission.rime}</span></div>
      {wrong && <p className="pp-local-feedback" role="status">{wrong}</p>}
    </div>
    <div className="pp-piece-bank" aria-label="Onset pieces">{options.map(piece => <button type="button" className="pp-piece" key={piece.id} disabled={paused || finished} {...drag.pieceProps(piece)}>{piece.grapheme}</button>)}</div>
    {drag.ghost}
  </PhonicsPlayScene>;
}
