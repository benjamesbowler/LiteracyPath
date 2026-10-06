import { phonemeAudioCandidates } from '../data/phonemeAudioBank.js';
import { getLedaWordAudioPath } from '../data/ledaProductionAudio.js';
import { onsetGrapheme } from '../components/elQuest/elQuestEngine.js';

/** These are pronunciation keys for the existing printed couriers, never
 * replacements for their spellings. In particular voiced /th/ is not the
 * unvoiced target, and the first sound of qu is /k/, followed by /w/. */
export function rocketCourierOnsetCue(word) {
  const normalized = String(word || '').toLowerCase();
  if (normalized === 'that') return 'th_voiced';
  if (normalized === 'all') return 'aw';
  if (normalized.startsWith('qu')) return 'k';
  return onsetGrapheme(normalized);
}

/** Target and contrast recordings have one engine owner. Optional incoming
 * word models are cancelled first; the physical flight remains available.
 * Promise settlement is deliberately not evidence of delivery. */
export function createRocketTeachingCue({ getState, getPlan, speakPhoneme, speakWord,
  getSound = () => true, cancelApproach = () => {}, onSupport = () => {},
  onEvent = () => {}, onStatus = () => {} }) {
  let owner = null, disposed = false, lastEvent = null;
  const publish = event => {
    lastEvent = structuredClone(event);
    try { onEvent(structuredClone(event)); } catch { /* observation cannot own audio */ }
  };
  const status = value => {
    try { onStatus(structuredClone(value)); } catch { /* a HUD callback cannot strand ownership */ }
  };
  const live = token => {
    const state = getState(), plan = getPlan();
    return !disposed && owner === token && !token.controller.signal.aborted
      && state && plan && !state.paused && (!state.completed || token.allowCompleted) && !state.flight.stopped
      && getSound() && state.seed === token.seed && state.round === token.round
      && plan.target === token.target;
  };
  function cancel(reason = 'cancelled') {
    const prior = owner;
    owner = null;
    if (!prior) return;
    prior.controller.abort();
    publish({ type: 'teaching-cancel', reason, round: prior.round, target: prior.target });
    status({ kind: 'cancelled', reason, round: prior.round, target: prior.target });
  }
  async function playStep(token, step) {
    if (!live(token)) return false;
    const sources = step.kind === 'word' ? [getLedaWordAudioPath(step.value)].filter(Boolean)
      : phonemeAudioCandidates(step.value);
    if (!sources.length) {
      publish({ type: 'teaching-unavailable', round: token.round, role: step.role, value: step.value });
      return live(token);
    }
    let started = false, delivered = false;
    const options = {
      signal: token.controller.signal,
      onStart() {
        if (!live(token) || started) return;
        started = true;
        publish({ type: 'teaching-start', round: token.round, target: token.target,
          role: step.role, value: step.value, at: getState().foregroundElapsed });
      },
      onEnd(src) {
        if (!live(token) || delivered || !sources.includes(src)) return;
        delivered = true;
        const state = getState();
        const event = { type: 'teaching-end', round: token.round, target: token.target,
          role: step.role, value: step.value, src, at: state.foregroundElapsed };
        if (step.role === 'target') {
          const receipt = { round: token.round, target: token.target, kind: 'target-phoneme',
            src, at: state.foregroundElapsed };
          state.evidence.audioReceipts.push(receipt);
          state.activeTargetReceipt = structuredClone(receipt);
        }
        publish(event);
      },
    };
    status({ kind: 'playing', role: step.role, value: step.value, round: token.round });
    try {
      await (step.kind === 'word' ? speakWord(step.value, options) : speakPhoneme(step.value, options));
    } catch {
      if (live(token)) publish({ type: 'teaching-failed', round: token.round,
        role: step.role, value: step.value });
    }
    if (live(token) && !delivered) publish({ type: 'teaching-not-delivered', round: token.round,
      role: step.role, value: step.value });
    return live(token);
  }
  function begin(steps, { reason = 'target', support = null, allowCompleted = false } = {}) {
    cancel('replaced');
    cancelApproach(reason, { replayOnResume: true });
    const state = getState(), plan = getPlan();
    if (disposed || !state || !plan || state.paused || (state.completed && !allowCompleted) || state.flight.stopped) return false;
    if (support) onSupport(support);
    if (!getSound()) {
      status({ kind: 'muted', round: plan.round, target: plan.target });
      publish({ type: 'teaching-muted', round: plan.round, target: plan.target, reason });
      return false;
    }
    const token = { round: plan.round, seed: state.seed, target: plan.target,
      controller: new AbortController(), steps: structuredClone(steps), reason, allowCompleted };
    owner = token;
    void (async () => {
      for (const step of steps) if (!await playStep(token, step)) return;
    })().finally(() => {
      if (owner !== token) return;
      owner = null;
      status({ kind: 'settled', round: token.round, target: token.target });
    });
    return true;
  }
  return {
    target({ replay = false } = {}) {
      const target = getPlan()?.target;
      return target ? begin([{ kind: 'phoneme', role: 'target', value: target }], {
        reason: replay ? 'target-replay' : 'target', support: replay ? 'target-replay' : null,
      }) : false;
    },
    contrast(word) {
      const target = getPlan()?.target;
      if (!target) return false;
      return begin([
        { kind: 'word', role: 'selected-word', value: word },
        { kind: 'phoneme', role: 'selected-onset', value: rocketCourierOnsetCue(word) },
        { kind: 'phoneme', role: 'target', value: target },
      ], { reason: 'wrong-onset', support: 'contrast-feedback' });
    },
    reinforce(word) {
      // The final accepted courier can be named during its actual reward.
      // This optional post-response end is observation only: it cannot alter
      // the immutable response's before-response delivery or model context.
      return begin([{ kind: 'word', role: 'accepted-word', value: word }], {
        reason: 'accepted-word', allowCompleted: true,
      });
    },
    cancel,
    sync() {
      if (owner && !live(owner)) cancel('suspended');
    },
    busy: () => Boolean(owner),
    inspect: () => ({ disposed, owner: owner && { round: owner.round, target: owner.target,
      reason: owner.reason, steps: structuredClone(owner.steps) }, lastEvent: lastEvent && structuredClone(lastEvent) }),
    dispose() { if (!disposed) { cancel('unmount'); disposed = true; } },
  };
}
