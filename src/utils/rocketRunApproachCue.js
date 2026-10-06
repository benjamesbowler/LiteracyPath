import { getLedaWordAudioPath } from '../data/ledaProductionAudio.js';
import { rocketCueLead } from '../components/learn/games/shared/rocketApproach.js';
import { ROCKET_COURIER_CONTACT_Z } from './rocketRunCourierSimulation.js';

/** Optional word models belong to an actual near-rocket carrier, not its
 * spawn or a timer. The production speech functions are injected so this
 * lifecycle can be checked without replacing their real onStart/onEnd path.
 * Target replay/contrast may preempt the model; steering is never locked. */
export function createRocketApproachCue({ getState, getPlan, speakWord, wordDuration,
  getSound = () => true, getBlocked = () => false, getSpeed = null, setHighlight = () => {}, onEvent = () => {} }) {
  let owner = null, disposed = false, lastEvent = null, lastSpeed = null;
  const notify = event => {
    lastEvent = structuredClone(event);
    try { onEvent(structuredClone(event)); } catch { /* observation cannot own playback */ }
  };
  const live = token => {
    const state = getState(), plan = getPlan();
    return !disposed && owner === token && !token.controller.signal.aborted
      && state && plan && !state.paused && !state.completed && !state.flight.stopped
      && getSound() && !getBlocked() && state.seed === token.seed
      && state.round === token.round && plan.target === token.target
      && state.carriers.some(row => row.flightId === token.flightId && row.trialId === token.trialId
        && row.alive && !row.passed && row.z < ROCKET_COURIER_CONTACT_Z && row.visible === true && row.readable === true);
  };
  const physicalAtCallback = token => {
    const carrier = getState()?.carriers.find(row => row.flightId === token.flightId && row.trialId === token.trialId);
    let speed = lastSpeed;
    try { if (getSpeed) speed = getSpeed(); } catch { return null; }
    if (!carrier || !Number.isFinite(speed) || speed <= 0) return null;
    return { z: carrier.z, speed, ttc: (ROCKET_COURIER_CONTACT_Z - carrier.z) / speed,
      lane: carrier.lane ?? null, visible: carrier.visible === true, readable: carrier.readable === true };
  };
  function cancel(reason = 'cancelled', { replayOnResume = false } = {}) {
    const prior = owner;
    owner = null;
    setHighlight(null);
    if (!prior) return;
    if (replayOnResume) {
      const carrier = getState()?.carriers.find(row => row.flightId === prior.flightId && row.alive && !row.passed);
      if (carrier) carrier.approachSpoken = false;
    }
    prior.controller.abort();
    notify({ type: 'approach-cancel', reason, round: prior.round, flightId: prior.flightId,
      trialId: prior.trialId, word: prior.word, src: prior.src });
  }
  function sync(speed) {
    if (disposed) return;
    lastSpeed = speed;
    const state = getState(), plan = getPlan();
    if (!state || !plan || state.paused || state.completed || state.flight.stopped || !getSound() || getBlocked()) {
      cancel('suspended', { replayOnResume: true }); return;
    }
    if (owner && !live(owner)) cancel('carrier-expired');
    if (owner || !Number.isFinite(speed) || speed <= 0) return;
    const candidate = state.carriers.filter(row => row.alive && !row.passed && row.visible && row.readable && !row.approachSpoken)
      .map(carrier => ({ carrier, ttc: (ROCKET_COURIER_CONTACT_Z - carrier.z) / speed,
        duration: Math.max(.4, Number(wordDuration(carrier.word)) || .8) }))
      .filter(row => row.ttc > 0 && row.ttc <= rocketCueLead(row.duration))
      .sort((left, right) => left.ttc - right.ttc)[0];
    if (!candidate) return;
    const carrier = candidate.carrier, src = getLedaWordAudioPath(carrier.word);
    carrier.approachSpoken = true;
    if (!src) {
      notify({ type: 'approach-unavailable', round: plan.round, trialId: carrier.trialId,
        flightId: carrier.flightId, word: carrier.word, at: state.foregroundElapsed });
      return;
    }
    const token = { round: plan.round, seed: state.seed, target: plan.target, trialId: carrier.trialId, flightId: carrier.flightId,
      word: carrier.word, src, controller: new AbortController(), ttc: candidate.ttc, speed };
    owner = token;
    notify({ type: 'approach-request', round: token.round, trialId: token.trialId, flightId: token.flightId,
      word: token.word, src, z: carrier.z, speed, ttc: candidate.ttc, at: state.foregroundElapsed });
    let playback;
    try {
      playback = speakWord(carrier.word, {
        signal: token.controller.signal,
        onStart: () => {
          if (!live(token) || token.started) return;
          token.started = true;
          const current = getState();
          const receipt = { round: token.round, trialId: token.trialId, flightId: token.flightId,
            word: token.word, kind: 'approach-word', src: token.src, at: current.foregroundElapsed,
            physicalApproach: physicalAtCallback(token) };
          current.evidence.audioStarts.push(receipt);
          setHighlight(token.flightId);
          notify({ type: 'approach-start', ...receipt });
        },
        onEnd: deliveredSrc => {
          if (!live(token) || deliveredSrc !== token.src || token.ended) return;
          token.ended = true;
          const current = getState();
          const receipt = { round: token.round, trialId: token.trialId, flightId: token.flightId,
            word: token.word, kind: 'approach-word', src: deliveredSrc, at: current.foregroundElapsed,
            physicalApproach: physicalAtCallback(token) };
          current.evidence.audioReceipts.push(receipt);
          notify({ type: 'approach-end', ...receipt });
        },
      });
    } catch {
      cancel('playback-error'); return;
    }
    void Promise.resolve(playback).catch(() => {
      if (owner === token) notify({ type: 'approach-failed', round: token.round, trialId: token.trialId,
        flightId: token.flightId, word: token.word, src: token.src });
    }).finally(() => {
      if (owner !== token) return;
      owner = null; setHighlight(null);
    });
  }
  return {
    sync, cancel,
    inspect: () => ({ disposed, owner: owner && { round: owner.round, trialId: owner.trialId,
      flightId: owner.flightId, word: owner.word, src: owner.src, ttc: owner.ttc, speed: owner.speed },
    lastEvent: lastEvent && structuredClone(lastEvent) }),
    dispose() { if (!disposed) { cancel('unmount'); disposed = true; } },
  };
}
