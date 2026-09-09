import { useEffect, useRef } from 'react';
import { playCueSequence, stopCueAudio } from '../../../../utils/audio/cuePlayer.js';
import { playCorrectChime, playSoftBuzz, playCelebrationFanfare, cancelGameSfx } from '../../../../utils/audio/gameSfx.js';
import { createRhymeRun, currentRhymeLevel, chooseRhyme, finishRhymeFeedback, continueRhymeRound } from './rhymePopRules.js';
import { RHYME_AUDIO_SCRIPTS, rhymeInstructionPath, rhymeQuestionClips, rhymeFeedbackClips } from './rhymePopAudio.js';
import { rhymeSceneMarkup, balloonArtwork, balloonSkin, basketArtwork } from './rhymePopScene.js';
import './RhymePopArcadeGame.css';

function releasedAction(button, action, input) {
  let held = null;
  const cancel = event => {
    if (held && event?.pointerId != null && event.pointerId !== held.id) return;
    const id = held?.id;
    if (id != null && input.owner === id) input.owner = null;
    held = null; delete button.dataset.pressed;
    if (id != null && button.hasPointerCapture?.(id)) button.releasePointerCapture(id);
  };
  const down = event => {
    if (button.disabled || event.button !== 0 || held || input.owner != null) return;
    input.owner = event.pointerId;
    held = { id: event.pointerId, epoch: input.epoch }; button.dataset.pressed = 'true';
    button.setPointerCapture?.(event.pointerId);
  };
  const up = event => {
    if (!held || event.pointerId !== held.id) return;
    const valid = held.epoch === input.epoch, box = button.getBoundingClientRect(); cancel();
    if (valid && !button.disabled && event.clientX >= box.left && event.clientX <= box.right &&
      event.clientY >= box.top && event.clientY <= box.bottom) action();
  };
  const click = event => { if (event.detail === 0 && !button.disabled && input.owner == null) action(); };
  const listeners = [['pointerdown', down], ['pointerup', up], ['pointercancel', cancel], ['lostpointercapture', cancel], ['click', click]];
  listeners.forEach(([type, handler]) => button.addEventListener(type, handler));
  input.cancels.add(cancel);
  return () => { cancel(); input.cancels.delete(cancel); listeners.forEach(([type, handler]) => button.removeEventListener(type, handler)); };
}

function startRhyme(root, options) {
  const params = new URLSearchParams(location.search);
  const diagnostics = import.meta.env.DEV && location.pathname === '/preview/game-overlay.html' && params.get('rhymeDiagnostics') === '1';
  const seed = diagnostics ? Number(params.get('rhymeSeed') || 41) : Date.now();
  let run = createRhymeRun(options.difficulty, options.startLevel, seed);
  root.innerHTML = rhymeSceneMarkup();
  const el = id => root.querySelector(`[data-rp="${id}"]`);
  const play = root.querySelector('.rp-play'), overlay = el('overlay');
  const cleanup = [], choiceNodes = new Map(), pauses = new Set();
  let disposed = false, intro = true, readingMode = false, delivery = 'pending', audioKind = 'intro';
  const input = { epoch: 0, owner: null, cancels: new Set() };
  let serial = 0, audioDeadline = null, frame = 0, previous = performance.now(), feedbackAge = 0, endingAge = 0;
  let cueHistory = [], supportHistory = [], questionKey = '', cardKey = '', cardCleanup = [], basketKey = '', fieldRound = -1;
  let receiptSent = false, completionSent = false, lastSound = options.getSound(), reduced = false;
  const listen = (target, name, handler) => { target.addEventListener(name, handler); cleanup.push(() => target.removeEventListener(name, handler)); };
  const busy = () => ['pending', 'loading', 'started'].includes(delivery);
  const invalidate = () => { input.epoch++; input.cancels.forEach(cancel => cancel()); };
  function stopAudio(reason = 'interrupted') {
    if (busy()) { delivery = reason; cueHistory.push({ type: reason, kind: audioKind }); }
    serial++; clearTimeout(audioDeadline); audioDeadline = null; stopCueAudio();
  }
  function requestAudio(kind = audioKind, force = false) {
    if (disposed || pauses.size) return;
    stopAudio(); invalidate(); audioKind = kind;
    if (kind === 'question') {
      const key = run.choices.map(choice => choice.id).join('|');
      if (questionKey !== key) { cueHistory = []; questionKey = key; }
    }
    if (force) readingMode = false;
    if (!options.getSound() || (readingMode && kind !== 'intro')) {
      delivery = options.getSound() ? 'not_requested' : 'muted'; paint(); return;
    }
    const level = currentRhymeLevel(run);
    const clips = kind === 'intro' ? [rhymeInstructionPath('instruction')]
      : kind === 'checkpoint' ? [rhymeInstructionPath('ready')]
        : kind === 'feedback' ? rhymeFeedbackClips(run.lastResponse)
        : rhymeQuestionClips(level.targetWord, run.choices);
    const token = serial;
    if (!clips.length || clips.some(clip => !clip)) { delivery = 'unavailable'; cueHistory.push({ type: delivery, kind }); paint(); return; }
    delivery = 'pending';
    // A stalled recording is a recoverable media failure, not a learner timer.
    // Reset per clip so a normal multi-word sequence has no aggregate deadline.
    const armDeadline = source => {
      clearTimeout(audioDeadline);
      audioDeadline = setTimeout(() => {
        if (disposed || serial !== token) return;
        delivery = 'failed'; cueHistory.push({ type: 'failed', reason: 'playback_timeout', kind, source });
        serial++; stopCueAudio(); invalidate(); paint();
      }, 12000);
    };
    armDeadline(clips[0]);
    playCueSequence(clips, { playImmediately: true, gapMs: 100, cueId: `rhyme:${kind}:${run.round}:${token}`,
      onItemDelivery: event => {
        if (disposed || serial !== token) return;
        const index = Number(event.id.split(':').at(-1)) - 1;
        cueHistory.push({ type: event.type, source: clips[index], kind, at: event.at });
        armDeadline(clips[index]);
      },
      onDelivery: event => {
        if (disposed || serial !== token) return;
        delivery = event.type;
        if (['failed', 'unavailable', 'interrupted'].includes(delivery)) {
          // Invalidate first: a failed shared sequence may still have queued clips.
          serial++; clearTimeout(audioDeadline); audioDeadline = null; stopCueAudio();
        }
        if (delivery === 'completed') { clearTimeout(audioDeadline); audioDeadline = null; }
        paint();
        if (delivery === 'completed' && kind === 'question') focusChoice();
      }
    });
    paint();
  }
  function useReadingSupport() {
    stopAudio(); readingMode = true;
    if (!supportHistory.includes('printed_rhyme_support')) supportHistory.push('printed_rhyme_support');
    paint(); focusChoice();
  }
  const canChoose = () => !intro && !run.paused && run.phase === 'active' && !busy() && (delivery === 'completed' || readingMode);
  function saveReceipt() {
    if (!run.receipt || receiptSent) return;
    const receipt = run.receipt;
    options.onProgressUpdate?.(run.plan.length, run.plan.length);
    receiptSent = options.onResultReady?.(receipt.stars, receipt.score, receipt.words, receipt.evidence) !== false;
  }
  function choose(id) {
    if (!canChoose()) return;
    const event = chooseRhyme(run, id, { audioDelivery: delivery, cueHistory, supportUsed: supportHistory });
    if (!event) return;
    invalidate(); feedbackAge = 0; stopAudio();
    options.onScoreUpdate?.(run.score); saveReceipt();
    if (options.getSound()) (event.correct ? playCorrectChime : playSoftBuzz)();
    requestAudio('feedback'); paint();
  }
  function focusChoice() {
    if (canChoose()) [...choiceNodes.values()].find(({ button }) => !button.disabled)?.button.focus({ preventScroll: true });
  }
  function buildField() {
    const level = currentRhymeLevel(run), field = el('field');
    if (fieldRound !== run.round) {
      choiceNodes.forEach(node => node.cleanup()); choiceNodes.clear(); field.replaceChildren();
      for (let slot = 0; slot < level.visibleBalloons; slot++) {
        const cell = document.createElement('div'); cell.className = 'rp-slot'; field.append(cell);
      }
      field.dataset.count = level.visibleBalloons; fieldRound = run.round;
    }
    for (const [id, node] of choiceNodes) {
      if (!run.choices.some(choice => choice.id === id)) { node.cleanup(); node.button.remove(); choiceNodes.delete(id); }
    }
    for (const choice of run.choices) {
      let entry = choiceNodes.get(choice.id);
      if (!entry) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'rp-balloon';
        button.dataset.rpChoice = choice.slot; button.dataset.choiceId = choice.id;
        button.style.setProperty('--balloon', balloonSkin(choice.slot, seed)); button.innerHTML = balloonArtwork();
        const word = document.createElement('span'); word.className = 'rp-word'; word.textContent = choice.word; button.append(word);
        button.setAttribute('aria-label', `Pop ${choice.word}`); field.children[choice.slot].append(button);
        entry = { button, cleanup: releasedAction(button, () => choose(choice.id), input) }; choiceNodes.set(choice.id, entry);
      }
      entry.button.disabled = !canChoose();
      if (run.phase === 'feedback' && run.lastResponse.responseId === choice.id) entry.button.dataset.feedback = run.lastResponse.correct ? 'correct' : 'wrong';
      else delete entry.button.dataset.feedback;
    }
  }
  function showCard(key) {
    if (cardKey === key) return;
    invalidate(); cardCleanup.forEach(clean => clean()); cardCleanup = []; cardKey = key;
    overlay.replaceChildren(); overlay.hidden = !key; play.inert = Boolean(key);
    overlay.removeAttribute('role'); overlay.removeAttribute('aria-label'); overlay.removeAttribute('aria-modal');
    if (!key) return;
    overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', key === 'intro' ? 'Rhyme Pop instructions' : key === 'recovery' ? 'Rhyme Pop sound recovery' : 'Balloon basket ready');
    const card = document.createElement('section'); card.className = 'rp-card';
    const heading = document.createElement('h2');
    heading.textContent = key === 'intro' ? 'Lift the balloon basket' : key === 'recovery' ? 'Sound did not finish' : 'Basket ready!';
    const art = document.createElement('div'); art.className = 'rp-card-basket'; art.innerHTML = basketArtwork(key === 'intro' ? 3 : 6);
    const copy = document.createElement('p'); copy.textContent = key === 'intro' ? RHYME_AUDIO_SCRIPTS.instruction
      : key === 'recovery' ? (audioKind === 'feedback' ? feedbackText() : 'Hear the words, or use reading support.')
        : `${currentRhymeLevel(run).rhymingWords.length} different rhymes. Your basket can fly!`;
    const actions = document.createElement('div'); actions.className = 'rp-actions';
    const action = (label, callback, id, secondary = false) => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.dataset.rp = id;
      if (secondary) button.className = 'secondary'; actions.append(button);
      cardCleanup.push(releasedAction(button, callback, input)); return button;
    };
    if (key === 'intro') {
      action('Start popping', () => {
        if (pauses.size || busy()) return;
        if (delivery !== 'completed') supportHistory.push('printed_instruction_support');
        intro = false; invalidate(); requestAudio('question');
      }, 'start');
      action('Hear instructions', () => requestAudio('intro', true), 'intro-hear', true);
    } else if (key === 'recovery') {
      action('Hear again', () => requestAudio(audioKind, true), 'retry');
      action('Read the words', useReadingSupport, 'read', true);
    } else {
      action('Next basket', () => {
        if (!continueRhymeRound(run)) return;
        endingAge = 0; cueHistory = []; options.onProgressUpdate?.(run.round + 1, run.plan.length);
        requestAudio('question'); paint(); focusChoice();
      }, 'next');
    }
    const note = document.createElement('small'); note.dataset.rp = 'card-note';
    card.append(art, heading, copy, actions, note); overlay.append(card);
    actions.querySelector('button')?.focus({ preventScroll: true });
  }
  function feedbackText() {
    const response = run.lastResponse;
    return response ? `${response.response} ${response.correct ? 'rhymes with' : 'does not rhyme with'} ${response.target}${response.correct ? '!' : '.'}` : 'Pop all the rhyming words.';
  }
  function paint() {
    if (disposed) return;
    root.dataset.phase = intro ? 'intro' : run.phase; root.dataset.paused = run.paused;
    root.dataset.delivery = delivery; root.dataset.motion = reduced ? 'reduced' : 'full';
    root.dataset.responses = run.firstResponses.length; root.dataset.words = run.words;
    root.dataset.reaction = run.phase === 'feedback' ? run.lastResponse.correct ? 'pop' : 'retry'
      : ['round-complete', 'complete'].includes(run.phase) ? 'celebrate' : 'ready';
    const level = currentRhymeLevel(run);
    el('target').textContent = level.targetWord; el('remaining').textContent = `${level.rhymingWords.length - run.resolvedWords.size} left`;
    el('round').textContent = `Basket ${run.round + 1} / ${run.plan.length}`;
    el('hear').disabled = run.paused || !options.getSound() || !['active', 'feedback'].includes(run.phase);
    const message = run.phase === 'feedback' || (run.lastResponse && !run.lastResponse.correct) ? feedbackText()
      : run.phase === 'round-complete' || run.phase === 'complete' ? 'Balloon basket ready!' : 'Pop all the rhyming words.';
    if (el('feedback').textContent !== message) el('feedback').textContent = message;
    el('support').textContent = readingMode ? 'Reading support' : busy() ? 'Listen to the words…' : 'Hear the words again anytime.';
    const key = `${run.round}:${run.resolvedWords.size}`;
    if (basketKey !== key) {
      basketKey = key; el('basket').innerHTML = basketArtwork(run.resolvedWords.size);
      el('collected').replaceChildren(...[...run.resolvedWords].map(word => { const node = document.createElement('span'); node.textContent = word; return node; }));
    }
    buildField();
    const recovery = !readingMode && !busy() && delivery !== 'completed' && ['active', 'feedback'].includes(run.phase);
    showCard(intro ? 'intro' : recovery ? 'recovery' : run.phase === 'round-complete' ? 'checkpoint' : '');
    for (const button of overlay.querySelectorAll('button')) {
      button.disabled = pauses.size > 0 || (button.dataset.rp === 'start' && busy()) || (['intro-hear', 'retry'].includes(button.dataset.rp) && !options.getSound());
    }
    if (el('card-note')) el('card-note').textContent = busy() ? 'Listen…' : !options.getSound() ? 'Sound off · reading support is available.'
      : delivery === 'completed' ? '' : 'You can replay, or continue with printed support.';
  }
  function tick(seconds) {
    if (disposed || intro || run.paused) return;
    if (run.phase === 'feedback') {
      feedbackAge += seconds;
      if (feedbackAge >= (run.lastResponse.correct ? .7 : 1.25) && !busy() && (delivery === 'completed' || readingMode)) {
        const phase = finishRhymeFeedback(run); invalidate();
        if (phase === 'active') requestAudio('question');
        else {
          stopAudio(); endingAge = 0;
          if (phase === 'round-complete') {
            options.onCheckpoint?.(run.round + 1, run.plan.length);
            requestAudio('checkpoint');
          }
        }
        paint(); if (phase === 'active') focusChoice();
      }
    } else if (run.phase === 'complete' && !completionSent) {
      endingAge += seconds;
      if (endingAge >= 1) {
        completionSent = true; stopAudio(); saveReceipt();
        const receipt = run.receipt;
        if (options.getSound()) playCelebrationFanfare();
        options.onComplete?.(receipt.stars, receipt.score, receipt.words, receipt.evidence);
      }
    }
  }
  function pause(reason = 'host') {
    pauses.add(reason); run.paused = true; invalidate(); stopAudio(); cancelGameSfx(); paint();
  }
  function resume(reason = 'host') {
    pauses.delete(reason); run.paused = pauses.size > 0; previous = performance.now(); invalidate();
    if (!run.paused && delivery === 'interrupted') requestAudio(audioKind);
    paint();
  }
  const motion = matchMedia('(prefers-reduced-motion: reduce)'); reduced = motion.matches;
  listen(motion, 'change', () => { reduced = motion.matches; paint(); });
  listen(window, 'blur', () => pause('blur')); listen(window, 'focus', () => resume('blur'));
  listen(document, 'visibilitychange', () => document.hidden ? pause('visibility') : resume('visibility'));
  listen(root, 'keydown', event => {
    if (event.repeat && ['Enter', ' '].includes(event.key)) { event.preventDefault(); return; }
    if (cardKey && event.key === 'Tab') {
      const buttons = [...overlay.querySelectorAll('button:not(:disabled)')];
      const current = buttons.indexOf(document.activeElement);
      event.preventDefault(); buttons[(current + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus(); return;
    }
    if (!canChoose() || !el('field').contains(event.target) || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd'].includes(event.key)) return;
    event.preventDefault(); const buttons = [...el('field').querySelectorAll('button:not(:disabled)')];
    const direction = ['ArrowLeft', 'ArrowUp', 'a'].includes(event.key) ? -1 : 1;
    buttons[(buttons.indexOf(document.activeElement) + direction + buttons.length) % buttons.length]?.focus();
  });
  cleanup.push(releasedAction(el('hear'), () => requestAudio(run.phase === 'feedback' ? 'feedback' : 'question', true), input));
  root.querySelectorAll('img').forEach(img => listen(img, 'error', () => { img.hidden = true; root.dataset.assetFallback = 'true'; }));
  function loop(now) {
    if (disposed) return;
    const delta = Math.min(.05, Math.max(0, (now - previous) / 1000)); previous = now;
    if (lastSound !== options.getSound()) {
      lastSound = options.getSound(); stopAudio(); invalidate();
      if (!lastSound) { delivery = 'muted'; cancelGameSfx(); paint(); }
      else requestAudio(audioKind, true);
    }
    tick(delta); frame = requestAnimationFrame(loop);
  }
  options.onSessionStart?.(); options.onCheckpoint?.(run.round, run.plan.length); options.onProgressUpdate?.(run.round + 1, run.plan.length);
  paint(); requestAudio('intro'); frame = requestAnimationFrame(loop);
  const snapshot = () => ({ phase: run.phase, intro, round: run.round, target: currentRhymeLevel(run).targetWord, choices: run.choices,
    words: run.words, score: run.score, resolvedWords: [...run.resolvedWords], firstResponses: run.firstResponses, assistedRetries: run.assistedRetries,
    receipt: run.receipt, delivery, audioKind, readingMode, cueHistory: [...cueHistory], paused: run.paused, seed });
  if (diagnostics) window.__rhymePop = { snapshot, plan: run.plan, step: tick,
    seek: round => {
      stopAudio(); invalidate(); run = createRhymeRun(options.difficulty, round, seed); run.paused = pauses.size > 0;
      intro = false; fieldRound = -1; feedbackAge = 0; endingAge = 0; receiptSent = false; completionSent = false;
      options.onSessionStart?.(); requestAudio('question'); paint();
    } };
  return { pause, resume, debugSnapshot: snapshot, teardown() {
    disposed = true; invalidate(); stopAudio(); cancelGameSfx(); cancelAnimationFrame(frame);
    cleanup.forEach(clean => clean()); choiceNodes.forEach(node => node.cleanup()); cardCleanup.forEach(clean => clean());
    root.replaceChildren(); if (diagnostics) delete window.__rhymePop;
  } };
}

export default function RhymePopArcadeGame({ difficulty = 'easy', startLevel = 0, onScoreUpdate, onProgressUpdate,
  onComplete, onResultReady, onSessionStart, onCheckpoint, onEngineReady, isSoundEnabled = true }) {
  const root = useRef(null), sound = useRef(isSoundEnabled);
  useEffect(() => { sound.current = isSoundEnabled; }, [isSoundEnabled]);
  useEffect(() => {
    const engine = startRhyme(root.current, { difficulty, startLevel, onScoreUpdate, onProgressUpdate,
      onComplete, onResultReady, onSessionStart, onCheckpoint, getSound: () => sound.current });
    onEngineReady?.(engine); return () => engine.teardown();
    // Score/progress rerenders must preserve the active choice, cue and receipt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);
  return <div className="rp-game" ref={root} />;
}
