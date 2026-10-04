import { getArcadeCuePicture } from '../../../../data/arcadeCuePictures.js';
import { isInteractiveKeyTarget } from '../../../../utils/interactiveEventTarget.js';
import { speakWord } from '../../../../utils/learnGamesAudio.js';
import { playPopSound, playSoftBuzz, playTapSound, playWhoosh } from '../../../../utils/audio/gameSfx.js';
import { createRhymePopCueQueue } from '../../../../utils/audio/rhymePopCueQueue.js';
import { createLearningDwell, LEARNING_PACE } from '../../../../utils/learningPace.js';
import { rhymePopV2Ladder } from '../../../../utils/rhymePopV2Levels.js';
import { rhymePopStars } from '../../../../utils/rhymePopLevels.js';
import { stepRhymeProjectile, rhymeLauncherGeometry, stepRhymeBalloon } from '../../../../utils/rhymePopMotion.js';
import { loadRhymePopSession, saveRhymePopSession, newRhymePopEvidence, rhymePopResponse, completeRhymePopFamily,
  RHYME_POP_CONTENT_VERSION, RHYME_POP_CONSTRUCT } from '../../../../utils/rhymePopSession.js';
import { createRhymePopWorld, rhymePopStageLayout } from './rhymePopWorld.js';

const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
const duplicate = value => structuredClone(value);

export function createRhymePopEngine(mount, options) {
  const { difficulty, sessionSeed: seed, journey, startLevel = 0, progressScopeKey: scope } = options;
  const ladder = rhymePopV2Ladder(difficulty, seed), stage = clamp(Number(startLevel) || 0, 0, ladder.length - 1), journeyIndex = journey?.index || 0;
  const restored = loadRhymePopSession(scope, difficulty, { seed, stage, journeyIndex, ladder });
  let epoch = performance.now() - (restored?.elapsed || 0)*1000, pausedAt = null, previousFrame, frameId, disposed = false;
  let width = 1, height = 1, dwell = null, world;
  const canvas = document.createElement('canvas'); canvas.className = 'rp-authored-world'; canvas.setAttribute('aria-hidden', 'true'); mount.prepend(canvas);
  const state = { stage, originStage: restored?.originStage ?? stage, level: ladder[stage], evidence: restored?.evidence || newRhymePopEvidence(),
    score: restored?.score || 0, mistakes: restored?.mistakes || 0, hintMistakes: restored?.hintMistakes || 0,
    supportReasons: [...new Set([...(restored?.supportReasons || []), ...(restored ? ['resumed-practice'] : [])])],
    acceptedWords: restored?.acceptedWords || [], balloons: restored?.balloons || [], celebrating: restored?.celebrating || false,
    paused: false, complete: false, elapsed: restored?.elapsed || 0, aim: { x: 0, y: 0 }, keyboardBubbleId: null,
    actionAt: -Infinity, actionSource: 'pointer', intendedId: null, queuedShot: null, shots: [], bursts: [], errorAt: -Infinity,
    lastWrongId: null, celebrationAt: restored?.celebrating ? restored.elapsed : null, coach: '', saveError: false, combo: 0,
    nextId: restored?.nextId || 1, motorMisses: 0, motorInterceptions: 0 };
  const clock = () => ((pausedAt ?? performance.now()) - epoch)/1000;
  const sfx = play => { if (options.getSound()) try { play(); } catch { /* sound failure cannot block aim/fire */ } };
  function markSupported(reason) { state.supportReasons = [...new Set([...state.supportReasons, reason])]; }
  const cue = createRhymePopCueQueue({ play: async (request, { signal }) => {
    if (!options.getSound() || state.paused || request.stage !== state.stage) return null;
    return speakWord(request.word, { signal, onEnd: src => {
      if (disposed || signal.aborted || state.paused || request.stage !== state.stage) return;
      state.evidence.audioReceipts.push({ stage: request.stage, round: request.stage, word: request.word,
        kind: request.receiptKind, src, at: clock() }); persist();
    } });
  } });
  function speakTarget(manual = false) {
    if (manual) markSupported('word-replay');
    if (!options.getSound()) { markSupported('sound-disabled'); return; }
    cue.request({ stage: state.stage, word: state.level.targetWord, kind: 'target', receiptKind: 'target' }, { manual, required: true });
  }
  function speakHit(word, wrong) {
    if (!options.getSound()) return;
    const candidate = { stage: state.stage, word, kind: 'unit', receiptKind: 'candidate' };
    if (wrong) cue.request([candidate, { stage: state.stage, word: state.level.targetWord, kind: 'blend', receiptKind: 'target' }],
      { replaceKey: 'wrong-contrast' });
    else cue.request(candidate);
  }
  function persist(notifyHud = true) {
    state.elapsed = clock();
    const result = saveRhymePopSession(scope, difficulty, { seed, journeyIndex, stage: state.stage, originStage: state.originStage, word: state.level.targetWord,
      elapsed: state.elapsed, score: state.score, mistakes: state.mistakes, hintMistakes: state.hintMistakes, supportReasons: state.supportReasons,
      acceptedWords: state.acceptedWords, celebrating: state.celebrating, evidence: state.evidence, nextId: state.nextId,
      balloons: state.balloons.map(({ id, word, kind, slot, phase, travel, direction, entering }) => ({ id, word, kind, slot, phase, travel, direction, entering })) });
    state.saveError = !result.localSaved; if (notifyHud) notify(); return result;
  }
  function notify() {
    options.onHud({ stage: state.stage, totalStages: ladder.length, act: state.level.act, score: state.score,
      picture: getArcadeCuePicture(state.level.targetWord), accepted: state.acceptedWords.length, totalRhymes: state.level.rhymingWords.length,
      hintMistakes: state.hintMistakes, celebrating: state.celebrating, target: state.celebrating ? state.level.targetWord : '',
      coach: state.coach, saveError: state.saveError, choices: state.balloons.map(({ id, word }) => ({ id, word })),
      focusedWord: state.balloons.find(row => row.id === state.keyboardBubbleId)?.word || '' });
  }
  function fillChoices() {
    const remaining = state.level.rhymingWords.filter(word => !state.acceptedWords.includes(word) && !state.balloons.some(row => row.word === word));
    const desired = Math.min(state.level.correctVisible, remaining.length + state.balloons.filter(row => row.kind === 'rhyme').length);
    while (state.balloons.length < state.level.visibleBalloons && state.acceptedWords.length < state.level.rhymingWords.length) {
      const correct = state.balloons.filter(row => row.kind === 'rhyme').length < desired;
      const pool = correct ? remaining : state.level.distractors.filter(word => !state.balloons.some(row => row.word === word));
      const word = pool.shift(); if (!word) break;
      const vacant = Array.from({ length: state.level.visibleBalloons }, (_, slot) => slot).filter(slot => !state.balloons.some(row => row.slot === slot));
      const slot = vacant[(seed + state.stage * 17 + state.nextId * 11) % vacant.length];
      const id = state.nextId++;
      state.balloons.push({ id, word, kind: correct ? 'rhyme' : 'distractor', slot, phase: id*1.8 + state.stage*.9,
        travel: 0, direction: id%2 ? 1 : -1, entering: state.acceptedWords.length > 0 });
    }
  }
  function placeBalloons(dt) {
    const layout = rhymePopStageLayout(width, height, state.level.visibleBalloons);
    for (const balloon of state.balloons) Object.assign(balloon, stepRhymeBalloon(balloon, layout, state.level, state.elapsed, dt));
  }
  function finishFamily() {
    state.celebrating = true; state.celebrationAt = clock(); state.coach = 'Your rhyme family is complete!'; state.shots = []; state.queuedShot = null;
    state.evidence = completeRhymePopFamily(state.evidence, state.level, state.stage, state.supportReasons); persist();
    dwell?.cancel(); dwell = createLearningDwell({ minimumMs: LEARNING_PACE.word, onAdvance: () => {
      if (disposed) return;
      if (state.stage + 1 === ladder.length) {
        state.complete = true; options.onProgressUpdate?.(ladder.length, ladder.length);
        options.onComplete?.(rhymePopStars({ correct: state.evidence.acceptedResponses.length, total: (ladder.length-state.originStage)*6, mistakes: state.mistakes }),
          state.score, state.evidence.acceptedResponses.length, { contentVersion: RHYME_POP_CONTENT_VERSION, construct: RHYME_POP_CONSTRUCT,
            sessionSeed: seed, journeyIndex, originStage: state.originStage, practiceOnly: true, formalAssessment: false, masteryClaim: false, motorCreatesEvidence: false,
            firstResponses: duplicate(state.evidence.firstResponses), assistedRetries: duplicate(state.evidence.assistedRetries),
            acceptedResponses: duplicate(state.evidence.acceptedResponses), completions: duplicate(state.evidence.completions) });
      } else {
        state.stage++; state.level = ladder[state.stage]; state.acceptedWords = []; state.balloons = []; state.hintMistakes = 0;
        state.supportReasons = options.getSound() ? [] : ['sound-disabled']; state.celebrating = false; state.celebrationAt = null; state.coach = ''; state.combo = 0;
        state.keyboardBubbleId = null; cue.cancel(); fillChoices(); placeBalloons(0); speakTarget(); persist();
        options.onCheckpoint?.(state.stage, ladder.length); options.onProgressUpdate?.(state.stage, ladder.length); sfx(playWhoosh);
      }
    } }); dwell.waitFor(cue.whenRequiredIdle());
  }
  function resolveHit(shot, balloon) {
    const correct = balloon.kind === 'rhyme';
    if (shot.intendedId && shot.intendedId !== balloon.id) {
      state.motorInterceptions++; state.coach = 'A balloon crossed your shot. Aim and try again.'; markSupported('motor-interception'); notify(); persist(); return;
    }
    const receipt = [...state.evidence.audioReceipts].reverse().find(row => row.stage === state.stage && row.word === state.level.targetWord && row.kind === 'target');
    const cueKind = getArcadeCuePicture(state.level.targetWord).kind;
    state.evidence = rhymePopResponse(state.evidence, state.level, { stage: state.stage, unit: state.acceptedWords.length, selected: balloon.word,
      choices: state.balloons, source: shot.source, at: clock(), supportReasons: state.supportReasons, receipt, cueKind,
      points: 140 + Math.min(6, state.combo + 1)*20 }).evidence;
    speakHit(balloon.word, !correct);
    if (correct) {
      state.acceptedWords.push(balloon.word); state.combo++; state.balloons = state.balloons.filter(row => row.id !== balloon.id);
      state.score = state.evidence.acceptedResponses.reduce((sum, row) => sum + row.points, 0); options.onScoreUpdate?.(state.score);
      state.bursts.push({ x: balloon.x, y: balloon.y, at: clock() }); state.coach = `${balloon.word} rhymes!`; sfx(playPopSound);
      if (state.acceptedWords.length === state.level.rhymingWords.length) finishFamily();
      else { fillChoices(); persist(); }
    } else {
      // A wrong word stays in this physical encounter, including its ID and
      // all other choices. Teaching support cannot silently replace the task.
      state.mistakes++; state.hintMistakes++; state.combo = 0; state.errorAt = clock(); state.lastWrongId = balloon.id;
      markSupported('rhyme-retry'); state.coach = `${balloon.word} has a different ending sound. Listen and try again.`; sfx(playSoftBuzz); persist();
    }
    notify();
  }
  function fire(source = 'assistive') {
    if (state.paused || state.complete || state.celebrating || state.queuedShot || state.shots.length >= 2) return;
    const selected = state.balloons.find(row => row.id === state.keyboardBubbleId);
    const aim = selected ? { x: selected.x, y: selected.y } : { ...state.aim };
    const intended = selected || state.balloons.find(row => Math.hypot(row.x-aim.x, row.y-aim.y) <= row.r);
    state.aim = aim; state.actionAt = clock(); state.actionSource = source;
    state.queuedShot = { at: state.actionAt+.085, aim, intendedId: intended?.id || null, source }; sfx(playTapSound);
  }
  function simulate(dt) {
    placeBalloons(dt);
    if (state.queuedShot && state.elapsed >= state.queuedShot.at) {
      const pending = state.queuedShot, geometry = rhymeLauncherGeometry(width, height, pending.aim), speed = clamp(width*.7, 560, 860);
      state.shots.push({ x: geometry.muzzle.x, y: geometry.muzzle.y, vx: geometry.direction.x*speed, vy: geometry.direction.y*speed,
        r: clamp(width*.019, 18, 28), trail: [], source: pending.source, intendedId: pending.intendedId, origin: { ...geometry.muzzle } }); state.queuedShot = null;
    }
    for (const shot of state.shots) {
      const from = { x: shot.x, y: shot.y };
      shot.trail.push(from); if (shot.trail.length > 8) shot.trail.shift();
      const path = stepRhymeProjectile(shot, dt, width, state.balloons), hit = path.impact;
      shot.x = path.x; shot.y = path.y; shot.vx = path.vx; shot.banks = (shot.banks || 0)+path.banks;
      if (hit) { shot.dead = true; resolveHit(shot, hit.balloon); }
      else if (shot.y < -80 || shot.y > height+80) { shot.dead = true; state.motorMisses++; }
      if (state.celebrating) break;
    }
    state.shots = state.shots.filter(shot => !shot.dead); state.bursts = state.bursts.filter(burst => state.elapsed-burst.at < .5);
  }
  function select(direction) {
    if (state.paused || state.complete || state.celebrating || !state.balloons.length) return;
    const rows = [...state.balloons].sort((a, b) => a.slot-b.slot), old = rows.findIndex(row => row.id === state.keyboardBubbleId);
    const index = old < 0 ? direction < 0 ? rows.length-1 : 0 : (old + direction + rows.length) % rows.length;
    const selected = rows[index]; state.keyboardBubbleId = selected.id;
    state.aim = { x: selected.x, y: selected.y }; notify();
  }
  function pause() { if (state.paused) return; pausedAt = performance.now(); state.paused = true; state.queuedShot = null; cue.cancel(); dwell?.pause(); persist(); }
  function resume() { if (!state.paused) return; epoch += performance.now()-pausedAt; pausedAt = null; state.paused = false;
    markSupported('resumed-practice'); speakTarget(); if (dwell?.active) { dwell.waitFor(cue.whenRequiredIdle()); dwell.resume(); } previousFrame = undefined;
    const host = mount.closest('.lg-game-player-main'); if (host && !host.contains(document.activeElement)) host.focus({ preventScroll: true }); persist(); }
  function pointer(event, shoot = false) {
    const rect = canvas.getBoundingClientRect(); state.aim = { x: event.clientX-rect.left, y: event.clientY-rect.top }; state.keyboardBubbleId = null;
    if (shoot) { event.preventDefault(); fire('pointer'); }
  }
  const move = event => pointer(event), down = event => { if (!state.paused) pointer(event, true); };
  function onKeyDown(event) {
    if (event.repeat || state.paused || disposed) return;
    if (isInteractiveKeyTarget(event.target)) return;
    const active = document.activeElement, host = mount.closest('.lg-game-player-main');
    if (!(active === host || active === mount)) return;
    if (['ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D'].includes(event.key)) { event.preventDefault(); select(['ArrowLeft', 'a', 'A'].includes(event.key) ? -1 : 1); }
    else if ([' ', 'Enter', 'ArrowUp'].includes(event.key)) { event.preventDefault(); fire('keyboard'); }
  }
  const hidden = () => { if (document.hidden) pause(); }, pageHide = () => pause();
  function resize() { const bounds = mount.getBoundingClientRect(); width = bounds.width; height = bounds.height; world.resize(width, height);
    if (!state.aim.x) state.aim = { x: width*.5, y: height*.36 }; placeBalloons(0); notify(); }
  world = createRhymePopWorld(canvas, { difficulty, onDelivery: options.onDelivery });
  const observer = new ResizeObserver(resize); observer.observe(mount); resize(); fillChoices(); placeBalloons(0); notify();
  canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerdown', down); window.addEventListener('keydown', onKeyDown);
  document.addEventListener('visibilitychange', hidden); window.addEventListener('pagehide', pageHide);
  function frame(at) {
    if (disposed) return; state.elapsed = clock();
    const dt = previousFrame == null ? 0 : Math.min(.05, Math.max(0, (at-previousFrame)/1000)); previousFrame = at;
    if (!state.paused && !state.complete && !state.celebrating) simulate(dt);
    world.draw(state, at); options.onChoicePositions?.(state.balloons); frameId = requestAnimationFrame(frame);
  }
  frameId = requestAnimationFrame(frame); options.onSessionStart?.(); options.onCheckpoint?.(stage, ladder.length);
  options.onProgressUpdate?.(stage, ladder.length); options.onScoreUpdate?.(state.score); speakTarget(); if (state.celebrating) finishFamily(); persist();
  return { pause, resume, select, fire, aimWord(id, source = 'assistive', position = null) {
      const balloon = state.balloons.find(row => row.id === id); if (!balloon) return;
      state.keyboardBubbleId = position ? null : id; state.aim = position || { x: balloon.x, y: balloon.y }; fire(source);
    }, replay: () => { speakTarget(true); if (dwell?.active) dwell.waitFor(cue.whenRequiredIdle()); persist(); }, retrySave: persist,
    markSupported(reason) { markSupported(reason); persist(); },
    soundChanged(enabled) { if (!enabled) { cue.cancel(); markSupported('sound-disabled'); persist(); } else speakTarget(); },
    debugSnapshot() { return duplicate({ stage: state.stage, sessionSeed: seed, journeyIndex, originStage: state.originStage,
      score: state.score, mistakes: state.mistakes, paused: state.paused, complete: state.complete,
      elapsedSeconds: clock(), currentTask: { targetWord: state.level.targetWord, totalRhymes: state.level.rhymingWords.length, correctFound: state.acceptedWords.length },
      acceptedWords: state.acceptedWords, hintMistakes: state.hintMistakes, bubbles: state.balloons, shots: state.shots,
      keyboardBubbleId: state.keyboardBubbleId, evidence: state.evidence, motorMisses: state.motorMisses, motorInterceptions: state.motorInterceptions,
      roundPendingAdvance: state.celebrating, performance: world.inspect() }); },
    destroy() { persist(false); disposed = true; cue.dispose(); dwell?.cancel(); cancelAnimationFrame(frameId); observer.disconnect(); world.dispose();
      canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerdown', down); window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', hidden); window.removeEventListener('pagehide', pageHide); canvas.remove(); }
  };
}
