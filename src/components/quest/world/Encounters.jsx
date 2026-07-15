// THE ENCOUNTERS — things in the world, not questions on a card.
//
// Every one of these is a PROP standing in the path. You walk up to it, it
// happens, it resolves, you walk on. None of them is a screen. None of them has
// a "1 of 6" counter. That was the whole mistake the first time.
//
// THE ACCOUNTING CONTRACT — onBeat(correct, target) fires once per ATTEMPT,
// not once per beat. It used to fire once per beat with a "slipped" flag,
// while the 3D field tasks fired on every wrong tap — the same behaviour
// scored two different ways, and the beat-level way hid evidence: twenty
// wrong taps on a bridge counted as one mistake. Now every wrong tap records
// a miss against the exact sound the child failed (the wanted plank, not the
// whole word), and every correct action records a hit. The mastery gate sees
// what actually happened.
//
// THE CORRECTION LADDER — a wrong answer never re-arms the identical wall.
// Miss 1: try again. Miss 2: two choices. Miss 3: the answer shows itself and
// says its sound, then asks again with two. Same ladder as the 3D field tasks
// (utils/questCorrection.js) so a child meets ONE rule everywhere. It also
// closes the brute-force hole: guessing now costs recorded misses and ends in
// being taught, not in a lucky tap.

import { useEffect, useRef, useState } from "react";
import { sayGrapheme, sayWord, displayGrapheme } from "../shells/shellContract.js";
import { hasWordAudio, hasGraphemeAudio } from "../../../utils/questAudio.js";
import { CREATURE_INK, CREATURE_PAPER } from "../../../data/creatureParts.js";
import { SIGN_COLOURS } from "../../../data/questWorlds.js";
import {
  CORRECTION_MODES,
  recordCorrectionMiss,
  completeTeachBack,
  correctionPresentation
} from "../../../utils/questCorrection.js";
import Piece from "./Piece.jsx";
import {
  playCorrectChime, playSoftBuzz, playPopSound, playStarChime, playCelebrationFanfare
} from "../../../utils/audio/gameSfx.js";

// ── shared bits ─────────────────────────────────────────────────────────────
function useOnce(beat) {
  const [spent, setSpent] = useState(null);
  return [spent === beat, () => setSpent(beat)];
}

function Listen({ onClick, disabled, label = "Hear it" }) {
  if (disabled) return null;
  return (
    <button type="button" className="qw-listen" onClick={onClick}>{label}</button>
  );
}

// The choice-encounter correction ladder. Keyed by beat (same trick as
// useOnce) so it resets when the beat changes without an effect; escalates per
// miss; on the third miss it plays the sound while the answer glows, then
// drops to guided (two choices). Timers are cleared on unmount so a child who
// walks away mid-teach doesn't get a stray state update, and every timer
// checks it still belongs to the live beat before acting.
function useCorrection(beat, isSoundEnabled) {
  const [entry, setEntry] = useState(null); // { beat, correction }
  const timersRef = useRef([]);

  useEffect(() => () => { for (const t of timersRef.current) window.clearTimeout(t); }, []);

  const correction = entry && entry.beat === beat ? entry.correction : null;

  const miss = choiceId => {
    setEntry(prev => {
      const previous = prev && prev.beat === beat ? prev.correction : null;
      const next = recordCorrectionMiss(previous, choiceId);
      if (next.mode === CORRECTION_MODES.TEACH) {
        timersRef.current.push(window.setTimeout(() => {
          if (isSoundEnabled) sayGrapheme(beat.target, true);
        }, 350));
        timersRef.current.push(window.setTimeout(() => {
          setEntry(current => (
            current && current.beat === beat && current.correction?.mode === CORRECTION_MODES.TEACH
              ? { beat, correction: completeTeachBack(current.correction) }
              : current
          ));
        }, 2100));
      }
      return { beat, correction: next };
    });
  };
  return [correction, miss];
}

function choiceStage(beat) {
  return {
    items: beat.choices.map(g => ({ id: g, correct: g === beat.answer, label: displayGrapheme(g) }))
  };
}

// ── 1. FLOWER PATCH — hear a sound, touch the flower that makes it ──────────
export function FlowerPatch({ beat, isSoundEnabled, onBeat, onDone, index, total }) {
  const [done, mark] = useOnce(beat);
  const [picked, setPicked] = useState(null);
  const [correction, miss] = useCorrection(beat, isSoundEnabled);
  const view = correctionPresentation(choiceStage(beat), correction);
  const teaching = view.mode === CORRECTION_MODES.TEACH;
  const showing = beat.choices.filter(g => view.visibleIds.includes(g));

  // No state reset: TrailWalk remounts this with a fresh key per beat.
  useEffect(() => {
    if (isSoundEnabled) sayGrapheme(beat.target, true);
  }, [beat, isSoundEnabled]);

  function touch(g) {
    if (picked || done || teaching) return;
    const right = g === beat.answer;
    if (isSoundEnabled) (right ? playCorrectChime : playSoftBuzz)();
    onBeat(right, beat.target);
    if (right) {
      setPicked({ g, right: true });
      mark();
      setTimeout(onDone, 900);
      return;
    }
    // A miss stays on the beat and climbs the ladder; it never re-arms the
    // identical wall and never quietly advances past an unlearnt sound.
    setPicked({ g, right: false });
    miss(g);
    setTimeout(() => setPicked(null), 650);
  }

  return (
    <div className="qw-enc qw-flowers">
      <p className="qw-say">Which flower makes this sound?</p>
      <Listen onClick={() => sayGrapheme(beat.target, isSoundEnabled)} disabled={!hasGraphemeAudio(beat.target)} />
      <div className="qw-flowerrow">
        {showing.map(g => {
          const on = picked?.g === g;
          const reveal = teaching && g === beat.answer;
          return (
            <button
              key={g}
              type="button"
              className={`qw-flower${on ? (picked.right ? " is-right" : " is-wrong") : ""}${reveal ? " is-reveal" : ""}${picked && picked.right && on ? " is-bloom" : ""}`}
              disabled={Boolean(picked) || teaching}
              onClick={() => touch(g)}
            >
              <Piece
                kind="flower"
                label={displayGrapheme(g)}
                fallback={(
                  <svg viewBox="0 0 90 120" aria-hidden="true">
                    <path d="M45,118 L45,62" stroke="var(--q-deep)" strokeWidth="6" strokeLinecap="round" fill="none" />
                    <g className="qw-petals">
                      <circle cx="45" cy="30" r="17" fill="var(--q-accent)" />
                      <circle cx="24" cy="45" r="17" fill="var(--q-accent)" />
                      <circle cx="66" cy="45" r="17" fill="var(--q-accent)" />
                      <circle cx="33" cy="66" r="16" fill="var(--q-accent)" />
                      <circle cx="57" cy="66" r="16" fill="var(--q-accent)" />
                    </g>
                    <circle cx="45" cy="48" r="20" fill={CREATURE_PAPER} />
                    <text x="45" y="60" textAnchor="middle" fontSize="30" fontWeight="800" fill={CREATURE_INK}>{displayGrapheme(g)}</text>
                  </svg>
                )}
              />
            </button>
          );
        })}
      </div>
      {teaching && <p className="qw-hint">This one. Listen.</p>}
      <Pips i={index} n={total} />
    </div>
  );
}

// ── 1b. TRAIL RUN — the same sound, but the fork is rushing toward you ──────
// Fluency is not knowing a sound; it is knowing it WITHOUT stopping to think.
// This is the flower patch on a clock: hear the cue, take the fork signed with
// it before the clock runs out. A timeout is a real miss (hesitation is the
// thing being measured), said kindly: the cue replays and the clock re-arms.
// The correction ladder applies exactly as everywhere else.
export function TrailRun({ beat, isSoundEnabled, onBeat, onDone, index, total }) {
  const [done, mark] = useOnce(beat);
  const [picked, setPicked] = useState(null);
  const [lap, setLap] = useState(0);
  const [correction, miss] = useCorrection(beat, isSoundEnabled);
  const view = correctionPresentation(choiceStage(beat), correction);
  const teaching = view.mode === CORRECTION_MODES.TEACH;
  const showing = beat.choices.filter(g => view.visibleIds.includes(g));
  // Speed ramps across the encounter's beats, and eases off while corrected.
  const seconds = Math.max(3, (Number(beat.seconds) || 6) - index + (correction ? 1 : 0));

  useEffect(() => {
    if (isSoundEnabled) sayGrapheme(beat.target, true);
  }, [beat, isSoundEnabled]);

  // The clock pauses while a tap is being judged or the answer is being
  // taught, and re-arms fresh after either — hesitation is what it measures,
  // not the time the game itself spends talking.
  useEffect(() => {
    if (done || teaching || picked) return undefined;
    const timer = window.setTimeout(() => {
      if (isSoundEnabled) playSoftBuzz();
      onBeat(false, beat.target);
      miss(null);
      if (isSoundEnabled) sayGrapheme(beat.target, true);
      setLap(l => l + 1);
    }, seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [lap, done, teaching, picked, beat, seconds, isSoundEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  function dash(g) {
    if (picked || done || teaching) return;
    const right = g === beat.answer;
    if (isSoundEnabled) (right ? playCorrectChime : playSoftBuzz)();
    onBeat(right, beat.target);
    if (right) {
      setPicked({ g, right: true });
      mark();
      setTimeout(onDone, 900);
      return;
    }
    setPicked({ g, right: false });
    miss(g);
    setTimeout(() => { setPicked(null); setLap(l => l + 1); }, 650);
  }

  return (
    <div className="qw-enc qw-run">
      <p className="qw-say">Quick — take the fork that says it!</p>
      <Listen onClick={() => sayGrapheme(beat.target, isSoundEnabled)} disabled={!hasGraphemeAudio(beat.target)} />
      {!done && !teaching && (
        <span className="qw-run-clock" aria-hidden="true">
          <span key={`${lap}-${beat.target}-${index}`} className="qw-run-sand" style={{ animationDuration: `${seconds}s` }} />
        </span>
      )}
      <div className="qw-run-forks">
        {showing.map(g => {
          const on = picked?.g === g;
          const reveal = teaching && g === beat.answer;
          return (
            <button
              key={g}
              type="button"
              className={`qw-runsign${on ? (picked.right ? " is-right" : " is-wrong") : ""}${reveal ? " is-reveal" : ""}`}
              disabled={Boolean(picked) || teaching}
              onClick={() => dash(g)}
            >
              <svg viewBox="0 0 96 110" aria-hidden="true">
                <path d="M46,104 L46,44" stroke="var(--q-deep)" strokeWidth="8" strokeLinecap="round" fill="none" />
                <path d="M14,14 L70,14 L86,31 L70,48 L14,48 Z" fill="var(--q-accent)" stroke="var(--q-deep)" strokeWidth="3" strokeLinejoin="round" />
                <text x="44" y="41" textAnchor="middle" fontSize="30" fontWeight="800" fill={CREATURE_INK}>{displayGrapheme(g)}</text>
              </svg>
            </button>
          );
        })}
      </div>
      {teaching && <p className="qw-hint">This one. Listen.</p>}
      <Pips i={index} n={total} />
    </div>
  );
}

// ── 2. HUNGRY BEAST — it wants the fruit that says its letter ───────────────
export function HungryBeast({ beat, isSoundEnabled, onBeat, onDone, index, total }) {
  const [done, mark] = useOnce(beat);
  const [heard, setHeard] = useState([]);
  const [picked, setPicked] = useState(null);
  const [correction, miss] = useCorrection(beat, isSoundEnabled);
  const view = correctionPresentation(choiceStage(beat), correction);
  const teaching = view.mode === CORRECTION_MODES.TEACH;
  const showing = beat.choices.filter(g => view.visibleIds.includes(g));
  const canHearChoices = isSoundEnabled && beat.choices.every(hasGraphemeAudio);

  function tap(g) {
    if (picked || done || teaching) return;
    if (canHearChoices && !heard.includes(g)) {
      sayGrapheme(g, true);
      setHeard(h => [...h, g]);
      return;
    }
    const right = g === beat.answer;
    if (isSoundEnabled) (right ? playCorrectChime : playSoftBuzz)();
    onBeat(right, beat.target);
    if (right) {
      setPicked({ g, right: true });
      mark();
      setTimeout(onDone, 900);
      return;
    }
    setPicked({ g, right: false });
    miss(g);
    setTimeout(() => setPicked(null), 650);
  }

  return (
    <div className="qw-enc qw-beast">
      <div className="qw-beastface">
        <svg viewBox="0 0 130 120" aria-hidden="true">
          <path d="M65,6 C102,6 124,32 124,66 C124,98 102,114 65,114 C28,114 6,98 6,66 C6,32 28,6 65,6 Z" fill="var(--q-accent)" />
          <path d="M6,74 C16,104 36,114 65,114 C94,114 114,104 124,74 C116,100 96,110 65,110 C34,110 14,100 6,74 Z" fill="var(--q-deep)" opacity="0.45" />
          <circle cx="44" cy="46" r="13" fill={CREATURE_PAPER} />
          <circle cx="86" cy="46" r="13" fill={CREATURE_PAPER} />
          <circle cx="47" cy="48" r="6" fill={CREATURE_INK} />
          <circle cx="89" cy="48" r="6" fill={CREATURE_INK} />
          <path className="qw-mouth" d="M40,80 C52,102 78,102 90,80 Z" fill={CREATURE_INK} />
        </svg>
        <span className="qw-beastsign">{displayGrapheme(beat.target)}</span>
      </div>
      <p className="qw-say">Feed it the fruit that says <strong>{displayGrapheme(beat.target)}</strong>.</p>
      <p className="qw-hint">{teaching ? "This one. Listen." : canHearChoices ? "Tap a fruit to hear it. Tap again to feed." : "Choose the matching fruit."}</p>
      <div className="qw-fruits">
        {showing.map(g => {
          const on = picked?.g === g;
          const reveal = teaching && g === beat.answer;
          return (
            <button
              key={g}
              type="button"
              className={`qw-fruit${heard.includes(g) ? " is-heard" : ""}${on ? (picked.right ? " is-right" : " is-wrong") : ""}${reveal && !on ? " is-reveal" : ""}`}
              disabled={Boolean(picked) || teaching}
              onClick={() => tap(g)}
              aria-label={canHearChoices ? (heard.includes(g) ? "Feed this fruit" : "Hear this fruit") : `Fruit ${displayGrapheme(g)}`}
            >
              <Piece
                kind="fruit"
                label={canHearChoices ? null : displayGrapheme(g)}
                fallback={(
                  <span className="qw-fruit-fallback">
                    <svg viewBox="0 0 60 66" aria-hidden="true">
                      <path d="M30,64 C12,64 4,50 4,36 C4,20 16,10 30,10 C44,10 56,20 56,36 C56,50 48,64 30,64 Z" fill="var(--q-road)" />
                      <path d="M30,12 C30,4 36,0 44,0 C42,8 38,12 30,12 Z" fill="var(--q-deep)" />
                    </svg>
                    {!canHearChoices && <span>{displayGrapheme(g)}</span>}
                  </span>
                )}
              />
            </button>
          );
        })}
      </div>
      <Pips i={index} n={total} />
    </div>
  );
}

// ── 3. BROKEN BRIDGE — lay a plank for every sound, then cross ──────────────
export function BrokenBridge({ beat, isSoundEnabled, onBeat, onDone, index, total }) {
  const [done, mark] = useOnce(beat);
  const [laid, setLaid] = useState([]);
  const [wobble, setWobble] = useState(null);
  const [stuck, setStuck] = useState(0); // consecutive misses on the CURRENT plank
  const [crossed, setCrossed] = useState(false);

  useEffect(() => {
    if (isSoundEnabled) sayWord(beat.word, true);
  }, [beat, isSoundEnabled]);

  function tap(tile, i) {
    if (crossed || done) return;
    const want = beat.planks[laid.length];
    if (tile !== want) {
      // The miss belongs to the sound the child failed to lay — the wanted
      // plank — not to every grapheme in the word.
      setWobble(i);
      onBeat(false, want);
      const misses = stuck + 1;
      setStuck(misses);
      if (isSoundEnabled) {
        playSoftBuzz();
        // Third miss on the same plank: the plank says its own sound and glows
        // (see the is-reveal class on the tray below). Rescue, not punishment.
        if (misses >= 3) setTimeout(() => sayGrapheme(want, true), 300);
      }
      setTimeout(() => setWobble(null), 400);
      return;
    }
    onBeat(true, want);
    setStuck(0);
    const next = [...laid, { tile, from: i }];
    setLaid(next);
    if (isSoundEnabled) { playPopSound(); sayGrapheme(tile, true); }
    if (next.length === beat.planks.length) {
      setCrossed(true);
      mark();
      if (isSoundEnabled) setTimeout(() => { playCorrectChime(); sayWord(beat.word, true); }, 300);
      setTimeout(onDone, 1700);
    }
  }

  const used = new Set(laid.map(l => l.from));
  const want = beat.planks[laid.length];
  return (
    <div className="qw-enc qw-bridge">
      <p className="qw-say">The bridge is out. Lay a plank for every sound.</p>
      <Listen onClick={() => sayWord(beat.word, isSoundEnabled)} disabled={!hasWordAudio(beat.word)} label="Hear the word" />
      <div className={`qw-span${crossed ? " is-crossed" : ""}`}>
        {beat.planks.map((pl, i) => (
          <span key={i} className={`qw-plank${laid[i] ? " is-laid" : ""}`}>
            <Piece
              kind={laid[i] ? "plank" : "plank-empty"}
              label={laid[i] ? displayGrapheme(laid[i].tile) : null}
              fallback={<span className="qw-plank-vec">{laid[i] ? displayGrapheme(laid[i].tile) : ""}</span>}
            />
          </span>
        ))}
      </div>
      {crossed && <p className="qw-word">{beat.word}</p>}
      <div className="qw-tray">
        {beat.tray.map((t, i) => (
          <button
            key={`${t}-${i}`}
            type="button"
            className={`qw-tile${used.has(i) ? " is-used" : ""}${wobble === i ? " is-wobble" : ""}${stuck >= 3 && t === want && !used.has(i) ? " is-reveal" : ""}`}
            disabled={used.has(i) || crossed}
            onClick={() => tap(t, i)}
          >
            <Piece kind="plank" label={displayGrapheme(t)} fallback={<span className="qw-tile-vec">{displayGrapheme(t)}</span>} />
          </button>
        ))}
      </div>
      <Pips i={index} n={total} />
    </div>
  );
}

// ── 4. ECHO CAVE — say back the sounds you hear ────────────────────────────
export function EchoCaveEnc({ beat, isSoundEnabled, onBeat, onDone, index, total }) {
  const [done, mark] = useOnce(beat);
  const [said, setSaid] = useState([]);
  const [wrong, setWrong] = useState(null);
  const [stuck, setStuck] = useState(0);
  const [over, setOver] = useState(false);

  useEffect(() => {
    if (isSoundEnabled) sayWord(beat.word, true);
  }, [beat, isSoundEnabled]);

  function tap(k) {
    if (over || done) return;
    const want = beat.sounds[said.length];
    if (k !== want) {
      setWrong(k);
      onBeat(false, want);
      const misses = stuck + 1;
      setStuck(misses);
      if (isSoundEnabled) {
        playSoftBuzz();
        if (misses >= 3) setTimeout(() => sayGrapheme(want, true), 300);
      }
      setTimeout(() => setWrong(null), 400);
      return;
    }
    onBeat(true, want);
    setStuck(0);
    const next = [...said, k];
    setSaid(next);
    if (isSoundEnabled) { playPopSound(); sayGrapheme(k, true); }
    if (next.length === beat.sounds.length) {
      setOver(true);
      mark();
      if (isSoundEnabled) setTimeout(() => { playCorrectChime(); sayWord(beat.word, true); }, 300);
      setTimeout(onDone, 1600);
    }
  }

  const want = beat.sounds[said.length];

  return (
    <div className="qw-enc qw-cave">
      <p className="qw-say">The cave echoes. What sounds do you hear?</p>
      <Listen onClick={() => sayWord(beat.word, isSoundEnabled)} disabled={!hasWordAudio(beat.word)} label="Hear the word" />
      <div className="qw-echoes">
        {beat.sounds.map((_, i) => (
          <span key={i} className={`qw-echo${said[i] ? " is-said" : ""}`}>
            {said[i]
              ? <Piece kind="stone" label={displayGrapheme(said[i])} fallback={<span className="qw-echo-vec">{displayGrapheme(said[i])}</span>} />
              : <span className="qw-echo-empty">&middot;</span>}
          </span>
        ))}
      </div>
      {over && <p className="qw-word">{beat.word}</p>}
      <div className="qw-tray">
        {beat.keys.map(k => (
          <button key={k} type="button" className={`qw-tile${wrong === k ? " is-wobble" : ""}${stuck >= 3 && k === want ? " is-reveal" : ""}`} disabled={over} onClick={() => tap(k)}>
            <Piece kind="stone" label={displayGrapheme(k)} fallback={<span className="qw-tile-vec">{displayGrapheme(k)}</span>} />
          </button>
        ))}
      </div>
      <Pips i={index} n={total} />
    </div>
  );
}

// ── 5. SHEEP PENS — herd each word into the pen for its sound ───────────────
export function SheepPens({ beat, isSoundEnabled, onBeat, onDone, index, total }) {
  const [done, mark] = useOnce(beat);
  const [sorted, setSorted] = useState({});
  const [stuck, setStuck] = useState(0);
  const [held, setHeld] = useState(null);


  const left = beat.items.filter(i => !sorted[i.word]);

  function pen(id) {
    if (!held || done) return;
    if (held.pen !== id) {
      // The evidence belongs to the sound this word actually contains.
      onBeat(false, held.pen);
      const misses = stuck + 1;
      setStuck(misses);
      if (isSoundEnabled) {
        playSoftBuzz();
        if (misses >= 3) setTimeout(() => sayGrapheme(held.pen, true), 300);
      }
      setHeld(null);
      return;
    }
    onBeat(true, held.pen);
    setStuck(0);
    if (isSoundEnabled) playPopSound();
    const next = { ...sorted, [held.word]: id };
    setSorted(next); setHeld(null);
    if (Object.keys(next).length === beat.items.length) {
      mark();
      if (isSoundEnabled) playCorrectChime();
      setTimeout(onDone, 1200);
    }
  }

  return (
    <div className="qw-enc qw-pens">
      <p className="qw-say">Herd each sheep into its pen.</p>
      <div className="qw-penrow">
        {beat.pens.map(id => (
          <button key={id} type="button" className={`qw-pen${held ? " is-live" : ""}${stuck >= 3 && held && held.pen === id ? " is-reveal" : ""}`} disabled={!held} onClick={() => pen(id)}>
            <span className="qw-pensign" onClick={e => { e.stopPropagation(); sayGrapheme(id, isSoundEnabled); }} role="presentation">
              {displayGrapheme(id.split("_")[0])}
            </span>
            <span className="qw-penwords">
              {beat.items.filter(i => sorted[i.word] === id).map(i => <span key={i.word}>{i.word}</span>)}
            </span>
          </button>
        ))}
      </div>
      <div className="qw-sheeprow">
        {left.map(item => (
          <button
            key={item.word}
            type="button"
            className={`qw-sheep${held?.word === item.word ? " is-held" : ""}`}
            onClick={() => { sayWord(item.word, isSoundEnabled); setHeld(held?.word === item.word ? null : item); }}
          >
            <Piece kind="sheep" fallback={null} />
            <span className="qw-sheep-word">{item.word}</span>
          </button>
        ))}
      </div>
      <Pips i={index} n={total} />
    </div>
  );
}

// ── 6. WORD BEAST — feed it the heart word until it joins you ───────────────
export function WordBeastEnc({ beat, isSoundEnabled, onBeat, onDone, index, total }) {
  const [done, mark] = useOnce(beat);
  const [fed, setFed] = useState(0);
  const [picked, setPicked] = useState(null);
  const [tamed, setTamed] = useState(false);

  useEffect(() => {
    if (isSoundEnabled) sayWord(beat.word, true);
  }, [beat, isSoundEnabled]);

  function feed(w) {
    if (picked || tamed || done) return;
    const right = w === beat.answer;
    setPicked({ w, right });
    if (!right) {
      // Every wrong card is a recorded miss on the heart word — feeding the
      // beast by elimination is no longer free.
      onBeat(false, beat.target);
      if (isSoundEnabled) playSoftBuzz();
      setTimeout(() => setPicked(null), 850);
      return;
    }
    const n = fed + 1;
    setFed(n);
    if (isSoundEnabled) playCorrectChime();
    if (n >= 3) {
      setTamed(true);
      mark();
      // Three feeds are three sightings of ONE word; the evidence is one hit,
      // recorded when the word is truly known (the beast is tamed).
      onBeat(true, beat.target);
      if (isSoundEnabled) setTimeout(playCelebrationFanfare, 250);
      setTimeout(onDone, 1900);
      return;
    }
    setTimeout(() => setPicked(null), 600);
  }

  return (
    <div className="qw-enc qw-wordbeast">
      <div className={`qw-bigbeast${tamed ? " is-tamed" : ""}${picked?.right ? " is-chewing" : ""}`}>
        <svg viewBox="0 0 130 120" aria-hidden="true">
          <path d="M65,6 C102,6 124,32 124,66 C124,98 102,114 65,114 C28,114 6,98 6,66 C6,32 28,6 65,6 Z" fill="var(--q-accent)" />
          <circle cx="44" cy="46" r="14" fill={CREATURE_PAPER} />
          <circle cx="86" cy="46" r="14" fill={CREATURE_PAPER} />
          <circle cx="47" cy="48" r="6" fill={CREATURE_INK} />
          <circle cx="89" cy="48" r="6" fill={CREATURE_INK} />
          <path className="qw-mouth" d="M38,80 C52,104 78,104 92,80 Z" fill={CREATURE_INK} />
        </svg>
        <span className="qw-feeds">{[0, 1, 2].map(i => <span key={i} className={i < fed ? "is-on" : ""} />)}</span>
      </div>
      <p className="qw-say">It is hungry for <strong>{beat.word}</strong>.</p>
      {!tamed && <p className="qw-hint">You can&rsquo;t sound this one out. You just know it.</p>}
      {tamed ? (
        <p className="qw-tamed"><strong>{beat.word}</strong> joined you!</p>
      ) : (
        <div className="qw-cards">
          {beat.choices.map(w => (
            <button
              key={w}
              type="button"
              className={`qw-card${picked?.w === w ? (picked.right ? " is-right" : " is-wrong") : ""}`}
              disabled={Boolean(picked)}
              onClick={() => feed(w)}
            >
              <Piece kind="card" label={w} fallback={<span className="qw-card-vec">{w}</span>} />
            </button>
          ))}
        </div>
      )}
      <Pips i={index} n={total} />
    </div>
  );
}

// ── 7. SIGNPOST — read it, then do it ──────────────────────────────────────
const THING_ART = {
  rock: "M14,52 C10,34 24,16 42,14 C60,12 74,26 74,44 C74,54 66,58 44,58 C26,58 17,58 14,52 Z",
  log: "M8,30 L64,26 C74,25 78,32 78,40 C78,48 74,54 64,54 L8,50 C2,50 2,30 8,30 Z",
  bug: "M44,14 C58,14 68,26 68,40 C68,52 58,60 44,60 C30,60 20,52 20,40 C20,26 30,14 44,14 Z",
  cup: "M18,20 L70,20 L64,58 C63,62 60,64 56,64 L32,64 C28,64 25,62 24,58 Z",
  fish: "M12,38 C22,20 48,18 62,32 L78,20 L74,38 L78,56 L62,44 C48,58 22,56 12,38 Z",
  nut: "M44,12 C60,12 70,26 70,42 C70,56 58,64 44,64 C30,64 18,56 18,42 C18,26 28,12 44,12 Z"
};


export function Signpost({ beat, isSoundEnabled, onBeat, onDone, index, total }) {
  const [done, mark] = useOnce(beat);
  const [picked, setPicked] = useState(null);

  function tap(t) {
    if (picked || done) return;
    const right = t.id === beat.answer;
    setPicked({ id: t.id, right });
    mark();
    if (isSoundEnabled) (right ? playCorrectChime : playSoftBuzz)();
    onBeat(right, beat.target);
    setTimeout(onDone, right ? 900 : 1300);
  }

  return (
    <div className="qw-enc qw-sign">
      {/* No Listen button. If the app reads the sign, the child never has to. */}
      <div className="qw-signboard">
        <Piece kind="board" fallback={null} />
        <span className="qw-signboard-text">{beat.text}</span>
      </div>
      <div className="qw-things">
        {beat.things.map(t => (
          <button
            key={t.id}
            type="button"
            className={`qw-thing${picked?.id === t.id ? (picked.right ? " is-right" : " is-wrong") : ""}${picked && !picked.right && t.id === beat.answer ? " is-reveal" : ""}`}
            disabled={Boolean(picked)}
            onClick={() => tap(t)}
            aria-label={t.word}
          >
            <svg viewBox="0 0 88 76" aria-hidden="true">
              <path d={THING_ART[t.id]} fill={t.colour ? SIGN_COLOURS[t.colour] : "var(--q-accent)"} stroke={CREATURE_INK} strokeWidth="3" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>
      <Pips i={index} n={total} />
    </div>
  );
}

// ── 8. STORY ROCK — a page carved in stone ────────────────────────────────
export function StoryRock({ beat, isSoundEnabled, onDone }) {
  const [chosen, setChosen] = useState(null);
  const clean = w => w.replace(/[^A-Za-z'-]/g, "");

  return (
    <div className="qw-enc qw-story">
      <p className="qw-page">
        {beat.text.split(/(\s+)/).map((tok, i) => {
          if (!tok.trim()) return <span key={i}>{tok}</span>;
          const w = clean(tok);
          const can = w && hasWordAudio(w);
          return (
            <button key={i} type="button" className={`qw-pw${can ? "" : " is-mute"}`} disabled={!can} onClick={() => sayWord(w, isSoundEnabled)}>
              {tok}
            </button>
          );
        })}
      </p>
      <p className="qw-hint">Stuck on a word? Tap it.</p>
      <div className="qw-cards">
        {beat.choices.map(c => (
          <button
            key={c}
            type="button"
            className={`qw-card${chosen === c ? " is-right" : ""}`}
            disabled={Boolean(chosen)}
            onClick={() => { setChosen(c); if (isSoundEnabled) playStarChime(); setTimeout(onDone, 800); }}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function Pips({ i, n }) {
  if (n <= 1) return null;
  return (
    <span className="qw-pips" aria-hidden="true">
      {Array.from({ length: n }, (_, k) => <span key={k} className={k <= i ? "is-on" : ""} />)}
    </span>
  );
}
