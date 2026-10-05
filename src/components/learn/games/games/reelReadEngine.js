import { getArcadeCuePicture } from '../../../../data/arcadeCuePictures.js';
import { speakWord } from '../../../../utils/learnGamesAudio.js';
import { playTapSound, playPopSound, playSoftBuzz, playStarChime, playWhoosh } from '../../../../utils/audio/gameSfx.js';
import { createRhymePopCueQueue as createRecordedCueQueue } from '../../../../utils/audio/rhymePopCueQueue.js';
import { createLearningDwell, LEARNING_PACE } from '../../../../utils/learningPace.js';
import { phonicsTargetHint } from '../../../../utils/phonicsTargetPresentation.js';
import { reelReadV2Ladder } from '../../../../utils/reelReadV2Levels.js';
import { newReelReadEvidence, reelReadHookResponse, completeReelReadTrip, reelReadEvidenceScore,
  REEL_READ_CONTENT_VERSION, REEL_READ_CONSTRUCT } from '../../../../utils/reelReadEvidence.js';
import { reelReadLandAcceptedFish, reelReadTaskDescription, reelReadTripPartsComplete } from '../../../../utils/reelReadHookDecision.js';
import { loadReelReadSession, saveReelReadSession } from '../../../../utils/reelReadSession.js';
import { fillReelReadSchool, beginReelReadCast, stepReelReadSimulation } from '../../../../utils/reelReadSimulation.js';
import { reelReadStageLayout, stepReelReadFish } from '../../../../utils/reelReadMotion.js';
import { forecastReelReadAlignedCast, REEL_READ_AIM_INTERVAL_SECONDS } from '../../../../utils/reelReadCastAim.js';
import { reelReadKeyboardAllowed, reelReadKeyAction } from '../../../../utils/reelReadInput.js';
import { createReelReadWorld } from './reelReadWorld.js';

const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
const duplicate = value => structuredClone(value);
const summary = values => {
  if (!values.length) return { samples: 0, mean: null, p95: null, max: null };
  const sorted = [...values].sort((a,b) => a-b);
  return { samples: values.length, mean: values.reduce((sum,n) => sum+n,0)/values.length,
    p95: sorted[Math.floor((sorted.length-1)*.95)], max: sorted[sorted.length-1] };
};

/** Owns the complete fishing loop. Renderer/socket registration and the
 * fixed-step motor simulation share geometry; only real hook decisions write
 * language evidence. No answer-selection or encounter-advance QA controller. */
export function createReelReadEngine(mount, options) {
  const { difficulty, sessionSeed: seed, journey, startLevel = 0, progressScopeKey: scope } = options;
  const ladder = reelReadV2Ladder(difficulty, seed), stage = clamp(Number(startLevel)||0, 0, ladder.length-1);
  const journeyIndex = journey?.index || 0, restored = loadReelReadSession(scope, difficulty, { seed, stage, journeyIndex, ladder });
  let epoch = performance.now()-(restored?.foregroundElapsed??restored?.elapsed??0)*1000, pausedAt = null, previousFrame = null, accumulator = 0;
  let frameId, disposed = false, world, width = 1, height = 1, dwell = null, lastHudAt = -Infinity, lastSaveAt = -Infinity;
  const held = new Map(), frameIntervals = [], inputIntervals = [];
  const aimCosts = [];
  let lastAimAt = -Infinity, aimSteering = 0, aimForecastCount = 0, lastAim = null;
  let pendingInput = null, artReadyAt = null;
  const state = { stage, originStage: restored?.originStage ?? stage, level: ladder[stage],
    evidence: restored?.evidence || newReelReadEvidence(), elapsed: restored?.elapsed || 0,
    boatPosition: restored?.boatPosition ?? .34, boatVelocity: 0, facing: restored?.facing || 'right',
    acceptedWords: restored?.acceptedWords || [], landedWords: restored?.landedWords || [], fish: restored?.fish || [],
    nextId: restored?.nextId || 1, score: restored?.score || 0, mistakes: restored?.mistakes || 0, hintMistakes: restored?.hintMistakes || 0,
    motorMisses: restored?.motorMisses || 0, motorEscapes: restored?.motorEscapes || 0, motorInterceptions: restored?.motorInterceptions || 0,
    supportReasons: [...new Set([...(restored?.supportReasons||[]), ...(restored ? ['resumed-practice'] : []),
      ...(!options.getSound() ? ['sound-disabled'] : [])])],
    paused: false, complete: false, celebrating: restored?.celebrating || false,
    celebrationAt: restored?.celebrating ? restored.elapsed : -Infinity,
    castAt: -Infinity, landedAt: -Infinity, escapeAt: -Infinity, errorAt: -Infinity,
    steering: 0, reeling: false, castPending: false, hook: null, fight: restored?.fight || null,
    steerPulseUntil: -Infinity, steerPulseDirection: 0,
    intendedFishId: null, autoSteerId: null, coach: '', saveError: false };
  const canvas = document.createElement('canvas'); canvas.className = 'rr-authored-world'; canvas.setAttribute('aria-hidden','true'); mount.prepend(canvas);
  const clock = () => ((pausedAt ?? performance.now())-epoch)/1000;
  const sfx = play => { if (options.getSound()) try { play(); } catch { /* physical play remains available */ } };
  const markSupported = reason => { state.supportReasons = [...new Set([...state.supportReasons, reason])]; };
  const cue = createRecordedCueQueue({ play: async (request, { signal }) => {
    if (!options.getSound() || state.paused || request.stage !== state.stage) return null;
    return speakWord(request.word, { signal, onEnd: src => {
      if (disposed || signal.aborted || state.paused || request.stage !== state.stage || request.kind !== 'target') return;
      state.evidence.audioReceipts.push({ stage: request.stage, round: request.stage, word: request.word,
        kind: 'target', src, at: clock() }); persist();
    } });
  } });
  function speakTarget(manual = false) {
    if (manual) markSupported('word-replay');
    if (!options.getSound()) { markSupported('sound-disabled'); return; }
    cue.request({ stage: state.stage, word: state.level.target, kind: 'target' }, { manual, required: true });
  }
  function speakHit(word, wrong) {
    if (!options.getSound()) return;
    // Spoken fragment/affix feedback is optional. Missing recordings settle
    // honestly; only the unchanged recorded whole-word target earns a receipt.
    const part = { stage: state.stage, word: word.replace(/^-|-$/g,''), kind: 'candidate' };
    cue.request(wrong ? [part, { stage: state.stage, word: state.level.target, kind: 'target' }] : part,
      wrong ? { replaceKey: 'wrong-contrast' } : {});
  }
  function sessionSnapshot() {
    const layout = reelReadStageLayout(width,height);
    return duplicate({ seed, journeyIndex, stage: state.stage, originStage: state.originStage, elapsed: state.elapsed, foregroundElapsed:clock(),
      boatPosition: state.boatPosition, facing: state.facing, acceptedWords: state.acceptedWords, landedWords: state.landedWords,
      nextId: state.nextId, score: state.score, mistakes: state.mistakes, hintMistakes: state.hintMistakes,
      motorMisses: state.motorMisses, motorEscapes: state.motorEscapes, motorInterceptions: state.motorInterceptions,
      supportReasons: state.supportReasons, celebrating: state.celebrating, evidence: state.evidence,
      fish: state.fish.map(({id,word,slot,phase,direction})=>({id,word,slot,phase,direction})),
      fight: state.fight && { ...state.fight,
        anchorXNormalized: clamp(state.fight.anchorX/width,0,1),
        anchorDepth: clamp((state.fight.anchorY-layout.waterTop)/Math.max(1,layout.controlsTop-layout.waterTop),0,1) } });
  }
  function persist(notifyHud = true) {
    const result = saveReelReadSession(scope,difficulty,sessionSnapshot()); state.saveError = !result.localSaved;
    lastSaveAt = state.elapsed; if (notifyHud) notify(); return result;
  }
  function notify() {
    const task = reelReadTaskDescription(state.level);
    options.onHud({ stage: state.stage, totalStages: ladder.length, pond: state.fight?.pond.name, compact:height<=420,
      score: state.score, picture: getArcadeCuePicture(state.level.target), instruction: task.instruction,taskMode:task.mode,
      compactInstruction:task.mode==='meaning'?task.operation==='opposite-meaning'?'Opposite words.':'Same meaning.':'Parts in order.',
      acceptedWords: [...state.acceptedWords], landedWords: [...state.landedWords], totalParts: state.level.correctWords.length,
      hintMistakes: state.hintMistakes, hint: task.mode === 'meaning'
        ? height<=420 ? task.operation==='opposite-meaning'?'Think: opposite.':'Think: same.'
          : task.operation === 'opposite-meaning' ? 'Listen. Think about opposite meanings.' : 'Listen. Think about the same meaning.'
        : phonicsTargetHint(state.level.target,state.hintMistakes),
      celebrating: state.celebrating, target: state.celebrating ? state.level.target : '',
      coach: state.coach, saveError: state.saveError, fighting: Boolean(state.fight), reeling: state.reeling,
      tension: state.fight?.tension || 0, lineProgress: state.fight ? 1-state.fight.remaining/state.fight.initialLength : 0,
      choices: state.fish.map(({id,word})=>({id,word})) }); lastHudAt = state.elapsed;
  }
  function finishTrip() {
    state.celebrating = true; state.celebrationAt = state.elapsed; state.coach = 'Your catch is complete!'; releaseInputs();
    state.evidence = completeReelReadTrip(state.evidence,state.level,state.stage,state.acceptedWords,state.landedWords,state.supportReasons,clock());
    state.score = reelReadEvidenceScore(state.evidence); options.onScoreUpdate?.(state.score); persist(); sfx(playStarChime);
    dwell?.cancel(); dwell = createLearningDwell({ minimumMs: LEARNING_PACE.word, onAdvance: () => {
      if (disposed) return;
      if (state.stage+1 === ladder.length) {
        state.complete = true;
        const stars = Math.round(state.evidence.completions.reduce((sum,row)=>sum+row.stars,0)/state.evidence.completions.length);
        options.onProgressUpdate?.(ladder.length,ladder.length);
        options.onComplete?.(stars,state.score,state.evidence.acceptedResponses.length,{ contentVersion: REEL_READ_CONTENT_VERSION,
          construct: REEL_READ_CONSTRUCT, sessionSeed: seed, journeyIndex, originStage: state.originStage,
          practiceOnly: true, formalAssessment: false, masteryClaim: false, motorCreatesEvidence: false,
          firstResponses: duplicate(state.evidence.firstResponses), assistedRetries: duplicate(state.evidence.assistedRetries),
          acceptedResponses: duplicate(state.evidence.acceptedResponses), completions: duplicate(state.evidence.completions) });
      } else {
        state.stage++; state.level = ladder[state.stage]; state.acceptedWords = []; state.landedWords = []; state.fish = [];
        state.hintMistakes = 0; state.supportReasons = options.getSound() ? [] : ['sound-disabled'];
        state.celebrating = false; state.celebrationAt = -Infinity; state.coach = ''; state.hook = null; state.fight = null;
        state.castPending = false; state.castAt = -Infinity; cue.cancel(); fillReelReadSchool(state,seed); placeSchool(); speakTarget(); persist();
        options.onCheckpoint?.(state.stage,ladder.length); options.onProgressUpdate?.(state.stage,ladder.length); sfx(playWhoosh);
      }
    } }); dwell.waitFor(cue.whenRequiredIdle());
  }
  function onHook(fish,source) {
    if (state.intendedFishId && state.intendedFishId !== fish.id) {
      state.motorInterceptions++; markSupported('motor-interception');
      state.coach = 'A fish crossed the line. Steer and cast again.'; state.intendedFishId = null; persist();
      return { kind: 'motor-interception' };
    }
    state.intendedFishId = null;
    const receipt = [...state.evidence.audioReceipts].reverse().find(row=>row.stage===state.stage&&row.word===state.level.target);
    const result = reelReadHookResponse(state.evidence,state.level,{ stage: state.stage, selected: fish.word,
      acceptedWords: state.acceptedWords, landedWords: state.landedWords, choices: state.fish, source, at: clock(),
      supportReasons: state.supportReasons, receipt, cueKind: getArcadeCuePicture(state.level.target).kind });
    state.evidence = result.evidence; state.acceptedWords = result.decision.acceptedWords;
    if (result.row) {
      speakHit(fish.word,!result.row.correct);
      if (!result.row.correct) {
        state.mistakes++; state.hintMistakes++; state.errorAt = state.elapsed; markSupported('word-parts-retry');
        state.coach = state.level.mode === 'meaning' ? 'That word does not match the clue. Listen and try again.'
          : 'That part does not fit here. Listen and try again.'; sfx(playSoftBuzz);
      } else { state.coach = state.level.mode==='meaning' ? 'Good match! Hold Reel. Let go to ease the line.'
        : 'Good part! Hold Reel. Let go to ease the line.'; sfx(playPopSound); }
      state.score = reelReadEvidenceScore(state.evidence); options.onScoreUpdate?.(state.score);
    } else state.coach = 'That catch is already accepted. Reel it back in.';
    persist(); return result.decision;
  }
  function onLand(fish) {
    if (!fish) return;
    state.landedWords = reelReadLandAcceptedFish(state.acceptedWords,state.landedWords,fish.word);
    state.fish = state.fish.filter(row=>row.id!==fish.id); state.coach = 'In the basket!'; sfx(playPopSound);
    if (reelReadTripPartsComplete(state.level,state.acceptedWords,state.landedWords)) finishTrip();
    else { fillReelReadSchool(state,seed); persist(); }
  }
  function onEscape() { markSupported('motor-escape'); state.coach = 'The fish got away. Your catch stays accepted. Cast again.'; persist(); }
  function onMiss() { state.intendedFishId = null; state.coach = 'No fish this time. Steer and cast again.'; notify(); }
  function placeSchool() {
    const layout = reelReadStageLayout(width,height);
    for (const fish of state.fish) if (fish.id !== state.fight?.fishId)
      Object.assign(fish,stepReelReadFish(fish,layout,state.level,state.elapsed));
  }
  function releaseInputs() { held.clear(); state.steering = 0; state.reeling = false; state.autoSteerId = null; state.boatVelocity = 0;
    state.steerPulseUntil=-Infinity; state.steerPulseDirection=0; }
  function controlsChanged() {
    state.steering = Number([...held.values()].includes('right'))-Number([...held.values()].includes('left'));
    state.reeling = [...held.values()].includes('cast');
  }
  function hold(action,pressed,source='pointer',owner=action) {
    if (state.paused || state.complete || state.celebrating) return;
    const key = `${source}:${owner}`;
    if (pressed) {
      held.set(key,action); pendingInput = performance.now();
      if (action === 'cast' && beginReelReadCast(state,source)) sfx(playTapSound);
      if (action !== 'cast') { state.autoSteerId = null; state.steerPulseDirection=action==='left'?-1:1;
        state.steerPulseUntil=state.elapsed+.08; state.facing=action==='left'?'left':'right'; }
    } else held.delete(key);
    controlsChanged(); persist();
  }
  function aimFish(id,source='assistive') {
    if (state.paused || state.complete || state.celebrating || state.hook || state.castPending || state.fight) return;
    const fish = state.fish.find(row=>row.id===id); if (!fish) return;
    state.autoSteerId = id; state.intendedFishId = id; state.actionSource = source;
    lastAimAt = -Infinity; aimSteering = 0;
    state.alignFacing = fish.x >= world.geometry(state).boatX ? 'right' : 'left'; state.facing = state.alignFacing;
    state.coach = 'Steering to your fish…'; markSupported('motor-alignment'); pendingInput = performance.now(); notify();
  }
  function autoSteer() {
    if (!state.autoSteerId) return;
    const fish = state.fish.find(row=>row.id===state.autoSteerId);
    if (!fish?.visible) { state.steering = 0; return; }
    if (state.elapsed-lastAimAt < REEL_READ_AIM_INTERVAL_SECONDS) { state.steering = aimSteering; return; }
    const began = performance.now(), forecast = forecastReelReadAlignedCast(state,state.autoSteerId,current=>world.geometry(current));
    aimCosts.push(performance.now()-began); if (aimCosts.length > 500) aimCosts.shift();
    aimForecastCount++; lastAimAt = state.elapsed;
    aimSteering = forecast?.steering || 0; state.steering = aimSteering;
    lastAim = forecast && { selectedId: state.autoSteerId, firstHitId: forecast.firstHit?.fishId || null,
      facing:forecast.facing,
      releaseColumn: forecast.releaseColumn, projectedFishX: forecast.projectedFishX,
      horizonSeconds: forecast.horizonSeconds, steps: forecast.steps };
    if (forecast?.firstHit?.fishId === state.autoSteerId) {
      state.steering = 0; aimSteering = 0;
      state.facing = forecast.facing; state.alignFacing = forecast.facing;
      state.autoSteerId = null; beginReelReadCast(state,state.actionSource);
      state.coach = 'Casting to your fish. Hold Reel when it bites.'; sfx(playTapSound);
    }
  }
  function pause() {
    if (state.paused || disposed) return; state.paused = true; pausedAt = performance.now(); releaseInputs();
    state.castPending = false; state.intendedFishId = null; if (!state.fight) state.hook = null;
    cue.cancel(); dwell?.pause(); previousFrame = null; accumulator = 0; persist();
  }
  function resume() {
    if (!state.paused || disposed) return;
    epoch += performance.now()-pausedAt; pausedAt = null; state.paused = false; previousFrame = null;
    markSupported('resumed-practice'); speakTarget();
    if (dwell?.active) { dwell.waitFor(cue.whenRequiredIdle()); dwell.resume(); }
    const main = mount.closest('.lg-game-player-main');
    if (!main?.contains(document.activeElement) && document.activeElement !== main) (main || mount).focus({ preventScroll:true });
    persist();
  }
  function onKeyDown(event) {
    if (state.paused || !reelReadKeyboardAllowed(event,mount,document.activeElement)) return;
    const action = reelReadKeyAction(event.key); if (!action) return;
    event.preventDefault(); if (!event.repeat) hold(action,true,'keyboard',event.code||event.key);
  }
  function onKeyUp(event) {
    const key = `keyboard:${event.code||event.key}`;
    if (held.delete(key)) { controlsChanged(); persist(); }
  }
  const hidden = () => { if (document.hidden) pause(); }, pageHide = () => pause(), blur = () => releaseInputs();
  function resize() {
    const oldWidth = width, oldLayout = reelReadStageLayout(width,height), rect = mount.getBoundingClientRect();
    width = Math.max(1,rect.width); height = Math.max(1,rect.height); world.resize(width,height);
    const layout = reelReadStageLayout(width,height);
    if (state.fight) {
      const fight = state.fight;
      const xNormalized = fight.anchorXNormalized ?? (Number.isFinite(fight.anchorX) ? fight.anchorX/oldWidth : .5);
      const depth = fight.anchorDepth ?? (Number.isFinite(fight.anchorY)
        ? (fight.anchorY-oldLayout.waterTop)/Math.max(1,oldLayout.controlsTop-oldLayout.waterTop) : .5);
      fight.anchorX = xNormalized*width;
      fight.anchorY = layout.waterTop+depth
        *(layout.controlsTop-layout.waterTop);
      const rod = world.geometry(state).rod, ratio = clamp(fight.remaining/fight.initialLength,0,1.12);
      if (rod) state.hook = { x: rod.tip.x+(fight.anchorX-rod.tip.x)*ratio,
        y: layout.waterTop+24+(fight.anchorY-layout.waterTop-24)*ratio, phase:'fight',source:'assistive' };
    } else if (state.hook) { state.hook.x *= width/oldWidth; state.hook.column *= width/oldWidth; }
    placeSchool(); world.draw(state,performance.now()); options.onChoicePositions?.(state.fish); notify();
  }
  function makeWorld() { return createReelReadWorld(canvas,{ difficulty,onDelivery: delivery => {
    options.onDelivery?.(delivery);
    if (!disposed && world) { world.draw(state,performance.now()); if (world.inspect().delivered && artReadyAt == null) artReadyAt = performance.now(); }
  } }); }
  world = makeWorld();
  if (!state.fish.length) fillReelReadSchool(state,seed);
  const observer = new ResizeObserver(resize); observer.observe(mount); resize();
  window.addEventListener('keydown',onKeyDown); window.addEventListener('keyup',onKeyUp); window.addEventListener('blur',blur);
  document.addEventListener('visibilitychange',hidden); window.addEventListener('pagehide',pageHide);
  function frame(at) {
    if (disposed) return;
    if (!state.paused && !state.complete) {
      const interval = previousFrame == null ? 0 : at-previousFrame;
      if (interval > 0 && artReadyAt != null && at-artReadyAt >= 2000) {
        frameIntervals.push(interval); if (frameIntervals.length > 1800) frameIntervals.shift();
      }
      accumulator += Math.min(.12,Math.max(0,interval/1000));
      while (accumulator >= 1/120) {
        controlsChanged();
        if (![...held.values()].some(action=>action==='left'||action==='right') && state.elapsed<state.steerPulseUntil)
          state.steering=state.steerPulseDirection;
        autoSteer(); const view = world.geometry(state);
        stepReelReadSimulation(state,1/120,{ ...view, resolveRod: current=>world.geometry(current).rod },{ onHook,onLand,onEscape,onMiss });
        accumulator -= 1/120;
      }
      world.draw(state,at); options.onChoicePositions?.(state.fish);
      if (pendingInput != null) { inputIntervals.push(performance.now()-pendingInput); if (inputIntervals.length > 500) inputIntervals.shift(); pendingInput = null; }
      if (state.elapsed-lastHudAt > .12) notify(); if (state.elapsed-lastSaveAt > 1) persist(false);
    }
    previousFrame = at; frameId = requestAnimationFrame(frame);
  }
  frameId = requestAnimationFrame(frame); options.onSessionStart?.(); options.onCheckpoint?.(stage,ladder.length);
  options.onProgressUpdate?.(stage,ladder.length); options.onScoreUpdate?.(state.score);
  speakTarget(); if (state.celebrating) finishTrip(); persist();
  return { pause,resume,hold,aimFish,retrySave:persist,
    tap(action) { if(action==='cast'&&state.fight) {
      const owner='assistive:toggle'; if(held.has(owner))held.delete(owner);else held.set(owner,'cast');controlsChanged();
      state.coach=state.reeling?'Reeling. Tap again to ease.':'Easing the line. Tap to reel.';notify();
    }else {hold(action,true,'assistive','tap');hold(action,false,'assistive','tap');} },
    retryArt() { world.dispose(); world=makeWorld(); world.resize(width,height); world.draw(state,performance.now()); notify(); },
    replay() { speakTarget(true); if (dwell?.active) dwell.waitFor(cue.whenRequiredIdle()); persist(); },
    markSupported(reason) { markSupported(reason); persist(); },
    soundChanged(enabled) { if (!enabled) { cue.cancel(); markSupported('sound-disabled'); persist(); } else speakTarget(); },
    debugSnapshot() { return duplicate({ stage:state.stage, originStage:state.originStage, sessionSeed:seed,journeyIndex,
      elapsedSeconds:state.elapsed, foregroundSeconds:clock(),paused:state.paused,complete:state.complete,score:state.score,
      acceptedWords:state.acceptedWords,landedWords:state.landedWords,hintMistakes:state.hintMistakes,mistakes:state.mistakes,
      currentTask:{targetWord:state.level.target,totalParts:state.level.correctWords.length,mode:state.level.mode},
      boatPosition:state.boatPosition,boatVelocity:state.boatVelocity,steering:state.steering,facing:state.facing,
      castAt:state.castAt,castPending:state.castPending,errorAt:state.errorAt,escapeAt:state.escapeAt,landedAt:state.landedAt,
      celebrationAt:state.celebrationAt,steerPulseUntil:state.steerPulseUntil,steerPulseDirection:state.steerPulseDirection,
      fish:state.fish,hook:state.hook,fight:state.fight,reeling:state.reeling,
      motorMisses:state.motorMisses,motorEscapes:state.motorEscapes,motorInterceptions:state.motorInterceptions,
      evidence:state.evidence,roundPendingAdvance:state.celebrating,scene:world.inspect(),cue:cue.inspect(),
      performance:{ warmupMs:2000,frames:summary(frameIntervals),inputToRenderedFrame:summary(inputIntervals),
        motorAim:{ throttleMs:REEL_READ_AIM_INTERVAL_SECONDS*1000,totalForecasts:aimForecastCount,
          costMs:summary(aimCosts),last:duplicate(lastAim) } } }); },
    destroy() { persist(false); disposed = true; releaseInputs(); cue.dispose(); dwell?.cancel(); cancelAnimationFrame(frameId);
      observer.disconnect(); world.dispose(); window.removeEventListener('keydown',onKeyDown); window.removeEventListener('keyup',onKeyUp);
      window.removeEventListener('blur',blur); document.removeEventListener('visibilitychange',hidden); window.removeEventListener('pagehide',pageHide); canvas.remove(); }
  };
}
