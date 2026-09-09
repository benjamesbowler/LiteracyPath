import { useEffect, useRef, useState } from 'react';
import { loadThree, hasSeenOnboarding, markOnboardingSeen, prefersReducedMotion } from '../shared/threeShell.js';
import { isolateRocketRunActionOverlay, isolateRocketRunCompletion, restoreRocketRunHud } from '../shared/rocketRunCompletion.js';
import { laneDirectionForKey } from '../shared/premiumGameStandard.js';
import { isInteractiveKeyTarget } from '../../../../utils/interactiveEventTarget.js';
import { getPreferredPhonemeAudioPath } from '../../../../data/phonemeAudioBank.js';
import { playCueSequence, stopCueAudio } from '../../../../utils/audio/cuePlayer.js';
import { playCorrectChime, playSoftBuzz, playTapSound, playCelebrationFanfare } from '../../../../utils/audio/gameSfx.js';
import { createRocketScene } from './rocketRunScene.js';
import { ROCKET_AUDIO_SCRIPTS, rocketInstructionPath, rocketFeedbackClips } from './rocketRunAudio.js';
import { FLIGHT_STEP, createFlightRun, currentFlightGate, currentFlightChoices, flightLayout,
  sectorForRound, steerFlight, nominateFlight, flightCanCommit, commitFlight, advanceFlight, continueFlight, rocketRunWordAudioPath } from './rocketRunFlight.js';
import './RocketRunGame.css';

const ROCKET_INSTRUCTION = ROCKET_AUDIO_SCRIPTS.instruction;

// A press nominates nothing until its own valid release. Native keyboard clicks
// take the same action; the browser's follow-up pointer click is ignored.
function attachRelease(button, activate, currentEpoch) {
  let press = null;
  const cancel = event => {
    if (press && event?.pointerId != null && event.pointerId !== press.id) return;
    press = null; button.dataset.pressed = 'false';
  };
  const down = event => {
    if (button.disabled || event.button !== 0 || press) return;
    press = { id: event.pointerId, epoch: currentEpoch() };
    button.dataset.pressed = 'true';
    button.setPointerCapture?.(event.pointerId);
  };
  const up = event => {
    if (!press || event.pointerId !== press.id) return;
    const valid = press.epoch === currentEpoch();
    const rect = button.getBoundingClientRect();
    cancel();
    if (valid && !button.disabled && event.clientX >= rect.left && event.clientX <= rect.right &&
      event.clientY >= rect.top && event.clientY <= rect.bottom) activate();
  };
  const click = event => { if (event.detail === 0 && !button.disabled) activate(); };
  for (const [type, listener] of [['pointerdown', down], ['pointerup', up], ['pointercancel', cancel], ['lostpointercapture', cancel], ['click', click]]) {
    button.addEventListener(type, listener);
  }
  return () => {
    cancel();
    for (const [type, listener] of [['pointerdown', down], ['pointerup', up], ['pointercancel', cancel], ['lostpointercapture', cancel], ['click', click]]) button.removeEventListener(type, listener);
  };
}

function startRocket(THREE, mount, options) {
  const params = new URLSearchParams(window.location.search);
  const diagnostics = import.meta.env.DEV && window.location.pathname === '/preview/game-overlay.html' && params.get('rocketDiagnostics') === '1';
  const seed = diagnostics ? Number(params.get('rocketSeed') || 41) : Date.now();
  let state = createFlightRun(options.difficulty, options.startLevel, seed);
  let sceneApi = null;
  try { if (THREE) sceneApi = createRocketScene(THREE, mount); }
  catch (error) { console.warn('[RocketRun] using accessible flight panels:', error.message); }
  const hud = document.createElement('div');
  hud.className = 'rr-hud'; hud.dataset.rr = 'hud';
  hud.innerHTML = `
    <div class="rr-flat-world" ${sceneApi ? 'hidden' : ''} aria-hidden="true"><div class="rr-flat-terminal"></div><div class="rr-flat-route"></div>
      <svg class="rr-flat-ship" viewBox="0 0 100 130"><path fill="#ff8061" d="M36 66 6 114 34 104M64 66 94 114 66 104"/><path fill="#ffd780" d="M50 4Q21 38 32 103H68Q79 38 50 4Z"/><path fill="#7bdce8" stroke="#293b51" stroke-width="5" d="M50 30Q35 38 40 63H60Q65 38 50 30Z"/><path fill="#f0fcff" d="M39 107 50 130 61 107"/></svg>
    </div>
    <header class="rr-mission"><button type="button" data-rr="hear-target"><strong data-rr="letter"></strong><small>Hear</small></button>
      <div class="rr-mission-copy"><strong data-rr="prompt"></strong><span data-rr="route"></span></div><span class="rr-deliveries" data-rr="deliveries"></span></header>
    <div class="rr-gates" data-rr="gates" role="group" aria-label="Choose a word gate"></div>
    <div class="rr-side-zone rr-left-zone" data-rr="left-zone"></div><div class="rr-side-zone rr-right-zone" data-rr="right-zone"></div>
    <div class="rr-feedback"><span role="status" aria-live="polite" data-rr="feedback"></span><small data-rr="support-copy"></small></div>
    <div class="rr-controls"><button type="button" data-rr="left" aria-label="Steer left">◀</button><button type="button" data-rr="fly">Fly through</button><button type="button" data-rr="right" aria-label="Steer right">▶</button></div>
    <div class="rr-audio-recovery" data-rr="audio-recovery" hidden><span>Sound did not finish.</span><button type="button" data-rr="retry-audio">Hear again</button><button type="button" data-rr="read-support">Read the words</button></div>
    <div class="rr-overlay" data-rr="overlay"></div>`;
  mount.appendChild(hud);
  const el = name => hud.querySelector(`[data-rr="${name}"]`);
  const pauses = new Set(), cleanups = [];
  let disposed = false, epoch = 0, audioSerial = 0, audioBusy = false;
  let audioKind = '', introDelivery = options.getSound() ? 'pending' : 'muted', feedbackDelivery = '', feedbackWaiting = false;
  let lastSound = options.getSound(), introActive = !hasSeenOnboarding('rocket-run');
  let frame = 0, previous = performance.now(), accumulator = 0, held = null;
  let gateKey = '', buttons = [], gateCleanups = [], cardCleanup = null, receiptSent = false, finished = false;
  let reduced = prefersReducedMotion();
  const listen = (target, type, callback, settings) => {
    target.addEventListener(type, callback, settings);
    cleanups.push(() => target.removeEventListener(type, callback, settings));
  };
  const invalidateInput = () => {
    epoch += 1; held = null;
    hud.querySelectorAll('[data-pressed]').forEach(button => { button.dataset.pressed = 'false'; });
  };
  const stopAudio = () => { audioSerial += 1; audioBusy = false; stopCueAudio(); };
  const recordPrintedSupport = () => {
    if (!state.support.includes('printed_sound_support')) state.support.push('printed_sound_support');
  };
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  listen(motionQuery, 'change', () => { reduced = prefersReducedMotion(); paint(); });
  function playIntro() {
    if (!introActive || pauses.size || disposed) return;
    stopAudio(); audioKind = 'intro';
    if (!options.getSound()) { introDelivery = 'muted'; paint(); return; }
    const serial = audioSerial;
    introDelivery = 'pending'; audioBusy = true;
    playCueSequence([rocketInstructionPath('instruction')], { playImmediately: true, cueId: 'rocket:introduction',
      onDelivery: event => {
        if (disposed || serial !== audioSerial) return;
        introDelivery = event.type; audioBusy = ['loading', 'started'].includes(event.type);
        if (['failed', 'unavailable', 'interrupted'].includes(event.type)) stopAudio();
        paint();
      }
    });
    paint();
  }
  function playFeedback(event) {
    if (!event || disposed || state.paused) return;
    stopAudio(); audioKind = 'feedback';
    feedbackWaiting = false;
    if (!options.getSound()) { feedbackDelivery = 'muted'; paint(); return; }
    const clips = rocketFeedbackClips(event), serial = audioSerial;
    if (!clips.length || clips.some(clip => !clip)) { feedbackDelivery = 'unavailable'; paint(); return; }
    feedbackDelivery = 'pending'; feedbackWaiting = true; audioBusy = true;
    playCueSequence(clips, { playImmediately: true, gapMs: 90, cueId: `rocket:feedback:${event.responseId}`,
      onDelivery: delivery => {
        if (disposed || serial !== audioSerial) return;
        feedbackDelivery = delivery.type; audioBusy = ['loading', 'started'].includes(delivery.type);
        feedbackWaiting = audioBusy;
        if (['failed', 'unavailable', 'interrupted'].includes(delivery.type)) stopAudio();
        paint();
      }
    });
    paint();
  }
  function requestCue() {
    if (disposed || state.paused || introActive || !['approach', 'decision'].includes(state.phase)) return;
    stopAudio(); audioKind = 'question'; feedbackWaiting = false; feedbackDelivery = '';
    if (!options.getSound()) { state.audio = 'muted'; recordPrintedSupport(); paint(); return; }
    const gate = currentFlightGate(state);
    const clips = [
      getPreferredPhonemeAudioPath(gate.target), ...currentFlightChoices(state).map(choice => rocketRunWordAudioPath(choice.word))
    ];
    const serial = audioSerial;
    if (clips.some(clip => !clip)) {
      state.audio = 'unavailable'; state.mediaEvents.push({ type: 'unavailable', gate: gate.id }); paint(); return;
    }
    state.audio = 'pending'; audioBusy = true;
    playCueSequence(clips, { cueId: `rocket:${gate.id}:${state.attempt}`, playImmediately: true, gapMs: 100,
      onItemDelivery: event => {
        if (disposed || serial !== audioSerial) return;
        const index = Number(event.id.split(':').at(-1)) - 1;
        state.mediaEvents.push({ type: event.type, source: clips[index], at: event.at });
      },
      onDelivery: event => {
        if (disposed || serial !== audioSerial) return;
        state.audio = event.type; audioBusy = ['loading', 'started'].includes(event.type);
        if (['failed', 'unavailable', 'interrupted'].includes(event.type)) stopAudio();
        paint();
      }
    });
    paint();
  }
  function syncSound() {
    if (lastSound === options.getSound()) return;
    lastSound = options.getSound();
    if (!lastSound) { stopAudio(); state.audio = 'muted'; introDelivery = 'muted'; feedbackDelivery = 'muted'; feedbackWaiting = false; recordPrintedSupport(); }
    else if (introActive) playIntro();
    else if (['commit', 'return'].includes(state.phase)) playFeedback(state.lastResponse);
    else requestCue();
  }
  function saveReceipt() {
    if (!state.receipt || receiptSent) return;
    receiptSent = true;
    const receipt = state.receipt;
    options.onProgressUpdate?.(state.plan.length, state.plan.length);
    options.onResultReady?.(receipt.stars, receipt.score, receipt.words, receipt.evidence);
  }
  function submit() {
    const event = commitFlight(state);
    if (!event) return;
    invalidateInput(); stopAudio();
    if (options.getSound()) (event.correct ? playCorrectChime : playSoftBuzz)();
    options.onScoreUpdate?.(state.score); saveReceipt(); playFeedback(event); paint();
  }
  function move(direction) {
    if (introActive || !steerFlight(state, direction)) return;
    if (options.getSound()) playTapSound(); paint();
  }
  function nominate(lane) {
    if (introActive || !nominateFlight(state, lane)) return;
    if (options.getSound()) playTapSound(); paint();
  }
  const release = (name, action) => cleanups.push(attachRelease(el(name), action, () => epoch));
  release('fly', submit);
  release('hear-target', () => ['commit', 'return'].includes(state.phase) ? playFeedback(state.lastResponse) : requestCue());
  release('retry-audio', () => requestCue());
  release('read-support', () => { stopAudio(); recordPrintedSupport(); paint(); });
  for (const [name, direction] of [['left', -1], ['right', 1]]) {
    const button = el(name);
    const cancel = event => {
      if (held?.button === button && event?.pointerId != null && event.pointerId !== held.pointerId) return;
      if (held?.button === button) held = null; button.dataset.pressed = 'false';
    };
    listen(button, 'pointerdown', event => {
      if (event.button !== 0 || button.disabled || held) return;
      event.preventDefault(); button.setPointerCapture?.(event.pointerId);
      move(direction); button.dataset.pressed = 'true';
      held = { button, direction, pointerId: event.pointerId, epoch, remaining: 0.36 };
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) listen(button, type, cancel);
    listen(button, 'click', event => { if (event.detail === 0 && !button.disabled) move(direction); });
    let gesture = null;
    const zone = el(`${name}-zone`);
    listen(zone, 'pointerdown', event => {
      if (event.button !== 0 || state.paused || introActive) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, epoch };
      zone.setPointerCapture?.(event.pointerId);
    });
    listen(zone, 'pointerup', event => {
      const start = gesture; gesture = null;
      if (!start || start.id !== event.pointerId || start.epoch !== epoch) return;
      const dx = event.clientX - start.x, dy = event.clientY - start.y;
      if (Math.abs(dy) > 35) return;
      move(Math.abs(dx) > 28 ? Math.sign(dx) : direction);
    });
    for (const type of ['pointercancel', 'lostpointercapture']) listen(zone, type, () => { gesture = null; });
  }
  listen(window, 'keydown', event => {
    if (state.paused || introActive) return;
    const direction = laneDirectionForKey(event.key);
    const interactive = isInteractiveKeyTarget(event.target);
    const ownControl = event.target.closest?.('.rr-controls, .rr-gates');
    if (direction && (!interactive || ownControl)) { event.preventDefault(); move(direction); }
    else if (!interactive && !event.repeat && ['Enter', ' '].includes(event.key)) { event.preventDefault(); submit(); }
  });
  function pause(reason = 'host') {
    pauses.add(reason); state.paused = true; invalidateInput();
    if (audioBusy) {
      if (audioKind === 'intro') introDelivery = 'interrupted';
      else if (audioKind === 'feedback') feedbackDelivery = 'interrupted';
      else state.audio = 'interrupted';
    }
    // A failed sequence can still own queued clips; cancellation is unconditional.
    stopAudio();
    paint();
  }
  function resume(reason = 'host') {
    pauses.delete(reason); state.paused = pauses.size > 0 || introActive;
    previous = performance.now(); accumulator = 0;
    if (introActive && !pauses.size && ['pending', 'interrupted'].includes(introDelivery)) playIntro();
    else if (!state.paused && ['commit', 'return'].includes(state.phase) && feedbackDelivery === 'interrupted') playFeedback(state.lastResponse);
    else if (!state.paused && ['pending', 'interrupted'].includes(state.audio)) requestCue();
    paint();
  }
  listen(window, 'blur', invalidateInput);
  listen(document, 'visibilitychange', () => document.hidden ? pause('visibility') : resume('visibility'));
  if (sceneApi) {
    listen(sceneApi.canvas, 'webglcontextlost', event => { event.preventDefault(); pause('context'); });
    listen(sceneApi.canvas, 'webglcontextrestored', () => { sceneApi.restoreContext?.(); resume('context'); });
  }
  function rebuildGates() {
    const gate = currentFlightGate(state), key = `${gate.id}:${state.attempt}`;
    if (key === gateKey) return;
    gateKey = key; gateCleanups.forEach(clean => clean()); gateCleanups = [];
    el('gates').replaceChildren();
    buttons = currentFlightChoices(state).map(choice => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'rr-word-gate';
      button.dataset.rrChoice = choice.lane; button.dataset.choiceId = choice.id;
      button.setAttribute('aria-label', `Fly to ${choice.word}`);
      const word = document.createElement('span'); word.className = 'rr-word'; word.textContent = choice.word;
      button.appendChild(word); el('gates').appendChild(button);
      gateCleanups.push(attachRelease(button, () => nominate(choice.lane), () => epoch));
      return button;
    });
  }
  function showCard(title, description, label, action, kind) {
    cardCleanup?.(); invalidateInput();
    const overlay = el('overlay'); restoreRocketRunHud(hud, overlay); overlay.replaceChildren();
    const card = document.createElement('section'); card.className = 'rr-card';
    const heading = document.createElement('h2'); heading.textContent = title;
    const copy = document.createElement('p'); copy.textContent = description;
    const button = document.createElement('button'); button.type = 'button'; button.dataset.rr = kind; button.textContent = label;
    card.append(heading, copy, button); overlay.appendChild(card); overlay.style.display = 'grid';
    const cardReleases = [attachRelease(button, () => {
      if ((kind === 'intro-play' ? pauses.size > 0 : state.paused) || action() === false) return;
      restoreRocketRunHud(hud, overlay); overlay.style.display = 'none'; paint();
    }, () => epoch)];
    if (kind === 'intro-play') {
      const hear = document.createElement('button'); hear.type = 'button'; hear.dataset.rr = 'intro-hear'; hear.textContent = 'Hear instructions';
      card.appendChild(hear); cardReleases.push(attachRelease(hear, playIntro, () => epoch));
    }
    cardCleanup = () => cardReleases.forEach(clean => clean());
    if (kind === 'done') isolateRocketRunCompletion(hud, overlay, button);
    else isolateRocketRunActionOverlay(hud, overlay, button, kind === 'intro-play' ? 'Rocket Run instructions' : 'Rocket Run delivery');
  }
  function checkpoint() {
    stopAudio(); options.onCheckpoint?.(state.round + 1, state.plan.length);
    showCard(sectorForRound(state.round).delivery, `${state.deliveries.length} of ${state.plan.length} deliveries complete.`, 'Next delivery', () => {
      if (!continueFlight(state)) return false;
      options.onProgressUpdate?.(state.round + 1, state.plan.length); paint(); requestCue(); return true;
    }, 'next');
  }
  function complete() {
    if (finished) return;
    finished = true; stopAudio(); saveReceipt();
    const receipt = state.receipt;
    options.onComplete?.(receipt.stars, receipt.score, receipt.words, receipt.evidence);
    if (options.getSound()) playCelebrationFanfare();
    showCard('Delivery complete', `${receipt.words} word ${receipt.words === 1 ? 'gate' : 'gates'} powered. Supplies have arrived.`, 'Back to Arcade', () => options.onExit?.(), 'done');
  }
  function simulate(delta) {
    if (state.paused || introActive) return;
    if (held && held.epoch === epoch) {
      held.remaining -= delta;
      if (held.remaining <= 0) { move(held.direction); held.remaining += 0.22; }
    }
    // Show the flight response immediately, but retain its readable/spoken
    // correction until delivery ends. Rendering/motor motion cannot grade it.
    if (feedbackWaiting && ['commit', 'return'].includes(state.phase) && state.time + delta >= (state.phase === 'commit' ? 0.9 : 1.15)) return;
    const change = advanceFlight(state, delta);
    if (change) invalidateInput();
    if (change === 'gate' || change === 'retry') requestCue();
    if (change === 'checkpoint') checkpoint();
    if (change === 'complete') complete();
  }
  function paint(delta = 0) {
    if (disposed) return;
    rebuildGates();
    const gate = currentFlightGate(state), sector = sectorForRound(state.round);
    const layout = sceneApi?.render(state, state.paused ? 0 : delta, reduced) || flightLayout(mount.clientWidth, mount.clientHeight);
    hud.dataset.rocketLane = state.lane; hud.dataset.phase = state.phase; hud.dataset.paused = state.paused;
    hud.dataset.audioDelivery = state.audio; hud.dataset.firstResponses = state.firstResponses.length;
    hud.dataset.introDelivery = introDelivery; hud.dataset.feedbackDelivery = feedbackDelivery;
    hud.dataset.assistedRetries = state.assistedRetries.length; hud.dataset.gateId = gate.id; hud.dataset.sector = sector.id;
    el('letter').textContent = gate.target; el('prompt').textContent = `Find the ${gate.target} word`;
    el('route').textContent = sector.name; el('deliveries').textContent = `${state.deliveries.length}/${state.plan.length}`;
    const active = !state.paused && !introActive && ['approach', 'decision'].includes(state.phase);
    const feedback = !state.paused && !introActive && ['commit', 'return'].includes(state.phase);
    el('hear-target').disabled = !options.getSound() || (!active && !feedback);
    el('hear-target').setAttribute('aria-label', options.getSound() ? feedback ? 'Hear feedback again' : `Hear the ${gate.target} sound again` : `Target ${gate.target}; sound is off`);
    if (introActive) {
      const launch = el('intro-play'), hear = el('intro-hear');
      if (launch) {
        launch.disabled = pauses.size > 0 || ['pending', 'loading', 'started'].includes(introDelivery);
        launch.textContent = ['failed', 'unavailable', 'interrupted'].includes(introDelivery) ? 'Read and launch' : 'Launch rocket';
      }
      if (hear) hear.disabled = pauses.size > 0 || !options.getSound();
    }
    if (el('next')) el('next').disabled = state.paused;
    el('left').disabled = !active; el('right').disabled = !active;
    el('fly').disabled = introActive || !flightCanCommit(state);
    buttons.forEach((button, index) => {
      button.style.left = `${layout.centres[index]}px`; button.style.top = `${layout.labelY}px`; button.style.width = `${layout.labelWidth}px`;
      button.disabled = !active || state.phase !== 'decision';
      button.setAttribute('aria-pressed', String(state.nominated && state.lane === index));
    });
    el('gates').hidden = ['checkpoint', 'complete'].includes(state.phase);
    const support = state.support.includes('printed_sound_support');
    const audioRecovery = active && !support && ['failed', 'unavailable', 'interrupted'].includes(state.audio);
    el('audio-recovery').hidden = !audioRecovery;
    hud.querySelector('.rr-controls').hidden = audioRecovery;
    hud.querySelector('.rr-feedback').hidden = audioRecovery;
    const text = state.feedback || (state.phase === 'approach' ? 'Find your word gate.' : state.nominated ? 'Ready? Fly through your gate.' : 'Choose a word gate.');
    if (el('feedback').textContent !== text) el('feedback').textContent = text;
    el('support-copy').textContent = feedback && ['failed', 'unavailable'].includes(feedbackDelivery) ? 'Feedback sound unavailable · read the clue'
      : support ? 'Reading support · sound is not scored' : audioBusy ? 'Listen to the sound and words' : sceneApi ? '' : 'Flight panels · 3D graphics unavailable';
    if (!sceneApi) {
      const flatShip = hud.querySelector('.rr-flat-ship');
      const travel = state.phase === 'commit' ? Math.min(1, state.time / 0.75)
        : state.phase === 'return' ? Math.sin(Math.min(1, state.time / 1.15) * Math.PI) * 0.35 : 0;
      const launchX = layout.shipCentres[state.lane];
      flatShip.style.left = `${launchX + (layout.centres[state.lane] - launchX) * travel}px`;
      flatShip.style.top = `${layout.shipY + (layout.labelY - layout.shipY) * travel}px`;
      flatShip.style.width = `${layout.sideLaunch ? layout.shipHeight : Math.min(54, layout.shipWidth)}px`;
      flatShip.style.height = `${layout.sideLaunch ? layout.shipWidth : layout.shipHeight}px`;
      flatShip.style.transform = `translate(-50%, -50%) rotate(${layout.sideLaunch ? 90 : 0}deg) scale(${1 - travel * 0.3})`;
    }
  }
  function tick(now) {
    if (disposed) return;
    frame = requestAnimationFrame(tick); syncSound();
    const delta = Math.min(0.1, Math.max(0, (now - previous) / 1000)); previous = now;
    accumulator = Math.min(0.1, accumulator + delta);
    while (accumulator >= FLIGHT_STEP) { simulate(FLIGHT_STEP); accumulator -= FLIGHT_STEP; }
    paint(delta);
  }
  options.onSessionStart?.(); options.onCheckpoint?.(state.round, state.plan.length);
  options.onProgressUpdate?.(state.round + 1, state.plan.length); paint();
  if (introActive) {
    state.paused = true;
    showCard('Rocket Run', ROCKET_INSTRUCTION, 'Launch rocket', () => {
      if (['pending', 'loading', 'started'].includes(introDelivery)) return false;
      if (introDelivery !== 'completed') recordPrintedSupport();
      stopAudio(); markOnboardingSeen('rocket-run'); introActive = false;
      state.audio = 'pending'; resume('intro'); return true;
    }, 'intro-play');
    playIntro();
  } else requestCue();
  frame = requestAnimationFrame(tick);
  const snapshot = () => ({ phase: state.phase, round: state.round, gate: state.gate, attempt: state.attempt,
    lane: state.lane, nominated: state.nominated, paused: state.paused, time: state.time, audio: state.audio, introDelivery, feedbackDelivery,
    choices: currentFlightChoices(state), target: currentFlightGate(state).target, word: currentFlightGate(state).word,
    firstResponses: state.firstResponses, assistedRetries: state.assistedRetries, mediaEvents: state.mediaEvents,
    support: state.support, receipt: state.receipt, score: state.score, deliveries: state.deliveries, scene: sceneApi?.snapshot() });
  if (diagnostics) window.__rocketRun = Object.freeze({ snapshot, plan: state.plan,
    step(seconds) { for (let i = 0; i < Math.ceil(Math.min(4, seconds) / FLIGHT_STEP); i++) simulate(FLIGHT_STEP); paint(); },
    seek(round, gate = 0) {
      stopAudio(); invalidateInput(); restoreRocketRunHud(hud, el('overlay')); el('overlay').style.display = 'none';
      state = createFlightRun(options.difficulty, round, seed); state.gate = Math.max(0, Math.min(state.plan[state.round].gates.length - 1, gate));
      state.paused = pauses.size > 0 || introActive; receiptSent = false; finished = false; gateKey = '';
      options.onSessionStart?.(); paint(); requestCue();
    }
  });
  return { pause, resume, teardown() {
    disposed = true; stopAudio(); invalidateInput(); cancelAnimationFrame(frame);
    cleanups.forEach(clean => clean()); gateCleanups.forEach(clean => clean()); cardCleanup?.();
    restoreRocketRunHud(hud, el('overlay')); sceneApi?.dispose(); hud.remove();
    if (diagnostics) delete window.__rocketRun;
  } };
}

export default function RocketRunGame({ difficulty = 'easy', startLevel = 0, onScoreUpdate, onProgressUpdate,
  onComplete, onResultReady, onSessionStart, onCheckpoint, onEngineReady, onExit, isSoundEnabled = true }) {
  const mountRef = useRef(null), soundRef = useRef(isSoundEnabled);
  const [status, setStatus] = useState('loading');
  useEffect(() => { soundRef.current = isSoundEnabled; }, [isSoundEnabled]);
  useEffect(() => {
    let cancelled = false, api;
    loadThree().catch(() => null).then(THREE => {
      if (cancelled || !mountRef.current) return;
      try {
        api = startRocket(THREE, mountRef.current, { difficulty, startLevel, onScoreUpdate, onProgressUpdate,
          onComplete, onResultReady, onSessionStart, onCheckpoint, onExit, getSound: () => soundRef.current });
        onEngineReady?.(api); setStatus('playing');
      } catch (error) { console.error('[RocketRun] startup failed:', error); setStatus('error'); }
    });
    return () => { cancelled = true; api?.teardown(); };
    // Parent score updates must not recreate the scene or alter a pending answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);
  return <div className="rocket-run" ref={mountRef}>
    {status === 'loading' && <div className="rr-loading">Loading the cargo hangar…</div>}
    {status === 'error' && <div className="rr-loading" role="alert">The flight could not start. Close and reopen Rocket Run.</div>}
  </div>;
}
