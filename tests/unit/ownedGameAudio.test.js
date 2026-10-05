import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { playOwnedClip } from '../../src/utils/audio/playOwnedClip.js';
import { rocketWordSpeed, rocketCueLead, rocketWordSpacing } from '../../src/components/learn/games/shared/rocketApproach.js';

function actualAudioModule(relativePath, imports, exports) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
    .replace(/^import[\s\S]*?from\s+["'][^"']+["'];\s*/gm, '')
    .replace(/export (?=(?:async )?function)/g, '');
  return new Function(...Object.keys(imports), `${source}\nreturn {${exports.join(',')}};`)(...Object.values(imports));
}

class ScopedHowl {
  static instances = [];
  constructor({ src }) { this.src = src[0]; this.listeners = []; this.played = []; this.stopped = []; this.paused = []; ScopedHowl.instances.push(this); }
  state() { return 'loaded'; }
  duration() { return 1; }
  play(id = 7) { this.played.push(id); return id; }
  pause(id) { this.paused.push(id); }
  stop(id) { this.stopped.push(id); this.emit('stop', id); }
  unload() {}
  on(event, fn, id) { this.listeners.push({ event, fn, id, once: false }); }
  once(event, fn, id) { this.listeners.push({ event, fn, id, once: true }); }
  off(event, fn, id) { this.listeners = this.listeners.filter(item => item.event !== event || item.fn !== fn || (id !== undefined && item.id !== id)); }
  emit(event, id = 7) {
    for (const item of [...this.listeners]) if (item.event === event && (item.id === undefined || item.id === id)) {
      if (item.once) this.off(event, item.fn, item.id);
      item.fn(id);
    }
  }
}

function sharedSpeech(HowlType = ScopedHowl) {
  return actualAudioModule('../../src/utils/learnGamesAudio.js', {
    Howl: HowlType, Howler: { stop: () => assert.fail('a shared cue stopped unrelated engine recordings') }, playOwnedClip,
    hasKnownBadWordAudio: () => false, isKnownBadAudioPath: () => false,
    getLetterSoundCue: () => null, AUDIO_QUEST_PATHS: new Set(['/cat.mp3', '/dog.mp3', '/instruction.mp3']),
    phonemeAudioCandidates: () => [], getLedaWordAudioPath: word => `/${word}.mp3`,
    getLedaInstructionAudioPath: () => '/instruction.mp3'
  }, ['speakWord', 'speak', 'cancelSpeech', 'preloadWordAudio']);
}

test('a genuine failed shared load is retired after its owners settle and Hear obtains a fresh matching end', async t => {
  class LoadableHowl extends ScopedHowl {
    constructor(options) { super(options); this.loadingState = 'loading'; this.unloads = 0; }
    state() { return this.loadingState; }
    unload() { this.unloads++; this.listeners = []; }
  }
  const shared = sharedSpeech(LoadableHowl), delivered = [];
  t.after(() => shared.cancelSpeech());
  const failed = shared.speakWord('cat', { onEnd: src => delivered.push(src) });
  const original = ScopedHowl.instances.at(-1);
  original.emit('loaderror');
  assert.equal(original.unloads, 0, 'all current failure listeners must run before cleanup');
  await failed;
  assert.equal(original.unloads, 1); assert.deepEqual(delivered, []);
  const replay = shared.speakWord('cat', { onEnd: src => delivered.push(src) });
  const replacement = ScopedHowl.instances.at(-1); assert.notEqual(replacement, original);
  replacement.loadingState = 'loaded'; replacement.emit('load'); replacement.emit('play');
  original.emit('end'); assert.deepEqual(delivered, [], 'the retired recording cannot deliver');
  replacement.emit('end'); await replay;
  assert.deepEqual(delivered, ['/cat.mp3']); assert.equal(replacement.unloads, 0);
});

test('failed preloading cannot strand a later word cue in the cached loading state', async t => {
  class LoadableHowl extends ScopedHowl {
    constructor(options) { super(options); this.loadingState = 'loading'; this.unloads = 0; }
    state() { return this.loadingState; }
    unload() { this.unloads++; this.listeners = []; }
  }
  const shared = sharedSpeech(LoadableHowl), delivered = []; t.after(() => shared.cancelSpeech());
  shared.preloadWordAudio('cat'); const preload = ScopedHowl.instances.at(-1);
  preload.emit('loaderror');
  const heard = shared.speakWord('cat', { onEnd: src => delivered.push(src) }), replacement = ScopedHowl.instances.at(-1);
  assert.notEqual(replacement, preload);
  await Promise.resolve(); assert.equal(preload.unloads, 1); assert.equal(replacement.unloads, 0);
  replacement.loadingState = 'loaded'; replacement.emit('load'); replacement.emit('end');
  await heard; assert.deepEqual(delivered, ['/cat.mp3']);
});

test('aborting a healthy in-flight shared load retains its cache owner and suppresses stale playback', async t => {
  class LoadableHowl extends ScopedHowl {
    constructor(options) { super(options); this.loadingState = 'loading'; this.unloads = 0; }
    state() { return this.loadingState; }
    unload() { this.unloads++; this.listeners = []; }
  }
  const shared = sharedSpeech(LoadableHowl), firstOwner = new AbortController();
  t.after(() => shared.cancelSpeech());
  const first = shared.speakWord('cat', { signal: firstOwner.signal }), loading = ScopedHowl.instances.at(-1);
  firstOwner.abort(); await first;
  const replay = shared.speakWord('cat'); assert.equal(ScopedHowl.instances.at(-1), loading);
  loading.loadingState = 'loaded'; loading.emit('load');
  assert.equal(loading.played.length, 1, 'the aborted owner cannot start when loading finishes');
  loading.emit('end'); await replay; assert.equal(loading.unloads, 0);
});

test('actual shared speech cancellation preserves a paused engine sound ID and only stops its own Guide cue', async t => {
  const shared = sharedSpeech();
  const { createDrumTrailVoice } = actualAudioModule('../../src/utils/drumTrailVoice.js', {
    Howl: ScopedHowl, Howler: { _muted: false, volume: () => 1 }, playOwnedClip,
    isKnownBadAudioPath: () => false, duckGameMusic: () => {}, restoreGameMusic: () => {}
  }, ['createDrumTrailVoice']);
  const howl = new ScopedHowl({ src: ['/engine-word.mp3'] });
  const voice = createDrumTrailVoice({ makeHowl: () => howl });
  t.after(() => { voice.dispose(); shared.cancelSpeech(); });
  let ended = false;
  const owned = voice.play('/engine-word.mp3').then(result => { ended = true; return result; });
  howl.emit('play'); voice.pause();
  assert.deepEqual(howl.paused, [7]);
  const guide = shared.speak('Tap the matching picture.');
  const guideHowl = ScopedHowl.instances.at(-1);
  shared.cancelSpeech(); await guide;
  assert.deepEqual(guideHowl.stopped, [7], 'Guide abort owns only its recording ID');
  assert.deepEqual(howl.stopped, []); assert.equal(ended, false, 'the held recording remains unresolved');
  voice.resume(); assert.deepEqual(howl.played, [7, 7], 'resume continues the same sound ID');
  howl.emit('play'); howl.emit('end');
  assert.deepEqual(await owned, { status: 'delivered' });
});

test('actual shared default and caller-signalled cues retain separate cancellation owners', async t => {
  const shared = sharedSpeech(), caller = new AbortController();
  t.after(() => { shared.cancelSpeech(); caller.abort(); });
  const defaultCue = shared.speakWord('cat'), cat = ScopedHowl.instances.at(-1);
  const callerCue = shared.speakWord('dog', { signal: caller.signal }), dog = ScopedHowl.instances.at(-1);
  shared.cancelSpeech(); await defaultCue;
  assert.deepEqual(cat.stopped, [7]); assert.deepEqual(dog.stopped, []);
  caller.abort(); await callerCue;
  assert.deepEqual(dog.stopped, [7]);
});

function actualRacerCueHost(shared, gate) {
  const source = readFileSync(new URL('../../src/components/learn/games/games/SoundRacerGame.jsx', import.meta.url), 'utf8');
  const between = (start, end) => {
    const from = source.indexOf(start), to = source.indexOf(end, from);
    assert.ok(from >= 0 && to > from, `missing actual racer lifecycle ${start}`);
    return source.slice(from, to);
  };
  const clear = between('const clearControls = () => {', 'window.addEventListener("keydown", onKey);');
  const approach = between('if (obj.kind === "word" && !obj.spoken', 'if (distance <= CATCH_WINDOW)');
  const pause = between('function pause() {', 'let introActive = false;');
  const resume = between('function resume() {', 'const detachContextGuard = attachContextLossGuard');
  return new Function('speakWord', 'hasRecordedSpeech', 'gate', `
    let gateVoice = null, gateVoiceCarrier = null, paused = false, savedRunning = false, running = true, pausedFrameRendered = false, introActive = false, last = 0, steeringPulseT = 0;
    const heldSteering = new Map(), brakeHolds = new Set(), hud = { querySelectorAll: () => [] }, kart = { speed: 1 }, sfx = fn => fn();
    // This harness exercises cue ownership. Fixed-step reset behavior has its
    // own physics tests; newer racer pause/resume still requires its owner.
    const physicsClock = { reset() {} };
    ${clear}\n${pause}\n${resume}
    return { pause, resume, approach() { const obj = gate, distance = 1; ${approach} }, snapshot() { return { paused, carrier: gateVoiceCarrier, active: Boolean(gateVoice && !gateVoice.signal.aborted) }; } };
  `)(shared.speakWord, () => true, gate);
}

test('actual racer pause aborts its pending gate cue and only replays an interrupted unresolved word', async t => {
  const shared = sharedSpeech(), gate = { kind: 'word', word: 'cat', spoken: false, resolved: false };
  const racer = actualRacerCueHost(shared, gate);
  t.after(() => { racer.pause(); shared.cancelSpeech(); });
  racer.approach(); const howl = ScopedHowl.instances.at(-1); howl.emit('play');
  assert.equal(racer.snapshot().active, true);
  racer.pause();
  assert.deepEqual(howl.stopped, [7]); assert.equal(racer.snapshot().active, false);
  assert.equal(gate.spoken, false, 'an interrupted unresolved word is eligible for its cue on resume');
  racer.resume(); racer.approach();
  assert.deepEqual(howl.played, [7, 7]); howl.emit('play'); howl.emit('end');
  for (let i = 0; i < 6; i++) await Promise.resolve();
  assert.equal(racer.snapshot().active, false); assert.equal(racer.snapshot().carrier, null);
  racer.pause(); racer.resume(); racer.approach();
  assert.deepEqual(howl.played, [7, 7], 'an already completed cue does not replay just because Help was opened');
});

function recording(state = "loaded") {
  const listeners = new Map();
  return {
    stopped: [],
    state: () => state,
    play: () => 7,
    once(event, fn) { listeners.set(event, fn); },
    off(event, fn) { if (listeners.get(event) === fn) listeners.delete(event); },
    stop(id) { this.stopped.push(id); listeners.get('stop')?.(); },
    emit(event) { listeners.get(event)?.(); },
    get listenerCount() { return listeners.size; }
  };
}

test('aborting a playing word stops only its owned sound and cannot start a stale cue', async () => {
  const howl = recording();
  const controller = new AbortController();
  let starts = 0;
  const pending = playOwnedClip(howl, 'cat.mp3', { signal: controller.signal, onStart: () => starts++ });
  controller.abort();
  howl.emit('play');
  assert.equal(await pending, null);
  assert.deepEqual(howl.stopped, [7]);
  assert.equal(starts, 0);
  assert.equal(howl.listenerCount, 0);
});

test('highlight follows actual playback and releases the carrier after completion', async () => {
  const howl = recording();
  let starts = 0;
  const pending = playOwnedClip(howl, 'cat.mp3', { onStart: () => starts++ });
  assert.equal(starts, 0);
  howl.emit('play');
  assert.equal(starts, 1);
  howl.emit('end');
  assert.equal(await pending, 'cat.mp3');
  assert.equal(howl.listenerCount, 0);
});

test('delivery receipts observe only the owned real end, before the existing promise resolves', async () => {
  const howl = new ScopedHowl({ src: ['cat.mp3'] }), events = [];
  const pending = playOwnedClip(howl, 'cat.mp3', { onEnd: src => {
    events.push(src);
    assert.equal(howl.listeners.length, 0, 'terminal delivery has released every owned listener');
  } }).then(src => { events.push('resolved'); return src; });
  howl.emit('end', 9);
  assert.deepEqual(events, [], 'another sound ID cannot create a receipt');
  howl.emit('play', 7);
  assert.deepEqual(events, [], 'start does not prove the recording finished');
  howl.emit('end', 7);
  assert.deepEqual(events, ['cat.mp3']);
  assert.equal(await pending, 'cat.mp3');
  assert.deepEqual(events, ['cat.mp3', 'resolved']);
  howl.emit('end', 7);
  assert.equal(events.length, 2, 'late end cannot duplicate delivered evidence');
});

test('stopped, aborted, failed and timed-out cues never emit delivered receipts', async () => {
  for (const outcome of ['stop', 'abort', 'playerror', 'timeout']) {
    const howl = recording(), controller = new AbortController();
    const tasks = new Map(); let serial = 0, receipts = 0;
    const pending = playOwnedClip(howl, 'cat.mp3', {
      signal: controller.signal, onEnd: () => { receipts++; },
      schedule: (fn, ms) => { const id = ++serial; tasks.set(id, { fn, ms }); return id; },
      clear: id => tasks.delete(id)
    });
    const result = outcome === 'playerror' || outcome === 'timeout'
      ? assert.rejects(pending, /Unable to play/) : pending;
    if (outcome === 'abort') controller.abort();
    else if (outcome === 'timeout') [...tasks.values()][0].fn();
    else howl.emit(outcome);
    await result;
    howl.emit('end');
    assert.equal(receipts, 0, outcome);
    assert.equal(howl.listenerCount, 0, outcome);
    assert.equal(tasks.size, 0, outcome);
  }
});

test('shared word speech forwards a real delivery receipt and cancellation never fabricates one', async t => {
  const shared = sharedSpeech(), delivered = [];
  t.after(() => shared.cancelSpeech());
  const first = shared.speakWord('cat', { onEnd: src => delivered.push(src) });
  const cat = ScopedHowl.instances.at(-1);
  cat.emit('play'); cat.emit('end'); await first;
  assert.deepEqual(delivered, ['/cat.mp3']);
  const cancelled = shared.speakWord('dog', { onEnd: src => delivered.push(src) });
  const dog = ScopedHowl.instances.at(-1);
  shared.cancelSpeech(); dog.emit('end'); await cancelled;
  assert.deepEqual(delivered, ['/cat.mp3']);
});

test('a throwing receipt observer cannot prevent a real clip from settling or retain handlers', async () => {
  const howl = recording();
  const pending = playOwnedClip(howl, 'cat.mp3', { onEnd: () => { throw new Error('observer'); } });
  howl.emit('end');
  assert.equal(await pending, 'cat.mp3');
  assert.equal(howl.listenerCount, 0);
});

test('pre-aborted cues never enqueue playback', async () => {
  const controller = new AbortController();
  controller.abort();
  assert.equal(await playOwnedClip({ play() { assert.fail('queued stale cue'); } }, 'cat', { signal: controller.signal }), null);
});

test('boost speed cannot consume the word reading and approach speech window', () => {
  for (const duration of [0.4, 0.8, 1.2, 2]) {
    for (const requested of [8, 20, 45, 80]) {
      const speed = rocketWordSpeed(requested, duration);
      const lead = rocketCueLead(duration);
      assert.ok(40 / speed > lead + 1);
      assert.ok(lead >= duration);
      assert.ok(rocketWordSpacing(duration, 'hard') > lead);
    }
  }
});

test('aborting before load never enqueues a sound in Howler', async () => {
  const howl = recording('loading');
  howl.play = () => assert.fail('stale sound was enqueued');
  const controller = new AbortController();
  const pending = playOwnedClip(howl, 'cat.mp3', { signal: controller.signal });
  controller.abort();
  howl.emit('load');
  assert.equal(await pending, null);
  assert.deepEqual(howl.stopped, []);
  assert.equal(howl.listenerCount, 0);
});

test('a long recorded result ends naturally instead of using a fixed short timeout', async () => {
  const howl = recording(); howl.duration = () => 12;
  const tasks = new Map(); let serial = 0;
  const pending = playOwnedClip(howl, 'long-sentence.mp3', { schedule: (fn, ms) => { const id = ++serial; tasks.set(id, { fn, ms }); return id; }, clear: id => tasks.delete(id) });
  assert.deepEqual([...tasks.values()].map(task => task.ms), [14000]);
  howl.emit('end'); assert.equal(await pending, 'long-sentence.mp3'); assert.equal(tasks.size, 0);
});

test('missing end or load events report unavailable and release the owned voice', async () => {
  for (const state of ['loaded', 'loading']) {
    const howl = recording(state); howl.duration = () => 1;
    const tasks = new Map(); let serial = 0;
    const pending = playOwnedClip(howl, 'broken.mp3', { schedule: (fn, ms) => { const id = ++serial; tasks.set(id, { fn, ms }); return id; }, clear: id => tasks.delete(id) });
    const rejected = assert.rejects(pending, /Unable to play/);
    assert.equal([...tasks.values()][0].ms, state === 'loaded' ? 5000 : 15000);
    [...tasks.values()][0].fn(); await rejected; assert.equal(howl.listenerCount, 0); assert.equal(tasks.size, 0);
  }
});
